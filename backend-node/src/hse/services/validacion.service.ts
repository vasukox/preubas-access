import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseExcepcion } from '../entities/hse-excepcion.entity';
import { HseAcceso } from '../entities/hse-acceso.entity';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import { EstadoAutorizacion, EstadoContratista, TipoContratista } from '../../common/enums/hse.enum';
import { Persona } from '../../persona/entities/persona.entity';
import { CodigoGeneratorService } from './codigo-generator.service';
import * as crypto from 'crypto';

const EXCEPCION_AUTORIZACION_RE = /^excepci[oó]n\s*hse\s*:/i;

@Injectable()
export class ValidacionService {
  constructor(
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseExcepcion)
    private readonly excepcionRepo: Repository<HseExcepcion>,
    @InjectRepository(HseAcceso)
    private readonly accesoRepo: Repository<HseAcceso>,
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
    private readonly codigoGenerator: CodigoGeneratorService,
  ) {}

  async validarAccesoPermitido(contratistaId: number): Promise<boolean> {
    const contratista = await this.contratistaRepo.findOne({
      where: { id: contratistaId },
      relations: ['autorizacion']
    });

    if (!contratista) {
      throw new BadRequestException('Contratista no encontrado');
    }

    const autorizacion = contratista.autorizacion;
    if (!autorizacion) {
      throw new BadRequestException('El contratista no tiene una autorización asignada');
    }

    const tieneExcepcionActiva = await this.tieneExcepcionActivaPorDocumento(
      contratista.numeroDocumento,
      autorizacion.sedeId,
    );

    // La excepción activa anula todos los chequeos de estado y fechas de la autorización
    if (tieneExcepcionActiva) {
      return true;
    }

    // Si la autorización fue generada por una excepción HSE pero ya no hay excepción activa, bloquear entrada
    if (this.esAutorizacionExcepcion(autorizacion.descripcionActividad)) {
      throw new BadRequestException(
        'La excepción HSE que autorizaba el acceso de este contratista ha sido desactivada o ha vencido. Contacte al encargado para reactivarla.',
      );
    }

    if (contratista.estado !== EstadoContratista.APROBADO) {
      throw new BadRequestException(`El contratista no está aprobado. Estado actual: ${contratista.estado}`);
    }

    if (autorizacion.estado !== EstadoAutorizacion.APROBADO) {
      throw new BadRequestException(`La autorización no está aprobada. Estado actual: ${autorizacion.estado}`);
    }

    if (this.estaFechaVencida(autorizacion.fechaFin)) {
      autorizacion.estado = EstadoAutorizacion.VENCIDO;
      await this.autorizacionRepo.save(autorizacion);
      throw new BadRequestException('La autorizacion esta vencida');
    }

    const hoy = this.fechaHoyLocal();
    const inicioStr = this.formatearFecha(autorizacion.fechaInicio);
    const finStr    = this.formatearFecha(autorizacion.fechaFin);

    if (hoy < inicioStr || hoy > finStr) {
      throw new BadRequestException(`La autorización no está vigente. Válida desde ${inicioStr} hasta ${finStr}`);
    }

    return true;
  }

  async obtenerEstadoAccesoPorDocumento(documento: string, sedeId: number) {
    const contratista = await this.buscarContratistaPorDocumentoYSede(documento, sedeId, false);

    if (!contratista) {
      const excepcion = await this.buscarExcepcionActiva(documento, sedeId);
      if (excepcion) {
        const contratistaExcepcion = await this.asegurarContratistaExcepcion(excepcion, documento, sedeId);

        const ultimoAcceso = await this.accesoRepo.findOne({
          where: { contratistaId: contratistaExcepcion.id, sedeId },
          order: { fechaHora: 'DESC' },
        });
        const dentroActualmente = ultimoAcceso?.tipoAcceso === 'ENTRADA';

        return {
          estado: 'EXCEPCION',
          color: 'blue',
          nombre: this.nombreCompleto(
            contratistaExcepcion.nombres,
            contratistaExcepcion.apellidos,
            excepcion.nombreCompleto,
          ),
          empresa: null,
          tipo_contratista: contratistaExcepcion.autorizacion?.tipoContratista ?? null,
          mensaje: 'Acceso permitido por excepcion activa',
          problemas: [],
          dentro_actualmente: dentroActualmente,
          ultima_entrada: dentroActualmente ? ultimoAcceso?.fechaHora ?? null : null,
          contratista_id: contratistaExcepcion.id,
          autorizacion_id: contratistaExcepcion.autorizacionId,
        };
      }

      return {
        estado: 'NO_REGISTRADO',
        color: 'gray',
        nombre: null,
        empresa: null,
        tipo_contratista: null,
        mensaje: 'Documento no encontrado. El contratista debe tramitar su autorización.',
        problemas: [],
        dentro_actualmente: false,
        ultima_entrada: null,
        contratista_id: null,
        autorizacion_id: null,
      };
    }

    // Verificar excepción activa incluso cuando el contratista ya existe
    const excepcionActiva = await this.buscarExcepcionActiva(documento, sedeId);

    const ultimoAcceso = await this.accesoRepo.findOne({
      where: { contratistaId: contratista.id, sedeId },
      order: { fechaHora: 'DESC' },
    });
    const dentroActualmente = ultimoAcceso?.tipoAcceso === 'ENTRADA';

    if (excepcionActiva) {
      return {
        estado: 'EXCEPCION',
        color: 'blue',
        nombre: `${contratista.nombres} ${contratista.apellidos}`.trim(),
        empresa: contratista.autorizacion?.proveedor?.nomProveedor ?? null,
        tipo_contratista: contratista.autorizacion?.tipoContratista ?? null,
        mensaje: 'Acceso permitido por excepcion activa',
        problemas: [],
        dentro_actualmente: dentroActualmente,
        ultima_entrada: dentroActualmente ? ultimoAcceso?.fechaHora ?? null : null,
        contratista_id: contratista.id,
        autorizacion_id: contratista.autorizacionId,
      };
    }

    let permitido = false;
    let mensaje = '';

    try {
      permitido = await this.validarAccesoPermitido(contratista.id);
      mensaje = 'Acceso permitido';
    } catch (e: any) {
      permitido = false;
      mensaje = e.message;
    }

    return {
      estado: permitido ? 'AUTORIZADO' : 'NO_AUTORIZADO',
      color: permitido ? 'green' : 'red',
      nombre: `${contratista.nombres} ${contratista.apellidos}`.trim(),
      empresa: contratista.autorizacion?.proveedor?.nomProveedor ?? null,
      tipo_contratista: contratista.autorizacion?.tipoContratista ?? null,
      mensaje,
      problemas: permitido ? [] : [mensaje],
      dentro_actualmente: dentroActualmente,
      ultima_entrada: dentroActualmente ? ultimoAcceso?.fechaHora ?? null : null,
      contratista_id: contratista.id,
      autorizacion_id: contratista.autorizacionId,
    };
  }

  private async buscarContratistaPorDocumentoYSede(documento: string, sedeId: number, soloAprobados: boolean) {
    const qb = this.contratistaRepo.createQueryBuilder('contratista')
      .leftJoinAndSelect('contratista.persona', 'persona')
      .innerJoinAndSelect('contratista.autorizacion', 'autorizacion')
      .leftJoinAndSelect('autorizacion.proveedor', 'proveedor')
      .where('(persona.numero_documento = :documento OR contratista.numero_documento = :documento)', { documento })
      .andWhere('autorizacion.sede_id = :sedeId', { sedeId })
      .andWhere('autorizacion.estado != :estado', { estado: EstadoAutorizacion.BORRADOR })
      .andWhere('contratista.deleted_at IS NULL')
      .andWhere('autorizacion.deleted_at IS NULL')
      .orderBy('autorizacion.fecha_fin', 'DESC');

    if (soloAprobados) {
      qb.andWhere('contratista.estado = :estadoContratista', { estadoContratista: EstadoContratista.APROBADO })
        .andWhere('autorizacion.estado = :estadoAutorizacion', { estadoAutorizacion: EstadoAutorizacion.APROBADO });
    }

    return qb.getOne();
  }

  private async buscarExcepcionActiva(documento: string, sedeId: number): Promise<HseExcepcion | null> {
    const hoy = this.fechaHoyLocal();
    const docNormalizado = this.normalizarDocumento(documento);

    // 1) Match directo por excepcion.numero_documento (modo empresa/lote)
    const porDocumento = await this.excepcionRepo
      .createQueryBuilder('excepcion')
      .where('excepcion.sede_id = :sedeId', { sedeId })
      .andWhere('excepcion.activa = 1')
      .andWhere('DATE(excepcion.fecha_fin) >= :hoy', { hoy })
      .andWhere('REPLACE(REPLACE(REPLACE(UPPER(excepcion.numero_documento), "-", ""), " ", ""), ".", "") = :docNormalizado', { docNormalizado })
      .orderBy('excepcion.fecha_fin', 'DESC')
      .getOne();

    if (porDocumento) return porDocumento;

    // 2) Fallback: buscar a través de la persona vinculada (modo individual)
    return this.excepcionRepo
      .createQueryBuilder('excepcion')
      .innerJoin('excepcion.persona', 'persona')
      .where('excepcion.sede_id = :sedeId', { sedeId })
      .andWhere('excepcion.activa = 1')
      .andWhere('DATE(excepcion.fecha_fin) >= :hoy', { hoy })
      .andWhere('REPLACE(REPLACE(REPLACE(UPPER(persona.numero_documento), "-", ""), " ", ""), ".", "") = :docNormalizado', { docNormalizado })
      .orderBy('excepcion.fecha_fin', 'DESC')
      .getOne();
  }

  private async tieneExcepcionActivaPorDocumento(documento: string, sedeId: number) {
    const excepcion = await this.buscarExcepcionActiva(documento, sedeId);
    return Boolean(excepcion);
  }

  private async asegurarContratistaExcepcion(excepcion: HseExcepcion, documento: string, sedeId: number): Promise<HseContratista> {
    const duracionHoras = 48;
    const tokenAutogestion = crypto.randomBytes(32).toString('hex');
    const tokenExpiraEn = new Date(Date.now() + duracionHoras * 60 * 60 * 1000);

    const existente = await this.buscarContratistaPorDocumentoYSede(documento, sedeId, false);
    if (existente) {
      let huboCambios = false;

      if (!existente.personaId && excepcion.personaId) {
        existente.personaId = excepcion.personaId;
        huboCambios = true;
      }

      if (existente.autorizacion && this.esAutorizacionExcepcion(existente.autorizacion.descripcionActividad)) {
        if (existente.autorizacion.estado !== EstadoAutorizacion.APROBADO) {
          existente.autorizacion.estado = EstadoAutorizacion.APROBADO;
          await this.autorizacionRepo.save(existente.autorizacion);
          huboCambios = true;
        }
        if (existente.estado !== EstadoContratista.APROBADO) {
          existente.estado = EstadoContratista.APROBADO;
          huboCambios = true;
        }
      }

      existente.tokenAutogestion = tokenAutogestion;
      existente.tokenExpiraEn = tokenExpiraEn;
      existente.tokenDuracionHoras = duracionHoras;
      huboCambios = true;

      if (huboCambios) {
        await this.contratistaRepo.save(existente);
      }

      
      return existente;
    }

    const persona = excepcion.personaId
      ? await this.personaRepo.findOne({ where: { id: excepcion.personaId } })
      : null;

    const [nombres, apellidos] = this.partirNombreCompleto(
      persona?.nombres,
      persona?.apellidos,
      excepcion.nombreCompleto,
    );
    const numeroDocumento = persona?.numeroDocumento ?? excepcion.numeroDocumento ?? documento;
    const tipoDocumento = this.tipoDocumentoValido(persona?.tipoDocumento ?? excepcion.tipoDocumento ?? 'CC');
    const email = (persona?.email ?? '').trim() || `excepcion.${numeroDocumento}@koaj.local`;

    const codigo = await this.codigoGenerator.generarCodigo();
    const descripcionBase = (excepcion.motivo ?? '').trim().replace(/\n/g, ' ');
    const descripcionActividad = `Excepción HSE: ${descripcionBase}`.slice(0, 500);

    const autorizacion = this.autorizacionRepo.create({
      codigo,
      proveedorId: persona?.proveedorId ?? excepcion.proveedorId ?? undefined,
      sedeId,
      creadoPor: excepcion.aprobadoPor,
      tipoContratista: TipoContratista.NORMAL,
      descripcionActividad,
      fechaInicio: excepcion.fechaInicio as any,
      fechaFin: excepcion.fechaFin as any,
      estado: EstadoAutorizacion.APROBADO,
    });
    const autorizacionCreada = await this.autorizacionRepo.save(autorizacion);

    const contratista = this.contratistaRepo.create({
      autorizacionId: autorizacionCreada.id,
      personaId: persona?.id ?? undefined,
      tipoDocumento: tipoDocumento as any,
      numeroDocumento,
      nombres,
      apellidos,
      email,
      telefono: persona?.telefonoCelular ?? undefined,
      esExtranjero: persona?.esExtranjero ?? false,
      estado: EstadoContratista.APROBADO,
      tokenAutogestion,
      tokenExpiraEn,
      tokenDuracionHoras: duracionHoras,
    });
    const contratistaCreado = await this.contratistaRepo.save(contratista);

    const recargado = await this.contratistaRepo.findOne({
      where: { id: contratistaCreado.id },
      relations: ['autorizacion'],
    });
    return recargado ?? contratistaCreado;
  }

  private esAutorizacionExcepcion(descripcionActividad?: string | null) {
    return EXCEPCION_AUTORIZACION_RE.test((descripcionActividad ?? '').trim());
  }

  private tipoDocumentoValido(tipo: string) {
    return ['CC', 'CE', 'PASAPORTE', 'TI'].includes(tipo) ? tipo : 'CC';
  }

  private partirNombreCompleto(nombres?: string | null, apellidos?: string | null, fallback?: string | null) {
    const n = (nombres ?? '').trim();
    const a = (apellidos ?? '').trim();
    if (n || a) {
      return [n || 'Sin nombre', a || 'N/A'];
    }

    const partes = (fallback ?? 'Excepcion HSE').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return ['Excepcion', 'HSE'];
    }
    if (partes.length === 1) {
      return [partes[0], 'HSE'];
    }
    return [partes.slice(0, -1).join(' '), partes[partes.length - 1]];
  }

  private nombreCompleto(nombres?: string | null, apellidos?: string | null, fallback?: string | null) {
    const full = `${nombres ?? ''} ${apellidos ?? ''}`.trim();
    return full || (fallback ?? null);
  }

  private formatearFecha(fecha: Date | string): string {
    if (!fecha) return '';
    if (fecha instanceof Date) {
      const y = fecha.getUTCFullYear();
      const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const d = String(fecha.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(fecha).slice(0, 10);
  }

  private estaFechaVencida(fecha: Date | string) {
    const str = this.formatearFecha(fecha);
    return str < this.fechaHoyLocal();
  }

  private fechaHoyLocal(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  }

  private normalizarDocumento(documento: string): string {
    if (!documento) return '';
    return String(documento).toUpperCase().replace(/[\-\.\s]/g, '');
  }
}
