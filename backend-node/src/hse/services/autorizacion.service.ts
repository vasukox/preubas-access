import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigTiemposContratista, TipoContratistaConfig } from '../../config-koaj/entities/config-tiempos-contratista.entity';
import { HseAutorizacion } from '../entities/hse-autorizacion.entity';
import { HseContratista } from '../entities/hse-contratista.entity';
import { HseHistorial } from '../entities/hse-historial.entity';
import { HseClasificacion } from '../entities/hse-clasificacion.entity';
import { HseSegSocial } from '../entities/hse-seg-social.entity';
import { HseCertificaciones } from '../entities/hse-certificaciones.entity';
import { HseExamenMedico } from '../entities/hse-examen-medico.entity';
import { CreateAutorizacionDto, UpdateAutorizacionDto, ChangeEstadoAutorizacionDto } from '../dto/autorizacion.dto';
import { CreateContratistaDto } from '../dto/contratista.dto';
import { CodigoGeneratorService } from './codigo-generator.service';
import { AutorizacionValidator } from '../validators/autorizacion.validator';
import { EstadoAutorizacion, EstadoContratista } from '../../common/enums/hse.enum';
import * as crypto from 'crypto';

@Injectable()
export class AutorizacionService {
  constructor(
    @InjectRepository(HseAutorizacion)
    private readonly autorizacionRepo: Repository<HseAutorizacion>,
    @InjectRepository(HseContratista)
    private readonly contratistaRepo: Repository<HseContratista>,
    @InjectRepository(HseHistorial)
    private readonly historialRepo: Repository<HseHistorial>,
    @InjectRepository(ConfigTiemposContratista)
    private readonly tiemposRepo: Repository<ConfigTiemposContratista>,
    private readonly codigoGenerator: CodigoGeneratorService,
    private readonly validator: AutorizacionValidator,
    private dataSource: DataSource,
  ) {}

  async findAll(sedeId: number, estado?: string, page = 1, perPage = 20) {
    await this.marcarAutorizacionesVencidas(sedeId);

    const skip = (page - 1) * perPage;
    const whereClause: any = { sedeId };
    if (estado) {
      whereClause.estado = estado;
    }

    const [items, total] = await this.autorizacionRepo.findAndCount({
      where: whereClause,
      order: { created_at: 'DESC' },
      skip,
      take: perPage,
      relations: ['proveedor', 'creador', 'responsableInterno', 'contratistas'],
    });

    const itemsMapped = items.map(a => {
      const aprobados = a.contratistas ? a.contratistas.filter(c => c.estado === EstadoContratista.APROBADO).length : 0;
      const pendientes = a.contratistas ? a.contratistas.filter(c => c.estado !== EstadoContratista.APROBADO && c.estado !== EstadoContratista.DENEGADO).length : 0;
      return {
        ...a,
        totalContratistas: a.contratistas ? a.contratistas.length : 0,
        aprobados,
        pendientes,
      };
    });

    return { items: itemsMapped, total };
  }

  async findOne(id: number) {
    const autorizacion = await this.autorizacionRepo.findOne({
      where: { id },
      relations: ['proveedor', 'creador', 'responsableInterno', 'contratistas'],
    });

    if (!autorizacion) {
      throw new NotFoundException(`Autorización con ID ${id} no encontrada`);
    }

    await this.marcarVencidaSiAplica(autorizacion);
    return autorizacion;
  }

  async create(createDto: CreateAutorizacionDto, userId: number) {
    this.validator.validarFechas(createDto.fechaInicio, createDto.fechaFin);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const codigo = await this.codigoGenerator.generarCodigo();

      const autorizacion = this.autorizacionRepo.create({
        proveedorId: createDto.proveedorId,
        sedeId: createDto.sedeId,
        responsableInternoId: createDto.responsableInternoId,
        tipoContratista: createDto.tipoContratista,
        descripcionActividad: createDto.descripcionActividad,
        fechaInicio: this.toDateOnly(createDto.fechaInicio),
        fechaFin: this.toDateOnly(createDto.fechaFin),
        codigo,
        creadoPor: userId,
        estado: EstadoAutorizacion.BORRADOR,
      });

      const savedAutorizacion = await queryRunner.manager.save(autorizacion);

      if (createDto.contratistas && createDto.contratistas.length > 0) {
        const duracionHoras = await this.getTokenDuracionHoras(createDto.tipoContratista);
        const contratistas = createDto.contratistas.map(c =>
          this.contratistaRepo.create({
            personaId: c.personaId,
            tipoDocumento: c.tipoDocumento,
            numeroDocumento: c.numeroDocumento,
            nombres: c.nombres,
            apellidos: c.apellidos,
            email: c.email,
            telefono: c.telefono,
            esExtranjero: c.esExtranjero ?? false,
            sstResponsableNombre: c.sstResponsableNombre,
            sstResponsableTelefono: c.sstResponsableTelefono,
            autorizacionId: savedAutorizacion.id,
            estado: EstadoContratista.PENDIENTE_AUTOGESTION,
            tokenAutogestion: crypto.randomBytes(32).toString('hex'),
            tokenExpiraEn: new Date(Date.now() + duracionHoras * 60 * 60 * 1000),
            tokenDuracionHoras: duracionHoras,
          })
        );
        await queryRunner.manager.save(contratistas);
      }

      await queryRunner.commitTransaction();
      await this.sincronizarEstadoAutorizacion(savedAutorizacion.id);
      return this.findOne(savedAutorizacion.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateDto: UpdateAutorizacionDto) {
    const autorizacion = await this.findOne(id);

    if (updateDto.fechaInicio || updateDto.fechaFin) {
      const fInicio = updateDto.fechaInicio ?? String(autorizacion.fechaInicio);
      const fFin = updateDto.fechaFin ?? String(autorizacion.fechaFin);
      this.validator.validarFechas(fInicio, fFin);
    }

    await this.autorizacionRepo.update(id, {
      ...(updateDto.proveedorId !== undefined && { proveedorId: updateDto.proveedorId }),
      ...(updateDto.sedeId !== undefined && { sedeId: updateDto.sedeId }),
      ...(updateDto.responsableInternoId !== undefined && { responsableInternoId: updateDto.responsableInternoId }),
      ...(updateDto.tipoContratista !== undefined && { tipoContratista: updateDto.tipoContratista }),
      ...(updateDto.descripcionActividad !== undefined && { descripcionActividad: updateDto.descripcionActividad }),
      ...(updateDto.fechaInicio !== undefined && { fechaInicio: this.toDateOnly(updateDto.fechaInicio) }),
      ...(updateDto.fechaFin !== undefined && { fechaFin: this.toDateOnly(updateDto.fechaFin) }),
    });

    return this.findOne(id);
  }

  async delete(id: number) {
    const autorizacion = await this.findOne(id);
    await this.autorizacionRepo.remove(autorizacion);
    return { success: true, message: 'Autorización eliminada correctamente' };
  }

  async cambiarEstado(id: number, changeEstadoDto: ChangeEstadoAutorizacionDto) {
    const autorizacion = await this.autorizacionRepo.findOne({
      where: { id },
      relations: ['contratistas'],
    });
    if (!autorizacion) {
      throw new NotFoundException(`Autorizacion con ID ${id} no encontrada`);
    }

    this.validarCambioEstadoAutorizacion(autorizacion, changeEstadoDto.estado, changeEstadoDto.motivoDenegacion);

    autorizacion.estado = changeEstadoDto.estado;
    autorizacion.motivoDenegacion =
      changeEstadoDto.estado === EstadoAutorizacion.DENEGADO
        ? changeEstadoDto.motivoDenegacion ?? null
        : null;

    await this.autorizacionRepo.save(autorizacion);
    return autorizacion;
  }

  async getContratistas(autorizacionId: number) {
    await this.findOne(autorizacionId);

    return this.contratistaRepo.find({
      where: { autorizacionId },
      relations: ['persona'],
    });
  }

  async addContratistas(autorizacionId: number, contratistasDto: CreateContratistaDto[]) {
    await this.findOne(autorizacionId);

    const contratistas = contratistasDto.map(c =>
      this.contratistaRepo.create({
        personaId: c.personaId,
        tipoDocumento: c.tipoDocumento,
        numeroDocumento: c.numeroDocumento,
        nombres: c.nombres,
        apellidos: c.apellidos,
        email: c.email,
        telefono: c.telefono,
        esExtranjero: c.esExtranjero ?? false,
        sstResponsableNombre: c.sstResponsableNombre,
        sstResponsableTelefono: c.sstResponsableTelefono,
        autorizacionId,
        estado: EstadoContratista.PENDIENTE_AUTOGESTION,
      })
    );

    return this.contratistaRepo.save(contratistas);
  }

  async generarTokenContratista(contratistaId: number) {
    const contratista = await this.contratistaRepo.findOne({
      where: { id: contratistaId },
      relations: ['autorizacion'],
    });
    if (!contratista) {
      throw new NotFoundException(`Contratista con ID ${contratistaId} no encontrado`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const duracionHoras = await this.getTokenDuracionHoras(
      contratista.autorizacion?.tipoContratista,
    );
    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + duracionHoras);

    contratista.tokenAutogestion = token;
    contratista.tokenExpiraEn = expiraEn;
    contratista.tokenDuracionHoras = duracionHoras;

    await this.contratistaRepo.save(contratista);
    await this.sincronizarEstadoAutorizacion(contratista.autorizacionId);

    return { token, expiraEn, duracionHoras };
  }

  async findOneContratista(id: number) {
    const contratista = await this.contratistaRepo.findOne({
      where: { id },
      relations: [
        'persona',
        'autorizacion',
        'autorizacion.proveedor',
        'clasificacion',
        'seguridadSocial',
        'certificaciones',
        'examenMedico',
        'contactoEmergencia',
        'aceptacionNormas',
      ],
    });

    if (!contratista) {
      throw new NotFoundException(`Contratista con ID ${id} no encontrado`);
    }

    return contratista;
  }

  async aprobarContratista(id: number, usuarioId?: number) {
    const contratista = await this.findOneContratista(id);

    if (![EstadoContratista.AUTOGESTION_COMPLETADA, EstadoContratista.EN_REVISION].includes(contratista.estado)) {
      throw new BadRequestException(
        `Solo se puede aprobar un contratista con autogestion completada. Estado actual: ${contratista.estado}`,
      );
    }
    this.validarContratistaListoParaAprobar(contratista);

    await this.cambiarEstadoContratista(
      contratista,
      EstadoContratista.APROBADO,
      usuarioId,
      'Aprobado por HSE',
    );

    await this.sincronizarEstadoAutorizacion(contratista.autorizacionId);
    return this.findOneContratista(id);
  }

  async denegarContratista(id: number, motivo: string, usuarioId?: number) {
    const contratista = await this.findOneContratista(id);
    const motivoLimpio = motivo?.trim();

    if (!motivoLimpio) {
      throw new BadRequestException('El motivo de denegacion es obligatorio');
    }

    if (contratista.estado === EstadoContratista.APROBADO) {
      throw new BadRequestException('No se puede denegar un contratista ya aprobado');
    }

    contratista.motivoDenegacion = motivoLimpio;
    await this.cambiarEstadoContratista(
      contratista,
      EstadoContratista.DENEGADO,
      usuarioId,
      motivoLimpio,
    );

    await this.sincronizarEstadoAutorizacion(contratista.autorizacionId);
    return this.findOneContratista(id);
  }

  async eliminarContratista(id: number, motivo?: string, usuarioId?: number) {
    const contratista = await this.findOneContratista(id);
    const autorizacionId = contratista.autorizacionId;

    await this.registrarHistorial(
      contratista.id,
      contratista.estado,
      'ELIMINADO',
      usuarioId,
      motivo,
    );
    await this.contratistaRepo.softRemove(contratista);

    // Verificar si la autorización se quedó sin contratistas activos
    const contratistasRestantes = await this.contratistaRepo.count({
      where: { autorizacionId },
    });

    if (contratistasRestantes === 0) {
      // Sin contratistas → eliminar la autorización también
      await this.autorizacionRepo.softDelete(autorizacionId);
    } else {
      await this.sincronizarEstadoAutorizacion(autorizacionId);
    }

    return { success: true };
  }

  async actualizarProveedorContratista(id: number, proveedorId: number | null) {
    const contratista = await this.findOneContratista(id);
    if (!contratista.autorizacion) {
      throw new BadRequestException('El contratista no tiene una autorizacion asignada');
    }

    contratista.autorizacion.proveedorId = proveedorId;
    await this.autorizacionRepo.save(contratista.autorizacion);
    return this.findOneContratista(id);
  }

  async eliminarAdjuntoContratista(
    id: number,
    data: { modulo?: string; campo?: string; seg_social_id?: number },
  ) {
    await this.findOneContratista(id);
    const modulo = data?.modulo;
    const campo = data?.campo;
    if (!modulo || !campo) {
      throw new BadRequestException('Modulo y campo son obligatorios');
    }

    const config = this.getAdjuntoConfig(modulo, campo);
    if (modulo === 'seg_social') {
      if (!data.seg_social_id) {
        throw new BadRequestException('seg_social_id es obligatorio para seguridad social');
      }
      const repo = this.dataSource.getRepository(HseSegSocial);
      const item = await repo.findOne({ where: { id: data.seg_social_id, contratistaId: id } });
      if (!item) throw new NotFoundException('Adjunto de seguridad social no encontrado');
      (item as any)[config.property] = null;
      await repo.save(item);
      return this.findOneContratista(id);
    }

    const repo = this.dataSource.getRepository(config.entity as any);
    const record = await repo.findOne({ where: { contratistaId: id } });
    if (!record) throw new NotFoundException('Adjunto no encontrado');
    (record as any)[config.property] = null;
    await repo.save(record);
    return this.findOneContratista(id);
  }

  private validarCambioEstadoAutorizacion(
    autorizacion: HseAutorizacion,
    nuevoEstado: EstadoAutorizacion,
    motivoDenegacion?: string,
  ) {
    const contratistas = autorizacion.contratistas ?? [];

    if (nuevoEstado === EstadoAutorizacion.APROBADO) {
      if (contratistas.length === 0) {
        throw new BadRequestException('No se puede aprobar una autorizacion sin contratistas');
      }
      const noAprobados = contratistas.filter((c) => c.estado !== EstadoContratista.APROBADO);
      if (noAprobados.length > 0) {
        throw new BadRequestException('Todos los contratistas deben estar aprobados antes de aprobar la autorizacion');
      }
    }

    if (nuevoEstado === EstadoAutorizacion.DENEGADO && !motivoDenegacion?.trim()) {
      throw new BadRequestException('El motivo de denegacion es obligatorio');
    }
  }

  private getAdjuntoConfig(modulo: string, campo: string) {
    const configs: Record<string, Record<string, { entity: any; property: string }>> = {
      clasificacion: {
        alturas_cert_archivo: { entity: HseClasificacion, property: 'alturasCertArchivo' },
        confinados_cert_archivo: { entity: HseClasificacion, property: 'confinadosCertArchivo' },
        electrico_matricula_archivo: { entity: HseClasificacion, property: 'electricoMatriculaArchivo' },
        caliente_extintor_archivo: { entity: HseClasificacion, property: 'calienteExtintorArchivo' },
        caliente_permiso_archivo: { entity: HseClasificacion, property: 'calientePermisoArchivo' },
        izaje_inspeccion_archivo: { entity: HseClasificacion, property: 'izajeInspeccionArchivo' },
        izaje_doc_legal_archivo: { entity: HseClasificacion, property: 'izajeDocLegalArchivo' },
        izaje_licencia_archivo: { entity: HseClasificacion, property: 'izajeLicenciaArchivo' },
        extran_poliza_archivo: { entity: HseClasificacion, property: 'extranPolizaArchivo' },
        residuos_plan_archivo: { entity: HseClasificacion, property: 'residuosPlanArchivo' },
      },
      seg_social: {
        pila_archivo: { entity: HseSegSocial, property: 'pilaArchivo' },
      },
      certificaciones: {
        art_archivo: { entity: HseCertificaciones, property: 'artArchivo' },
        permiso_archivo: { entity: HseCertificaciones, property: 'permisoArchivo' },
      },
      examen: {
        archivo: { entity: HseExamenMedico, property: 'archivo' },
      },
    };

    const config = configs[modulo]?.[campo];
    if (!config) {
      throw new BadRequestException('Adjunto no permitido');
    }
    return config;
  }

  private validarContratistaListoParaAprobar(contratista: HseContratista) {
    const autorizacion = contratista.autorizacion;
    if (!autorizacion) {
      throw new BadRequestException('El contratista no tiene una autorizacion asignada');
    }

    if (this.estaFechaVencida(autorizacion.fechaFin)) {
      throw new BadRequestException('No se puede aprobar porque la autorizacion ya esta vencida');
    }

    if (!contratista.autogestionCompletadaEn) {
      throw new BadRequestException('El contratista no ha finalizado la autogestion');
    }

    if (!contratista.aceptacionNormas?.aceptoNormas || !contratista.aceptacionNormas?.aceptoDatos) {
      throw new BadRequestException('El contratista debe aceptar normas y tratamiento de datos');
    }

    if (!contratista.contactoEmergencia) {
      throw new BadRequestException('Falta contacto de emergencia');
    }

    if (!contratista.clasificacion) {
      throw new BadRequestException('Falta clasificacion de actividad');
    }

    if (autorizacion.tipoContratista === 'ALTO_RIESGO') {
      if (!contratista.certificaciones) {
        throw new BadRequestException('Los contratistas de alto riesgo deben adjuntar certificaciones/ART');
      }
      if (!contratista.seguridadSocial || contratista.seguridadSocial.length === 0) {
        throw new BadRequestException('Los contratistas de alto riesgo deben adjuntar seguridad social');
      }
      if (!contratista.examenMedico) {
        throw new BadRequestException('Los contratistas de alto riesgo requieren examen medico');
      }
    }
  }

  private async cambiarEstadoContratista(
    contratista: HseContratista,
    nuevoEstado: EstadoContratista,
    usuarioId?: number,
    motivo?: string,
  ) {
    const estadoAnterior = contratista.estado;
    if (estadoAnterior === nuevoEstado) {
      return;
    }

    contratista.estado = nuevoEstado;
    await this.contratistaRepo.save(contratista);
    await this.registrarHistorial(contratista.id, estadoAnterior, nuevoEstado, usuarioId, motivo);
  }

  private async registrarHistorial(
    contratistaId: number,
    estadoAnterior: string | null,
    estadoNuevo: string,
    usuarioId?: number,
    motivo?: string,
  ) {
    await this.historialRepo.save(
      this.historialRepo.create({
        contratistaId,
        usuarioId: usuarioId ?? null,
        estadoAnterior,
        estadoNuevo,
        motivo: motivo ?? null,
      }),
    );
  }

  private async sincronizarEstadoAutorizacion(autorizacionId: number) {
    const autorizacion = await this.autorizacionRepo.findOne({
      where: { id: autorizacionId },
      relations: ['contratistas'],
    });

    if (!autorizacion || autorizacion.estado === EstadoAutorizacion.VENCIDO) {
      return;
    }

    if (await this.marcarVencidaSiAplica(autorizacion)) {
      return;
    }

    const contratistas = autorizacion.contratistas ?? [];
    const nuevoEstado = this.calcularEstadoAutorizacion(contratistas);

    if (autorizacion.estado !== nuevoEstado) {
      autorizacion.estado = nuevoEstado;
      if (nuevoEstado !== EstadoAutorizacion.DENEGADO) {
        autorizacion.motivoDenegacion = null;
      }
      await this.autorizacionRepo.save(autorizacion);
    }
  }

  private calcularEstadoAutorizacion(contratistas: HseContratista[]): EstadoAutorizacion {
    if (contratistas.length === 0) {
      return EstadoAutorizacion.BORRADOR;
    }

    if (contratistas.every((c) => c.estado === EstadoContratista.APROBADO)) {
      return EstadoAutorizacion.APROBADO;
    }

    if (contratistas.every((c) => c.estado === EstadoContratista.DENEGADO)) {
      return EstadoAutorizacion.DENEGADO;
    }

    if (
      contratistas.some((c) =>
        [
          EstadoContratista.AUTOGESTION_COMPLETADA,
          EstadoContratista.EN_REVISION,
          EstadoContratista.APROBADO,
          EstadoContratista.DENEGADO,
        ].includes(c.estado),
      )
    ) {
      return EstadoAutorizacion.EN_REVISION;
    }

    return EstadoAutorizacion.PENDIENTE_AUTOGESTION;
  }

  private async marcarAutorizacionesVencidas(sedeId?: number) {
    const qb = this.autorizacionRepo.createQueryBuilder('autorizacion')
      .where('autorizacion.estado != :vencido', { vencido: EstadoAutorizacion.VENCIDO })
      .andWhere('autorizacion.fecha_fin < :hoy', { hoy: this.fechaHoyLocal() });

    if (sedeId) {
      qb.andWhere('autorizacion.sede_id = :sedeId', { sedeId });
    }

    const vencidas = await qb.getMany();
    for (const autorizacion of vencidas) {
      autorizacion.estado = EstadoAutorizacion.VENCIDO;
    }
    if (vencidas.length > 0) {
      await this.autorizacionRepo.save(vencidas);
    }
  }

  private async marcarVencidaSiAplica(autorizacion: HseAutorizacion) {
    if (autorizacion.estado !== EstadoAutorizacion.VENCIDO && this.estaFechaVencida(autorizacion.fechaFin)) {
      autorizacion.estado = EstadoAutorizacion.VENCIDO;
      await this.autorizacionRepo.save(autorizacion);
      return true;
    }
    return false;
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

  private toDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private async getTokenDuracionHoras(tipoContratista?: string): Promise<number> {
    const tipo = (tipoContratista as TipoContratistaConfig) ?? TipoContratistaConfig.NORMAL;
    const config = await this.tiemposRepo.findOne({ where: { tipoContratista: tipo } });
    return config?.tokenDuracionHoras ?? 72;
  }
}
