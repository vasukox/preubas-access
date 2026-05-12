import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HseAcceso } from '../entities/hse-acceso.entity';
import { ValidacionService } from './validacion.service';
import { MetodoAcceso } from '../../common/enums/hse.enum';

@Injectable()
export class AccesoService {
  constructor(
    @InjectRepository(HseAcceso)
    private readonly accesoRepo: Repository<HseAcceso>,
    private readonly validacionService: ValidacionService,
  ) {}

  async registrarEntrada(
    contratistaId: number,
    sedeId: number,
    registradoPor: number,
    metodo?: string,
    observacion?: string,
    ubicacionId?: number,
  ) {
    await this.validacionService.validarAccesoPermitido(contratistaId);

    const ultimoAcceso = await this.accesoRepo.findOne({
      where: { contratistaId },
      order: { fechaHora: 'DESC' },
    });

    if (ultimoAcceso && ultimoAcceso.tipoAcceso === 'ENTRADA') {
      throw new BadRequestException('El contratista ya se encuentra dentro de las instalaciones');
    }

    const acceso = this.accesoRepo.create({
      contratistaId,
      sedeId,
      registradoPor,
      tipoAcceso: 'ENTRADA',
      metodo: this.normalizarMetodo(metodo),
      ubicacionId,
      fechaHora: new Date(),
      observacion,
    });

    return this.accesoRepo.save(acceso);
  }

  async registrarSalida(
    contratistaId: number,
    sedeId: number,
    registradoPor: number,
    metodo?: string,
    observacion?: string,
    ubicacionId?: number,
  ) {
    const ultimoAcceso = await this.accesoRepo.findOne({
      where: { contratistaId },
      order: { fechaHora: 'DESC' },
    });

    if (!ultimoAcceso || ultimoAcceso.tipoAcceso === 'SALIDA') {
      throw new BadRequestException('El contratista no tiene registro de entrada pendiente de salida');
    }

    if (ultimoAcceso.sedeId !== sedeId) {
      throw new BadRequestException('La entrada pendiente pertenece a otra sede');
    }

    const acceso = this.accesoRepo.create({
      contratistaId,
      sedeId,
      registradoPor,
      tipoAcceso: 'SALIDA',
      metodo: this.normalizarMetodo(metodo),
      ubicacionId,
      fechaHora: new Date(),
      observacion,
    });

    return this.accesoRepo.save(acceso);
  }

  async registrarAcceso(dto: any, registradoPor: number) {
    const { contratista_id, sede_id, tipo, metodo, observacion, ubicacion_id } = dto;
    if (tipo === 'ENTRADA') {
      return this.registrarEntrada(contratista_id, sede_id, registradoPor, metodo, observacion, ubicacion_id);
    } else {
      return this.registrarSalida(contratista_id, sede_id, registradoPor, metodo, observacion, ubicacion_id);
    }
  }

  async verificarAcceso(documento: string, sedeId: number) {
    return this.validacionService.obtenerEstadoAccesoPorDocumento(documento, sedeId);
  }

  async getHistorialSede(sedeId: number, limit = 50) {
    return this.accesoRepo.find({
      where: { sedeId },
      order: { fechaHora: 'DESC' },
      take: limit,
      relations: ['contratista', 'usuarioRegistro'],
    });
  }

  async getPersonasDentro(sedeId: number) {
    // Subquery: último acceso de cada contratista en la sede
    const latestAccessSubQuery = this.accesoRepo
      .createQueryBuilder('acceso_sub')
      .select('acceso_sub.contratista_id', 'contratistaId')
      .addSelect('MAX(acceso_sub.fecha_hora)', 'maxFechaHora')
      .where('acceso_sub.sede_id = :sedeId', { sedeId })
      .groupBy('acceso_sub.contratista_id');

    const rows = await this.accesoRepo
      .createQueryBuilder('acceso')
      .innerJoin('acceso.contratista', 'contratista')
      .innerJoin('contratista.autorizacion', 'autorizacion')
      .innerJoin(
        `(${latestAccessSubQuery.getQuery()})`,
        'ultimo',
        'ultimo.contratistaId = acceso.contratista_id AND ultimo.maxFechaHora = acceso.fecha_hora',
      )
      .setParameters(latestAccessSubQuery.getParameters())
      .where('acceso.sede_id = :sedeId', { sedeId })
      .andWhere('acceso.tipo = :tipo', { tipo: 'ENTRADA' })
      .select([
        'contratista.id AS contratistaId',
        "CONCAT(contratista.nombres, ' ', contratista.apellidos) AS nombre",
        'contratista.numero_documento AS numeroDocumento',
        'autorizacion.tipo_contratista AS tipoContratista',
        'acceso.fecha_hora AS horaEntrada',
      ])
      .orderBy('acceso.fecha_hora', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      const horaEntrada = new Date(row.horaEntrada);
      const minutosDentro = Math.max(
        0,
        Math.floor((Date.now() - horaEntrada.getTime()) / 60000),
      );

      return {
        contratistaId: Number(row.contratistaId),
        nombre: row.nombre,
        numeroDocumento: row.numeroDocumento,
        empresa: null,
        tipoContratista: row.tipoContratista,
        horaEntrada,
        minutosDentro,
        alertaTiempo: minutosDentro > 480,
      };
    });
  }

  private normalizarMetodo(metodo?: string): MetodoAcceso {
    return Object.values(MetodoAcceso).includes(metodo as MetodoAcceso)
      ? (metodo as MetodoAcceso)
      : MetodoAcceso.CEDULA_MANUAL;
  }
}
