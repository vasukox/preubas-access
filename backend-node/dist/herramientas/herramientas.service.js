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
exports.HerramientasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const rol_entity_1 = require("../auth/entities/rol.entity");
const usuario_entity_1 = require("../auth/entities/usuario.entity");
const usuario_rol_entity_1 = require("../auth/entities/usuario-rol.entity");
const usuario_sede_entity_1 = require("../auth/entities/usuario-sede.entity");
const perfil_entity_1 = require("../auth/entities/perfil.entity");
const usuario_permiso_entity_1 = require("../auth/entities/usuario-permiso.entity");
const audit_log_entity_1 = require("../auth/entities/audit-log.entity");
const sede_entity_1 = require("../sede/entities/sede.entity");
const herramientas_constants_1 = require("./herramientas.constants");
const rol_enum_1 = require("../common/enums/rol.enum");
let HerramientasService = class HerramientasService {
    rolRepo;
    usuarioRepo;
    auditLogRepo;
    perfilRepo;
    usuarioPermisoRepo;
    usuarioRolRepo;
    usuarioSedeRepo;
    sedeRepo;
    constructor(rolRepo, usuarioRepo, auditLogRepo, perfilRepo, usuarioPermisoRepo, usuarioRolRepo, usuarioSedeRepo, sedeRepo) {
        this.rolRepo = rolRepo;
        this.usuarioRepo = usuarioRepo;
        this.auditLogRepo = auditLogRepo;
        this.perfilRepo = perfilRepo;
        this.usuarioPermisoRepo = usuarioPermisoRepo;
        this.usuarioRolRepo = usuarioRolRepo;
        this.usuarioSedeRepo = usuarioSedeRepo;
        this.sedeRepo = sedeRepo;
    }
    validarPasswordFuerte(password) {
        if (password.length < 8)
            return 'La contraseña debe tener al menos 8 caracteres.';
        if (!/[A-Z]/.test(password))
            return 'La contraseña debe incluir al menos una letra mayúscula.';
        if (!/[a-z]/.test(password))
            return 'La contraseña debe incluir al menos una letra minúscula.';
        if (!/\d/.test(password))
            return 'La contraseña debe incluir al menos un número.';
        if (!/[^A-Za-z0-9]/.test(password))
            return 'La contraseña debe incluir al menos un carácter especial.';
        return null;
    }
    resolverIdsSedes(input) {
        const fromArray = input.sedesAsignadasIds?.length
            ? [...new Set(input.sedesAsignadasIds.filter((id) => Number.isInteger(id) && id > 0))]
            : [];
        if (fromArray.length > 0)
            return fromArray;
        if (input.sedeAsignadaId)
            return [input.sedeAsignadaId];
        return [];
    }
    mapSedesAsignadas(usuario) {
        const fromPivot = (usuario.sedesAsignadas ?? [])
            .filter((us) => us.sede)
            .map((us) => ({
            id: us.sede.id,
            nombre: us.sede.nombre,
            ciudad: us.sede.ciudad,
        }));
        if (fromPivot.length > 0)
            return fromPivot;
        if (usuario.sedeAsignada) {
            return [{
                    id: usuario.sedeAsignada.id,
                    nombre: usuario.sedeAsignada.nombre,
                    ciudad: usuario.sedeAsignada.ciudad,
                }];
        }
        return [];
    }
    mapUsuarioResponse(u) {
        const permisos = u.permisos
            ? {
                puedeVer: u.permisos.puedeVer,
                puedeCrear: u.permisos.puedeCrear,
                puedeEditar: u.permisos.puedeEditar,
                puedeEliminar: u.permisos.puedeEliminar,
            }
            : { puedeVer: true, puedeCrear: false, puedeEditar: false, puedeEliminar: false };
        const sedesAsignadas = this.mapSedesAsignadas(u);
        const sedePrincipal = sedesAsignadas[0] ?? null;
        const ahora = new Date();
        const bloqueado = !!(u.bloqueadoHasta && u.bloqueadoHasta > ahora);
        return {
            id: u.id,
            email: u.email,
            nombreCompleto: u.nombreCompleto,
            numero: u.perfil?.telefono ?? null,
            direccion: u.perfil?.ubicacion ?? null,
            activo: u.activo,
            ultimoLogin: u.ultimoLogin ?? null,
            bloqueadoHasta: u.bloqueadoHasta ?? null,
            intentosFallidos: u.intentosFallidos ?? 0,
            estaBloqueado: bloqueado,
            roles: u.roles.map((ur) => ({ id: ur.rol.id, nombre: ur.rol.nombre })),
            permisos,
            sedeAsignadaId: u.sedeAsignadaId ?? sedePrincipal?.id ?? null,
            sedeAsignada: u.sedeAsignada
                ? { id: u.sedeAsignada.id, nombre: u.sedeAsignada.nombre, ciudad: u.sedeAsignada.ciudad }
                : sedePrincipal,
            sedesAsignadasIds: sedesAsignadas.map((s) => s.id),
            sedesAsignadas,
        };
    }
    async validarSedesExisten(sedeIds, manager) {
        if (sedeIds.length === 0)
            return;
        const repo = manager ? manager.getRepository(sede_entity_1.Sede) : this.sedeRepo;
        const sedes = await repo.find({ where: { id: (0, typeorm_2.In)(sedeIds), activa: true } });
        if (sedes.length !== sedeIds.length) {
            throw new common_1.BadRequestException({
                code: 'SEDE_INVALIDA',
                message: 'Una o más sedes seleccionadas no existen o están inactivas.',
            });
        }
    }
    async sincronizarSedesUsuario(manager, usuarioId, sedeIds) {
        await manager.delete(usuario_sede_entity_1.UsuarioSede, { usuarioId });
        if (sedeIds.length === 0)
            return;
        const registros = sedeIds.map((sedeId) => manager.create(usuario_sede_entity_1.UsuarioSede, { usuarioId, sedeId }));
        await manager.save(registros);
    }
    async assertEmailDisponible(email) {
        const normalizado = email.toLowerCase().trim();
        const existe = await this.usuarioRepo.findOne({
            where: { email: normalizado },
            withDeleted: true,
        });
        if (!existe)
            return normalizado;
        if (existe.deleted_at) {
            throw new common_1.ConflictException({
                code: 'EMAIL_DUPLICADO',
                message: `El email ${normalizado} pertenece a un usuario eliminado. Restáuralo o usa otro correo.`,
            });
        }
        throw new common_1.ConflictException({
            code: 'EMAIL_DUPLICADO',
            message: `Ya existe un usuario con el email ${normalizado}`,
        });
    }
    normalizarFirma(value) {
        const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalized.trim().replace(/\s+/g, ' ').toLowerCase();
    }
    async registrarAuditoria(actorId, actorNombre, accion, entidad, entidadId, descripcion) {
        const log = this.auditLogRepo.create({
            actorId,
            actorNombre,
            accion,
            entidad,
            entidadId,
            descripcion,
        });
        await this.auditLogRepo.save(log);
    }
    async listarRoles() {
        const roles = await this.rolRepo.find({
            where: { activo: true },
            order: { id: 'ASC' },
        });
        return roles.map((rol) => {
            const meta = herramientas_constants_1.ROL_META[rol.nombre] || {};
            return {
                id: rol.id,
                nombre: rol.nombre,
                descripcion: meta.descripcion || rol.descripcion || '',
                color: meta.color || '#6B7280',
                modulos: meta.modulos || [],
                grupos: meta.grupos || [],
            };
        });
    }
    async listarUsuarios() {
        const usuarios = await this.usuarioRepo.find({
            relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
            order: { nombreCompleto: 'ASC' },
        });
        return usuarios.map((u) => this.mapUsuarioResponse(u));
    }
    async listarAuditoria(limite = 100) {
        const logs = await this.auditLogRepo.find({
            order: { created_at: 'DESC' },
            take: limite,
        });
        return logs;
    }
    async crearUsuario(dto, currentUserId, currentUserName) {
        const passwordError = this.validarPasswordFuerte(dto.password);
        if (passwordError) {
            throw new common_1.BadRequestException({ code: 'PASSWORD_DEBIL', message: passwordError });
        }
        if (dto.password !== dto.passwordConfirmacion) {
            throw new common_1.BadRequestException({ code: 'PASSWORD_NO_COINCIDE', message: 'La confirmación de contraseña no coincide.' });
        }
        const firma = (dto.firmaCreador || currentUserName).trim();
        if (firma.length < 3) {
            throw new common_1.BadRequestException({ code: 'FIRMA_INVALIDA', message: 'La firma digital debe tener al menos 3 caracteres.' });
        }
        if (this.normalizarFirma(firma) === '') {
            throw new common_1.BadRequestException({ code: 'FIRMA_INVALIDA', message: 'La firma digital ingresada no es válida.' });
        }
        const emailNormalizado = await this.assertEmailDisponible(dto.email);
        const rolesSolicitados = Array.from(new Set([
            ...(dto.rolesNombres || []),
            ...(dto.rolNombre ? [dto.rolNombre] : []),
        ]));
        if (rolesSolicitados.length === 0) {
            throw new common_1.BadRequestException({ code: 'ROL_REQUERIDO', message: 'Debes asignar al menos un rol al usuario.' });
        }
        const rolesValidos = await this.rolRepo.find({ where: { nombre: (0, typeorm_2.In)(rolesSolicitados), activo: true } });
        const rolesValidosMap = new Map(rolesValidos.map(r => [r.nombre, r]));
        const rolesNoEncontrados = rolesSolicitados.filter(r => !rolesValidosMap.has(r));
        if (rolesNoEncontrados.length > 0) {
            throw new common_1.NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: `Los roles ${rolesNoEncontrados.join(', ')} no existen o están inactivos` });
        }
        const esVigilante = rolesSolicitados.includes(rol_enum_1.RolNombre.VIGILANTE_HSE) || rolesSolicitados.includes(rol_enum_1.RolNombre.VIGILANTE_PARKING);
        const sedesIds = this.resolverIdsSedes(dto);
        if (esVigilante && sedesIds.length === 0) {
            throw new common_1.BadRequestException({
                code: 'SEDE_REQUERIDA',
                message: 'Los vigilantes deben tener al menos una sede asignada.',
            });
        }
        await this.validarSedesExisten(sedesIds);
        try {
            return await this.usuarioRepo.manager.transaction(async (manager) => {
                const passwordHash = await bcrypt.hash(dto.password, 12);
                const nuevo = manager.create(usuario_entity_1.Usuario, {
                    email: emailNormalizado,
                    nombreCompleto: `${dto.nombres.trim()} ${dto.apellidos.trim()}`.trim(),
                    passwordHash,
                    activo: true,
                    debeCambiarPassword: true,
                    sedeAsignadaId: sedesIds[0] ?? null,
                });
                const usuarioGuardado = await manager.save(nuevo);
                if (sedesIds.length > 0) {
                    await this.sincronizarSedesUsuario(manager, usuarioGuardado.id, sedesIds);
                }
                const perfilCreador = await manager.findOne(perfil_entity_1.Perfil, { where: { usuarioId: currentUserId } });
                const sedeDefaultHeredada = perfilCreador?.sedeDefaultId ?? null;
                const trazaCreacion = {
                    creado_por_id: currentUserId,
                    creado_por_nombre: currentUserName,
                    firma_creador: firma,
                    roles_iniciales: rolesSolicitados,
                    sede_default_heredada: sedeDefaultHeredada,
                    fecha_creacion_utc: new Date().toISOString(),
                };
                const perfil = manager.create(perfil_entity_1.Perfil, {
                    usuarioId: usuarioGuardado.id,
                    telefono: dto.numero,
                    ubicacion: dto.direccion,
                    sedeDefaultId: sedeDefaultHeredada || undefined,
                    biografia: JSON.stringify(trazaCreacion),
                });
                await manager.save(perfil);
                const permisos = dto.permisos || {};
                const permiso = manager.create(usuario_permiso_entity_1.UsuarioPermiso, {
                    usuarioId: usuarioGuardado.id,
                    puedeVer: permisos.ver ?? true,
                    puedeCrear: permisos.crear ?? false,
                    puedeEditar: permisos.editar ?? false,
                    puedeEliminar: permisos.eliminar ?? false,
                    asignadoPor: currentUserId,
                });
                await manager.save(permiso);
                const usuarioRoles = rolesSolicitados.map(rolNombre => {
                    return manager.create(usuario_rol_entity_1.UsuarioRol, {
                        usuarioId: usuarioGuardado.id,
                        rolId: rolesValidosMap.get(rolNombre).id,
                        asignadoPor: currentUserId,
                    });
                });
                await manager.save(usuarioRoles);
                const auditLog = manager.create(audit_log_entity_1.AuditLog, {
                    actorId: currentUserId,
                    actorNombre: currentUserName,
                    accion: 'CREAR_USUARIO',
                    entidad: 'Usuario',
                    entidadId: usuarioGuardado.id,
                    descripcion: `Creó usuario '${usuarioGuardado.nombreCompleto}' (${usuarioGuardado.email}) con roles ${rolesSolicitados.join(', ')}.`,
                });
                await manager.save(auditLog);
                const usuarioCompleto = await manager.findOne(usuario_entity_1.Usuario, {
                    where: { id: usuarioGuardado.id },
                    relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
                });
                return this.mapUsuarioResponse(usuarioCompleto);
            });
        }
        catch (err) {
            if (err instanceof typeorm_2.QueryFailedError && err.code === 'ER_DUP_ENTRY') {
                throw new common_1.ConflictException({
                    code: 'EMAIL_DUPLICADO',
                    message: `Ya existe un usuario con el email ${emailNormalizado}`,
                });
            }
            throw err;
        }
    }
    async actualizarUsuario(id, dto, currentUserId, currentUserName) {
        const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol', 'perfil'] });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        if (dto.activo === false && usuario.id === currentUserId) {
            throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'No puedes desactivar tu propia cuenta' });
        }
        if (dto.activo === false && usuario.roles.some(ur => ur.rol.nombre === rol_enum_1.RolNombre.ADMIN_GLOBAL)) {
            const otrosAdminsCount = await this.usuarioRolRepo.count({
                where: {
                    rol: { nombre: rol_enum_1.RolNombre.ADMIN_GLOBAL },
                    usuario: { id: (0, typeorm_2.Not)(id), activo: true }
                },
                relations: ['rol', 'usuario']
            });
            if (otrosAdminsCount === 0) {
                throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo' });
            }
        }
        const cambios = [];
        if (dto.nombreCompleto !== undefined) {
            cambios.push(`nombre='${dto.nombreCompleto}'`);
            usuario.nombreCompleto = dto.nombreCompleto;
        }
        if (dto.numero !== undefined && usuario.perfil) {
            cambios.push(`numero='${dto.numero}'`);
            usuario.perfil.telefono = dto.numero;
        }
        if (dto.direccion !== undefined && usuario.perfil) {
            cambios.push(`direccion='${dto.direccion}'`);
            usuario.perfil.ubicacion = dto.direccion;
        }
        if (dto.activo !== undefined) {
            cambios.push(`activo=${dto.activo}`);
            usuario.activo = dto.activo;
        }
        return this.usuarioRepo.manager.transaction(async (manager) => {
            await manager.save(usuario);
            if (usuario.perfil) {
                await manager.save(usuario.perfil);
            }
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                actorId: currentUserId,
                actorNombre: currentUserName,
                accion: dto.activo === false ? 'DESACTIVAR_USUARIO' : 'ACTUALIZAR_USUARIO',
                entidad: 'Usuario',
                entidadId: id,
                descripcion: `Actualizó usuario '${usuario.nombreCompleto}' (${usuario.email}). Cambios: ${cambios.join(', ') || 'ninguno'}.`,
            }));
            const usuarioActualizado = await manager.findOne(usuario_entity_1.Usuario, {
                where: { id },
                relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
            });
            return this.mapUsuarioResponse(usuarioActualizado);
        });
    }
    async eliminarUsuario(id, currentUserId, currentUserName) {
        const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol'] });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        if (usuario.id === currentUserId) {
            throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'No puedes eliminar tu propia cuenta' });
        }
        if (usuario.roles.some(ur => ur.rol.nombre === rol_enum_1.RolNombre.ADMIN_GLOBAL)) {
            const otrosAdminsCount = await this.usuarioRolRepo.count({
                where: {
                    rol: { nombre: rol_enum_1.RolNombre.ADMIN_GLOBAL },
                    usuario: { id: (0, typeorm_2.Not)(id), activo: true }
                },
                relations: ['rol', 'usuario']
            });
            if (otrosAdminsCount === 0) {
                throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo' });
            }
        }
        return this.usuarioRepo.manager.transaction(async (manager) => {
            await manager
                .createQueryBuilder()
                .update(usuario_entity_1.Usuario)
                .set({ activo: false, deleted_at: new Date() })
                .where('id = :id', { id })
                .execute();
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                actorId: currentUserId,
                actorNombre: currentUserName,
                accion: 'ELIMINAR_USUARIO',
                entidad: 'Usuario',
                entidadId: id,
                descripcion: `Eliminó el usuario '${usuario.nombreCompleto}' (${usuario.email}).`,
            }));
            return { success: true };
        });
    }
    async actualizarPermisos(id, dto, currentUserId, currentUserName) {
        const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol', 'permisos'] });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        if (usuario.roles.some(ur => ur.rol.nombre === rol_enum_1.RolNombre.ADMIN_GLOBAL)) {
            throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Los permisos del ADMIN_GLOBAL no se pueden modificar' });
        }
        return this.usuarioRepo.manager.transaction(async (manager) => {
            let permiso = usuario.permisos;
            if (permiso) {
                if (dto.puedeVer !== undefined)
                    permiso.puedeVer = dto.puedeVer;
                if (dto.puedeCrear !== undefined)
                    permiso.puedeCrear = dto.puedeCrear;
                if (dto.puedeEditar !== undefined)
                    permiso.puedeEditar = dto.puedeEditar;
                if (dto.puedeEliminar !== undefined)
                    permiso.puedeEliminar = dto.puedeEliminar;
                permiso.asignadoPor = currentUserId;
            }
            else {
                permiso = manager.create(usuario_permiso_entity_1.UsuarioPermiso, {
                    usuarioId: id,
                    puedeVer: dto.puedeVer ?? true,
                    puedeCrear: dto.puedeCrear ?? false,
                    puedeEditar: dto.puedeEditar ?? false,
                    puedeEliminar: dto.puedeEliminar ?? false,
                    asignadoPor: currentUserId,
                });
            }
            await manager.save(permiso);
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                actorId: currentUserId,
                actorNombre: currentUserName,
                accion: 'ACTUALIZAR_PERMISOS',
                entidad: 'UsuarioPermiso',
                entidadId: id,
                descripcion: `Actualizó permisos de '${usuario.nombreCompleto}' (${usuario.email}): ver=${permiso.puedeVer} crear=${permiso.puedeCrear} editar=${permiso.puedeEditar} eliminar=${permiso.puedeEliminar}.`,
            }));
            return manager.findOne(usuario_entity_1.Usuario, {
                where: { id },
                relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada'],
            });
        });
    }
    async desbloquearUsuario(id, currentUserId, currentUserName) {
        const usuario = await this.usuarioRepo.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        await this.usuarioRepo.update(id, {
            intentosFallidos: 0,
            bloqueadoHasta: null,
        });
        await this.auditLogRepo.save(this.auditLogRepo.create({
            actorId: currentUserId,
            actorNombre: currentUserName,
            accion: 'DESBLOQUEAR_USUARIO',
            entidad: 'Usuario',
            entidadId: id,
            descripcion: `Desbloqueó manualmente la cuenta de '${usuario.nombreCompleto}' (${usuario.email}).`,
        }));
        const actualizado = await this.usuarioRepo.findOne({
            where: { id },
            relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
        });
        return this.mapUsuarioResponse(actualizado);
    }
    async asignarRol(id, rolNombre, currentUserId, currentUserName, sedeAsignadaId, sedesAsignadasIds) {
        const usuario = await this.usuarioRepo.findOne({
            where: { id },
            relations: ['roles', 'roles.rol', 'sedesAsignadas'],
        });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        const rol = await this.rolRepo.findOne({ where: { nombre: rolNombre, activo: true } });
        if (!rol) {
            throw new common_1.NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: `El rol '${rolNombre}' no existe o está inactivo` });
        }
        if (usuario.roles.some(ur => ur.rol.nombre === rolNombre)) {
            throw new common_1.ConflictException({ code: 'ROL_DUPLICADO', message: `El usuario ya tiene el rol '${rolNombre}'` });
        }
        const esRolVigilante = rolNombre === rol_enum_1.RolNombre.VIGILANTE_HSE || rolNombre === rol_enum_1.RolNombre.VIGILANTE_PARKING;
        const sedesNuevas = this.resolverIdsSedes({ sedeAsignadaId, sedesAsignadasIds });
        const tieneSedesPrevias = !!usuario.sedeAsignadaId || (usuario.sedesAsignadas?.length ?? 0) > 0;
        if (esRolVigilante && !tieneSedesPrevias && sedesNuevas.length === 0) {
            throw new common_1.BadRequestException({
                code: 'SEDE_REQUERIDA',
                message: 'Los vigilantes deben tener al menos una sede asignada.',
            });
        }
        await this.validarSedesExisten(sedesNuevas);
        return this.usuarioRepo.manager.transaction(async (manager) => {
            if (esRolVigilante && sedesNuevas.length > 0) {
                await this.sincronizarSedesUsuario(manager, id, sedesNuevas);
                await manager.update(usuario_entity_1.Usuario, { id }, { sedeAsignadaId: sedesNuevas[0] });
            }
            const existente = await manager.getRepository(usuario_rol_entity_1.UsuarioRol).findOne({
                where: { usuarioId: id, rolId: rol.id },
                withDeleted: true,
            });
            if (existente?.deleted_at) {
                await manager
                    .createQueryBuilder()
                    .update(usuario_rol_entity_1.UsuarioRol)
                    .set({ deleted_at: () => 'NULL', asignadoPor: currentUserId })
                    .where('id = :existenteId', { existenteId: existente.id })
                    .execute();
            }
            else if (!existente) {
                const nuevoRol = manager.create(usuario_rol_entity_1.UsuarioRol, {
                    usuarioId: id,
                    rolId: rol.id,
                    asignadoPor: currentUserId,
                });
                await manager.save(nuevoRol);
            }
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                actorId: currentUserId,
                actorNombre: currentUserName,
                accion: 'ASIGNAR_ROL',
                entidad: 'UsuarioRol',
                entidadId: id,
                descripcion: `Asignó rol '${rolNombre}' a '${usuario.nombreCompleto}' (${usuario.email}).`,
            }));
            const usuarioActualizado = await manager.findOne(usuario_entity_1.Usuario, {
                where: { id },
                relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
            });
            return this.mapUsuarioResponse(usuarioActualizado);
        });
    }
    async quitarRol(id, rolNombre, currentUserId, currentUserName) {
        const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol'] });
        if (!usuario) {
            throw new common_1.NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
        }
        if (rolNombre === rol_enum_1.RolNombre.ADMIN_GLOBAL) {
            const otrosAdminsCount = await this.usuarioRolRepo.count({
                where: {
                    rol: { nombre: rol_enum_1.RolNombre.ADMIN_GLOBAL },
                    usuario: { activo: true }
                },
                relations: ['rol', 'usuario']
            });
            if (otrosAdminsCount <= 1) {
                throw new common_1.ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo en el sistema' });
            }
        }
        const ur = usuario.roles.find(ur => ur.rol.nombre === rolNombre);
        if (!ur) {
            throw new common_1.NotFoundException({ code: 'ROL_NO_ASIGNADO', message: `El usuario no tiene el rol '${rolNombre}'` });
        }
        return this.usuarioRepo.manager.transaction(async (manager) => {
            await manager.delete(usuario_rol_entity_1.UsuarioRol, { id: ur.id });
            await manager.save(manager.create(audit_log_entity_1.AuditLog, {
                actorId: currentUserId,
                actorNombre: currentUserName,
                accion: 'QUITAR_ROL',
                entidad: 'UsuarioRol',
                entidadId: id,
                descripcion: `Quitó rol '${rolNombre}' a '${usuario.nombreCompleto}' (${usuario.email}).`,
            }));
            const usuarioActualizado = await manager.findOne(usuario_entity_1.Usuario, {
                where: { id },
                relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
            });
            return this.mapUsuarioResponse(usuarioActualizado);
        });
    }
};
exports.HerramientasService = HerramientasService;
exports.HerramientasService = HerramientasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rol_entity_1.Rol)),
    __param(1, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __param(2, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(3, (0, typeorm_1.InjectRepository)(perfil_entity_1.Perfil)),
    __param(4, (0, typeorm_1.InjectRepository)(usuario_permiso_entity_1.UsuarioPermiso)),
    __param(5, (0, typeorm_1.InjectRepository)(usuario_rol_entity_1.UsuarioRol)),
    __param(6, (0, typeorm_1.InjectRepository)(usuario_sede_entity_1.UsuarioSede)),
    __param(7, (0, typeorm_1.InjectRepository)(sede_entity_1.Sede)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HerramientasService);
//# sourceMappingURL=herramientas.service.js.map