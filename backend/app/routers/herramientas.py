"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Router de Herramientas — gestión de usuarios, roles y permisos del sistema.

Acceso exclusivo: ADMIN_GLOBAL

Endpoints:
  GET    /herramientas/roles                             → Listar roles
  GET    /herramientas/usuarios                          → Listar usuarios
  POST   /herramientas/usuarios                          → Crear usuario
  PUT    /herramientas/usuarios/{id}                     → Actualizar usuario
  PUT    /herramientas/usuarios/{id}/permisos            → Actualizar permisos granulares
  POST   /herramientas/usuarios/{id}/roles               → Asignar rol
  DELETE /herramientas/usuarios/{id}/roles/{rol_nombre}  → Quitar rol
  GET    /herramientas/auditoria                         → Ver registro de auditoría
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import re
import json
from datetime import datetime, timezone
import unicodedata

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.usuario import (
    AuditLog, Perfil, Rol, RolNombre,
    Usuario, UsuarioPermiso, UsuarioRol,
)
from app.schemas.common import ApiResponse, ok, err
from app.utils.password import hash_password

router = APIRouter(
    prefix="/api/v1/herramientas",
    tags=["🛠 Herramientas"],
    dependencies=[Depends(require_role(RolNombre.ADMIN_GLOBAL))],
)


# ═══════════════════════════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════════════════════════

class RolSimple(BaseModel):
    id:     int
    nombre: str

    class Config:
        from_attributes = True


class PermisosResponse(BaseModel):
    puede_ver:      bool
    puede_crear:    bool
    puede_editar:   bool
    puede_eliminar: bool

    class Config:
        from_attributes = True


class UsuarioCreateRequest(BaseModel):
    email:                 EmailStr
    nombres:               str = Field(min_length=3, max_length=150)
    apellidos:             str = Field(min_length=2, max_length=150)
    numero:                str = Field(min_length=7, max_length=20)
    direccion:             str = Field(min_length=5, max_length=150)
    rol_nombre:            str | None = None
    roles_nombres:         list[str] | None = None
    password:              str = Field(min_length=8)
    password_confirmacion: str = Field(min_length=8)
    firma_creador:         str | None = Field(default=None, max_length=150)
    permisos:              dict[str, bool] | None = None
    sede_asignada_id:      int | None = None  # Obligatorio para vigilantes


class UsuarioUpdateRequest(BaseModel):
    nombre_completo: str | None = Field(default=None, min_length=3, max_length=150)
    numero:          str | None = Field(default=None, min_length=7, max_length=20)
    direccion:       str | None = Field(default=None, min_length=5, max_length=150)
    activo:          bool | None = None


class ActualizarPermisosRequest(BaseModel):
    puede_ver:      bool = True
    puede_crear:    bool = False
    puede_editar:   bool = False
    puede_eliminar: bool = False


class AsignarRolRequest(BaseModel):
    rol_nombre: str


class ResetPasswordRequest(BaseModel):
    password_nueva:        str = Field(min_length=8)
    password_confirmacion: str = Field(min_length=8)
    forzar_cambio:         bool = True


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

def _serialize_permisos(p: UsuarioPermiso | None) -> dict:
    if not p:
        return {"puede_ver": True, "puede_crear": False, "puede_editar": False, "puede_eliminar": False}
    return {
        "puede_ver":      p.puede_ver,
        "puede_crear":    p.puede_crear,
        "puede_editar":   p.puede_editar,
        "puede_eliminar": p.puede_eliminar,
    }


def _serialize_usuario(u: Usuario) -> dict:
    return {
        "id":               u.id,
        "email":            u.email,
        "nombre_completo":  u.nombre_completo,
        "numero":           u.perfil.telefono if u.perfil else None,
        "direccion":        u.perfil.ubicacion if u.perfil else None,
        "activo":           u.activo,
        "ultimo_login":     u.ultimo_login.isoformat() if u.ultimo_login else None,
        "roles":            [{"id": ur.rol.id, "nombre": ur.rol.nombre} for ur in u.roles],
        "permisos":         _serialize_permisos(u.permisos),
        "sede_asignada_id": u.sede_asignada_id,
        "sede_asignada":    (
            {"id": u.sede_asignada.id, "nombre": u.sede_asignada.nombre, "ciudad": u.sede_asignada.ciudad}
            if u.sede_asignada else None
        ),
    }


def _validar_password_fuerte(password: str) -> str | None:
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres."
    if not re.search(r"[A-Z]", password):
        return "La contraseña debe incluir al menos una letra mayúscula."
    if not re.search(r"[a-z]", password):
        return "La contraseña debe incluir al menos una letra minúscula."
    if not re.search(r"\d", password):
        return "La contraseña debe incluir al menos un número."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "La contraseña debe incluir al menos un carácter especial."
    return None


def _normalizar_firma(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    without_marks = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    squashed_spaces = " ".join(without_marks.strip().split())
    return squashed_spaces.casefold()


async def _get_usuario_con_roles(usuario_id: int, db: AsyncSession) -> Usuario | None:
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.roles).selectinload(UsuarioRol.rol),
            selectinload(Usuario.perfil),
            selectinload(Usuario.permisos),
        )
        .where(Usuario.id == usuario_id, Usuario.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def _registrar_auditoria(
    db:          AsyncSession,
    actor:       Usuario,
    accion:      str,
    entidad:     str,
    entidad_id:  int | None,
    descripcion: str,
) -> None:
    """Persiste una entrada en el audit_log."""
    log = AuditLog(
        actor_id     = actor.id,
        actor_nombre = actor.nombre_completo,
        accion       = accion,
        entidad      = entidad,
        entidad_id   = entidad_id,
        descripcion  = descripcion,
    )
    db.add(log)
    # No hacemos commit aquí — el caller lo hará junto con su operación principal


# ═══════════════════════════════════════════════════════════════════
# METADATOS DE ROLES
# ═══════════════════════════════════════════════════════════════════

_ROL_META: dict[str, dict] = {
    RolNombre.ADMIN_GLOBAL: {
        "descripcion": "Acceso total al sistema. Puede gestionar todos los módulos y usuarios.",
        "color": "#F59E0B",
        "modulos": ["Todo el sistema"],
        "grupos": [
            {
                "grupo": "Administracion global",
                "modulo": "Herramientas",
                "submodulos": ["Usuarios", "Roles", "Permisos", "Auditoria"],
                "puede_eliminar": ["Usuarios desactivados", "Asignaciones de rol", "Registros de configuracion"],
            },
            {
                "grupo": "Operacion HSE",
                "modulo": "HSE",
                "submodulos": ["Dashboard", "Panel General", "Gestion", "Vigilante", "Excepciones", "Cumplimiento"],
                "puede_eliminar": ["Autorizaciones rechazadas", "Anotaciones operativas", "Asignaciones temporales"],
            },
            {
                "grupo": "Operacion transversal",
                "modulo": "Parking / NFC / GH",
                "submodulos": ["Parking", "Parking Vigilante", "Activos NFC", "Gestion Humana"],
                "puede_eliminar": ["Registros operativos segun politica", "Asignaciones internas"],
            },
        ],
    },
    RolNombre.ADMIN_HSE: {
        "descripcion": "Gestión completa del módulo HSE. Ve todos los submodulos de HSE y Reportes.",
        "color": "#10B981",
        "modulos": ["Dashboard HSE", "Panel General", "Gestión", "Vigilante", "Excepciones", "Cumplimiento", "Reportes"],
        "grupos": [
            {
                "grupo": "Control HSE",
                "modulo": "HSE",
                "submodulos": ["Dashboard", "Panel General", "Gestion", "Vigilante", "Excepciones", "Cumplimiento"],
                "puede_eliminar": ["Observaciones de checklist", "Asignaciones duplicadas de flujo"],
            },
        ],
    },
    RolNombre.GESTION_HSE: {
        "descripcion": "Gestión de autorizaciones HSE normales y excepciones. No accede a Vigilante.",
        "color": "#6366F1",
        "modulos": ["Dashboard HSE", "Panel General", "Gestión", "Excepciones", "Cumplimiento"],
        "grupos": [
            {
                "grupo": "Gestion documental HSE",
                "modulo": "HSE",
                "submodulos": ["Dashboard", "Panel General", "Gestion", "Excepciones", "Cumplimiento"],
                "puede_eliminar": ["Archivos invalidos", "Comentarios operativos"],
            },
        ],
    },
    RolNombre.VIGILANTE_HSE: {
        "descripcion": "Operación del portal de portería HSE. Verifica y registra accesos.",
        "color": "#EC4899",
        "modulos": ["Dashboard HSE", "Vigilante"],
        "grupos": [
            {
                "grupo": "Porteria HSE",
                "modulo": "HSE",
                "submodulos": ["Dashboard", "Vigilante"],
                "puede_eliminar": ["No aplica"],
            },
        ],
    },
    RolNombre.ADMIN_PARKING: {
        "descripcion": "Gestión del módulo de parqueadero.",
        "color": "#F59E0B",
        "modulos": ["Parking"],
        "grupos": [
            {
                "grupo": "Control de parqueadero",
                "modulo": "Parking",
                "submodulos": ["Panel Parking", "Config cupos", "Bitacora"],
                "puede_eliminar": ["Reservas canceladas", "Registros duplicados"],
            },
        ],
    },
    RolNombre.VIGILANTE_PARKING: {
        "descripcion": "Operación del portal de portería de parqueadero.",
        "color": "#F97316",
        "modulos": ["Parking Vigilante"],
        "grupos": [
            {
                "grupo": "Porteria Parking",
                "modulo": "Parking",
                "submodulos": ["Ingreso", "Salida", "Consulta rapida"],
                "puede_eliminar": ["No aplica"],
            },
        ],
    },
    RolNombre.ADMIN_NFC: {
        "descripcion": "Gestión del módulo de activos con chips NFC.",
        "color": "#8B5CF6",
        "modulos": ["Activos NFC"],
        "grupos": [
            {
                "grupo": "Activos y trazabilidad",
                "modulo": "NFC",
                "submodulos": ["Activos", "Asignacion", "Movimientos", "Auditoria"],
                "puede_eliminar": ["Asignaciones erradas", "Lecturas invalidas"],
            },
        ],
    },
    RolNombre.ADMIN_GH: {
        "descripcion": "Gestión del módulo de Gestión Humana y citas.",
        "color": "#14B8A6",
        "modulos": ["Gestión Humana"],
        "grupos": [
            {
                "grupo": "Gestion humana",
                "modulo": "GH",
                "submodulos": ["Empleados", "Citas", "Novedades"],
                "puede_eliminar": ["Citas canceladas", "Novedades duplicadas"],
            },
        ],
    },
    RolNombre.VISUALIZADOR: {
        "descripcion": "Solo lectura de reportes y dashboards.",
        "color": "#6B7280",
        "modulos": ["Reportes", "Dashboards (solo lectura)"],
        "grupos": [
            {
                "grupo": "Consulta",
                "modulo": "Reportes",
                "submodulos": ["Reportes", "Dashboards"],
                "puede_eliminar": ["No permitido"],
            },
        ],
    },
}


# ═══════════════════════════════════════════════════════════════════
# ROLES
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/roles",
    response_model=ApiResponse[list[dict]],
    summary="Listar todos los roles del sistema con sus metadatos",
)
async def listar_roles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rol).where(Rol.activo == True).order_by(Rol.id))
    roles  = result.scalars().all()

    data = []
    for rol in roles:
        meta = _ROL_META.get(rol.nombre, {})
        data.append({
            "id":          rol.id,
            "nombre":      rol.nombre,
            "descripcion": meta.get("descripcion", rol.descripcion or ""),
            "color":       meta.get("color", "#6B7280"),
            "modulos":     meta.get("modulos", []),
            "grupos":      meta.get("grupos", []),
        })

    return ok(data)


# ═══════════════════════════════════════════════════════════════════
# USUARIOS
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/usuarios",
    response_model=ApiResponse[list[dict]],
    summary="Listar todos los usuarios del sistema",
)
async def listar_usuarios(
    db:      AsyncSession = Depends(get_db),
    current: Usuario      = Depends(get_current_user),
):
    result = await db.execute(
        select(Usuario)
        .options(
            selectinload(Usuario.roles).selectinload(UsuarioRol.rol),
            selectinload(Usuario.perfil),
            selectinload(Usuario.permisos),
        )
        .where(Usuario.deleted_at.is_(None))
        .order_by(Usuario.nombre_completo)
    )
    usuarios = result.scalars().all()
    return ok([_serialize_usuario(u) for u in usuarios])


@router.post(
    "/usuarios",
    response_model=ApiResponse[dict],
    status_code=201,
    summary="Crear nuevo usuario del sistema",
)
async def crear_usuario(
    body:    UsuarioCreateRequest,
    db:      AsyncSession = Depends(get_db),
    current: Usuario      = Depends(get_current_user),
):
    # ── Validaciones ──────────────────────────────────────────────
    password_error = _validar_password_fuerte(body.password)
    if password_error:
        err("PASSWORD_DEBIL", password_error, 400)

    if body.password != body.password_confirmacion:
        err("PASSWORD_NO_COINCIDE", "La confirmación de contraseña no coincide.", 400)

    nombre_creador = (current.nombre_completo or "").strip()
    firma = (body.firma_creador or "").strip()
    if not firma:
        firma = nombre_creador

    if len(firma) < 3:
        err("FIRMA_INVALIDA", "La firma digital debe tener al menos 3 caracteres.", 400)

    if _normalizar_firma(firma) == "":
        err("FIRMA_INVALIDA", "La firma digital ingresada no es válida.", 400)

    existe = await db.execute(
        select(Usuario).where(Usuario.email == body.email, Usuario.deleted_at.is_(None))
    )
    if existe.scalar_one_or_none():
        err("EMAIL_DUPLICADO", f"Ya existe un usuario con el email {body.email}", 409)

    roles_solicitados = list(dict.fromkeys([
        *((body.roles_nombres or [])),
        *([body.rol_nombre] if body.rol_nombre else []),
    ]))

    if not roles_solicitados:
        err("ROL_REQUERIDO", "Debes asignar al menos un rol al usuario.", 400)

    roles_result = await db.execute(
        select(Rol).where(Rol.nombre.in_(roles_solicitados), Rol.activo == True)
    )
    roles_validos = list(roles_result.scalars().all())
    roles_validos_map = {r.nombre: r for r in roles_validos}

    roles_no_encontrados = [r for r in roles_solicitados if r not in roles_validos_map]
    if roles_no_encontrados:
        err("ROL_NO_ENCONTRADO", f"Los roles {roles_no_encontrados} no existen o están inactivos", 404)

    # ── Validar obligatoriedad de sede para vigilantes ─────────────
    ROLES_VIGILANTE = {RolNombre.VIGILANTE_HSE, RolNombre.VIGILANTE_PARKING}
    es_vigilante = bool(set(roles_solicitados) & ROLES_VIGILANTE)
    if es_vigilante and not body.sede_asignada_id:
        err("SEDE_REQUERIDA", "Los vigilantes deben tener una sede asignada obligatoriamente.", 400)

    # ── Crear usuario ─────────────────────────────────────────────
    nuevo = Usuario(
        email                 = body.email,
        nombre_completo       = f"{body.nombres.strip()} {body.apellidos.strip()}".strip(),
        password_hash         = hash_password(body.password),
        activo                = True,
        debe_cambiar_password = True,
        sede_asignada_id      = body.sede_asignada_id if es_vigilante else None,
    )
    db.add(nuevo)
    await db.flush()

    # Heredar sede_default del admin creador
    perfil_creador_result = await db.execute(
        select(Perfil.sede_default_id).where(
            Perfil.usuario_id == current.id,
            Perfil.deleted_at.is_(None),
        )
    )
    sede_default_creador = perfil_creador_result.scalar_one_or_none()

    # Trazabilidad de creación en perfil
    traza_creacion = {
        "creado_por_id":       current.id,
        "creado_por_nombre":   nombre_creador,
        "firma_creador":       firma,
        "roles_iniciales":     roles_solicitados,
        "sede_default_heredada": sede_default_creador,
        "fecha_creacion_utc":  datetime.now(timezone.utc).isoformat(),
    }
    perfil = Perfil(
        usuario_id      = nuevo.id,
        telefono        = body.numero,
        ubicacion       = body.direccion,
        sede_default_id = sede_default_creador,
        biografia       = json.dumps(traza_creacion, ensure_ascii=True),
    )
    db.add(perfil)

    # ── Permisos granulares en tabla dedicada ─────────────────────
    permisos_data = body.permisos or {}
    permiso = UsuarioPermiso(
        usuario_id      = nuevo.id,
        puede_ver       = permisos_data.get("ver", True),
        puede_crear     = permisos_data.get("crear", False),
        puede_editar    = permisos_data.get("editar", False),
        puede_eliminar  = permisos_data.get("eliminar", False),
        asignado_por    = current.id,
    )
    db.add(permiso)

    # ── Asignar roles iniciales ───────────────────────────────────
    for rol_nombre in roles_solicitados:
        rol_obj = roles_validos_map[rol_nombre]
        db.add(UsuarioRol(
            usuario_id   = nuevo.id,
            rol_id       = rol_obj.id,
            asignado_por = current.id,
        ))

    # ── Audit log ─────────────────────────────────────────────────
    await _registrar_auditoria(
        db, current,
        accion      = "CREAR_USUARIO",
        entidad     = "Usuario",
        entidad_id  = nuevo.id,
        descripcion = (
            f"Creó usuario '{nuevo.nombre_completo}' ({body.email}) "
            f"con roles {roles_solicitados}. "
            f"Permisos: ver={permisos_data.get('ver', True)} "
            f"crear={permisos_data.get('crear', False)} "
            f"editar={permisos_data.get('editar', False)} "
            f"eliminar={permisos_data.get('eliminar', False)}."
        ),
    )

    await db.commit()

    usuario_creado = await _get_usuario_con_roles(nuevo.id, db)
    return ok(_serialize_usuario(usuario_creado), "Usuario creado correctamente")


@router.put(
    "/usuarios/{usuario_id}",
    response_model=ApiResponse[dict],
    summary="Actualizar datos básicos de un usuario",
)
async def actualizar_usuario(
    usuario_id: int,
    body:        UsuarioUpdateRequest,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    if body.activo is False and usuario.id == current.id:
        err("ACCION_NO_PERMITIDA", "No puedes desactivar tu propia cuenta")

    # Evita dejar el sistema sin ADMIN_GLOBAL activo
    if body.activo is False and any(ur.rol.nombre == RolNombre.ADMIN_GLOBAL for ur in usuario.roles):
        conteo = await db.execute(
            select(UsuarioRol)
            .join(Rol)
            .join(Usuario)
            .where(
                Rol.nombre == RolNombre.ADMIN_GLOBAL,
                Usuario.id != usuario_id,
                Usuario.activo == True,
                Usuario.deleted_at.is_(None),
            )
        )
        if len(conteo.scalars().all()) == 0:
            err("ACCION_NO_PERMITIDA", "Debe existir al menos un ADMIN_GLOBAL activo", 403)

    cambios = []
    if body.nombre_completo is not None:
        cambios.append(f"nombre='{body.nombre_completo}'")
        usuario.nombre_completo = body.nombre_completo
    if body.numero is not None and usuario.perfil:
        cambios.append(f"numero='{body.numero}'")
        usuario.perfil.telefono = body.numero
    if body.direccion is not None and usuario.perfil:
        cambios.append(f"direccion='{body.direccion}'")
        usuario.perfil.ubicacion = body.direccion
    if body.activo is not None:
        cambios.append(f"activo={body.activo}")
        usuario.activo = body.activo

    await _registrar_auditoria(
        db, current,
        accion      = "DESACTIVAR_USUARIO" if body.activo is False else "ACTUALIZAR_USUARIO",
        entidad     = "Usuario",
        entidad_id  = usuario_id,
        descripcion = (
            f"Actualizó usuario '{usuario.nombre_completo}' ({usuario.email}). "
            f"Cambios: {', '.join(cambios) or 'ninguno'}."
        ),
    )

    await db.commit()
    usuario_actualizado = await _get_usuario_con_roles(usuario_id, db)
    return ok(_serialize_usuario(usuario_actualizado), "Usuario actualizado")


@router.put(
    "/usuarios/{usuario_id}/permisos",
    response_model=ApiResponse[dict],
    summary="Actualizar permisos granulares de un usuario",
)
async def actualizar_permisos(
    usuario_id: int,
    body:        ActualizarPermisosRequest,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    # No se pueden modificar permisos del ADMIN_GLOBAL
    roles_usuario = {ur.rol.nombre for ur in usuario.roles}
    if RolNombre.ADMIN_GLOBAL in roles_usuario:
        err("ACCION_NO_PERMITIDA", "Los permisos del ADMIN_GLOBAL no se pueden modificar", 403)

    if usuario.permisos:
        # Actualizar existente
        usuario.permisos.puede_ver      = body.puede_ver
        usuario.permisos.puede_crear    = body.puede_crear
        usuario.permisos.puede_editar   = body.puede_editar
        usuario.permisos.puede_eliminar = body.puede_eliminar
        usuario.permisos.asignado_por   = current.id
    else:
        # Crear si no existe
        db.add(UsuarioPermiso(
            usuario_id      = usuario_id,
            puede_ver       = body.puede_ver,
            puede_crear     = body.puede_crear,
            puede_editar    = body.puede_editar,
            puede_eliminar  = body.puede_eliminar,
            asignado_por    = current.id,
        ))

    await _registrar_auditoria(
        db, current,
        accion      = "ACTUALIZAR_PERMISOS",
        entidad     = "UsuarioPermiso",
        entidad_id  = usuario_id,
        descripcion = (
            f"Actualizó permisos de '{usuario.nombre_completo}' ({usuario.email}): "
            f"ver={body.puede_ver} crear={body.puede_crear} "
            f"editar={body.puede_editar} eliminar={body.puede_eliminar}."
        ),
    )

    await db.commit()
    usuario_actualizado = await _get_usuario_con_roles(usuario_id, db)
    return ok(_serialize_usuario(usuario_actualizado), "Permisos actualizados correctamente")


@router.delete(
    "/usuarios/{usuario_id}",
    response_model=ApiResponse[dict],
    summary="Eliminar un usuario (Soft Delete)",
)
async def eliminar_usuario(
    usuario_id: int,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    if usuario.id == current.id:
        err("ACCION_NO_PERMITIDA", "No puedes eliminar tu propia cuenta")

    # Si es ADMIN_GLOBAL, verificar que no quede vacío
    es_admin_global = any(ur.rol.nombre == RolNombre.ADMIN_GLOBAL for ur in usuario.roles)
    if es_admin_global:
        conteo = await db.execute(
            select(UsuarioRol)
            .join(Rol)
            .join(Usuario)
            .where(
                Rol.nombre == RolNombre.ADMIN_GLOBAL,
                Usuario.id != usuario_id,
                Usuario.activo == True,
                Usuario.deleted_at.is_(None),
            )
        )
        if len(conteo.scalars().all()) == 0:
            err("ACCION_NO_PERMITIDA", "Debe existir al menos un ADMIN_GLOBAL activo", 403)

    usuario.deleted_at = datetime.now(timezone.utc)
    usuario.activo = False

    await _registrar_auditoria(
        db, current,
        accion      = "ELIMINAR_USUARIO",
        entidad     = "Usuario",
        entidad_id  = usuario_id,
        descripcion = f"Eliminó el usuario '{usuario.nombre_completo}' ({usuario.email}).",
    )

    await db.commit()
    return ok({}, "Usuario eliminado correctamente")


# ═══════════════════════════════════════════════════════════════════
# GESTIÓN DE ROLES
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/usuarios/{usuario_id}/roles",
    response_model=ApiResponse[dict],
    summary="Asignar un rol a un usuario",
)
async def asignar_rol(
    usuario_id: int,
    body:        AsignarRolRequest,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    rol_result = await db.execute(
        select(Rol).where(Rol.nombre == body.rol_nombre, Rol.activo == True)
    )
    rol = rol_result.scalar_one_or_none()
    if not rol:
        err("ROL_NO_ENCONTRADO", f"El rol '{body.rol_nombre}' no existe o está inactivo", 404)

    ya_tiene = any(ur.rol.nombre == body.rol_nombre for ur in usuario.roles)
    if ya_tiene:
        err("ROL_DUPLICADO", f"El usuario ya tiene el rol '{body.rol_nombre}'", 409)

    # Los roles de vigilante exigen sede fija asignada en el usuario
    if body.rol_nombre in {RolNombre.VIGILANTE_HSE, RolNombre.VIGILANTE_PARKING} and not usuario.sede_asignada_id:
        err("SEDE_REQUERIDA", "Los vigilantes deben tener una sede asignada obligatoriamente.", 400)

    db.add(UsuarioRol(
        usuario_id   = usuario_id,
        rol_id       = rol.id,
        asignado_por = current.id,
    ))

    await _registrar_auditoria(
        db, current,
        accion      = "ASIGNAR_ROL",
        entidad     = "UsuarioRol",
        entidad_id  = usuario_id,
        descripcion = f"Asignó rol '{body.rol_nombre}' a '{usuario.nombre_completo}' ({usuario.email}).",
    )

    await db.commit()
    usuario_actualizado = await _get_usuario_con_roles(usuario_id, db)
    return ok(_serialize_usuario(usuario_actualizado), f"Rol '{body.rol_nombre}' asignado correctamente")


@router.delete(
    "/usuarios/{usuario_id}/roles/{rol_nombre}",
    response_model=ApiResponse[dict],
    summary="Quitar un rol de un usuario",
)
async def quitar_rol(
    usuario_id: int,
    rol_nombre:  str,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    # No quitar el último ADMIN_GLOBAL activo
    if rol_nombre == RolNombre.ADMIN_GLOBAL:
        conteo = await db.execute(
            select(UsuarioRol)
            .join(Rol)
            .join(Usuario)
            .where(
                Rol.nombre == RolNombre.ADMIN_GLOBAL,
                Usuario.activo == True,
                Usuario.deleted_at.is_(None),
            )
        )
        if len(conteo.scalars().all()) <= 1:
            err("ACCION_NO_PERMITIDA", "Debe existir al menos un ADMIN_GLOBAL activo en el sistema")

    ur_result = await db.execute(
        select(UsuarioRol)
        .join(Rol)
        .where(UsuarioRol.usuario_id == usuario_id, Rol.nombre == rol_nombre)
    )
    ur = ur_result.scalar_one_or_none()
    if not ur:
        err("ROL_NO_ASIGNADO", f"El usuario no tiene el rol '{rol_nombre}'", 404)

    await db.delete(ur)

    await _registrar_auditoria(
        db, current,
        accion      = "QUITAR_ROL",
        entidad     = "UsuarioRol",
        entidad_id  = usuario_id,
        descripcion = f"Quitó rol '{rol_nombre}' a '{usuario.nombre_completo}' ({usuario.email}).",
    )

    await db.commit()
    usuario_actualizado = await _get_usuario_con_roles(usuario_id, db)
    return ok(_serialize_usuario(usuario_actualizado), f"Rol '{rol_nombre}' removido correctamente")


@router.put(
    "/usuarios/{usuario_id}/password",
    response_model=ApiResponse[dict],
    summary="Resetear contraseña de un usuario",
)
async def resetear_password_usuario(
    usuario_id: int,
    body:        ResetPasswordRequest,
    db:          AsyncSession = Depends(get_db),
    current:     Usuario      = Depends(get_current_user),
):
    usuario = await _get_usuario_con_roles(usuario_id, db)
    if not usuario:
        err("USUARIO_NO_ENCONTRADO", "El usuario no existe", 404)

    password_error = _validar_password_fuerte(body.password_nueva)
    if password_error:
        err("PASSWORD_DEBIL", password_error, 400)

    if body.password_nueva != body.password_confirmacion:
        err("PASSWORD_NO_COINCIDE", "La confirmación de contraseña no coincide.", 400)

    usuario.password_hash = hash_password(body.password_nueva)
    usuario.debe_cambiar_password = bool(body.forzar_cambio)

    await _registrar_auditoria(
        db, current,
        accion      = "RESETEAR_PASSWORD",
        entidad     = "Usuario",
        entidad_id  = usuario_id,
        descripcion = (
            f"Reseteó contraseña de '{usuario.nombre_completo}' ({usuario.email}). "
            f"forzar_cambio={bool(body.forzar_cambio)}"
        ),
    )

    await db.commit()
    usuario_actualizado = await _get_usuario_con_roles(usuario_id, db)
    return ok(_serialize_usuario(usuario_actualizado), "Contraseña actualizada correctamente")


# ═══════════════════════════════════════════════════════════════════
# AUDITORÍA
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/auditoria",
    response_model=ApiResponse[list[dict]],
    summary="Ver registro de auditoría de acciones administrativas",
)
async def listar_auditoria(
    db:     AsyncSession = Depends(get_db),
    limit:  int          = Query(default=50, ge=1, le=200),
    offset: int          = Query(default=0, ge=0),
    accion: str | None   = Query(default=None, description="Filtrar por tipo de acción"),
):
    query = select(AuditLog).order_by(desc(AuditLog.created_at))

    if accion:
        query = query.where(AuditLog.accion == accion.upper())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()

    data = [
        {
            "id":           log.id,
            "actor_id":     log.actor_id,
            "actor_nombre": log.actor_nombre,
            "accion":       log.accion,
            "entidad":      log.entidad,
            "entidad_id":   log.entidad_id,
            "descripcion":  log.descripcion,
            "fecha":        log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]

    return ok(data)
