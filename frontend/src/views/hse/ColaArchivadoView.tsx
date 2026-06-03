import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Archive, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import { useNotificacionesStore } from '@/store'
import type { SolicitudArchivadoResponse } from '@/types/hse'

// ── Helpers ───────────────────────────────────────────────────────

function diasEnCola(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function TipoBadge({ tipo }: { tipo: string }) {
  const isAlto = tipo === 'ALTO_RIESGO'
  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '4px',
        padding:      '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize:     '0.68rem',
        fontWeight:   600,
        background:   isAlto ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
        color:        isAlto ? 'var(--danger-600)'     : 'var(--success-600)',
        border:       `1px solid ${isAlto ? 'var(--danger-200)' : 'var(--success-300)'}`,
        whiteSpace:   'nowrap',
      }}
    >
      {isAlto && <AlertTriangle size={10} />}
      {isAlto ? 'Alto Riesgo' : 'Normal'}
    </span>
  )
}

// ── Modal genérico ────────────────────────────────────────────────

interface ModalOverlayProps {
  title:    string
  onClose:  () => void
  children: React.ReactNode
}

function ModalOverlay({ title, onClose, children }: ModalOverlayProps) {
  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.55)',
        zIndex:         400,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background:   'var(--bg-elevated)',
          border:       '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:    'var(--shadow-lg)',
          width:        '100%',
          maxWidth:     '480px',
          padding:      '24px',
        }}
      >
        <h3
          style={{
            margin:       '0 0 18px',
            fontSize:     '1rem',
            fontWeight:   700,
            color:        'var(--text-primary)',
          }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

// ── Modal Aprobar ─────────────────────────────────────────────────

interface ModalAprobarProps {
  solicitud: SolicitudArchivadoResponse
  onClose:   () => void
  onDone:    () => void
}

function ModalAprobar({ solicitud, onClose, onDone }: ModalAprobarProps) {
  const [motivo,       setMotivo]       = useState('')
  const [firma,        setFirma]        = useState('')
  const [guardando,    setGuardando]    = useState(false)

  const nombre = solicitud.contratista
    ? `${solicitud.contratista.nombres} ${solicitud.contratista.apellidos}`
    : `Contratista #${solicitud.contratista_id}`

  async function handleConfirmar() {
    if (!motivo.trim() || !firma.trim()) {
      toast.error('El motivo y la firma son requeridos')
      return
    }
    setGuardando(true)
    try {
      await hseService.aprobarArchivado(solicitud.contratista_id, {
        motivo:        motivo.trim(),
        firmaDigital:  firma.trim(),
      })
      toast.success('Archivado aprobado correctamente')
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setGuardando(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontSize:     '0.75rem',
    fontWeight:   600,
    color:        'var(--text-secondary)',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 12px',
    background:   'var(--bg-surface)',
    border:       '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color:        'var(--text-primary)',
    fontSize:     '0.82rem',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   'var(--font-ui)',
    transition:   'border-color var(--transition-fast)',
  }

  return (
    <ModalOverlay title="Aprobar archivado" onClose={onClose}>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 18px' }}>
        Estás aprobando el archivado de <strong style={{ color: 'var(--text-primary)' }}>{nombre}</strong>.
        Esta acción cambiará su estado a ARCHIVADO.
      </p>

      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Motivo de aprobación *</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder="Describe el motivo de aprobación..."
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e  => { e.currentTarget.style.borderColor = 'var(--primary-400)' }}
          onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
      </div>

      <div style={{ marginBottom: '22px' }}>
        <label style={labelStyle}>Firma digital *</label>
        <input
          type="text"
          value={firma}
          onChange={e => setFirma(e.target.value)}
          placeholder="Tu nombre completo como firma"
          style={inputStyle}
          onFocus={e  => { e.currentTarget.style.borderColor = 'var(--primary-400)' }}
          onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onClose}
          disabled={guardando}
          style={{
            padding:      '8px 16px',
            background:   'transparent',
            border:       '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--text-secondary)',
            cursor:       'pointer',
            fontSize:     '0.82rem',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmar}
          disabled={guardando || !motivo.trim() || !firma.trim()}
          style={{
            padding:      '8px 18px',
            background:   guardando || !motivo.trim() || !firma.trim()
              ? 'var(--bg-raised)'
              : 'var(--success-500)',
            border:       'none',
            borderRadius: 'var(--radius-md)',
            color:        guardando || !motivo.trim() || !firma.trim()
              ? 'var(--text-muted)'
              : '#fff',
            cursor:       guardando || !motivo.trim() || !firma.trim() ? 'not-allowed' : 'pointer',
            fontSize:     '0.82rem',
            fontWeight:   600,
            transition:   'background var(--transition-fast)',
          }}
        >
          {guardando ? 'Aprobando...' : 'Confirmar aprobación'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ── Modal Rechazar ────────────────────────────────────────────────

interface ModalRechazarProps {
  solicitud: SolicitudArchivadoResponse
  onClose:   () => void
  onDone:    () => void
}

function ModalRechazar({ solicitud, onClose, onDone }: ModalRechazarProps) {
  const [motivo,    setMotivo]    = useState('')
  const [guardando, setGuardando] = useState(false)

  const nombre = solicitud.contratista
    ? `${solicitud.contratista.nombres} ${solicitud.contratista.apellidos}`
    : `Contratista #${solicitud.contratista_id}`

  async function handleConfirmar() {
    if (!motivo.trim()) {
      toast.error('El motivo es requerido')
      return
    }
    setGuardando(true)
    try {
      await hseService.rechazarArchivado(solicitud.contratista_id, { motivo: motivo.trim() })
      toast.success('Solicitud rechazada')
      onDone()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setGuardando(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontSize:     '0.75rem',
    fontWeight:   600,
    color:        'var(--text-secondary)',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 12px',
    background:   'var(--bg-surface)',
    border:       '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color:        'var(--text-primary)',
    fontSize:     '0.82rem',
    outline:      'none',
    boxSizing:    'border-box',
    fontFamily:   'var(--font-ui)',
    resize:       'vertical',
    transition:   'border-color var(--transition-fast)',
  }

  return (
    <ModalOverlay title="Rechazar solicitud" onClose={onClose}>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 18px' }}>
        Estás rechazando la solicitud de archivado de{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{nombre}</strong>.
      </p>

      <div style={{ marginBottom: '22px' }}>
        <label style={labelStyle}>Motivo de rechazo *</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder="Describe el motivo del rechazo..."
          style={inputStyle}
          onFocus={e  => { e.currentTarget.style.borderColor = 'var(--danger-400)' }}
          onBlur={e   => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={onClose}
          disabled={guardando}
          style={{
            padding:      '8px 16px',
            background:   'transparent',
            border:       '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--text-secondary)',
            cursor:       'pointer',
            fontSize:     '0.82rem',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmar}
          disabled={guardando || !motivo.trim()}
          style={{
            padding:      '8px 18px',
            background:   guardando || !motivo.trim() ? 'var(--bg-raised)' : 'var(--danger-500)',
            border:       'none',
            borderRadius: 'var(--radius-md)',
            color:        guardando || !motivo.trim() ? 'var(--text-muted)' : '#fff',
            cursor:       guardando || !motivo.trim() ? 'not-allowed' : 'pointer',
            fontSize:     '0.82rem',
            fontWeight:   600,
            transition:   'background var(--transition-fast)',
          }}
        >
          {guardando ? 'Rechazando...' : 'Confirmar rechazo'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ── Card de solicitud ─────────────────────────────────────────────

interface SolicitudCardProps {
  solicitud:   SolicitudArchivadoResponse
  onAprobar:   (s: SolicitudArchivadoResponse) => void
  onRechazar:  (s: SolicitudArchivadoResponse) => void
}

function SolicitudCard({ solicitud, onAprobar, onRechazar }: SolicitudCardProps) {
  const c    = solicitud.contratista
  const auth = c?.autorizacion ?? null
  const dias = diasEnCola(solicitud.created_at)

  return (
    <div
      style={{
        background:   'var(--bg-elevated)',
        border:       '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-sm)',
        padding:      '18px 20px',
        display:      'flex',
        flexDirection: 'column',
        gap:          '12px',
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {c ? `${c.nombres} ${c.apellidos}` : `Contratista #${solicitud.contratista_id}`}
          </div>
          {c && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {c.tipo_documento} {c.numero_documento}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {auth && <TipoBadge tipo={auth.tipo_contratista} />}
          <span
            style={{
              padding:      '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize:     '0.68rem',
              fontWeight:   600,
              background:   dias >= 3 ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)',
              color:        dias >= 3 ? 'var(--danger-600)'     : 'var(--warning-600)',
              border:       `1px solid ${dias >= 3 ? 'var(--danger-200)' : 'var(--warning-200)'}`,
            }}
          >
            {dias === 0 ? 'Hoy' : dias === 1 ? '1 día' : `${dias} días`} en cola
          </span>
        </div>
      </div>

      {/* Detalles */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap:                 '8px',
          padding:             '12px',
          background:          'var(--bg-surface)',
          borderRadius:        'var(--radius-md)',
          border:              '1px solid var(--border-subtle)',
        }}
      >
        {auth?.proveedor && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {auth.proveedor.nom_proveedor}
            </div>
          </div>
        )}
        {auth && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Autorización</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>{auth.codigo}</div>
          </div>
        )}
        {auth && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Vigencia</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {formatFecha(auth.fecha_inicio)} – {formatFecha(auth.fecha_fin)}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Solicitud</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {formatFecha(solicitud.created_at)}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={() => onRechazar(solicitud)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '7px 14px',
            background:   'transparent',
            border:       '1px solid var(--danger-300)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--danger-600)',
            cursor:       'pointer',
            fontSize:     '0.8rem',
            fontWeight:   500,
            transition:   'all var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <XCircle size={14} />
          Rechazar
        </button>
        <button
          onClick={() => onAprobar(solicitud)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '7px 14px',
            background:   'var(--success-500)',
            border:       'none',
            borderRadius: 'var(--radius-md)',
            color:        '#fff',
            cursor:       'pointer',
            fontSize:     '0.8rem',
            fontWeight:   600,
            transition:   'opacity var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <CheckCircle size={14} />
          Aprobar
        </button>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────

export default function ColaArchivadoView() {
  const fetchConteo          = useNotificacionesStore(s => s.fetchConteo)
  const fetchNotificaciones  = useNotificacionesStore(s => s.fetchNotificaciones)

  const [solicitudes, setSolicitudes] = useState<SolicitudArchivadoResponse[]>([])
  const [cargando,    setCargando]    = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const [modalAprobar,  setModalAprobar]  = useState<SolicitudArchivadoResponse | null>(null)
  const [modalRechazar, setModalRechazar] = useState<SolicitudArchivadoResponse | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const data = await hseService.getColaArchivado()
      setSolicitudes(data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { void cargar() }, [])

  function handleDone() {
    setModalAprobar(null)
    setModalRechazar(null)
    void cargar()
    // Sincronizar el bell: el backend ya eliminó la notificación, refrescamos el conteo
    void fetchConteo()
    void fetchNotificaciones()
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '24px',
          gap:            '16px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Cola de depuración
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Solicitudes de archivado pendientes de resolución
          </p>
        </div>
        <button
          onClick={() => void cargar()}
          disabled={cargando}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 14px',
            background:   'var(--bg-elevated)',
            border:       '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--text-secondary)',
            cursor:       cargando ? 'not-allowed' : 'pointer',
            fontSize:     '0.8rem',
            fontWeight:   500,
            transition:   'all var(--transition-fast)',
          }}
          onMouseEnter={e => { if (!cargando) e.currentTarget.style.borderColor = 'var(--primary-300)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
        >
          <RefreshCw size={13} style={{ animation: cargando ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding:      '14px 16px',
            background:   'rgba(239,68,68,0.06)',
            border:       '1px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--danger-600)',
            fontSize:     '0.82rem',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Spinner inicial */}
      {cargando && solicitudes.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div
            style={{
              width:        '28px',
              height:       '28px',
              border:       '2px solid var(--border-default)',
              borderTop:    '2px solid var(--primary-500)',
              borderRadius: '50%',
              animation:    'spin 1s linear infinite',
            }}
          />
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && solicitudes.length === 0 && !error && (
        <div
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '60px 20px',
            background:     'var(--bg-elevated)',
            border:         '1px solid var(--border-default)',
            borderRadius:   'var(--radius-lg)',
            color:          'var(--text-muted)',
            gap:            '12px',
          }}
        >
          <Archive size={36} style={{ opacity: 0.35 }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            No hay solicitudes de archivado pendientes
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cuando un contratista sea marcado para archivado aparecerá aquí
          </div>
        </div>
      )}

      {/* Lista */}
      {solicitudes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {solicitudes.map(s => (
            <SolicitudCard
              key={s.id}
              solicitud={s}
              onAprobar={setModalAprobar}
              onRechazar={setModalRechazar}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modalAprobar && (
        <ModalAprobar
          solicitud={modalAprobar}
          onClose={() => setModalAprobar(null)}
          onDone={handleDone}
        />
      )}
      {modalRechazar && (
        <ModalRechazar
          solicitud={modalRechazar}
          onClose={() => setModalRechazar(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
