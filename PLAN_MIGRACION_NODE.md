# Plan de Migración 100% a Node.js (NestJS)

> **KOAJ Access v2.0 — Permoda S.A.S.**  
> Fecha: 29 de abril de 2026  
> De: FastAPI + SQLAlchemy + aiomysql  
> A: NestJS + TypeORM + mysql2

---

## Índice

1. [Principios rectores](#1-principios-rectores)
2. [Inventario de lo que NO se toca](#2-inventario-de-lo-que-no-se-toca)
3. [Arquitectura destino](#3-arquitectura-destino)
4. [Fase 0 — Infraestructura y configuración](#4-fase-0--infraestructura-y-configuración)
5. [Fase 1 — Entidades TypeORM (todas las tablas)](#5-fase-1--entidades-typeorm-todas-las-tablas)
6. [Fase 2 — Módulo Auth completo](#6-fase-2--módulo-auth-completo)
7. [Fase 3 — Guards y decorators](#7-fase-3--guards-y-decorators)
8. [Fase 4 — Módulo HSE](#8-fase-4--módulo-hse)
9. [Fase 5 — Módulo Gestión Humana](#9-fase-5--módulo-gestión-humana)
10. [Fase 6 — Módulo Config y Herramientas](#10-fase-6--módulo-config-y-herramientas)
11. [Fase 7 — WebSocket Gateway](#11-fase-7--websocket-gateway)
12. [Fase 8 — Módulos Parking y NFC](#12-fase-8--módulos-parking-y-nfc)
13. [Fase 9 — Pruebas y validación](#13-fase-9--pruebas-y-validación)
14. [Fase 10 — Cutover](#14-fase-10--cutover)
15. [Cronograma estimado](#15-cronograma-estimado)
16. [Riesgos y mitigaciones](#16-riesgos-y-mitigaciones)

---

## 1. Principios rectores

| #   | Principio                          | Explicación                                                                                                           |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | **Frontend intocable**             | El frontend React NO se modifica. El backend Node debe ser un drop-in replacement.                                    |
| 2   | **Misma base de datos**            | Se usa la misma BD MySQL `koaj_access`. TypeORM lee/escribe las mismas tablas.                                        |
| 3   | **Mismo contrato API**             | Mismos endpoints, mismos status codes, mismo formato `{ success, data/error }`.                                       |
| 4   | **Misma autenticación**            | JWT con HS256, access token 30 min, refresh token 7 días, mismos claims.                                              |
| 5   | **Snake_case en respuestas**       | TypeORM usa camelCase internamente, pero las respuestas JSON deben seguir en snake_case (igual que Python).           |
| 6   | **Soft delete**                    | TypeORM tiene `@DeleteDateColumn` que es equivalente exacto al `deleted_at` de SQLAlchemy.                            |
| 7   | **Migración incremental**          | Fase por fase. Cada fase es testeable independientemente.                                                             |
| 8   | **Misma nomenclatura de archivos** | Seguir el estándar NestJS: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `*.dto.ts`, `*.guard.ts`. |

---

## 2. Inventario de lo que NO se toca

| Componente                        | Ubicación                 | Razón                                                     |
| --------------------------------- | ------------------------- | --------------------------------------------------------- |
| Frontend React                    | `frontend/`               | Drop-in replacement                                       |
| Base de datos MySQL               | `koaj_access`             | Misma BD, mismas tablas                                   |
| Archivos subidos                  | `backend-python/uploads/` | Se mantiene ruta, puede moverse a `backend-node/uploads/` |
| Variables de entorno del frontend | `frontend/.env`           | VITE_API_URL apunta al mismo puerto                       |
| `.gitignore` raíz                 | Raíz                      | Se actualiza para ignorar `backend-node/node_modules`     |

---

## 3. Arquitectura destino

```
backend-node/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env                        # Mismas variables que backend-python/.env
├── .env.example
│
└── src/
    ├── main.ts                  # Bootstrap (YA EXISTE)
    ├── app.module.ts            # Módulo raíz (YA EXISTE)
    ├── app.controller.ts        # Health check (YA EXISTE)
    ├── app.service.ts           # (YA EXISTE)
    │
    ├── config/                  # Configuración tipada
    │   ├── config.module.ts
    │   ├── config.service.ts    # Equivalente a Settings de Pydantic
    │   └── database.config.ts   # TypeORM DataSource config
    │
    ├── common/                  # Código compartido
    │   ├── entities/
    │   │   └── base.entity.ts   # (YA EXISTE)
    │   ├── filters/
    │   │   └── http-exception.filter.ts  # (YA EXISTE)
    │   ├── interceptors/
    │   │   ├── api-response.interceptor.ts  # (YA EXISTE)
    │   │   └── snake-case.interceptor.ts    # NUEVO: transforma camelCase → snake_case en respuestas
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts       # NUEVO: equivalente a get_current_user
    │   │   ├── roles.guard.ts          # NUEVO: equivalente a require_role
    │   │   └── permissions.guard.ts    # NUEVO: equivalente a require_permiso
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts   # NUEVO: @CurrentUser() extrae usuario del request
    │   │   ├── roles.decorator.ts          # NUEVO: @Roles('ADMIN_HSE')
    │   │   └── permissions.decorator.ts    # NUEVO: @Permissions('crear')
    │   └── utils/
    │       ├── jwt.util.ts           # NUEVO: createAccessToken, createRefreshToken, verifyToken
    │       ├── password.util.ts      # NUEVO: hashPassword, verifyPassword (bcrypt)
    │       └── api-response.util.ts  # NUEVO: ok(), err() helpers
    │
    ├── auth/                    # Módulo de autenticación
    │   ├── auth.module.ts       # (YA EXISTE - requiere TypeOrmModule.forFeature)
    │   ├── auth.controller.ts   # (YA EXISTE - completar endpoints)
    │   ├── auth.service.ts      # (YA EXISTE - implementar lógica)
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   ├── refresh.dto.ts
    │   │   ├── cambiar-password.dto.ts
    │   │   └── usuario-me-response.dto.ts
    │   └── entities/
    │       ├── rol.entity.ts
    │       ├── usuario.entity.ts
    │       ├── usuario-rol.entity.ts
    │       ├── refresh-token.entity.ts
    │       ├── perfil.entity.ts
    │       ├── usuario-permiso.entity.ts
    │       └── audit-log.entity.ts
    │
    ├── sede/                    # Módulo de sedes (nuevo)
    │   ├── sede.module.ts
    │   ├── sede.controller.ts
    │   ├── sede.service.ts
    │   ├── dto/
    │   │   └── sede.dto.ts
    │   └── entities/
    │       ├── sede.entity.ts
    │       └── ubicacion.entity.ts
    │
    ├── persona/                 # Módulo de personas (nuevo)
    │   ├── persona.module.ts
    │   ├── persona.controller.ts
    │   ├── persona.service.ts
    │   ├── dto/
    │   │   └── persona.dto.ts
    │   └── entities/
    │       ├── proveedor.entity.ts
    │       └── persona.entity.ts
    │
    ├── hse/                     # Módulo HSE
    │   ├── hse.module.ts        # (YA EXISTE - vacío)
    │   ├── hse.controller.ts    # NUEVO
    │   ├── hse.service.ts       # NUEVO
    │   ├── dto/
    │   │   ├── autorizacion.dto.ts
    │   │   ├── contratista.dto.ts
    │   │   ├── clasificacion.dto.ts
    │   │   ├── seguridad-social.dto.ts
    │   │   ├── certificaciones.dto.ts
    │   │   ├── examen-medico.dto.ts
    │   │   ├── contacto-emergencia.dto.ts
    │   │   ├── aceptacion-normas.dto.ts
    │   │   ├── acceso.dto.ts
    │   │   ├── cumplimiento.dto.ts
    │   │   ├── excepcion.dto.ts
    │   │   └── historial.dto.ts
    │   └── entities/
    │       ├── cat-eps.entity.ts
    │       ├── cat-arl.entity.ts
    │       ├── cat-afp.entity.ts
    │       ├── cat-norma-seguridad.entity.ts
    │       ├── hse-autorizacion.entity.ts
    │       ├── hse-contratista.entity.ts
    │       ├── hse-clasificacion.entity.ts
    │       ├── hse-seg-social.entity.ts
    │       ├── hse-certificaciones.entity.ts
    │       ├── hse-examen-medico.entity.ts
    │       ├── hse-contacto-emergencia.entity.ts
    │       ├── hse-aceptacion-normas.entity.ts
    │       ├── hse-acceso.entity.ts
    │       ├── hse-cumplimiento.entity.ts
    │       ├── hse-cumplimiento-item.entity.ts
    │       ├── hse-excepcion.entity.ts
    │       └── hse-historial.entity.ts
    │
    ├── gh/                      # Módulo Gestión Humana
    │   ├── gh.module.ts         # (YA EXISTE - vacío)
    │   ├── gh.controller.ts     # NUEVO
    │   ├── gh.service.ts        # NUEVO
    │   ├── dto/
    │   │   └── ...
    │   └── entities/
    │       ├── gh-candidato.entity.ts
    │       ├── gh-cita.entity.ts
    │       ├── gh-portal-token.entity.ts
    │       ├── gh-acceso-vigilancia.entity.ts
    │       ├── gh-importacion.entity.ts
    │       ├── gh-importacion-detalle.entity.ts
    │       ├── gh-auditoria.entity.ts
    │       ├── gh-sesion-induccion.entity.ts
    │       ├── gh-induccion-asistencia.entity.ts
    │       ├── gh-maestro-dotacion.entity.ts
    │       ├── gh-dotacion-entrega.entity.ts
    │       └── gh-dotacion-entrega-detalle.entity.ts
    │
    ├── config-koaj/             # Módulo de configuración del sistema
    │   ├── config-koaj.module.ts  # (YA EXISTE - vacío)
    │   ├── config-koaj.controller.ts
    │   └── config-koaj.service.ts
    │
    ├── herramientas/            # Módulo de herramientas admin
    │   ├── herramientas.module.ts  # (YA EXISTE - vacío)
    │   ├── herramientas.controller.ts
    │   ├── herramientas.service.ts
    │   └── dto/
    │
    ├── parking/                 # Módulo Parking
    │   ├── parking.module.ts    # (YA EXISTE - vacío)
    │   ├── parking.controller.ts
    │   ├── parking.service.ts
    │   ├── dto/
    │   └── entities/
    │
    ├── nfc/                     # Módulo NFC
    │   ├── nfc.module.ts        # (YA EXISTE - vacío)
    │   ├── nfc.controller.ts
    │   ├── nfc.service.ts
    │   ├── dto/
    │   └── entities/
    │
    ├── websockets/              # WebSocket Gateway
    │   ├── websockets.module.ts  # (YA EXISTE - vacío)
    │   └── websockets.gateway.ts  # NUEVO: equivalente a ws.py
    │
    └── seeders/                 # Seeders de datos iniciales
        ├── seed-roles.ts        # Equivalente a seed_roles.py
        └── seed-data.ts         # Datos iniciales (sedes, catálogos)
```

---

## 4. Fase 0 — Infraestructura y configuración

**Objetivo:** Dejar el proyecto listo para desarrollar. Todo lo que no es lógica de negocio.

### 4.1 Dependencias npm a instalar

```bash
cd backend-node

# TypeORM + MySQL
npm install @nestjs/typeorm typeorm mysql2

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Validación (class-validator + class-transformer YA están en NestJS base)

# UUID para JTI de refresh tokens
npm install uuid
npm install -D @types/uuid

# Variables de entorno (ConfigModule YA viene con NestJS)
npm install @nestjs/config

# WebSockets (YA viene con NestJS - @nestjs/platform-ws o @nestjs/websockets)

# Utilidades
npm install date-fns   # Manejo de fechas (equivalente a datetime de Python)
```

### 4.2 Archivo `.env`

Crear `backend-node/.env` con las mismas variables que `backend-python/.env`:

```env
# Aplicación
NODE_ENV=development
PORT=8000
APP_NAME=KOAJ Access API
APP_VERSION=2.0.0

# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=koaj_access

# JWT
JWT_SECRET=dev-secret-key-NO-usar-en-produccion-32chars!!
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:5173

# Archivos
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=5

# API Keys hardware
LPR_API_KEY=
NFC_READER_API_KEY=
```

### 4.3 ConfigService

Crear `src/config/config.service.ts` (equivalente a `app/config.py`):

```typescript
// Valida y tipa TODAS las variables de entorno
// Igual que pydantic-settings
```

### 4.4 Database Config

Crear `src/config/database.config.ts` — TypeORM DataSource:

```typescript
// Configuración de TypeORM con mysql2
// Pool: 10 conexiones base + 20 overflow
// charset: utf8mb4 (igual que Python)
// timezone: Z (UTC)
```

### 4.5 Actualizar app.module.ts

```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync({
    /* config de BD */
  }),
  AuthModule,
  SedeModule, // NUEVO
  PersonaModule, // NUEVO
  HseModule,
  GhModule,
  ConfigKoajModule,
  HerramientasModule,
  ParkingModule,
  NfcModule,
  WebsocketsModule,
];
```

### 4.6 SnakeCaseInterceptor

Crear `src/common/interceptors/snake-case.interceptor.ts`:

```
Propósito: TypeORM retorna camelCase (nombreCompleto).
El frontend espera snake_case (nombre_completo).
Este interceptor transforma automáticamente las respuestas.
```

### 4.7 ApiResponse helpers

Crear `src/common/utils/api-response.util.ts`:

```typescript
export function ok<T>(data: T, message?: string): ApiResponse<T> { ... }
export function err(code: string, message: string, status: number): never { ... }
```

---

## 5. Fase 1 — Entidades TypeORM (todas las tablas)

**Objetivo:** Tener el 100% de las tablas mapeadas como entidades TypeORM.  
**Estrategia:** Crear TODAS las entidades primero, sin lógica de negocio.  
**Validación:** `synchronize: false` (nunca sincronizar automático en producción). Verificar que TypeORM lee las tablas existentes correctamente.

### 5.1 Entidades Auth (7 archivos)

#### `rol.entity.ts`

```typescript
@Entity("cat_roles")
export class Rol extends BaseEntity {
  @Column({ type: "enum", enum: RolNombre, unique: true })
  nombre: RolNombre;

  @Column({ type: "varchar", length: 255, nullable: true })
  descripcion: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @OneToMany(() => UsuarioRol, (ur) => ur.rol)
  usuarioRoles: UsuarioRol[];
}
```

#### `usuario.entity.ts`

```typescript
@Entity("usuarios")
export class Usuario extends BaseEntity {
  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ name: "nombre_completo", length: 150 })
  nombre_completo: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: "debe_cambiar_password", default: true })
  debe_cambiar_password: boolean;

  @Column({ name: "ultimo_login", nullable: true })
  ultimo_login: Date;

  @Column({ name: "intentos_fallidos", default: 0 })
  intentos_fallidos: number;

  @Column({ name: "bloqueado_hasta", nullable: true })
  bloqueado_hasta: Date;

  // FK a sede
  @Column({ name: "sede_asignada_id", nullable: true })
  sede_asignada_id: number;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: "sede_asignada_id" })
  sede_asignada: Sede;

  // Relaciones
  @OneToMany(() => UsuarioRol, (ur) => ur.usuario)
  roles: UsuarioRol[];

  @OneToMany(() => RefreshToken, (rt) => rt.usuario)
  refreshTokens: RefreshToken[];

  @OneToOne(() => Perfil, (p) => p.usuario)
  perfil: Perfil;

  @OneToOne(() => UsuarioPermiso, (up) => up.usuario)
  permisos: UsuarioPermiso;
}
```

#### `usuario-rol.entity.ts`

```typescript
@Entity("usuario_roles")
@Unique(["usuario_id", "rol_id"])
export class UsuarioRol extends BaseEntity {
  @Column({ name: "usuario_id" })
  usuario_id: number;

  @Column({ name: "rol_id" })
  rol_id: number;

  @Column({ name: "asignado_por", nullable: true })
  asignado_por: number;

  @ManyToOne(() => Usuario, (u) => u.roles)
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;

  @ManyToOne(() => Rol, (r) => r.usuarioRoles)
  @JoinColumn({ name: "rol_id" })
  rol: Rol;
}
```

#### `refresh-token.entity.ts`

```typescript
@Entity("refresh_tokens")
export class RefreshToken extends BaseEntity {
  @Column({ name: "usuario_id" })
  usuario_id: number;

  @Column({ length: 36, unique: true })
  jti: string; // UUID v4

  @Column({ default: false })
  revocado: boolean;

  @Column({ name: "expira_en" })
  expira_en: Date;

  @Column({ name: "user_agent", type: "text", nullable: true })
  user_agent: string;

  @Column({ name: "ip_address", length: 45, nullable: true })
  ip_address: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;
}
```

#### `perfil.entity.ts`

```typescript
@Entity("perfiles")
export class Perfil extends BaseEntity {
  @Column({ name: "usuario_id", unique: true })
  usuario_id: number;

  @Column({ name: "foto_perfil", length: 500, nullable: true })
  foto_perfil: string;

  @Column({ type: "text", nullable: true })
  biografia: string;

  @Column({ length: 150, nullable: true })
  ubicacion: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ name: "sede_default_id", nullable: true })
  sede_default_id: number;

  @Column({ length: 20, default: "dark" })
  tema: string;

  @Column({ name: "notificaciones_email", default: true })
  notificaciones_email: boolean;

  @OneToOne(() => Usuario, (u) => u.perfil)
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;
}
```

#### `usuario-permiso.entity.ts`

```typescript
@Entity("usuario_permisos")
@Unique(["usuario_id"])
export class UsuarioPermiso extends BaseEntity {
  @Column({ name: "usuario_id", unique: true })
  usuario_id: number;

  @Column({ name: "puede_ver", default: true })
  puede_ver: boolean;

  @Column({ name: "puede_crear", default: false })
  puede_crear: boolean;

  @Column({ name: "puede_editar", default: false })
  puede_editar: boolean;

  @Column({ name: "puede_eliminar", default: false })
  puede_eliminar: boolean;

  @Column({ name: "asignado_por", nullable: true })
  asignado_por: number;

  @OneToOne(() => Usuario, (u) => u.permisos)
  @JoinColumn({ name: "usuario_id" })
  usuario: Usuario;
}
```

#### `audit-log.entity.ts`

```typescript
@Entity("audit_log")
export class AuditLog extends BaseEntity {
  @Column({ name: "actor_id", nullable: true })
  actor_id: number;

  @Column({ name: "actor_nombre", length: 150 })
  actor_nombre: string;

  @Column({ length: 50 })
  accion: string;

  @Column({ length: 50 })
  entidad: string;

  @Column({ name: "entidad_id", nullable: true })
  entidad_id: number;

  @Column({ type: "text", nullable: true })
  descripcion: string;
}
```

### 5.2 Entidades Sede (2 archivos)

- `sede.entity.ts` → tabla `sedes`
- `ubicacion.entity.ts` → tabla `ubicaciones`

### 5.3 Entidades Persona (2 archivos)

- `proveedor.entity.ts` → tabla `proveedores`
- `persona.entity.ts` → tabla `personas`

### 5.4 Entidades HSE (17 archivos)

**Catálogos:** `cat-eps.entity.ts`, `cat-arl.entity.ts`, `cat-afp.entity.ts`, `cat-norma-seguridad.entity.ts`

**Núcleo:** `hse-autorizacion.entity.ts`, `hse-contratista.entity.ts`

**Autogestión:** `hse-clasificacion.entity.ts`, `hse-seg-social.entity.ts`, `hse-certificaciones.entity.ts`, `hse-examen-medico.entity.ts`, `hse-contacto-emergencia.entity.ts`, `hse-aceptacion-normas.entity.ts`

**Operación:** `hse-acceso.entity.ts`, `hse-cumplimiento.entity.ts`, `hse-cumplimiento-item.entity.ts`

**Control:** `hse-excepcion.entity.ts`, `hse-historial.entity.ts`

### 5.5 Entidades GH (12 archivos)

- `gh-candidato.entity.ts`
- `gh-cita.entity.ts`
- `gh-portal-token.entity.ts`
- `gh-acceso-vigilancia.entity.ts`
- `gh-importacion.entity.ts`
- `gh-importacion-detalle.entity.ts`
- `gh-auditoria.entity.ts`
- `gh-sesion-induccion.entity.ts`
- `gh-induccion-asistencia.entity.ts`
- `gh-maestro-dotacion.entity.ts`
- `gh-dotacion-entrega.entity.ts`
- `gh-dotacion-entrega-detalle.entity.ts`

**Total: ~40 entidades**

### 5.6 Puntos importantes para las entidades

1. **Todas extienden `BaseEntity`** (soft delete automático)
2. **Nombres de columna en snake_case** con `@Column({ name: '...' })`
3. **Enums de MySQL** se mapean con `type: 'enum'` y el enum de TypeScript
4. **Relaciones** con `@ManyToOne`, `@OneToMany`, `@OneToOne`, `@JoinColumn`
5. **Campos DateTime** con `type: 'datetime'` (igual que Python)
6. **Nullable** donde corresponda
7. **Defaults** idénticos a SQLAlchemy

---

## 6. Fase 2 — Módulo Auth completo

**Objetivo:** Login, refresh, logout, cambiar password y perfil funcionando 100%.

### 6.1 JWT Util

`src/common/utils/jwt.util.ts` — Equivalente exacto de `app/utils/jwt.py`:

```typescript
// createAccessToken(usuarioId, email, roles, debeCambiarPassword): string
//   claims: { sub, email, roles, dcp, type: 'access', iat, exp }
//   expira: ACCESS_TOKEN_EXPIRE_MINUTES (30 min)

// createRefreshToken(usuarioId, jti): string
//   claims: { sub, jti, type: 'refresh', iat, exp }
//   expira: REFRESH_TOKEN_EXPIRE_DAYS (7 días)

// verifyAccessToken(token): payload | null
// verifyRefreshToken(token): payload | null
```

### 6.2 Password Util

`src/common/utils/password.util.ts`:

```typescript
// hashPassword(plainText): Promise<string>    → bcrypt.hash(12 rounds)
// verifyPassword(plainText, hash): Promise<boolean> → bcrypt.compare
```

### 6.3 AuthService

Implementar en `src/auth/auth.service.ts`:

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(UsuarioRol)
    private usuarioRolRepo: Repository<UsuarioRol>,
  ) {}

  // login(email, password, userAgent, ipAddress)
  //   1. Buscar usuario por email (con deleted_at IS NULL)
  //   2. Verificar no esté bloqueado
  //   3. Verificar password
  //   4. Resetear intentos_fallidos
  //   5. Actualizar ultimo_login
  //   6. Generar access_token + refresh_token (con JTI UUID v4)
  //   7. Persistir RefreshToken en BD
  //   8. Retornar tokens + usuario

  // refresh(refreshTokenStr, userAgent, ipAddress)
  //   1. Decodificar refresh token
  //   2. Buscar en BD por JTI no revocado no expirado
  //   3. Marcar token viejo como revocado
  //   4. Generar nuevo access_token + refresh_token
  //   5. Retornar tokens

  // logout(usuarioId)
  //   1. Marcar TODOS los refresh tokens del usuario como revocados

  // cambiarPassword(usuarioId, passwordActual, passwordNueva)
  //   1. Verificar password actual
  //   2. Validar fortaleza (mín 8 chars, mayúscula, minúscula, número)
  //   3. Hashear nueva password
  //   4. Actualizar debe_cambiar_password = false
  //   5. Revocar todos los refresh tokens

  // getMe(usuarioId)
  //   1. Retornar usuario con roles (join)
}
```

### 6.4 AuthController

Completar `src/auth/auth.controller.ts`:

| Método | Ruta                     | DTO                  | Respuesta                                                                                |
| ------ | ------------------------ | -------------------- | ---------------------------------------------------------------------------------------- |
| POST   | `/auth/login`            | LoginDto             | `{ tokens: { access_token, refresh_token, debe_cambiar_password }, usuario: UsuarioMe }` |
| POST   | `/auth/refresh`          | RefreshDto           | `{ access_token, refresh_token, debe_cambiar_password: false }`                          |
| POST   | `/auth/logout`           | — (usa @CurrentUser) | `{ message: "Sesión cerrada" }`                                                          |
| POST   | `/auth/cambiar-password` | CambiarPasswordDto   | `{ message: "Contraseña actualizada" }`                                                  |
| GET    | `/auth/me`               | — (usa @CurrentUser) | `UsuarioMe`                                                                              |

### 6.5 DTOs

Crear `src/auth/dto/`:

```typescript
// login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

// refresh.dto.ts
export class RefreshDto {
  @IsString()
  refresh_token: string;
}

// cambiar-password.dto.ts
export class CambiarPasswordDto {
  @IsString()
  password_actual: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "La contraseña debe contener mayúscula, minúscula y número",
  })
  password_nueva: string;
}
```

### 6.6 Actualizar AuthModule

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Rol,
      UsuarioRol,
      RefreshToken,
      Perfil,
      UsuarioPermiso,
      AuditLog,
    ]),
    JwtModule.register({
      /* opcional, si usamos @nestjs/jwt */
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 7. Fase 3 — Guards y decorators

**Objetivo:** Sistema de autorización equivalente a `app/dependencies.py`.

### 7.1 JwtAuthGuard

`src/common/guards/jwt-auth.guard.ts` — Equivalente a `get_current_user`:

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  // 1. Extrae Bearer token del header Authorization
  // 2. Verifica con verifyAccessToken()
  // 3. Busca usuario en BD (con roles eager-loaded)
  // 4. Verifica usuario activo, no eliminado
  // 5. Adjunta usuario al request: request.user = usuario
  // 6. Retorna true/throw 401/403
}
```

### 7.2 RolesGuard

`src/common/guards/roles.guard.ts` — Equivalente a `require_role`:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  // 1. Obtiene roles requeridos del decorator @Roles()
  // 2. Si no hay roles requeridos, permite acceso
  // 3. Si el usuario es ADMIN_GLOBAL, permite acceso
  // 4. Verifica que el usuario tenga al menos uno de los roles requeridos
  // 5. Retorna true/throw 403
}
```

### 7.3 PermissionsGuard

`src/common/guards/permissions.guard.ts` — Equivalente a `require_permiso`:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  // 1. Obtiene operación requerida del decorator @Permissions()
  // 2. Si no hay permiso requerido, permite acceso
  // 3. Si el usuario es ADMIN_GLOBAL, permite acceso
  // 4. Busca UsuarioPermiso en BD
  // 5. Verifica el campo puede_ver/crear/editar/eliminar
  // 6. Retorna true/throw 403
}
```

### 7.4 Decorators

```typescript
// @CurrentUser() → extrae request.user
// @Roles('ADMIN_HSE', 'ADMIN_GLOBAL') → define roles requeridos
// @Permissions('crear') → define permiso requerido
```

### 7.5 Uso en controladores

```typescript
@Controller('hse/autorizaciones')
export class HseController {

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE')
  async listar(@CurrentUser() user: Usuario) { ... }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('ADMIN_HSE', 'GESTION_HSE')
  @Permissions('crear')
  async crear(@CurrentUser() user: Usuario, @Body() dto: CreateAutorizacionDto) { ... }
}
```

---

## 8. Fase 4 — Módulo HSE

**Objetivo:** CRUD completo de autorizaciones, contratistas, autogestión, accesos, cumplimiento, excepciones, historial.

### 8.1 Endpoints a implementar

#### Catálogos (públicos para autogestión)

| Método | Ruta                             | Auth         |
| ------ | -------------------------------- | ------------ |
| GET    | `/hse/catalogos/eps`             | No (público) |
| GET    | `/hse/catalogos/arl`             | No           |
| GET    | `/hse/catalogos/afp`             | No           |
| GET    | `/hse/catalogos/normas/:sede_id` | No           |

#### Autorizaciones (CRUD admin)

| Método | Ruta                             | Auth | Permiso  |
| ------ | -------------------------------- | ---- | -------- |
| GET    | `/hse/autorizaciones`            | Sí   | ver      |
| GET    | `/hse/autorizaciones/:id`        | Sí   | ver      |
| POST   | `/hse/autorizaciones`            | Sí   | crear    |
| PUT    | `/hse/autorizaciones/:id`        | Sí   | editar   |
| DELETE | `/hse/autorizaciones/:id`        | Sí   | eliminar |
| PATCH  | `/hse/autorizaciones/:id/estado` | Sí   | editar   |

#### Contratistas

| Método | Ruta                                   | Auth |
| ------ | -------------------------------------- | ---- |
| GET    | `/hse/autorizaciones/:id/contratistas` | Sí   |
| POST   | `/hse/autorizaciones/:id/contratistas` | Sí   |
| POST   | `/hse/contratistas/:id/generar-token`  | Sí   |

#### Autogestión (pública, con token)

| Método | Ruta                                          | Auth          |
| ------ | --------------------------------------------- | ------------- |
| GET    | `/hse/autogestion/:token`                     | Token público |
| POST   | `/hse/autogestion/:token/clasificacion`       | Token público |
| POST   | `/hse/autogestion/:token/seguridad-social`    | Token público |
| POST   | `/hse/autogestion/:token/certificaciones`     | Token público |
| POST   | `/hse/autogestion/:token/examen-medico`       | Token público |
| POST   | `/hse/autogestion/:token/contacto-emergencia` | Token público |
| POST   | `/hse/autogestion/:token/aceptacion`          | Token público |
| POST   | `/hse/autogestion/:token/finalizar`           | Token público |

#### Accesos (portería)

| Método | Ruta                         | Auth | Roles                    |
| ------ | ---------------------------- | ---- | ------------------------ |
| POST   | `/hse/accesos/entrada`       | Sí   | VIGILANTE_HSE, ADMIN_HSE |
| POST   | `/hse/accesos/salida`        | Sí   | VIGILANTE_HSE, ADMIN_HSE |
| GET    | `/hse/accesos/sede/:sede_id` | Sí   | ver                      |

#### Cumplimiento

| Método | Ruta                                  | Auth |
| ------ | ------------------------------------- | ---- |
| GET    | `/hse/cumplimiento/:contratista_id`   | Sí   |
| POST   | `/hse/cumplimiento`                   | Sí   |
| PUT    | `/hse/cumplimiento/:id`               | Sí   |
| PUT    | `/hse/cumplimiento/:id/items/:itemId` | Sí   |

#### Excepciones

| Método | Ruta                   | Auth |
| ------ | ---------------------- | ---- |
| GET    | `/hse/excepciones`     | Sí   |
| POST   | `/hse/excepciones`     | Sí   |
| DELETE | `/hse/excepciones/:id` | Sí   |

### 8.2 HseService

Lógica de negocio principal:

- `crearAutorizacion()` — genera código HSE-2026-XXXX, crea contratistas, envía emails
- `cambiarEstado()` — con validaciones de transición de estados
- `generarTokenAutogestion()` — UUID, expiración configurable (24/48/72h)
- `registrarAcceso()` — valida autorización vigente, ubicación, tipo
- `verificarCumplimiento()` — checklist de items

---

## 9. Fase 5 — Módulo Gestión Humana

**Objetivo:** CRUD de citas, importación Midassoft, portal público, inducciones, dotación.

### 9.1 Endpoints

| Método | Ruta                            | Auth          |
| ------ | ------------------------------- | ------------- |
| GET    | `/gh/citas`                     | Sí            |
| POST   | `/gh/citas`                     | Sí            |
| GET    | `/gh/citas/:id`                 | Sí            |
| PUT    | `/gh/citas/:id`                 | Sí            |
| GET    | `/gh/portal/:token`             | Token público |
| POST   | `/gh/importaciones`             | Sí            |
| GET    | `/gh/importaciones/:id`         | Sí            |
| GET    | `/gh/sesiones-induccion`        | Sí            |
| POST   | `/gh/sesiones-induccion`        | Sí            |
| POST   | `/gh/induccion/:token/checkin`  | Token público |
| POST   | `/gh/induccion/:token/checkout` | Token público |
| GET    | `/gh/maestro-dotacion`          | Sí            |
| POST   | `/gh/dotacion-entregas`         | Sí            |

---

## 10. Fase 6 — Módulo Config y Herramientas

### 10.1 ConfigKoaj

| Método | Ruta                           | Descripción          |
| ------ | ------------------------------ | -------------------- |
| GET    | `/config/sedes`                | Listar sedes         |
| POST   | `/config/sedes`                | Crear sede           |
| PUT    | `/config/sedes/:id`            | Editar sede          |
| GET    | `/config/ubicaciones/:sede_id` | Ubicaciones por sede |
| GET    | `/config/catalogos`            | Todos los catálogos  |

### 10.2 Herramientas

| Método | Ruta                                      | Descripción                    |
| ------ | ----------------------------------------- | ------------------------------ |
| GET    | `/herramientas/usuarios`                  | Listar usuarios (ADMIN_GLOBAL) |
| POST   | `/herramientas/usuarios`                  | Crear usuario                  |
| PUT    | `/herramientas/usuarios/:id`              | Editar usuario                 |
| POST   | `/herramientas/usuarios/:id/roles`        | Asignar rol                    |
| DELETE | `/herramientas/usuarios/:id/roles/:rolId` | Quitar rol                     |
| PUT    | `/herramientas/usuarios/:id/permisos`     | Configurar permisos            |
| GET    | `/herramientas/auditoria`                 | Ver auditoría                  |

---

## 11. Fase 7 — WebSocket Gateway

**Objetivo:** Reemplazar `app/routers/ws.py` con un NestJS WebSocket Gateway.

### 11.1 WebsocketsGateway

`src/websockets/websockets.gateway.ts`:

```typescript
@WebSocketGateway({
  path: "/ws/:sedeId", // NestJS maneja esto diferente — verificar
  // En NestJS WS, el path se configura en main.ts o con @WebSocketGateway({ path: '/ws' })
})
export class WebsocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  // handleConnection(client, ...args)
  //   1. Extraer token de query params
  //   2. Verificar token
  //   3. Extraer sede_id
  //   4. Validar permisos por sede (igual que Python)
  //   5. Registrar cliente en mapa: Map<sede_id, Set<client>>
  // handleDisconnect(client)
  //   1. Remover cliente del mapa
  // @SubscribeMessage('PING')
  // handlePing(client)
  //   1. Enviar PONG
  // Método para broadcast:
  // sendToSede(sedeId, message)
  //   Envía mensaje a todos los clientes conectados a esa sede
}
```

### 11.2 Nota importante sobre NestJS WebSockets

NestJS usa Socket.IO por defecto, pero el frontend usa WebSocket nativo (`ws://`).

**Opción A:** Usar `@nestjs/platform-ws` (ws nativo) — compatible con el frontend
**Opción B:** Cambiar el frontend para usar Socket.IO — requiere modificar frontend ❌

**Recomendación: Opción A** — `@nestjs/platform-ws` para mantener compatibilidad.

```bash
npm install @nestjs/platform-ws
```

Configurar en `main.ts`:

```typescript
import { WsAdapter } from "@nestjs/platform-ws";
app.useWebSocketAdapter(new WsAdapter(app));
```

---

## 12. Fase 8 — Módulos Parking y NFC

**Nota:** Estos módulos están planificados en Python pero no implementados completamente. Se implementan directamente en Node.

### 12.1 Parking

Entidades nuevas:

- `parking_solicitudes`
- `parking_vehiculos`
- `parking_capacidad`
- `pico_placa_config`

Endpoints: CRUD de solicitudes, registro de entradas/salidas, verificación pico y placa, LPR.

### 12.2 NFC

Entidades nuevas:

- `activos`
- `categorias_activo`
- `activo_asignaciones`
- `nfc_eventos`

Endpoints: CRUD de activos, asignación, lectura NFC, inventario.

---

## 13. Fase 9 — Pruebas y validación

### 13.1 Pruebas unitarias

- Servicios con repositorios mockeados
- Guards con contexto mockeado
- JWT utils

### 13.2 Pruebas de integración

- Levantar backend Node en puerto 8001
- Apuntar frontend a `http://localhost:8001`
- Probar flujo completo:
  1. Login → obtener tokens
  2. GET /auth/me → verificar perfil
  3. CRUD sedes → verificar
  4. CRUD autorizaciones HSE → verificar
  5. WebSocket → verificar heartbeat y mensajes
  6. Refresh token → verificar rotación

### 13.3 Comparación de respuestas

Herramienta para comparar respuestas de Python (puerto 8000) vs Node (puerto 8001):

```bash
# Script que envía la misma request a ambos backends y compara las respuestas
diff <(curl -s http://localhost:8000/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq -S) \
     <(curl -s http://localhost:8001/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq -S)
```

---

## 14. Fase 10 — Cutover

### 14.1 Preparación

1. Backup de base de datos
2. Rollback plan documentado (cómo volver a Python si algo falla)
3. DNS/Proxy configurado para switch rápido

### 14.2 Ejecución

1. Detener backend Python (pm2 stop o docker stop)
2. Iniciar backend Node en puerto 8000
3. Verificar health: `GET /health`
4. Verificar login
5. Verificar funcionalidades críticas
6. Monitorear logs por 1 hora

### 14.3 Rollback

Si algo falla:

1. Detener Node
2. Iniciar Python
3. El frontend no nota el cambio (mismo puerto, misma API)

---

## 15. Cronograma estimado

| Fase      | Descripción                     | Duración estimada                | Dependencia |
| --------- | ------------------------------- | -------------------------------- | ----------- |
| 0         | Infraestructura y configuración | 2 días                           | —           |
| 1         | Entidades TypeORM (40 tablas)   | 3 días                           | Fase 0      |
| 2         | Módulo Auth completo            | 3 días                           | Fase 1      |
| 3         | Guards y decorators             | 1 día                            | Fase 2      |
| 4         | Módulo HSE                      | 4 días                           | Fase 3      |
| 5         | Módulo GH                       | 3 días                           | Fase 3      |
| 6         | Config y Herramientas           | 2 días                           | Fase 3      |
| 7         | WebSocket Gateway               | 2 días                           | Fase 3      |
| 8         | Parking y NFC                   | 4 días                           | Fase 3      |
| 9         | Pruebas y validación            | 3 días                           | Fases 4-8   |
| 10        | Cutover                         | 1 día                            | Fase 9      |
| **TOTAL** |                                 | **28 días hábiles (~6 semanas)** |             |

---

## 16. Riesgos y mitigaciones

| Riesgo                                         | Probabilidad | Impacto | Mitigación                                                                                                        |
| ---------------------------------------------- | ------------ | ------- | ----------------------------------------------------------------------------------------------------------------- |
| TypeORM genera SQL diferente a SQLAlchemy      | Media        | Alto    | `synchronize: false`, logging SQL en desarrollo, pruebas comparativas                                             |
| Diferencias en serialización de fechas         | Media        | Medio   | Mismo formato ISO 8601, timezone UTC                                                                              |
| WebSocket nativo vs Socket.IO                  | Alta         | Alto    | Usar `@nestjs/platform-ws` (ws nativo), no Socket.IO                                                              |
| Olvidar snake_case en alguna respuesta         | Alta         | Bajo    | SnakeCaseInterceptor global + pruebas automáticas                                                                 |
| Migraciones Alembic vacías (no hay histórico)  | Baja         | Bajo    | TypeORM `synchronize: false`. En producción se seguirá usando Alembic hasta que se migren las migraciones también |
| Lógica de negocio compleja en servicios Python | Media        | Alto    | Leer código Python como referencia exacta. No "reinterpretar", traducir.                                          |

---

> **Conclusión:** El plan contempla 10 fases, ~40 entidades TypeORM, ~6 semanas de trabajo.  
> El frontend permanece intacto. La base de datos es la misma.  
> Cada fase es independiente y testeable.  
> El cutover es instantáneo (mismo puerto, misma API).
