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
exports.GhController = void 0;
const common_1 = require("@nestjs/common");
const gh_service_1 = require("./gh.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
const crear_cita_dto_1 = require("./dto/requests/crear-cita.dto");
const crear_cita_grupo_dto_1 = require("./dto/requests/crear-cita-grupo.dto");
const actualizar_cita_dto_1 = require("./dto/requests/actualizar-cita.dto");
const cambiar_estado_cita_dto_1 = require("./dto/requests/cambiar-estado-cita.dto");
const portal_confirmar_dto_1 = require("./dto/requests/portal-confirmar.dto");
const portal_reagendar_dto_1 = require("./dto/requests/portal-reagendar.dto");
const crear_sesion_induccion_dto_1 = require("./dto/requests/crear-sesion-induccion.dto");
const estado_sesion_induccion_dto_1 = require("./dto/requests/estado-sesion-induccion.dto");
const portal_induccion_dto_1 = require("./dto/requests/portal-induccion.dto");
const crear_maestro_dotacion_dto_1 = require("./dto/requests/crear-maestro-dotacion.dto");
const crear_dotacion_entrega_dto_1 = require("./dto/requests/crear-dotacion-entrega.dto");
const agregar_detalle_entrega_dto_1 = require("./dto/requests/agregar-detalle-entrega.dto");
const crear_importacion_dto_1 = require("./dto/requests/crear-importacion.dto");
const verificar_vigilante_dto_1 = require("./dto/requests/verificar-vigilante.dto");
let GhController = class GhController {
    ghService;
    constructor(ghService) {
        this.ghService = ghService;
    }
    async listTiposCita() {
        return this.ghService.listTiposCita();
    }
    async listEstadosCita() {
        return this.ghService.listEstadosCita();
    }
    async getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, page, perPage) {
        const p = page ? parseInt(page, 10) : 1;
        const pp = perPage ? parseInt(perPage, 10) : 20;
        return this.ghService.getCitas(sedeId, estado, tipoCita, busqueda, fechaDesde, fechaHasta, p, pp);
    }
    async getCita(id) {
        return this.ghService.getCita(id);
    }
    async crearCita(body, req) {
        return this.ghService.crearCita(body, req.user?.userId);
    }
    async crearCitasGrupo(body, req) {
        return this.ghService.crearCitasGrupo(body, req.user?.userId);
    }
    async actualizarCita(id, body, req) {
        return this.ghService.actualizarCita(id, body, req.user?.userId);
    }
    async cambiarEstadoPost(id, body, req) {
        return this.ghService.cambiarEstado(id, body, req.user?.userId);
    }
    async cambiarEstadoPatch(id, body, req) {
        return this.ghService.cambiarEstado(id, body, req.user?.userId);
    }
    async eliminarCita(id, req) {
        await this.ghService.eliminarCita(id, req.user?.userId);
        return { success: true };
    }
    async validarTokenPortal(token) {
        return this.ghService.validarPortal(token);
    }
    async portalConfirmar(token, body) {
        return this.ghService.portalConfirmar(token, body);
    }
    async portalReagendar(token, body) {
        return this.ghService.portalReagendar(token, body);
    }
    async validarTokenPortalInduccion(token) {
        return this.ghService.validarPortalInduccion(token);
    }
    async portalInduccionCheckin(token, body, req) {
        return this.ghService.portalInduccionCheckin(token, body, req.ip, req.headers['user-agent']);
    }
    async portalInduccionCheckout(token, body, req) {
        return this.ghService.portalInduccionCheckout(token, body, req.ip, req.headers['user-agent']);
    }
    async getDashboard(sedeId) {
        return this.ghService.getDashboard(sedeId);
    }
    async crearSesionInduccion(body, req) {
        return this.ghService.crearSesionInduccion(body, req.user?.userId);
    }
    async getInduccionesSesiones(sedeId, estadoSesion) {
        return this.ghService.getInduccionesSesiones(sedeId ? parseInt(sedeId, 10) : undefined, estadoSesion);
    }
    async getSesionInduccion(id) {
        return this.ghService.getSesionInduccion(id);
    }
    async cambiarEstadoSesionInduccion(id, body, req) {
        return this.ghService.cambiarEstadoSesionInduccion(id, body, req.user?.userId);
    }
    async generarCodigoCheckin(id, req) {
        return this.ghService.generarCodigoTemporalInduccion(id, 'CHECKIN', req.user?.userId);
    }
    async generarCodigoCheckout(id, req) {
        return this.ghService.generarCodigoTemporalInduccion(id, 'CHECKOUT', req.user?.userId);
    }
    async enviarLinksInduccion(id, req) {
        return this.ghService.enviarLinksInduccion(id, req.user?.userId);
    }
    async verificarVigilante(body, req) {
        return this.ghService.verificarVigilante(body, req.user?.userId);
    }
    async crearImportacion(body, req) {
        return this.ghService.crearImportacion(body, req.user?.userId);
    }
    async getImportacion(id) {
        return this.ghService.getImportacion(id);
    }
    async getDotacionMaestro(sedeId, area, cargo, tipoContrato, activosOnly) {
        return this.ghService.getDotacionMaestro(sedeId ? parseInt(sedeId, 10) : undefined, area, cargo, tipoContrato, activosOnly === 'true');
    }
    async crearMaestroDotacion(body, req) {
        return this.ghService.crearMaestroDotacion(body, req.user?.userId);
    }
    async buscarCandidatos(q, sedeId) {
        return this.ghService.buscarCandidatos(q, sedeId ? parseInt(sedeId, 10) : undefined);
    }
    async getDotacionEntregas(estado, sedeId) {
        return this.ghService.getDotacionEntregas(sedeId ? parseInt(sedeId, 10) : undefined, estado);
    }
    async crearEntregaDotacion(body, req) {
        return this.ghService.crearEntregaDotacion(body, req.user?.userId);
    }
    async agregarDetalleEntrega(id, body, req) {
        return this.ghService.agregarDetalleEntregaDotacion(id, body, req.user?.userId);
    }
    async cerrarEntrega(id, req) {
        return this.ghService.cerrarEntregaDotacion(id, req.user?.userId);
    }
};
exports.GhController = GhController;
__decorate([
    (0, common_1.Get)('catalogos/tipos-cita'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GhController.prototype, "listTiposCita", null);
__decorate([
    (0, common_1.Get)('catalogos/estados-cita'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GhController.prototype, "listEstadosCita", null);
__decorate([
    (0, common_1.Get)('citas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('tipo_cita')),
    __param(3, (0, common_1.Query)('busqueda')),
    __param(4, (0, common_1.Query)('fecha_desde')),
    __param(5, (0, common_1.Query)('fecha_hasta')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getCitas", null);
__decorate([
    (0, common_1.Get)('citas/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getCita", null);
__decorate([
    (0, common_1.Post)('citas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_cita_dto_1.CrearCitaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearCita", null);
__decorate([
    (0, common_1.Post)('citas/grupo'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_cita_grupo_dto_1.CrearCitaGrupoDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearCitasGrupo", null);
__decorate([
    (0, common_1.Put)('citas/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, actualizar_cita_dto_1.ActualizarCitaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "actualizarCita", null);
__decorate([
    (0, common_1.Post)('citas/:id/estado'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cambiar_estado_cita_dto_1.CambiarEstadoCitaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "cambiarEstadoPost", null);
__decorate([
    (0, common_1.Patch)('citas/:id/estado'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cambiar_estado_cita_dto_1.CambiarEstadoCitaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "cambiarEstadoPatch", null);
__decorate([
    (0, common_1.Delete)('citas/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "eliminarCita", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('portal/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "validarTokenPortal", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('portal/:token/confirmar'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, portal_confirmar_dto_1.PortalConfirmarDto]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "portalConfirmar", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('portal/:token/reagendar'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, portal_reagendar_dto_1.PortalReagendarDto]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "portalReagendar", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('portal/induccion/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "validarTokenPortalInduccion", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('portal/induccion/:token/checkin'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, portal_induccion_dto_1.PortalInduccionCodigoDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "portalInduccionCheckin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('portal/induccion/:token/checkout'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, portal_induccion_dto_1.PortalInduccionCodigoDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "portalInduccionCheckout", null);
__decorate([
    (0, common_1.Get)('dashboard/:sede_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('inducciones/sesiones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_sesion_induccion_dto_1.CrearSesionInduccionDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearSesionInduccion", null);
__decorate([
    (0, common_1.Get)('inducciones/sesiones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id')),
    __param(1, (0, common_1.Query)('estado_sesion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getInduccionesSesiones", null);
__decorate([
    (0, common_1.Get)('inducciones/sesiones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getSesionInduccion", null);
__decorate([
    (0, common_1.Post)('inducciones/sesiones/:id/estado'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, estado_sesion_induccion_dto_1.EstadoSesionInduccionDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "cambiarEstadoSesionInduccion", null);
__decorate([
    (0, common_1.Post)('inducciones/sesiones/:id/generar-codigo-checkin'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "generarCodigoCheckin", null);
__decorate([
    (0, common_1.Post)('inducciones/sesiones/:id/generar-codigo-checkout'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "generarCodigoCheckout", null);
__decorate([
    (0, common_1.Post)('inducciones/sesiones/:id/enviar-links'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "enviarLinksInduccion", null);
__decorate([
    (0, common_1.Post)('vigilante/verificar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verificar_vigilante_dto_1.VerificarVigilanteDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "verificarVigilante", null);
__decorate([
    (0, common_1.Post)('importaciones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_importacion_dto_1.CrearImportacionDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearImportacion", null);
__decorate([
    (0, common_1.Get)('importaciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getImportacion", null);
__decorate([
    (0, common_1.Get)('dotacion/maestro'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id')),
    __param(1, (0, common_1.Query)('area')),
    __param(2, (0, common_1.Query)('cargo')),
    __param(3, (0, common_1.Query)('tipo_contrato')),
    __param(4, (0, common_1.Query)('activos_only')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getDotacionMaestro", null);
__decorate([
    (0, common_1.Post)('dotacion/maestro'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_maestro_dotacion_dto_1.CrearMaestroDotacionDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearMaestroDotacion", null);
__decorate([
    (0, common_1.Get)('dotacion/candidatos/buscar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('sede_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "buscarCandidatos", null);
__decorate([
    (0, common_1.Get)('dotacion/entregas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('estado')),
    __param(1, (0, common_1.Query)('sede_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "getDotacionEntregas", null);
__decorate([
    (0, common_1.Post)('dotacion/entregas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_dotacion_entrega_dto_1.CrearDotacionEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "crearEntregaDotacion", null);
__decorate([
    (0, common_1.Post)('dotacion/entregas/:id/detalle'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, agregar_detalle_entrega_dto_1.AgregarDetalleEntregaDto, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "agregarDetalleEntrega", null);
__decorate([
    (0, common_1.Post)('dotacion/entregas/:id/cerrar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_GH, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GhController.prototype, "cerrarEntrega", null);
exports.GhController = GhController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('gh'),
    __metadata("design:paramtypes", [gh_service_1.GhService])
], GhController);
//# sourceMappingURL=gh.controller.js.map