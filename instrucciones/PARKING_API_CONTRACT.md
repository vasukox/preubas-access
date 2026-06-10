# PARKING — API CONTRACT

> Contrato completo: Backend (NestJS) ↔ Frontend (React) ↔ Base de Datos (MySQL/TypeORM)  
> Toda respuesta del backend está envuelta en `{ success: boolean, data: T, message: string }`

---

## CONVENCIONES GLOBALES

### Autenticación
```
Header: Authorization: Bearer <jwt_token>
Rutas públicas: @Public() — no requieren token
Rutas de autogestión: ParkingTokenGuard — validan token en URL
```

### Respuesta estándar
```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

### Respuesta de error
```json
{
  "success": false,
  "message": "Placa ya tiene autorización activa en esta sede",
  "statusCode": 400
}
```

### Paginación (request)
```
?page=1&per_page=20
```

### Paginación (response)
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

### Campos de fecha
- Formato: ISO 8601 → `"2026-06-15T14:30:00.000Z"`
- Solo fecha: `"2026-06-15"`
- Solo hora: `"07:00"`

---

## BASE DE DATOS — ENTIDADES TYPEORM

### Enums (`common/enums/parking.enum.ts`)

```typescript
export enum EstadoSolicitudParking {
  BORRADOR                 = 'BORRADOR',
  PENDIENTE_AUTOGESTION    = 'PENDIENTE_AUTOGESTION',
  AUTOGESTION_EN_PROGRESO  = 'AUTOGESTION_EN_PROGRESO',
  AUTOGESTION_COMPLETADA   = 'AUTOGESTION_COMPLETADA',
  EN_REVISION              = 'EN_REVISION',
  APROBADO                 = 'APROBADO',
  DENEGADO                 = 'DENEGADO',
  VENCIDO                  = 'VENCIDO',
  SUSPENDIDO               = 'SUSPENDIDO',
  REVOCADO                 = 'REVOCADO',
}

export enum TipoUsuarioParking {
  COLABORADOR          = 'COLABORADOR',
  DIRECTIVO            = 'DIRECTIVO',
  VISITANTE_RECURRENTE = 'VISITANTE_RECURRENTE',
  PROVEEDOR            = 'PROVEEDOR',
  CONTRATISTA          = 'CONTRATISTA',
  TRANSPORTE           = 'TRANSPORTE',
  MENSAJERIA           = 'MENSAJERIA',
  TEMPORAL             = 'TEMPORAL',
}

export enum TipoVehiculo {
  CARRO           = 'CARRO',
  MOTO            = 'MOTO',
  BICICLETA       = 'BICICLETA',
  CAMION          = 'CAMION',
  VAN             = 'VAN',
  TAXI_AUTORIZADO = 'TAXI_AUTORIZADO',
  ELECTRICO       = 'ELECTRICO',
}

export enum TipoDocumentoVehiculo {
  TARJETA_PROPIEDAD = 'TARJETA_PROPIEDAD',
  LICENCIA_CONDUCCION = 'LICENCIA_CONDUCCION',
  SOAT              = 'SOAT',
  TECNOMECANICA     = 'TECNOMECANICA',
  OTRO              = 'OTRO',
}

export enum EstadoDocumento {
  PENDIENTE   = 'PENDIENTE',
  VIGENTE     = 'VIGENTE',
  POR_VENCER  = 'POR_VENCER',
  VENCIDO     = 'VENCIDO',
}

export enum EstadoCupo {
  DISPONIBLE   = 'DISPONIBLE',
  ASIGNADO     = 'ASIGNADO',
  RESERVADO    = 'RESERVADO',
  OCUPADO      = 'OCUPADO',
  BLOQUEADO    = 'BLOQUEADO',
  MANTENIMIENTO= 'MANTENIMIENTO',
  INACTIVO     = 'INACTIVO',
}

export enum TipoCupo {
  CARRO              = 'CARRO',
  MOTO               = 'MOTO',
  BICICLETA          = 'BICICLETA',
  ELECTRICO          = 'ELECTRICO',
  VISITANTE          = 'VISITANTE',
  MOVILIDAD_REDUCIDA = 'MOVILIDAD_REDUCIDA',
  CARGA_DESCARGA     = 'CARGA_DESCARGA',
}

export enum EstadoAutorizacionParking {
  ACTIVA     = 'ACTIVA',
  VENCIDA    = 'VENCIDA',
  SUSPENDIDA = 'SUSPENDIDA',
  REVOCADA   = 'REVOCADA',
}

export enum TipoAutorizacion {
  SIN_CUPO_FIJO            = 'SIN_CUPO_FIJO',
  CON_CUPO_FIJO            = 'CON_CUPO_FIJO',
  POR_HORARIO              = 'POR_HORARIO',
  DIAS_ESPECIFICOS         = 'DIAS_ESPECIFICOS',
  TEMPORAL                 = 'TEMPORAL',
  INGRESO_SIN_PERMANENCIA  = 'INGRESO_SIN_PERMANENCIA',
  POR_EXCEPCION            = 'POR_EXCEPCION',
}

export enum MetodoAccesoParking {
  PLACA_MANUAL = 'PLACA_MANUAL',
  DOCUMENTO    = 'DOCUMENTO',
  QR           = 'QR',
  CONTINGENCIA = 'CONTINGENCIA',
}

export enum ResultadoVerificacion {
  AUTORIZADO          = 'AUTORIZADO',
  NO_AUTORIZADO       = 'NO_AUTORIZADO',
  NO_REGISTRADO       = 'NO_REGISTRADO',
  VENCIDO             = 'VENCIDO',
  SUSPENDIDO          = 'SUSPENDIDO',
  CUPO_NO_DISPONIBLE  = 'CUPO_NO_DISPONIBLE',
  EXCEPCION           = 'EXCEPCION',
}

export enum TipoNovedad {
  VEHICULO_MAL_PARQUEADO      = 'VEHICULO_MAL_PARQUEADO',
  CUPO_NO_ASIGNADO            = 'CUPO_NO_ASIGNADO',
  BLOQUEO_SALIDA              = 'BLOQUEO_SALIDA',
  INGRESO_SIN_AUTORIZACION    = 'INGRESO_SIN_AUTORIZACION',
  PLACA_NO_COINCIDE           = 'PLACA_NO_COINCIDE',
  DOCUMENTO_VENCIDO           = 'DOCUMENTO_VENCIDO',
  DAÑO_INFRAESTRUCTURA        = 'DAÑO_INFRAESTRUCTURA',
  INCIDENTE_SEGURIDAD         = 'INCIDENTE_SEGURIDAD',
  PERMANENCIA_FUERA_HORARIO   = 'PERMANENCIA_FUERA_HORARIO',
  USO_INDEBIDO_CUPO_RESERVADO = 'USO_INDEBIDO_CUPO_RESERVADO',
  PERDIDA_TARJETA             = 'PERDIDA_TARJETA',
}

export enum EstadoNovedad {
  ABIERTA     = 'ABIERTA',
  EN_REVISION = 'EN_REVISION',
  ESCALADA    = 'ESCALADA',
  RESUELTA    = 'RESUELTA',
  CERRADA     = 'CERRADA',
  ANULADA     = 'ANULADA',
}

export enum TipoExcepcion {
  VISITANTE_VIP              = 'VISITANTE_VIP',
  PROVEEDOR_PUNTUAL          = 'PROVEEDOR_PUNTUAL',
  MANTENIMIENTO              = 'MANTENIMIENTO',
  EMERGENCIA                 = 'EMERGENCIA',
  CARGA_DESCARGA             = 'CARGA_DESCARGA',
  EVENTO                     = 'EVENTO',
  VEHICULO_REEMPLAZO         = 'VEHICULO_REEMPLAZO',
  PLACA_TEMPORAL             = 'PLACA_TEMPORAL',
  INGRESO_FUERA_HORARIO      = 'INGRESO_FUERA_HORARIO',
  CUPO_ESPECIAL_MOVILIDAD    = 'CUPO_ESPECIAL_MOVILIDAD',
}

export enum AlcanceExcepcion {
  ENTRADA_UNICA = 'ENTRADA_UNICA',
  RANGO_FECHAS  = 'RANGO_FECHAS',
  HORARIO       = 'HORARIO',
  ZONA          = 'ZONA',
}
```

---

### `parking_solicitudes`

| Columna | Tipo MySQL | TypeScript | Nullable | Notas |
|---|---|---|---|---|
| id | INT PK AI | number | No | BaseEntity |
| codigo | VARCHAR(20) UNIQUE | string | No | PKG-2026-XXXX |
| sede_id | INT FK | number | No | → sedes |
| persona_id | INT FK | number | Yes | → personas |
| creado_por | INT FK | number | No | → usuarios |
| tipo_usuario | ENUM | TipoUsuarioParking | No | |
| tipo_vehiculo | ENUM | TipoVehiculo | No | |
| placa | VARCHAR(10) | string | No | uppercase, sin guiones |
| marca | VARCHAR(50) | string | No | |
| linea | VARCHAR(50) | string | No | modelo/referencia |
| color | VARCHAR(30) | string | No | |
| modelo_anio | SMALLINT | number | Yes | |
| horario_requerido | VARCHAR(100) | string | No | descripción libre |
| dias_requeridos | TEXT | string | Yes | JSON: ["LUNES","MARTES"] |
| fecha_inicio | DATE | Date | No | |
| fecha_fin | DATE | Date | No | |
| motivo | TEXT | string | No | |
| estado | ENUM | EstadoSolicitudParking | No | default: BORRADOR |
| token_autogestion | VARCHAR(64) UNIQUE | string | Yes | UUID |
| token_expira_en | DATETIME | Date | Yes | |
| autogestion_completada_en | DATETIME | Date | Yes | |
| aprobado_por | INT FK | number | Yes | → usuarios |
| aprobado_en | DATETIME | Date | Yes | |
| motivo_denegacion | TEXT | string | Yes | |
| observaciones_internas | TEXT | string | Yes | solo visible a aprobador |
| created_at | DATETIME | Date | No | BaseEntity |
| updated_at | DATETIME | Date | No | BaseEntity |
| deleted_at | DATETIME | Date | Yes | soft delete |

---

### `parking_vehiculos`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| solicitud_id | INT FK | number | Yes |
| sede_id | INT FK | number | No |
| persona_id | INT FK | number | Yes |
| placa | VARCHAR(10) | string | No |
| marca | VARCHAR(50) | string | No |
| linea | VARCHAR(50) | string | No |
| color | VARCHAR(30) | string | No |
| modelo_anio | SMALLINT | number | Yes |
| tipo_vehiculo | ENUM | TipoVehiculo | No |
| es_vehiculo_empresa | BOOLEAN | boolean | No | default false |
| es_electrico | BOOLEAN | boolean | No | default false |
| activo | BOOLEAN | boolean | No | default true |

---

### `parking_autorizaciones`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| solicitud_id | INT FK | number | No |
| vehiculo_id | INT FK | number | No |
| persona_id | INT FK | number | Yes |
| sede_id | INT FK | number | No |
| aprobado_por | INT FK | number | No |
| tipo_autorizacion | ENUM | TipoAutorizacion | No |
| estado | ENUM | EstadoAutorizacionParking | No | default: ACTIVA |
| fecha_inicio | DATE | Date | No | |
| fecha_fin | DATE | Date | No | |
| dias_permitidos | TEXT | string | Yes | JSON array |
| horario_inicio | VARCHAR(5) | string | Yes | "07:00" |
| horario_fin | VARCHAR(5) | string | Yes | "19:00" |
| cupo_id | INT FK | number | Yes | → parking_cupos |
| observaciones | TEXT | string | Yes | |

---

### `parking_documentos`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| solicitud_id | INT FK | number | No |
| tipo_documento | ENUM | TipoDocumentoVehiculo | No |
| nombre_archivo | VARCHAR(255) | string | No |
| ruta_archivo | VARCHAR(500) | string | No |
| fecha_vencimiento | DATE | Date | Yes | SOAT, Tecno |
| estado | ENUM | EstadoDocumento | No | default: PENDIENTE |
| cargado_por | INT FK | number | No |

---

### `parking_zonas`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| sede_id | INT FK | number | No |
| nombre | VARCHAR(100) | string | No |
| descripcion | TEXT | string | Yes |
| capacidad_total | INT | number | No |
| capacidad_carros | INT | number | No | default 0 |
| capacidad_motos | INT | number | No | default 0 |
| capacidad_bicis | INT | number | No | default 0 |
| capacidad_electricos | INT | number | No | default 0 |
| capacidad_visitantes | INT | number | No | default 0 |
| capacidad_movilidad_reducida | INT | number | No | default 0 |
| activa | BOOLEAN | boolean | No | default true |

---

### `parking_cupos`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| zona_id | INT FK | number | No |
| sede_id | INT FK | number | No |
| numero_cupo | VARCHAR(20) | string | No | "A-001" |
| tipo_cupo | ENUM | TipoCupo | No |
| estado | ENUM | EstadoCupo | No | default: DISPONIBLE |
| observacion | TEXT | string | Yes |

---

### `parking_accesos`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| sede_id | INT FK | number | No |
| registrado_por | INT FK | number | No |
| autorizacion_id | INT FK | number | Yes |
| excepcion_id | INT FK | number | Yes |
| cupo_id | INT FK | number | Yes |
| placa | VARCHAR(10) | string | No |
| tipo_vehiculo | ENUM | TipoVehiculo | Yes |
| tipo_acceso | ENUM('ENTRADA','SALIDA') | string | No |
| metodo | ENUM | MetodoAccesoParking | No |
| resultado | ENUM | ResultadoVerificacion | No |
| observacion | TEXT | string | Yes |
| fecha_hora | DATETIME | Date | No |

---

### `parking_novedades`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| sede_id | INT FK | number | No |
| acceso_id | INT FK | number | Yes |
| autorizacion_id | INT FK | number | Yes |
| tipo_novedad | ENUM | TipoNovedad | No |
| descripcion | TEXT | string | No |
| placa | VARCHAR(10) | string | Yes |
| persona_id | INT FK | number | Yes |
| estado | ENUM | EstadoNovedad | No | default: ABIERTA |
| accion_tomada | TEXT | string | Yes |
| observacion_resolucion | TEXT | string | Yes |
| reportado_por | INT FK | number | No |
| asignado_a | INT FK | number | Yes |
| resuelto_por | INT FK | number | Yes |
| resuelta_en | DATETIME | Date | Yes |

---

### `parking_excepciones`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| sede_id | INT FK | number | No |
| tipo_excepcion | ENUM | TipoExcepcion | No |
| alcance | ENUM | AlcanceExcepcion | No |
| placa | VARCHAR(10) | string | Yes |
| persona_id | INT FK | number | Yes |
| nombre_persona | VARCHAR(200) | string | Yes |
| motivo | TEXT | string | No |
| aprobado_por | INT FK | number | No |
| fecha_inicio | DATE | Date | No |
| fecha_fin | DATE | Date | No |
| horario_inicio | VARCHAR(5) | string | Yes |
| horario_fin | VARCHAR(5) | string | Yes |
| zona_id | INT FK | number | Yes |
| usos_permitidos | INT | number | Yes | null = ilimitado |
| usos_realizados | INT | number | No | default 0 |
| activa | BOOLEAN | boolean | No | default true |

---

### `parking_historial`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| solicitud_id | INT FK | number | Yes |
| autorizacion_id | INT FK | number | Yes |
| usuario_id | INT FK | number | No |
| evento | VARCHAR(50) | string | No | 'APROBADO', 'SUSPENDIDO'... |
| descripcion | TEXT | string | No |
| estado_anterior | VARCHAR(50) | string | Yes |
| estado_nuevo | VARCHAR(50) | string | Yes |
| fecha_hora | DATETIME | Date | No |

---

### `parking_politicas_sede`

| Columna | Tipo MySQL | TypeScript | Nullable |
|---|---|---|---|
| id | INT PK AI | number | No |
| sede_id | INT FK UNIQUE | number | No |
| max_vehiculos_por_persona | INT | number | No | default 1 |
| requiere_soat | BOOLEAN | boolean | No | default true |
| requiere_tecnomecanica | BOOLEAN | boolean | No | default true |
| requiere_licencia | BOOLEAN | boolean | No | default true |
| dias_alerta_vencimiento_docs | INT | number | No | default 30 |
| permite_vehiculo_reemplazo | BOOLEAN | boolean | No | default true |
| permite_entrada_unica_visitantes | BOOLEAN | boolean | No | default true |
| requiere_aprobacion_jefe | BOOLEAN | boolean | No | default false |
| horario_inicio_operacion | VARCHAR(5) | string | No | "06:00" |
| horario_fin_operacion | VARCHAR(5) | string | No | "22:00" |
| activa | BOOLEAN | boolean | No | default true |

---

## ENDPOINTS — CONTRATO COMPLETO

---

### CATÁLOGOS

#### `GET /parking/catalogos/sedes`
- Auth: `@Public()`
- Query: ninguno
- Response:
```json
{
  "data": [
    { "id": 1, "nombre": "Sede Bogotá", "ciudad": "Bogotá" }
  ]
}
```

#### `GET /parking/catalogos/tipos-vehiculo`
- Auth: `@Public()`
- Response:
```json
{ "data": ["CARRO", "MOTO", "BICICLETA", "CAMION", "VAN", "TAXI_AUTORIZADO", "ELECTRICO"] }
```

#### `GET /parking/catalogos/tipos-usuario`
- Auth: `@Public()`
- Response:
```json
{ "data": ["COLABORADOR", "DIRECTIVO", "VISITANTE_RECURRENTE", "PROVEEDOR", "CONTRATISTA", "TRANSPORTE", "MENSAJERIA", "TEMPORAL"] }
```

#### `GET /parking/catalogos/zonas/:sedeId`
- Auth: `@Public()`
- Response:
```json
{
  "data": [
    { "id": 3, "nombre": "Zona A — Carros", "capacidad_total": 50 }
  ]
}
```

#### `GET /parking/catalogos/politicas/:sedeId`
- Auth: `@Public()`
- Response: objeto `ParkingPoliticaSede` (sin campos de auditoría)

---

### DASHBOARD

#### `GET /parking/dashboard/:sedeId`
- Auth: JWT
- Roles: `GESTION_PARKING`, `ADMIN_PARKING`, `VISUALIZADOR`
- Response:
```json
{
  "data": {
    "ocupacion_actual": {
      "total": 120,
      "ocupados": 87,
      "disponibles": 33,
      "porcentaje": 72.5
    },
    "solicitudes_pendientes": 5,
    "autorizaciones_activas": 98,
    "autorizaciones_por_vencer": 12,
    "documentos_por_vencer": 7,
    "novedades_abiertas": 3,
    "vehiculos_dentro": 87,
    "accesos_hoy": {
      "entradas": 45,
      "salidas": 38
    },
    "accesos_semana": [
      { "fecha": "2026-06-01", "entradas": 40, "salidas": 38 }
    ],
    "ocupacion_por_zona": [
      {
        "zona_id": 1,
        "nombre": "Zona A",
        "total": 50,
        "ocupados": 35,
        "porcentaje": 70
      }
    ],
    "novedades_recientes": [ ... ],
    "solicitudes_en_revision": [ ... ]
  }
}
```

---

### SOLICITUDES

#### `GET /parking/solicitudes`
- Auth: JWT
- Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Query params:
  - `sede_id` (number)
  - `estado` (EstadoSolicitudParking)
  - `tipo_usuario` (TipoUsuarioParking)
  - `tipo_vehiculo` (TipoVehiculo)
  - `placa` (string)
  - `persona_id` (number)
  - `fecha_inicio_desde` (YYYY-MM-DD)
  - `fecha_inicio_hasta` (YYYY-MM-DD)
  - `page`, `per_page`
- Response: lista paginada de `SolicitudResumen`

```json
{
  "data": {
    "items": [
      {
        "id": 42,
        "codigo": "PKG-2026-0042",
        "placa": "ABC123",
        "tipo_vehiculo": "CARRO",
        "tipo_usuario": "COLABORADOR",
        "estado": "AUTOGESTION_COMPLETADA",
        "fecha_inicio": "2026-07-01",
        "fecha_fin": "2026-12-31",
        "sede": { "id": 1, "nombre": "Sede Bogotá" },
        "persona": { "id": 10, "nombres": "Juan", "apellidos": "Pérez", "numero_documento": "12345678" },
        "created_at": "2026-06-05T10:00:00.000Z"
      }
    ],
    "total": 80,
    "page": 1,
    "per_page": 20,
    "total_pages": 4
  }
}
```

#### `GET /parking/solicitudes/:id`
- Auth: JWT
- Roles: `GESTION_PARKING`, `ADMIN_PARKING` (o dueño de la solicitud)
- Response: `SolicitudDetalle` completo

```json
{
  "data": {
    "id": 42,
    "codigo": "PKG-2026-0042",
    "placa": "ABC123",
    "marca": "Chevrolet",
    "linea": "Spark",
    "color": "Rojo",
    "modelo_anio": 2020,
    "tipo_vehiculo": "CARRO",
    "tipo_usuario": "COLABORADOR",
    "horario_requerido": "7am a 6pm",
    "dias_requeridos": ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"],
    "fecha_inicio": "2026-07-01",
    "fecha_fin": "2026-12-31",
    "motivo": "Trabajo presencial sede Bogotá",
    "estado": "AUTOGESTION_COMPLETADA",
    "observaciones_internas": null,
    "motivo_denegacion": null,
    "sede": { "id": 1, "nombre": "Sede Bogotá" },
    "persona": { "id": 10, "nombres": "Juan", "apellidos": "Pérez", "email": "juan@permoda.com", "numero_documento": "12345678" },
    "creador": { "id": 10, "nombre": "Juan Pérez" },
    "aprobador": null,
    "documentos": [
      {
        "id": 1,
        "tipo_documento": "TARJETA_PROPIEDAD",
        "nombre_archivo": "tarjeta_abc123.pdf",
        "ruta_archivo": "/parking/archivos/tarjeta_abc123.pdf",
        "fecha_vencimiento": null,
        "estado": "VIGENTE"
      },
      {
        "id": 2,
        "tipo_documento": "SOAT",
        "nombre_archivo": "soat_abc123.pdf",
        "fecha_vencimiento": "2026-11-30",
        "estado": "VIGENTE"
      }
    ],
    "autorizacion": null,
    "historial": [
      {
        "evento": "CREADO",
        "descripcion": "Solicitud creada",
        "estado_anterior": null,
        "estado_nuevo": "BORRADOR",
        "usuario": { "id": 10, "nombre": "Juan Pérez" },
        "fecha_hora": "2026-06-05T10:00:00.000Z"
      }
    ],
    "created_at": "2026-06-05T10:00:00.000Z",
    "updated_at": "2026-06-05T12:00:00.000Z"
  }
}
```

#### `POST /parking/solicitudes`
- Auth: JWT
- Roles: cualquier usuario autenticado
- Body:
```json
{
  "sede_id": 1,
  "tipo_usuario": "COLABORADOR",
  "tipo_vehiculo": "CARRO",
  "placa": "ABC123",
  "marca": "Chevrolet",
  "linea": "Spark",
  "color": "Rojo",
  "modelo_anio": 2020,
  "horario_requerido": "7am a 6pm",
  "dias_requeridos": ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"],
  "fecha_inicio": "2026-07-01",
  "fecha_fin": "2026-12-31",
  "motivo": "Trabajo presencial"
}
```
- Response: `SolicitudDetalle` con estado `BORRADOR`

#### `PUT /parking/solicitudes/:id`
- Auth: JWT — solo el creador mientras está en `BORRADOR`
- Body: mismos campos que POST (todos opcionales)
- Response: `SolicitudDetalle` actualizado

#### `DELETE /parking/solicitudes/:id`
- Auth: JWT — solo el creador mientras está en `BORRADOR`
- Response: `{ "message": "Solicitud eliminada" }`

#### `POST /parking/solicitudes/:id/enviar`
- Auth: JWT
- Descripción: `BORRADOR` → `PENDIENTE_AUTOGESTION` + genera token + (futuro) envía email
- Body: ninguno
- Response:
```json
{
  "data": {
    "estado": "PENDIENTE_AUTOGESTION",
    "token_autogestion": "abc123...",
    "token_expira_en": "2026-06-08T10:00:00.000Z",
    "link_autogestion": "https://app.koajaccess.com/portal/parking/abc123..."
  }
}
```

#### `POST /parking/solicitudes/:id/token`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Descripción: regenerar token (si el anterior venció)
- Body: `{ "duracion_horas": 72 }`
- Response: mismo que `/enviar`

#### `POST /parking/solicitudes/:id/tomar`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Descripción: aprobador toma la solicitud → `EN_REVISION`
- Body: ninguno
- Response: `SolicitudDetalle`

#### `POST /parking/solicitudes/:id/aprobar`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body:
```json
{
  "tipo_autorizacion": "SIN_CUPO_FIJO",
  "cupo_id": null,
  "dias_permitidos": ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"],
  "horario_inicio": "07:00",
  "horario_fin": "19:00",
  "observaciones": "Aprobado con acceso normal"
}
```
- Response:
```json
{
  "data": {
    "solicitud": { "id": 42, "estado": "APROBADO" },
    "autorizacion": {
      "id": 15,
      "tipo_autorizacion": "SIN_CUPO_FIJO",
      "estado": "ACTIVA",
      "fecha_inicio": "2026-07-01",
      "fecha_fin": "2026-12-31"
    }
  }
}
```

#### `POST /parking/solicitudes/:id/denegar`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body:
```json
{ "motivo_denegacion": "Cupos agotados para el período solicitado" }
```
- Response: `SolicitudDetalle` con estado `DENEGADO`

#### `POST /parking/solicitudes/:id/solicitar-correccion`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body:
```json
{ "observaciones": "Por favor adjuntar SOAT vigente" }
```
- Response: `SolicitudDetalle` con estado `AUTOGESTION_EN_PROGRESO`

#### `POST /parking/solicitudes/:id/suspender`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body: `{ "motivo": "Reporte de novedad activa" }`
- Response: `SolicitudDetalle` con estado `SUSPENDIDO`

#### `POST /parking/solicitudes/:id/revocar`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body: `{ "motivo": "Desvinculación del colaborador" }`
- Response: `SolicitudDetalle` con estado `REVOCADO`

---

### AUTOGESTIÓN (público con token)

#### `GET /parking/autogestion/:token`
- Auth: `ParkingTokenGuard`
- Response:
```json
{
  "data": {
    "solicitud_id": 42,
    "codigo": "PKG-2026-0042",
    "sede": { "id": 1, "nombre": "Sede Bogotá" },
    "tipo_usuario": "COLABORADOR",
    "tipo_vehiculo": "CARRO",
    "estado": "AUTOGESTION_EN_PROGRESO",
    "pasos_completados": ["datos_personales", "vehiculo"],
    "datos_personales": {
      "nombres": "Juan",
      "apellidos": "Pérez",
      "numero_documento": "12345678",
      "email": "juan@permoda.com",
      "telefono": "3001234567"
    },
    "vehiculo": {
      "placa": "ABC123",
      "marca": "Chevrolet",
      "linea": "Spark",
      "color": "Rojo",
      "modelo_anio": 2020
    },
    "documentos": [ ... ],
    "politica": {
      "requiere_soat": true,
      "requiere_tecnomecanica": true,
      "requiere_licencia": true
    },
    "token_expira_en": "2026-06-08T10:00:00.000Z"
  }
}
```

#### `POST /parking/autogestion/:token/upload`
- Auth: `ParkingTokenGuard`
- Content-Type: `multipart/form-data`
- Body:
```
tipo_documento: "SOAT"
fecha_vencimiento: "2026-11-30"   (solo para SOAT y TECNOMECANICA)
archivo: <file>
```
- Response:
```json
{
  "data": {
    "id": 3,
    "tipo_documento": "SOAT",
    "nombre_archivo": "soat_abc123.pdf",
    "ruta_archivo": "/parking/archivos/soat_abc123.pdf",
    "fecha_vencimiento": "2026-11-30",
    "estado": "VIGENTE"
  }
}
```

#### `POST /parking/autogestion/:token/datos-personales`
- Auth: `ParkingTokenGuard`
- Body:
```json
{
  "nombres": "Juan",
  "apellidos": "Pérez",
  "tipo_documento": "CC",
  "numero_documento": "12345678",
  "email": "juan@permoda.com",
  "telefono": "3001234567"
}
```
- Response: `{ "data": { "paso": "datos_personales", "completado": true } }`

#### `POST /parking/autogestion/:token/vehiculo`
- Auth: `ParkingTokenGuard`
- Body:
```json
{
  "placa": "ABC123",
  "marca": "Chevrolet",
  "linea": "Spark",
  "color": "Rojo",
  "modelo_anio": 2020,
  "es_vehiculo_empresa": false,
  "es_electrico": false
}
```
- Response: `{ "data": { "paso": "vehiculo", "completado": true } }`

#### `POST /parking/autogestion/:token/documentos`
- Auth: `ParkingTokenGuard`
- Descripción: confirma que los uploads están listos y asocia documentos al paso
- Body: `{}` (los docs ya se subieron via `/upload`)
- Response: `{ "data": { "paso": "documentos", "completado": true, "documentos_faltantes": [] } }`

#### `POST /parking/autogestion/:token/horario`
- Auth: `ParkingTokenGuard`
- Body:
```json
{
  "horario_requerido": "7am a 6pm lunes a viernes",
  "dias_requeridos": ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES"],
  "fecha_inicio": "2026-07-01",
  "fecha_fin": "2026-12-31",
  "motivo": "Trabajo presencial"
}
```
- Response: `{ "data": { "paso": "horario", "completado": true } }`

#### `POST /parking/autogestion/:token/aceptacion`
- Auth: `ParkingTokenGuard`
- Body: `{ "acepta_normas": true, "acepta_tratamiento_datos": true }`
- Response:
```json
{
  "data": {
    "estado": "AUTOGESTION_COMPLETADA",
    "mensaje": "Tu solicitud ha sido enviada. Recibirás una notificación con la decisión."
  }
}
```

---

### VEHÍCULOS

#### `GET /parking/vehiculos`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Query: `sede_id`, `tipo_vehiculo`, `activo`, `placa`, `page`, `per_page`
- Response: lista paginada de `VehiculoResumen`

```json
{
  "data": {
    "items": [
      {
        "id": 5,
        "placa": "ABC123",
        "marca": "Chevrolet",
        "linea": "Spark",
        "color": "Rojo",
        "tipo_vehiculo": "CARRO",
        "activo": true,
        "sede": { "id": 1, "nombre": "Sede Bogotá" },
        "persona": { "nombres": "Juan", "apellidos": "Pérez" },
        "autorizacion_activa": {
          "id": 15,
          "estado": "ACTIVA",
          "fecha_fin": "2026-12-31"
        }
      }
    ],
    "total": 50
  }
}
```

#### `GET /parking/vehiculos/:id`
- Response: `VehiculoDetalle` con historial de autorizaciones

#### `PATCH /parking/vehiculos/:id/estado`
- Body: `{ "activo": false }`

---

### AUTORIZACIONES

#### `GET /parking/autorizaciones`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Query: `sede_id`, `estado`, `tipo_autorizacion`, `placa`, `persona_id`, `page`, `per_page`
- Response: lista paginada

```json
{
  "data": {
    "items": [
      {
        "id": 15,
        "tipo_autorizacion": "SIN_CUPO_FIJO",
        "estado": "ACTIVA",
        "fecha_inicio": "2026-07-01",
        "fecha_fin": "2026-12-31",
        "horario_inicio": "07:00",
        "horario_fin": "19:00",
        "vehiculo": { "placa": "ABC123", "tipo_vehiculo": "CARRO" },
        "persona": { "nombres": "Juan", "apellidos": "Pérez" },
        "cupo": null,
        "solicitud": { "id": 42, "codigo": "PKG-2026-0042" }
      }
    ],
    "total": 98
  }
}
```

#### `GET /parking/autorizaciones/:id`
- Response: `AutorizacionDetalle` completo

#### `PATCH /parking/autorizaciones/:id/cupo`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Body: `{ "cupo_id": 7 }` o `{ "cupo_id": null }` para quitar cupo
- Response: autorización actualizada

#### `POST /parking/autorizaciones/:id/suspender`
- Body: `{ "motivo": "Novedad activa" }`

#### `POST /parking/autorizaciones/:id/reactivar`
- Body: `{ "motivo": "Novedad resuelta" }`

#### `POST /parking/autorizaciones/:id/revocar`
- Body: `{ "motivo": "Fin de contrato" }`

---

### CUPOS Y ZONAS

#### `GET /parking/zonas`
- Auth: JWT
- Query: `sede_id`, `activa`
- Response:

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Zona A — Carros",
      "sede_id": 1,
      "capacidad_total": 50,
      "activa": true,
      "ocupacion": {
        "total": 50,
        "disponibles": 15,
        "asignados": 30,
        "ocupados": 28,
        "bloqueados": 2,
        "porcentaje_ocupacion": 56
      }
    }
  ]
}
```

#### `POST /parking/zonas`
- Body:
```json
{
  "sede_id": 1,
  "nombre": "Zona B — Motos",
  "descripcion": "Zona lateral edificio principal",
  "capacidad_total": 30,
  "capacidad_motos": 30
}
```

#### `PUT /parking/zonas/:id`
- Body: mismos campos (todos opcionales)

#### `GET /parking/cupos`
- Query: `zona_id`, `sede_id`, `tipo_cupo`, `estado`, `page`, `per_page`
- Response: lista de cupos con asignación actual si aplica

#### `POST /parking/cupos`
- Body:
```json
{
  "zona_id": 1,
  "numero_cupo": "A-001",
  "tipo_cupo": "CARRO"
}
```

#### `PATCH /parking/cupos/:id/estado`
- Body: `{ "estado": "BLOQUEADO", "observacion": "Mantenimiento pintado" }`

#### `GET /parking/ocupacion/:sedeId`
- Auth: JWT
- Descripción: snapshot en tiempo real de toda la sede
- Response:
```json
{
  "data": {
    "sede_id": 1,
    "sede_nombre": "Sede Bogotá",
    "resumen": {
      "total": 120,
      "disponibles": 33,
      "ocupados": 87,
      "porcentaje": 72.5
    },
    "zonas": [
      {
        "id": 1,
        "nombre": "Zona A",
        "total": 50,
        "disponibles": 12,
        "ocupados": 35,
        "bloqueados": 3,
        "porcentaje": 70,
        "cupos": [
          { "id": 1, "numero": "A-001", "estado": "OCUPADO", "tipo": "CARRO", "placa_actual": "ABC123" },
          { "id": 2, "numero": "A-002", "estado": "DISPONIBLE", "tipo": "CARRO" }
        ]
      }
    ]
  }
}
```

---

### PORTAL DE VIGILANCIA

#### `POST /parking/vigilante/verificar`
- Auth: JWT — Roles: `VIGILANTE_PARKING`, `GESTION_PARKING`, `ADMIN_PARKING`
- Body:
```json
{
  "sede_id": 1,
  "placa": "ABC123",
  "tipo_busqueda": "PLACA"
}
```
- Response:
```json
{
  "data": {
    "resultado": "AUTORIZADO",
    "color_semaforo": "VERDE",
    "mensaje": "Puede ingresar",
    "autorizacion": {
      "id": 15,
      "tipo_autorizacion": "SIN_CUPO_FIJO",
      "horario_inicio": "07:00",
      "horario_fin": "19:00",
      "fecha_fin": "2026-12-31"
    },
    "vehiculo": {
      "placa": "ABC123",
      "marca": "Chevrolet",
      "linea": "Spark",
      "color": "Rojo",
      "tipo_vehiculo": "CARRO"
    },
    "persona": {
      "nombres": "Juan",
      "apellidos": "Pérez",
      "numero_documento": "12345678"
    },
    "cupo_asignado": null,
    "ya_esta_dentro": false,
    "alertas": ["SOAT vence en 25 días"]
  }
}
```

Posibles valores de `color_semaforo`: `VERDE` | `ROJO` | `AMARILLO` | `AZUL` | `GRIS`

#### `POST /parking/vigilante/entrada`
- Auth: JWT — Roles: `VIGILANTE_PARKING`, `GESTION_PARKING`, `ADMIN_PARKING`
- Body:
```json
{
  "sede_id": 1,
  "placa": "ABC123",
  "autorizacion_id": 15,
  "metodo": "PLACA_MANUAL",
  "cupo_id": null,
  "observacion": null
}
```
- Response:
```json
{
  "data": {
    "acceso_id": 320,
    "resultado": "AUTORIZADO",
    "tipo_acceso": "ENTRADA",
    "fecha_hora": "2026-06-05T09:15:00.000Z",
    "cupo": null,
    "mensaje": "Entrada registrada exitosamente"
  }
}
```

#### `POST /parking/vigilante/salida`
- Auth: JWT
- Body: mismo que `/entrada`
- Response: mismo que `/entrada` con `tipo_acceso: "SALIDA"`

#### `GET /parking/vigilante/dentro/:sedeId`
- Auth: JWT
- Response:
```json
{
  "data": {
    "total_dentro": 87,
    "vehiculos": [
      {
        "placa": "ABC123",
        "tipo_vehiculo": "CARRO",
        "persona": "Juan Pérez",
        "hora_entrada": "2026-06-05T09:15:00.000Z",
        "tiempo_dentro": "2h 30min",
        "cupo": "A-012"
      }
    ]
  }
}
```

#### `GET /parking/vigilante/ocupacion/:sedeId`
- Auth: JWT
- Response: versión simplificada del `/ocupacion/:sedeId` (sin detalle de cupos individuales)

#### `POST /parking/vigilante/novedad`
- Auth: JWT
- Body: igual que `POST /parking/novedades` (shortcut desde portal)

---

### ACCESOS

#### `GET /parking/accesos`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Query: `sede_id`, `placa`, `tipo_acceso`, `resultado`, `fecha_desde`, `fecha_hasta`, `page`, `per_page`
- Response: lista paginada de accesos

```json
{
  "data": {
    "items": [
      {
        "id": 320,
        "placa": "ABC123",
        "tipo_vehiculo": "CARRO",
        "tipo_acceso": "ENTRADA",
        "resultado": "AUTORIZADO",
        "metodo": "PLACA_MANUAL",
        "fecha_hora": "2026-06-05T09:15:00.000Z",
        "registrador": { "nombre": "Carlos Vigilante" },
        "cupo": null,
        "observacion": null
      }
    ],
    "total": 1540
  }
}
```

#### `GET /parking/accesos/vehiculo/:placa`
- Auth: JWT
- Query: `sede_id`, `fecha_desde`, `fecha_hasta`, `page`, `per_page`
- Response: historial completo de una placa

---

### NOVEDADES

#### `GET /parking/novedades`
- Auth: JWT — Roles: `VIGILANTE_PARKING`, `GESTION_PARKING`, `ADMIN_PARKING`
- Query: `sede_id`, `estado`, `tipo_novedad`, `placa`, `fecha_desde`, `fecha_hasta`, `page`, `per_page`

#### `GET /parking/novedades/:id`
- Response: `NovedadDetalle` completo

#### `POST /parking/novedades`
- Body:
```json
{
  "sede_id": 1,
  "tipo_novedad": "VEHICULO_MAL_PARQUEADO",
  "descripcion": "Vehículo estacionado en zona de carga",
  "placa": "XYZ999",
  "autorizacion_id": null,
  "acceso_id": 320
}
```

#### `PUT /parking/novedades/:id`
- Body: `{ "descripcion": "...", "accion_tomada": "...", "asignado_a": 5 }`

#### `POST /parking/novedades/:id/escalar`
- Body: `{ "observacion": "Reincidencia, escalar a jefe" }`

#### `POST /parking/novedades/:id/cerrar`
- Body: `{ "observacion_resolucion": "Vehículo reubicado" }`

#### `POST /parking/novedades/:id/anular`
- Body: `{ "observacion": "Reporte erróneo" }`

---

### EXCEPCIONES

#### `GET /parking/excepciones`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Query: `sede_id`, `tipo_excepcion`, `activa`, `placa`, `fecha_desde`, `fecha_hasta`, `page`, `per_page`

#### `POST /parking/excepciones`
- Body:
```json
{
  "sede_id": 1,
  "tipo_excepcion": "VISITANTE_VIP",
  "alcance": "RANGO_FECHAS",
  "placa": "VIS001",
  "nombre_persona": "Dr. Carlos Rodríguez",
  "motivo": "Visita directivos nacionales",
  "fecha_inicio": "2026-06-10",
  "fecha_fin": "2026-06-12",
  "horario_inicio": "08:00",
  "horario_fin": "18:00",
  "zona_id": null,
  "usos_permitidos": null
}
```

#### `POST /parking/excepciones/lote`
- Body:
```json
{
  "sede_id": 1,
  "tipo_excepcion": "EVENTO",
  "alcance": "ENTRADA_UNICA",
  "fecha_inicio": "2026-06-20",
  "fecha_fin": "2026-06-20",
  "motivo": "Evento corporativo — invitados externos",
  "placas": ["VIS001", "VIS002", "VIS003", "VIS004"]
}
```

#### `POST /parking/excepciones/:id/activar`
#### `POST /parking/excepciones/:id/desactivar`
#### `POST /parking/excepciones/:id/anular`
- Body para anular: `{ "motivo": "Evento cancelado" }`

---

### REPORTES

#### `GET /parking/reportes/accesos`
- Query: `sede_id`*, `fecha_desde`*, `fecha_hasta`*, `tipo_vehiculo`, `resultado`, `format` (json|excel)
- Response: lista de accesos con resumen

#### `GET /parking/reportes/ocupacion`
- Query: `sede_id`*, `fecha_desde`*, `fecha_hasta`*, `zona_id`
- Response: ocupación promedio y pico por período

#### `GET /parking/reportes/autorizaciones`
- Query: `sede_id`, `estado`, `tipo_autorizacion`, `fecha_desde`, `fecha_hasta`

#### `GET /parking/reportes/vencimientos`
- Query: `sede_id`, `dias_proximos` (default 30)
- Response:
```json
{
  "data": {
    "autorizaciones_por_vencer": [ { "placa": "ABC123", "fecha_fin": "2026-07-01", "dias_restantes": 26 } ],
    "documentos_por_vencer": [ { "placa": "XYZ999", "tipo": "SOAT", "fecha_vencimiento": "2026-06-25", "dias_restantes": 20 } ]
  }
}
```

#### `GET /parking/reportes/novedades`
- Query: `sede_id`, `estado`, `tipo_novedad`, `fecha_desde`, `fecha_hasta`

#### `GET /parking/reportes/vehiculos`
- Query: `sede_id`, `tipo_vehiculo`, `activo`

#### `GET /parking/reportes/excepciones`
- Query: `sede_id`, `activa`, `tipo_excepcion`, `fecha_desde`, `fecha_hasta`

#### `GET /parking/reportes/charts`
- Query: `sede_id`*, `periodo` (7d|30d|90d)
- Response:
```json
{
  "data": {
    "accesos_por_dia": [ { "fecha": "2026-06-01", "entradas": 45, "salidas": 43 } ],
    "solicitudes_por_estado": [ { "estado": "APROBADO", "total": 80 } ],
    "vehiculos_por_tipo": [ { "tipo": "CARRO", "total": 60 }, { "tipo": "MOTO", "total": 25 } ],
    "novedades_por_tipo": [ { "tipo": "VEHICULO_MAL_PARQUEADO", "total": 5 } ],
    "ocupacion_promedio_por_zona": [ { "zona": "Zona A", "promedio": 68 } ]
  }
}
```

---

### CONFIGURACIÓN POR SEDE

#### `GET /parking/configuracion/:sedeId`
- Auth: JWT — Roles: `GESTION_PARKING`, `ADMIN_PARKING`
- Response: objeto `ParkingPoliticaSede` completo

#### `PUT /parking/configuracion/:sedeId`
- Body: cualquier campo de `ParkingPoliticaSede` (todos opcionales)
```json
{
  "max_vehiculos_por_persona": 1,
  "requiere_soat": true,
  "requiere_tecnomecanica": true,
  "requiere_licencia": true,
  "dias_alerta_vencimiento_docs": 30,
  "permite_vehiculo_reemplazo": true,
  "permite_entrada_unica_visitantes": true,
  "horario_inicio_operacion": "06:00",
  "horario_fin_operacion": "22:00"
}
```

#### `POST /parking/configuracion/:sedeId/inicializar`
- Descripción: crea política con valores por defecto si no existe
- Response: `ParkingPoliticaSede` creado

---

### ARCHIVOS

#### `GET /parking/archivos/*path`
- Auth: JWT (verificar que el solicitante o aprobador tiene acceso al documento)
- Response: stream del archivo

---

## TIPOS FRONTEND (`types/parking.ts`)

```typescript
// ── Enums (copiar del backend) ──────────────────────────────

export type EstadoSolicitudParking =
  | 'BORRADOR' | 'PENDIENTE_AUTOGESTION' | 'AUTOGESTION_EN_PROGRESO'
  | 'AUTOGESTION_COMPLETADA' | 'EN_REVISION' | 'APROBADO'
  | 'DENEGADO' | 'VENCIDO' | 'SUSPENDIDO' | 'REVOCADO'

export type TipoUsuarioParking =
  | 'COLABORADOR' | 'DIRECTIVO' | 'VISITANTE_RECURRENTE' | 'PROVEEDOR'
  | 'CONTRATISTA' | 'TRANSPORTE' | 'MENSAJERIA' | 'TEMPORAL'

export type TipoVehiculo =
  | 'CARRO' | 'MOTO' | 'BICICLETA' | 'CAMION'
  | 'VAN' | 'TAXI_AUTORIZADO' | 'ELECTRICO'

export type TipoDocumentoVehiculo =
  | 'TARJETA_PROPIEDAD' | 'LICENCIA_CONDUCCION'
  | 'SOAT' | 'TECNOMECANICA' | 'OTRO'

export type EstadoDocumento = 'PENDIENTE' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'
export type EstadoCupo = 'DISPONIBLE' | 'ASIGNADO' | 'RESERVADO' | 'OCUPADO' | 'BLOQUEADO' | 'MANTENIMIENTO' | 'INACTIVO'
export type TipoCupo = 'CARRO' | 'MOTO' | 'BICICLETA' | 'ELECTRICO' | 'VISITANTE' | 'MOVILIDAD_REDUCIDA' | 'CARGA_DESCARGA'
export type EstadoAutorizacionParking = 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'REVOCADA'
export type TipoAutorizacion = 'SIN_CUPO_FIJO' | 'CON_CUPO_FIJO' | 'POR_HORARIO' | 'DIAS_ESPECIFICOS' | 'TEMPORAL' | 'INGRESO_SIN_PERMANENCIA' | 'POR_EXCEPCION'
export type MetodoAccesoParking = 'PLACA_MANUAL' | 'DOCUMENTO' | 'QR' | 'CONTINGENCIA'
export type ResultadoVerificacion = 'AUTORIZADO' | 'NO_AUTORIZADO' | 'NO_REGISTRADO' | 'VENCIDO' | 'SUSPENDIDO' | 'CUPO_NO_DISPONIBLE' | 'EXCEPCION'
export type TipoNovedad = 'VEHICULO_MAL_PARQUEADO' | 'CUPO_NO_ASIGNADO' | 'BLOQUEO_SALIDA' | 'INGRESO_SIN_AUTORIZACION' | 'PLACA_NO_COINCIDE' | 'DOCUMENTO_VENCIDO' | 'DAÑO_INFRAESTRUCTURA' | 'INCIDENTE_SEGURIDAD' | 'PERMANENCIA_FUERA_HORARIO' | 'USO_INDEBIDO_CUPO_RESERVADO' | 'PERDIDA_TARJETA'
export type EstadoNovedad = 'ABIERTA' | 'EN_REVISION' | 'ESCALADA' | 'RESUELTA' | 'CERRADA' | 'ANULADA'
export type TipoExcepcion = 'VISITANTE_VIP' | 'PROVEEDOR_PUNTUAL' | 'MANTENIMIENTO' | 'EMERGENCIA' | 'CARGA_DESCARGA' | 'EVENTO' | 'VEHICULO_REEMPLAZO' | 'PLACA_TEMPORAL' | 'INGRESO_FUERA_HORARIO' | 'CUPO_ESPECIAL_MOVILIDAD'
export type AlcanceExcepcion = 'ENTRADA_UNICA' | 'RANGO_FECHAS' | 'HORARIO' | 'ZONA'
export type ColorSemaforo = 'VERDE' | 'ROJO' | 'AMARILLO' | 'AZUL' | 'GRIS'

// ── Shapes ──────────────────────────────────────────────────

export interface SedeBasicaParking {
  id: number
  nombre: string
  ciudad?: string
}

export interface PersonaBasicaParking {
  id: number
  nombres: string
  apellidos: string
  numero_documento: string
  email?: string
}

export interface UsuarioBasicoParking {
  id: number
  nombre: string
}

export interface ParkingDocumento {
  id: number
  tipo_documento: TipoDocumentoVehiculo
  nombre_archivo: string
  ruta_archivo: string
  fecha_vencimiento: string | null
  estado: EstadoDocumento
}

export interface ParkingHistorialItem {
  id: number
  evento: string
  descripcion: string
  estado_anterior: string | null
  estado_nuevo: string | null
  usuario: UsuarioBasicoParking
  fecha_hora: string
}

export interface ParkingVehiculoBasico {
  id: number
  placa: string
  marca: string
  linea: string
  color: string
  tipo_vehiculo: TipoVehiculo
  es_electrico: boolean
  activo: boolean
}

export interface ParkingAutorizacionBasica {
  id: number
  tipo_autorizacion: TipoAutorizacion
  estado: EstadoAutorizacionParking
  fecha_inicio: string
  fecha_fin: string
  horario_inicio: string | null
  horario_fin: string | null
  cupo: ParkingCupoBasico | null
}

export interface ParkingCupoBasico {
  id: number
  numero_cupo: string
  tipo_cupo: TipoCupo
  estado: EstadoCupo
  zona: { id: number; nombre: string }
}

export interface SolicitudResumen {
  id: number
  codigo: string
  placa: string
  tipo_vehiculo: TipoVehiculo
  tipo_usuario: TipoUsuarioParking
  estado: EstadoSolicitudParking
  fecha_inicio: string
  fecha_fin: string
  sede: SedeBasicaParking
  persona: PersonaBasicaParking | null
  created_at: string
}

export interface SolicitudDetalle extends SolicitudResumen {
  marca: string
  linea: string
  color: string
  modelo_anio: number | null
  horario_requerido: string
  dias_requeridos: string[] | null
  motivo: string
  observaciones_internas: string | null
  motivo_denegacion: string | null
  token_autogestion: string | null
  token_expira_en: string | null
  aprobado_en: string | null
  autogestion_completada_en: string | null
  creador: UsuarioBasicoParking
  aprobador: UsuarioBasicoParking | null
  documentos: ParkingDocumento[]
  autorizacion: ParkingAutorizacionBasica | null
  historial: ParkingHistorialItem[]
  updated_at: string
}

export interface AutogestionData {
  solicitud_id: number
  codigo: string
  sede: SedeBasicaParking
  tipo_usuario: TipoUsuarioParking
  tipo_vehiculo: TipoVehiculo
  estado: EstadoSolicitudParking
  pasos_completados: string[]
  datos_personales: {
    nombres: string
    apellidos: string
    tipo_documento: string
    numero_documento: string
    email: string
    telefono: string
  } | null
  vehiculo: {
    placa: string
    marca: string
    linea: string
    color: string
    modelo_anio: number | null
    es_vehiculo_empresa: boolean
    es_electrico: boolean
  } | null
  documentos: ParkingDocumento[]
  politica: {
    requiere_soat: boolean
    requiere_tecnomecanica: boolean
    requiere_licencia: boolean
  }
  token_expira_en: string
}

export interface VerificacionResultado {
  resultado: ResultadoVerificacion
  color_semaforo: ColorSemaforo
  mensaje: string
  autorizacion: ParkingAutorizacionBasica | null
  vehiculo: ParkingVehiculoBasico | null
  persona: PersonaBasicaParking | null
  cupo_asignado: ParkingCupoBasico | null
  ya_esta_dentro: boolean
  alertas: string[]
}

export interface RegistroAccesoResponse {
  acceso_id: number
  resultado: ResultadoVerificacion
  tipo_acceso: 'ENTRADA' | 'SALIDA'
  fecha_hora: string
  cupo: ParkingCupoBasico | null
  mensaje: string
}

export interface OcupacionSede {
  sede_id: number
  sede_nombre: string
  resumen: {
    total: number
    disponibles: number
    ocupados: number
    porcentaje: number
  }
  zonas: OcupacionZona[]
}

export interface OcupacionZona {
  id: number
  nombre: string
  total: number
  disponibles: number
  ocupados: number
  bloqueados: number
  porcentaje: number
  cupos?: CupoDetalle[]
}

export interface CupoDetalle {
  id: number
  numero: string
  estado: EstadoCupo
  tipo: TipoCupo
  placa_actual?: string
}

export interface DashboardParking {
  ocupacion_actual: { total: number; ocupados: number; disponibles: number; porcentaje: number }
  solicitudes_pendientes: number
  autorizaciones_activas: number
  autorizaciones_por_vencer: number
  documentos_por_vencer: number
  novedades_abiertas: number
  vehiculos_dentro: number
  accesos_hoy: { entradas: number; salidas: number }
  accesos_semana: { fecha: string; entradas: number; salidas: number }[]
  ocupacion_por_zona: { zona_id: number; nombre: string; total: number; ocupados: number; porcentaje: number }[]
  novedades_recientes: NovedadResumen[]
  solicitudes_en_revision: SolicitudResumen[]
}

export interface ParkingNovedad {
  id: number
  sede: SedeBasicaParking
  tipo_novedad: TipoNovedad
  descripcion: string
  placa: string | null
  estado: EstadoNovedad
  accion_tomada: string | null
  reportado_por: UsuarioBasicoParking
  asignado_a: UsuarioBasicoParking | null
  resuelto_por: UsuarioBasicoParking | null
  resuelta_en: string | null
  created_at: string
}

export type NovedadResumen = Pick<ParkingNovedad, 'id' | 'tipo_novedad' | 'placa' | 'estado' | 'created_at'> & { sede_nombre: string }

export interface ParkingExcepcion {
  id: number
  sede: SedeBasicaParking
  tipo_excepcion: TipoExcepcion
  alcance: AlcanceExcepcion
  placa: string | null
  nombre_persona: string | null
  motivo: string
  aprobador: UsuarioBasicoParking
  fecha_inicio: string
  fecha_fin: string
  horario_inicio: string | null
  horario_fin: string | null
  usos_permitidos: number | null
  usos_realizados: number
  activa: boolean
  created_at: string
}

export interface ParkingPoliticaSede {
  id: number
  sede_id: number
  max_vehiculos_por_persona: number
  requiere_soat: boolean
  requiere_tecnomecanica: boolean
  requiere_licencia: boolean
  dias_alerta_vencimiento_docs: number
  permite_vehiculo_reemplazo: boolean
  permite_entrada_unica_visitantes: boolean
  requiere_aprobacion_jefe: boolean
  horario_inicio_operacion: string
  horario_fin_operacion: string
  activa: boolean
}
```

---

## SERVICIO FRONTEND (`services/parking.service.ts`)

```typescript
import api from './api'
import type {
  SolicitudResumen, SolicitudDetalle, AutogestionData,
  VerificacionResultado, RegistroAccesoResponse,
  DashboardParking, OcupacionSede, ParkingNovedad,
  ParkingExcepcion, ParkingPoliticaSede
} from '@/types/parking'

const BASE = '/parking'

// ── Catálogos ────────────────────────────────────────────────
export const parkingCatalogos = {
  sedes: () => api.get(`${BASE}/catalogos/sedes`),
  tiposVehiculo: () => api.get(`${BASE}/catalogos/tipos-vehiculo`),
  tiposUsuario: () => api.get(`${BASE}/catalogos/tipos-usuario`),
  zonasPorSede: (sedeId: number) => api.get(`${BASE}/catalogos/zonas/${sedeId}`),
  politicaSede: (sedeId: number) => api.get(`${BASE}/catalogos/politicas/${sedeId}`),
}

// ── Dashboard ────────────────────────────────────────────────
export const parkingDashboard = {
  get: (sedeId: number) => api.get<DashboardParking>(`${BASE}/dashboard/${sedeId}`),
}

// ── Solicitudes ──────────────────────────────────────────────
export const parkingSolicitudes = {
  listar: (params: Record<string, unknown>) => api.get<SolicitudResumen[]>(`${BASE}/solicitudes`, { params }),
  detalle: (id: number) => api.get<SolicitudDetalle>(`${BASE}/solicitudes/${id}`),
  crear: (body: unknown) => api.post<SolicitudDetalle>(`${BASE}/solicitudes`, body),
  actualizar: (id: number, body: unknown) => api.put<SolicitudDetalle>(`${BASE}/solicitudes/${id}`, body),
  eliminar: (id: number) => api.delete(`${BASE}/solicitudes/${id}`),
  enviar: (id: number) => api.post(`${BASE}/solicitudes/${id}/enviar`),
  regenerarToken: (id: number, body: { duracion_horas: number }) => api.post(`${BASE}/solicitudes/${id}/token`, body),
  tomar: (id: number) => api.post(`${BASE}/solicitudes/${id}/tomar`),
  aprobar: (id: number, body: unknown) => api.post(`${BASE}/solicitudes/${id}/aprobar`, body),
  denegar: (id: number, body: { motivo_denegacion: string }) => api.post(`${BASE}/solicitudes/${id}/denegar`, body),
  solicitarCorreccion: (id: number, body: { observaciones: string }) => api.post(`${BASE}/solicitudes/${id}/solicitar-correccion`, body),
  suspender: (id: number, body: { motivo: string }) => api.post(`${BASE}/solicitudes/${id}/suspender`, body),
  revocar: (id: number, body: { motivo: string }) => api.post(`${BASE}/solicitudes/${id}/revocar`, body),
}

// ── Autogestión (público) ─────────────────────────────────────
export const parkingAutogestion = {
  obtener: (token: string) => api.get<AutogestionData>(`${BASE}/autogestion/${token}`),
  upload: (token: string, form: FormData) => api.post(`${BASE}/autogestion/${token}/upload`, form),
  guardarDatosPersonales: (token: string, body: unknown) => api.post(`${BASE}/autogestion/${token}/datos-personales`, body),
  guardarVehiculo: (token: string, body: unknown) => api.post(`${BASE}/autogestion/${token}/vehiculo`, body),
  confirmarDocumentos: (token: string) => api.post(`${BASE}/autogestion/${token}/documentos`, {}),
  guardarHorario: (token: string, body: unknown) => api.post(`${BASE}/autogestion/${token}/horario`, body),
  confirmarAceptacion: (token: string, body: { acepta_normas: boolean; acepta_tratamiento_datos: boolean }) =>
    api.post(`${BASE}/autogestion/${token}/aceptacion`, body),
}

// ── Vigilante ─────────────────────────────────────────────────
export const parkingVigilante = {
  verificar: (body: { sede_id: number; placa: string; tipo_busqueda: string }) =>
    api.post<VerificacionResultado>(`${BASE}/vigilante/verificar`, body),
  registrarEntrada: (body: unknown) => api.post<RegistroAccesoResponse>(`${BASE}/vigilante/entrada`, body),
  registrarSalida: (body: unknown) => api.post<RegistroAccesoResponse>(`${BASE}/vigilante/salida`, body),
  dentroAhora: (sedeId: number) => api.get(`${BASE}/vigilante/dentro/${sedeId}`),
  ocupacion: (sedeId: number) => api.get(`${BASE}/vigilante/ocupacion/${sedeId}`),
}

// ── Ocupación ─────────────────────────────────────────────────
export const parkingOcupacion = {
  sede: (sedeId: number) => api.get<OcupacionSede>(`${BASE}/ocupacion/${sedeId}`),
}

// ── Autorizaciones ────────────────────────────────────────────
export const parkingAutorizaciones = {
  listar: (params: Record<string, unknown>) => api.get(`${BASE}/autorizaciones`, { params }),
  detalle: (id: number) => api.get(`${BASE}/autorizaciones/${id}`),
  asignarCupo: (id: number, body: { cupo_id: number | null }) => api.patch(`${BASE}/autorizaciones/${id}/cupo`, body),
  suspender: (id: number, body: { motivo: string }) => api.post(`${BASE}/autorizaciones/${id}/suspender`, body),
  reactivar: (id: number, body: { motivo: string }) => api.post(`${BASE}/autorizaciones/${id}/reactivar`, body),
  revocar: (id: number, body: { motivo: string }) => api.post(`${BASE}/autorizaciones/${id}/revocar`, body),
}

// ── Cupos y Zonas ─────────────────────────────────────────────
export const parkingZonas = {
  listar: (params: Record<string, unknown>) => api.get(`${BASE}/zonas`, { params }),
  detalle: (id: number) => api.get(`${BASE}/zonas/${id}`),
  crear: (body: unknown) => api.post(`${BASE}/zonas`, body),
  actualizar: (id: number, body: unknown) => api.put(`${BASE}/zonas/${id}`, body),
}

export const parkingCupos = {
  listar: (params: Record<string, unknown>) => api.get(`${BASE}/cupos`, { params }),
  crear: (body: unknown) => api.post(`${BASE}/cupos`, body),
  actualizar: (id: number, body: unknown) => api.put(`${BASE}/cupos/${id}`, body),
  cambiarEstado: (id: number, body: { estado: string; observacion?: string }) =>
    api.patch(`${BASE}/cupos/${id}/estado`, body),
}

// ── Novedades ─────────────────────────────────────────────────
export const parkingNovedades = {
  listar: (params: Record<string, unknown>) => api.get<ParkingNovedad[]>(`${BASE}/novedades`, { params }),
  detalle: (id: number) => api.get<ParkingNovedad>(`${BASE}/novedades/${id}`),
  crear: (body: unknown) => api.post<ParkingNovedad>(`${BASE}/novedades`, body),
  actualizar: (id: number, body: unknown) => api.put(`${BASE}/novedades/${id}`, body),
  escalar: (id: number, body: { observacion: string }) => api.post(`${BASE}/novedades/${id}/escalar`, body),
  cerrar: (id: number, body: { observacion_resolucion: string }) => api.post(`${BASE}/novedades/${id}/cerrar`, body),
  anular: (id: number, body: { observacion: string }) => api.post(`${BASE}/novedades/${id}/anular`, body),
}

// ── Excepciones ───────────────────────────────────────────────
export const parkingExcepciones = {
  listar: (params: Record<string, unknown>) => api.get<ParkingExcepcion[]>(`${BASE}/excepciones`, { params }),
  detalle: (id: number) => api.get<ParkingExcepcion>(`${BASE}/excepciones/${id}`),
  crear: (body: unknown) => api.post<ParkingExcepcion>(`${BASE}/excepciones`, body),
  crearLote: (body: unknown) => api.post(`${BASE}/excepciones/lote`, body),
  actualizar: (id: number, body: unknown) => api.put(`${BASE}/excepciones/${id}`, body),
  activar: (id: number) => api.post(`${BASE}/excepciones/${id}/activar`),
  desactivar: (id: number) => api.post(`${BASE}/excepciones/${id}/desactivar`),
  anular: (id: number, body: { motivo: string }) => api.post(`${BASE}/excepciones/${id}/anular`, body),
}

// ── Accesos ───────────────────────────────────────────────────
export const parkingAccesos = {
  listar: (params: Record<string, unknown>) => api.get(`${BASE}/accesos`, { params }),
  porVehiculo: (placa: string, params: Record<string, unknown>) => api.get(`${BASE}/accesos/vehiculo/${placa}`, { params }),
}

// ── Reportes ──────────────────────────────────────────────────
export const parkingReportes = {
  accesos: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/accesos`, { params }),
  ocupacion: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/ocupacion`, { params }),
  autorizaciones: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/autorizaciones`, { params }),
  vencimientos: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/vencimientos`, { params }),
  novedades: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/novedades`, { params }),
  vehiculos: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/vehiculos`, { params }),
  excepciones: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/excepciones`, { params }),
  charts: (params: Record<string, unknown>) => api.get(`${BASE}/reportes/charts`, { params }),
}

// ── Configuración ─────────────────────────────────────────────
export const parkingConfiguracion = {
  get: (sedeId: number) => api.get<ParkingPoliticaSede>(`${BASE}/configuracion/${sedeId}`),
  update: (sedeId: number, body: Partial<ParkingPoliticaSede>) => api.put(`${BASE}/configuracion/${sedeId}`, body),
  inicializar: (sedeId: number) => api.post(`${BASE}/configuracion/${sedeId}/inicializar`),
}
```

---

*Este contrato es la fuente de verdad entre backend y frontend. Cualquier cambio en un endpoint debe reflejarse aquí primero.*
