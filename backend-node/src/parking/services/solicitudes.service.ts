import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'
import { randomUUID } from 'crypto'
import { ParkingSolicitud }   from '../entities/parking-solicitud.entity'
import { ParkingVehiculo }    from '../entities/parking-vehiculo.entity'
import { ParkingAutorizacion } from '../entities/parking-autorizacion.entity'
import { ParkingHistorial }   from '../entities/parking-historial.entity'
import { ParkingDocumento }   from '../entities/parking-documento.entity'
import { ParkingPoliticaSede } from '../entities/parking-politica-sede.entity'
import {
  EstadoSolicitudParking,
  EstadoAutorizacionParking,
} from '../../common/enums/parking.enum'
import { CodigoGeneratorService } from './codigo-generator.service'
import {
  CreateSolicitudDto, UpdateSolicitudDto, AprobarSolicitudDto,
  DenegarSolicitudDto, SolicitarCorreccionDto, SuspenderSolicitudDto,
  RegenerarTokenDto, ListarSolicitudesDto, CompletarAutogestionDto,
} from '../dto/solicitud.dto'

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(ParkingSolicitud)
    private readonly solicitudRepo: Repository<ParkingSolicitud>,

    @InjectRepository(ParkingVehiculo)
    private readonly vehiculoRepo: Repository<ParkingVehiculo>,

    @InjectRepository(ParkingAutorizacion)
    private readonly autorizacionRepo: Repository<ParkingAutorizacion>,

    @InjectRepository(ParkingHistorial)
    private readonly historialRepo: Repository<ParkingHistorial>,

    @InjectRepository(ParkingDocumento)
    private readonly documentoRepo: Repository<ParkingDocumento>,

    @InjectRepository(ParkingPoliticaSede)
    private readonly politicaRepo: Repository<ParkingPoliticaSede>,

    private readonly dataSource: DataSource,
    private readonly codigoGenerator: CodigoGeneratorService,
  ) {}

  // ── Helpers ─────────────────────────────────────────────────────

  private async registrarHistorial(
    solicitudId: number | null,
    autorizacionId: number | null,
    usuarioId: number,
    evento: string,
    descripcion: string,
    estadoAnterior: string | null,
    estadoNuevo: string | null,
  ) {
    const h = this.historialRepo.create({
      solicitudId,
      autorizacionId,
      usuarioId,
      evento,
      descripcion,
      estadoAnterior,
      estadoNuevo,
      fechaHora: new Date(),
    })
    await this.historialRepo.save(h)
  }

  private mapSolicitudResumen(s: ParkingSolicitud) {
    const personaLinked = s.persona ? {
      id: s.persona.id,
      nombres: (s.persona as any).nombres,
      apellidos: (s.persona as any).apellidos,
      numero_documento: (s.persona as any).numeroDocumento ?? (s.persona as any).numero_documento,
    } : null

    return {
      id:                s.id,
      codigo:            s.codigo,
      placa:             s.placa,
      tipo_vehiculo:     s.tipoVehiculo,
      tipo_usuario:      s.tipoUsuario,
      estado:            s.estado,
      fecha_inicio:      s.fechaInicio,
      fecha_fin:         s.fechaFin,
      sede:              s.sede ? { id: s.sede.id, nombre: s.sede.nombre } : null,
      persona:           personaLinked,
      solicitante_nombre: s.solicitanteNombre,
      solicitante_cedula: s.solicitanteCedula,
      created_at:        s.created_at,
    }
  }

  private mapSolicitudDetalle(s: ParkingSolicitud) {
    return {
      ...this.mapSolicitudResumen(s),
      marca:                  s.marca,
      linea:                  s.linea,
      color:                  s.color,
      modelo_anio:            s.modeloAnio,
      horario_requerido:      s.horarioRequerido,
      dias_requeridos:        s.diasRequeridos ? JSON.parse(s.diasRequeridos) : null,
      motivo:                 s.motivo,
      observaciones_internas: s.observacionesInternas,
      motivo_denegacion:      s.motivoDenegacion,
      token_autogestion:      s.tokenAutogestion,
      token_expira_en:        s.tokenExpiraEn,
      autogestion_completada_en: s.autogestionCompletadaEn,
      aprobado_en:            s.aprobadoEn,
      creador:  s.creador  ? { id: s.creador.id,  nombre: `${(s.creador as any).nombreCompleto ?? ''}` } : null,
      aprobador: s.aprobador ? { id: s.aprobador.id, nombre: `${(s.aprobador as any).nombreCompleto ?? ''}` } : null,
      documentos: (s.documentos ?? []).map(d => ({
        id:               d.id,
        tipo_documento:   d.tipoDocumento,
        nombre_archivo:   d.nombreArchivo,
        ruta_archivo:     d.rutaArchivo,
        fecha_vencimiento: d.fechaVencimiento,
        estado:           d.estado,
      })),
      historial: (s.historial ?? []).map(h => ({
        id:              h.id,
        evento:          h.evento,
        descripcion:     h.descripcion,
        estado_anterior: h.estadoAnterior,
        estado_nuevo:    h.estadoNuevo,
        usuario:         h.usuario ? { id: h.usuario.id, nombre: `${(h.usuario as any).nombreCompleto ?? ''}` } : null,
        fecha_hora:      h.fechaHora,
      })),
      updated_at: s.updated_at,
    }
  }

  private async getSolicitudOrFail(id: number, relations: string[] = []) {
    const s = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['sede', 'persona', 'creador', 'aprobador', 'documentos', 'historial', 'historial.usuario', ...relations],
    })
    if (!s) throw new NotFoundException(`Solicitud #${id} no encontrada`)
    return s
  }

  // ── CRUD ────────────────────────────────────────────────────────

  async findAll(dto: ListarSolicitudesDto) {
    const page    = dto.page    ?? 1
    const perPage = dto.perPage ?? 20
    const skip    = (page - 1) * perPage

    const qb = this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.sede',   'sede')
      .leftJoinAndSelect('s.persona','persona')
      .skip(skip).take(perPage)
      .orderBy('s.created_at', 'DESC')

    if (dto.sedeId)    qb.andWhere('s.sedeId = :sedeId',     { sedeId: dto.sedeId })
    if (dto.estado)     qb.andWhere('s.estado = :estado',     { estado: dto.estado })
    if (dto.tipoUsuario) qb.andWhere('s.tipoUsuario = :tu',  { tu: dto.tipoUsuario })
    if (dto.tipoVehiculo) qb.andWhere('s.tipoVehiculo = :tv', { tv: dto.tipoVehiculo })
    if (dto.placa)      qb.andWhere('s.placa LIKE :placa',    { placa: `%${dto.placa.toUpperCase()}%` })
    if (dto.personaId) qb.andWhere('s.personaId = :pid',     { pid: dto.personaId })
    if (dto.fechaInicioDesde) qb.andWhere('s.fechaInicio >= :fid', { fid: dto.fechaInicioDesde })
    if (dto.fechaInicioHasta) qb.andWhere('s.fechaInicio <= :fih', { fih: dto.fechaInicioHasta })

    const [items, total] = await qb.getManyAndCount()

    return {
      items: items.map(s => this.mapSolicitudResumen(s)),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    }
  }

  async findOne(id: number) {
    const s = await this.getSolicitudOrFail(id)
    return this.mapSolicitudDetalle(s)
  }

  async create(dto: CreateSolicitudDto, usuarioId: number) {
    const codigo = await this.codigoGenerator.generarCodigoSolicitud()

    const solicitud = this.solicitudRepo.create({
      codigo,
      sedeId:            dto.sedeId,
      creadoPor:         usuarioId,
      tipoUsuario:       dto.tipoUsuario,
      tipoVehiculo:      dto.tipoVehiculo,
      placa:             dto.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      solicitanteNombre: dto.solicitanteNombre ?? null,
      solicitanteCedula: dto.solicitanteCedula ?? null,
      marca:             dto.marca ?? null,
      linea:             dto.linea ?? null,
      color:             dto.color ?? null,
      modeloAnio:        dto.modeloAnio ?? null,
      horarioRequerido:  dto.horarioRequerido ?? null,
      diasRequeridos:    dto.diasRequeridos ? JSON.stringify(dto.diasRequeridos) : null,
      fechaInicio:       new Date(dto.fechaInicio),
      fechaFin:          new Date(dto.fechaFin),
      motivo:            dto.motivo ?? null,
      estado:            EstadoSolicitudParking.BORRADOR,
    })

    await this.solicitudRepo.save(solicitud)
    await this.registrarHistorial(solicitud.id, null, usuarioId, 'CREADO', 'Solicitud creada por administrador', null, EstadoSolicitudParking.BORRADOR)

    return this.findOne(solicitud.id)
  }

  // ── Autogestión — la persona completa sus datos ─────────────────

  async completarAutogestion(solicitudId: number, dto: CompletarAutogestionDto) {
    const s = await this.getSolicitudOrFail(solicitudId)

    // Actualizar datos del vehículo
    s.marca            = dto.marca
    s.linea            = dto.linea
    s.color            = dto.color
    s.modeloAnio       = dto.modeloAnio ?? null
    s.horarioRequerido = dto.horarioRequerido
    s.diasRequeridos   = dto.diasRequeridos ? JSON.stringify(dto.diasRequeridos) : null
    s.motivo           = dto.motivo

    // Actualizar datos del solicitante si los confirmó
    if (dto.nombres)   s.solicitanteNombre = dto.nombres
    if (dto.apellidos && s.solicitanteNombre) {
      s.solicitanteNombre = `${dto.nombres ?? s.solicitanteNombre} ${dto.apellidos}`
    }

    // Marcar autogestión como completada
    const estadoAnterior       = s.estado
    s.estado                   = EstadoSolicitudParking.AUTOGESTION_COMPLETADA
    s.autogestionCompletadaEn  = new Date()

    await this.solicitudRepo.save(s)
    await this.registrarHistorial(
      s.id, null, 0,
      'AUTOGESTION_COMPLETADA',
      'La persona completó su autogestión',
      estadoAnterior,
      EstadoSolicitudParking.AUTOGESTION_COMPLETADA,
    )

    return { success: true, mensaje: 'Autogestión completada. El equipo revisará tu solicitud pronto.' }
  }

  async iniciarAutogestion(solicitudId: number) {
    const s = await this.getSolicitudOrFail(solicitudId)

    if (s.estado === EstadoSolicitudParking.PENDIENTE_AUTOGESTION) {
      s.estado = EstadoSolicitudParking.AUTOGESTION_EN_PROGRESO
      await this.solicitudRepo.save(s)
      await this.registrarHistorial(
        s.id, null, 0,
        'AUTOGESTION_EN_PROGRESO',
        'La persona abrió el portal de autogestión',
        EstadoSolicitudParking.PENDIENTE_AUTOGESTION,
        EstadoSolicitudParking.AUTOGESTION_EN_PROGRESO,
      )
    }

    return {
      solicitud_id:       s.id,
      codigo:             s.codigo,
      sede:               s.sede ? { id: s.sede.id, nombre: s.sede.nombre } : null,
      tipo_usuario:       s.tipoUsuario,
      tipo_vehiculo:      s.tipoVehiculo,
      estado:             s.estado,
      fecha_inicio:       s.fechaInicio,
      fecha_fin:          s.fechaFin,
      placa:              s.placa,
      solicitante_nombre: s.solicitanteNombre,
      solicitante_cedula: s.solicitanteCedula,
      token_expira_en:    s.tokenExpiraEn,
    }
  }

  async update(id: number, dto: UpdateSolicitudDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.BORRADOR) {
      throw new BadRequestException('Solo se pueden modificar solicitudes en estado BORRADOR')
    }
    if (s.creadoPor !== usuarioId) {
      throw new ForbiddenException('Solo el creador puede modificar esta solicitud')
    }

    if (dto.tipoVehiculo)     s.tipoVehiculo     = dto.tipoVehiculo
    if (dto.placa)             s.placa            = dto.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (dto.marca)             s.marca            = dto.marca
    if (dto.linea)             s.linea            = dto.linea
    if (dto.color)             s.color            = dto.color
    if (dto.modeloAnio)       s.modeloAnio       = dto.modeloAnio
    if (dto.horarioRequerido) s.horarioRequerido = dto.horarioRequerido
    if (dto.diasRequeridos)   s.diasRequeridos   = JSON.stringify(dto.diasRequeridos)
    if (dto.fechaInicio)      s.fechaInicio      = new Date(dto.fechaInicio)
    if (dto.fechaFin)         s.fechaFin         = new Date(dto.fechaFin)
    if (dto.motivo)            s.motivo           = dto.motivo

    await this.solicitudRepo.save(s)
    return this.findOne(id)
  }

  async remove(id: number, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.BORRADOR) {
      throw new BadRequestException('Solo se pueden eliminar solicitudes en estado BORRADOR')
    }
    if (s.creadoPor !== usuarioId) {
      throw new ForbiddenException('Solo el creador puede eliminar esta solicitud')
    }

    await this.solicitudRepo.softRemove(s)
    return { message: 'Solicitud eliminada' }
  }

  // ── Máquina de estados ──────────────────────────────────────────

  async enviar(id: number, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.BORRADOR) {
      throw new BadRequestException(`La solicitud debe estar en BORRADOR para enviarse (estado actual: ${s.estado})`)
    }

    const token = randomUUID().replace(/-/g, '')
    const expira = new Date()
    expira.setHours(expira.getHours() + 72)

    s.tokenAutogestion = token
    s.tokenExpiraEn    = expira
    s.estado           = EstadoSolicitudParking.PENDIENTE_AUTOGESTION

    await this.solicitudRepo.save(s)
    await this.registrarHistorial(id, null, usuarioId, 'ENVIADO', 'Solicitud enviada a autogestión', EstadoSolicitudParking.BORRADOR, s.estado)

    return {
      estado:          s.estado,
      token_autogestion: s.tokenAutogestion,
      token_expira_en:   s.tokenExpiraEn,
      link_autogestion:  `/portal/parking/${token}`,
    }
  }

  async regenerarToken(id: number, dto: RegenerarTokenDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    const estadosValidos = [
      EstadoSolicitudParking.PENDIENTE_AUTOGESTION,
      EstadoSolicitudParking.AUTOGESTION_EN_PROGRESO,
    ]
    if (!estadosValidos.includes(s.estado)) {
      throw new BadRequestException('Solo se puede regenerar el token en estados PENDIENTE_AUTOGESTION o AUTOGESTION_EN_PROGRESO')
    }

    const horas  = dto.duracionHoras ?? 72
    const token  = randomUUID().replace(/-/g, '')
    const expira = new Date()
    expira.setHours(expira.getHours() + horas)

    s.tokenAutogestion = token
    s.tokenExpiraEn    = expira
    await this.solicitudRepo.save(s)

    await this.registrarHistorial(id, null, usuarioId, 'TOKEN_REGENERADO', `Token regenerado por ${horas} horas`, null, null)

    return {
      estado:          s.estado,
      token_autogestion: s.tokenAutogestion,
      token_expira_en:   s.tokenExpiraEn,
      link_autogestion:  `/portal/parking/${token}`,
    }
  }

  async tomar(id: number, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.AUTOGESTION_COMPLETADA) {
      throw new BadRequestException(`La solicitud debe estar en AUTOGESTION_COMPLETADA para tomarse (estado: ${s.estado})`)
    }

    const estadoAnterior = s.estado
    s.estado = EstadoSolicitudParking.EN_REVISION
    await this.solicitudRepo.save(s)
    await this.registrarHistorial(id, null, usuarioId, 'EN_REVISION', 'Solicitud tomada para revisión', estadoAnterior, s.estado)

    return this.findOne(id)
  }

  async aprobar(id: number, dto: AprobarSolicitudDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.EN_REVISION) {
      throw new BadRequestException(`La solicitud debe estar EN_REVISION para aprobarla (estado: ${s.estado})`)
    }

    // Validar unicidad de placa activa en la misma sede y período
    const conflicto = await this.autorizacionRepo
      .createQueryBuilder('a')
      .innerJoin('a.vehiculo', 'v')
      .where('v.placa = :placa', { placa: s.placa })
      .andWhere('a.sedeId = :sedeId', { sedeId: s.sedeId })
      .andWhere('a.estado = :estado', { estado: EstadoAutorizacionParking.ACTIVA })
      .andWhere('a.fechaInicio <= :fin',   { fin: s.fechaFin })
      .andWhere('a.fechaFin   >= :inicio', { inicio: s.fechaInicio })
      .getOne()

    if (conflicto) {
      throw new BadRequestException(
        `La placa ${s.placa} ya tiene una autorización activa en esta sede para el período solicitado (Autorización #${conflicto.id})`
      )
    }

    // Validar límite de vehículos por persona
    if (s.personaId) {
      const politica = await this.politicaRepo.findOne({ where: { sedeId: s.sedeId } })
      const maxPermitidos = politica?.maxVehiculosPorPersona ?? 1
      const activos = await this.autorizacionRepo.count({
        where: { personaId: s.personaId, sedeId: s.sedeId, estado: EstadoAutorizacionParking.ACTIVA },
      })
      if (activos >= maxPermitidos) {
        throw new BadRequestException(
          `La persona ya tiene ${activos} vehículo(s) autorizado(s) en esta sede. Máximo: ${maxPermitidos}`
        )
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Crear vehículo
      const vehiculo = manager.create(ParkingVehiculo, {
        solicitudId:  s.id,
        sedeId:       s.sedeId,
        personaId:    s.personaId,
        placa:        s.placa,
        marca:        s.marca ?? '',
        linea:        s.linea ?? '',
        color:        s.color ?? '',
        modeloAnio:   s.modeloAnio,
        tipoVehiculo: s.tipoVehiculo,
        activo:       true,
      })
      await manager.save(vehiculo)

      // Crear autorización
      const autorizacion = manager.create(ParkingAutorizacion, {
        solicitudId:    s.id,
        vehiculoId:     vehiculo.id,
        personaId:      s.personaId,
        sedeId:         s.sedeId,
        aprobadoPor:    usuarioId,
        tipoAutorizacion: dto.tipoAutorizacion,
        estado:         EstadoAutorizacionParking.ACTIVA,
        fechaInicio:    s.fechaInicio,
        fechaFin:       s.fechaFin,
        diasPermitidos: dto.diasPermitidos ? JSON.stringify(dto.diasPermitidos) : s.diasRequeridos,
        horarioInicio:  dto.horarioInicio ?? null,
        horarioFin:     dto.horarioFin    ?? null,
        cupoId:         dto.cupoId        ?? null,
        observaciones:  dto.observaciones  ?? null,
      })
      await manager.save(autorizacion)

      // Actualizar solicitud
      s.estado      = EstadoSolicitudParking.APROBADO
      s.aprobadoPor = usuarioId
      s.aprobadoEn  = new Date()
      if (dto.observaciones) s.observacionesInternas = dto.observaciones
      await manager.save(s)

      // Historial
      const h = manager.create(ParkingHistorial, {
        solicitudId: s.id, autorizacionId: autorizacion.id, usuarioId,
        evento: 'APROBADO', descripcion: 'Solicitud aprobada — autorización creada',
        estadoAnterior: EstadoSolicitudParking.EN_REVISION, estadoNuevo: EstadoSolicitudParking.APROBADO,
        fechaHora: new Date(),
      })
      await manager.save(h)

      return {
        solicitud:    { id: s.id, estado: s.estado },
        autorizacion: {
          id:               autorizacion.id,
          tipo_autorizacion: autorizacion.tipoAutorizacion,
          estado:            autorizacion.estado,
          fecha_inicio:      autorizacion.fechaInicio,
          fecha_fin:         autorizacion.fechaFin,
        },
      }
    })
  }

  async denegar(id: number, dto: DenegarSolicitudDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.EN_REVISION) {
      throw new BadRequestException(`La solicitud debe estar EN_REVISION para denegarla`)
    }

    const estadoAnterior = s.estado
    s.estado           = EstadoSolicitudParking.DENEGADO
    s.motivoDenegacion = dto.motivoDenegacion
    s.aprobadoPor      = usuarioId
    s.aprobadoEn       = new Date()
    await this.solicitudRepo.save(s)

    await this.registrarHistorial(id, null, usuarioId, 'DENEGADO', `Motivo: ${dto.motivoDenegacion}`, estadoAnterior, s.estado)
    return this.findOne(id)
  }

  async solicitarCorreccion(id: number, dto: SolicitarCorreccionDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.EN_REVISION) {
      throw new BadRequestException(`La solicitud debe estar EN_REVISION para solicitar corrección`)
    }

    const estadoAnterior       = s.estado
    s.estado                   = EstadoSolicitudParking.AUTOGESTION_EN_PROGRESO
    s.observacionesInternas    = dto.observaciones
    await this.solicitudRepo.save(s)

    await this.registrarHistorial(id, null, usuarioId, 'CORRECCION_SOLICITADA', dto.observaciones, estadoAnterior, s.estado)
    return this.findOne(id)
  }

  async suspender(id: number, dto: SuspenderSolicitudDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    if (s.estado !== EstadoSolicitudParking.APROBADO) {
      throw new BadRequestException(`Solo se pueden suspender solicitudes APROBADAS`)
    }

    // Suspender también la autorización activa
    await this.autorizacionRepo.update(
      { solicitudId: id, estado: EstadoAutorizacionParking.ACTIVA },
      { estado: EstadoAutorizacionParking.SUSPENDIDA },
    )

    const estadoAnterior = s.estado
    s.estado = EstadoSolicitudParking.SUSPENDIDO
    await this.solicitudRepo.save(s)

    await this.registrarHistorial(id, null, usuarioId, 'SUSPENDIDO', dto.motivo, estadoAnterior, s.estado)
    return this.findOne(id)
  }

  async revocar(id: number, dto: SuspenderSolicitudDto, usuarioId: number) {
    const s = await this.getSolicitudOrFail(id)

    const estadosValidos = [EstadoSolicitudParking.APROBADO, EstadoSolicitudParking.SUSPENDIDO]
    if (!estadosValidos.includes(s.estado)) {
      throw new BadRequestException(`Solo se pueden revocar solicitudes APROBADAS o SUSPENDIDAS`)
    }

    await this.autorizacionRepo.update(
      { solicitudId: id },
      { estado: EstadoAutorizacionParking.REVOCADA },
    )

    const estadoAnterior = s.estado
    s.estado = EstadoSolicitudParking.REVOCADO
    await this.solicitudRepo.save(s)

    await this.registrarHistorial(id, null, usuarioId, 'REVOCADO', dto.motivo, estadoAnterior, s.estado)
    return this.findOne(id)
  }
}
