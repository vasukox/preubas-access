import { Injectable, BadRequestException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, EntityManager, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Rol } from '../auth/entities/rol.entity';
import { Usuario } from '../auth/entities/usuario.entity';
import { UsuarioRol } from '../auth/entities/usuario-rol.entity';
import { UsuarioSede } from '../auth/entities/usuario-sede.entity';
import { Perfil } from '../auth/entities/perfil.entity';
import { UsuarioPermiso } from '../auth/entities/usuario-permiso.entity';
import { AuditLog } from '../auth/entities/audit-log.entity';
import { Sede } from '../sede/entities/sede.entity';
import { ROL_META } from './herramientas.constants';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePermisosDto } from './dto/update-permisos.dto';
import { RolNombre } from '../common/enums/rol.enum';

@Injectable()
export class HerramientasService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(UsuarioPermiso)
    private readonly usuarioPermisoRepo: Repository<UsuarioPermiso>,
    @InjectRepository(UsuarioRol)
    private readonly usuarioRolRepo: Repository<UsuarioRol>,
    @InjectRepository(UsuarioSede)
    private readonly usuarioSedeRepo: Repository<UsuarioSede>,
    @InjectRepository(Sede)
    private readonly sedeRepo: Repository<Sede>,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private validarPasswordFuerte(password: string): string | null {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir al menos una letra mayúscula.';
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir al menos una letra minúscula.';
    if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir al menos un carácter especial.';
    return null;
  }

  private resolverIdsSedes(input: { sedeAsignadaId?: number; sedesAsignadasIds?: number[] }): number[] {
    const fromArray = input.sedesAsignadasIds?.length
      ? [...new Set(input.sedesAsignadasIds.filter((id) => Number.isInteger(id) && id > 0))]
      : [];
    if (fromArray.length > 0) return fromArray;
    if (input.sedeAsignadaId) return [input.sedeAsignadaId];
    return [];
  }

  private mapSedesAsignadas(usuario: Usuario) {
    const fromPivot = (usuario.sedesAsignadas ?? [])
      .filter((us) => us.sede)
      .map((us) => ({
        id: us.sede.id,
        nombre: us.sede.nombre,
        ciudad: us.sede.ciudad,
      }));

    if (fromPivot.length > 0) return fromPivot;

    if (usuario.sedeAsignada) {
      return [{
        id: usuario.sedeAsignada.id,
        nombre: usuario.sedeAsignada.nombre,
        ciudad: usuario.sedeAsignada.ciudad,
      }];
    }

    return [];
  }

  private mapUsuarioResponse(u: Usuario) {
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

  private async validarSedesExisten(sedeIds: number[], manager?: EntityManager) {
    if (sedeIds.length === 0) return;
    const repo = manager ? manager.getRepository(Sede) : this.sedeRepo;
    const sedes = await repo.find({ where: { id: In(sedeIds), activa: true } });
    if (sedes.length !== sedeIds.length) {
      throw new BadRequestException({
        code: 'SEDE_INVALIDA',
        message: 'Una o más sedes seleccionadas no existen o están inactivas.',
      });
    }
  }

  private async sincronizarSedesUsuario(
    manager: EntityManager,
    usuarioId: number,
    sedeIds: number[],
  ) {
    await manager.delete(UsuarioSede, { usuarioId });
    if (sedeIds.length === 0) return;

    const registros = sedeIds.map((sedeId) =>
      manager.create(UsuarioSede, { usuarioId, sedeId }),
    );
    await manager.save(registros);
  }

  private async assertEmailDisponible(email: string): Promise<string> {
    const normalizado = email.toLowerCase().trim();
    const existe = await this.usuarioRepo.findOne({
      where: { email: normalizado },
      withDeleted: true,
    });

    if (!existe) return normalizado;

    if (existe.deleted_at) {
      throw new ConflictException({
        code: 'EMAIL_DUPLICADO',
        message: `El email ${normalizado} pertenece a un usuario eliminado. Restáuralo o usa otro correo.`,
      });
    }

    throw new ConflictException({
      code: 'EMAIL_DUPLICADO',
      message: `Ya existe un usuario con el email ${normalizado}`,
    });
  }

  private normalizarFirma(value: string): string {
    // Basic normalization for Node.js
    const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private async registrarAuditoria(
    actorId: number,
    actorNombre: string,
    accion: string,
    entidad: string,
    entidadId: number,
    descripcion: string,
  ) {
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

  // ── LECTURAS ─────────────────────────────────────────────────────────────

  async listarRoles() {
    const roles = await this.rolRepo.find({
      where: { activo: true },
      order: { id: 'ASC' },
    });

    return roles.map((rol) => {
      const meta = ROL_META[rol.nombre] || {};
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

  // ── ESCRITURAS ───────────────────────────────────────────────────────────

  async crearUsuario(dto: CreateUsuarioDto, currentUserId: number, currentUserName: string) {
    const passwordError = this.validarPasswordFuerte(dto.password);
    if (passwordError) {
      throw new BadRequestException({ code: 'PASSWORD_DEBIL', message: passwordError });
    }

    if (dto.password !== dto.passwordConfirmacion) {
      throw new BadRequestException({ code: 'PASSWORD_NO_COINCIDE', message: 'La confirmación de contraseña no coincide.' });
    }

    const firma = (dto.firmaCreador || currentUserName).trim();
    if (firma.length < 3) {
      throw new BadRequestException({ code: 'FIRMA_INVALIDA', message: 'La firma digital debe tener al menos 3 caracteres.' });
    }
    if (this.normalizarFirma(firma) === '') {
      throw new BadRequestException({ code: 'FIRMA_INVALIDA', message: 'La firma digital ingresada no es válida.' });
    }

    const emailNormalizado = await this.assertEmailDisponible(dto.email);

    // Unir roles solicitados
    const rolesSolicitados = Array.from(new Set([
      ...(dto.rolesNombres || []),
      ...(dto.rolNombre ? [dto.rolNombre] : []),
    ]));

    if (rolesSolicitados.length === 0) {
      throw new BadRequestException({ code: 'ROL_REQUERIDO', message: 'Debes asignar al menos un rol al usuario.' });
    }

    const rolesValidos = await this.rolRepo.find({ where: { nombre: In(rolesSolicitados as RolNombre[]), activo: true } });
    const rolesValidosMap = new Map(rolesValidos.map(r => [r.nombre, r]));

    const rolesNoEncontrados = rolesSolicitados.filter(r => !rolesValidosMap.has(r as RolNombre));
    if (rolesNoEncontrados.length > 0) {
      throw new NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: `Los roles ${rolesNoEncontrados.join(', ')} no existen o están inactivos` });
    }

    const esVigilante = rolesSolicitados.includes(RolNombre.VIGILANTE_HSE) || rolesSolicitados.includes(RolNombre.VIGILANTE_PARKING);
    const sedesIds = this.resolverIdsSedes(dto);
    if (esVigilante && sedesIds.length === 0) {
      throw new BadRequestException({
        code: 'SEDE_REQUERIDA',
        message: 'Los vigilantes deben tener al menos una sede asignada.',
      });
    }
    await this.validarSedesExisten(sedesIds);

    // Transaction
    try {
    return await this.usuarioRepo.manager.transaction(async (manager) => {
      const passwordHash = await bcrypt.hash(dto.password, 12);

      const nuevo = manager.create(Usuario, {
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

      // Perfil (Heredar sede default)
      const perfilCreador = await manager.findOne(Perfil, { where: { usuarioId: currentUserId } });
      const sedeDefaultHeredada = perfilCreador?.sedeDefaultId ?? null;

      const trazaCreacion = {
        creado_por_id: currentUserId,
        creado_por_nombre: currentUserName,
        firma_creador: firma,
        roles_iniciales: rolesSolicitados,
        sede_default_heredada: sedeDefaultHeredada,
        fecha_creacion_utc: new Date().toISOString(),
      };

      const perfil = manager.create(Perfil, {
        usuarioId: usuarioGuardado.id,
        telefono: dto.numero,
        ubicacion: dto.direccion,
        sedeDefaultId: sedeDefaultHeredada || undefined,
        biografia: JSON.stringify(trazaCreacion),
      });
      await manager.save(perfil);

      // Permisos
      const permisos = dto.permisos || {};
      const permiso = manager.create(UsuarioPermiso, {
        usuarioId: usuarioGuardado.id,
        puedeVer: permisos.ver ?? true,
        puedeCrear: permisos.crear ?? false,
        puedeEditar: permisos.editar ?? false,
        puedeEliminar: permisos.eliminar ?? false,
        asignadoPor: currentUserId,
      });
      await manager.save(permiso);

      // Roles
      const usuarioRoles = rolesSolicitados.map(rolNombre => {
        return manager.create(UsuarioRol, {
          usuarioId: usuarioGuardado.id,
          rolId: rolesValidosMap.get(rolNombre as RolNombre)!.id,
          asignadoPor: currentUserId,
        });
      });
      await manager.save(usuarioRoles);

      // Audit Log
      const auditLog = manager.create(AuditLog, {
        actorId: currentUserId,
        actorNombre: currentUserName,
        accion: 'CREAR_USUARIO',
        entidad: 'Usuario',
        entidadId: usuarioGuardado.id,
        descripcion: `Creó usuario '${usuarioGuardado.nombreCompleto}' (${usuarioGuardado.email}) con roles ${rolesSolicitados.join(', ')}.`,
      });
      await manager.save(auditLog);

      // Fetch returned structured user
      const usuarioCompleto = await manager.findOne(Usuario, {
        where: { id: usuarioGuardado.id },
        relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
      });
      return this.mapUsuarioResponse(usuarioCompleto!);
    });
    } catch (err) {
      if (err instanceof QueryFailedError && (err as QueryFailedError & { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException({
          code: 'EMAIL_DUPLICADO',
          message: `Ya existe un usuario con el email ${emailNormalizado}`,
        });
      }
      throw err;
    }
  }

  async actualizarUsuario(id: number, dto: UpdateUsuarioDto, currentUserId: number, currentUserName: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol', 'perfil'] });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
    }

    if (dto.activo === false && usuario.id === currentUserId) {
      throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'No puedes desactivar tu propia cuenta' });
    }

    if (dto.activo === false && usuario.roles.some(ur => ur.rol.nombre === RolNombre.ADMIN_GLOBAL)) {
      const otrosAdminsCount = await this.usuarioRolRepo.count({
        where: {
          rol: { nombre: RolNombre.ADMIN_GLOBAL },
          usuario: { id: Not(id), activo: true }
        },
        relations: ['rol', 'usuario']
      });
      if (otrosAdminsCount === 0) {
        throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo' });
      }
    }

    const cambios: string[] = [];
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

      await manager.save(manager.create(AuditLog, {
        actorId: currentUserId,
        actorNombre: currentUserName,
        accion: dto.activo === false ? 'DESACTIVAR_USUARIO' : 'ACTUALIZAR_USUARIO',
        entidad: 'Usuario',
        entidadId: id,
        descripcion: `Actualizó usuario '${usuario.nombreCompleto}' (${usuario.email}). Cambios: ${cambios.join(', ') || 'ninguno'}.`,
      }));

      const usuarioActualizado = await manager.findOne(Usuario, {
        where: { id },
        relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
      });
      return this.mapUsuarioResponse(usuarioActualizado!);
    });
  }

  async eliminarUsuario(id: number, currentUserId: number, currentUserName: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol'] });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
    }

    if (usuario.id === currentUserId) {
      throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'No puedes eliminar tu propia cuenta' });
    }

    if (usuario.roles.some(ur => ur.rol.nombre === RolNombre.ADMIN_GLOBAL)) {
      const otrosAdminsCount = await this.usuarioRolRepo.count({
        where: {
          rol: { nombre: RolNombre.ADMIN_GLOBAL },
          usuario: { id: Not(id), activo: true }
        },
        relations: ['rol', 'usuario']
      });
      if (otrosAdminsCount === 0) {
        throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo' });
      }
    }

    return this.usuarioRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Usuario)
        .set({ activo: false, deleted_at: new Date() })
        .where('id = :id', { id })
        .execute();

      await manager.save(manager.create(AuditLog, {
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

  async actualizarPermisos(id: number, dto: UpdatePermisosDto, currentUserId: number, currentUserName: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol', 'permisos'] });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
    }

    if (usuario.roles.some(ur => ur.rol.nombre === RolNombre.ADMIN_GLOBAL)) {
      throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Los permisos del ADMIN_GLOBAL no se pueden modificar' });
    }

    return this.usuarioRepo.manager.transaction(async (manager) => {
      let permiso = usuario.permisos;
      if (permiso) {
        if (dto.puedeVer !== undefined) permiso.puedeVer = dto.puedeVer;
        if (dto.puedeCrear !== undefined) permiso.puedeCrear = dto.puedeCrear;
        if (dto.puedeEditar !== undefined) permiso.puedeEditar = dto.puedeEditar;
        if (dto.puedeEliminar !== undefined) permiso.puedeEliminar = dto.puedeEliminar;
        permiso.asignadoPor = currentUserId;
      } else {
        permiso = manager.create(UsuarioPermiso, {
          usuarioId: id,
          puedeVer: dto.puedeVer ?? true,
          puedeCrear: dto.puedeCrear ?? false,
          puedeEditar: dto.puedeEditar ?? false,
          puedeEliminar: dto.puedeEliminar ?? false,
          asignadoPor: currentUserId,
        });
      }
      await manager.save(permiso);

      await manager.save(manager.create(AuditLog, {
        actorId: currentUserId,
        actorNombre: currentUserName,
        accion: 'ACTUALIZAR_PERMISOS',
        entidad: 'UsuarioPermiso',
        entidadId: id,
        descripcion: `Actualizó permisos de '${usuario.nombreCompleto}' (${usuario.email}): ver=${permiso.puedeVer} crear=${permiso.puedeCrear} editar=${permiso.puedeEditar} eliminar=${permiso.puedeEliminar}.`,
      }));

      return manager.findOne(Usuario, {
        where: { id },
        relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada'],
      });
    });
  }

  async desbloquearUsuario(id: number, currentUserId: number, currentUserName: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
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
    return this.mapUsuarioResponse(actualizado!);
  }

  async asignarRol(
    id: number,
    rolNombre: string,
    currentUserId: number,
    currentUserName: string,
    sedeAsignadaId?: number,
    sedesAsignadasIds?: number[],
  ) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.rol', 'sedesAsignadas'],
    });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
    }

    const rol = await this.rolRepo.findOne({ where: { nombre: rolNombre as RolNombre, activo: true } });
    if (!rol) {
      throw new NotFoundException({ code: 'ROL_NO_ENCONTRADO', message: `El rol '${rolNombre}' no existe o está inactivo` });
    }

    if (usuario.roles.some(ur => ur.rol.nombre === rolNombre)) {
      throw new ConflictException({ code: 'ROL_DUPLICADO', message: `El usuario ya tiene el rol '${rolNombre}'` });
    }

    const esRolVigilante = rolNombre === RolNombre.VIGILANTE_HSE || rolNombre === RolNombre.VIGILANTE_PARKING;
    const sedesNuevas = this.resolverIdsSedes({ sedeAsignadaId, sedesAsignadasIds });
    const tieneSedesPrevias = !!usuario.sedeAsignadaId || (usuario.sedesAsignadas?.length ?? 0) > 0;

    if (esRolVigilante && !tieneSedesPrevias && sedesNuevas.length === 0) {
      throw new BadRequestException({
        code: 'SEDE_REQUERIDA',
        message: 'Los vigilantes deben tener al menos una sede asignada.',
      });
    }
    await this.validarSedesExisten(sedesNuevas);

    return this.usuarioRepo.manager.transaction(async (manager) => {
      if (esRolVigilante && sedesNuevas.length > 0) {
        await this.sincronizarSedesUsuario(manager, id, sedesNuevas);
        await manager.update(Usuario, { id }, { sedeAsignadaId: sedesNuevas[0] });
      }

      // Check for a soft-deleted record first (unique constraint would fail on re-insert)
      const existente = await manager.getRepository(UsuarioRol).findOne({
        where: { usuarioId: id, rolId: rol.id },
        withDeleted: true,
      });

      if (existente?.deleted_at) {
        await manager
          .createQueryBuilder()
          .update(UsuarioRol)
          .set({ deleted_at: () => 'NULL', asignadoPor: currentUserId })
          .where('id = :existenteId', { existenteId: existente.id })
          .execute();
      } else if (!existente) {
        const nuevoRol = manager.create(UsuarioRol, {
          usuarioId: id,
          rolId: rol.id,
          asignadoPor: currentUserId,
        });
        await manager.save(nuevoRol);
      }

      await manager.save(manager.create(AuditLog, {
        actorId: currentUserId,
        actorNombre: currentUserName,
        accion: 'ASIGNAR_ROL',
        entidad: 'UsuarioRol',
        entidadId: id,
        descripcion: `Asignó rol '${rolNombre}' a '${usuario.nombreCompleto}' (${usuario.email}).`,
      }));

      const usuarioActualizado = await manager.findOne(Usuario, {
        where: { id },
        relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
      });
      return this.mapUsuarioResponse(usuarioActualizado!);
    });
  }

  async quitarRol(id: number, rolNombre: string, currentUserId: number, currentUserName: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id }, relations: ['roles', 'roles.rol'] });
    if (!usuario) {
      throw new NotFoundException({ code: 'USUARIO_NO_ENCONTRADO', message: 'El usuario no existe' });
    }

    if (rolNombre === RolNombre.ADMIN_GLOBAL) {
      const otrosAdminsCount = await this.usuarioRolRepo.count({
        where: {
          rol: { nombre: RolNombre.ADMIN_GLOBAL },
          usuario: { activo: true }
        },
        relations: ['rol', 'usuario']
      });
      if (otrosAdminsCount <= 1) {
        throw new ForbiddenException({ code: 'ACCION_NO_PERMITIDA', message: 'Debe existir al menos un ADMIN_GLOBAL activo en el sistema' });
      }
    }

    const ur = usuario.roles.find(ur => ur.rol.nombre === rolNombre);
    if (!ur) {
      throw new NotFoundException({ code: 'ROL_NO_ASIGNADO', message: `El usuario no tiene el rol '${rolNombre}'` });
    }

    return this.usuarioRepo.manager.transaction(async (manager) => {
      await manager.delete(UsuarioRol, { id: ur.id });

      await manager.save(manager.create(AuditLog, {
        actorId: currentUserId,
        actorNombre: currentUserName,
        accion: 'QUITAR_ROL',
        entidad: 'UsuarioRol',
        entidadId: id,
        descripcion: `Quitó rol '${rolNombre}' a '${usuario.nombreCompleto}' (${usuario.email}).`,
      }));

      const usuarioActualizado = await manager.findOne(Usuario, {
        where: { id },
        relations: ['roles', 'roles.rol', 'perfil', 'permisos', 'sedeAsignada', 'sedesAsignadas', 'sedesAsignadas.sede'],
      });
      return this.mapUsuarioResponse(usuarioActualizado!);
    });
  }
}
