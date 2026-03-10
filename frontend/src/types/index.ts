/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Tipos TypeScript globales del sistema.
 *
 * Alineados 100% con el contrato de API del backend.
 * Todos los módulos importan sus tipos desde aquí.
 *
 * Organización:
 *   1. Envelopes de API (respuestas estándar)
 *   2. Auth
 *   3. Comunes — tipos compartidos entre módulos
 *   4. Catálogos
 *   5. Personas y Empresas
 *   6. Parking
 *   7. HSE
 *   8. Activos NFC
 *   9. Gestión Humana
 *  10. UI / Estado local
 */

// ═══════════════════════════════════════════════════════════════════
// 1. ENVELOPES DE API
// ═══════════════════════════════════════════════════════════════════

/** Respuesta exitosa estándar del backend */
export interface ApiResponse<T> {
  success: true
  data: T
  message?: string
}

/** Respuesta de error estándar del backend */
export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/** Respuesta paginada estándar */
export interface PaginatedResponse<T> {
  success: true
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

/** Parámetros de paginación para requests */
export interface PaginationParams {
  page?: number
  per_page?: number
}

// ═══════════════════════════════════════════════════════════════════
// 2. AUTH
// ═══════════════════════════════════════════════════════════════════

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  usuario: UsuarioMe
}

export interface RefreshRequest {
  refresh_token: string
}

export interface UsuarioMe {
  id: number
  email: string
  nombre_completo: string
  activo: boolean
  primer_login: boolean
  roles: RolUsuario[]
  sede_activa?: SedeBasica
  avatar_url?: string
  created_at: string
}

export interface RolUsuario {
  id: number
  rol: Rol
  sede_id?: number
}

export interface Rol {
  id: number
  nombre: RolNombre
  descripcion: string
}

/** Roles del sistema — alineados con los definidos en el seeder */
export type RolNombre =
  | 'ADMIN_GLOBAL'
  | 'ADMIN_PARKING'
  | 'ADMIN_HSE'
  | 'COORD_HSE'
  | 'ADMIN_NFC'
  | 'ADMIN_GH'
  | 'VIGILANTE'
  | 'VISUALIZADOR'

export interface ChangePasswordRequest {
  password_actual: string
  password_nuevo: string
  password_confirmacion: string
}

// ═══════════════════════════════════════════════════════════════════
// 3. COMUNES — tipos compartidos entre módulos
// ═══════════════════════════════════════════════════════════════════

/** Dirección del movimiento, compartido por Accesos, Parking y NFC */
export type TipoAcceso   = 'ENTRADA' | 'SALIDA'

/** Método de identificación, compartido por Accesos y HSE */
export type MetodoAcceso = 'MANUAL' | 'QR' | 'NFC' | 'FACIAL'

// ═══════════════════════════════════════════════════════════════════
// 4. CATÁLOGOS
// ═══════════════════════════════════════════════════════════════════

export interface SedeBasica {
  id: number
  nombre: string
  ciudad: string
}

export interface Sede {
  id: number
  nombre: string
  ciudad: string
  direccion: string
  activa: boolean
  created_at: string
}

export interface Ubicacion {
  id: number
  nombre: string
  sede_id: number
  descripcion?: string
}

export interface Tipologia {
  id: number
  nombre: string
  descripcion?: string
}

export interface TipoDocumento {
  id: number
  nombre: string
  abreviatura: string
}

export interface EPS {
  id: number
  nombre: string
  activa: boolean
}

export interface ARL {
  id: number
  nombre: string
  activa: boolean
}

// ═══════════════════════════════════════════════════════════════════
// 5. PERSONAS Y EMPRESAS
// ═══════════════════════════════════════════════════════════════════

export type EstadoPersona = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO'

export interface Persona {
  id: number
  tipo_documento_id: number
  tipo_documento: TipoDocumento
  numero_documento: string
  nombres: string
  apellidos: string
  nombre_completo: string
  email?: string
  telefono?: string
  ciudad_residencia?: string
  direccion_residencia?: string
  empresa_id?: number
  empresa?: EmpresaBasica
  tipologia_id: number
  tipologia: Tipologia
  foto_url?: string
  estado: EstadoPersona
  created_at: string
  updated_at: string
}

export interface EmpresaBasica {
  id: number
  razon_social: string
  nit: string
}

export interface Empresa {
  id: number
  razon_social: string
  nit: string
  email?: string
  telefono?: string
  activa: boolean
  created_at: string
}

export interface PersonaCreateRequest {
  tipo_documento_id: number
  numero_documento: string
  nombres: string
  apellidos: string
  email?: string
  telefono?: string
  ciudad_residencia?: string
  direccion_residencia?: string
  empresa_id?: number
  tipologia_id: number
  foto_url?: string
}

export interface PersonaUpdateRequest extends Partial<PersonaCreateRequest> {}

// ═══════════════════════════════════════════════════════════════════
// 6. PARKING
// ═══════════════════════════════════════════════════════════════════

export type EstadoSolicitudParking =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'AUTOGESTION_PENDIENTE'
  | 'ACTIVA'
  | 'VENCIDA'
  | 'CANCELADA'

export type TipoVehiculo   = 'CARRO' | 'MOTO' | 'BICICLETA' | 'OTRO'
export type EstadoVehiculo = 'DENTRO' | 'FUERA'

export interface ParkingSolicitud {
  id: number
  codigo: string             // Código único en Space Mono: PKG-2026-0001
  persona_id: number
  persona: Persona
  sede_id: number
  sede: SedeBasica
  estado: EstadoSolicitudParking
  tipo_vehiculo: TipoVehiculo
  vehiculos: ParkingVehiculo[]
  fecha_inicio: string
  fecha_fin: string
  autogestion_token?: string
  autogestion_completada_en?: string
  aprobada_por_id?: number
  observaciones?: string
  created_at: string
  updated_at: string
}

export interface ParkingVehiculo {
  id: number
  placa: string              // Formato colombiano: ABC123 o ABC12E
  tipo: TipoVehiculo
  marca?: string
  modelo?: string
  color?: string
  foto_url?: string
  estado: EstadoVehiculo
}

export interface ParkingCapacidad {
  sede_id: number
  carros_total: number
  carros_ocupados: number
  motos_total: number
  motos_ocupados: number
  bicicletas_total: number
  bicicletas_ocupadas: number
  hora_apertura: string
  hora_cierre: string
}

export interface PicoPlacaConfig {
  id: number
  sede_id: number
  dia_semana: number         // 0=Domingo, 1=Lunes... 6=Sábado
  digitos_restringidos: string[] // ['1','2'] para placas que terminan en 1 o 2
  hora_inicio: string
  hora_fin: string
  activo: boolean
}

/** Resultado de verificar pico y placa en tiempo real */
export interface PicoPlacaResult {
  placa: string
  tiene_restriccion: boolean
  motivo?: string
  hora_inicio?: string
  hora_fin?: string
  digitos_restringidos?: string[]
}

export interface LPREvento {
  id: number
  placa: string
  sede_id: number
  tipo: TipoAcceso
  foto_url?: string
  confianza: number           // 0-100 — score de la cámara LPR
  vehiculo_reconocido: boolean
  solicitud_id?: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════
// 7. HSE
// ═══════════════════════════════════════════════════════════════════

export type EstadoAcceso = 'AUTORIZADO' | 'DENEGADO' | 'PENDIENTE'

/** Resultado del escaneo en tiempo real — vigilante verificando una autorización HSE */
export interface AccesoScanResult {
  persona: Persona
  estado: EstadoAcceso
  mensaje: string
  color: 'green' | 'amber' | 'red' | 'gray'
  dentro_actualmente: boolean
  ultima_entrada?: string
  alertas: string[]
}

export type EstadoAutorizacionHSE =
  | 'CREADA'
  | 'AUTOGESTION_PENDIENTE'
  | 'DOCUMENTOS_COMPLETOS'
  | 'EN_REVISION'
  | 'AUTORIZADA'
  | 'RECHAZADA'
  | 'ACTIVA'
  | 'VENCIDA'
  | 'SUSPENDIDA'
  | 'CANCELADA'

export type ConceptoExamenMedico =
  | 'APTO'
  | 'APTO_RESTRICCION'
  | 'NO_APTO'
  | 'PENDIENTE'

export type TipoPlanillaPILA =
  | 'PLANILLA_INTEGRADA'
  | 'PLANILLA_MANUAL'
  | 'NO_APLICA'

export interface ActividadHSE {
  id: number
  nombre: string
  descripcion?: string
  // Flags que determinan qué documentos se solicitan
  requiere_cert_alturas:    boolean
  requiere_cert_espacios:   boolean
  requiere_permiso_fuego:   boolean
  requiere_seguridad_social: boolean
  requiere_cert_contect:    boolean
  requiere_art:             boolean
  requiere_sst:             boolean
  otras_cert?:              string  // Nombre libre de cert adicional
  activa: boolean
}

export interface AutorizacionHSE {
  id: number
  codigo: string              // HSE-2026-0001
  persona_id: number
  persona: Persona
  empresa_id?: number
  empresa?: EmpresaBasica
  sede_id: number
  sede: SedeBasica
  actividad_id: number
  actividad: ActividadHSE
  estado: EstadoAutorizacionHSE
  fecha_inicio: string
  fecha_fin: string

  // Autogestión
  autogestion_token?: string
  autogestion_completada_en?: string

  // Seguridad social
  eps_id?: number
  eps?: EPS
  eps_vigencia?: string
  arl_id?: number
  arl?: ARL
  arl_vigencia?: string
  afp_nombre?: string
  afp_vigencia?: string

  // Planilla PILA
  planilla_tipo?: TipoPlanillaPILA
  planilla_archivo_url?: string
  planilla_hash?: string       // SHA-256 para integridad
  planilla_estado?: 'VIGENTE' | 'VENCIDA' | 'PENDIENTE'
  planilla_validada_por_id?: number

  // SST
  sst_requerido: boolean
  sst_tiene_vigente?: boolean
  sst_responsable_nombre?: string
  sst_responsable_contacto?: string

  // Examen médico
  examen_medico_fecha?: string
  examen_medico_concepto?: ConceptoExamenMedico
  examen_medico_restriccion?: string
  examen_medico_archivo_url?: string

  // Contacto de emergencia
  emergencia_nombre?: string
  emergencia_relacion?: string
  emergencia_telefono?: string
  emergencia_telefono_fijo?: string

  // Firma digital
  firma_normas?: string        // Nombre completo como confirmación
  normas_aceptadas_en?: string

  // Certificaciones (archivos)
  certificaciones: HseCertificacion[]

  // Historial de estados
  historial: HseHistorialEstado[]

  created_at: string
  updated_at: string
}

export interface HseCertificacion {
  id: number
  autorizacion_id: number
  tipo: 'ALTURAS' | 'ESPACIOS_CONFINADOS' | 'TRABAJO_CALIENTE' | 'CONTECT' | 'ART' | 'OTRA'
  nombre_cert?: string         // Para tipo = 'OTRA'
  fecha_vencimiento?: string
  archivo_url: string
  hash: string
  // Solo para cert de alturas
  nivel_alturas?: 'BASICO' | 'AVANZADO' | 'COORDINADOR'
  // Solo para ART
  art_tiene_diligenciado?: boolean
  art_descripcion?: string
}

export interface HseHistorialEstado {
  id: number
  autorizacion_id: number
  estado_anterior?: EstadoAutorizacionHSE
  estado_nuevo: EstadoAutorizacionHSE
  motivo?: string
  usuario_id: number
  usuario_nombre: string
  created_at: string
}

export interface HseAcceso {
  id: number
  autorizacion_id: number
  autorizacion: AutorizacionHSE
  sede_id: number
  tipo: TipoAcceso
  registrado_por_id: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════
// 8. ACTIVOS NFC
// ═══════════════════════════════════════════════════════════════════

export type EstadoActivo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_MANTENIMIENTO'
  | 'BAJA'
  | 'PERDIDO'

export interface CategoriaActivo {
  id: number
  nombre: string
  descripcion?: string
  icono?: string
}

export interface Activo {
  id: number
  codigo: string              // ACT-2026-0001
  nfc_uid: string             // UID del chip — Space Mono
  nombre: string
  descripcion?: string
  categoria_id: number
  categoria: CategoriaActivo
  sede_id: number
  sede: SedeBasica
  estado: EstadoActivo
  asignacion_actual?: ActivoAsignacion
  foto_url?: string
  valor_compra?: number
  fecha_compra?: string
  created_at: string
  updated_at: string
}

export interface ActivoAsignacion {
  id: number
  activo_id: number
  persona_id: number
  persona: Persona
  fecha_asignacion: string
  fecha_devolucion?: string
  activa: boolean
  observaciones?: string
}

export interface NFCEvento {
  id: number
  nfc_uid: string
  activo_id?: number
  activo?: Activo
  sede_id: number
  tipo: 'LECTURA' | 'ASIGNACION' | 'DEVOLUCION' | 'ALERTA'
  registrado_por_id?: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════
// 9. GESTIÓN HUMANA
// ═══════════════════════════════════════════════════════════════════

export type EstadoCita =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_CURSO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'NO_PRESENTADO'

export interface GHCita {
  id: number
  codigo: string              // GH-2026-0001
  persona_id: number
  persona: Persona
  sede_id: number
  sede: SedeBasica
  fecha_hora: string
  duracion_minutos: number
  estado: EstadoCita
  motivo: string
  observaciones?: string
  atendida_por_id?: number
  midassoft_id?: string       // ID de integración con Midassoft
  created_at: string
}

export interface GHImportacion {
  id: number
  archivo_nombre: string
  total_registros: number
  procesados: number
  errores: number
  estado: 'PROCESANDO' | 'COMPLETADO' | 'CON_ERRORES' | 'FALLIDO'
  usuario_id: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════════
// 10. UI / ESTADO LOCAL
// ═══════════════════════════════════════════════════════════════════

/** Estados del WebSocket */
export type WSStatus = 'CONECTADO' | 'DESCONECTADO' | 'RECONECTANDO' | 'ERROR'

/** Mensaje WebSocket del backend */
export interface WSMessage {
  type: WSMessageType
  payload: unknown
  sede_id?: number
  timestamp: string
}

export type WSMessageType =
  | 'ACCESO_REGISTRADO'
  | 'PARKING_ENTRADA'
  | 'PARKING_SALIDA'
  | 'LPR_EVENTO'
  | 'HSE_ALERTA'
  | 'NFC_LECTURA'
  | 'CAPACIDAD_UPDATE'
  | 'PING'
  | 'PONG'

/** Item del sidebar de navegación */
export interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  roles: RolNombre[]
  badge?: number
  children?: NavItem[]
}

/** Toast notification */
export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

/** Estado de un filtro genérico */
export interface FilterState {
  search: string
  page: number
  per_page: number
  [key: string]: unknown
}

/** Columna de tabla genérica */
export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: unknown, row: T) => React.ReactNode
}