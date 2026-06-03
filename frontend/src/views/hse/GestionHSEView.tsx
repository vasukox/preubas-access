/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Gestión HSE — Revisión y aprobación de contratistas
 */

import React, { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck, Search, CheckCircle2, XCircle,
  Eye, User, RefreshCw, Copy, Clock, Download, FileText as FileIcon,
  Trash2, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type {
  AutorizacionListResponse,
  ContratistaDetalleResponse,
  EstadoContratista,
  ProveedorHSEOption,
} from '@/types/hse'
import { ESTADO_CONTRATISTA_LABEL } from '@/types/hse'

// ── Contador de tiempo restante del token ─────────────────────────
function TokenTimer({ expiraEn }: { expiraEn: string | null }) {
  const calcular = useCallback(() => {
    if (!expiraEn) return null
    // Normalizar: si ya tiene offset no agregar Z, si es naive agregar Z para tratarlo como UTC
    const str = expiraEn.includes('+') || expiraEn.endsWith('Z') ? expiraEn : expiraEn + 'Z'
    const diff = new Date(str).getTime() - Date.now()
    if (diff <= 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return { h, m, pct: Math.min(100, (diff / (48 * 3600000)) * 100) }
  }, [expiraEn])

  const [tiempo, setTiempo] = useState(calcular)

  useEffect(() => {
    setTiempo(calcular())
  }, [calcular])

  useEffect(() => {
    const id = setInterval(() => setTiempo(calcular()), 60000)
    return () => clearInterval(id)
  }, [calcular])

  if (!expiraEn) return null

  if (!tiempo) return (
    <span style={{
      display:    'inline-flex', alignItems: 'center', gap: '4px',
      fontSize:   '0.68rem', color: 'var(--danger-400)',
      fontFamily: 'var(--font-mono)',
    }}>
      <Clock size={10} /> Link expirado
    </span>
  )

  const color = tiempo.h < 4 ? 'var(--danger-400)' : tiempo.h < 12 ? '#4574C4' : 'var(--success-400)'
  return (
    <span style={{
      display:    'inline-flex', alignItems: 'center', gap: '4px',
      fontSize:   '0.68rem', color,
      fontFamily: 'var(--font-mono)',
    }}>
      <Clock size={10} />
      {tiempo.h}h {tiempo.m}m restantes
    </span>
  )
}

// ── Badge estado contratista ──────────────────────────────────────
function ContratistaBadge({ estado }: { estado: EstadoContratista }) {
  const colores: Record<EstadoContratista, { color: string; bg: string }> = {
    PENDIENTE_AUTOGESTION:   { color: 'var(--text-muted)',    bg: 'var(--bg-elevated)' },
    AUTOGESTION_EN_PROGRESO: { color: 'var(--primary-400)',   bg: 'rgba(69,116,196,0.08)' },
    AUTOGESTION_COMPLETADA:  { color: '#5668B8',              bg: 'rgba(86,104,184,0.08)' },
    EN_REVISION:             { color: '#5668B8',              bg: 'rgba(86,104,184,0.08)' },
    APROBADO:                { color: 'var(--success-400)',   bg: 'rgba(40,149,108,0.08)' },
    DENEGADO:                { color: 'var(--danger-400)',    bg: 'rgba(192,80,80,0.08)' },
    ARCHIVADO:               { color: 'var(--text-muted)',    bg: 'var(--bg-raised)' },
  }
  const { color, bg } = colores[estado] ?? { color: 'var(--text-muted)', bg: 'var(--bg-raised)' }
  return (
    <span style={{
      padding:      '3px 8px',
      background:   bg,
      borderRadius: '20px',
      fontSize:     '0.7rem',
      color,
      fontWeight:   500,
      whiteSpace:   'nowrap',
    }}>
      {ESTADO_CONTRATISTA_LABEL[estado]}
    </span>
  )
}

// ── Enlace/preview de documento PDF ───────────────────────────────
function DocLink({
  label,
  path,
  requerido = false,
  canRemove = false,
  removing = false,
  onRemove,
}: {
  label:     string
  path:      string | null | undefined
  requerido?: boolean
  canRemove?: boolean
  removing?: boolean
  onRemove?: () => void
}) {
  const [cargando, setCargando] = useState<'ver' | 'bajar' | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const nombreArchivo = path ? path.split('/').pop() ?? 'archivo.pdf' : null

  const handleVer = async () => {
    if (!path) return
    setCargando('ver')
    setError(null)
    try {
      const blobUrl = await hseService.previsualizarArchivo(path)
      window.open(blobUrl, '_blank')
      toast.success(`Previsualizando ${nombreArchivo ?? 'archivo'}.`)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15_000)
    } catch {
      const msg = 'No se pudo cargar el archivo.'
      setError(msg)
      toast.error(msg)
    } finally {
      setCargando(null)
    }
  }

  const handleBajar = async () => {
    if (!path) return
    setCargando('bajar')
    setError(null)
    try {
      await hseService.descargarArchivo(path, nombreArchivo ?? undefined)
      toast.success(`Archivo ${nombreArchivo ?? ''} descargado correctamente.`.trim())
    } catch {
      const msg = 'No se pudo descargar el archivo.'
      setError(msg)
      toast.error(msg)
    } finally {
      setCargando(null)
    }
  }

  const rowStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '8px 12px',
    background:     path ? 'rgba(86,104,184,0.05)' : 'var(--bg-elevated)',
    border:         `1px solid ${path ? 'rgba(86,104,184,0.15)' : 'var(--border-subtle)'}`,
    borderRadius:   '8px',
    gap:            '10px',
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    display:      'flex',
    alignItems:   'center',
    gap:          '4px',
    padding:      '4px 10px',
    borderRadius: '6px',
    fontSize:     '0.7rem',
    fontWeight:   600,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    opacity:      disabled ? 0.5 : 1,
    fontFamily:   'var(--font-ui)',
    transition:   'all 0.15s',
    border:       'none',
  })

  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {path ? (
          <span style={{ fontSize: '0.72rem', color: '#5668B8', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <FileIcon size={11} style={{ display: 'inline', marginRight: '4px' }} />
            {nombreArchivo}
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: requerido ? 'var(--danger-400)' : 'var(--text-muted)' }}>
            {requerido ? '⚠ No adjuntado' : 'No aplica'}
          </span>
        )}
        {error && (
          <span style={{ fontSize: '0.68rem', color: 'var(--danger-400)' }}>{error}</span>
        )}
      </div>
      {path && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleVer}
            disabled={!!cargando}
            style={{ ...btnStyle(!!cargando), background: 'rgba(86,104,184,0.12)', color: '#5668B8' }}
          >
            <Eye size={11} />
            {cargando === 'ver' ? '...' : 'Ver'}
          </button>
          <button
            onClick={handleBajar}
            disabled={!!cargando}
            style={{ ...btnStyle(!!cargando), background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
          >
            <Download size={11} />
            {cargando === 'bajar' ? '...' : 'Descargar'}
          </button>
          {canRemove && onRemove && (
            <button
              onClick={onRemove}
              disabled={!!cargando || removing}
              style={{
                ...btnStyle(!!cargando || removing),
                background: 'rgba(192,80,80,0.12)',
                color: 'var(--danger-400)',
              }}
              title="Eliminar adjunto"
            >
              <Trash2 size={11} />
              {removing ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal detalle contratista ─────────────────────────────────────
function ModalDetalle({
  contratistaId,
  esCanalExcepciones,
  proveedores,
  onClose,
  onAction,
}: {
  contratistaId: number
  esCanalExcepciones?: boolean
  proveedores: ProveedorHSEOption[]
  onClose:       () => void
  onAction:      () => void
}) {
  const [data,      setData]      = useState<ContratistaDetalleResponse | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [accion,    setAccion]    = useState<'aprobar' | 'denegar' | 'eliminar' | null>(null)
  const [motivo,    setMotivo]    = useState('')
  const [saving,    setSaving]    = useState(false)
  const [savingProveedor, setSavingProveedor] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [tab,       setTab]       = useState<'info' | 'docs' | 'historial'>('info')
  const [showDesgloseDocs, setShowDesgloseDocs] = useState(false)
  const [removingAttachmentKey, setRemovingAttachmentKey] = useState<string | null>(null)
  const [proveedorEditId, setProveedorEditId] = useState<string>('')
  const [catalogos, setCatalogos] = useState<{ eps: any[]; arl: any[]; afp: any[] }>({ eps: [], arl: [], afp: [] })

  useEffect(() => {
    Promise.all([
      hseService.getContratista(contratistaId),
      hseService.getEPS(),
      hseService.getARL(),
      hseService.getAFP(),
    ]).then(([c, eps, arl, afp]) => {
      setData(c)
      setProveedorEditId(c.proveedor_id ? String(c.proveedor_id) : '')
      setCatalogos({ eps, arl, afp })
    }).catch(console.error).finally(() => setLoading(false))
  }, [contratistaId])

  const handleActualizarProveedor = async () => {
    if (!data) return
    const proveedorId = proveedorEditId ? Number(proveedorEditId) : null
    setSavingProveedor(true)
    setError(null)
    try {
      const updated = await hseService.actualizarProveedorContratista(contratistaId, proveedorId)
      setData(updated)
      setProveedorEditId(updated.proveedor_id ? String(updated.proveedor_id) : '')
      toast.success('Empresa/proveedor actualizada correctamente.')
      onAction()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingProveedor(false)
    }
  }

  const nombreCat = (lista: any[], id: number | undefined) =>
    lista.find(x => x.id === id)?.nombre ?? `ID ${id ?? '—'}`

  const estadoVig = (fecha: string | undefined): 'vencido' | 'proximo' | 'vigente' | null => {
    if (!fecha) return null
    const hoy = new Date(); hoy.setHours(0,0,0,0)
    const exp = new Date(fecha + 'T00:00:00')
    const diff = Math.floor((exp.getTime() - hoy.getTime()) / 86400000)
    if (diff < 0)   return 'vencido'
    if (diff <= 30) return 'proximo'
    return 'vigente'
  }

  const VigBadge = ({ fecha }: { fecha: string | undefined }) => {
    const e = estadoVig(fecha)
    if (!e) return <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>—</span>
    const cfg = {
      vencido: { color: 'var(--danger-400)',  text: '⚠ Vencido' },
      proximo: { color: '#4574C4',            text: '⚠ Vence pronto' },
      vigente: { color: 'var(--success-400)', text: '✓ Vigente' },
    }[e]
    return (
      <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 600 }}>
        {cfg.text} · {fecha}
      </span>
    )
  }

  const handleAprobar = async () => {
    setSaving(true)
    setError(null)
    try {
      await hseService.aprobarContratista(contratistaId)
      toast.success('Contratista aprobado correctamente.')
      onAction()
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDenegar = async () => {
    if (!motivo.trim() || motivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      toast.error('El motivo debe tener al menos 10 caracteres.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await hseService.denegarContratista(contratistaId, motivo)
      toast.success('Contratista denegado. Se reactivó su link de autogestión.')
      onAction()
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!motivo.trim() || motivo.length < 10) {
      setError('El motivo de eliminación debe tener al menos 10 caracteres.')
      toast.error('El motivo de eliminación debe tener al menos 10 caracteres.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await hseService.eliminarContratista(contratistaId, { motivo })
      toast.success('Contratista eliminado correctamente.')
      onAction()
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarAdjunto = async (
    modulo: 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen',
    campo: string,
    segSocialId?: number,
  ) => {
    const okDelete = window.confirm('¿Seguro que quieres eliminar este adjunto? Esta acción impacta la revisión.')
    if (!okDelete) return

    const key = `${modulo}:${campo}:${segSocialId ?? ''}`
    setRemovingAttachmentKey(key)
    setError(null)

    try {
      const updated = await hseService.eliminarAdjuntoContratista(contratistaId, {
        modulo,
        campo,
        seg_social_id: segSocialId,
      })
      setData(updated)
      toast.success('Adjunto eliminado correctamente.')
      onAction()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(msg)
    } finally {
      setRemovingAttachmentKey(null)
    }
  }

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.75)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         1000,
      padding:        '24px',
    }}>
      <div style={{
        width:         '100%',
        maxWidth:      '680px',
        maxHeight:     '90vh',
        background:    'var(--bg-surface)',
        border:        '1px solid var(--border-subtle)',
        borderRadius:  'var(--radius-xl)',
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding:        '20px 24px',
          borderBottom:   '1px solid var(--border-subtle)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width:          '36px',
              height:         '36px',
              background:     'rgba(86,104,184,0.1)',
              border:         '1px solid rgba(86,104,184,0.2)',
              borderRadius:   '50%',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <User size={16} color="#5668B8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading ? 'Cargando...' : `${data?.nombres} ${data?.apellidos}`}
              </h2>
              {data && (
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {data.tipo_documento} {data.numero_documento}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display:      'flex',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink:   0,
        }}>
          {([
            { key: 'info',     label: 'Información' },
            { key: 'docs',     label: 'Documentos' },
            { key: 'historial', label: 'Historial' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding:      '12px 20px',
                background:   'transparent',
                border:       'none',
                borderBottom: tab === t.key ? '2px solid var(--primary-500)' : '2px solid transparent',
                color:        tab === t.key ? 'var(--primary-400)' : 'var(--text-muted)',
                fontSize:     '0.8rem',
                fontWeight:   tab === t.key ? 600 : 400,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
                transition:   'all var(--transition-fast)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              Cargando información...
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger-400)', fontSize: '0.83rem' }}>
              Error al cargar el contratista.
            </div>
          ) : tab === 'info' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Datos personales */}
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  DATOS PERSONALES
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'Nombre completo', value: `${data.nombres} ${data.apellidos}` },
                    { label: 'Documento',       value: `${data.tipo_documento} ${data.numero_documento}` },
                    { label: 'Email',           value: data.email },
                    { label: 'Teléfono',        value: data.telefono ?? '—' },
                    { label: 'Extranjero',      value: data.es_extranjero ? 'Sí' : 'No' },
                    { label: 'Estado actual',   value: ESTADO_CONTRATISTA_LABEL[data.estado] },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      padding:      '10px 14px',
                      background:   'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.06em' }}>
                        {label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>
                  EMPRESA / PROVEEDOR
                </h3>
                <div style={{
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'grid',
                  gap: '10px',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Actual: <strong style={{ color: 'var(--text-primary)' }}>{data.proveedor_nombre || 'Sin empresa asignada'}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={proveedorEditId}
                      onChange={e => setProveedorEditId(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        padding: '8px 10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.8rem',
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      <option value="">Sin empresa/proveedor</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleActualizarProveedor}
                      disabled={savingProveedor || (proveedorEditId === (data.proveedor_id ? String(data.proveedor_id) : ''))}
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.78rem' }}
                    >
                      {savingProveedor ? 'Guardando...' : 'Guardar empresa'}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Restricción: si el contratista está adentro de la sede, no se permite cambiar su empresa/proveedor.
                  </div>
                </div>
              </section>

              {/* Clasificación */}
              {data.clasificacion && (
                <section>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    CLASIFICACIÓN DE ACTIVIDAD
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { key: 'trabajo_alturas',    label: 'Alturas' },
                      { key: 'espacios_confinados', label: 'Espacios confinados' },
                      { key: 'trabajo_electrico',  label: 'Trabajo eléctrico' },
                      { key: 'trabajo_caliente',   label: 'Trabajo en caliente' },
                      { key: 'izaje_maquinaria',   label: 'Izaje' },
                      { key: 'visita_sin_riesgo',  label: 'Visita sin riesgo' },
                      { key: 'genera_residuos',    label: 'Genera residuos' },
                    ].map(({ key, label }) => {
                      const activo = (data.clasificacion as any)[key]
                      return (
                        <span
                          key={key}
                          style={{
                            padding:      '4px 10px',
                            background:   activo ? 'rgba(192,80,80,0.08)' : 'var(--bg-elevated)',
                            border:       `1px solid ${activo ? 'rgba(192,80,80,0.2)' : 'var(--border-subtle)'}`,
                            borderRadius: '20px',
                            fontSize:     '0.72rem',
                            color:        activo ? 'var(--danger-400)' : 'var(--text-muted)',
                            fontWeight:   activo ? 600 : 400,
                          }}
                        >
                          {activo ? '⚠ ' : ''}{label}
                        </span>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Contacto emergencia */}
              {data.contacto_emergencia && (
                <section>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    CONTACTO DE EMERGENCIA
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Nombre',    value: data.contacto_emergencia.nombre_completo },
                      { label: 'Relación',  value: data.contacto_emergencia.relacion },
                      { label: 'Celular',   value: data.contacto_emergencia.telefono_celular },
                      { label: 'RH',        value: data.contacto_emergencia.rh_sanguineo ?? '—' },
                      { label: 'Alergias',  value: data.contacto_emergencia.alergias ?? '—' },
                      { label: 'EPS',       value: data.contacto_emergencia.eps_contratista ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        padding:      '10px 14px',
                        background:   'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.06em' }}>
                          {label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

          ) : tab === 'docs' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Revisa adjuntos y usa el panel derecho para desglosar casillas marcadas.
                </div>
                <button
                  type="button"
                  onClick={() => setShowDesgloseDocs(v => !v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showDesgloseDocs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showDesgloseDocs ? 'Ocultar desglose' : 'Ver desglose de verificación'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: showDesgloseDocs ? '1.6fr 1fr' : '1fr',
                gap: '16px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Alerta vencidos */}
                  {data.seguridad_social?.some(ss =>
                    estadoVig(ss.eps_vigencia) === 'vencido' ||
                    estadoVig(ss.arl_vigencia) === 'vencido' ||
                    estadoVig(ss.afp_vigencia) === 'vencido' ||
                    ss.pila_estado === 'VENCIDA'
                  ) && (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.25)', fontSize: '0.78rem', color: 'var(--danger-400)' }}>
                      ⚠ Este contratista tiene documentos vencidos. Considera denegar y solicitar actualización.
                    </div>
                  )}

                  {/* ── Archivos de clasificación ─────────────────── */}
                  {data.clasificacion && (() => {
                    const c = data.clasificacion as any
                    const archivos = [
                      { label: 'Certificado — Trabajo en alturas', path: c.alturas_cert_archivo, visible: c.trabajo_alturas, campo: 'alturas_cert_archivo' },
                      { label: 'Certificado — Espacios confinados', path: c.confinados_cert_archivo, visible: c.espacios_confinados, campo: 'confinados_cert_archivo' },
                      { label: 'Matrícula CONTEC — Trabajo eléctrico', path: c.electrico_matricula_archivo, visible: c.trabajo_electrico, campo: 'electrico_matricula_archivo' },
                      { label: 'Cert. extintor — Trabajo en caliente', path: c.caliente_extintor_archivo, visible: c.trabajo_caliente, campo: 'caliente_extintor_archivo' },
                      { label: 'Permiso — Trabajo en caliente', path: c.caliente_permiso_archivo, visible: c.trabajo_caliente, campo: 'caliente_permiso_archivo' },
                      { label: 'Inspección pre-operacional — Izaje', path: c.izaje_inspeccion_archivo, visible: c.izaje_maquinaria, campo: 'izaje_inspeccion_archivo' },
                      { label: 'Docs legales equipo — Izaje', path: c.izaje_doc_legal_archivo, visible: c.izaje_maquinaria, campo: 'izaje_doc_legal_archivo' },
                      { label: 'Licencia operador — Izaje', path: c.izaje_licencia_archivo, visible: c.izaje_maquinaria, campo: 'izaje_licencia_archivo' },
                      { label: 'Póliza — Personal extranjero', path: c.extran_poliza_archivo, visible: c.personal_extranjero, campo: 'extran_poliza_archivo' },
                      { label: 'Plan manejo de residuos', path: c.residuos_plan_archivo, visible: c.genera_residuos, campo: 'residuos_plan_archivo' },
                    ].filter(a => a.visible)

                    if (!archivos.length) return null
                    return (
                      <section>
                        <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>CERTIFICADOS DE ACTIVIDAD</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {archivos.map(a => (
                            <DocLink
                              key={a.label}
                              label={a.label}
                              path={a.path}
                              requerido
                              canRemove
                              removing={removingAttachmentKey === `clasificacion:${a.campo}:`}
                              onRemove={() => handleEliminarAdjunto('clasificacion', a.campo)}
                            />
                          ))}
                        </div>
                      </section>
                    )
                  })()}

                  {/* ── Seguridad social ──────────────────────────── */}
                  {data.seguridad_social?.length > 0 && data.seguridad_social.map((ss, i) => (
                    <section key={i}>
                      <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>
                        SEGURIDAD SOCIAL {!ss.es_titular && ss.nombre_persona ? `— ${ss.nombre_persona}` : '— TITULAR'}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        {[
                          { label: 'EPS', nombre: nombreCat(catalogos.eps, ss.eps_id), vigencia: ss.eps_vigencia },
                          { label: 'ARL', nombre: nombreCat(catalogos.arl, ss.arl_id), vigencia: ss.arl_vigencia },
                          { label: 'AFP', nombre: nombreCat(catalogos.afp, ss.afp_id), vigencia: ss.afp_vigencia },
                        ].map(({ label, nombre, vigencia }) => (
                          <div key={label} style={{
                            padding: '10px 12px', background: 'var(--bg-surface)',
                            borderRadius: '8px',
                            border: `1px solid ${estadoVig(vigencia) === 'vencido' ? 'rgba(192,80,80,0.3)' : estadoVig(vigencia) === 'proximo' ? 'rgba(69,116,196,0.3)' : 'var(--border-subtle)'}`,
                          }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.06em' }}>{label}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{nombre}</div>
                            <VigBadge fecha={vigencia} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginBottom: '8px', display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          PILA: <strong style={{ color: ss.pila_estado === 'PAGADA' ? 'var(--success-400)' : ss.pila_estado === 'VENCIDA' ? 'var(--danger-400)' : 'var(--text-secondary)' }}>
                            {ss.pila_estado === 'PAGADA' ? '✓ Pagada' : ss.pila_estado === 'VENCIDA' ? '⚠ Vencida' : ss.pila_estado ?? '—'}
                          </strong>
                        </span>
                        {ss.pila_tipo && <span style={{ color: 'var(--text-muted)' }}>Tipo: <strong style={{ color: 'var(--text-secondary)' }}>{ss.pila_tipo}</strong></span>}
                      </div>
                      <DocLink
                        label="Planilla PILA"
                        path={ss.pila_archivo}
                        requerido
                        canRemove
                        removing={removingAttachmentKey === `seg_social:pila_archivo:${ss.id}`}
                        onRemove={() => handleEliminarAdjunto('seg_social', 'pila_archivo', ss.id)}
                      />
                    </section>
                  ))}

                  {/* ── Certificaciones (ART + permiso) ───────────── */}
                  {data.certificaciones && (
                    <section>
                      <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>CERTIFICACIONES</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {data.certificaciones.permiso_tipo && (
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, background: 'rgba(86,104,184,0.1)', color: '#5668B8' }}>
                            Permiso: {data.certificaciones.permiso_tipo}
                          </span>
                        )}
                        {data.certificaciones.permiso_fecha && (
                          <VigBadge fecha={data.certificaciones.permiso_fecha} />
                        )}
                      </div>
                      {data.certificaciones.art_descripcion_tarea && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.04em' }}>ART — </span>
                          {data.certificaciones.art_descripcion_tarea}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <DocLink
                          label="ART diligenciada"
                          path={data.certificaciones.art_archivo}
                          requerido
                          canRemove
                          removing={removingAttachmentKey === 'certificaciones:art_archivo:'}
                          onRemove={() => handleEliminarAdjunto('certificaciones', 'art_archivo')}
                        />
                        <DocLink
                          label="Permiso de trabajo"
                          path={data.certificaciones.permiso_archivo}
                          requerido={!!data.certificaciones.permiso_tipo}
                          canRemove
                          removing={removingAttachmentKey === 'certificaciones:permiso_archivo:'}
                          onRemove={() => handleEliminarAdjunto('certificaciones', 'permiso_archivo')}
                        />
                      </div>
                    </section>
                  )}

                  {/* ── Examen médico ─────────────────────────────── */}
                  {data.examen_medico && (
                    <section>
                      <h3 style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>EXAMEN MÉDICO OCUPACIONAL</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          background: data.examen_medico.concepto === 'APTO' ? 'rgba(40,149,108,0.1)' : data.examen_medico.concepto === 'NO_APTO' ? 'rgba(192,80,80,0.1)' : 'rgba(69,116,196,0.1)',
                          color: data.examen_medico.concepto === 'APTO' ? 'var(--success-400)' : data.examen_medico.concepto === 'NO_APTO' ? 'var(--danger-400)' : '#4574C4',
                        }}>
                          {data.examen_medico.concepto ?? '—'}
                        </span>
                        <VigBadge fecha={data.examen_medico.fecha_examen} />
                      </div>
                      {data.examen_medico.descripcion_restriccion && (
                        <div style={{ marginBottom: '8px', fontSize: '0.78rem', color: 'var(--danger-400)' }}>
                          ⚠ Restricción: {data.examen_medico.descripcion_restriccion}
                        </div>
                      )}
                      <DocLink
                        label="Examen médico ocupacional (PDF)"
                        path={data.examen_medico.archivo}
                        requerido
                        canRemove
                        removing={removingAttachmentKey === 'examen:archivo:'}
                        onRemove={() => handleEliminarAdjunto('examen', 'archivo')}
                      />
                    </section>
                  )}

                  {!data.seguridad_social?.length && !data.certificaciones && !data.examen_medico && !data.clasificacion && (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                      No hay documentos registrados aún.
                    </div>
                  )}
                </div>

                {showDesgloseDocs && (
                  <aside style={{
                    position: 'sticky',
                    top: '8px',
                    alignSelf: 'start',
                    padding: '14px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                    display: 'grid',
                    gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Panel derecho
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Desglose de verificación
                      </div>
                    </div>

                    {data.clasificacion && (
                      <div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                          Casillas marcadas
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {[
                            { key: 'trabajo_alturas', label: 'Trabajo en alturas' },
                            { key: 'espacios_confinados', label: 'Espacios confinados' },
                            { key: 'trabajo_electrico', label: 'Trabajo eléctrico' },
                            { key: 'trabajo_caliente', label: 'Trabajo en caliente' },
                            { key: 'izaje_maquinaria', label: 'Izaje de maquinaria' },
                            { key: 'visita_sin_riesgo', label: 'Visita sin riesgo' },
                            { key: 'personal_extranjero', label: 'Personal extranjero' },
                            { key: 'genera_residuos', label: 'Genera residuos' },
                          ].map(({ key, label }) => {
                            const activo = Boolean((data.clasificacion as any)[key])
                            return (
                              <div key={key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 9px',
                                borderRadius: '8px',
                                background: activo ? 'rgba(192,80,80,0.08)' : 'var(--bg-surface)',
                                border: `1px solid ${activo ? 'rgba(192,80,80,0.2)' : 'var(--border-subtle)'}`,
                                fontSize: '0.74rem',
                              }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                <span style={{ color: activo ? 'var(--danger-400)' : 'var(--text-muted)', fontWeight: 700 }}>
                                  {activo ? 'Sí' : 'No'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '10px',
                    }}>
                      Si algo se adjuntó por error, usa los botones Eliminar en cada documento y luego solicita al contratista volver a cargar el archivo correcto.
                    </div>
                  </aside>
                )}
              </div>
            </div>

          ) : (
            <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>
              Historial de cambios próximamente.
            </div>
          )}
        </div>

        {/* Footer — acciones */}
        {data && !accion && (
          <div style={{
            padding:        '12px 24px',
            borderTop:      '1px solid var(--border-subtle)',
            display:        'flex',
            gap:            '10px',
            justifyContent: 'space-between',
            alignItems:     'center',
            flexShrink:     0,
          }}>
            {/* Eliminar — siempre visible */}
            <button
              onClick={() => { setAccion('eliminar'); setMotivo(''); setError(null) }}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '8px 16px',
                background:   'transparent',
                border:       '1px solid rgba(192,80,80,0.3)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--danger-400)',
                fontSize:     '0.8rem',
                fontWeight:   500,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
              }}
            >
              <Trash2 size={13} />
              Eliminar contratista
            </button>

            {!esCanalExcepciones ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (data.estado !== 'AUTOGESTION_COMPLETADA') return
                      setAccion('denegar')
                    }}
                    disabled={data.estado !== 'AUTOGESTION_COMPLETADA'}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '6px',
                      padding:      '9px 18px',
                      background:   'rgba(192,80,80,0.08)',
                      border:       '1px solid rgba(192,80,80,0.2)',
                      borderRadius: 'var(--radius-md)',
                      color:        'var(--danger-400)',
                      fontSize:     '0.83rem',
                      fontWeight:   600,
                      cursor:       data.estado !== 'AUTOGESTION_COMPLETADA' ? 'not-allowed' : 'pointer',
                      fontFamily:   'var(--font-ui)',
                      opacity:      data.estado !== 'AUTOGESTION_COMPLETADA' ? 0.45 : 1,
                    }}
                    title={
                      data.estado !== 'AUTOGESTION_COMPLETADA'
                        ? 'Se habilita cuando el contratista complete su autogestión.'
                        : 'Denegar contratista'
                    }
                  >
                    <XCircle size={14} />
                    Denegar
                  </button>
                  <button
                    onClick={handleAprobar}
                    disabled={saving || data.estado !== 'AUTOGESTION_COMPLETADA'}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '6px',
                      padding:      '9px 18px',
                      background:   saving ? 'var(--success-600)' : 'var(--success-500, #28956C)',
                      border:       'none',
                      borderRadius: 'var(--radius-md)',
                      color:        'white',
                      fontSize:     '0.83rem',
                      fontWeight:   600,
                      cursor:       (saving || data.estado !== 'AUTOGESTION_COMPLETADA') ? 'not-allowed' : 'pointer',
                      fontFamily:   'var(--font-ui)',
                      opacity:      data.estado !== 'AUTOGESTION_COMPLETADA' ? 0.45 : 1,
                    }}
                    title={
                      data.estado !== 'AUTOGESTION_COMPLETADA'
                        ? 'Se habilita cuando el contratista complete su autogestión.'
                        : 'Aprobar contratista'
                    }
                  >
                    <CheckCircle2 size={14} />
                    {saving ? 'Aprobando...' : 'Aprobar'}
                  </button>
                </div>
                {data.estado !== 'AUTOGESTION_COMPLETADA' && (
                  <span style={{
                    fontSize:   '0.7rem',
                    color:      'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    Disponible al pasar a estado: AUTOGESTION COMPLETADA.
                  </span>
                )}
              </div>
            ) : (
              <span style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                Canal de excepciones: no requiere aprobar o denegar.
              </span>
            )}
          </div>
        )}

        {/* Panel denegar */}
        {accion === 'denegar' && !esCanalExcepciones && (
          <div style={{
            padding:   '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}>
            {error && (
              <div style={{
                padding:      '8px 12px',
                background:   'rgba(192,80,80,0.08)',
                border:       '1px solid rgba(192,80,80,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize:     '0.78rem',
                color:        'var(--danger-400)',
                marginBottom: '10px',
              }}>
                {error}
              </div>
            )}
            <label style={{
              display:       'block',
              fontSize:      '0.72rem',
              fontWeight:    500,
              color:         'var(--text-secondary)',
              marginBottom:  '6px',
              letterSpacing: '0.04em',
            }}>
              MOTIVO DE DENEGACIÓN (mínimo 10 caracteres)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Explica qué debe corregir o completar el contratista..."
              rows={3}
              style={{
                width:        '100%',
                padding:      '9px 12px',
                fontSize:     '0.83rem',
                background:   'var(--bg-elevated)',
                border:       '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--text-primary)',
                fontFamily:   'var(--font-ui)',
                outline:      'none',
                resize:       'vertical',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAccion(null); setMotivo(''); setError(null) }}
                style={{
                  padding:      '8px 16px',
                  background:   'transparent',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-secondary)',
                  fontSize:     '0.8rem',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDenegar}
                disabled={saving}
                style={{
                  padding:      '8px 16px',
                  background:   'var(--danger-500, #C05050)',
                  border:       'none',
                  borderRadius: 'var(--radius-md)',
                  color:        'white',
                  fontSize:     '0.8rem',
                  fontWeight:   600,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                {saving ? 'Enviando...' : 'Confirmar denegación'}
              </button>
            </div>
          </div>
        )}

        {/* Panel eliminar */}
        {accion === 'eliminar' && (
          <div style={{
            padding:   '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}>
            {/* Aviso destructivo */}
            <div style={{
              display:      'flex',
              alignItems:   'flex-start',
              gap:          '10px',
              padding:      '10px 14px',
              background:   'rgba(192,80,80,0.06)',
              border:       '1px solid rgba(192,80,80,0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '12px',
            }}>
              <AlertTriangle size={15} style={{ color: 'var(--danger-400)', marginTop: '1px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--danger-400)', lineHeight: 1.5 }}>
                Esta acción es <strong>irreversible</strong>. El contratista será eliminado de la autorización
                y quedará registrado en el historial con tu usuario, la fecha y el motivo indicado.
              </span>
            </div>

            {error && (
              <div style={{
                padding:      '8px 12px',
                background:   'rgba(192,80,80,0.08)',
                border:       '1px solid rgba(192,80,80,0.2)',
                borderRadius: 'var(--radius-md)',
                fontSize:     '0.78rem',
                color:        'var(--danger-400)',
                marginBottom: '10px',
              }}>
                {error}
              </div>
            )}

            <label style={{
              display:       'block',
              fontSize:      '0.72rem',
              fontWeight:    500,
              color:         'var(--text-secondary)',
              marginBottom:  '6px',
              letterSpacing: '0.04em',
            }}>
              MOTIVO DE ELIMINACIÓN (mínimo 10 caracteres)
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Describe por qué se elimina este contratista de la autorización..."
              rows={3}
              style={{
                width:        '100%',
                padding:      '9px 12px',
                fontSize:     '0.83rem',
                background:   'var(--bg-elevated)',
                border:       '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--text-primary)',
                fontFamily:   'var(--font-ui)',
                outline:      'none',
                resize:       'vertical',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setAccion(null); setMotivo(''); setError(null) }}
                style={{
                  padding:      '8px 16px',
                  background:   'transparent',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-secondary)',
                  fontSize:     '0.8rem',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={saving}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '8px 16px',
                  background:   saving ? '#b91c1c' : 'var(--danger-500, #C05050)',
                  border:       'none',
                  borderRadius: 'var(--radius-md)',
                  color:        'white',
                  fontSize:     '0.8rem',
                  fontWeight:   600,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                <Trash2 size={13} />
                {saving ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ESTADOS_GESTION = [
  { value: 'todos',                 label: 'Todos' },
  { value: 'PENDIENTE_AUTOGESTION', label: 'Pendiente' },
  { value: 'EN_REVISION',           label: 'En revisión' },
  { value: 'APROBADO',              label: 'Aprobado' },
  { value: 'DENEGADO',              label: 'Denegado' },
  { value: 'VENCIDO',               label: 'Vencido' },
] as const

// ── Vista principal ───────────────────────────────────────────────
export default function GestionHSEView() {
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const [searchParams, setSearchParams] = useSearchParams()
  const [paginaActiva, setPaginaActiva] = useState<'normales' | 'alto_riesgo'>('normales')

  const [autorizaciones, setAutorizaciones] = useState<AutorizacionListResponse[]>([])
  const [proveedores, setProveedores] = useState<ProveedorHSEOption[]>([])
  const [proveedoresMap, setProveedoresMap] = useState<Record<number, string>>({})
  const [loading,        setLoading]        = useState(true)
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroEstado,   setFiltroEstado]   = useState<string>('todos')
  const [modalId,        setModalId]        = useState<number | null>(null)
  const [modalEsExcepcion, setModalEsExcepcion] = useState(false)
  const [refresh,        setRefresh]        = useState(0)
  const [renovandoTokenId, setRenovandoTokenId] = useState<number | null>(null)
  const [tokenRecienGenerado, setTokenRecienGenerado] = useState<Record<number, { token: string; expiraEn: string }>>({})

  useEffect(() => {
    const load = async () => {
      if (!sedeActiva?.id) {
        setAutorizaciones([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params: any = { sede_id: sedeActiva.id, per_page: 100 }
        if (filtroEstado !== 'todos') params.estado = filtroEstado
        const lista = await hseService.listarAutorizaciones(params)
        setAutorizaciones(lista)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refresh, sedeActiva?.id, filtroEstado])

  useEffect(() => {
    const loadProveedores = async () => {
      try {
        const proveedores = await hseService.getProveedores()
        setProveedores(proveedores)
        const map: Record<number, string> = {}
        for (const p of proveedores) map[p.id] = p.nombre
        setProveedoresMap(map)
      } catch {
        setProveedores([])
        setProveedoresMap({})
      }
    }
    void loadProveedores()
  }, [])


  useEffect(() => {
    const contratistaIdParam = searchParams.get('contratista_id')
    if (!contratistaIdParam) return

    const contratistaId = Number(contratistaIdParam)
    if (Number.isFinite(contratistaId) && contratistaId > 0) {
      setModalId(contratistaId)
      setModalEsExcepcion(false)
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('contratista_id')
    nextParams.delete('autorizacion_id')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const formatNombreCompleto = (nombres: string, apellidos: string) => {
    const n = (nombres || '').trim()
    const a = (apellidos || '').trim()
    if (!n && !a) return 'Sin nombre'
    if (!a || a.toUpperCase() === 'N/A') return n || 'Sin nombre'
    return `${n} ${a}`.trim()
  }


  // Canal Excepciones = autorizaciones cuya descripción fue creada desde el submódulo de Excepciones
  const esExcepcion = (a: AutorizacionListResponse) =>
    /^excepci[oó]n\s*hse\s*:/i.test((a.descripcion_actividad || '').trim())

  const resolverProveedorId = (a: AutorizacionListResponse): number | null => a.proveedor_id ?? null

  // Dos grupos por tipo — las excepciones se excluyen (pertenecen a su propio submódulo)
  const esExcepcionRobusta = (a: AutorizacionListResponse) =>
    esExcepcion(a) || (a.descripcion_actividad || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .startsWith('excepcion hse:')

  const autorizacionesNormales   = autorizaciones.filter(a => a.tipo_contratista === 'NORMAL'   && !esExcepcionRobusta(a))
  const autorizacionesAltoRiesgo = autorizaciones.filter(a => a.tipo_contratista === 'ALTO_RIESGO' && !esExcepcionRobusta(a))

  const buildGrupos = (
    lista: AutorizacionListResponse[],
    tone: (proveedorId: number | null) => string,
    prefixTitle: string,
  ) =>
    Object.values(
      lista.reduce<Record<string, { label: string; items: AutorizacionListResponse[]; tone: string; esSinEmpresa: boolean }>>((acc, a) => {
        const proveedorId = resolverProveedorId(a)
        const key = proveedorId ? `prov-${proveedorId}` : 'sin-proveedor'
        if (!acc[key]) {
          acc[key] = {
            label: proveedorId
              ? `Empresa: ${proveedoresMap[proveedorId] || `Proveedor #${proveedorId}`}`
              : 'Sin empresa asignada',
            items: [],
            tone: tone(proveedorId),
            esSinEmpresa: proveedorId === null,
          }
        }
        acc[key].items.push(a)
        return acc
      }, {}),
    )
      .sort((a, b) => {
        if (a.esSinEmpresa && !b.esSinEmpresa) return -1
        if (!a.esSinEmpresa && b.esSinEmpresa) return 1
        return a.label.localeCompare(b.label)
      })
      .map(g => ({ title: `${prefixTitle} · ${g.label}`, items: g.items, tone: g.tone }))
      .filter(s => s.items.length > 0)

  const seccionesNormales   = buildGrupos(autorizacionesNormales,   () => 'rgba(86,104,184,0.05)', 'Flujo estándar')
  const seccionesAltoRiesgo = buildGrupos(autorizacionesAltoRiesgo, () => 'rgba(192,80,80,0.04)',  'Alto Riesgo')

  const seccionesRender    = paginaActiva === 'normales' ? seccionesNormales : seccionesAltoRiesgo
  const totalPaginaActiva  = paginaActiva === 'normales' ? autorizacionesNormales.length : autorizacionesAltoRiesgo.length

  const totalNormales   = autorizacionesNormales.length
  const totalAltoRiesgo = autorizacionesAltoRiesgo.length

  const pendientesRevision = autorizaciones.flatMap(a =>
    a.contratistas.filter(c =>
      c.estado === 'AUTOGESTION_COMPLETADA' || c.estado === 'EN_REVISION'
    )
  ).length

  const handleRenovarLink = async (contratistaId: number) => {
    setRenovandoTokenId(contratistaId)
    try {
      const duracionHoras = 48
      const nuevoToken = await hseService.renovarToken(contratistaId, duracionHoras)
      const nuevaExpiracion = new Date(Date.now() + duracionHoras * 60 * 60 * 1000).toISOString()

      setAutorizaciones(prev => prev.map(a => ({
        ...a,
        contratistas: (a.contratistas || []).map(c =>
          c.id === contratistaId
            ? {
                ...c,
                token_autogestion: nuevoToken,
                token_expira_en: nuevaExpiracion,
              }
            : c,
        ),
      })))

      setTokenRecienGenerado(prev => ({
        ...prev,
        [contratistaId]: { token: nuevoToken, expiraEn: nuevaExpiracion },
      }))

      toast.success('Link de autogestión regenerado correctamente.')

      setTimeout(() => {
        setTokenRecienGenerado(prev => {
          const next = { ...prev }
          delete next[contratistaId]
          return next
        })
      }, 8000)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setRenovandoTokenId(null)
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>

      {/* Header */}
      <div
        style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
        className="animate-fade-up"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={14} color="#5668B8" />
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.68rem',
              color:         '#5668B8',
              letterSpacing: '0.12em',
            }}>
              HSE / GESTIÓN
            </span>
          </div>
          <h1 style={{
            fontSize:      '1.5rem',
            fontWeight:    700,
            color:         'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom:  '4px',
          }}>
            Gestión HSE
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {pendientesRevision} contratista{pendientesRevision !== 1 ? 's' : ''} pendiente{pendientesRevision !== 1 ? 's' : ''} de revisión
          </p>
        </div>
        <button
          onClick={() => setRefresh(r => r + 1)}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 14px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--text-secondary)',
            fontSize:     '0.8rem',
            cursor:       'pointer',
            fontFamily:   'var(--font-ui)',
          }}
        >
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', maxWidth: '320px', marginBottom: '20px' }} className="animate-fade-up stagger-1">
        <Search size={14} style={{
          position:  'absolute',
          left:      '12px',
          top:       '50%',
          transform: 'translateY(-50%)',
          color:     'var(--text-muted)',
        }} />
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width:        '100%',
            padding:      '9px 12px 9px 36px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color:        'var(--text-primary)',
            fontSize:     '0.83rem',
            fontFamily:   'var(--font-ui)',
            outline:      'none',
          }}
        />
      </div>

      {/* Filtros de estado */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }} className="animate-fade-up stagger-1">
        {ESTADOS_GESTION.map(e => (
          <button
            key={e.value}
            onClick={() => setFiltroEstado(e.value)}
            style={{
              padding:      '7px 14px',
              borderRadius: 'var(--radius-md)',
              border:       `1px solid ${filtroEstado === e.value ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
              background:   filtroEstado === e.value ? 'var(--primary-500)' : 'var(--bg-surface)',
              color:        filtroEstado === e.value ? 'var(--text-inverted)' : 'var(--text-secondary)',
              fontSize:     '0.78rem',
              fontWeight:   filtroEstado === e.value ? 600 : 400,
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
              transition:   'all var(--transition-fast)',
            }}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Paginación interna por tipo */}
      <div
        style={{
          marginBottom:   '16px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '12px',
          padding:        '8px',
          borderRadius:   'var(--radius-xl)',
          border:         '1px solid var(--border-subtle)',
          background:     'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
        }}
        className="animate-fade-up stagger-2"
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Tab: Flujo Estándar */}
          <button
            onClick={() => setPaginaActiva('normales')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px',
              borderRadius: 'var(--radius-lg)',
              border:      `1px solid ${paginaActiva === 'normales' ? 'rgba(86,104,184,0.35)' : 'transparent'}`,
              background:  paginaActiva === 'normales' ? 'rgba(86,104,184,0.12)' : 'transparent',
              color:       paginaActiva === 'normales' ? '#5668B8' : 'var(--text-secondary)',
              fontSize: '0.79rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'all var(--transition-fast)',
              boxShadow: paginaActiva === 'normales' ? '0 8px 18px rgba(86,104,184,0.16)' : 'none',
            }}
          >
            <FileIcon size={13} />
            Flujo Estándar
            <span style={{
              padding: '1px 8px', borderRadius: '999px',
              background: paginaActiva === 'normales' ? 'rgba(86,104,184,0.18)' : 'var(--bg-elevated)',
              color: 'inherit', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
            }}>
              {totalNormales}
            </span>
          </button>

          {/* Tab: Alto Riesgo */}
          <button
            onClick={() => setPaginaActiva('alto_riesgo')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px',
              borderRadius: 'var(--radius-lg)',
              border:      `1px solid ${paginaActiva === 'alto_riesgo' ? 'rgba(192,80,80,0.4)' : 'transparent'}`,
              background:  paginaActiva === 'alto_riesgo' ? 'rgba(192,80,80,0.1)' : 'transparent',
              color:       paginaActiva === 'alto_riesgo' ? 'var(--danger-400)' : 'var(--text-secondary)',
              fontSize: '0.79rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'all var(--transition-fast)',
              boxShadow: paginaActiva === 'alto_riesgo' ? '0 8px 18px rgba(192,80,80,0.18)' : 'none',
            }}
          >
            <AlertTriangle size={13} />
            Alto Riesgo
            <span style={{
              padding: '1px 8px', borderRadius: '999px',
              background: paginaActiva === 'alto_riesgo' ? 'rgba(192,80,80,0.15)' : 'var(--bg-elevated)',
              color: 'inherit', fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
            }}>
              {totalAltoRiesgo}
            </span>
          </button>

        </div>

        <div style={{
          fontSize: '0.72rem', color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', padding: '0 8px',
        }}>
          {paginaActiva === 'normales'    && 'Contratistas NORMAL'}
          {paginaActiva === 'alto_riesgo' && 'Contratistas ALTO RIESGO'}
        </div>
      </div>

      {/* Lista de autorizaciones con contratistas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-up stagger-2">
        {!sedeActiva ? (
          <div style={{
            padding:      '48px',
            textAlign:    'center',
            color:        'var(--text-muted)',
            fontSize:     '0.83rem',
            background:   'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border:       '1px solid var(--border-subtle)',
          }}>
            Selecciona una sede en la barra superior para ver los contratistas.
          </div>
        ) : loading ? (
          <div style={{
            padding:        '48px',
            textAlign:      'center',
            color:          'var(--text-muted)',
            fontSize:       '0.83rem',
            background:     'var(--bg-surface)',
            borderRadius:   'var(--radius-xl)',
            border:         '1px solid var(--border-subtle)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '10px',
            boxShadow:      'var(--shadow-card)',
          }}>
            <div style={{
              width:        '16px',
              height:       '16px',
              border:       '2px solid var(--border-default)',
              borderTop:    '2px solid var(--primary-500)',
              borderRadius: '50%',
              animation:    'spin 1s linear infinite',
            }} />
            Cargando solicitudes...
          </div>
        ) : totalPaginaActiva === 0 ? (
          <div style={{
            padding:      '48px',
            textAlign:    'center',
            color:        'var(--text-muted)',
            fontSize:     '0.83rem',
            background:   'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border:       '1px solid var(--border-subtle)',
          }}>
            No hay autorizaciones en{' '}
          {paginaActiva === 'normales' ? 'el flujo estándar (NORMAL)' : 'el canal de alto riesgo'}
          {filtroEstado !== 'todos' ? ` con estado "${ESTADOS_GESTION.find(e => e.value === filtroEstado)?.label}"` : ''}.
          </div>
        ) : (
          seccionesRender.map((section, sectionIndex) => {
            const totalContratistasSeccion = section.items.reduce((acc, item) => acc + (item.contratistas?.length || 0), 0)
            const empresaLabel = section.title.includes('·')
              ? section.title.split('·').slice(1).join('·').trim()
              : section.title

            return (
            <div key={`${section.title}-${sectionIndex}`}>
              {sectionIndex > 0 && (
                <div
                  style={{
                    height: '1px',
                    width: '100%',
                    margin: '4px 0 8px',
                    background: 'linear-gradient(90deg, transparent 0%, var(--border-strong) 16%, var(--border-strong) 84%, transparent 100%)',
                  }}
                />
              )}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft:
                    paginaActiva === 'normales'    ? '4px solid rgba(86,104,184,0.5)'  :
                    paginaActiva === 'alto_riesgo' ? '4px solid rgba(192,80,80,0.5)'   :
                    '4px solid rgba(69,116,196,0.5)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: section.tone,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'grid', gap: '2px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Empresa / proveedor
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {empresaLabel}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {section.items.length} autorizacione{section.items.length !== 1 ? 's' : ''} · {totalContratistasSeccion} contratista{totalContratistasSeccion !== 1 ? 's' : ''}
                  </span>
                </div>
                {section.items.map(a => (
              <div
                key={a.id}
                style={{
                  background:   'var(--bg-surface)',
                  border:       '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  overflow:     'hidden',
                  boxShadow:    'var(--shadow-card)',
                }}
              >
                {/* Cabecera autorización */}
                <div style={{
                  padding:     '12px 20px',
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '12px',
                  borderBottom:'1px solid var(--border-subtle)',
                  background:  'var(--bg-elevated)',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>
                    {a.codigo}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem',
                    background: a.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(192,80,80,0.08)' : 'rgba(40,149,108,0.08)',
                    color: a.tipo_contratista === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)',
                  }}>
                    {a.tipo_contratista === 'ALTO_RIESGO' ? '⚠ Alto Riesgo' : 'Normal'}
                  </span>
                  {a.descripcion_actividad && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {a.descripcion_actividad}
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    {a.contratistas.length} contratista{a.contratistas.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Contratistas — siempre visibles */}
                <div>
                    {a.contratistas
                      .filter(c =>
                        busqueda === '' ||
                        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
                        c.numero_documento.includes(busqueda)
                      )
                      .map((c, i, arr) => {
                        const esFilaExcepcion = esExcepcion(a)
                        return (
                        <div
                          key={c.id}
                          style={{
                            padding:      '12px 20px',
                            borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width:          '32px',
                              height:         '32px',
                              borderRadius:   '50%',
                              background:     'rgba(86,104,184,0.1)',
                              border:         '1px solid rgba(86,104,184,0.2)',
                              display:        'flex',
                              alignItems:     'center',
                              justifyContent: 'center',
                              fontSize:       '0.78rem',
                              fontWeight:     600,
                              color:          '#5668B8',
                              flexShrink:     0,
                            }}>
                              {formatNombreCompleto(c.nombres, c.apellidos).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {formatNombreCompleto(c.nombres, c.apellidos)}
                              </div>
                              <div style={{
                                fontSize:   '0.72rem',
                                color:      'var(--text-muted)',
                                fontFamily: 'var(--font-mono)',
                              }}>
                                {c.tipo_documento} {c.numero_documento}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ContratistaBadge estado={c.estado} />
                            {!esFilaExcepcion && (
                              <>
                                <TokenTimer expiraEn={c.token_expira_en} />
                                <button
                                  onClick={() => handleRenovarLink(c.id)}
                                  disabled={renovandoTokenId === c.id}
                                  className="btn-ghost"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    opacity: renovandoTokenId === c.id ? 0.65 : 1,
                                  }}
                                  title="Regenerar link de autogestión"
                                >
                                  {renovandoTokenId === c.id ? 'Generando...' : 'Regenerar link'}
                                </button>
                                {c.token_autogestion && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}portal/hse/${c.token_autogestion}`);
                                      toast.success(`Link de autogestión copiado para ${formatNombreCompleto(c.nombres, c.apellidos)}.`)
                                      const btn = e.currentTarget;
                                      const originalHtml = btn.innerHTML;
                                      btn.innerHTML = '¡Copiado!';
                                      setTimeout(() => btn.innerHTML = originalHtml, 2000);
                                    }}
                                    className="btn-ghost"
                                    style={{
                                      display:      'flex',
                                      alignItems:   'center',
                                      gap:          '4px',
                                      padding:      '6px 12px',
                                      fontSize:     '0.75rem',
                                      fontWeight:   600,
                                    }}
                                    title="Copiar link de autogestión"
                                  >
                                    <Copy size={12} />
                                    Copiar Link
                                  </button>
                                )}
                                {tokenRecienGenerado[c.id] && (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: 'rgba(40,149,108,0.12)',
                                    border: '1px solid rgba(40,149,108,0.3)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--success-400)',
                                    animation: 'fadeUp 220ms ease both',
                                  }}>
                                    <CheckCircle2 size={13} />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Link generado</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigator.clipboard.writeText(`${window.location.origin}${import.meta.env.BASE_URL}portal/hse/${tokenRecienGenerado[c.id].token}`)
                                        toast.success(`Nuevo link copiado para ${formatNombreCompleto(c.nombres, c.apellidos)}.`)
                                      }}
                                      className="btn-ghost"
                                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                    >
                                      Copiar nuevo
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => {
                                setModalId(c.id)
                                setModalEsExcepcion(esExcepcion(a))
                              }}
                              style={{
                                display:      'flex',
                                alignItems:   'center',
                                gap:          '4px',
                                padding:      '6px 12px',
                                background:   'rgba(86,104,184,0.08)',
                                border:       '1px solid rgba(86,104,184,0.2)',
                                borderRadius: 'var(--radius-md)',
                                color:        '#5668B8',
                                fontSize:     '0.75rem',
                                fontWeight:   600,
                                cursor:       'pointer',
                                fontFamily:   'var(--font-ui)',
                              }}
                            >
                              <Eye size={12} />
                              Revisar
                            </button>
                          </div>
                        </div>
                        )
                      })
                    }
                </div>
              </div>
              ))}
            </div>
            </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {modalId !== null && (
        <ModalDetalle
          contratistaId={modalId}
          esCanalExcepciones={modalEsExcepcion}
          proveedores={proveedores}
          onClose={() => setModalId(null)}
          onAction={() => setRefresh(r => r + 1)}
        />
      )}
    </div>
  )
}
