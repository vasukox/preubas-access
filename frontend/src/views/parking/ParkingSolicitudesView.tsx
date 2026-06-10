import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, Search, X, Car, User, FileText, CheckCircle2,
  XCircle, Clock, RefreshCw, AlertTriangle, Copy,
  ChevronLeft, ChevronRight, Loader2, Calendar,
  Check, Ban, Send, Eye, ChevronDown,
  ShieldCheck, ExternalLink, Building2,
} from 'lucide-react'
import { useAuthStore, useSedeStore } from '@/store'
import { parkingService } from '@/services/parking.service'
import { getErrorMessage } from '@/services/api'
import type {
  EstadoSolicitudParkingFull,
  TipoVehiculoParkingFull,
  TipoUsuarioParkingFull,
  TipoAutorizacionParkingFull,
  SolicitudDetalle,
  AprobarPayload,
  CreateSolicitudPayload,
  EnviarTokenResult,
} from '@/services/parking.service'

// ── Query key factory ─────────────────────────────────────────────

const SK = {
  all:    ['parking', 'solicitudes'] as const,
  list:   (p: Record<string, unknown>) => [...SK.all, 'list', p] as const,
  detail: (id: number) => [...SK.all, 'detail', id] as const,
}

// ── Estado config ─────────────────────────────────────────────────

const ESTADO: Record<EstadoSolicitudParkingFull, { label: string; color: string; bg: string }> = {
  BORRADOR:                { label: 'Borrador',             color: 'var(--text-muted)',  bg: 'var(--bg-elevated)' },
  PENDIENTE_AUTOGESTION:   { label: 'Pend. autogestión',    color: '#D97706',            bg: 'rgba(217,119,6,.1)' },
  AUTOGESTION_EN_PROGRESO: { label: 'Autogestión en curso', color: 'var(--info-400)',    bg: 'rgba(59,130,246,.1)' },
  AUTOGESTION_COMPLETADA:  { label: 'Autogestión completa', color: '#0EA5E9',            bg: 'rgba(14,165,233,.1)' },
  EN_REVISION:             { label: 'En revisión',          color: '#8B5CF6',            bg: 'rgba(139,92,246,.1)' },
  APROBADO:                { label: 'Aprobado',             color: 'var(--success-400)', bg: 'rgba(22,163,74,.1)' },
  DENEGADO:                { label: 'Denegado',             color: 'var(--danger-400)',  bg: 'rgba(220,38,38,.1)' },
  VENCIDO:                 { label: 'Vencido',              color: '#6B7280',            bg: 'rgba(107,114,128,.1)' },
  SUSPENDIDO:              { label: 'Suspendido',           color: '#F59E0B',            bg: 'rgba(245,158,11,.1)' },
  REVOCADO:                { label: 'Revocado',             color: '#EF4444',            bg: 'rgba(239,68,68,.1)' },
}

const TIPO_VEHICULO_LABEL: Record<TipoVehiculoParkingFull, string> = {
  CARRO: 'Carro', MOTO: 'Moto', BICICLETA: 'Bicicleta',
  CAMION: 'Camión', VAN: 'Van', TAXI_AUTORIZADO: 'Taxi aut.', ELECTRICO: 'Eléctrico',
}

const TIPO_USUARIO_LABEL: Record<TipoUsuarioParkingFull, string> = {
  COLABORADOR: 'Colaborador', DIRECTIVO: 'Directivo',
  VISITANTE_RECURRENTE: 'Visitante rec.', PROVEEDOR: 'Proveedor',
  CONTRATISTA: 'Contratista', TRANSPORTE: 'Transporte',
  MENSAJERIA: 'Mensajería', TEMPORAL: 'Temporal',
}

const TIPO_AUTORIZACION_LABEL: Record<TipoAutorizacionParkingFull, string> = {
  SIN_CUPO_FIJO: 'Sin cupo fijo', CON_CUPO_FIJO: 'Con cupo fijo',
  POR_HORARIO: 'Por horario', DIAS_ESPECIFICOS: 'Días específicos',
  TEMPORAL: 'Temporal', INGRESO_SIN_PERMANENCIA: 'Ingreso s/ permanencia',
  POR_EXCEPCION: 'Por excepción',
}

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO']
const DIAS_LABEL: Record<string, string> = {
  LUNES:'L', MARTES:'M', MIERCOLES:'X', JUEVES:'J',
  VIERNES:'V', SABADO:'S', DOMINGO:'D',
}

const DOC_LABEL: Record<string, string> = {
  TARJETA_PROPIEDAD: 'Tarjeta propiedad',
  LICENCIA_CONDUCCION: 'Licencia conducción',
  SOAT: 'SOAT',
  TECNOMECANICA: 'Tecnomecánica',
  OTRO: 'Otro',
}

const DOC_ESTADO_COLOR: Record<string, string> = {
  VIGENTE: 'var(--success-400)',
  POR_VENCER: '#F59E0B',
  VENCIDO: 'var(--danger-400)',
  PENDIENTE: 'var(--text-muted)',
}

// ── Helpers ───────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatFechaCorta(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short',
  })
}

function formatTs(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function normPlaca(v: string): string {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

type SolicitudAccion = 'enviar' | 'tomar' | 'token' | 'aprobar' | 'denegar' | 'correccion' | 'suspender' | 'revocar' | 'eliminar'

function getAcciones(estado: EstadoSolicitudParkingFull): SolicitudAccion[] {
  switch (estado) {
    case 'BORRADOR':                return ['enviar', 'eliminar']
    case 'PENDIENTE_AUTOGESTION':   return ['token', 'tomar']
    case 'AUTOGESTION_EN_PROGRESO': return ['token', 'tomar']
    case 'AUTOGESTION_COMPLETADA':  return ['tomar']
    case 'EN_REVISION':             return ['aprobar', 'denegar', 'correccion', 'suspender']
    case 'APROBADO':                return ['suspender', 'revocar']
    case 'SUSPENDIDO':              return ['revocar']
    default:                        return []
  }
}

function useDebounce<T>(value: T, ms = 350): T {
  const [deb, setDeb] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return deb
}

// ── Sub-components ────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: EstadoSolicitudParkingFull }) {
  const c = ESTADO[estado] ?? ESTADO.BORRADOR
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20,
      fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap',
      color: c.color, background: c.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function Sk({ w = '60%', h = '12px' }: { w?: string; h?: string }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: 4 }} />
}

function SkRow() {
  return (
    <tr>
      {[140, 180, 100, 120, 90, 90].map((w, i) => (
        <td key={i} style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Sk w={`${w}px`} />
        </td>
      ))}
      <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <Sk w="60px" />
      </td>
    </tr>
  )
}

function EmptyState({ search, onNew }: { search: boolean; onNew: () => void }) {
  return (
    <tr>
      <td colSpan={7} style={{ padding: '64px 24px', textAlign: 'center' }}>
        <Car size={40} style={{ color: 'var(--text-disabled)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
          {search ? 'No se encontraron solicitudes con esos filtros' : 'No hay solicitudes aún'}
        </p>
        {!search && (
          <button onClick={onNew} style={{
            padding: '8px 18px', background: 'var(--primary-500)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            fontSize: '0.82rem', fontWeight: 500, marginTop: 8,
          }}>
            Crear primera solicitud
          </button>
        )}
      </td>
    </tr>
  )
}

function SelectFilter({
  value, onChange, placeholder, options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', padding: '7px 32px 7px 12px',
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor: 'pointer', minWidth: 160,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-muted)', pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Modal base ────────────────────────────────────────────────────

function ModalBase({
  title, onClose, children, maxW = 480,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxW?: number
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div
      role="dialog" aria-modal="true" aria-label={title}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.55)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 20,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: maxW,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        border: '1px solid var(--border-subtle)',
        animation: 'slideUp .18s ease',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)',
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6,
              transition: 'color .15s, background .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Modal: Token result ───────────────────────────────────────────

function ModalToken({ result, onClose }: { result: EnviarTokenResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const fullLink = useMemo(() => {
    const base = `${window.location.origin}${import.meta.env.BASE_URL}`.replace(/\/$/, '')
    return `${base}/portal/parking/${result.token_autogestion}`
  }, [result.token_autogestion])

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(fullLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fullLink])

  const expira = new Date(result.token_expira_en)
  const horasRestantes = Math.max(0, Math.floor((expira.getTime() - Date.now()) / 3600000))

  return (
    <ModalBase title="Link de autogestión" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'rgba(22,163,74,.07)', border: '1px solid rgba(22,163,74,.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <CheckCircle2 size={18} style={{ color: 'var(--success-400)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Link enviado. Expira en <strong style={{ color: 'var(--text-primary)' }}>{horasRestantes}h</strong>
          </span>
        </div>
        <div>
          <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
            URL de autogestión
          </label>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
            padding: '10px 12px', border: '1px solid var(--border-subtle)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              color: 'var(--text-secondary)', flex: 1, overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}>
              {fullLink}
            </span>
            <button
              onClick={copyLink}
              aria-label="Copiar enlace"
              style={{
                background: copied ? 'rgba(22,163,74,.1)' : 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 6, cursor: 'pointer', padding: '4px 8px',
                display: 'flex', alignItems: 'center', gap: 4,
                color: copied ? 'var(--success-400)' : 'var(--text-secondary)',
                fontSize: '0.72rem', transition: 'all .2s',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', background: 'var(--primary-500)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              fontSize: '0.84rem', fontWeight: 500,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Modal: Aprobar ────────────────────────────────────────────────

function ModalAprobar({
  onClose, onConfirm, loading,
}: {
  onClose: () => void
  onConfirm: (p: AprobarPayload) => void
  loading: boolean
}) {
  const [tipoAutorizacion, setTipoAutorizacion] = useState<TipoAutorizacionParkingFull>('SIN_CUPO_FIJO')
  const [horaInicio, setHoraInicio] = useState('07:00')
  const [horaFin, setHoraFin] = useState('19:00')
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>(['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES'])
  const [observaciones, setObservaciones] = useState('')

  const toggleDia = (dia: string) => {
    setDiasSeleccionados(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  const handleSubmit = () => {
    onConfirm({
      tipo_autorizacion: tipoAutorizacion,
      dias_permitidos: diasSeleccionados.length ? diasSeleccionados : undefined,
      horario_inicio: horaInicio || undefined,
      horario_fin: horaFin || undefined,
      observaciones: observaciones.trim() || undefined,
    })
  }

  return (
    <ModalBase title="Aprobar solicitud" onClose={onClose} maxW={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Tipo de autorización</label>
          <select
            value={tipoAutorizacion}
            onChange={e => setTipoAutorizacion(e.target.value as TipoAutorizacionParkingFull)}
            style={inputStyle}
          >
            {(Object.keys(TIPO_AUTORIZACION_LABEL) as TipoAutorizacionParkingFull[]).map(k => (
              <option key={k} value={k}>{TIPO_AUTORIZACION_LABEL[k]}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Días permitidos</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DIAS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDia(d)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: '1px solid',
                  borderColor: diasSeleccionados.includes(d) ? 'var(--primary-500)' : 'var(--border-default)',
                  background: diasSeleccionados.includes(d) ? 'var(--primary-500)' : 'transparent',
                  color: diasSeleccionados.includes(d) ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
                  transition: 'all .15s',
                }}
              >
                {DIAS_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Horario entrada</label>
            <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Horario salida</label>
            <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Observaciones (opcional)</label>
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            rows={2}
            placeholder="Condiciones especiales, notas..."
            style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} style={btnSecondary} disabled={loading}>Cancelar</button>
          <button onClick={handleSubmit} style={btnPrimary('#16A34A')} disabled={loading}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={14} />}
            Aprobar
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Modal: Texto libre (denegar / correccion / suspender / revocar) ─

function ModalTexto({
  title, label, placeholder, confirmLabel, confirmColor,
  onClose, onConfirm, loading, minLen = 10,
}: {
  title: string; label: string; placeholder: string
  confirmLabel: string; confirmColor: string
  onClose: () => void
  onConfirm: (texto: string) => void
  loading: boolean; minLen?: number
}) {
  const [texto, setTexto] = useState('')
  const invalid = texto.trim().length < minLen

  return (
    <ModalBase title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{label}</label>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder={placeholder}
            rows={3}
            autoFocus
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          />
          {texto.length > 0 && invalid && (
            <p style={{ fontSize: '0.72rem', color: 'var(--danger-400)', marginTop: 4 }}>
              Mínimo {minLen} caracteres
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSecondary} disabled={loading}>Cancelar</button>
          <button
            onClick={() => onConfirm(texto.trim())}
            style={btnPrimary(confirmColor)}
            disabled={loading || invalid}
          >
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ── Modal: Registrar rápido (admin ingresa datos mínimos) ─────────

const VEHICULOS: TipoVehiculoParkingFull[] = ['CARRO','MOTO','BICICLETA','CAMION','VAN','TAXI_AUTORIZADO','ELECTRICO']
const USUARIOS: TipoUsuarioParkingFull[]   = ['COLABORADOR','DIRECTIVO','VISITANTE_RECURRENTE','PROVEEDOR','CONTRATISTA','TRANSPORTE','MENSAJERIA','TEMPORAL']

function ModalRegistrarRapido({
  sedeId, onClose, onCreated, onToken,
}: {
  sedeId: number
  onClose: () => void
  onCreated: () => void
  onToken: (result: EnviarTokenResult) => void
}) {
  // Auto-fill dates: today → today + 1 year
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const nextYear = useMemo(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10)
  }, [])

  const [form, setForm] = useState({
    tipo_usuario:       'COLABORADOR' as TipoUsuarioParkingFull,
    tipo_vehiculo:      'CARRO' as TipoVehiculoParkingFull,
    placa:              '',
    solicitante_nombre: '',
    solicitante_cedula: '',
  })
  const [autoEnviar, setAutoEnviar] = useState(true)
  const [touched, setTouched] = useState(false)
  const qc = useQueryClient()

  const err = useMemo(() => {
    if (!touched) return { placa: '' }
    return {
      placa: form.placa.length < 6 ? 'Mínimo 6 caracteres' : '',
    }
  }, [form, touched])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const mut = useMutation({
    mutationFn: async () => {
      const solicitud = await parkingService.createSolicitud({
        sede_id:            sedeId,
        tipo_usuario:       form.tipo_usuario,
        tipo_vehiculo:      form.tipo_vehiculo,
        placa:              form.placa,
        solicitante_nombre: form.solicitante_nombre.trim() || undefined,
        solicitante_cedula: form.solicitante_cedula.trim() || undefined,
        fecha_inicio:       today,
        fecha_fin:          nextYear,
      })
      if (autoEnviar) {
        const token = await parkingService.enviarSolicitud(solicitud.id)
        return { token }
      }
      return { token: null }
    },
    onSuccess: ({ token }) => {
      qc.invalidateQueries({ queryKey: SK.all })
      if (token) {
        toast.success('Solicitud creada — link de autogestión listo')
        onToken(token)
      } else {
        toast.success('Solicitud creada como borrador')
        onCreated()
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const handleSubmit = () => {
    setTouched(true)
    if (form.placa.length < 6) return
    mut.mutate()
  }

  return (
    <ModalBase title="Registrar solicitud de parking" onClose={onClose} maxW={520}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Info: flujo de autogestión */}
        <div style={{
          background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.18)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <ExternalLink size={15} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Ingresa los datos básicos. La persona completará vehículo, horario y documentos a través del <strong>link de autogestión</strong>.
          </p>
        </div>

        {/* Tipo usuario + tipo vehículo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Tipo de usuario</label>
            <select value={form.tipo_usuario} onChange={e => set('tipo_usuario', e.target.value as TipoUsuarioParkingFull)} style={inputStyle}>
              {USUARIOS.map(u => <option key={u} value={u}>{TIPO_USUARIO_LABEL[u]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tipo de vehículo</label>
            <select value={form.tipo_vehiculo} onChange={e => set('tipo_vehiculo', e.target.value as TipoVehiculoParkingFull)} style={inputStyle}>
              {VEHICULOS.map(v => <option key={v} value={v}>{TIPO_VEHICULO_LABEL[v]}</option>)}
            </select>
          </div>
        </div>

        {/* Placa */}
        <div>
          <label style={labelStyle}>Placa del vehículo *</label>
          <input
            value={form.placa}
            onChange={e => set('placa', normPlaca(e.target.value))}
            placeholder="ABC123"
            maxLength={8}
            style={{
              ...inputStyle,
              fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', fontSize: '1rem',
              textTransform: 'uppercase',
              borderColor: err.placa ? 'var(--danger-400)' : undefined,
            }}
          />
          {err.placa && <ErrMsg>{err.placa}</ErrMsg>}
        </div>

        {/* Nombre + cédula */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre del solicitante</label>
            <input value={form.solicitante_nombre} onChange={e => set('solicitante_nombre', e.target.value)}
              placeholder="Nombre completo" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Cédula</label>
            <input value={form.solicitante_cedula}
              onChange={e => set('solicitante_cedula', e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890" style={inputStyle} />
          </div>
        </div>

        {/* Toggle enviar link */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setAutoEnviar(p => !p)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setAutoEnviar(p => !p) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            background: autoEnviar ? 'rgba(22,163,74,.05)' : 'var(--bg-elevated)',
            border: `1px solid ${autoEnviar ? 'rgba(22,163,74,.25)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Enviar link de autogestión
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {autoEnviar ? 'La persona recibirá un link para completar sus datos' : 'La solicitud quedará como borrador'}
            </p>
          </div>
          <div style={{
            width: 42, height: 24, borderRadius: 12, flexShrink: 0,
            background: autoEnviar ? 'var(--success-400)' : 'var(--border-default)',
            position: 'relative', transition: 'background .2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: autoEnviar ? 21 : 3,
              transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} style={btnSecondary} disabled={mut.isPending}>Cancelar</button>
          <button onClick={handleSubmit} style={btnPrimary('var(--primary-500)')} disabled={mut.isPending}>
            {mut.isPending
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : autoEnviar ? <Send size={14} /> : <Plus size={14} />
            }
            {autoEnviar ? 'Crear y enviar link' : 'Crear borrador'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.72rem', color: 'var(--danger-400)', margin: '3px 0 0' }}>{children}</p>
}

// ── Estilos compartidos ───────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.74rem', fontWeight: 500,
  color: 'var(--text-muted)', marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)', fontSize: '0.84rem', color: 'var(--text-primary)',
  outline: 'none', transition: 'border-color .15s',
}

function btnPrimary(bg: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', background: bg, color: '#fff',
    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    fontSize: '0.84rem', fontWeight: 500, transition: 'opacity .15s',
  }
}

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', background: 'var(--bg-elevated)',
  color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)', cursor: 'pointer',
  fontSize: '0.84rem', fontWeight: 500,
}

// ── Panel detalle derecho ─────────────────────────────────────────

function PanelDetalle({
  solicitudId, onClose, onAction,
}: {
  solicitudId: number
  onClose: () => void
  onAction: (action: SolicitudAccion) => void
}) {
  const q = useQuery({
    queryKey: SK.detail(solicitudId),
    queryFn: () => parkingService.getSolicitud(solicitudId),
    staleTime: 10_000,
  })

  const d = q.data
  const acciones = d ? getAcciones(d.estado) : []

  const ACTION_CONFIG: Partial<Record<SolicitudAccion, { label: string; icon: React.ReactNode; color: string }>> = {
    enviar:    { label: 'Enviar',             icon: <Send size={13} />,       color: 'var(--primary-500)' },
    tomar:     { label: 'Tomar revisión',     icon: <Eye size={13} />,        color: '#8B5CF6' },
    token:     { label: 'Regenerar token',    icon: <RefreshCw size={13} />,  color: '#0EA5E9' },
    aprobar:   { label: 'Aprobar',            icon: <CheckCircle2 size={13}/>, color: '#16A34A' },
    denegar:   { label: 'Denegar',            icon: <XCircle size={13} />,    color: 'var(--danger-400)' },
    correccion:{ label: 'Pedir corrección',   icon: <RefreshCw size={13} />,  color: '#D97706' },
    suspender: { label: 'Suspender',          icon: <AlertTriangle size={13}/>, color: '#F59E0B' },
    revocar:   { label: 'Revocar',            icon: <Ban size={13} />,        color: 'var(--danger-400)' },
    eliminar:  { label: 'Eliminar',           icon: <X size={13} />,          color: 'var(--danger-400)' },
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 200,
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column',
      animation: 'slideInRight .2s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        {d ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {d.codigo}
            </span>
            <EstadoBadge estado={d.estado} />
          </div>
        ) : (
          <Sk w="180px" h="20px" />
        )}
        <button onClick={onClose} aria-label="Cerrar panel" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 6,
          display: 'flex', transition: 'background .15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {q.isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Sk w="40%" h="10px" />
                <Sk w="70%" h="14px" />
              </div>
            ))}
          </div>
        ) : q.isError ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--danger-400)' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.84rem' }}>Error al cargar el detalle</p>
          </div>
        ) : d ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Vehículo */}
            <Section title="Vehículo" icon={<Car size={14} />}>
              <Row label="Placa">
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem' }}>
                  {d.placa}
                </span>
              </Row>
              <Row label="Tipo">{TIPO_VEHICULO_LABEL[d.tipo_vehiculo]}</Row>
              <Row label="Marca / Línea">{d.marca} {d.linea}</Row>
              <Row label="Color / Año">{d.color}{d.modelo_anio ? ` — ${d.modelo_anio}` : ''}</Row>
              <Row label="Horario">{d.horario_requerido}</Row>
              {d.dias_requeridos && Array.isArray(d.dias_requeridos) && d.dias_requeridos.length > 0 && (
                <Row label="Días">
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {d.dias_requeridos.map((dia: string) => (
                      <span key={dia} style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem',
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontWeight: 500,
                      }}>
                        {DIAS_LABEL[dia] ?? dia}
                      </span>
                    ))}
                  </div>
                </Row>
              )}
            </Section>

            {/* Persona */}
            <Section title="Solicitante" icon={<User size={14} />}>
              {d.persona ? (
                <>
                  <Row label="Nombre">{d.persona.nombres} {d.persona.apellidos}</Row>
                  <Row label="Documento">{d.persona.numero_documento}</Row>
                  {d.persona.email && <Row label="Email">{d.persona.email}</Row>}
                </>
              ) : d.solicitante_nombre ? (
                <>
                  <Row label="Nombre">{d.solicitante_nombre}</Row>
                  {d.solicitante_cedula && <Row label="Cédula">{d.solicitante_cedula}</Row>}
                  <Row label="Tipo">{TIPO_USUARIO_LABEL[d.tipo_usuario]}</Row>
                </>
              ) : (
                <Row label="Tipo">{TIPO_USUARIO_LABEL[d.tipo_usuario]}</Row>
              )}
              <Row label="Creado por">{d.creador.nombre}</Row>
            </Section>

            {/* Vigencia */}
            <Section title="Vigencia" icon={<Calendar size={14} />}>
              <Row label="Inicio">{formatFecha(d.fecha_inicio)}</Row>
              <Row label="Fin">{formatFecha(d.fecha_fin)}</Row>
              <Row label="Motivo"><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{d.motivo}</span></Row>
            </Section>

            {/* Autorización (si existe) */}
            {d.autorizacion && (
              <Section title="Autorización" icon={<ShieldCheck size={14} />}>
                <Row label="Tipo">{TIPO_AUTORIZACION_LABEL[d.autorizacion.tipo_autorizacion as TipoAutorizacionParkingFull] ?? d.autorizacion.tipo_autorizacion}</Row>
                <Row label="Estado">
                  <span style={{ color: d.autorizacion.estado === 'ACTIVA' ? 'var(--success-400)' : 'var(--text-muted)', fontWeight: 500, fontSize: '0.82rem' }}>
                    {d.autorizacion.estado}
                  </span>
                </Row>
                <Row label="Período">{formatFechaCorta(d.autorizacion.fecha_inicio)} — {formatFechaCorta(d.autorizacion.fecha_fin)}</Row>
                {d.aprobador && <Row label="Aprobado por">{d.aprobador.nombre}</Row>}
              </Section>
            )}

            {/* Motivo denegación */}
            {d.motivo_denegacion && (
              <div style={{
                background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)',
                borderRadius: 'var(--radius-md)', padding: '12px 14px',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--danger-400)', fontWeight: 600, margin: '0 0 4px' }}>Motivo de denegación</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{d.motivo_denegacion}</p>
              </div>
            )}

            {/* Documentos */}
            {d.documentos.length > 0 && (
              <Section title={`Documentos (${d.documentos.length})`} icon={<FileText size={14} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.documentos.map(doc => (
                    <div key={doc.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {DOC_LABEL[doc.tipo_documento] ?? doc.tipo_documento}
                        </span>
                        {doc.fecha_vencimiento && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            · {formatFechaCorta(doc.fecha_vencimiento)}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: DOC_ESTADO_COLOR[doc.estado] ?? 'var(--text-muted)' }}>
                        {doc.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Historial */}
            {d.historial.length > 0 && (
              <Section title="Historial" icon={<Clock size={14} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {d.historial.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', marginTop: 4,
                          background: h.estado_nuevo ? (ESTADO[h.estado_nuevo as EstadoSolicitudParkingFull]?.color ?? 'var(--primary-500)') : 'var(--primary-500)',
                        }} />
                        {i < d.historial.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <p style={{ margin: '0 0 2px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {h.evento}
                        </p>
                        <p style={{ margin: '0 0 2px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {h.descripcion}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {h.usuario.nombre} · {formatTs(h.fecha_hora)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        ) : null}
      </div>

      {/* Acciones */}
      {acciones.length > 0 && (
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {acciones.map(accion => {
            const cfg = ACTION_CONFIG[accion]
            if (!cfg) return null
            return (
              <button
                key={accion}
                onClick={() => onAction(accion)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', border: `1px solid ${cfg.color}`,
                  background: 'transparent', color: cfg.color,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500, transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${cfg.color}18`
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {cfg.icon}{cfg.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, alignItems: 'start' }}>
      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────

type ModalType = 'crear' | 'aprobar' | 'denegar' | 'correccion' | 'suspender' | 'revocar' | 'token' | 'enviar' | null

export function ParkingSolicitudesView() {
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const sedeId = sedeActiva?.id ?? null

  const [searchParams, setSearchParams] = useSearchParams()
  const [rawSearch, setRawSearch] = useState(searchParams.get('placa') ?? '')
  const search = useDebounce(rawSearch, 380)

  const estado      = searchParams.get('estado') ?? ''
  const tipoUsuario = searchParams.get('tipo_usuario') ?? ''
  const tipoVehiculo= searchParams.get('tipo_vehiculo') ?? ''
  const page        = parseInt(searchParams.get('page') ?? '1', 10)

  const setParam = useCallback((k: string, v: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (v) { next.set(k, v) } else { next.delete(k) }
      if (k !== 'page') next.set('page', '1')
      return next
    })
  }, [setSearchParams])

  const hasFilters = !!(estado || tipoUsuario || tipoVehiculo || rawSearch)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [tokenResult, setTokenResult] = useState<EnviarTokenResult | null>(null)

  const qc = useQueryClient()

  const queryParams = useMemo(() => ({
    sede_id: sedeId ?? undefined,
    estado:       estado || undefined,
    tipo_usuario: tipoUsuario || undefined,
    tipo_vehiculo:tipoVehiculo || undefined,
    placa:        search || undefined,
    page,
    per_page: 20,
  }), [sedeId, estado, tipoUsuario, tipoVehiculo, search, page])

  const listQ = useQuery({
    queryKey: SK.list(queryParams as Record<string, unknown>),
    queryFn:  () => parkingService.getSolicitudes(queryParams),
    enabled:  !!sedeId,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: SK.all })
  }, [qc])

  const refreshDetalle = useCallback(() => {
    if (selectedId) qc.invalidateQueries({ queryKey: SK.detail(selectedId) })
  }, [qc, selectedId])

  // ── Mutations ─────────────────────────────────────────────────

  const mutEnviar = useMutation({
    mutationFn: () => parkingService.enviarSolicitud(selectedId!),
    onSuccess: (res) => {
      toast.success('Solicitud enviada — link de autogestión generado')
      setTokenResult(res)
      setModal('token')
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutTomar = useMutation({
    mutationFn: () => parkingService.tomarSolicitud(selectedId!),
    onSuccess: () => {
      toast.success('Solicitud tomada — ahora está EN REVISIÓN')
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutToken = useMutation({
    mutationFn: () => parkingService.regenerarToken(selectedId!),
    onSuccess: (res) => {
      toast.success('Token regenerado')
      setTokenResult(res)
      setModal('token')
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutAprobar = useMutation({
    mutationFn: (p: AprobarPayload) => parkingService.aprobarSolicitud(selectedId!, p),
    onSuccess: () => {
      toast.success('Solicitud aprobada — autorización activa')
      setModal(null)
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutDenegar = useMutation({
    mutationFn: (motivo: string) => parkingService.denegarSolicitud(selectedId!, motivo),
    onSuccess: () => {
      toast.success('Solicitud denegada')
      setModal(null)
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutCorreccion = useMutation({
    mutationFn: (obs: string) => parkingService.solicitarCorreccion(selectedId!, obs),
    onSuccess: () => {
      toast.success('Corrección solicitada al solicitante')
      setModal(null)
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutSuspender = useMutation({
    mutationFn: (motivo: string) => parkingService.suspenderSolicitud(selectedId!, motivo),
    onSuccess: () => {
      toast.success('Solicitud suspendida')
      setModal(null)
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutRevocar = useMutation({
    mutationFn: (motivo: string) => parkingService.revocarSolicitud(selectedId!, motivo),
    onSuccess: () => {
      toast.success('Solicitud revocada')
      setModal(null)
      invalidate(); refreshDetalle()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const mutEliminar = useMutation({
    mutationFn: () => parkingService.deleteSolicitud(selectedId!),
    onSuccess: () => {
      toast.success('Solicitud eliminada')
      setSelectedId(null)
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // ── Acción desde panel ────────────────────────────────────────

  const handleAction = useCallback((accion: SolicitudAccion) => {
    switch (accion) {
      case 'enviar':     mutEnviar.mutate(); break
      case 'tomar':      mutTomar.mutate(); break
      case 'token':      mutToken.mutate(); break
      case 'eliminar':
        if (window.confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) {
          mutEliminar.mutate()
        }
        break
      default:
        setModal(accion as ModalType)
    }
  }, [mutEnviar, mutTomar, mutToken, mutEliminar])

  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = listQ.data?.total_pages ?? 1

  if (!sedeId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
        <Building2 size={40} style={{ color: 'var(--text-disabled)' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Selecciona una sede para ver las solicitudes</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .sol-row:hover td { background: var(--bg-elevated) !important; cursor: pointer; }
        .sol-row.selected td { background: rgba(var(--primary-rgb, 99,102,241), .06) !important; }
      `}</style>

      <div style={{
        padding: '28px 32px',
        marginRight: selectedId ? 424 : 0,
        transition: 'margin-right .22s ease',
        minHeight: '100vh',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Solicitudes de parking
            </h1>
            {listQ.data && (
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {total.toLocaleString('es-CO')} solicitud{total !== 1 ? 'es' : ''} · {sedeActiva?.nombre}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => listQ.refetch()}
              aria-label="Actualizar"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'color .15s, background .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
            >
              <RefreshCw size={15} style={{ animation: listQ.isFetching ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={() => setModal('crear')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', background: 'var(--primary-500)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: '0.86rem', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,.12)',
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              <Plus size={16} />
              Nueva solicitud
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          marginBottom: 20,
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              value={rawSearch}
              onChange={e => setRawSearch(e.target.value)}
              placeholder="Buscar placa o código..."
              style={{
                ...inputStyle, paddingLeft: 32,
                background: 'var(--bg-elevated)',
              }}
            />
            {rawSearch && (
              <button
                onClick={() => setRawSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <SelectFilter
            value={estado}
            onChange={v => setParam('estado', v)}
            placeholder="Estado"
            options={Object.entries(ESTADO).map(([k, v]) => ({ value: k, label: v.label }))}
          />

          <SelectFilter
            value={tipoUsuario}
            onChange={v => setParam('tipo_usuario', v)}
            placeholder="Tipo usuario"
            options={Object.entries(TIPO_USUARIO_LABEL).map(([k, v]) => ({ value: k, label: v }))}
          />

          <SelectFilter
            value={tipoVehiculo}
            onChange={v => setParam('tipo_vehiculo', v)}
            placeholder="Vehículo"
            options={Object.entries(TIPO_VEHICULO_LABEL).map(([k, v]) => ({ value: k, label: v }))}
          />

          {hasFilters && (
            <button
              onClick={() => {
                setRawSearch('')
                setSearchParams({ page: '1' })
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '7px 12px', background: 'transparent',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem',
              }}
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['Código','Persona / Vehículo','Tipo','Estado','Vigencia','Solicitada',''].map((h, i) => (
                    <th key={i} style={{
                      padding: '11px 12px', textAlign: 'left',
                      fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-subtle)',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listQ.isLoading ? (
                  Array.from({ length: 8 }, (_, i) => <SkRow key={i} />)
                ) : listQ.isError ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <AlertTriangle size={32} style={{ color: 'var(--danger-400)', margin: '0 auto 10px' }} />
                      <p style={{ color: 'var(--danger-400)', margin: 0 }}>Error al cargar las solicitudes</p>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <EmptyState search={hasFilters} onNew={() => setModal('crear')} />
                ) : (
                  items.map(item => (
                    <tr
                      key={item.id}
                      className={`sol-row${selectedId === item.id ? ' selected' : ''}`}
                      onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.codigo}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          {item.persona ? (
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {item.persona.nombres} {item.persona.apellidos}
                            </p>
                          ) : item.solicitante_nombre ? (
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {item.solicitante_nombre}
                            </p>
                          ) : (
                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              {TIPO_USUARIO_LABEL[item.tipo_usuario]}
                            </p>
                          )}
                          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {item.placa}
                          </p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Car size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {TIPO_VEHICULO_LABEL[item.tipo_vehiculo]}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <EstadoBadge estado={item.estado} />
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatFechaCorta(item.fecha_inicio)} — {formatFechaCorta(item.fecha_fin)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatTs(item.created_at)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, width: 40 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: selectedId === item.id ? 'var(--primary-500)' : 'var(--bg-elevated)',
                          color: selectedId === item.id ? '#fff' : 'var(--text-muted)',
                          transition: 'all .15s',
                        }}>
                          <Eye size={13} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Página {page} de {totalPages} · {total} total
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <PageBtn disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                  <ChevronLeft size={14} /> Anterior
                </PageBtn>
                <PageBtn disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>
                  Siguiente <ChevronRight size={14} />
                </PageBtn>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel detalle */}
      {selectedId && (
        <PanelDetalle
          solicitudId={selectedId}
          onClose={() => setSelectedId(null)}
          onAction={handleAction}
        />
      )}

      {/* Modales */}
      {modal === 'crear' && sedeId && (
        <ModalRegistrarRapido
          sedeId={sedeId}
          onClose={() => setModal(null)}
          onCreated={() => setModal(null)}
          onToken={(result) => {
            setTokenResult(result)
            setModal('token')
          }}
        />
      )}

      {modal === 'aprobar' && (
        <ModalAprobar
          onClose={() => setModal(null)}
          onConfirm={(p) => mutAprobar.mutate(p)}
          loading={mutAprobar.isPending}
        />
      )}

      {modal === 'denegar' && (
        <ModalTexto
          title="Denegar solicitud"
          label="Motivo de denegación"
          placeholder="Describe el motivo por el que se deniega la solicitud..."
          confirmLabel="Denegar"
          confirmColor="var(--danger-400)"
          onClose={() => setModal(null)}
          onConfirm={(t) => mutDenegar.mutate(t)}
          loading={mutDenegar.isPending}
        />
      )}

      {modal === 'correccion' && (
        <ModalTexto
          title="Solicitar corrección"
          label="Instrucciones para el solicitante"
          placeholder="Describe qué debe corregir o adjuntar el solicitante..."
          confirmLabel="Enviar corrección"
          confirmColor="#D97706"
          onClose={() => setModal(null)}
          onConfirm={(t) => mutCorreccion.mutate(t)}
          loading={mutCorreccion.isPending}
        />
      )}

      {modal === 'suspender' && (
        <ModalTexto
          title="Suspender solicitud"
          label="Motivo de suspensión"
          placeholder="Indica la razón de la suspensión temporal..."
          confirmLabel="Suspender"
          confirmColor="#F59E0B"
          onClose={() => setModal(null)}
          onConfirm={(t) => mutSuspender.mutate(t)}
          loading={mutSuspender.isPending}
        />
      )}

      {modal === 'revocar' && (
        <ModalTexto
          title="Revocar solicitud"
          label="Motivo de revocación"
          placeholder="Indica el motivo para revocar definitivamente..."
          confirmLabel="Revocar"
          confirmColor="var(--danger-400)"
          onClose={() => setModal(null)}
          onConfirm={(t) => mutRevocar.mutate(t)}
          loading={mutRevocar.isPending}
        />
      )}

      {modal === 'token' && tokenResult && (
        <ModalToken result={tokenResult} onClose={() => setModal(null)} />
      )}
    </>
  )
}

const tdStyle: React.CSSProperties = {
  padding: '13px 12px',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'middle',
}

function PageBtn({ disabled, onClick, children }: {
  disabled: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 12px', background: disabled ? 'transparent' : 'var(--bg-surface)',
        border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--text-disabled)' : 'var(--text-secondary)',
        fontSize: '0.78rem', fontWeight: 500,
      }}
    >
      {children}
    </button>
  )
}

export default ParkingSolicitudesView
