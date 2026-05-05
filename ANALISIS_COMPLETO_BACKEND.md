# KOAJ Access v2.0 — Análisis Completo del Backend y Conexión Frontend

> **Permoda S.A.S.** — Sistema Inteligente de Control de Accesos  
> Fecha del análisis: 29 de abril de 2026  
> Transición: Python (FastAPI) → Node.js (NestJS)

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Backend Python (FastAPI) — Estado Actual](#2-backend-python-fastapi--estado-actual)
   - [Stack tecnológico](#21-stack-tecnológico)
   - [Estructura de archivos](#22-estructura-de-archivos)
   - [Configuración](#23-configuración)
   - [Capa de base de datos (SQLAlchemy async)](#24-capa-de-base-de-datos-sqlalchemy-async)
   - [Modelo Base (herencia)](#25-modelo-base-herencia)
   - [Modelos ORM completos](#26-modelos-orm-completos)
   - [Sistema de autenticación y autorización](#27-sistema-de-autenticación-y-autorización)
   - [Migraciones (Alembic)](#28-migraciones-alembic)
   - [Routers y Endpoints](#29-routers-y-endpoints)
   - [WebSockets](#210-websockets)
   - [Manejo de errores](#211-manejo-de-errores)
3. [Backend Node (NestJS) — Migración en Progreso](#3-backend-node-nestjs--migración-en-progreso)
   - [Stack tecnológico](#31-stack-tecnológico)
   - [Estructura actual](#32-estructura-actual)
   - [Entidad Base (TypeORM)](#33-entidad-base-typeorm)
   - [Módulos implementados](#34-módulos-implementados)
   - [Interceptores y Filtros](#35-interceptores-y-filtros)
4. [Frontend (React + TypeScript)](#4-frontend-react--typescript)
   - [Stack tecnológico](#41-stack-tecnológico)
   - [Cliente HTTP (Axios)](#42-cliente-http-axios)
   - [Stores de estado (Zustand)](#43-stores-de-estado-zustand)
   - [Tipos TypeScript](#44-tipos-typescript)
5. [Flujo de Conexión Frontend ↔ Backend](#5-flujo-de-conexión-frontend--backend)
6. [Diagrama de Base de Datos (Tablas y Relaciones)](#6-diagrama-de-base-de-datos-tablas-y-relaciones)
7. [Resumen para la Migración](#7-resumen-para-la-migración)

---

## 1. Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  Vite + TypeScript + Zustand + TanStack Query + Axios           │
│  Puerto: 5173 (dev)                                              │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP REST + WebSocket
                           │ Authorization: Bearer <JWT>
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│              BACKEND PYTHON (FastAPI) — PRODUCCIÓN               │
│  FastAPI + SQLAlchemy async + aiomysql + Alembic                │
│  Puerto: 8000                                                    │
│  Base URL: /api/v1                                               │
│  WebSocket: ws://host/ws/{sede_id}?token=JWT                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ mysql+aiomysql://
                           │
┌──────────────────────────┴───────────────────────────────────────┐
│                        MySQL 8.0                                 │
│  Base de datos: koaj_access                                      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              BACKEND NODE (NestJS) — EN MIGRACIÓN                │
│  NestJS + TypeORM + MySQL2                                       │
│  Puerto: 8000 (mismo que Python al terminar migración)           │
│  Base URL: /api/v1 (mismo prefijo)                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Python (FastAPI) — Estado Actual

### 2.1 Stack tecnológico

| Componente          | Tecnología             | Versión |
| ------------------- | ---------------------- | ------- |
| Framework           | FastAPI                | Última  |
| ORM                 | SQLAlchemy 2.0 (async) | 2.0+    |
| Driver MySQL        | aiomysql (async)       | Última  |
| Migraciones         | Alembic                | Última  |
| Validación          | Pydantic v2            | 2.0+    |
| Auth                | JWT (PyJWT) + bcrypt   | -       |
| Pool conexiones     | AsyncAdaptedQueuePool  | -       |
| Gestor dependencias | uv (pyproject.toml)    | -       |

### 2.2 Estructura de archivos

```
backend-python/
├── .env                          # Variables de entorno (no commiteado)
├── .env.example                  # Template de variables
├── .python-version               # Versión de Python
├── alembic.ini                   # Configuración de Alembic
├── pyproject.toml                # Dependencias (uv)
├── uv.lock                       # Lock file
├── seed_roles.py                 # Script para seedear roles iniciales
├── fix_estados_autorizaciones.py # Script de corrección de datos
├── migrate_sede_asignada.py      # Script de migración de sede_asignada
├── temp_check_sede.py            # Script temporal de verificación
│
├── alembic/
│   ├── env.py                    # Configuración del entorno Alembic
│   ├── script.py.mako            # Template de migraciones
│   └── versions/
│       ├── 9bd47572a2e9_initial_schema.py   # Migración vacía (placeholder)
│       ├── a568a1dd6ba1_initial_schema.py   # Migración vacía (placeholder)
│       └── c4f7f8a1b2c3_gh_base_schema.py   # Migración GH (placeholder)
│
├── app/
│   ├── __init__.py
│   ├── config.py                 # Settings globales (pydantic-settings)
│   ├── database.py               # Engine, Session, Base declarativa
│   ├── dependencies.py           # Dependencias FastAPI (auth, roles, permisos)
│   ├── main.py                   # Punto de entrada, middlewares, routers
│   │
│   ├── models/                   # Modelos ORM (SQLAlchemy)
│   │   ├── __init__.py           # Exporta todos los modelos
│   │   ├── base.py               # BaseModel (id, created_at, updated_at, deleted_at)
│   │   ├── usuario.py            # Rol, Usuario, UsuarioRol, RefreshToken, Perfil, UsuarioPermiso, AuditLog
│   │   ├── sede.py               # Sede, Ubicacion
│   │   ├── persona.py            # Proveedor, Persona
│   │   ├── hse.py                # 17 tablas del módulo HSE
│   │   └── gh.py                 # 12 tablas del módulo Gestión Humana
│   │
│   ├── schemas/                  # Schemas Pydantic (request/response)
│   ├── routers/                  # Endpoints FastAPI
│   │   ├── __init__.py
│   │   ├── auth.py               # /auth/login, /auth/refresh, /auth/logout, /auth/cambiar-password, /auth/me
│   │   ├── config.py             # Configuración del sistema
│   │   ├── gh.py                 # Gestión Humana
│   │   ├── herramientas.py       # Herramientas de administración
│   │   ├── hse.py                # Módulo HSE
│   │   └── ws.py                 # WebSocket /ws/{sede_id}
│   │
│   ├── services/                 # Lógica de negocio
│   ├── repositories/             # Capa de acceso a datos
│   ├── seeders/                  # Seeders de datos iniciales
│   └── utils/                    # Utilidades (JWT, etc.)
│
├── tests/                        # Tests
└── uploads/                      # Archivos subidos
    └── hse/                      # Certificados y documentos HSE
```

### 2.3 Configuración

**Archivo: `app/config.py`** — Clase `Settings` usando `pydantic-settings`:

```python
class Settings(BaseSettings):
    # Aplicación
    APP_NAME: str = "KOAJ Access API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"  # development | production
    DEBUG: bool = True

    # Base de datos
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/koaj_access"

    # JWT
    SECRET_KEY: str = "dev-secret-key-NO-usar-en-produccion-32chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Archivos
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5

    # API Keys hardware externo
    LPR_API_KEY: str = ""        # Cámara LPR parqueadero
    NFC_READER_API_KEY: str = "" # Lector NFC activos
```

**Variables de entorno (`.env`):**

```
DATABASE_URL=mysql+pymysql://usuario:password@host:3306/koaj_access
SECRET_KEY=...
ALLOWED_ORIGINS=http://localhost:5173,https://koajaccess.permoda.com
```

### 2.4 Capa de base de datos (SQLAlchemy async)

**Archivo: `app/database.py`**

```python
# Base declarativa — todos los modelos heredan de esta
class Base(DeclarativeBase):
    pass

# URL async: reemplaza pymysql por aiomysql
DATABASE_URL_ASYNC = settings.DATABASE_URL.replace(
    "mysql+pymysql://", "mysql+aiomysql://"
)

# Engine async con pool de conexiones
engine = create_async_engine(
    DATABASE_URL_ASYNC,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=10,        # 10 conexiones base
    max_overflow=20,     # +20 en picos
    pool_pre_ping=True,  # Verifica salud antes de usar
    pool_recycle=3600,   # Recicla cada hora
    pool_timeout=10,     # Timeout de espera
    echo=settings.DEBUG, # Log SQL en desarrollo
)

# Fábrica de sesiones
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Dependencia FastAPI para inyección de sesiones
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        try:
            yield db
        except Exception:
            await db.rollback()
            raise
```

**Puntos clave:**

- **MySQL asíncrono** con `aiomysql` (no bloqueante)
- **Pool de conexiones** configurado para producción
- **Soft delete** automático vía `deleted_at`
- En desarrollo: `create_all_tables()` sincroniza modelos → tablas
- En producción: solo Alembic para migraciones

### 2.5 Modelo Base (herencia)

**Archivo: `app/models/base.py`**

```python
class BaseModel(Base):
    __abstract__ = True

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
```

**TODOS los modelos heredan de `BaseModel`**, lo que garantiza:

- `id` autoincremental
- `created_at` automático
- `updated_at` automático en cada update
- `deleted_at` para soft delete (NULL = activo)

### 2.6 Modelos ORM completos

#### 2.6.1 Módulo Auth/Usuarios (`usuario.py`) — 7 tablas

| Tabla              | Descripción                   | Columnas clave                                                                                                                                                                 |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cat_roles`        | Catálogo de roles del sistema | `nombre` (Enum: ADMIN_GLOBAL, ADMIN_PARKING, ADMIN_HSE, GESTION_HSE, ADMIN_NFC, ADMIN_GH, VIGILANTE_HSE, VIGILANTE_PARKING, VISUALIZADOR), `descripcion`, `activo`             |
| `usuarios`         | Cuentas de acceso             | `email` (unique), `password_hash`, `nombre_completo`, `activo`, `debe_cambiar_password`, `ultimo_login`, `intentos_fallidos`, `bloqueado_hasta`, `sede_asignada_id` (FK→sedes) |
| `usuario_roles`    | Pivot N:M usuario↔rol         | `usuario_id` (FK), `rol_id` (FK), `asignado_por` (FK), UniqueConstraint(usuario_id, rol_id)                                                                                    |
| `refresh_tokens`   | Tokens de refresco activos    | `usuario_id` (FK), `jti` (UUID v4, unique), `revocado`, `expira_en`, `user_agent`, `ip_address`                                                                                |
| `perfiles`         | Perfil extendido 1:1          | `usuario_id` (FK, unique), `foto_perfil`, `biografia`, `ubicacion`, `telefono`, `sede_default_id` (FK), `tema` (dark/light), `notificaciones_email`                            |
| `usuario_permisos` | Permisos granulares 1:1       | `usuario_id` (FK, unique), `puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`, `asignado_por` (FK)                                                                   |
| `audit_log`        | Auditoría inmutable           | `actor_id` (FK), `actor_nombre`, `accion`, `entidad`, `entidad_id`, `descripcion`                                                                                              |

**Relaciones del modelo Usuario:**

```
Usuario
  ├── roles: List[UsuarioRol]          (1:N, selectin)
  ├── refresh_tokens: List[RefreshToken] (1:N)
  ├── perfil: Perfil                   (1:1, selectin)
  ├── permisos: UsuarioPermiso         (1:1, selectin)
  └── sede_asignada: Sede              (N:1, selectin)
```

**Roles del sistema:**
| Rol | Descripción |
|-----|-------------|
| `ADMIN_GLOBAL` | Acceso total al sistema (bypasea todos los permisos) |
| `ADMIN_PARKING` | Gestión del módulo parking |
| `ADMIN_HSE` | Gestión del módulo HSE |
| `GESTION_HSE` | Operación HSE (sin eliminar) |
| `ADMIN_NFC` | Gestión del módulo NFC |
| `ADMIN_GH` | Gestión del módulo Gestión Humana |
| `VIGILANTE_HSE` | Operación en portería HSE |
| `VIGILANTE_PARKING` | Operación en portería parking |
| `VISUALIZADOR` | Solo lectura de reportes |

#### 2.6.2 Módulo Sedes (`sede.py`) — 2 tablas

| Tabla         | Descripción                      | Columnas clave                                                                                                                                                                           |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sedes`       | Instalaciones físicas de Permoda | `nombre` (unique), `codigo` (unique, ej: CORP, TEQ), `ciudad`, `direccion`, `telefono`, `activa`, `capacidad_carros`, `capacidad_motos`, `capacidad_bicis`, `aplica_pico_placa`, `notas` |
| `ubicaciones` | Zonas dentro de cada sede        | `sede_id` (FK), `nombre`, `codigo`, `tipo` (GENERAL/PARKING/PRODUCCION/ADMIN/BODEGA/TECNICA), `activa`, `descripcion`                                                                    |

**Sedes conocidas:** Corporativo, Tequendama, Funza CIL, Funza Producción, Zona Franca, Terrapuerto, Calle 18, CDR Medellín, CDR Cali, Tiendas Bogotá, Calle 19, Girardota

#### 2.6.3 Módulo Personas (`persona.py`) — 2 tablas

| Tabla         | Descripción          | Columnas clave                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proveedores` | Empresas/proveedores | `nom_proveedor`, `nit_proveedor` (unique), `tipo_identificacion_prov`, `estado_prov`, `direccion_prov`, `telefono_prov`, `email_contacto`, `ciudad`, `tratamiento_datos`, `notas`                                                                                                                                                                                                                                         |
| `personas`    | Personas naturales   | `tipo_documento` (Enum: CC/CE/PASAPORTE/TI/NIT), `numero_documento`, `nombres`, `apellidos`, `email`, `telefono_celular`, `ciudad_operacion`, `direccion_domicilio`, `es_extranjero`, `fecha_nacimiento`, `tratamiento_datos`, `proveedor_id` (FK), `tipologia_hse` (Enum: CONTRATISTA_EMPRESA/TECNICO_INDEPENDIENTE/PROVEEDOR_SERVICIOS/INSPECTOR_AUDITOR/FUNCIONARIO_PUBLICO), `activo`, `notas` + campos de emergencia |

**Relación:** `Proveedor 1──N Persona`

#### 2.6.4 Módulo HSE (`hse.py`) — 17 tablas

**Catálogos (4):**

| Tabla                  | Descripción                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `cat_eps`              | EPS (nombre, codigo, activa)                                     |
| `cat_arl`              | ARL (nombre, codigo, activa)                                     |
| `cat_afp`              | AFP (nombre, codigo, activa)                                     |
| `cat_normas_seguridad` | Normas de seguridad (numero, titulo, contenido, activa, sede_id) |

**Núcleo (2):**

| Tabla                | Descripción                        | Columnas clave                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hse_autorizaciones` | Cabecera de autorización HSE       | `codigo` (HSE-2026-XXXX), `proveedor_id` (FK), `sede_id` (FK), `creado_por` (FK→usuarios), `responsable_interno_id` (FK), `tipo_contratista` (ALTO_RIESGO/NORMAL), `descripcion_actividad`, `fecha_inicio`, `fecha_fin`, `estado` (BORRADOR/PENDIENTE_AUTOGESTION/EN_REVISION/APROBADO/DENEGADO/VENCIDO), `motivo_denegacion`                                                                                                      |
| `hse_contratistas`   | Persona dentro de una autorización | `autorizacion_id` (FK), `persona_id` (FK), `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `email`, `telefono`, `es_extranjero`, `estado` (PENDIENTE_AUTOGESTION/AUTOGESTION_EN_PROGRESO/AUTOGESTION_COMPLETADA/EN_REVISION/APROBADO/DENEGADO), `token_autogestion` (64 chars, unique), `token_expira_en`, `token_duracion_horas`, `autogestion_completada_en`, `sst_responsable_nombre`, `sst_responsable_telefono` |

**Autogestión (6):**

| Tabla                         | Descripción                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `hse_clasificacion_actividad` | 8 preguntas SI/NO + campos de alturas, confinados, eléctrico, caliente, izaje, extranjero, residuos |
| `hse_seguridad_social`        | EPS/ARL/AFP/PILA/SST del contratista y cuadrilla                                                    |
| `hse_certificaciones`         | ART y permiso de trabajo                                                                            |
| `hse_examen_medico`           | Solo para ALTO_RIESGO (fecha, concepto, restricción, archivo)                                       |
| `hse_contacto_emergencia`     | Contacto + datos médicos (RH, alergias, condición médica)                                           |
| `hse_aceptacion_normas`       | Firma digital, IP, fecha de aceptación                                                              |

**Operación (3):**

| Tabla                    | Descripción                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `hse_accesos`            | Registro entrada/salida en portería (tipo, metodo, ubicacion_id, fecha_hora) |
| `hse_cumplimiento`       | Verificación de jornada (estado, observacion, firma_digital)                 |
| `hse_cumplimiento_items` | Items del checklist de cumplimiento                                          |

**Control (2):**

| Tabla                   | Descripción                                   |
| ----------------------- | --------------------------------------------- |
| `hse_excepciones`       | Personas pre-aprobadas sin protocolo completo |
| `hse_historial_estados` | Trazabilidad de cambios de estado (inmutable) |

**Flujo de estados HSE:**

```
BORRADOR → PENDIENTE_AUTOGESTION → EN_REVISION → APROBADO
                                                  → DENEGADO
                                                  → VENCIDO (por fecha)
```

#### 2.6.5 Módulo Gestión Humana (`gh.py`) — 12 tablas

| Tabla                          | Descripción                                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gh_candidatos`                | Personas en procesos GH (tipo/num documento, nombres, apellidos, email, telefono)                                                                                                                |
| `gh_citas`                     | Agenda de citas (codigo GH-2026-XXXX, tipo: INDUCCION/FIRMA_CONTRATO/ENTREGA_DOTACION/ENTREVISTA, estado: PROGRAMADA/CONFIRMADA/EN_CURSO/FINALIZADA/NO_ASISTIO/CANCELADA, fecha_hora_inicio/fin) |
| `gh_portal_tokens`             | Tokens de acceso al portal público (token 64 chars, expira_en, usado_en)                                                                                                                         |
| `gh_accesos_vigilancia`        | Registro de acceso en portería (tipo: ENTRADA/SALIDA, metodo)                                                                                                                                    |
| `gh_importaciones`             | Importaciones por lote (archivo, estado, filas_totales/exitosas/fallidas)                                                                                                                        |
| `gh_importaciones_detalle`     | Detalle por fila de importación                                                                                                                                                                  |
| `gh_auditoria`                 | Auditoría específica del módulo GH                                                                                                                                                               |
| `gh_sesiones_induccion`        | Sesiones de inducción (area, tipo, fechas, estado, códigos checkin/checkout)                                                                                                                     |
| `gh_induccion_asistencias`     | Asistencia a inducciones (token_autogestion 96 chars, checkin_at, checkout_at, intentos_codigo)                                                                                                  |
| `gh_maestro_dotacion`          | Catálogo maestro de dotación (sede, area, cargo, tipo_contrato, kit)                                                                                                                             |
| `gh_dotacion_entregas`         | Entregas de dotación (estado: PENDIENTE/PARCIAL/COMPLETA/REPROGRAMADA/ANULADA)                                                                                                                   |
| `gh_dotacion_entregas_detalle` | Detalle de items entregados                                                                                                                                                                      |

### 2.7 Sistema de autenticación y autorización

**Archivo: `app/dependencies.py`**

#### Jerarquía de dependencias:

```
get_current_user          → Extrae y valida JWT, retorna Usuario ORM
    ↓
require_role(*roles)      → Verifica que el usuario tenga al menos uno de los roles
    ↓
require_permiso(op)       → Verifica permiso granular (ver/crear/editar/eliminar)
```

#### Flujo de autenticación:

1. **Login:** `POST /api/v1/auth/login` → valida email+password, genera access_token (30 min) + refresh_token (7 días)
2. **Refresh:** `POST /api/v1/auth/refresh` → rota refresh token, revoca el anterior
3. **Logout:** `POST /api/v1/auth/logout` → revoca todos los refresh tokens del usuario
4. **Cambiar password:** `POST /api/v1/auth/cambiar-password` → verifica actual, valida fortaleza, revoca otros tokens
5. **Perfil:** `GET /api/v1/auth/me` → retorna datos del usuario autenticado

#### Control de acceso:

- **ADMIN_GLOBAL**: bypasea TODAS las verificaciones de rol y permiso
- **Otros roles**: verificados por `require_role()`
- **Permisos granulares**: `puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar` en `usuario_permisos`
- **Seguridad de cuenta**: bloqueo tras 5 intentos fallidos por 15 minutos
- **Primer acceso**: `debe_cambiar_password=True` → redirige a CambiarPasswordView

#### API Keys para hardware:

- `X-LPR-API-Key`: cámara LPR del parqueadero
- `X-NFC-API-Key`: lector fijo NFC de activos

### 2.8 Migraciones (Alembic)

**Archivo: `alembic.ini`** + `alembic/env.py`

Las migraciones actuales están **vacías** (placeholder). El esquema se crea en desarrollo con `Base.metadata.create_all()`.

**Migraciones existentes:**

1. `9bd47572a2e9_initial_schema.py` — vacía (pass)
2. `a568a1dd6ba1_initial_schema.py` — vacía (pass), depende de la anterior
3. `c4f7f8a1b2c3_gh_base_schema.py` — placeholder para GH

**Scripts de migración manual:**

- `migrate_sede_asignada.py` — migra datos de sede_asignada
- `fix_estados_autorizaciones.py` — corrige estados de autorizaciones HSE
- `seed_roles.py` — crea los roles iniciales del sistema

### 2.9 Routers y Endpoints

**Archivo: `app/main.py`** — Registro de routers:

```python
app.include_router(auth_router,          prefix="/api/v1")
app.include_router(hse_router,           prefix="/api/v1")
app.include_router(gh_router)            # Sin prefijo (definido en el router)
app.include_router(config_router)        # Sin prefijo
app.include_router(herramientas_router)  # Sin prefijo (definido en el router)
app.include_router(ws_router)            # Sin prefijo: ws://host/ws/{sede_id}
```

#### Endpoints Auth (`/api/v1/auth`):

| Método | Ruta                     | Auth | Descripción              |
| ------ | ------------------------ | ---- | ------------------------ |
| POST   | `/auth/login`            | No   | Login con email+password |
| POST   | `/auth/refresh`          | No   | Rotar refresh token      |
| POST   | `/auth/logout`           | Sí   | Cerrar sesión            |
| POST   | `/auth/cambiar-password` | Sí   | Cambiar contraseña       |
| GET    | `/auth/me`               | Sí   | Perfil del usuario       |

#### Endpoints del sistema:

| Método | Ruta      | Descripción             |
| ------ | --------- | ----------------------- |
| GET    | `/`       | Info de la API          |
| GET    | `/health` | Health check (DB + API) |

#### Módulos planificados (sprints):

| Sprint     | Módulo                                  | Estado          |
| ---------- | --------------------------------------- | --------------- |
| Sprint 1   | Auth, HSE, GH, Config, Herramientas, WS | ✅ Implementado |
| Sprint 2   | Personas, Accesos                       | 📋 Planificado  |
| Sprint 3-4 | Parking                                 | 📋 Planificado  |
| Sprint 5-6 | HSE (completo)                          | 🔄 En progreso  |
| Sprint 7   | Activos NFC                             | 📋 Planificado  |
| Sprint 8   | GH (completo)                           | 🔄 En progreso  |
| Sprint 9   | Reportes, Config                        | 📋 Planificado  |

### 2.10 WebSockets

**Archivo: `app/routers/ws.py`**

**Endpoint:** `ws://{host}/ws/{sede_id}?token={JWT}`

**Protocolo:**

- **Conexión:** Cliente envía JWT por query param `token`
- **Autenticación:** Valida token, usuario activo, permisos por sede
- **Heartbeat:** Cliente envía `{"type": "PING"}` → Servidor responde `{"type": "PONG"}`
- **Mensajes:** Servidor envía eventos tipo `WSMessage` cuando hay novedades

**Validación de sede:**

- ADMIN_GLOBAL y ADMIN_HSE: acceso a cualquier sede
- Otros roles: verifican `sede_asignada_id` o `sede_default_id` del perfil

### 2.11 Manejo de errores

**Formato estándar de respuesta exitosa:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Formato estándar de error:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción legible",
    "details": null
  }
}
```

**Handlers globales en `main.py`:**

- `HTTPException` → formatea al estándar
- `RequestValidationError` → errores 422 de Pydantic
- `Exception` → captura errores no manejados
- `ResponseValidationError` → errores de serialización

---

## 3. Backend Node (NestJS) — Migración en Progreso

### 3.1 Stack tecnológico

| Componente      | Tecnología       |
| --------------- | ---------------- |
| Framework       | NestJS           |
| ORM             | TypeORM          |
| Base de datos   | MySQL (misma BD) |
| Lenguaje        | TypeScript       |
| Gestor paquetes | npm              |

### 3.2 Estructura actual

```
backend-node/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .prettierrc
├── eslint.config.mjs
└── src/
    ├── main.ts                    # Bootstrap (CORS, ValidationPipe, Interceptors, Filters)
    ├── app.module.ts              # Módulo raíz
    ├── app.controller.ts          # Health check
    ├── app.service.ts
    │
    ├── auth/                      # Módulo de autenticación
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   └── auth.service.ts
    │
    ├── common/                    # Código compartido
    │   ├── entities/
    │   │   └── base.entity.ts     # BaseEntity (TypeORM)
    │   ├── filters/
    │   │   └── http-exception.filter.ts
    │   └── interceptors/
    │       └── api-response.interceptor.ts
    │
    ├── hse/                       # Módulo HSE
    │   └── hse.module.ts
    ├── gh/                        # Módulo GH
    │   └── gh.module.ts
    ├── config/                    # Módulo Config
    │   └── config.module.ts
    ├── config-koaj/               # Módulo Config Koaj
    │   └── config-koaj.module.ts
    ├── herramientas/              # Módulo Herramientas
    │   └── herramientas.module.ts
    ├── parking/                   # Módulo Parking
    │   └── parking.module.ts
    ├── nfc/                       # Módulo NFC
    │   └── nfc.module.ts
    └── websockets/                # Módulo WebSockets
        └── websockets.module.ts
```

### 3.3 Entidad Base (TypeORM)

**Archivo: `src/common/entities/base.entity.ts`**

```typescript
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: "created_at", type: "datetime" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at", type: "datetime" })
  updated_at: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "datetime", nullable: true })
  deleted_at: Date | null;
}
```

**Equivalencia con Python:**

- `BaseModel` (SQLAlchemy) ↔ `BaseEntity` (TypeORM)
- Mismos campos: id, created_at, updated_at, deleted_at
- Soft delete automático con `@DeleteDateColumn()`
- `repo.softDelete()` / `repo.softRemove()` ↔ `deleted_at = now()`
- `repo.restore()` para recuperar registros

### 3.4 Módulos implementados

**Estado actual de la migración:**

| Módulo       | Python         | Node                                    | Estado      |
| ------------ | -------------- | --------------------------------------- | ----------- |
| Auth         | ✅ Completo    | 🔄 Módulo creado (controller + service) | En progreso |
| HSE          | ✅ Completo    | 📁 Módulo vacío                         | Pendiente   |
| GH           | ✅ Completo    | 📁 Módulo vacío                         | Pendiente   |
| Config       | ✅ Completo    | 📁 Módulo vacío                         | Pendiente   |
| Herramientas | ✅ Completo    | 📁 Módulo vacío                         | Pendiente   |
| Parking      | 📋 Planificado | 📁 Módulo vacío                         | Pendiente   |
| NFC          | 📋 Planificado | 📁 Módulo vacío                         | Pendiente   |
| WebSockets   | ✅ Completo    | 📁 Módulo vacío                         | Pendiente   |

### 3.5 Interceptores y Filtros

**ApiResponseInterceptor** (`common/interceptors/api-response.interceptor.ts`):

- Envuelve respuestas exitosas en `{ success: true, data: <payload> }`
- Equivalente a `ok()` de Python

**HttpExceptionFilter** (`common/filters/http-exception.filter.ts`):

- Convierte excepciones en `{ success: false, error: { code, message } }`
- Equivalente a `err()` de Python

**Configuración en `main.ts`:**

- Prefijo global: `/api/v1` (idéntico a Python)
- CORS: `localhost:5173`, `localhost:3000` + origins de `.env`
- ValidationPipe global con whitelist y transform
- Graceful shutdown hooks

---

## 4. Frontend (React + TypeScript)

### 4.1 Stack tecnológico

| Componente    | Tecnología                        |
| ------------- | --------------------------------- |
| Framework     | React 19                          |
| Build tool    | Vite                              |
| Lenguaje      | TypeScript                        |
| Estado global | Zustand                           |
| Data fetching | TanStack Query (React Query)      |
| HTTP client   | Axios                             |
| UI            | Tailwind CSS + componentes custom |
| Router        | React Router                      |

### 4.2 Cliente HTTP (Axios)

**Archivo: `frontend/src/services/api.ts`**

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || "";
const API_PREFIX = "/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});
```

**Interceptores:**

1. **Request:** Inyecta `Authorization: Bearer <token>` automáticamente
2. **Response (401):** Refresh automático del token
   - Si hay refresh en progreso, encola requests
   - Si no hay refresh token → fuerza logout
   - Al refrescar exitosamente → notifica al WebSocket para reconectar

**Storage de tokens:**

```typescript
tokenStorage = {
  getAccessToken(): string | null    // localStorage: 'koaj_access_token'
  getRefreshToken(): string | null   // localStorage: 'koaj_refresh_token'
  setTokens(access, refresh): void
  clearTokens(): void
}
```

**Helpers de request:**

```typescript
get<T>(url, config?): Promise<T>     // GET → extrae response.data.data
post<T>(url, data?, config?): Promise<T>
put<T>(url, data?, config?): Promise<T>
patch<T>(url, data?, config?): Promise<T>
del<T>(url, config?): Promise<T>
upload<T>(url, formData, onProgress?): Promise<T>  // multipart/form-data
fetchBlob(url): Promise<Blob>        // Descarga de archivos
getErrorMessage(error): string       // Extrae mensaje legible del error
```

### 4.3 Stores de estado (Zustand)

#### Auth Store (`authStore.ts`)

```typescript
interface AuthState {
  usuario: UsuarioMe | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUsuario(usuario, accessToken, refreshToken): void;
  clearSession(): void;
  setLoading(loading): void;

  hasRole(role: RolNombre): boolean;
  hasAnyRole(roles: RolNombre[]): boolean;
  isAdmin(): boolean;
}
```

#### Sede Store (`sedeStore.ts`)

- Gestiona la sede activa seleccionada
- Lista de sedes disponibles

#### WebSocket Store (`wsStore.ts`)

- Estado de conexión: CONECTADO/DESCONECTADO/RECONECTANDO/ERROR
- Conexión por sede: `ws://host/ws/{sede_id}?token=JWT`
- Heartbeat PING/PONG
- Recepción de mensajes en tiempo real

#### Alerts Store (`alertsStore.ts`)

- Notificaciones toast (success/error/warning/info)

#### UI Store (`uiStore.ts`)

- Estado de UI: sidebar colapsado, tema, etc.

### 4.4 Tipos TypeScript

**Archivo: `frontend/src/types/index.ts`** — 647 líneas de tipos alineados con el backend:

**Envelopes de API:**

```typescript
ApiResponse<T>; // { success: true, data: T, message?: string }
ApiError; // { success: false, error: { code, message, details? } }
PaginatedResponse<T>; // { success: true, data: T[], total, page, per_page, total_pages }
```

**Auth:**

```typescript
(LoginRequest, TokenResponse, LoginResponse, RefreshRequest);
(UsuarioMe, RolResponse, RolNombre, ChangePasswordRequest);
```

**Catálogos:**

```typescript
(SedeBasica, Sede, Ubicacion, Tipologia, TipoDocumento, EPS, ARL);
```

**Personas:**

```typescript
(Persona, EmpresaBasica, Empresa, PersonaCreateRequest, PersonaUpdateRequest);
```

**Parking:**

```typescript
(ParkingSolicitud,
  ParkingVehiculo,
  ParkingCapacidad,
  PicoPlacaConfig,
  LPREvento);
```

**HSE:**

```typescript
(AutorizacionHSE, HseCertificacion, HseHistorialEstado, HseAcceso);
(ActividadHSE, AccesoScanResult);
```

**NFC:**

```typescript
(Activo, CategoriaActivo, ActivoAsignacion, NFCEvento);
```

**GH:**

```typescript
(GHCita, GHImportacion);
```

**UI/Estado:**

```typescript
(WSStatus,
  WSMessage,
  WSMessageType,
  NavItem,
  ToastOptions,
  FilterState,
  TableColumn);
```

---

## 5. Flujo de Conexión Frontend ↔ Backend

### 5.1 Inicio de sesión

```
┌──────────┐     POST /api/v1/auth/login      ┌──────────┐
│ Frontend │ ──────────────────────────────────> │ Backend  │
│          │    { email, password }             │          │
│          │ <────────────────────────────────── │          │
│          │    { success: true, data: {        │          │
│          │      tokens: { access_token,       │          │
│          │                refresh_token },    │          │
│          │      usuario: { ... }              │          │
│          │    }}                              │          │
└──────────┘                                    └──────────┘
     │
     ├── Guarda tokens en localStorage
     ├── Actualiza authStore (usuario, isAuthenticated)
     └── Conecta WebSocket: ws://host/ws/{sede_id}?token={access_token}
```

### 5.2 Request autenticado

```
┌──────────┐     GET /api/v1/hse/autorizaciones  ┌──────────┐
│ Frontend │ ────────────────────────────────────> │ Backend  │
│          │    Authorization: Bearer <token>      │          │
│          │ <──────────────────────────────────── │          │
│          │    { success: true, data: [...] }     │          │
└──────────┘                                       └──────────┘
```

### 5.3 Refresh automático de token

```
1. Request falla con 401
2. Interceptor de Axios detecta el 401
3. Si hay refresh token en localStorage:
   POST /api/v1/auth/refresh { refresh_token }
4. Backend valida, revoca token viejo, emite nuevo par
5. Interceptor guarda nuevos tokens
6. Reintenta request original con nuevo token
7. Notifica a wsStore para reconectar WebSocket
```

### 5.4 WebSocket en tiempo real

```
┌──────────┐     ws://host/ws/1?token=JWT        ┌──────────┐
│ Frontend │ <=====================================> │ Backend  │
│          │    → {"type": "PING"}                 │          │
│          │    ← {"type": "PONG"}                 │          │
│          │    ← {"type": "ACCESO_REGISTRADO",    │          │
│          │       payload: {...}}                 │          │
└──────────┘                                       └──────────┘
```

---

## 6. Diagrama de Base de Datos (Tablas y Relaciones)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MÓDULO AUTH                                │
│                                                                      │
│  cat_roles ──< usuario_roles >── usuarios ──< refresh_tokens        │
│                                      │                               │
│                                      ├── perfiles (1:1)              │
│                                      ├── usuario_permisos (1:1)      │
│                                      └── audit_log                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         MÓDULO SEDES                                 │
│                                                                      │
│  sedes ──< ubicaciones                                              │
│    │                                                                 │
│    └── usuarios.sede_asignada_id                                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       MÓDULO PERSONAS                                │
│                                                                      │
│  proveedores ──< personas                                           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         MÓDULO HSE                                   │
│                                                                      │
│  cat_eps ──< hse_seguridad_social                                   │
│  cat_arl ──< hse_seguridad_social                                   │
│  cat_afp ──< hse_seguridad_social                                   │
│  cat_normas_seguridad                                                │
│                                                                      │
│  hse_autorizaciones ──< hse_contratistas                            │
│                              │                                       │
│                              ├── hse_clasificacion_actividad (1:1)   │
│                              ├── hse_seguridad_social (1:N)          │
│                              ├── hse_certificaciones (1:1)           │
│                              ├── hse_examen_medico (1:1)             │
│                              ├── hse_contacto_emergencia (1:1)       │
│                              ├── hse_aceptacion_normas (1:1)         │
│                              ├── hse_accesos (1:N)                   │
│                              ├── hse_cumplimiento (1:N)              │
│                              │     └── hse_cumplimiento_items (1:N)  │
│                              └── hse_historial_estados (1:N)         │
│                                                                      │
│  hse_excepciones                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          MÓDULO GH                                   │
│                                                                      │
│  gh_candidatos ──< gh_citas ──< gh_portal_tokens                    │
│       │               │                                              │
│       │               └── gh_accesos_vigilancia                      │
│       │                                                              │
│       ├── gh_induccion_asistencias ──> gh_sesiones_induccion         │
│       │                                                              │
│       └── gh_dotacion_entregas ──< gh_dotacion_entregas_detalle      │
│                                                                      │
│  gh_importaciones ──< gh_importaciones_detalle                       │
│  gh_auditoria                                                        │
│  gh_maestro_dotacion                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Total de tablas: ~40 tablas**

---

## 7. Resumen para la Migración

### Lo que YA existe en Python y DEBE migrarse a Node:

| #   | Componente                                                                                 | Complejidad | Prioridad        |
| --- | ------------------------------------------------------------------------------------------ | ----------- | ---------------- |
| 1   | **BaseEntity** (TypeORM)                                                                   | Baja        | ✅ Ya existe     |
| 2   | **Auth module** (login, refresh, logout, cambiar password, me)                             | Media       | 🔄 En progreso   |
| 3   | **JWT utils** (verify, create access/refresh tokens)                                       | Media       | 🔄 Pendiente     |
| 4   | **Dependencies** (get_current_user, require_role, require_permiso)                         | Media       | 🔄 Pendiente     |
| 5   | **Entidad Usuario + Rol + UsuarioRol + RefreshToken + Perfil + UsuarioPermiso + AuditLog** | Alta        | 🔄 Pendiente     |
| 6   | **Entidad Sede + Ubicacion**                                                               | Media       | 🔄 Pendiente     |
| 7   | **Entidad Proveedor + Persona**                                                            | Media       | 🔄 Pendiente     |
| 8   | **17 entidades HSE**                                                                       | Muy Alta    | 🔄 Pendiente     |
| 9   | **12 entidades GH**                                                                        | Alta        | 🔄 Pendiente     |
| 10  | **WebSocket gateway** (NestJS)                                                             | Media       | 🔄 Pendiente     |
| 11  | **Config module**                                                                          | Baja        | 📁 Módulo creado |
| 12  | **Herramientas module**                                                                    | Media       | 📁 Módulo creado |
| 13  | **ApiResponseInterceptor**                                                                 | Baja        | ✅ Ya existe     |
| 14  | **HttpExceptionFilter**                                                                    | Baja        | ✅ Ya existe     |

### Lo que el frontend YA espera (no debe cambiar):

1. **Formato de respuesta:** `{ success: true, data: ... }` / `{ success: false, error: { code, message } }`
2. **Prefijo de API:** `/api/v1`
3. **Auth header:** `Authorization: Bearer <token>`
4. **Refresh endpoint:** `POST /api/v1/auth/refresh`
5. **WebSocket:** `ws://host/ws/{sede_id}?token=JWT`
6. **Nombres de campos:** snake_case (id, created_at, updated_at, deleted_at, nombre_completo, etc.)
7. **Enums:** mismos valores (ADMIN_GLOBAL, BORRADOR, APROBADO, etc.)

### Estrategia de migración recomendada:

1. **Fase 1:** Completar entidades TypeORM (todas las tablas)
2. **Fase 2:** Implementar Auth module completo (login, JWT, guards)
3. **Fase 3:** Migrar módulo por módulo (HSE → GH → Config → Herramientas)
4. **Fase 4:** WebSocket gateway
5. **Fase 5:** Pruebas de integración con el frontend existente
6. **Fase 6:** Cutover (apagar Python, encender Node)

---

> **Nota:** Este documento refleja el estado del código al 29 de abril de 2026.  
> El backend Python está en producción. El backend Node está en fase temprana de migración  
> con la estructura de módulos creada pero sin lógica de negocio implementada aún.
