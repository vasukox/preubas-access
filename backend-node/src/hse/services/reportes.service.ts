import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { HseAcceso } from '../entities/hse-acceso.entity';
import { HseCumplimiento } from '../entities/hse-cumplimiento.entity';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import {
  CumplimientoEstado,
  EstadoAutorizacion,
  EstadoContratista,
} from '../../common/enums/hse.enum';

const PAGE_SIZE = 50;

const MESES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(HseAcceso)
    private readonly accesoRepo: Repository<HseAcceso>,
    @InjectRepository(HseCumplimiento)
    private readonly cumplimientoRepo: Repository<HseCumplimiento>,
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
  ) {}

  async getReporteAccesos(query: any) {
    const whereClause: any = {};
    const sedeId = query.sedeId ?? query.sede_id;
    const contratistaId = query.contratistaId ?? query.contratista_id;
    const fechaInicio = query.fechaInicio ?? query.fecha_inicio;
    const fechaFin = query.fechaFin ?? query.fecha_fin;

    if (sedeId) whereClause.sedeId = sedeId;
    if (contratistaId) whereClause.contratistaId = contratistaId;
    if (fechaInicio && fechaFin) {
      whereClause.fechaHora = Between(
        new Date(fechaInicio),
        new Date(fechaFin),
      );
    }

    const rows = await this.accesoRepo.find({
      where: whereClause,
      relations: ['contratista', 'sede', 'usuarioRegistro'],
      order: { fechaHora: 'DESC' },
      take: 500,
    });

    return rows.map((a) => ({
      id: a.id,
      contratistaId: a.contratistaId,
      contratistaNombre: a.contratista
        ? `${a.contratista.nombres} ${a.contratista.apellidos}`
        : null,
      contratistaDoc: a.contratista?.numeroDocumento ?? null,
      sedeId: a.sedeId,
      tipoAcceso: a.tipoAcceso,
      metodo: a.metodo,
      fechaHora: a.fechaHora,
      registradoPor: a.usuarioRegistro?.nombreCompleto ?? null,
      observacion: a.observacion ?? null,
    }));
  }

  async getReporteCumplimiento(query: any) {
    const sedeId = query.sedeId ?? query.sede_id;
    const fechaInicio = query.fechaInicio ?? query.fecha_inicio;
    const fechaFin = query.fechaFin ?? query.fecha_fin;
    const estado = query.estado as CumplimientoEstado | undefined;
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(200, parseInt(query.limit ?? String(PAGE_SIZE), 10));

    const qb = this.cumplimientoRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.contratista', 'contratista')
      .leftJoinAndSelect('c.encargado', 'encargado')
      .leftJoinAndSelect('contratista.autorizacion', 'autorizacion')
      .leftJoinAndSelect('c.items', 'items')
      .where('c.estado != :enProgreso', {
        enProgreso: CumplimientoEstado.EN_PROGRESO,
      });

    if (sedeId)
      qb.andWhere('c.sedeId = :sedeId', { sedeId: parseInt(sedeId, 10) });
    if (estado) qb.andWhere('c.estado = :estado', { estado });
    if (fechaInicio && fechaFin) {
      const fi = new Date(fechaInicio);
      fi.setHours(0, 0, 0, 0);
      const ff = new Date(fechaFin);
      ff.setHours(23, 59, 59, 999);
      qb.andWhere('c.fechaCierre BETWEEN :fi AND :ff', { fi, ff });
    }

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('c.fechaCierre', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = rows.map((c) => ({
      id: c.id,
      estado: c.estado,
      archivado: c.archivado,
      fechaInicio: c.fechaInicio,
      fechaCierre: c.fechaCierre,
      observacionGeneral: c.observacionGeneral ?? null,
      firmaDigital: c.firmaDigital ?? null,
      sedeId: c.sedeId,
      contratistaId: c.contratistaId,
      contratistaNombre: `${c.contratista.nombres} ${c.contratista.apellidos}`,
      tipoDocumento: c.contratista.tipoDocumento,
      numeroDocumento: c.contratista.numeroDocumento,
      autorizacionCodigo: c.contratista?.autorizacion?.codigo ?? null,
      encargadoNombre: c.encargado ? c.encargado.nombreCompleto : null,
      totalItems: c.items ? c.items.length : 0,
      itemsCumplen: c.items
        ? c.items.filter((i) => i.cumple === true).length
        : 0,
      itemsNosCumplen: c.items
        ? c.items.filter((i) => i.cumple === false).length
        : 0,
    }));

    return { total, page, limit, pages: Math.ceil(total / limit), data };
  }

  async getReporteVencimientos(sedeId?: number) {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    const qb = this.autorizacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.proveedor', 'proveedor')
      .leftJoinAndSelect('a.responsableInterno', 'responsable')
      .leftJoinAndSelect('a.contratistas', 'contratistas')
      .where('a.estado IN (:...estados)', {
        estados: [
          EstadoAutorizacion.APROBADO,
          EstadoAutorizacion.EN_REVISION,
          EstadoAutorizacion.PENDIENTE_AUTOGESTION,
        ],
      })
      .andWhere('a.fechaFin <= :limite', { limite: en30Dias });

    if (sedeId) qb.andWhere('a.sedeId = :sedeId', { sedeId });

    const items = await qb.orderBy('a.fechaFin', 'ASC').getMany();

    return items.map((a) => {
      const diasRestantes = Math.ceil(
        (new Date(a.fechaFin).getTime() - hoy.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return {
        id: a.id,
        codigo: a.codigo,
        estado: a.estado,
        tipoContratista: a.tipoContratista,
        fechaInicio: a.fechaInicio,
        fechaFin: a.fechaFin,
        diasRestantes,
        proveedor: a.proveedor?.nomProveedor ?? null,
        responsable: a.responsableInterno?.nombreCompleto ?? null,
        totalContratistas: a.contratistas?.length ?? 0,
        semaforo:
          diasRestantes < 0
            ? 'vencido'
            : diasRestantes <= 7
              ? 'critico'
              : diasRestantes <= 15
                ? 'advertencia'
                : 'ok',
      };
    });
  }

  async getReporteAutorizaciones(query: any) {
    const sedeId = query.sede_id ? parseInt(query.sede_id, 10) : undefined;
    const fechaInicio = query.fecha_inicio;
    const fechaFin = query.fecha_fin;
    const estado = query.estado;
    const tipoContratista = query.tipo_contratista;
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(200, parseInt(query.limit ?? String(PAGE_SIZE), 10));

    const qb = this.autorizacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.proveedor', 'proveedor')
      .leftJoinAndSelect('a.responsableInterno', 'responsable')
      .leftJoinAndSelect('a.contratistas', 'contratistas')
      .andWhere('LOWER(a.descripcionActividad) NOT LIKE :excepcion', {
        excepcion: 'excepcion hse:%',
      })
      .andWhere('LOWER(a.descripcionActividad) NOT LIKE :excepcionAcc', {
        excepcionAcc: 'excepción hse:%',
      });

    if (sedeId) qb.andWhere('a.sedeId = :sedeId', { sedeId });
    if (estado) qb.andWhere('a.estado = :estado', { estado });
    if (tipoContratista)
      qb.andWhere('a.tipoContratista = :tipo', { tipo: tipoContratista });
    if (fechaInicio && fechaFin) {
      const fi = new Date(fechaInicio);
      fi.setHours(0, 0, 0, 0);
      const ff = new Date(fechaFin);
      ff.setHours(23, 59, 59, 999);
      qb.andWhere('a.createdAt BETWEEN :fi AND :ff', { fi, ff });
    }

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = rows.map((a) => ({
      id: a.id,
      codigo: a.codigo,
      estado: a.estado,
      tipoContratista: a.tipoContratista,
      descripcionActividad: a.descripcionActividad,
      fechaInicio: a.fechaInicio,
      fechaFin: a.fechaFin,
      proveedor: a.proveedor?.nomProveedor ?? null,
      responsable: a.responsableInterno?.nombreCompleto ?? null,
      totalContratistas: a.contratistas?.length ?? 0,
      aprobados:
        a.contratistas?.filter((c) => c.estado === EstadoContratista.APROBADO)
          .length ?? 0,
      createdAt: (a as any).createdAt,
    }));

    return { total, page, limit, pages: Math.ceil(total / limit), data };
  }

  async getReporteContratistas(query: any) {
    const sedeId = query.sede_id ? parseInt(query.sede_id, 10) : undefined;
    const fechaInicio = query.fecha_inicio;
    const fechaFin = query.fecha_fin;
    const estado = query.estado;
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(200, parseInt(query.limit ?? String(PAGE_SIZE), 10));

    const qb = this.contratistaRepo
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.autorizacion', 'autorizacion')
      .leftJoinAndSelect('autorizacion.proveedor', 'proveedor');

    if (sedeId) qb.andWhere('autorizacion.sedeId = :sedeId', { sedeId });
    if (estado) qb.andWhere('c.estado = :estado', { estado });
    if (fechaInicio && fechaFin) {
      const fi = new Date(fechaInicio);
      fi.setHours(0, 0, 0, 0);
      const ff = new Date(fechaFin);
      ff.setHours(23, 59, 59, 999);
      qb.andWhere('c.createdAt BETWEEN :fi AND :ff', { fi, ff });
    }

    const total = await qb.getCount();
    const rows = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = rows.map((c) => ({
      id: c.id,
      nombres: c.nombres,
      apellidos: c.apellidos,
      tipoDocumento: c.tipoDocumento,
      numeroDocumento: c.numeroDocumento,
      email: c.email,
      estado: c.estado,
      tipoContratista: c.autorizacion?.tipoContratista ?? null,
      autorizacionCodigo: c.autorizacion?.codigo ?? null,
      proveedor: (c.autorizacion as any)?.proveedor?.nomProveedor ?? null,
      autogestionCompletadaEn: c.autogestionCompletadaEn ?? null,
      createdAt: (c as any).createdAt,
    }));

    return { total, page, limit, pages: Math.ceil(total / limit), data };
  }

  async getChartData(sedeId: number) {
    const ahora = new Date();

    // Últimos 6 meses
    const seisM = new Date(ahora);
    seisM.setMonth(seisM.getMonth() - 5);
    seisM.setDate(1);
    seisM.setHours(0, 0, 0, 0);

    // Últimos 7 días
    const sieteD = new Date(ahora);
    sieteD.setDate(sieteD.getDate() - 6);
    sieteD.setHours(0, 0, 0, 0);

    // 1. Autorizaciones por estado
    const porEstado = await this.autorizacionRepo
      .createQueryBuilder('a')
      .select('a.estado', 'estado')
      .addSelect('COUNT(*)', 'total')
      .where('a.sedeId = :sedeId', { sedeId })
      .groupBy('a.estado')
      .getRawMany();

    // 2. Tendencia mensual
    const tendencia = await this.autorizacionRepo
      .createQueryBuilder('a')
      .select("DATE_FORMAT(a.created_at, '%Y-%m')", 'mes')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN a.estado = 'APROBADO' THEN 1 ELSE 0 END)",
        'aprobadas',
      )
      .where('a.sedeId = :sedeId', { sedeId })
      .andWhere('a.created_at >= :desde', { desde: seisM })
      .groupBy("DATE_FORMAT(a.created_at, '%Y-%m')")
      .orderBy("DATE_FORMAT(a.created_at, '%Y-%m')", 'ASC')
      .getRawMany();

    // 3. Top proveedores
    const topProveedores = await this.contratistaRepo
      .createQueryBuilder('c')
      .innerJoin('c.autorizacion', 'a')
      .innerJoin('a.proveedor', 'p')
      .select('p.nom_proveedor', 'nombre')
      .addSelect('COUNT(c.id)', 'total')
      .where('a.sedeId = :sedeId', { sedeId })
      .groupBy('p.id')
      .orderBy('COUNT(c.id)', 'DESC')
      .limit(8)
      .getRawMany();

    // 4. Accesos últimos 7 días
    const accesos = await this.accesoRepo
      .createQueryBuilder('ac')
      .select('DATE(ac.fecha_hora)', 'dia')
      .addSelect(
        "SUM(CASE WHEN ac.tipo_acceso = 'ENTRADA' THEN 1 ELSE 0 END)",
        'entradas',
      )
      .addSelect(
        "SUM(CASE WHEN ac.tipo_acceso = 'SALIDA' THEN 1 ELSE 0 END)",
        'salidas',
      )
      .where('ac.sedeId = :sedeId', { sedeId })
      .andWhere('ac.fecha_hora >= :desde', { desde: sieteD })
      .groupBy('DATE(ac.fecha_hora)')
      .orderBy('DATE(ac.fecha_hora)', 'ASC')
      .getRawMany();

    // 5. Contratistas por estado
    const contratistasEstado = await this.contratistaRepo
      .createQueryBuilder('c')
      .innerJoin('c.autorizacion', 'a')
      .select('c.estado', 'estado')
      .addSelect('COUNT(c.id)', 'total')
      .where('a.sedeId = :sedeId', { sedeId })
      .groupBy('c.estado')
      .getRawMany();

    // 6. Tipo contratista
    const tipoContratista = await this.autorizacionRepo
      .createQueryBuilder('a')
      .select('a.tipo_contratista', 'tipo')
      .addSelect('COUNT(*)', 'total')
      .where('a.sedeId = :sedeId', { sedeId })
      .groupBy('a.tipo_contratista')
      .getRawMany();

    const ESTADO_AUT_LABEL: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE_AUTOGESTION: 'Pend. Autogestión',
      EN_REVISION: 'En Revisión',
      APROBADO: 'Aprobado',
      DENEGADO: 'Denegado',
      VENCIDO: 'Vencido',
    };
    const ESTADO_AUT_COLOR: Record<string, string> = {
      BORRADOR: '#94a3b8',
      PENDIENTE_AUTOGESTION: '#f59e0b',
      EN_REVISION: '#5668B8',
      APROBADO: '#22c55e',
      DENEGADO: '#ef4444',
      VENCIDO: '#dc2626',
    };
    const ESTADO_CON_LABEL: Record<string, string> = {
      PENDIENTE_AUTOGESTION: 'Pendiente',
      AUTOGESTION_EN_PROGRESO: 'En progreso',
      AUTOGESTION_COMPLETADA: 'Completada',
      EN_REVISION: 'En revisión',
      APROBADO: 'Aprobado',
      DENEGADO: 'Denegado',
    };
    const ESTADO_CON_COLOR: Record<string, string> = {
      PENDIENTE_AUTOGESTION: '#f59e0b',
      AUTOGESTION_EN_PROGRESO: '#5668B8',
      AUTOGESTION_COMPLETADA: '#8b5cf6',
      EN_REVISION: '#3b82f6',
      APROBADO: '#22c55e',
      DENEGADO: '#ef4444',
    };

    // Fill month gaps
    const tendenciaMap: Record<string, { total: number; aprobadas: number }> =
      {};
    tendencia.forEach((r) => {
      tendenciaMap[r.mes] = {
        total: parseInt(r.total),
        aprobadas: parseInt(r.aprobadas ?? 0),
      };
    });
    const tendenciaFull: {
      mes: string;
      autorizaciones: number;
      aprobadas: number;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MESES_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      const entry = tendenciaMap[key] ?? { total: 0, aprobadas: 0 };
      tendenciaFull.push({
        mes: label,
        autorizaciones: entry.total,
        aprobadas: entry.aprobadas,
      });
    }

    // Fill day gaps for accesos
    const accesosMap: Record<string, { entradas: number; salidas: number }> =
      {};
    accesos.forEach((r) => {
      accesosMap[r.dia] = {
        entradas: parseInt(r.entradas ?? 0),
        salidas: parseInt(r.salidas ?? 0),
      };
    });
    const accesosFull: { dia: string; entradas: number; salidas: number }[] =
      [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ahora);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${MESES_ES[d.getMonth()]} ${d.getDate()}`;
      const entry = accesosMap[key] ?? { entradas: 0, salidas: 0 };
      accesosFull.push({
        dia: label,
        entradas: entry.entradas,
        salidas: entry.salidas,
      });
    }

    return {
      autorizaciones_por_estado: porEstado
        .map((r) => ({
          name: ESTADO_AUT_LABEL[r.estado] ?? r.estado,
          value: parseInt(r.total),
          fill: ESTADO_AUT_COLOR[r.estado] ?? '#94a3b8',
        }))
        .filter((r) => r.value > 0),
      tendencia_mensual: tendenciaFull,
      top_proveedores: topProveedores.map((r) => ({
        nombre: r.nombre || 'Sin proveedor',
        total: parseInt(r.total),
      })),
      accesos_diarios: accesosFull,
      contratistas_por_estado: contratistasEstado
        .map((r) => ({
          name: ESTADO_CON_LABEL[r.estado] ?? r.estado,
          value: parseInt(r.total),
          fill: ESTADO_CON_COLOR[r.estado] ?? '#94a3b8',
        }))
        .filter((r) => r.value > 0),
      tipo_contratista: tipoContratista
        .map((r) => ({
          name: r.tipo === 'NORMAL' ? 'Normal' : 'Alto Riesgo',
          value: parseInt(r.total),
          fill: r.tipo === 'NORMAL' ? '#5668B8' : '#ef4444',
        }))
        .filter((r) => r.value > 0),
    };
  }
}
