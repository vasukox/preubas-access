"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const gh_cita_entity_1 = require("./entities/gh-cita.entity");
const gh_candidato_entity_1 = require("./entities/gh-candidato.entity");
const gh_portal_token_entity_1 = require("./entities/gh-portal-token.entity");
const gh_auditoria_entity_1 = require("./entities/gh-auditoria.entity");
const gh_sesion_induccion_entity_1 = require("./entities/gh-sesion-induccion.entity");
const gh_induccion_asistencia_entity_1 = require("./entities/gh-induccion-asistencia.entity");
const gh_maestro_dotacion_entity_1 = require("./entities/gh-maestro-dotacion.entity");
const gh_dotacion_entrega_entity_1 = require("./entities/gh-dotacion-entrega.entity");
const gh_dotacion_entrega_detalle_entity_1 = require("./entities/gh-dotacion-entrega-detalle.entity");
const gh_importacion_entity_1 = require("./entities/gh-importacion.entity");
const gh_importacion_detalle_entity_1 = require("./entities/gh-importacion-detalle.entity");
const gh_acceso_vigilancia_entity_1 = require("./entities/gh-acceso-vigilancia.entity");
const gh_enum_1 = require("../common/enums/gh.enum");
let GhService = class GhService {
    citaRepo;
    candidatoRepo;
    tokenRepo;
    auditoriaRepo;
    sesionInduccionRepo;
    asistenciaRepo;
    maestroDotacionRepo;
    dotacionEntregaRepo;
    dotacionDetalleRepo;
    importacionRepo;
    importacionDetalleRepo;
    accesoVigilanciaRepo;
    constructor(citaRepo, candidatoRepo, tokenRepo, auditoriaRepo, sesionInduccionRepo, asistenciaRepo, maestroDotacionRepo, dotacionEntregaRepo, dotacionDetalleRepo, importacionRepo, importacionDetalleRepo, accesoVigilanciaRepo) {
        this.citaRepo = citaRepo;
        this.candidatoRepo = candidatoRepo;
        this.tokenRepo = tokenRepo;
        this.auditoriaRepo = auditoriaRepo;
        this.sesionInduccionRepo = sesionInduccionRepo;
        this.asistenciaRepo = asistenciaRepo;
        this.maestroDotacionRepo = maestroDotacionRepo;
        this.dotacionEntregaRepo = dotacionEntregaRepo;
        this.dotacionDetalleRepo = dotacionDetalleRepo;
        this.importacionRepo = importacionRepo;
        this.importacionDetalleRepo = importacionDetalleRepo;
        this.accesoVigilanciaRepo = accesoVigilanciaRepo;
    }
    validateRangoFechas(inicio, fin) {
        if (fin.getTime() <= inicio.getTime()) {
            throw new common_1.BadRequestException('La fecha/hora fin debe ser mayor que inicio.');
        }
    }
    async upsertCandidato(candidatoData) {
        let candidato = await this.candidatoRepo.findOne({
            where: { tipoDocumento: candidatoData.tipoDocumento, numeroDocumento: candidatoData.numeroDocumento },
        });
        if (candidato) {
            candidato.nombres = candidatoData.nombres;
            candidato.apellidos = candidatoData.apellidos;
            candidato.email = (candidatoData.email ?? null);
            candidato.telefono = (candidatoData.telefono ?? null);
            return this.candidatoRepo.save(candidato);
        }
        return this.candidatoRepo.save(this.candidatoRepo.create({
            tipoDocumento: candidatoData.tipoDocumento,
            numeroDocumento: candidatoData.numeroDocumento,
            nombres: candidatoData.nombres,
            apellidos: candidatoData.apellidos,
            email: (candidatoData.email ?? null),
            telefono: (candidatoData.telefono ?? null),
        }));
    }
    async generateCitaCodigo(sedeId) {
        const seed = Math.floor(Date.now() / 1000);
        let codigo = `GH-${sedeId}-${seed}`;
        const existe = await this.citaRepo.findOne({ where: { codigo } });
        if (existe) {
            codigo = `${codigo}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }
        return codigo;
    }
    async createCitaWithPortalToken(params) {
        const codigo = await this.generateCitaCodigo(params.sedeId);
        const cita = await this.citaRepo.save(this.citaRepo.create({
            codigo,
            candidatoId: params.candidatoId,
            sedeId: params.sedeId,
            responsableId: params.responsableId,
            tipoCita: params.tipoCita,
            estado: gh_enum_1.GhEstadoCita.PROGRAMADA,
            fechaHoraInicio: params.fechaHoraInicio,
            fechaHoraFin: params.fechaHoraFin,
            observaciones: params.observaciones,
        }));
        await this.tokenRepo.save(this.tokenRepo.create({
            citaId: cita.id,
            token: (0, crypto_1.randomBytes)(18).toString('base64url'),
            expiraEn: cita.fechaHoraFin,
        }));
        return cita;
    }
    async audit(params) {
        await this.auditoriaRepo.save(this.auditoriaRepo.create({
            usuarioId: params.usuarioId,
            sedeId: params.sedeId,
            accion: params.accion,
            entidad: params.entidad,
            entidadId: params.entidadId,
            detalle: params.detalle,
        }));
    }
    normalizeTipoCita(tipoCita) {
        if (tipoCita === 'ENTREVISTA')
            return gh_enum_1.GhTipoCita.FIRMA_CONTRATO;
        return tipoCita;
    }
    serializeCandidato(candidato) {
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
    serializeCita(cita) {
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
        };
    }
    serializeAsistencia(asistencia) {
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
    async serializeSesion(sesion) {
        const asistentes = sesion.asistentes?.map((a) => this.serializeAsistencia(a)) ?? [];
        const candidatoIds = sesion.asistentes?.map((a) => a.candidatoId) ?? [];
        let relatedCitaIds = [];
        if (candidatoIds.length > 0) {
            const citas = await this.citaRepo.find({
                where: { candidato: { id: (0, typeorm_2.In)(candidatoIds) }, tipoCita: gh_enum_1.GhTipoCita.INDUCCION },
                select: ['id'],
            });
            relatedCitaIds = citas.map((c) => c.id);
        }
        return {
            id: sesion.id,
            sedeId: sesion.sedeId,
            area: sesion.area,
            tipoInduccion: sesion.tipoInduccion,
            tipoSesion: sesion.tipoSesion ?? gh_enum_1.GhTipoSesion.PRESENCIAL,
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
    serializeMaestroDotacion(m) {
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
    serializeDotacionEntrega(e) {
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
    serializeDetalleEntrega(d) {
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
    serializeImportacion(imp) {
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
    async getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, page = 1, perPage = 20) {
        const skip = (page - 1) * perPage;
        const query = this.citaRepo
            .createQueryBuilder('c')
            .where('c.sedeId = :sedeId', { sedeId })
            .leftJoinAndSelect('c.candidato', 'candidato');
        if (estado)
            query.andWhere('c.estado = :estado', { estado });
        if (tipoCita)
            query.andWhere('c.tipoCita = :tipoCita', { tipoCita });
        if (fechaDesde)
            query.andWhere('c.fechaHoraInicio >= :fechaDesde', { fechaDesde });
        if (fechaHasta)
            query.andWhere('c.fechaHoraFin <= :fechaHasta', { fechaHasta });
        if (busqueda) {
            query.andWhere('(candidato.nombres LIKE :b OR candidato.apellidos LIKE :b OR candidato.numeroDocumento LIKE :b)', { b: `%${busqueda}%` });
        }
        const items = await query.orderBy('c.fechaHoraInicio', 'DESC').skip(skip).take(perPage).getMany();
        return items.map((c) => this.serializeCita(c));
    }
    async getCita(citaId) {
        const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
        if (!cita)
            throw new common_1.NotFoundException('La cita no existe.');
        return this.serializeCita(cita);
    }
    async crearCita(body, responsableId) {
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
        return this.serializeCita(citaConRelaciones);
    }
    async crearCitasGrupo(body, responsableId) {
        const inicio = new Date(body.fechaHoraInicio);
        const fin = new Date(body.fechaHoraFin);
        this.validateRangoFechas(inicio, fin);
        const citasIds = [];
        const vistos = new Set();
        for (const cd of body.candidatos) {
            const key = `${cd.tipoDocumento}-${cd.numeroDocumento}`;
            if (vistos.has(key))
                continue;
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
        const citas = await this.citaRepo.find({ where: { id: (0, typeorm_2.In)(citasIds) }, relations: ['candidato'] });
        return citas.map((c) => this.serializeCita(c));
    }
    async actualizarCita(citaId, body, usuarioId) {
        const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
        if (!cita)
            throw new common_1.NotFoundException('La cita no existe.');
        const nuevoInicio = body.fechaHoraInicio ? new Date(body.fechaHoraInicio) : cita.fechaHoraInicio;
        const nuevoFin = body.fechaHoraFin ? new Date(body.fechaHoraFin) : cita.fechaHoraFin;
        this.validateRangoFechas(nuevoInicio, nuevoFin);
        if (body.tipoCita)
            cita.tipoCita = body.tipoCita;
        if (body.fechaHoraInicio)
            cita.fechaHoraInicio = new Date(body.fechaHoraInicio);
        if (body.fechaHoraFin)
            cita.fechaHoraFin = new Date(body.fechaHoraFin);
        if (body.observaciones !== undefined)
            cita.observaciones = body.observaciones;
        await this.citaRepo.save(cita);
        await this.audit({ usuarioId, sedeId: cita.sedeId, accion: 'ACTUALIZAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: body });
        return this.serializeCita(cita);
    }
    async cambiarEstado(citaId, body, usuarioId) {
        const cita = await this.citaRepo.findOne({ where: { id: citaId }, relations: ['candidato'] });
        if (!cita)
            throw new common_1.NotFoundException('La cita no existe.');
        const tipo = this.normalizeTipoCita(cita.tipoCita);
        if (tipo === gh_enum_1.GhTipoCita.INDUCCION && (body.estado === gh_enum_1.GhEstadoCita.EN_CURSO || body.estado === gh_enum_1.GhEstadoCita.FINALIZADA)) {
            throw new common_1.BadRequestException('Las citas de inducción no se gestionan desde agenda. Usa el submódulo de inducciones.');
        }
        cita.estado = body.estado;
        await this.citaRepo.save(cita);
        await this.audit({ usuarioId, sedeId: cita.sedeId, accion: 'CAMBIAR_ESTADO_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: { estado: body.estado, motivo: body.motivo } });
        return this.serializeCita(cita);
    }
    async eliminarCita(citaId, usuarioId) {
        const cita = await this.citaRepo.findOne({ where: { id: citaId } });
        if (!cita)
            throw new common_1.NotFoundException('La cita no existe.');
        const tokens = await this.tokenRepo.find({ where: { citaId: cita.id } });
        if (tokens.length > 0)
            await this.tokenRepo.remove(tokens);
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
    async validarPortal(token) {
        const tokenObj = await this.tokenRepo.findOne({
            where: { token },
            relations: ['cita', 'cita.candidato'],
        });
        if (!tokenObj || !tokenObj.cita) {
            throw new common_1.NotFoundException('Token de portal inválido o expirado.');
        }
        return {
            token: tokenObj.token,
            vigente: true,
            expiraEn: tokenObj.expiraEn.toISOString(),
            cita: this.serializeCita(tokenObj.cita),
        };
    }
    async portalConfirmar(token, body) {
        const tokenObj = await this.tokenRepo.findOne({ where: { token }, relations: ['cita', 'cita.candidato'] });
        if (!tokenObj || !tokenObj.cita)
            throw new common_1.NotFoundException('Token de portal inválido o expirado.');
        const cita = tokenObj.cita;
        cita.estado = body.confirmada ? gh_enum_1.GhEstadoCita.CONFIRMADA : gh_enum_1.GhEstadoCita.CANCELADA;
        tokenObj.usadoEn = new Date();
        await this.citaRepo.save(cita);
        await this.tokenRepo.save(tokenObj);
        await this.audit({ sedeId: cita.sedeId, accion: 'PORTAL_CONFIRMAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: { confirmada: body.confirmada } });
        return { token, accion: body.confirmada ? 'CONFIRMAR' : 'CANCELAR', cita: this.serializeCita(cita) };
    }
    async portalReagendar(token, body) {
        const tokenObj = await this.tokenRepo.findOne({ where: { token }, relations: ['cita', 'cita.candidato'] });
        if (!tokenObj || !tokenObj.cita)
            throw new common_1.NotFoundException('Token de portal inválido o expirado.');
        const inicio = new Date(body.fechaHoraInicio);
        const fin = new Date(body.fechaHoraFin);
        this.validateRangoFechas(inicio, fin);
        const cita = tokenObj.cita;
        cita.fechaHoraInicio = inicio;
        cita.fechaHoraFin = fin;
        cita.estado = gh_enum_1.GhEstadoCita.PROGRAMADA;
        tokenObj.usadoEn = new Date();
        await this.citaRepo.save(cita);
        await this.tokenRepo.save(tokenObj);
        await this.audit({ sedeId: cita.sedeId, accion: 'PORTAL_REAGENDAR_CITA', entidad: 'GhCita', entidadId: cita.id, detalle: body });
        return { token, accion: 'REAGENDAR', cita: this.serializeCita(cita) };
    }
    async getDashboard(sedeId) {
        const hoyInicio = new Date();
        hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date();
        hoyFin.setHours(23, 59, 59, 999);
        const [citasHoyTotal, citasHoyConfirmadas, citasHoyNoAsistio, citasEnCurso] = await Promise.all([
            this.citaRepo.count({ where: { sedeId, fechaHoraInicio: (0, typeorm_2.Between)(hoyInicio, hoyFin) } }),
            this.citaRepo.count({ where: { sedeId, estado: gh_enum_1.GhEstadoCita.CONFIRMADA, fechaHoraInicio: (0, typeorm_2.Between)(hoyInicio, hoyFin) } }),
            this.citaRepo.count({ where: { sedeId, estado: gh_enum_1.GhEstadoCita.NO_ASISTIO, fechaHoraInicio: (0, typeorm_2.Between)(hoyInicio, hoyFin) } }),
            this.citaRepo.count({ where: { sedeId, estado: gh_enum_1.GhEstadoCita.EN_CURSO } }),
        ]);
        return { citasHoyTotal, citasHoyConfirmadas, citasHoyNoAsistio, citasEnCurso };
    }
    async crearSesionInduccion(body, responsableId) {
        const inicio = new Date(body.fechaHoraInicio);
        const fin = new Date(body.fechaHoraFin);
        this.validateRangoFechas(inicio, fin);
        const sesion = await this.sesionInduccionRepo.save(this.sesionInduccionRepo.create({
            sedeId: body.sedeId,
            area: body.area,
            tipoInduccion: body.tipoInduccion,
            tipoSesion: body.tipoSesion ?? gh_enum_1.GhTipoSesion.PRESENCIAL,
            linkVirtual: body.linkVirtual,
            salaFisica: body.salaFisica,
            descripcion: body.descripcion,
            capacidadMaxima: body.capacidadMaxima,
            responsableUsuarioId: body.responsableUsuarioId ?? undefined,
            fechaHoraInicio: inicio,
            fechaHoraFin: fin,
            estadoSesion: gh_enum_1.GhEstadoSesionInduccion.PROGRAMADA,
        }));
        const asistencias = [];
        if (body.citaIds && body.citaIds.length > 0) {
            const citas = await this.citaRepo.find({ where: { id: (0, typeorm_2.In)(body.citaIds) }, relations: ['candidato'] });
            for (const cita of citas) {
                if (!cita.candidato)
                    continue;
                asistencias.push(this.asistenciaRepo.create({
                    sesionId: sesion.id,
                    candidatoId: cita.candidato.id,
                    tokenAutogestion: (0, crypto_1.randomBytes)(48).toString('hex'),
                    estadoAsistencia: gh_enum_1.GhEstadoAsistenciaInduccion.PENDIENTE,
                }));
                cita.estado = gh_enum_1.GhEstadoCita.EN_CURSO;
                cita.fechaHoraInicio = inicio;
                cita.fechaHoraFin = fin;
                await this.citaRepo.save(cita);
            }
        }
        if (body.asistentes && body.asistentes.length > 0) {
            for (const asistente of body.asistentes) {
                const candidato = await this.upsertCandidato(asistente);
                asistencias.push(this.asistenciaRepo.create({
                    sesionId: sesion.id,
                    candidatoId: candidato.id,
                    tokenAutogestion: (0, crypto_1.randomBytes)(48).toString('hex'),
                    estadoAsistencia: gh_enum_1.GhEstadoAsistenciaInduccion.PENDIENTE,
                }));
            }
        }
        if (asistencias.length > 0)
            await this.asistenciaRepo.save(asistencias);
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
    async getInduccionesSesiones(sedeId, estadoSesion) {
        const qb = this.sesionInduccionRepo
            .createQueryBuilder('sesion')
            .leftJoinAndSelect('sesion.asistentes', 'asistentes')
            .leftJoinAndSelect('asistentes.candidato', 'candidato')
            .orderBy('sesion.fechaHoraInicio', 'DESC');
        if (sedeId)
            qb.andWhere('sesion.sedeId = :sedeId', { sedeId });
        if (estadoSesion)
            qb.andWhere('sesion.estadoSesion = :estadoSesion', { estadoSesion });
        const sesiones = await qb.getMany();
        return Promise.all(sesiones.map((s) => this.serializeSesion(s)));
    }
    async getSesionInduccion(id) {
        const sesion = await this.sesionInduccionRepo.findOne({
            where: { id },
            relations: ['asistentes', 'asistentes.candidato'],
        });
        if (!sesion)
            throw new common_1.NotFoundException('La sesión de inducción no existe.');
        return this.serializeSesion(sesion);
    }
    async cambiarEstadoSesionInduccion(id, body, usuarioId) {
        const sesion = await this.sesionInduccionRepo.findOne({ where: { id }, relations: ['asistentes'] });
        if (!sesion)
            throw new common_1.NotFoundException('La sesión de inducción no existe.');
        sesion.estadoSesion = body.estadoSesion;
        if (['FINALIZADA', 'CERRADA'].includes(body.estadoSesion)) {
            sesion.fechaCierre = new Date();
        }
        await this.sesionInduccionRepo.save(sesion);
        if (['FINALIZADA', 'CERRADA', 'CANCELADA'].includes(body.estadoSesion)) {
            const candidatoIds = (sesion.asistentes ?? []).map((a) => a.candidatoId);
            if (candidatoIds.length > 0) {
                const citas = await this.citaRepo.find({
                    where: { candidato: { id: (0, typeorm_2.In)(candidatoIds) }, tipoCita: gh_enum_1.GhTipoCita.INDUCCION, fechaHoraInicio: sesion.fechaHoraInicio },
                });
                for (const cita of citas) {
                    cita.estado = body.estadoSesion === 'CANCELADA' ? gh_enum_1.GhEstadoCita.CANCELADA : gh_enum_1.GhEstadoCita.FINALIZADA;
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
    async generarCodigoTemporalInduccion(id, tipo, usuarioId) {
        const sesion = await this.sesionInduccionRepo.findOne({ where: { id } });
        if (!sesion)
            throw new common_1.NotFoundException('La sesión de inducción no existe.');
        const codigo = Math.random().toString().slice(2, 8);
        const expiraEn = new Date();
        expiraEn.setMinutes(expiraEn.getMinutes() + 5);
        if (tipo === 'CHECKIN') {
            sesion.codigoCheckinActual = codigo;
        }
        else {
            sesion.codigoCheckoutActual = codigo;
        }
        await this.sesionInduccionRepo.save(sesion);
        await this.audit({ sedeId: sesion.sedeId, accion: `GENERAR_CODIGO_${tipo}`, entidad: 'GhSesionInduccion', entidadId: sesion.id, detalle: { expiraEn: expiraEn.toISOString() }, usuarioId });
        return { sesionId: id, tipo, codigo, expiraEn: expiraEn.toISOString() };
    }
    async enviarLinksInduccion(id, _usuarioId) {
        const sesion = await this.sesionInduccionRepo.findOne({ where: { id } });
        if (!sesion)
            throw new common_1.NotFoundException('La sesión de inducción no existe.');
        return { enviados: 0, mensaje: 'Funcionalidad de envío pendiente de configuración.' };
    }
    async validarPortalInduccion(token) {
        const asistencia = await this.asistenciaRepo.findOne({
            where: { tokenAutogestion: token },
            relations: ['sesion', 'candidato'],
        });
        if (!asistencia || !asistencia.sesion || !asistencia.candidato) {
            throw new common_1.NotFoundException('Token de inducción inválido.');
        }
        const sesion = asistencia.sesion;
        if (sesion.estadoSesion === gh_enum_1.GhEstadoSesionInduccion.CANCELADA) {
            throw new common_1.BadRequestException('La sesión de inducción se encuentra cancelada.');
        }
        const ventanaHabilitada = sesion.estadoSesion === gh_enum_1.GhEstadoSesionInduccion.EN_CURSO;
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
    async portalInduccionCheckin(token, body, ip, userAgent) {
        const asistencia = await this.asistenciaRepo.findOne({ where: { tokenAutogestion: token }, relations: ['sesion'] });
        if (!asistencia || !asistencia.sesion)
            throw new common_1.NotFoundException('Token de inducción inválido.');
        if (asistencia.intentosCodigo >= 5) {
            throw new common_1.BadRequestException('Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.');
        }
        const sesion = asistencia.sesion;
        if (!sesion.codigoCheckinActual) {
            throw new common_1.BadRequestException('No hay código de check-in activo.');
        }
        if (body.codigo !== sesion.codigoCheckinActual) {
            asistencia.intentosCodigo += 1;
            asistencia.ultimoErrorCodigo = 'Código de check-in inválido';
            await this.asistenciaRepo.save(asistencia);
            throw new common_1.BadRequestException(`Código temporal inválido. Intento ${asistencia.intentosCodigo} de 5.`);
        }
        asistencia.checkinAt = new Date();
        asistencia.estadoAsistencia = gh_enum_1.GhEstadoAsistenciaInduccion.EN_SESION;
        asistencia.ipEntrada = ip;
        asistencia.userAgentEntrada = userAgent;
        asistencia.ultimoErrorCodigo = null;
        asistencia.intentosCodigo = 0;
        await this.asistenciaRepo.save(asistencia);
        await this.audit({ sedeId: sesion.sedeId, accion: 'PORTAL_INDUCCION_CHECKIN', entidad: 'GhInduccionAsistencia', entidadId: asistencia.id, detalle: { sesionId: sesion.id } });
        return { token, accion: 'CHECKIN', estadoAsistencia: gh_enum_1.GhEstadoAsistenciaInduccion.EN_SESION, timestamp: asistencia.checkinAt.toISOString() };
    }
    async portalInduccionCheckout(token, body, ip, userAgent) {
        const asistencia = await this.asistenciaRepo.findOne({ where: { tokenAutogestion: token }, relations: ['sesion'] });
        if (!asistencia || !asistencia.sesion)
            throw new common_1.NotFoundException('Token de inducción inválido.');
        if (asistencia.intentosCodigo >= 5) {
            throw new common_1.BadRequestException('Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.');
        }
        if (!asistencia.checkinAt) {
            throw new common_1.BadRequestException('No puedes registrar salida sin check-in previo.');
        }
        const sesion = asistencia.sesion;
        if (!sesion.codigoCheckoutActual) {
            throw new common_1.BadRequestException('No hay código de check-out activo.');
        }
        if (body.codigo !== sesion.codigoCheckoutActual) {
            asistencia.intentosCodigo += 1;
            asistencia.ultimoErrorCodigo = 'Código de check-out inválido';
            await this.asistenciaRepo.save(asistencia);
            throw new common_1.BadRequestException(`Código temporal inválido. Intento ${asistencia.intentosCodigo} de 5.`);
        }
        asistencia.checkoutAt = new Date();
        asistencia.estadoAsistencia = gh_enum_1.GhEstadoAsistenciaInduccion.CHECKOUT_OK;
        asistencia.ipSalida = ip;
        asistencia.userAgentSalida = userAgent;
        asistencia.ultimoErrorCodigo = null;
        asistencia.intentosCodigo = 0;
        await this.asistenciaRepo.save(asistencia);
        return { token, accion: 'CHECKOUT', estadoAsistencia: gh_enum_1.GhEstadoAsistenciaInduccion.CHECKOUT_OK, timestamp: asistencia.checkoutAt.toISOString() };
    }
    async verificarVigilante(body, vigilanteId) {
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
                estado: (0, typeorm_2.In)([gh_enum_1.GhEstadoCita.PROGRAMADA, gh_enum_1.GhEstadoCita.CONFIRMADA]),
                fechaHoraInicio: (0, typeorm_2.Between)(ventanaInicio, ventanaFin),
            },
            relations: ['candidato'],
            order: { fechaHoraInicio: 'ASC' },
        });
        if (!cita) {
            return { estado: 'NO_AUTORIZADO', mensaje: 'No tiene cita activa en esta sede para el horario actual.', cita: null };
        }
        await this.accesoVigilanciaRepo.save(this.accesoVigilanciaRepo.create({
            citaId: cita.id,
            sedeId: body.sedeId,
            vigilanteId: vigilanteId,
            tipoAcceso: 'ENTRADA',
            metodo: 'MANUAL',
        }));
        return { estado: 'AUTORIZADO', mensaje: 'Acceso autorizado.', cita: this.serializeCita(cita) };
    }
    async crearImportacion(body, usuarioId) {
        const importacion = await this.importacionRepo.save(this.importacionRepo.create({
            sedeId: body.sedeId,
            creadoPor: usuarioId,
            nombreArchivo: body.nombreArchivo,
            estado: gh_enum_1.GhImportacionEstado.PENDIENTE,
            filasTotales: 0,
            filasExitosas: 0,
            filasFallidas: 0,
        }));
        await this.audit({ usuarioId, sedeId: body.sedeId, accion: 'CREAR_IMPORTACION', entidad: 'GhImportacion', entidadId: importacion.id, detalle: { nombreArchivo: body.nombreArchivo } });
        return this.serializeImportacion(importacion);
    }
    async getImportacion(id) {
        const importacion = await this.importacionRepo.findOne({
            where: { id },
            relations: ['detalles'],
        });
        if (!importacion)
            throw new common_1.NotFoundException('Importación no encontrada.');
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
    async buscarCandidatos(q, _sedeId) {
        const qb = this.candidatoRepo.createQueryBuilder('c').orderBy('c.apellidos').limit(20);
        if (q && q.trim()) {
            qb.where('c.numeroDocumento LIKE :q OR c.nombres LIKE :q OR c.apellidos LIKE :q', { q: `%${q.trim()}%` });
        }
        const items = await qb.getMany();
        return items.map((c) => this.serializeCandidato(c));
    }
    async getDotacionMaestro(sedeId, area, cargo, tipoContrato, activosOnly) {
        const qb = this.maestroDotacionRepo.createQueryBuilder('m');
        if (sedeId)
            qb.andWhere('(m.sedeId = :sedeId OR m.sedeId IS NULL)', { sedeId });
        if (area)
            qb.andWhere('m.area LIKE :area', { area: `%${area}%` });
        if (cargo)
            qb.andWhere('m.cargo LIKE :cargo', { cargo: `%${cargo}%` });
        if (tipoContrato)
            qb.andWhere('m.tipoContrato = :tipoContrato', { tipoContrato });
        if (activosOnly)
            qb.andWhere('m.activo = true');
        const items = await qb.orderBy('m.area').addOrderBy('m.cargo').getMany();
        return items.map((m) => this.serializeMaestroDotacion(m));
    }
    async crearMaestroDotacion(body, usuarioId) {
        const maestro = await this.maestroDotacionRepo.save(this.maestroDotacionRepo.create({
            sedeId: body.sedeId,
            area: body.area,
            cargo: body.cargo,
            tipoContrato: body.tipoContrato,
            kitCodigo: body.kitCodigo,
            kitDescripcion: body.kitDescripcion,
            activo: body.activo ?? true,
        }));
        await this.audit({ usuarioId, accion: 'CREAR_MAESTRO_DOTACION', entidad: 'GhMaestroDotacion', entidadId: maestro.id, detalle: { kitCodigo: body.kitCodigo, area: body.area } });
        return this.serializeMaestroDotacion(maestro);
    }
    async getDotacionEntregas(sedeId, estado) {
        const qb = this.dotacionEntregaRepo.createQueryBuilder('e')
            .leftJoinAndSelect('e.candidato', 'candidato')
            .leftJoinAndSelect('e.entregador', 'entregador')
            .leftJoinAndSelect('e.maestroDotacion', 'maestroDotacion')
            .leftJoinAndSelect('e.detalles', 'detalles')
            .orderBy('e.created_at', 'DESC');
        if (estado)
            qb.andWhere('e.estadoEntrega = :estado', { estado });
        if (sedeId)
            qb.andWhere('(maestroDotacion.sedeId = :sedeId OR maestroDotacion.sedeId IS NULL OR e.maestroDotacionId IS NULL)', { sedeId });
        const entregas = await qb.getMany();
        return entregas.map((e) => this.serializeDotacionEntrega(e));
    }
    async crearEntregaDotacion(body, usuarioId) {
        const candidato = await this.candidatoRepo.findOne({ where: { id: body.candidatoId } });
        if (!candidato)
            throw new common_1.NotFoundException('Candidato no encontrado.');
        let maestro = null;
        if (body.maestroDotacionId) {
            maestro = await this.maestroDotacionRepo.findOne({ where: { id: body.maestroDotacionId } });
        }
        const entrega = await this.dotacionEntregaRepo.save(this.dotacionEntregaRepo.create({
            candidatoId: body.candidatoId,
            maestroDotacionId: maestro?.id ?? null,
            sesionOCitaId: body.sesionOCitaId ?? null,
            tipoReferencia: body.tipoReferencia ?? (body.sesionOCitaId ? 'DIRECTO' : null),
            area: body.area ?? maestro?.area ?? null,
            cargo: body.cargo ?? maestro?.cargo ?? null,
            estadoEntrega: gh_enum_1.GhDotacionEntregaEstado.PENDIENTE,
            entregadoPorUsuarioId: usuarioId ?? null,
            observaciones: body.observaciones ?? null,
        }));
        await this.audit({ usuarioId, accion: 'CREAR_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entrega.id, detalle: { candidatoId: body.candidatoId, maestroId: maestro?.id } });
        const entregaConRelaciones = await this.dotacionEntregaRepo.findOne({
            where: { id: entrega.id },
            relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'],
        });
        return this.serializeDotacionEntrega(entregaConRelaciones);
    }
    async agregarDetalleEntregaDotacion(entregaId, body, usuarioId) {
        const entrega = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles'] });
        if (!entrega)
            throw new common_1.NotFoundException('Entrega de dotación no encontrada.');
        const cantEsperada = body.cantidadEsperada ?? 1;
        const cantEntregada = body.cantidadEntregada ?? 0;
        const estadoItem = cantEntregada >= cantEsperada ? gh_enum_1.GhDotacionItemEstado.ENTREGADO
            : cantEntregada > 0 ? gh_enum_1.GhDotacionItemEstado.ENTREGADO
                : gh_enum_1.GhDotacionItemEstado.PENDIENTE;
        await this.dotacionDetalleRepo.save(this.dotacionDetalleRepo.create({
            entregaId,
            itemCodigo: body.itemCodigo,
            itemNombre: body.itemNombre,
            cantidadEsperada: cantEsperada,
            cantidadEntregada: cantEntregada,
            estadoItem,
            evidenciaUrl: body.evidenciaUrl,
        }));
        await this.audit({ usuarioId, accion: 'AGREGAR_DETALLE_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entregaId });
        const entregaActualizada = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'] });
        return this.serializeDotacionEntrega(entregaActualizada);
    }
    async cerrarEntregaDotacion(entregaId, usuarioId) {
        const entrega = await this.dotacionEntregaRepo.findOne({ where: { id: entregaId }, relations: ['detalles', 'candidato', 'entregador', 'maestroDotacion'] });
        if (!entrega)
            throw new common_1.NotFoundException('Entrega de dotación no encontrada.');
        const detalles = entrega.detalles ?? [];
        const todosEntregados = detalles.length > 0 && detalles.every((d) => d.estadoItem === gh_enum_1.GhDotacionItemEstado.ENTREGADO);
        const algunoFaltante = detalles.some((d) => d.estadoItem === gh_enum_1.GhDotacionItemEstado.FALTANTE || d.cantidadEntregada < d.cantidadEsperada);
        entrega.estadoEntrega = todosEntregados ? gh_enum_1.GhDotacionEntregaEstado.COMPLETA
            : algunoFaltante ? gh_enum_1.GhDotacionEntregaEstado.PARCIAL
                : gh_enum_1.GhDotacionEntregaEstado.COMPLETA;
        entrega.fechaEntrega = new Date();
        await this.dotacionEntregaRepo.save(entrega);
        await this.audit({ usuarioId, accion: 'CERRAR_ENTREGA_DOTACION', entidad: 'GhDotacionEntrega', entidadId: entregaId, detalle: { estado: entrega.estadoEntrega } });
        return this.serializeDotacionEntrega(entrega);
    }
};
exports.GhService = GhService;
exports.GhService = GhService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gh_cita_entity_1.GhCita)),
    __param(1, (0, typeorm_1.InjectRepository)(gh_candidato_entity_1.GhCandidato)),
    __param(2, (0, typeorm_1.InjectRepository)(gh_portal_token_entity_1.GhPortalToken)),
    __param(3, (0, typeorm_1.InjectRepository)(gh_auditoria_entity_1.GhAuditoria)),
    __param(4, (0, typeorm_1.InjectRepository)(gh_sesion_induccion_entity_1.GhSesionInduccion)),
    __param(5, (0, typeorm_1.InjectRepository)(gh_induccion_asistencia_entity_1.GhInduccionAsistencia)),
    __param(6, (0, typeorm_1.InjectRepository)(gh_maestro_dotacion_entity_1.GhMaestroDotacion)),
    __param(7, (0, typeorm_1.InjectRepository)(gh_dotacion_entrega_entity_1.GhDotacionEntrega)),
    __param(8, (0, typeorm_1.InjectRepository)(gh_dotacion_entrega_detalle_entity_1.GhDotacionEntregaDetalle)),
    __param(9, (0, typeorm_1.InjectRepository)(gh_importacion_entity_1.GhImportacion)),
    __param(10, (0, typeorm_1.InjectRepository)(gh_importacion_detalle_entity_1.GhImportacionDetalle)),
    __param(11, (0, typeorm_1.InjectRepository)(gh_acceso_vigilancia_entity_1.GhAccesoVigilancia)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GhService);
//# sourceMappingURL=gh.service.js.map