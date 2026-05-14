"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HseController = exports.ActualizarProveedorFrontendDto = exports.CrearProveedorFrontendDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const hse_service_1 = require("./hse.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const rol_enum_1 = require("../common/enums/rol.enum");
const autogestion_token_guard_1 = require("../common/guards/autogestion-token.guard");
const autorizacion_dto_1 = require("./dto/autorizacion.dto");
const contratista_dto_1 = require("./dto/contratista.dto");
const autogestion_dto_1 = require("./dto/autogestion.dto");
const acceso_dto_1 = require("./dto/acceso.dto");
const cumplimiento_dto_1 = require("./dto/cumplimiento.dto");
const excepcion_dto_1 = require("./dto/excepcion.dto");
const autorizacion_service_1 = require("./services/autorizacion.service");
const autogestion_service_1 = require("./services/autogestion.service");
const acceso_service_1 = require("./services/acceso.service");
const cumplimiento_service_1 = require("./services/cumplimiento.service");
const excepcion_service_1 = require("./services/excepcion.service");
const reportes_service_1 = require("./services/reportes.service");
const upload_security_service_1 = require("./services/upload-security.service");
const proveedor_service_1 = require("../persona/proveedor.service");
const platform_express_1 = require("@nestjs/platform-express");
const common_2 = require("@nestjs/common");
const fs = __importStar(require("fs"));
class CrearProveedorFrontendDto {
    nombre;
    nit;
}
exports.CrearProveedorFrontendDto = CrearProveedorFrontendDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearProveedorFrontendDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearProveedorFrontendDto.prototype, "nit", void 0);
class ActualizarProveedorFrontendDto {
    nombre;
    nit;
    activo;
}
exports.ActualizarProveedorFrontendDto = ActualizarProveedorFrontendDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarProveedorFrontendDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActualizarProveedorFrontendDto.prototype, "nit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ActualizarProveedorFrontendDto.prototype, "activo", void 0);
let HseController = class HseController {
    hseService;
    autorizacionService;
    autogestionService;
    accesoService;
    cumplimientoService;
    excepcionService;
    reportesService;
    proveedorService;
    uploadSecurityService;
    constructor(hseService, autorizacionService, autogestionService, accesoService, cumplimientoService, excepcionService, reportesService, proveedorService, uploadSecurityService) {
        this.hseService = hseService;
        this.autorizacionService = autorizacionService;
        this.autogestionService = autogestionService;
        this.accesoService = accesoService;
        this.cumplimientoService = cumplimientoService;
        this.excepcionService = excepcionService;
        this.reportesService = reportesService;
        this.proveedorService = proveedorService;
        this.uploadSecurityService = uploadSecurityService;
    }
    async getSedes(req) {
        return this.hseService.getCatalogosSedes(req.user || {});
    }
    async getEps() {
        return this.hseService.getCatalogosEps();
    }
    async getArl() {
        return this.hseService.getCatalogosArl();
    }
    async getAfp() {
        return this.hseService.getCatalogosAfp();
    }
    async getNormas(sedeId) {
        return this.hseService.getCatalogosNormas(sedeId);
    }
    async getProveedores() {
        const proveedores = await this.proveedorService.findActivos();
        return proveedores.map(p => ({ id: p.id, nombre: p.nomProveedor, nit: p.nitProveedor ?? '', activo: p.estadoProv }));
    }
    async crearProveedor(body) {
        const p = await this.proveedorService.create({
            nomProveedor: body.nombre,
            nitProveedor: body.nit,
            estadoProv: true,
        });
        return { id: p.id, nombre: p.nomProveedor, activo: p.estadoProv };
    }
    async actualizarProveedor(id, body) {
        const p = await this.proveedorService.update(id, {
            nomProveedor: body.nombre,
            nitProveedor: body.nit,
            estadoProv: body.activo !== undefined ? body.activo : undefined,
        });
        return { id: p.id, nombre: p.nomProveedor, activo: p.estadoProv };
    }
    async eliminarProveedor(id) {
        return this.proveedorService.remove(id);
    }
    async getAutorizaciones(sedeId, estado, page, perPage) {
        const p = page ? parseInt(page, 10) : 1;
        const pp = perPage ? parseInt(perPage, 10) : 20;
        const result = await this.autorizacionService.findAll(sedeId, estado, p, pp);
        return result.items;
    }
    async getAutorizacion(id) {
        return this.autorizacionService.findOne(id);
    }
    async createAutorizacion(req, createDto) {
        return this.autorizacionService.create(createDto, req.user?.id);
    }
    async updateAutorizacion(id, updateDto) {
        return this.autorizacionService.update(id, updateDto);
    }
    async deleteAutorizacion(id) {
        return this.autorizacionService.delete(id);
    }
    async cambiarEstadoAutorizacion(id, changeEstadoDto) {
        return this.autorizacionService.cambiarEstado(id, changeEstadoDto);
    }
    async getContratistas(id) {
        return this.autorizacionService.getContratistas(id);
    }
    async addContratistas(id, contratistasDto) {
        return this.autorizacionService.addContratistas(id, contratistasDto);
    }
    async generarTokenContratista(id) {
        return this.autorizacionService.generarTokenContratista(id);
    }
    async renovarTokenFrontend(id) {
        const result = await this.autorizacionService.generarTokenContratista(id);
        return result.token;
    }
    async getContratista(id) {
        return this.autorizacionService.findOneContratista(id);
    }
    async aprobarContratista(id, req) {
        return this.autorizacionService.aprobarContratista(id, req.user?.id);
    }
    async denegarContratista(id, motivo, req) {
        return this.autorizacionService.denegarContratista(id, motivo, req.user?.id);
    }
    async actualizarProveedorContratista(id, proveedorId) {
        return this.autorizacionService.actualizarProveedorContratista(id, proveedorId ?? null);
    }
    async eliminarContratista(id, dto, req) {
        return this.autorizacionService.eliminarContratista(id, dto.motivo, req.user?.id);
    }
    async eliminarAdjuntoContratista(id, dto) {
        return this.autorizacionService.eliminarAdjuntoContratista(id, dto);
    }
    async getAutogestionDatos(req) {
        return this.autogestionService.getDatosIniciales(req.contratista);
    }
    async uploadArchivo(req, token, modulo, campo, archivo) {
        if (!archivo) {
            throw new common_1.BadRequestException('Archivo requerido');
        }
        return this.uploadSecurityService.saveHseAutogestionFile(req.contratista.id, modulo, campo, archivo);
    }
    async guardarDatosPersonales(req, dto) {
        return this.autogestionService.guardarDatosPersonales(req.contratista.id, dto);
    }
    async guardarClasificacion(req, dto) {
        return this.autogestionService.guardarClasificacion(req.contratista.id, dto);
    }
    async guardarSeguridadSocial(req, payload) {
        const dto = Array.isArray(payload) ? payload : (payload?.personas || []);
        return this.autogestionService.guardarSeguridadSocial(req.contratista.id, dto);
    }
    async guardarCertificaciones(req, dto) {
        return this.autogestionService.guardarCertificaciones(req.contratista.id, dto);
    }
    async guardarExamenMedico(req, dto) {
        return this.autogestionService.guardarExamenMedico(req.contratista.id, dto);
    }
    async guardarContactoEmergencia(req, dto) {
        return this.autogestionService.guardarContactoEmergencia(req.contratista.id, dto);
    }
    async guardarAceptacionNormas(req, dto) {
        return this.autogestionService.guardarAceptacionNormas(req.contratista.id, dto);
    }
    async guardarAceptacionNormasFrontend(req, dto) {
        return this.autogestionService.guardarAceptacionNormas(req.contratista.id, dto);
    }
    async finalizarAutogestion(req) {
        return this.autogestionService.finalizarAutogestion(req.contratista.id);
    }
    async getDashboard(sedeId) {
        return this.hseService.getDashboard(sedeId);
    }
    async registrarEntrada(req, dto) {
        return this.accesoService.registrarEntrada(dto.contratistaId, dto.sedeId, req.user?.id, dto.metodo, dto.observacion, dto.ubicacionId);
    }
    async registrarSalida(req, dto) {
        return this.accesoService.registrarSalida(dto.contratistaId, dto.sedeId, req.user?.id, dto.metodo, dto.observacion, dto.ubicacionId);
    }
    async getAccesosSede(sedeId, limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        const safeLimit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 200)
            : 50;
        return this.accesoService.getHistorialSede(sedeId, safeLimit);
    }
    async getPersonasDentro(sedeId) {
        return this.accesoService.getPersonasDentro(sedeId);
    }
    async verificarAcceso(dto) {
        return this.accesoService.verificarAcceso(dto.numeroDocumento, dto.sedeId);
    }
    async registrarAccesoVigilante(req, dto) {
        return this.accesoService.registrarAcceso(dto, req.user?.id);
    }
    async getCumplimiento(id) {
        return this.cumplimientoService.getById(id);
    }
    async listarCumplimientos(sedeIdStr, estado) {
        const sedeId = sedeIdStr ? parseInt(sedeIdStr, 10) : 0;
        return this.cumplimientoService.listarCumplimientos(sedeId, estado);
    }
    async iniciarCumplimiento(req, dto) {
        return this.cumplimientoService.iniciarCumplimiento(dto.contratistaId, req.user?.id, dto.sedeId, undefined);
    }
    async iniciarCumplimientoFrontend(req, dto) {
        return this.cumplimientoService.iniciarCumplimiento(dto.contratistaId, req.user?.id, dto.sedeId, undefined);
    }
    async actualizarCumplimiento(id, dto) {
        return this.cumplimientoService.actualizarCumplimiento(id, dto);
    }
    async marcarItemCumplimiento(id, itemId, dto) {
        return this.cumplimientoService.marcarItem(id, itemId, dto.cumple, dto.observacion);
    }
    async cerrarCumplimiento(id, dto) {
        return this.cumplimientoService.cerrarCumplimiento(id, dto.firmaDigital, dto.observacionGeneral);
    }
    async crearExcepcion(req, dto) {
        return this.excepcionService.crearExcepcion(req.user?.id, dto);
    }
    async crearExcepcionLote(req, dto) {
        return this.excepcionService.crearExcepcionLote(req.user?.id, dto);
    }
    async getExcepcionesActivas(personaId) {
        return this.excepcionService.getExcepcionesActivas(personaId);
    }
    async getExcepcionDetalle(id) {
        return this.excepcionService.obtenerDetalle(id);
    }
    async getExcepcionesSede(sedeId) {
        return this.excepcionService.listarExcepciones(sedeId);
    }
    async getExcepcionesPorSedeAlias(sedeId) {
        return this.excepcionService.listarExcepciones(sedeId);
    }
    async anularExcepcion(id) {
        return this.excepcionService.anularExcepcion(id);
    }
    async desactivarExcepcion(id) {
        return this.excepcionService.anularExcepcion(id);
    }
    async activarExcepcion(id) {
        return this.excepcionService.activarExcepcion(id);
    }
    async actualizarExcepcion(id, dto) {
        return this.excepcionService.actualizarExcepcion(id, dto);
    }
    async eliminarExcepcion(id) {
        return this.excepcionService.deleteExcepcion(id);
    }
    async getReporteAccesos(query) {
        return this.reportesService.getReporteAccesos(query);
    }
    async getReporteCumplimiento(query) {
        return this.reportesService.getReporteCumplimiento(query);
    }
    async getReporteVencimientos() {
        return this.reportesService.getReporteVencimientos();
    }
    async servirArchivoHse(req, res) {
        const originalUrl = decodeURIComponent(req.originalUrl ?? '');
        const archivosIdx = originalUrl.indexOf('/archivos/');
        const rawPath = archivosIdx >= 0
            ? originalUrl.slice(archivosIdx + '/archivos/'.length).split('?')[0]
            : '';
        if (!rawPath) {
            throw new common_1.NotFoundException('Archivo no encontrado');
        }
        const fullPath = this.uploadSecurityService.resolveUploadPath(rawPath);
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
            throw new common_1.NotFoundException('Archivo no encontrado');
        }
        return res.sendFile(fullPath);
    }
};
exports.HseController = HseController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('catalogos/sedes'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getSedes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('catalogos/eps'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getEps", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('catalogos/arl'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getArl", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('catalogos/afp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAfp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('catalogos/normas/:sede_id'),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getNormas", null);
__decorate([
    (0, common_1.Get)('catalogos/proveedores'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getProveedores", null);
__decorate([
    (0, common_1.Post)('catalogos/proveedores'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CrearProveedorFrontendDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "crearProveedor", null);
__decorate([
    (0, common_1.Put)('catalogos/proveedores/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ActualizarProveedorFrontendDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "actualizarProveedor", null);
__decorate([
    (0, common_1.Delete)('catalogos/proveedores/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "eliminarProveedor", null);
__decorate([
    (0, common_1.Get)('autorizaciones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)('sede_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAutorizaciones", null);
__decorate([
    (0, common_1.Get)('autorizaciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAutorizacion", null);
__decorate([
    (0, common_1.Post)('autorizaciones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autorizacion_dto_1.CreateAutorizacionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "createAutorizacion", null);
__decorate([
    (0, common_1.Put)('autorizaciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, autorizacion_dto_1.UpdateAutorizacionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "updateAutorizacion", null);
__decorate([
    (0, common_1.Delete)('autorizaciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "deleteAutorizacion", null);
__decorate([
    (0, common_1.Patch)('autorizaciones/:id/estado'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, autorizacion_dto_1.ChangeEstadoAutorizacionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "cambiarEstadoAutorizacion", null);
__decorate([
    (0, common_1.Get)('autorizaciones/:id/contratistas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getContratistas", null);
__decorate([
    (0, common_1.Post)('autorizaciones/:id/contratistas'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "addContratistas", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/generar-token'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "generarTokenContratista", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/token'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "renovarTokenFrontend", null);
__decorate([
    (0, common_1.Get)('contratistas/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getContratista", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/aprobar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "aprobarContratista", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/denegar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('motivo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "denegarContratista", null);
__decorate([
    (0, common_1.Put)('contratistas/:id/proveedor'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('proveedor_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "actualizarProveedorContratista", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/eliminar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, contratista_dto_1.EliminarContratistaDto, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "eliminarContratista", null);
__decorate([
    (0, common_1.Post)('contratistas/:id/adjuntos/eliminar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, contratista_dto_1.EliminarAdjuntoContratistaDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "eliminarAdjuntoContratista", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Get)('autogestion/:token'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAutogestionDatos", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/upload'),
    (0, common_2.UseInterceptors)((0, platform_express_1.FileInterceptor)('archivo', { storage: require('multer').memoryStorage() })),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('token')),
    __param(2, (0, common_1.Body)('modulo')),
    __param(3, (0, common_1.Body)('campo')),
    __param(4, (0, common_2.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "uploadArchivo", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/datos-personales'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarDatosPersonales", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/clasificacion'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.ClasificacionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarClasificacion", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/seguridad-social'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarSeguridadSocial", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/certificaciones'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.CertificacionesDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarCertificaciones", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/examen-medico'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.ExamenMedicoDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarExamenMedico", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/contacto-emergencia'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.ContactoEmergenciaDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarContactoEmergencia", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/aceptacion'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.AceptacionNormasDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarAceptacionNormas", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/normas'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, autogestion_dto_1.AceptacionNormasDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "guardarAceptacionNormasFrontend", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(autogestion_token_guard_1.AutogestionTokenGuard),
    (0, common_1.Post)('autogestion/:token/finalizar'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "finalizarAutogestion", null);
__decorate([
    (0, common_1.Get)('dashboard/:sedeId'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sedeId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('accesos/entrada'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, acceso_dto_1.RegistrarEntradaSalidaDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "registrarEntrada", null);
__decorate([
    (0, common_1.Post)('accesos/salida'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, acceso_dto_1.RegistrarEntradaSalidaDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "registrarSalida", null);
__decorate([
    (0, common_1.Get)('accesos/sede/:sede_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getAccesosSede", null);
__decorate([
    (0, common_1.Get)('vigilante/dentro/:sede_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getPersonasDentro", null);
__decorate([
    (0, common_1.Post)('vigilante/verificar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [acceso_dto_1.VerificarAccesoDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "verificarAcceso", null);
__decorate([
    (0, common_1.Post)('vigilante/acceso'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, acceso_dto_1.RegistrarAccesoDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "registrarAccesoVigilante", null);
__decorate([
    (0, common_1.Get)('cumplimiento/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getCumplimiento", null);
__decorate([
    (0, common_1.Get)('cumplimiento'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Query)('sede_id')),
    __param(1, (0, common_1.Query)('estado')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "listarCumplimientos", null);
__decorate([
    (0, common_1.Post)('cumplimiento'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cumplimiento_dto_1.CumplimientoIniciarDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "iniciarCumplimiento", null);
__decorate([
    (0, common_1.Post)('cumplimiento/iniciar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cumplimiento_dto_1.CumplimientoIniciarDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "iniciarCumplimientoFrontend", null);
__decorate([
    (0, common_1.Put)('cumplimiento/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cumplimiento_dto_1.CumplimientoActualizarDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "actualizarCumplimiento", null);
__decorate([
    (0, common_1.Put)('cumplimiento/:id/items/:itemId'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, cumplimiento_dto_1.MarcarItemCumplimientoDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "marcarItemCumplimiento", null);
__decorate([
    (0, common_1.Post)('cumplimiento/:id/cerrar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, cumplimiento_dto_1.CumplimientoCerrarDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "cerrarCumplimiento", null);
__decorate([
    (0, common_1.Post)('excepciones'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, excepcion_dto_1.CreateExcepcionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "crearExcepcion", null);
__decorate([
    (0, common_1.Post)('excepciones/lote'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, excepcion_dto_1.CreateExcepcionLoteDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "crearExcepcionLote", null);
__decorate([
    (0, common_1.Get)('excepciones/activas/:persona_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE),
    __param(0, (0, common_1.Param)('persona_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getExcepcionesActivas", null);
__decorate([
    (0, common_1.Get)('excepciones/detalle/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getExcepcionDetalle", null);
__decorate([
    (0, common_1.Get)('excepciones/sede/:sede_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getExcepcionesSede", null);
__decorate([
    (0, common_1.Get)('excepciones/:sede_id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VIGILANTE_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Param)('sede_id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getExcepcionesPorSedeAlias", null);
__decorate([
    (0, common_1.Put)('excepciones/:id/anular'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "anularExcepcion", null);
__decorate([
    (0, common_1.Post)('excepciones/:id/desactivar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "desactivarExcepcion", null);
__decorate([
    (0, common_1.Post)('excepciones/:id/activar'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "activarExcepcion", null);
__decorate([
    (0, common_1.Put)('excepciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, excepcion_dto_1.UpdateExcepcionDto]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "actualizarExcepcion", null);
__decorate([
    (0, common_1.Delete)('excepciones/:id'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "eliminarExcepcion", null);
__decorate([
    (0, common_1.Get)('reportes/accesos'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getReporteAccesos", null);
__decorate([
    (0, common_1.Get)('reportes/cumplimiento'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getReporteCumplimiento", null);
__decorate([
    (0, common_1.Get)('reportes/vencimientos'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HseController.prototype, "getReporteVencimientos", null);
__decorate([
    (0, common_1.Get)('archivos/*path'),
    (0, roles_decorator_1.Roles)(rol_enum_1.RolNombre.ADMIN_HSE, rol_enum_1.RolNombre.GESTION_HSE, rol_enum_1.RolNombre.VISUALIZADOR, rol_enum_1.RolNombre.ADMIN_GLOBAL),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HseController.prototype, "servirArchivoHse", null);
exports.HseController = HseController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('hse'),
    __metadata("design:paramtypes", [hse_service_1.HseService,
        autorizacion_service_1.AutorizacionService,
        autogestion_service_1.AutogestionService,
        acceso_service_1.AccesoService,
        cumplimiento_service_1.CumplimientoService,
        excepcion_service_1.ExcepcionService,
        reportes_service_1.ReportesService,
        proveedor_service_1.ProveedorService,
        upload_security_service_1.UploadSecurityService])
], HseController);
//# sourceMappingURL=hse.controller.js.map