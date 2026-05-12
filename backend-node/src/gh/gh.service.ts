import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { randomBytes } from 'crypto';

import { GhCita } from './entities/gh-cita.entity';
import { GhCandidato } from './entities/gh-candidato.entity';
import { GhPortalToken } from './entities/gh-portal-token.entity';
import { GhAuditoria } from './entities/gh-auditoria.entity';
import { GhSesionInduccion } from './entities/gh-sesion-induccion.entity';
import { GhInduccionAsistencia } from './entities/gh-induccion-asistencia.entity';
import { GhMaestroDotacion } from './entities/gh-maestro-dotacion.entity';
import { GhDotacionEntrega } from './entities/gh-dotacion-entrega.entity';
import { GhDotacionEntregaDetalle } from './entities/gh-dotacion-entrega-detalle.entity';
import { GhImportacion } from './entities/gh-importacion.entity';
import { GhImportacionDetalle } from './entities/gh-importacion-detalle.entity';
import { GhAccesoVigilancia } from './entities/gh-acceso-vigilancia.entity';

import { CrearCitaDto } from './dto/requests/crear-cita.dto';
import { CrearCitaGrupoDto } from './dto/requests/crear-cita-grupo.dto';
import { ActualizarCitaDto } from './dto/requests/actualizar-cita.dto';
import { CambiarEstadoCitaDto } from './dto/requests/cambiar-estado-cita.dto';
import { PortalConfirmarDto } from './dto/requests/portal-confirmar.dto';
import { PortalReagendarDto } from './dto/requests/portal-reagendar.dto';
import { CrearSesionInduccionDto } from './dto/requests/crear-sesion-induccion.dto';
import { EstadoSesionInduccionDto } from './dto/requests/estado-sesion-induccion.dto';
import { PortalInduccionCodigoDto } from './dto/requests/portal-induccion.dto';
import { CrearMaestroDotacionDto } from './dto/requests/crear-maestro-dotacion.dto';
import { CrearDotacionEntregaDto } from './dto/requests/crear-dotacion-entrega.dto';
import { AgregarDetalleEntregaDto } from './dto/requests/agregar-detalle-entrega.dto';
import { CrearImportacionDto } from './dto/requests/crear-importacion.dto';
import { VerificarVigilanteDto } from './dto/requests/verificar-vigilante.dto';

import { CitaResponseDto } from './dto/responses/cita-response.dto';
import { CandidatoResponseDto } from './dto/responses/candidato-response.dto';
import { PortalValidateResponseDto, PortalAccionResponseDto } from './dto/responses/portal-response.dto';
import { GhCandidatoBaseDto } from './dto/gh-candidato.dto';
import { SesionInduccionResponseDto, InduccionAsistenciaResponseDto, CodigoTemporalResponseDto } from './dto/responses/sesion-induccion-response.dto';
import { PortalInduccionValidateResponseDto, PortalInduccionAccionResponseDto } from './dto/responses/portal-induccion-response.dto';
import { MaestroDotacionResponseDto, DotacionEntregaResponseDto, DotacionEntregaDetalleResponseDto, ImportacionResponseDto, ImportacionDetalleResponseDto } from './dto/responses/dotacion-response.dto';

import { GhTipoCita, GhEstadoCita, GhEstadoSesionInduccion, GhEstadoAsistenciaInduccion, GhDotacionEntregaEstado, GhDotacionItemEstado, GhImportacionEstado, GhTipoSesion } from '../common/enums/gh.enum';

@Injectable()
export class GhService {
  constructor(
    @InjectRepository(GhCita)
    private readonly citaRepo: Repository<GhCita>,
    @InjectRepository(GhCandidato)
    private readonly candidatoRepo: Repository<GhCandidato>,
    @InjectRepository(GhPortalToken)
    private readonly tokenRepo: Repository<GhPortalToken>,
    @InjectRepository(GhAuditoria)
    private readonly auditoriaRepo: Repository<GhAuditoria>,
    @InjectRepository(GhSesionInduccion)
    private readonly sesionInduccionRepo: Repository<GhSesionInduccion>,
    @InjectRepository(GhInduccionAsistencia)
    private readonly asistenciaRepo: Repository<GhInduccionAsistencia>,
    @InjectRepository(GhMaestroDotacion)
    private readonly maestroDotacionRepo: Repository<GhMaestroDotacion>,
    @InjectRepository(GhDotacionEntrega)
    private readonly dotacionEntregaRepo: Repository<GhDotacionEntrega>,
    @InjectRepository(GhDotacionEntregaDetalle)
    private readonly dotacionDetalleRepo: Repository<GhDotacionEntregaDetalle>,
    @InjectRepository(GhImportacion)
    private readonly importacionRepo: Repository<GhImportacion>,
    @InjectRepository(GhImportacionDetalle)
    private readonly importacionDetalleRepo: Repository<GhImportacionDetalle>,
    @InjectRepository(GhAccesoVigilancia)
    private readonly accesoVigilanciaRepo: Repository<GhAccesoVigilancia>,
  ) {}

  // ─── helpers ──────────────────────────────────────────────────────────────

  private validateRangoFechas(inicio: Date, fin: Date) {
    if (fin.getTime() <= inicio.getTime()) {
      throw new BadRequestException('La fecha/hora fin debe ser mayor que inicio.');
    }
  }

  private async upsertCandidato(candidatoData: GhCandidatoBaseDto): Promise<GhCandidato> {
    let candidato = await this.candidatoRepo.findOne({
      where: { tipoDocumento: candidatoData.tipoDocumento, numeroDocumento: candidatoData.numeroDocumento },
    });

    if (candidato) {
      candidato.nombres = candidatoData.nombres;
      candidato.apellidos = candidatoData.apellidos;
      candidato.email = (candidatoData.email ?? null) as any;
      candidato.telefono = (candidatoData.telefono ?? null) as any;
      return this.candidatoRepo.save(candidato);
    }

    return this.candidatoRepo.save(
      this.candidatoRepo.create({
        tipoDocumento: candidatoData.tipoDocumento,
        numeroDocumento: candidatoData.numeroDocumento,
        nombres: candidatoData.nombres,
        apellidos: candidatoData.apellidos,
        email: (candidatoData.email ?? null) as any,
        telefono: (candidatoData.telefono ?? null) as any,
      }),
    );
  }

  private async generateCitaCodigo(sedeId: number): Promise<string> {
    const seed = Math.floor(Date.now() / 1000);
    let codigo = `GH-${sedeId}-${seed}`;
    const existe = await this.citaRepo.findOne({ where: { codigo } });
    if (existe) {
      codigo = `${codigo}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
    return codigo;
  }

  private async createCitaWithPortalToken(params: {
    candidatoId: number;
    sedeId: number;
    responsableId?: number;
    tipoCita: GhTipoCita;
    fechaHoraInicio: Date;
    fechaHoraFin: Date;
    observaciones?: string;
  }): Promise<GhCita> {
    const codigo = await this.generateCitaCodigo(params.sedeId);
    const cita = await this.citaRepo.save(
      this.citaRepo.create({
        codigo,
        candidatoId: params.candidatoId,
        sedeId: params.sedeId,
        responsableId: params.responsableId,
        tipoCita: params.tipoCita,
        estado: GhEstadoCita.PROGRAMADA,
        fechaHoraInicio: params.fechaHoraInicio,
        fechaHoraFin: params.fechaHoraFin,
        observaciones: params.observaciones,
      }),
    );

    await this.tokenRepo.save(
      this.tokenRepo.create({
        citaId: cita.id,
        token: randomBytes(18).toString('base64url'),
        expiraEn: cita.fechaHoraFin,
      }),
    );

    return cita;
  }

  private async audit(params: {
    usuarioId?: number;
    sedeId?: number;
    accion: string;
    entidad: string;
    entidadId?: number;
    detalle?: any;
  }) {
    await this.auditoriaRepo.save(
      this.auditoriaRepo.create({
        usuarioId: params.usuarioId,
        sedeId: params.sedeId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId,
        detalle: params.detalle,
      }),
    );
  }

  private normalizeTipoCita(tipoCita: GhTipoCita | string): GhTipoCita {
    if (tipoCita === 'ENTREVISTA') return GhTipoCita.FIRMA_CONTRATO;
    return tipoCita as GhTipoCita;
  }

  private serializeCandidato(candidato: GhCandidato): CandidatoResponseDto {
    return {
      id: candidato.id,
      tipoDocumento: candidato.tipoDocumento,
      numeroDocumento: candidato.numeroDocumento,
      nombres: candidato.nombres,
      apellidos: candidato.apellidos,
      email: candidato.email ?? undefined,
      telefono: candidato.telefono ?? undefined,
    };
  }

  private serializeCita(cita: GhCita): CitaResponseDto {
    return {
      id: cita.id,
      codigo: cita.codigo,
      sedeId: cita.sedeId,
      tipoCita: this.normalizeTipoCita(cita.tipoCita),
      estado: cita.estado,
      fechaHoraInicio: cita.fechaHoraInicio.toISOString(),
      fechaHoraFin: cita.fechaHoraFin.toISOString(),
      observaciones: cita.observaciones,
      candidato: cita.candidato ? this.serializeCandidato(cita.candidato) : undefined,
    } as CitaResponseDto;
  }

  private serializeAsistencia(asistencia: GhInduccionAsistencia): InduccionAsistenciaResponseDto {
    return {
      id: asistencia.id,
      candidato: this.serializeCandidato(asistencia.candidato),
      estadoAsistencia: asistencia.estadoAsistencia,
      tokenAutogestion: asistencia.tokenAutogestion,
      checkinAt: asistencia.checkinAt ? asistencia.checkinAt.toISOString() : null,
      checkoutAt: asistencia.checkoutAt ? asistencia.checkoutAt.toISOString() : null,
      intentosCodigo: asistencia.intentosCodigo ?? 0,
      ultimoErrorCodigo: asistencia.ultimoErrorCodigo ?? null,
    };
  }

  private async serializeSesion(sesion: GhSesionInduccion): Promise<SesionInduccionResponseDto> {
    const asistentes = sesion.asistentes?.map((a) => this.serializeAsistencia(a)) ?? [];

    const candidatoIds = sesion.asistentes?.map((a) => a.candidatoId) ?? [];
    let relatedCitaIds: number[] = [];
    if (candidatoIds.length > 0) {
      const citas = await this.citaRepo.find({
        where: { candidato: { id: In(candidatoIds) }, tipoCita: GhTipoCita.INDUCCION },
        select: ['id'],
      });
      relatedCitaIds = citas.map((c) => c.id);
    }

    return {
      id: sesion.id,
      sedeId: sesion.sedeId,
      area: sesion.area,
      tipoInduccion: sesion.tipoInduccion,
      tipoSesion: sesion.tipoSesion ?? GhTipoSesion.PRESENCIAL,
      linkVirtual: sesion.linkVirtual ?? null,
      salaFisica: sesion.salaFisica ?? null,
      descripcion: sesion.descripcion ?? null,
      capacidadMaxima: sesion.capacidadMaxima ?? null,
      responsableUsuarioId: sesion.responsableUsuarioId ?? null,
      fechaHoraInicio: sesion.fechaHoraInicio.toISOString(),
      fechaHoraFin: sesion.fechaHoraFin.toISOString(),
      estadoSesion: sesion.estadoSesion,
      codigoCheckinActual: sesion.codigoCheckinActual ?? null,
      codigoCheckoutActual: sesion.codigoCheckoutActual ?? null,
      fechaCierre: sesion.fechaCierre ? sesion.fechaCierre.toISOString() : null,
      asistentes,
      relatedCitaIds,
      totalAsistentes: asistentes.length,
      totalCheckin: asistentes.filter((a) => a.checkinAt !== null).length,
      totalCheckout: asistentes.filter((a) => a.checkoutAt !== null).length,
    };
  }

  private serializeMaestroDotacion(m: GhMaestroDotacion): MaestroDotacionResponseDto {
    return {
      id: m.id,
      sedeId: m.sedeId ?? null,
      area: m.area,
      cargo: m.cargo,
      tipoContrato: m.tipoContrato,
      kitCodigo: m.kitCodigo,
      kitDescripcion: m.kitDescripcion,
      activo: m.activo,
    };
  }

  private serializeDotacionEntrega(e: GhDotacionEntrega): DotacionEntregaResponseDto {
    const detalles = (e.detalles ?? []).map((d) => this.serializeDetalleEntrega(d));
    const totalItems = detalles.reduce((acc, d) => acc + d.cantidadEsperada, 0);
    const itemsEntregados = detalles.reduce((acc, d) => acc + d.cantidadEntregada, 0);
    const porcentajeCompletitud = totalItems > 0 ? Math.round((itemsEntregados / totalItems) * 100) : 0;

    return {
      id: e.id,
      candidatoId: e.candidatoId,
      candidato: e.candidato ? {
        id: e.candidato.id,
        tipoDocumento: e.candidato.tipoDocumento,
        numeroDocumento: e.candidato.numeroDocumento,
        nombres: e.candidato.nombres,
        apellidos: e.candidato.apellidos,
        email: e.candidato.email ?? null,
        telefono: e.candidato.telefono ?? null,
      } : null,
      maestroDotacionId: e.maestroDotacionId ?? null,
      maestroDotacion: e.maestroDotacion ? {
        id: e.maestroDotacion.id,
        kitCodigo: e.maestroDotacion.kitCodigo,
        kitDescripcion: e.maestroDotacion.kitDescripcion,
        area: e.maestroDotacion.area,
        cargo: e.maestroDotacion.cargo,
        tipoContrato: e.maestroDotacion.tipoContrato,
      } : null,
      sesionOCitaId: e.sesionOCitaId ?? null,
      tipoReferencia: e.tipoReferencia ?? null,
      area: e.area ?? e.maestroDotacion?.area ?? null,
      cargo: e.cargo ?? e.maestroDotacion?.cargo ?? null,
      estadoEntrega: e.estadoEntrega,
      entregadoPorUsuarioId: e.entregadoPorUsuarioId ?? null,
      entregadorNombre: e.entregador?.nombreCompleto ?? null,
      fechaEntrega: e.fechaEntrega ? e.fechaEntrega.toISOString() : null,
      fechaCreacion: e.created_at ? e.created_at.toISOString() : new Date().toISOString(),
      observaciones: e.observaciones ?? null,
      detalles,
      totalItems,
      itemsEntregados,
      porcentajeCompletitud,
    };
  }

  private serializeDetalleEntrega(d: GhDotacionEntregaDetalle): DotacionEntregaDetalleResponseDto {
    return {
      id: d.id,
      itemCodigo: d.itemCodigo,
      itemNombre: d.itemNombre,
      cantidadEsperada: d.cantidadEsperada,
      cantidadEntregada: d.cantidadEntregada,
      estadoItem: d.estadoItem,
      evidenciaUrl: d.evidenciaUrl ?? null,
    };
  }

  private serializeImportacion(imp: GhImportacion): ImportacionResponseDto {
    return {
      id: imp.id,
      sedeId: imp.sedeId,
      nombreArchivo: imp.nombreArchivo,
      estado: imp.estado,
      filasTotales: imp.filasTotales,
      filasExitosas: imp.filasExitosas,
      filasFallidas: imp.filasFallidas,
      resumenError: imp.resumenError ?? null,
    };
  }

  // ─── catálogos ────────────────────────────────────────────────────────────

  async listTiposCita() {
    return [
      { id: 'INDUCCION', nombre: 'Inducción' },
      { id: 'FIRMA_CONTRATO', nombre: 'Firma de contrato' },
      { id: 'ENTREGA_DOTACION', nombre: 'Entrega de dotación' },
    ];
  }

  async listEstadosCita() {
    return [
      { id: 'PROGRAMADA', nombre: 'Programada' },
      { id: 'CONFIRMADA', nombre: 'Confirmada' },
      { id: 'EN_CURSO', nombre: 'En curso' },
      { id: 'FINALIZADA', nombre: 'Finalizada' },
      { id: 'NO_ASISTIO', nombre: 'No asistió' },
      { id: 'CANCELADA', nombre: 'Cancelada' },
    ];
  }

  // ─── citas ────────────────────────────────────────────────────────────────

  async getCitas(
    sedeId: number,
    estado?: string,
    tipoCita?: string,
    busqueda?: string,
    fechaDesde?: string,
    fechaHasta?: string,
    page = 1,
    perPage = 20,
  ): Promise<CitaResponseDto[]> {
    const skip = (page - 1) * perPage;

    const query = this.citaRepo
      .createQueryBuilder('c')
      .where('c.sedeId = :sedeId', { sedeId })
      .leftJoinAndSelect('c.candidato', 'candidato');

    if (estado) query.andWhere('c.estado = :estado', { estado });
    if (tipoCita) query.andWhere('c.tipoCita = :tipoCita', { tipoCita });
    if (fechaDesde) query.andWhere('c.fechaHoraInicio >= :fechaDesde', { fechaDesde });
    if (fechaHasta) query.andWhere('c.fechaHoraFin <= :fechaHasta', { fechaHasta });
    if (busqueda) {
      query.andWhere(
        '(candidato.nombres LIKE :b OR candidato.apellidos LIKE :b OR candidato.numeroDocumento LIKE :b)',
        { b: `%${busqueda}%` },
      );
    }

    const items = await query.orderBy('c.fechaHoraInicio', 'DESC').skip(skip).take(perPage).getMany();
    return items.map((c) => this.serializeCita(c));
  }

  async getCita(citaId: number): Promise<CitaResponseDto> {
    const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
    if (!cita) throw new NotFoundException('La cita no existe.');
    return this.serializeCita(cita);
  }

  async crearCita(body: CrearCitaDto, responsableId?: number): Promise<CitaResponseDto> {
    const inicio = new Date(body.fechaHoraInicio);
    const fin = new Date(body.fechaHoraFin);
    this.validateRangoFechas(inicio, fin);

    const candidato = await this.upsertCandidato(body.candidato);
    const cita = await this.createCitaWithPortalToken({
      candidatoId: candidato.id,
      sedeId: body.sedeId,
      responsableId,
      tipoCita: body.tipoCita,
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
      observaciones: body.observaciones,
    });

    await this.audit({
      usuarioId: responsableId,
      sedeId: cita.sedeId,
      accion: 'CREAR_CITA',
      entidad: 'GhCita',
      entidadId: cita.id,
      detalle: { codigo: cita.codigo, tipoCita: cita.tipoCita },
    });

    const citaConRelaciones = await this.citaRepo.findOne({ where: { id: cita.id }, relations: ['candidato'] });
    return this.serializeCita(citaConRelaciones!);
  }

  async crearCitasGrupo(body: CrearCitaGrupoDto, responsableId?: number): Promise<CitaResponseDto[]> {
    const inicio = new Date(body.fechaHoraInicio);
    const fin = new Date(body.fechaHoraFin);
    this.validateRangoFechas(inicio, fin);

    const citasIds: number[] = [];
    const vistos = new Set<string>();

    for (const cd of body.candidatos) {
      const key = `${cd.tipoDocumento}-${cd.numeroDocumento}`;
      if (vistos.has(key)) continue;
      vistos.add(key);

      const candidato = await this.upsertCandidato(cd);
      const cita = await this.createCitaWithPortalToken({
        candidatoId: candidato.id,
        sedeId: body.sedeId,
        responsableId,
        tipoCita: body.tipoCita,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        observaciones: body.observaciones,
      });
      citasIds.push(cita.id);
    }

    await this.audit({
      usuarioId: responsableId,
      sedeId: body.sedeId,
      accion: 'CREAR_CITAS_GRUPO',
      entidad: 'GhCita',
      detalle: { cantidad: citasIds.length, tipoCita: body.tipoCita },
    });

    const citas = await this.citaRepo.find({ where: { id: In(citasIds) }, relations: ['candidato'] });
    return citas.map((c) => this.serializeCita(c));
  }

  async actualizarCita(citaId: number, body: ActualizarCitaDto, usuarioId?: number): Promise<CitaResponseDto> {
    const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
    if (!cita) throw new NotFoundException('La cita no existe.');

    const nuevoInicio = body.fechaHoraInicio ? new Date(body.fechaHoraInicio) : cita.fechaHoraInicio;
    const nuevoFin = body.fechaHoraFin ? new Date(body.fechaHoraFin) : cita.fechaHoraFin;
    this.validateRangoFechas(nuevoInicio, nuevoFin);

    if (body.tipoCita) cita.tipoCita = body.tipoCita;
    if (body.fechaHoraInicio) cita.fechaHoraInicio = new Date(body.fechaHoraInicio);
    if (body.fechaHoraFin) cita.fechaHoraFin = new Date(body.fechaHoraFin);
    if (body.observaciones !== undefined) cita.observaciones = body.observaciones;

    await this.citaRepo.save(cita);
    await this.audit({ usuarioId, sedeId: cita.sedeId, accion: 'ACTUALIZAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: body });

    return this.serializeCita(cita);
  }

  async cambiarEstado(citaId: number, body: CambiarEstadoCitaDto, usuarioId?: number): Promise<CitaResponseDto> {
    const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
    if (!cita) throw new NotFoundException('La cita no existe.');

    const tipo = this.normalizeTipoCita(cita.tipoCita);
    if (tipo === GhTipoCita.INDUCCION && (body.estado === GhEstadoCita.EN_CURSO || body.estado === GhEstadoCita.FINALIZADA)) {
      throw new BadRequestException('Las citas de inducción no se gestionan desde agenda. Usa el submódulo de inducciones.');
    }

    cita.estado = body.estado;
    await this.citaRepo.save(cita);
    await this.audit({ usuarioId, sedeId: cita.sedeId, accion: 'CAMBIAR_ESTADO_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: { estado: body.estado, motivo: body.motivo } });

    return this.serializeCita(cita);
  }

  async eliminarCita(citaId: number, usuarioId?: number): Promise<void> {
    const cita = await this.citaRepo.findOne({ where: { id: citaId } });
    if (!cita) throw new NotFoundException('La cita no existe.');

    const tokens = await this.tokenRepo.find({ where: { citaId: cita.id } });
    if (tokens.length > 0) await this.tokenRepo.remove(tokens);

    await this.citaRepo.remove(cita);
    await this.audit({
      usuarioId,
      sedeId: cita.sedeId,
      accion: 'ELIMINAR_CITA',
      entidad: 'GhCita',
      entidadId: citaId,
      detalle: { codigo: cita.codigo, tipoCita: this.normalizeTipoCita(cita.tipoCita) },
    });
  }

  // ─── portales públicos — citas ────────────────────────────────────────────

  async validarPortal(token: string): Promise<PortalValidateResponseDto> {
    const tokenObj = await this.tokenRepo.findOne({
      where: { token },
      relations: ['cita', 'cita.candidato'],
    });

    if (!tokenObj || !tokenObj.cita) {
      throw new NotFoundException('Token de portal inválido o expirado.');
    }

    return {
      token: tokenObj.token,
      vigente: true,
      expiraEn: tokenObj.expiraEn.toISOString(),
      cita: this.serializeCita(tokenObj.cita),
    };
  }

  async portalConfirmar(token: string, body: PortalConfirmarDto): Promise<PortalAccionResponseDto> {
    const tokenObj = await this.tokenRepo.findOne({ where: { token }, relations: ['cita', 'cita.candidato'] });
    if (!tokenObj || !tokenObj.cita) throw new NotFoundException('Token de portal inválido o expirado.');

    const cita = tokenObj.cita;
    cita.estado = body.confirmada ? GhEstadoCita.CONFIRMADA : GhEstadoCita.CANCELADA;
    tokenObj.usadoEn = new Date();

    await this.citaRepo.save(cita);
    await this.tokenRepo.save(tokenObj);
    await this.audit({ sedeId: cita.sedeId, accion: 'PORTAL_CONFIRMAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: { confirmada: body.confirmada } });

    return { token, accion: body.confirmada ? 'CONFIRMAR' : 'CANCELAR', cita: this.serializeCita(cita) };
  }

  async portalReagendar(token: string, body: PortalReagendarDto): Promise<PortalAccionResponseDto> {
    const tokenObj = await this.tokenRepo.findOne({ where: { token }, relations: ['cita', 'cita.candidato'] });
    if (!tokenObj || !tokenObj.cita) throw new NotFoundException('Token de portal inválido o expirado.');

    const inicio = new Date(body.fechaHoraInicio);
    const fin = new Date(body.fechaHoraFin);
    this.validateRangoFechas(inicio, fin);

    const cita = tokenObj.cita;
    cita.fechaHoraInicio = inicio;
    cita.fechaHoraFin = fin;
    cita.estado = GhEstadoCita.PROGRAMADA;
    tokenObj.usadoEn = new Date();

    await this.citaRepo.save(cita);
    await this.tokenRepo.save(tokenObj);
    await this.audit({ sedeId: cita.sedeId, accion: 'PORTAL_REAGENDAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: body });

    return { token, accion: 'REAGENDAR', cita: this.serializeCita(cita) };
  }

  // ─── dashboard ────────────────────────────────────────────────────────────

  async getDashboard(sedeId: number) {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const [citasHoyTotal, citasHoyConfirmadas, citasHoyNoAsistio, citasEnCurso] = await Promise.all([
      this.citaRepo.count({ where: { sedeId, fechaHoraInicio: Between(hoyInicio, hoyFin) } }),
      this.citaRepo.count({ where: { sedeId, estado: GhEstadoCita.CONFIRMADA, fechaHoraInicio: Between(hoyInicio, hoyFin) } }),
      this.citaRepo.count({ where: { sedeId, estado: GhEstadoCita.NO_ASISTIO, fechaHoraInicio: Between(hoyInicio, hoyFin) } }),
      this.citaRepo.count({ where: { sedeId, estado: GhEstadoCita.EN_CURSO } }),
    ]);

    return { citasHoyTotal, citasHoyConfirmadas, citasHoyNoAsistio, citasEnCurso };
  }

  // ─── inducciones ──────────────────────────────────────────────────────────

  async crearSesionInduccion(body: CrearSesionInduccionDto, responsableId?: number): Promise<SesionInduccionResponseDto> {
    const inicio = new Date(body.fechaHoraInicio);
    const fin = new Date(body.fechaHoraFin);
    this.validateRangoFechas(inicio, fin);

    const sesion = await this.sesionInduccionRepo.save(
      this.sesionInduccionRepo.create({
        sedeId: body.sedeId,
        area: body.area,
        tipoInduccion: body.tipoInduccion,
        tipoSesion: body.tipoSesion ?? GhTipoSesion.PRESENCIAL,
        linkVirtual: body.linkVirtual as any,
        salaFisica: body.salaFisica as any,
        descripcion: body.descripcion as any,
        capacidadMaxima: body.capacidadMaxima as any,
        responsableUsuarioId: body.responsableUsuarioId ?? undefined,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        estadoSesion: GhEstadoSesionInduccion.PROGRAMADA,
      }),
    );

    const asistencias: GhInduccionAsistencia[] = [];

    if (body.citaIds && body.citaIds.length > 0) {
      const citas = await this.citaRepo.find({ where: { id: In(body.citaIds) }, relations: ['candidato'] });
      for (const cita of citas) {
        if (!cita.candidato) continue;
        asistencias.push(
          this.asistenciaRepo.create({
            sesionId: sesion.id,
            candidatoId: cita.candidato.id,
            tokenAutogestion: randomBytes(48).toString('hex'),
            estadoAsistencia: GhEstadoAsistenciaInduccion.PENDIENTE,
          }),
        );
        cita.estado = GhEstadoCita.EN_CURSO;
        cita.fechaHoraInicio = inicio;
        cita.fechaHoraFin = fin;
        await this.citaRepo.save(cita);
      }
    }

    if (body.asistentes && body.asistentes.length > 0) {
      for (const asistente of body.asistentes) {
        const candidato = await this.upsertCandidato(asistente);
        asistencias.push(
          this.asistenciaRepo.create({
            sesionId: sesion.id,
            candidatoId: candidato.id,
            tokenAutogestion: randomBytes(48).toString('hex'),
            estadoAsistencia: GhEstadoAsistenciaInduccion.PENDIENTE,
          }),
        );
      }
    }

    if (asistencias.length > 0) await this.asistenciaRepo.save(asistencias);

    await this.audit({
      sedeId: body.sedeId,
      accion: 'CREAR_SESION_INDUCCION',
      entidad: 'GhSesionInduccion',
      entidadId: sesion.id,
      detalle: { cantidadAsistentes: asistencias.length, area: body.area },
      usuarioId: responsableId,
    });

    return this.getSesionInduccion(sesion.id);
  }

  async getInduccionesSesiones(sedeId?: number, estadoSesion?: string): Promise<SesionInduccionResponseDto[]> {
    const qb = this.sesionInduccionRepo
      .createQueryBuilder('sesion')
      .leftJoinAndSelect('sesion.asistentes', 'asistentes')
      .leftJoinAndSelect('asistentes.candidato', 'candidato')
      .orderBy('sesion.fechaHoraInicio', 'DESC');

    if (sedeId) qb.andWhere('sesion.sedeId = :sedeId', { sedeId });
    if (estadoSesion) qb.andWhere('sesion.estadoSesion = :estadoSesion', { estadoSesion });

    const sesiones = await qb.getMany();
    return Promise.all(sesiones.map((s) => this.serializeSesion(s)));
  }

  async getSesionInduccion(id: number): Promise<SesionInduccionResponseDto> {
    const sesion = await this.sesionInduccionRepo.findOne({
      where: { id },
      relations: ['asistentes', 'asistentes.candidato'],
    });
    if (!sesion) throw new NotFoundException('La sesión de inducción no existe.');
    return this.serializeSesion(sesion);
  }

  async cambiarEstadoSesionInduccion(id: number, body: EstadoSesionInduccionDto, usuarioId?: number): Promise<SesionInduccionResponseDto> {
    const sesion = await this.sesionInduccionRepo.findOne({ where: { id }, relations: ['asistentes'] });
    if (!sesion) throw new NotFoundException('La sesión de inducción no existe.');

    sesion.estadoSesion = body.estadoSesion;
    if (['FINALIZADA', 'CERRADA'].includes(body.estadoSesion)) {
      sesion.fechaCierre = new Date();
    }

    await this.sesionInduccionRepo.save(sesion);

    if (['FINALIZADA', 'CERRADA', 'CANCELADA'].includes(body.estadoSesion)) {
      const candidatoIds = (sesion.asistentes ?? []).map((a) => a.candidatoId);
      if (candidatoIds.length > 0) {
        const citas = await this.citaRepo.find({
          where: { candidato: { id: In(candidatoIds) }, tipoCita: GhTipoCita.INDUCCION, fechaHoraInicio: sesion.fechaHoraInicio },
        });
        for (const cita of citas) {
          cita.estado = body.estadoSesion === 'CANCELADA' ? GhEstadoCita.CANCELADA : GhEstadoCita.FINALIZADA;
          await this.citaRepo.save(cita);
        }
      }
    }

    await this.audit({
      sedeId: sesion.sedeId,
      accion: 'CAMBIAR_ESTADO_SESION_INDUCCION',
      entidad: 'GhSesionInduccion',
      entidadId: sesion.id,
      detalle: { estadoSesion: body.estadoSesion, motivo: body.motivo },
      usuarioId,
    });

    return this.getSesionInduccion(sesion.id);
  }

  async generarCodigoTemporalInduccion(id: number, tipo: 'CHECKIN' | 'CHECKOUT', usuarioId?: number): Promise<CodigoTemporalResponseDto> {
    const sesion = await this.sesionInduccionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('La sesión de inducción no existe.');

    const codigo = Math.random().toString().slice(2, 8);
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 5);

    if (tipo === 'CHECKIN') {
      sesion.codigoCheckinActual = codigo;
    } else {
      sesion.codigoCheckoutActual = codigo;
    }

    await this.sesionInduccionRepo.save(sesion);
    await this.audit({ sedeId: sesion.sedeId, accion: `GENERAR_CODIGO_${tipo}`, entidad: 'GhSesionInduccion', entidadId: sesion.id, detalle: { expiraEn: expiraEn.toISOString() }, usuarioId });

    return { sesionId: id, tipo, codigo, expiraEn: expiraEn.toISOString() };
  }

  async enviarLinksInduccion(id: number, _usuarioId?: number) {
    const sesion = await this.sesionInduccionRepo.findOne({ where: { id } });
    if (!sesion) throw new NotFoundException('La sesión de inducción no existe.');
    // Envío de emails/SMS pendiente de integración con proveedor externo
    return { enviados: 0, mensaje: 'Funcionalidad de envío pendiente de configuración.' };
  }

  // ─── portales públicos — inducción ────────────────────────────────────────

  async validarPortalInduccion(token: string): Promise<PortalInduccionValidateResponseDto> {
    const asistencia = await this.asistenciaRepo.findOne({
      where: { tokenAutogestion: token },
      relations: ['sesion', 'candidato'],
    });

    if (!asistencia || !asistencia.sesion || !asistencia.candidato) {
      throw new NotFoundException('Token de inducción inválido.');
    }

    const sesion = asistencia.sesion;
    if (sesion.estadoSesion === GhEstadoSesionInduccion.CANCELADA) {
      throw new BadRequestException('La sesión de inducción se encuentra cancelada.');
    }

    const ventanaHabilitada = sesion.estadoSesion === GhEstadoSesionInduccion.EN_CURSO;

    return {
      token,
      vigente: true,
      ventanaHabilitada,
      sesionId: sesion.id,
      estadoSesion: sesion.estadoSesion,
      candidato: this.serializeCandidato(asistencia.candidato),
      estadoAsistencia: asistencia.estadoAsistencia,
      checkinAt: asistencia.checkinAt ? asistencia.checkinAt.toISOString() : null,
      checkoutAt: asistencia.checkoutAt ? asistencia.checkoutAt.toISOString() : null,
    };
  }

  async portalInduccionCheckin(token: string, body: PortalInduccionCodigoDto, ip?: string, userAgent?: string): Promise<PortalInduccionAccionResponseDto> {
    const asistencia = await this.asistenciaRepo.findOne({ where: { tokenAutogestion: token }, relations: ['sesion'] });
    if (!asistencia || !asistencia.sesion) throw new NotFoundException('Token de inducción inválido.');

    if (asistencia.intentosCodigo >= 5) {
      throw new BadRequestException('Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.');
    }

    const sesion = asistencia.sesion;
    if (!sesion.codigoCheckinActual) {
      throw new BadRequestException('No hay código de check-in activo.');
    }

    if (body.codigo !== sesion.codigoCheckinActual) {
      asistencia.intentosCodigo += 1;
      asistencia.ultimoErrorCodigo = 'Código de check-in inválido';
      await this.asistenciaRepo.save(asistencia);
      throw new BadRequestException(`Código temporal inválido. Intento ${asistencia.intentosCodigo} de 5.`);
    }

    asistencia.checkinAt = new Date();
    asistencia.estadoAsistencia = GhEstadoAsistenciaInduccion.EN_SESION;
    asistencia.ipEntrada = ip as any;
    asistencia.userAgentEntrada = userAgent as any;
    asistencia.ultimoErrorCodigo = null as any;
    asistencia.intentosCodigo = 0;
    await this.asistenciaRepo.save(asistencia);

    await this.audit({ sedeId: sesion.sedeId, accion: 'PORTAL_INDUCCION_CHECKIN', entidad: 'GhInduccionAsistencia', entidadId: asistencia.id, detalle: { sesionId: sesion.id } });

    return { token, accion: 'CHECKIN', estadoAsistencia: GhEstadoAsistenciaInduccion.EN_SESION, timestamp: asistencia.checkinAt.toISOString() };
  }

  async portalInduccionCheckout(token: string, body: PortalInduccionCodigoDto, ip?: string, userAgent?: string): Promise<PortalInduccionAccionResponseDto> {
    const asistencia = await this.asistenciaRepo.findOne({ where: { tokenAutogestion: token }, relations: ['sesion'] });
    if (!asistencia || !asistencia.sesion) throw new NotFoundException('Token de inducción inválido.');

    if (asistencia.intentosCodigo >= 5) {
      throw new BadRequestException('Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.');
    }

    if (!asistencia.checkinAt) {
      throw new BadRequestException('No puedes registrar salida sin check-in previo.');
    }

    const sesion = asistencia.sesion;
    if (!sesion.codigoCheckoutActual) {
      throw new BadRequestException('No hay código de check-out activo.');
    }

    if (body.codigo !== sesion.codigoCheckoutActual) {
      asistencia.intentosCodigo += 1;
      asistencia.ultimoErrorCodigo = 'Código de check-out inválido';
      await this.asistenciaRepo.save(asistencia);
      throw new BadRequestException(`Código temporal inválido. Intento ${asistencia.intentosCodigo} de 5.`);
    }

    asistencia.checkoutAt = new Date();
    asistencia.estadoAsistencia = GhEstadoAsistenciaInduccion.CHECKOUT_OK;
    asistencia.ipSalida = ip as any;
    asistencia.userAgentSalida = userAgent as any;
    asistencia.ultimoErrorCodigo = null as any;
    asistencia.intentosCodigo = 0;
    await this.asistenciaRepo.save(asistencia);

    return { token, accion: 'CHECKOUT', estadoAsistencia: GhEstadoAsistenciaInduccion.CHECKOUT_OK, timestamp: asistencia.checkoutAt.toISOString() };
  }

  // ─── vigilancia ───────────────────────────────────────────────────────────

  async verificarVigilante(body: VerificarVigilanteDto, vigilanteId?: number) {
    const candidato = await this.candidatoRepo.findOne({
      where: { tipoDocumento: body.tipoDocumento, numeroDocumento: body.numeroDocumento },
    });

    if (!candidato) {
      return { estado: 'NO_REGISTRADO', mensaje: 'Persona no encontrada en el sistema.', cita: null };
    }

    const ahora = new Date();
    const ventanaInicio = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);
    const ventanaFin = new Date(ahora.getTime() + 2 * 60 * 60 * 1000);

    const cita = await this.citaRepo.findOne({
      where: {
        candidatoId: candidato.id,
        sedeId: body.sedeId,
        estado: In([GhEstadoCita.PROGRAMADA, GhEstadoCita.CONFIRMADA]),
        fechaHoraInicio: Between(ventanaInicio, ventanaFin),
      },
      relations: ['candidato'],
      order: { fechaHoraInicio: 'ASC' },
    });

    if (!cita) {
      return { estado: 'NO_AUTORIZADO', mensaje: 'No tiene cita activa en esta sede para el horario actual.', cita: null };
    }

    await this.accesoVigilanciaRepo.save(
      this.accesoVigilanciaRepo.create({
        citaId: cita.id,
        sedeId: body.sedeId,
        vigilanteId: vigilanteId as any,
        tipoAcceso: 'ENTRADA' as any,
        metodo: 'MANUAL',
      }),
    );

    return { estado: 'AUTORIZADO', mensaje: 'Acceso autorizado.', cita: this.serializeCita(cita) };
  }

  // ─── importaciones ────────────────────────────────────────────────────────

  async crearImportacion(body: CrearImportacionDto, usuarioId?: number): Promise<ImportacionResponseDto> {
    const importacion = await this.importacionRepo.save(
      this.importacionRepo.create({
        sedeId: body.sedeId,
        creadoPor: usuarioId as any,
        nombreArchivo: body.nombreArchivo,
        estado: GhImportacionEstado.PENDIENTE,
        filasTotales: 0,
        filasExitosas: 0,
        filasFallidas: 0,
      }),
    );

    await this.audit({ usuarioId, sedeId: body.sedeId, accion: 'CREAR_IMPORTACION', entidad: 'GhImportacion', entidadId: importacion.id, detalle: { nombreArchivo: body.nombreArchivo } });

    return this.serializeImportacion(importacion);
  }

  async getImportacion(id: number): Promise<ImportacionDetalleResponseDto> {
    const importacion = await this.importacionRepo.findOne({
      where: { id },
      relations: ['detalles'],
    });
    if (!importacion) throw new NotFoundException('Importación no encontrada.');

    return {
      ...this.serializeImportacion(importacion),
      detalles: (importacion.detalles ?? []).map((d) => ({
        id: d.id,
        numeroFila: d.numeroFila,
        estado: d.estado,
        mensaje: d.mensaje,
        payload: d.payload ?? null,
      })),
    };
  }

  // ─── candidatos — búsqueda ────────────────────────────────────────────────

  async buscarCandidatos(q?: string, _sedeId?: number): Promise<CandidatoResponseDto[]> {
    const qb = this.candidatoRepo.createQueryBuilder('c').orderBy('c.apellidos').limit(20);
    if (q && q.trim()) {
      qb.where(
        'c.numeroDocumento LIKE :q OR c.nombres LIKE :q OR c.apellidos LIKE :q',
        { q: `%${q.trim()}%` },
      );
    }
    const items = await qb.getMany();
    return items.map((c) => this.serializeCandidato(c));
  }

  // ─── dotación — maestro ───────────────────────────────────────────────────

  async getDotacionMaestro(sedeId?: number, area?: string, cargo?: string, tipoContrato?: string, activosOnly?: boolean): Promise<MaestroDotacionResponseDto[]> {
    const qb = this.maestroDotacionRepo.createQueryBuilder('m');

    if (sedeId) qb.andWhere('(m.sedeId = :sedeId OR m.sedeId IS NULL)', { sedeId });
    if (area) qb.andWhere('m.area LIKE :area', { area: `%${area}%` });
    if (cargo) qb.andWhere('m.cargo LIKE :cargo', { cargo: `%${cargo}%` });
    if (tipoContrato) qb.andWhere('m.tipoContrato = :tipoContrato', { tipoContrato });
    if (activosOnly) qb.andWhere('m.activo = true');

    const items = await qb.orderBy('m.area').addOrderBy('m.cargo').getMany();
    return items.map((m) => this.serializeMaestroDotacion(m));
  }

  async crearMaestroDotacion(body: CrearMaestroDotacionDto, usuarioId?: number): Promise<MaestroDotacionResponseDto> {
    const maestro = await this.maestroDotacionRepo.save(
      this.maestroDotacionRepo.create({
        sedeId: body.sedeId as any,
        area: body.area,
        cargo: body.cargo,
        tipoContrato: body.tipoContrato,
        kitCodigo: body.kitCodigo,
        kitDescripcion: body.kitDescripcion,
        activo: body.activo ?? true,
      }),
    );

    await this.audit({ usuarioId, accion: 'CREAR_MAESTRO_DOTACION', entidad: 'GhMaestroDotacion', entidadId: maestro.id, detalle: { kitCodigo: body.kitCodigo, area: body.area } });

    return this.serializeMaestroDotacion(maestro);
  }

  // ─── dotación — entregas ──────────────────────────────────────────────────

  async getDotacionEntregas(sedeId?: number, estado?: string): Promise<DotacionEntregaResponseDto[]> {
    const qb = this.dotacionEntregaRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.candidato', 'candidato')
      .leftJoinAndSelect('e.entregador', 'entregador')
      .leftJoinAndSelect('e.maestroDotacion', 'maestroDotacion')
      .leftJoinAndSelect('e.detalles', 'detalles')
      .orderBy('e.created_at', 'DESC');

    if (estado) qb.andWhere('e.estadoEntrega = :estado', { estado });
    if (sedeId) qb.andWhere('(maestroDotacion.sedeId = :sedeId OR maestroDotacion.sedeId IS NULL OR e.maestroDotacionId IS NULL)', { sedeId });

    const entregas = await qb.getMany();
    return entregas.map((e) => this.serializeDotacionEntrega(e));
  }

  async crearEntregaDotacion(body: CrearDotacionEntregaDto, usuarioId?: number): Promise<DotacionEntregaResponseDto> {
    const candidato = await this.candidatoRepo.findOne({ where: { id: body.candidatoId } });
    if (!candidato) throw new NotFoundException('Candidato no encontrado.');

    let maestro: GhMaestroDotacion | null = null;
    if (body.maestroDotacionId) {
      maestro = await this.maestroDotacionRepo.findOne({ where: { id: body.maestroDotacionId } });
    }

    const entrega = await this.dotacionEntregaRepo.save(
      this.dotacionEntregaRepo.create({
        candidatoId: body.candidatoId,
        maestroDotacionId: maestro?.id ?? null,
        sesionOCitaId: body.sesionOCitaId ?? null,
        tipoReferencia: body.tipoReferencia ?? (body.sesionOCitaId ? 'DIRECTO' : null),
        area: body.area ?? maestro?.area ?? null,
        cargo: body.cargo ?? maestro?.cargo ?? null,
        estadoEntrega: GhDotacionEntregaEstado.PENDIENTE,
        entregadoPorUsuarioId: usuarioId ?? null,
        observaciones: body.observaciones ?? null,
      }),
    );

    await this.audit({ usuarioId, accion: 'CREAR_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entrega.id, detalle: { candidatoId: body.candidatoId, maestroId: maestro?.id } });

    const entregaConRelaciones = await this.dotacionEntregaRepo.findOne({
      where: { id: entrega.id },
      relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'],
    });
    return this.serializeDotacionEntrega(entregaConRelaciones!);
  }

  async agregarDetalleEntregaDotacion(entregaId: number, body: AgregarDetalleEntregaDto, usuarioId?: number): Promise<DotacionEntregaResponseDto> {
    const entrega = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles'] });
    if (!entrega) throw new NotFoundException('Entrega de dotación no encontrada.');

    const cantEsperada = body.cantidadEsperada ?? 1;
    const cantEntregada = body.cantidadEntregada ?? 0;
    const estadoItem = cantEntregada >= cantEsperada ? GhDotacionItemEstado.ENTREGADO
      : cantEntregada > 0 ? GhDotacionItemEstado.ENTREGADO
      : GhDotacionItemEstado.PENDIENTE;

    await this.dotacionDetalleRepo.save(
      this.dotacionDetalleRepo.create({
        entregaId,
        itemCodigo: body.itemCodigo,
        itemNombre: body.itemNombre,
        cantidadEsperada: cantEsperada,
        cantidadEntregada: cantEntregada,
        estadoItem,
        evidenciaUrl: body.evidenciaUrl as any,
      }),
    );

    await this.audit({ usuarioId, accion: 'AGREGAR_DETALLE_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entregaId });

    const entregaActualizada = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'] });
    return this.serializeDotacionEntrega(entregaActualizada!);
  }

  async cerrarEntregaDotacion(entregaId: number, usuarioId?: number): Promise<DotacionEntregaResponseDto> {
    const entrega = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'] });
    if (!entrega) throw new NotFoundException('Entrega de dotación no encontrada.');

    const detalles = entrega.detalles ?? [];
    const todosEntregados = detalles.length > 0 && detalles.every((d) => d.estadoItem === GhDotacionItemEstado.ENTREGADO);
    const algunoFaltante = detalles.some((d) => d.estadoItem === GhDotacionItemEstado.FALTANTE || d.cantidadEntregada < d.cantidadEsperada);

    entrega.estadoEntrega = todosEntregados ? GhDotacionEntregaEstado.COMPLETA
      : algunoFaltante ? GhDotacionEntregaEstado.PARCIAL
      : GhDotacionEntregaEstado.COMPLETA;
    entrega.fechaEntrega = new Date();

    await this.dotacionEntregaRepo.save(entrega);
    await this.audit({ usuarioId, accion: 'CERRAR_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entregaId, detalle: { estado: entrega.estadoEntrega } });

    return this.serializeDotacionEntrega(entrega);
  }
}
