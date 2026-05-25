/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Verificación de Cumplimiento HSE
 */

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ClipboardCheck, Search, CheckCircle2, XCircle,
  Clock, AlertTriangle,
  PenLine, Lock, ChevronDown, ChevronUp,
  Eye, Download, Trash2,
} from 'lucide-react'
import { useSedeStore } from '@/store/sedeStore'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import type {
  AutorizacionListResponse,
  CumplimientoListadoResponse,
  CumplimientoResponse,
  CumplimientoItemResponse,
  ContratistaDetalleResponse,
  EstadoContratista,
  EstadoCumplimiento,
} from '@/types/hse'

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'No disponible'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Badge estado cumplimiento ─────────────────────────────────────
function CumplimientoBadge({ estado }: { estado: EstadoCumplimiento }) {
  const config = {
    EN_PROGRESO:    { color: 'var(--primary-400)',  bg: 'rgba(69,116,196,0.08)',  label: 'En progreso' },
    COMPLETADO:     { color: 'var(--success-400)',  bg: 'rgba(40,149,108,0.08)', label: 'Completado'  },
    INCUMPLIMIENTO: { color: 'var(--danger-400)',   bg: 'rgba(192,80,80,0.08)',  label: 'Incumplimiento' },
  }
  const { color, bg, label } = config[estado]
  return (
    <span style={{
      padding:      '3px 10px',
      background:   bg,
      borderRadius: '20px',
      fontSize:     '0.7rem',
      color,
      fontWeight:   500,
    }}>
      {label}
    </span>
  )
}

// ── Item del checklist ────────────────────────────────────────────
function ChecklistItem({
  item,
  editable,
  onChange,
}: {
  item:     CumplimientoItemResponse
  editable: boolean
  onChange: (id: number, cumple: boolean | null, obs: string) => void
}) {
  const [showObs, setShowObs] = useState(false)
  const [obs,     setObs]     = useState(item.observacion ?? '')

  const bgColor = item.cumple === true
    ? 'rgba(40,149,108,0.06)'
    : item.cumple === false
      ? 'rgba(192,80,80,0.06)'
      : 'var(--bg-elevated)'

  const borderColor = item.cumple === true
    ? 'rgba(40,149,108,0.2)'
    : item.cumple === false
      ? 'rgba(192,80,80,0.2)'
      : 'var(--border-subtle)'

  return (
    <div style={{
      padding:      '14px 16px',
      background:   bgColor,
      border:       `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      transition:   'all var(--transition-fast)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        {/* Número + pregunta */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <span style={{
            fontFamily:  'var(--font-mono)',
            fontSize:    '0.7rem',
            color:       'var(--text-muted)',
            marginTop:   '2px',
            flexShrink:  0,
          }}>
            {String(item.orden).padStart(2, '0')}
          </span>
          <div>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {item.pregunta}
            </p>
            {item.observacion && !showObs && (
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Obs: {item.observacion}
              </p>
            )}
          </div>
        </div>

        {/* Botones SI/NO */}
        {editable ? (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => {
                onChange(item.id, true, obs)
                setShowObs(false)
              }}
              style={{
                padding:      '5px 12px',
                background:   item.cumple === true ? 'rgba(40,149,108,0.15)' : 'var(--bg-surface)',
                border:       `1px solid ${item.cumple === true ? 'rgba(40,149,108,0.4)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                color:        item.cumple === true ? 'var(--success-400)' : 'var(--text-muted)',
                fontSize:     '0.75rem',
                fontWeight:   item.cumple === true ? 700 : 400,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
                transition:   'all var(--transition-fast)',
              }}
            >
              ✓ Sí
            </button>
            <button
              onClick={() => {
                onChange(item.id, false, obs)
                setShowObs(true)
              }}
              style={{
                padding:      '5px 12px',
                background:   item.cumple === false ? 'rgba(192,80,80,0.1)' : 'var(--bg-surface)',
                border:       `1px solid ${item.cumple === false ? 'rgba(192,80,80,0.3)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                color:        item.cumple === false ? 'var(--danger-400)' : 'var(--text-muted)',
                fontSize:     '0.75rem',
                fontWeight:   item.cumple === false ? 700 : 400,
                cursor:       'pointer',
                fontFamily:   'var(--font-ui)',
                transition:   'all var(--transition-fast)',
              }}
            >
              ✗ No
            </button>
            <button
              onClick={() => setShowObs(s => !s)}
              style={{
                padding:      '5px 8px',
                background:   'transparent',
                border:       '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color:        'var(--text-muted)',
                cursor:       'pointer',
              }}
              title="Agregar observación"
            >
              <PenLine size={12} />
            </button>
          </div>
        ) : (
          <div>
            {item.cumple === true  && <CheckCircle2 size={18} color="var(--success-400)" />}
            {item.cumple === false && <XCircle      size={18} color="var(--danger-400)"  />}
            {item.cumple === null  && <Clock        size={18} color="var(--text-muted)"  />}
          </div>
        )}
      </div>

      {/* Observación */}
      {showObs && editable && (
        <div style={{ marginTop: '10px', paddingLeft: '24px' }}>
          <input
            type="text"
            value={obs}
            onChange={e => setObs(e.target.value)}
            onBlur={() => onChange(item.id, item.cumple, obs)}
            placeholder="Observación sobre este ítem..."
            style={{
              width:        '100%',
              padding:      '7px 10px',
              fontSize:     '0.78rem',
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color:        'var(--text-primary)',
              fontFamily:   'var(--font-ui)',
              outline:      'none',
            }}
          />
        </div>
      )}
    </div>
  )
}

function DocumentoAccionRow({
  label,
  path,
  removing,
  onRemove,
}: {
  label: string
  path: string | null | undefined
  removing?: boolean
  onRemove?: () => void
}) {
  const [cargando, setCargando] = useState<'ver' | 'bajar' | null>(null)

  if (!path) return null

  const nombreArchivo = path.split('/').pop() ?? 'archivo.pdf'

  const handleVer = async () => {
    setCargando('ver')
    try {
      const url = await hseService.previsualizarArchivo(path)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 15000)
    } catch {
      toast.error('No se pudo abrir el archivo.')
    } finally {
      setCargando(null)
    }
  }

  const handleDescargar = async () => {
    setCargando('bajar')
    try {
      await hseService.descargarArchivo(path, nombreArchivo)
    } catch {
      toast.error('No se pudo descargar el archivo.')
    } finally {
      setCargando(null)
    }
  }

  return (
    <div style={{
      padding: '8px 10px',
      border: '1px solid rgba(86,104,184,0.2)',
      borderRadius: '8px',
      background: 'rgba(86,104,184,0.06)',
      display: 'grid',
      gap: '6px',
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontSize: '0.7rem', color: '#5668B8', fontFamily: 'var(--font-mono)' }}>{nombreArchivo}</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleVer} disabled={!!cargando} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
          <Eye size={12} /> {cargando === 'ver' ? '...' : 'Ver'}
        </button>
        <button onClick={handleDescargar} disabled={!!cargando} className="btn-ghost" style={{ padding: '4px 8px', fontSize: '0.72rem' }}>
          <Download size={12} /> {cargando === 'bajar' ? '...' : 'Descargar'}
        </button>
        {onRemove && (
          <button
            onClick={onRemove}
            disabled={!!cargando || removing}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid rgba(192,80,80,0.35)',
              background: 'rgba(192,80,80,0.1)',
              color: 'var(--danger-400)',
              fontSize: '0.72rem',
              cursor: (!!cargando || removing) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={12} /> {removing ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Modal buscar contratista e iniciar ────────────────────────────
function ModalIniciar({
  sedeId,
  onClose,
  onIniciado,
}: {
  sedeId:      number | null
  onClose:    () => void
  onIniciado: (c: CumplimientoResponse) => void
}) {
  const [autorizaciones, setAutorizaciones] = useState<AutorizacionListResponse[]>([])
  const [proveedoresMap, setProveedoresMap] = useState<Record<number, string>>({})
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos')
  const [loadingData,    setLoadingData]    = useState(true)
  const [iniciandoId,    setIniciandoId]    = useState<number | null>(null)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!sedeId) {
        setAutorizaciones([])
        setProveedoresMap({})
        setLoadingData(false)
        return
      }
      setLoadingData(true)
      setError(null)
      try {
        const cargarAutorizaciones = async () => {
          const perPage = 100
          const maxPages = 20
          let page = 1
          const all: AutorizacionListResponse[] = []

          while (page <= maxPages) {
            const chunk = await hseService.listarAutorizaciones({
              sede_id: sedeId,
              page,
              per_page: perPage,
            })
            all.push(...chunk)
            if (chunk.length < perPage) break
            page += 1
          }

          return all
        }

        const [lista, proveedores] = await Promise.all([
          cargarAutorizaciones(),
          hseService.getProveedores().catch(() => []),
        ])
        const map: Record<number, string> = {}
        for (const p of proveedores) map[p.id] = p.nombre
        setProveedoresMap(map)
        setAutorizaciones(lista)
      } catch (e) {
        setError(getErrorMessage(e))
        setAutorizaciones([])
      } finally {
        setLoadingData(false)
      }
    }
    void load()
  }, [sedeId])

  const estadoStyle: Record<EstadoContratista, { color: string; bg: string }> = {
    PENDIENTE_AUTOGESTION:   { color: 'var(--text-muted)',  bg: 'var(--bg-elevated)' },
    AUTOGESTION_EN_PROGRESO: { color: 'var(--primary-400)', bg: 'rgba(69,116,196,0.08)' },
    AUTOGESTION_COMPLETADA:  { color: '#5668B8',            bg: 'rgba(86,104,184,0.08)' },
    EN_REVISION:             { color: '#5668B8',            bg: 'rgba(86,104,184,0.08)' },
    APROBADO:                { color: 'var(--success-400)', bg: 'rgba(40,149,108,0.08)' },
    DENEGADO:                { color: 'var(--danger-400)',  bg: 'rgba(192,80,80,0.08)' },
  }

  const registros = useMemo(() => {
    return autorizaciones.flatMap(a => {
      const proveedorId = a.proveedor_id ?? null
      const proveedorNombre = proveedorId ? (proveedoresMap[proveedorId] || `Proveedor #${proveedorId}`) : 'Sin empresa'
      return (a.contratistas || []).map(c => ({
        id: c.id,
        nombre: `${c.nombres} ${c.apellidos}`.trim(),
        documento: `${c.tipo_documento} ${c.numero_documento}`,
        numeroDocumento: c.numero_documento,
        estado: c.estado,
        codigoAutorizacion: a.codigo,
        proveedorId,
        proveedorNombre,
      }))
    })
  }, [autorizaciones, proveedoresMap])

  const registrosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    return registros.filter(r => {
      const matchProveedor =
        filtroProveedor === 'todos' ||
        (filtroProveedor === 'sin-proveedor' && !r.proveedorId) ||
        String(r.proveedorId) === filtroProveedor

      if (!matchProveedor) return false
      if (!term) return true

      return (
        r.nombre.toLowerCase().includes(term) ||
        r.numeroDocumento.toLowerCase().includes(term) ||
        r.documento.toLowerCase().includes(term) ||
        r.codigoAutorizacion.toLowerCase().includes(term) ||
        r.proveedorNombre.toLowerCase().includes(term)
      )
    })
  }, [registros, busqueda, filtroProveedor])

  const grupos = useMemo(() => {
    const acc: Record<string, { titulo: string; items: typeof registrosFiltrados }> = {}
    for (const r of registrosFiltrados) {
      const key = r.proveedorId ? `prov-${r.proveedorId}` : 'sin-proveedor'
      if (!acc[key]) {
        acc[key] = {
          titulo: r.proveedorId ? `Empresa: ${r.proveedorNombre}` : 'Sin empresa/proveedor',
          items: [],
        }
      }
      acc[key].items.push(r)
    }
    return Object.values(acc)
      .map(g => ({
        ...g,
        items: [...g.items].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo))
  }, [registrosFiltrados])

  const handleIniciar = async (contratistaId: number) => {
    if (!sedeId) {
      const msg = 'Selecciona una sede activa antes de iniciar.'
      setError(msg)
      toast.error(msg)
      return
    }
    setIniciandoId(contratistaId)
    setError(null)
    try {
      const result = await hseService.iniciarCumplimiento({
        contratistaId,
        sedeId,
      })
      toast.success('Verificación iniciada correctamente.')
      onIniciado(result)
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo iniciar la verificación. ${msg}`)
    } finally {
      setIniciandoId(null)
    }
  }

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      background:     'rgba(0,0,0,0.7)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         1000,
      padding:        '24px',
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     '400px',
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow:     'hidden',
      }}
      className="modal-enter"
      >
        <div style={{
          padding:        '20px 24px',
          borderBottom:   '1px solid var(--border-subtle)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardCheck size={18} color="var(--primary-400)" />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Iniciar Verificación
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
            ×
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding:      '10px 14px',
              background:   'rgba(192,80,80,0.08)',
              border:       '1px solid rgba(192,80,80,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize:     '0.8rem',
              color:        'var(--danger-400)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por cédula, nombre o código de autorización..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  fontSize: '0.83rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={filtroProveedor}
              onChange={e => setFiltroProveedor(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '0.83rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              <option value="todos">Todas las empresas/proveedores</option>
              <option value="sin-proveedor">Sin empresa/proveedor</option>
              {Object.entries(proveedoresMap)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
            </select>
          </div>

          <div style={{
            maxHeight: '340px',
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
          }}>
            {loadingData ? (
              <div style={{ padding: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cargando contratistas y proveedores...
              </div>
            ) : grupos.length === 0 ? (
              <div style={{ padding: '18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No hay contratistas para los filtros aplicados.
              </div>
            ) : (
              grupos.map(g => (
                <div key={g.titulo}>
                  <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>
                    {g.titulo} ({g.items.length})
                  </div>
                  {g.items.map(item => {
                    const tone = estadoStyle[item.estado]
                    const isLoading = iniciandoId === item.id
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.81rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.nombre}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.documento} · {item.codigoAutorizacion}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '0.68rem',
                            color: tone.color,
                            background: tone.bg,
                            whiteSpace: 'nowrap',
                          }}>
                            {item.estado.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={() => handleIniciar(item.id)}
                            disabled={iniciandoId !== null}
                            className="btn-primary"
                            style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                          >
                            {isLoading ? 'Iniciando...' : 'Verificar'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{
          padding:        '16px 24px',
          borderTop:      '1px solid var(--border-subtle)',
          display:        'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function CumplimientoView() {
  const sedeActiva = useSedeStore(s => s.sedeActiva)

  const [cumplimiento,  setCumplimiento]  = useState<CumplimientoResponse | null>(null)
  const [showModal,     setShowModal]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [cerrando,      setCerrando]      = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [showCerrar,    setShowCerrar]    = useState(false)
  const [firma,         setFirma]         = useState('')
  const [obsGeneral,    setObsGeneral]    = useState('')
  const [tabHistorial,  setTabHistorial]  = useState<'VERIFICADAS' | 'APROBADAS' | 'NO_APROBADAS'>('VERIFICADAS')
  const [historial,     setHistorial]     = useState<CumplimientoListadoResponse[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [errorHistorial,   setErrorHistorial]   = useState<string | null>(null)
  const [historialBusqueda, setHistorialBusqueda] = useState('')
  const [historialRefresh, setHistorialRefresh] = useState(0)
  const [showPanelDerecho, setShowPanelDerecho] = useState(false)
  const [contratistaDetalle, setContratistaDetalle] = useState<ContratistaDetalleResponse | null>(null)
  const [removingAttachmentKey, setRemovingAttachmentKey] = useState<string | null>(null)
  const [showDesgloseHistorial, setShowDesgloseHistorial] = useState(false)
  const [desgloseCumplimiento, setDesgloseCumplimiento] = useState<CumplimientoResponse | null>(null)
  const [desgloseContratista, setDesgloseContratista] = useState<ContratistaDetalleResponse | null>(null)
  const [desgloseLoading, setDesgloseLoading] = useState(false)
  const [reverificandoDesdeDesglose, setReverificandoDesdeDesglose] = useState(false)

  // Estado local de items para edición optimista
  const [itemsLocal, setItemsLocal] = useState<CumplimientoItemResponse[]>([])

  const handleIniciado = (c: CumplimientoResponse) => {
    setCumplimiento(c)
    setItemsLocal(c.items)
    setShowPanelDerecho(true)
  }

  useEffect(() => {
    const loadDetalle = async () => {
      if (!cumplimiento?.contratista_id) {
        setContratistaDetalle(null)
        return
      }
      try {
        const detalle = await hseService.getContratista(cumplimiento.contratista_id)
        setContratistaDetalle(detalle)
      } catch {
        setContratistaDetalle(null)
      }
    }
    void loadDetalle()
  }, [cumplimiento?.contratista_id])

  useEffect(() => {
    const loadHistorial = async () => {
      if (!sedeActiva?.id || cumplimiento) {
        return
      }

      setLoadingHistorial(true)
      setErrorHistorial(null)
      try {
        const estado =
          tabHistorial === 'APROBADAS'
            ? 'COMPLETADO'
            : tabHistorial === 'NO_APROBADAS'
              ? 'INCUMPLIMIENTO'
              : undefined

        const data = await hseService.listarCumplimientos({
          sede_id: sedeActiva.id,
          estado,
        })

        const filtrado = tabHistorial === 'VERIFICADAS'
          ? data.filter(item => item.estado !== 'EN_PROGRESO')
          : data

        setHistorial(filtrado)
      } catch (e) {
        setErrorHistorial(getErrorMessage(e))
        setHistorial([])
      } finally {
        setLoadingHistorial(false)
      }
    }

    void loadHistorial()
  }, [sedeActiva?.id, tabHistorial, cumplimiento, historialRefresh])

  const handleItemChange = (id: number, cumple: boolean | null, obs: string) => {
    setItemsLocal(prev =>
      prev.map(item => item.id === id ? { ...item, cumple, observacion: obs || item.observacion } : item)
    )
  }

  const handleGuardar = async () => {
    if (!cumplimiento) return
    setSaving(true)
    setError(null)
    try {
      const updated = await hseService.actualizarCumplimiento(cumplimiento.id, {
        items: itemsLocal.map(item => ({
          itemId:     item.id,
          cumple:      item.cumple ?? undefined,
          observacion: item.observacion ?? undefined,
        })),
        observacionGeneral: obsGeneral || undefined,
      })
      setCumplimiento(updated)
      setItemsLocal(updated.items)
      toast.success('Checklist guardado correctamente.')
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo guardar el checklist. ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCerrar = async () => {
    if (!cumplimiento) return
    if (!firma.trim() || firma.length < 3) {
      setError('La firma digital debe tener al menos 3 caracteres.')
      return
    }
    setCerrando(true)
    setError(null)
    try {
      // Guardar respuestas pendientes antes del cierre para evitar
      // inconsistencias entre el estado local y lo persistido en backend.
      await hseService.actualizarCumplimiento(cumplimiento.id, {
        items: itemsLocal.map(item => ({
          itemId:     item.id,
          cumple:      item.cumple ?? undefined,
          observacion: item.observacion ?? undefined,
        })),
        observacionGeneral: obsGeneral || undefined,
      })

      const updated = await hseService.cerrarCumplimiento(cumplimiento.id, {
        firmaDigital:        firma,
        observacionGeneral:  obsGeneral || undefined,
      })
      if (updated.estado === 'COMPLETADO') {
        toast.success('Verificación completa y exitosa.')
      } else {
        toast.error('Verificación cerrada con incumplimientos.')
      }

      // Volver al menú inicial para iniciar una nueva verificación.
      setCumplimiento(null)
      setItemsLocal([])
      setShowCerrar(false)
      setFirma('')
      setObsGeneral('')
      setHistorialRefresh(v => v + 1)
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo cerrar la verificación. ${msg}`)
    } finally {
      setCerrando(false)
    }
  }

  const respondidos = itemsLocal.filter(i => i.cumple !== null).length
  const total       = itemsLocal.length
  const progreso    = total > 0 ? Math.round((respondidos / total) * 100) : 0
  const editable    = cumplimiento?.estado === 'EN_PROGRESO'
  const historialFiltrado = historial.filter(h => {
    const term = historialBusqueda.trim().toLowerCase()
    if (!term) return true
    return (
      h.contratista_nombre.toLowerCase().includes(term) ||
      h.numero_documento.toLowerCase().includes(term) ||
      (h.autorizacion_codigo || '').toLowerCase().includes(term)
    )
  })

  const historialPagination = usePagination(historialFiltrado, 5)

  const detalleDocsSource = showDesgloseHistorial ? desgloseContratista : contratistaDetalle

  const documentosPanel = useMemo(() => {
    if (!detalleDocsSource) return [] as Array<{ key: string; label: string; path: string | null | undefined; modulo: 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen'; campo: string; segSocialId?: number }>

    const docs: Array<{ key: string; label: string; path: string | null | undefined; modulo: 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen'; campo: string; segSocialId?: number }> = []

    const c = detalleDocsSource.clasificacion as any
    if (c) {
      docs.push({ key: 'clasif-alturas', label: 'Alturas', path: c.alturas_cert_archivo, modulo: 'clasificacion', campo: 'alturas_cert_archivo' })
      docs.push({ key: 'clasif-confinados', label: 'Confinados', path: c.confinados_cert_archivo, modulo: 'clasificacion', campo: 'confinados_cert_archivo' })
      docs.push({ key: 'clasif-electrico', label: 'Eléctrico', path: c.electrico_matricula_archivo, modulo: 'clasificacion', campo: 'electrico_matricula_archivo' })
      docs.push({ key: 'clasif-caliente-ext', label: 'Caliente extintor', path: c.caliente_extintor_archivo, modulo: 'clasificacion', campo: 'caliente_extintor_archivo' })
      docs.push({ key: 'clasif-caliente-permiso', label: 'Caliente permiso', path: c.caliente_permiso_archivo, modulo: 'clasificacion', campo: 'caliente_permiso_archivo' })
      docs.push({ key: 'clasif-izaje-ins', label: 'Izaje inspección', path: c.izaje_inspeccion_archivo, modulo: 'clasificacion', campo: 'izaje_inspeccion_archivo' })
      docs.push({ key: 'clasif-izaje-doc', label: 'Izaje doc legal', path: c.izaje_doc_legal_archivo, modulo: 'clasificacion', campo: 'izaje_doc_legal_archivo' })
      docs.push({ key: 'clasif-izaje-lic', label: 'Izaje licencia', path: c.izaje_licencia_archivo, modulo: 'clasificacion', campo: 'izaje_licencia_archivo' })
      docs.push({ key: 'clasif-extran', label: 'Póliza extranjero', path: c.extran_poliza_archivo, modulo: 'clasificacion', campo: 'extran_poliza_archivo' })
      docs.push({ key: 'clasif-residuos', label: 'Plan residuos', path: c.residuos_plan_archivo, modulo: 'clasificacion', campo: 'residuos_plan_archivo' })
    }

    for (const ss of detalleDocsSource.seguridad_social || []) {
      docs.push({
        key: `seg-${ss.id}`,
        label: `PILA${ss.es_titular ? ' titular' : ` ${ss.nombre_persona || ''}`}`.trim(),
        path: ss.pila_archivo,
        modulo: 'seg_social',
        campo: 'pila_archivo',
        segSocialId: ss.id,
      })
    }

    if (detalleDocsSource.certificaciones) {
      docs.push({ key: 'cert-art', label: 'ART', path: detalleDocsSource.certificaciones.art_archivo, modulo: 'certificaciones', campo: 'art_archivo' })
      docs.push({ key: 'cert-permiso', label: 'Permiso', path: detalleDocsSource.certificaciones.permiso_archivo, modulo: 'certificaciones', campo: 'permiso_archivo' })
    }

    if (detalleDocsSource.examen_medico) {
      docs.push({ key: 'examen', label: 'Examen médico', path: detalleDocsSource.examen_medico.archivo, modulo: 'examen', campo: 'archivo' })
    }

    return docs.filter(d => !!d.path)
  }, [detalleDocsSource])

  const handleEliminarAdjunto = async (
    modulo: 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen',
    campo: string,
    segSocialId?: number,
  ) => {
    const contratistaObjetivo = showDesgloseHistorial
      ? desgloseCumplimiento?.contratista_id
      : cumplimiento?.contratista_id
    if (!contratistaObjetivo) return
    if (!window.confirm('¿Eliminar este adjunto de la verificación?')) return

    const key = `${modulo}:${campo}:${segSocialId ?? ''}`
    setRemovingAttachmentKey(key)
    try {
      const updated = await hseService.eliminarAdjuntoContratista(contratistaObjetivo, {
        modulo,
        campo,
        seg_social_id: segSocialId,
      })
      if (showDesgloseHistorial) setDesgloseContratista(updated)
      else setContratistaDetalle(updated)
      toast.success('Adjunto eliminado correctamente.')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setRemovingAttachmentKey(null)
    }
  }

  const handleAbrirDesgloseHistorial = async (cumplimientoId: number, contratistaId: number) => {
    setShowDesgloseHistorial(true)
    setDesgloseLoading(true)
    try {
      const [cumpl, detalle] = await Promise.all([
        hseService.getCumplimiento(cumplimientoId),
        hseService.getContratista(contratistaId),
      ])
      setDesgloseCumplimiento(cumpl)
      setDesgloseContratista(detalle)
    } catch (e) {
      toast.error(getErrorMessage(e))
      setShowDesgloseHistorial(false)
    } finally {
      setDesgloseLoading(false)
    }
  }

  const handleReverificarPersonaDesdeDesglose = async () => {
    if (!desgloseCumplimiento?.contratista_id) {
      toast.error('No se encontró el contratista para iniciar la verificación.')
      return
    }

    const sedeObjetivo = sedeActiva?.id ?? desgloseCumplimiento.sede_id
    if (!sedeObjetivo) {
      toast.error('No hay una sede válida para iniciar la verificación.')
      return
    }

    setReverificandoDesdeDesglose(true)
    try {
      const nuevo = await hseService.iniciarCumplimiento({
        contratistaId: desgloseCumplimiento.contratista_id,
        sedeId: sedeObjetivo,
      })
      toast.success('Nueva verificación iniciada correctamente.')
      setShowDesgloseHistorial(false)
      setDesgloseCumplimiento(null)
      setDesgloseContratista(null)
      handleIniciado(nuevo)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setReverificandoDesdeDesglose(false)
    }
  }

  return (
    <div style={{ padding: '36px', maxWidth: '1280px' }}>

      {/* Header */}
      <div
        style={{ marginBottom: '34px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
        className="animate-fade-up"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ClipboardCheck size={14} color="var(--primary-400)" />
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.68rem',
              color:         'var(--primary-400)',
              letterSpacing: '0.12em',
            }}>
              HSE / CUMPLIMIENTO
            </span>
          </div>
          <h1 style={{
            fontSize:      '2rem',
            fontWeight:    700,
            color:         'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom:  '4px',
          }}>
            Verificación de Cumplimiento
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
            Checklist de jornada por contratista
          </p>
        </div>

        {!cumplimiento && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Search size={14} />
            Iniciar Verificación
          </button>
        )}
      </div>

      {!cumplimiento && (
        <div
          style={{
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
            alignItems: 'start',
          }}
          className="animate-fade-up stagger-2"
        >
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '22px',
            position: 'sticky',
            top: '18px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}>
              <ClipboardCheck size={16} color="var(--primary-400)" />
              <span style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}>
                Iniciar Verificación
              </span>
            </div>
            <h2 style={{ fontSize: '1.28rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Nueva revisión diaria
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '18px' }}>
              Abre el selector de contratistas para iniciar una nueva verificación de cumplimiento.
            </p>

            <button onClick={() => setShowModal(true)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: '0.92rem' }}>
              <Search size={14} />
              Iniciar Verificación
            </button>

            <div style={{
              marginTop: '18px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'grid',
              gap: '10px',
            }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Verificadas: <strong style={{ color: 'var(--text-primary)' }}>{historial.length}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Sede activa: <strong style={{ color: 'var(--text-primary)' }}>{sedeActiva?.nombre || 'No seleccionada'}</strong>
              </div>
            </div>
          </div>

          <div style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
            minHeight: '460px',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '14px',
              }}>
                <div>
                  <div style={{ fontSize: '0.84rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    Verificaciones Realizadas
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Separadas del inicio para mejorar la revisión de resultados.
                  </div>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {historialFiltrado.length} registro{historialFiltrado.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[
                  { key: 'VERIFICADAS', label: 'Ya verificadas' },
                  { key: 'APROBADAS', label: 'Aprobadas' },
                  { key: 'NO_APROBADAS', label: 'No aprobadas' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTabHistorial(tab.key as 'VERIFICADAS' | 'APROBADAS' | 'NO_APROBADAS')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${tabHistorial === tab.key ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                      background: tabHistorial === tab.key ? 'rgba(86,104,184,0.12)' : 'var(--bg-surface)',
                      color: tabHistorial === tab.key ? 'var(--primary-500)' : 'var(--text-secondary)',
                      fontSize: '0.84rem',
                      fontWeight: tabHistorial === tab.key ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  value={historialBusqueda}
                  onChange={e => setHistorialBusqueda(e.target.value)}
                  placeholder="Buscar en verificadas por nombre, cédula o código..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    fontSize: '0.86rem',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {loadingHistorial ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '22px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                Cargando verificaciones...
              </div>
            ) : errorHistorial ? (
              <div style={{ padding: '22px', fontSize: '0.84rem', color: 'var(--danger-400)' }}>
                {errorHistorial}
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div style={{ padding: '28px 22px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                No hay verificaciones para esta pestaña.
              </div>
            ) : (
              historialPagination.paginatedData.map((h, idx) => {
                const aprobada   = h.estado === 'COMPLETADO'
                const colorRes   = aprobada ? 'var(--success-400)' : 'var(--danger-400)'
                const bgRes      = aprobada ? 'rgba(40,149,108,0.08)' : 'rgba(192,80,80,0.08)'
                const borderRes  = aprobada ? 'rgba(40,149,108,0.25)' : 'rgba(192,80,80,0.25)'

                // Badge de días restantes antes de auto-eliminación
                const dr = h.dias_restantes
                const diasBadge = dr !== null ? (
                  <span style={{
                    padding: '2px 7px', borderRadius: '999px', fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    background: dr === 0 ? 'rgba(192,80,80,0.12)' : dr === 1 ? 'rgba(212,134,10,0.12)' : 'rgba(100,100,100,0.08)',
                    border:     dr === 0 ? '1px solid rgba(192,80,80,0.3)' : dr === 1 ? '1px solid rgba(212,134,10,0.3)' : '1px solid var(--border-subtle)',
                    color:      dr === 0 ? 'var(--danger-400)' : dr === 1 ? '#D4860A' : 'var(--text-muted)',
                  }}>
                    {dr === 0 ? 'Se elimina hoy' : `${dr}d restante${dr !== 1 ? 's' : ''}`}
                  </span>
                ) : null

                return (
                  <div
                    key={h.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: idx < historialPagination.paginatedData.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '12px',
                      alignItems: 'center',
                      background: 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Columna izquierda */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.88rem', fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: '3px',
                      }}>
                        {h.contratista_nombre}
                      </div>
                      <div style={{
                        fontSize: '0.72rem', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginBottom: '5px',
                      }}>
                        {h.tipo_documento} {h.numero_documento}
                        {h.autorizacion_codigo ? ` · ${h.autorizacion_codigo}` : ''}
                        {h.encargado_nombre ? ` · Enc: ${h.encargado_nombre}` : ''}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Ítems respondidos */}
                        <span style={{
                          fontSize: '0.67rem', padding: '1px 6px', borderRadius: '999px',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                        }}>
                          {h.respondidos}/{h.total_items} ítems
                        </span>
                        {/* Fecha de cierre */}
                        {h.fecha_cierre && (
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                            {formatDateTime(h.fecha_cierre)}
                          </span>
                        )}
                        {/* Días restantes */}
                        {diasBadge}
                      </div>
                    </div>

                    {/* Columna derecha */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {/* Badge resultado */}
                      <div style={{
                        padding: '4px 11px', borderRadius: '999px',
                        fontSize: '0.72rem', fontWeight: 700,
                        color: colorRes, background: bgRes,
                        border: `1px solid ${borderRes}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {aprobada ? '✓ Aprobada' : '✗ No aprobada'}
                      </div>
                      {/* Botón desglose */}
                      <button
                        onClick={() => handleAbrirDesgloseHistorial(h.id, h.contratista_id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 9px', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)', background: 'transparent',
                          color: 'var(--text-muted)', fontSize: '0.72rem',
                          fontFamily: 'var(--font-ui)', cursor: 'pointer',
                        }}
                      >
                        <Eye size={11} /> Ver detalle
                      </button>
                    </div>
                  </div>
                )
              })
            )}
            <Pagination
              currentPage={historialPagination.currentPage}
              totalPages={historialPagination.totalPages}
              onNext={historialPagination.nextPage}
              onPrev={historialPagination.prevPage}
              onGoTo={historialPagination.goToPage}
              totalItems={historialPagination.totalItems}
            />
          </div>
        </div>
      )}

      {/* Checklist activo */}
      {cumplimiento && (
        <div className="animate-fade-up">

          {/* Info + progreso */}
          <div style={{
            padding:      '20px 24px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '20px',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            gap:          '20px',
            boxShadow:    'var(--shadow-card)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '0.75rem',
                  color:      'var(--text-muted)',
                }}>
                  Contratista #{cumplimiento.contratista_id}
                </span>
                <CumplimientoBadge estado={cumplimiento.estado} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {respondidos}/{total} ítems respondidos
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '0.83rem',
                  color:      'var(--primary-400)',
                  fontWeight: 600,
                }}>
                  {progreso}%
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <div style={{
                height:       '6px',
                background:   'var(--bg-elevated)',
                borderRadius: '3px',
                overflow:     'hidden',
              }}>
                <div style={{
                  height:       '100%',
                  width:        `${progreso}%`,
                  background:   progreso === 100 ? 'var(--success-400)' : 'var(--primary-500)',
                  borderRadius: '3px',
                  transition:   'width 0.4s ease',
                }} />
              </div>
            </div>
            <button
              onClick={() => setShowPanelDerecho(v => !v)}
              className="btn-ghost"
              style={{ whiteSpace: 'nowrap' }}
            >
              {showPanelDerecho ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showPanelDerecho ? 'Ocultar panel derecho' : 'Ver panel derecho'}
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '10px 14px',
              background:   'rgba(192,80,80,0.08)',
              border:       '1px solid rgba(192,80,80,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize:     '0.8rem',
              color:        'var(--danger-400)',
              marginBottom: '14px',
            }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: showPanelDerecho ? '1.5fr 1fr' : '1fr',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {itemsLocal.map(item => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  editable={editable}
                  onChange={handleItemChange}
                />
              ))}
            </div>

            {showPanelDerecho && (
              <aside style={{
                position: 'sticky',
                top: '14px',
                alignSelf: 'start',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                display: 'grid',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Panel derecho
                  </div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    Desglose de verificación
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Casillas marcadas
                  </div>
                  {itemsLocal.map((item) => (
                    <div key={`panel-${item.id}`} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '7px 9px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: item.cumple === true ? 'rgba(40,149,108,0.08)' : item.cumple === false ? 'rgba(192,80,80,0.08)' : 'var(--bg-elevated)',
                    }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{item.orden}. {item.pregunta}</span>
                      <span style={{ fontSize: '0.72rem', color: item.cumple === true ? 'var(--success-400)' : item.cumple === false ? 'var(--danger-400)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {item.cumple === true ? 'Sí' : item.cumple === false ? 'No' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gap: '8px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px',
                  background: 'var(--bg-elevated)',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Detalle operativo
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {contratistaDetalle ? `${contratistaDetalle.nombres} ${contratistaDetalle.apellidos}` : 'Contratista no cargado'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Documento: <strong style={{ color: 'var(--text-primary)' }}>
                        {contratistaDetalle ? `${contratistaDetalle.tipo_documento} ${contratistaDetalle.numero_documento}` : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Estado contratista: <strong style={{ color: 'var(--text-primary)' }}>{contratistaDetalle?.estado || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Empresa: <strong style={{ color: 'var(--text-primary)' }}>{contratistaDetalle?.proveedor_nombre || 'Sin proveedor'}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Encargado ID: <strong style={{ color: 'var(--text-primary)' }}>{cumplimiento?.encargado_id ?? 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Inicio: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(cumplimiento?.fecha_inicio)}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Cierre: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(cumplimiento?.fecha_cierre)}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Email: <strong style={{ color: 'var(--text-primary)' }}>{contratistaDetalle?.email || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                      Teléfono: <strong style={{ color: 'var(--text-primary)' }}>{contratistaDetalle?.telefono || 'N/A'}</strong>
                    </div>
                  </div>
                  {cumplimiento?.observacion_general && (
                    <div style={{
                      fontSize: '0.73rem',
                      color: 'var(--text-secondary)',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface)',
                    }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Observación general:</strong> {cumplimiento.observacion_general}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Adjuntos de soporte
                  </div>
                  {documentosPanel.length === 0 ? (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      No hay adjuntos detectados para este contratista.
                    </div>
                  ) : (
                    documentosPanel.map((doc) => (
                      <DocumentoAccionRow
                        key={doc.key}
                        label={doc.label}
                        path={doc.path}
                        removing={removingAttachmentKey === `${doc.modulo}:${doc.campo}:${doc.segSocialId ?? ''}`}
                        onRemove={() => handleEliminarAdjunto(doc.modulo, doc.campo, doc.segSocialId)}
                      />
                    ))
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* Observación general */}
          {editable && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display:       'block',
                fontSize:      '0.72rem',
                fontWeight:    500,
                color:         'var(--text-secondary)',
                marginBottom:  '6px',
                letterSpacing: '0.04em',
              }}>
                OBSERVACIÓN GENERAL (opcional)
              </label>
              <textarea
                value={obsGeneral}
                onChange={e => setObsGeneral(e.target.value)}
                placeholder="Agrega observaciones generales de la jornada..."
                rows={2}
                style={{
                  width:        '100%',
                  padding:      '9px 12px',
                  fontSize:     '0.83rem',
                  background:   'var(--bg-surface)',
                  border:       '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-primary)',
                  fontFamily:   'var(--font-ui)',
                  outline:      'none',
                  resize:       'vertical',
                }}
              />
            </div>
          )}

          {/* Acciones */}
          {editable && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="btn-ghost"
              >
                {saving ? 'Guardando...' : 'Guardar progreso'}
              </button>

              <button
                onClick={() => setShowCerrar(true)}
                disabled={progreso < 100}
                className={progreso < 100 ? 'btn-ghost' : 'btn-primary'}
              >
                {progreso < 100 ? <Lock size={14} /> : <CheckCircle2 size={14} />}
                {progreso < 100 ? `Responde todos los ítems (${progreso}%)` : 'Cerrar Verificación'}
              </button>
            </div>
          )}

          {/* Panel cierre */}
          {showCerrar && (
            <div style={{
              marginTop:    '20px',
              padding:      '20px',
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              animation:    'fadeUp 0.2s ease both',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Firma digital para cerrar la verificación
              </h3>
              <label style={{
                display:       'block',
                fontSize:      '0.72rem',
                fontWeight:    500,
                color:         'var(--text-secondary)',
                marginBottom:  '6px',
                letterSpacing: '0.04em',
              }}>
                ESCRIBE TU NOMBRE COMPLETO COMO FIRMA
              </label>
              <input
                type="text"
                value={firma}
                onChange={e => setFirma(e.target.value)}
                placeholder="Nombre Apellido"
                style={{
                  width:        '100%',
                  padding:      '10px 12px',
                  fontSize:     '0.9rem',
                  fontStyle:    'italic',
                  background:   'var(--bg-elevated)',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-primary)',
                  fontFamily:   'var(--font-ui)',
                  outline:      'none',
                  marginBottom: '14px',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCerrar(false)}
                  className="btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCerrar}
                  disabled={cerrando}
                  className="btn-primary"
                >
                  {cerrando ? 'Cerrando...' : 'Confirmar y cerrar'}
                </button>
              </div>
            </div>
          )}

          {/* Estado cerrado */}
          {!editable && (
            <div style={{
              padding:      '16px 20px',
              background:   cumplimiento.estado === 'COMPLETADO'
                ? 'rgba(40,149,108,0.06)' : 'rgba(192,80,80,0.06)',
              border:       `1px solid ${cumplimiento.estado === 'COMPLETADO'
                ? 'rgba(40,149,108,0.2)' : 'rgba(192,80,80,0.2)'}`,
              borderRadius: 'var(--radius-lg)',
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
            }}>
              {cumplimiento.estado === 'COMPLETADO'
                ? <CheckCircle2 size={20} color="var(--success-400)" />
                : <AlertTriangle size={20} color="var(--danger-400)" />
              }
              <div>
                <div style={{
                  fontSize:   '0.83rem',
                  fontWeight: 600,
                  color:      cumplimiento.estado === 'COMPLETADO'
                    ? 'var(--success-400)' : 'var(--danger-400)',
                }}>
                  {cumplimiento.estado === 'COMPLETADO'
                    ? 'Verificación completada exitosamente'
                    : 'Verificación cerrada con incumplimientos'
                  }
                </div>
                {cumplimiento.firma_digital && (
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Firmado por: {cumplimiento.firma_digital}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ModalIniciar
          sedeId={sedeActiva?.id ?? null}
          onClose={() => setShowModal(false)}
          onIniciado={handleIniciado}
        />
      )}

      {showDesgloseHistorial && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 1300,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            width: 'min(560px, 100%)',
            height: '100%',
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Cumplimiento
                </div>
                <div style={{ fontSize: '0.94rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Desglose de verificación
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setShowDesgloseHistorial(false)}>Cerrar</button>
            </div>

            <div style={{ padding: '14px', overflowY: 'auto', display: 'grid', gap: '12px' }}>
              {desgloseLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Cargando desglose...</div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gap: '8px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px',
                    background: 'var(--bg-elevated)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Resumen de verificación
                      </div>
                      {desgloseCumplimiento?.estado && <CumplimientoBadge estado={desgloseCumplimiento.estado} />}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Ítems respondidos: <strong style={{ color: 'var(--text-primary)' }}>
                          {(desgloseCumplimiento?.items || []).filter((i) => i.cumple !== null).length}/{(desgloseCumplimiento?.items || []).length}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Encargado ID: <strong style={{ color: 'var(--text-primary)' }}>{desgloseCumplimiento?.encargado_id ?? 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Inicio: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(desgloseCumplimiento?.fecha_inicio)}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Cierre: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(desgloseCumplimiento?.fecha_cierre)}</strong>
                      </div>
                    </div>
                    {desgloseCumplimiento?.firma_digital && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Firma: <strong style={{ color: 'var(--text-primary)' }}>{desgloseCumplimiento.firma_digital}</strong>
                      </div>
                    )}
                    {desgloseCumplimiento?.observacion_general && (
                      <div style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-surface)',
                      }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Observación general:</strong> {desgloseCumplimiento.observacion_general}
                      </div>
                    )}
                    {desgloseCumplimiento && desgloseCumplimiento.estado !== 'EN_PROGRESO' && (
                      <button
                        className="btn-primary"
                        onClick={handleReverificarPersonaDesdeDesglose}
                        disabled={reverificandoDesdeDesglose}
                        style={{ justifySelf: 'start', fontSize: '0.78rem' }}
                      >
                        <PenLine size={13} />
                        {reverificandoDesdeDesglose ? 'Iniciando...' : 'Volver a verificar persona'}
                      </button>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gap: '8px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px',
                    background: 'var(--bg-elevated)',
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Datos del contratista</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {desgloseContratista ? `${desgloseContratista.nombres} ${desgloseContratista.apellidos}` : 'No disponible'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Documento: <strong style={{ color: 'var(--text-primary)' }}>
                          {desgloseContratista ? `${desgloseContratista.tipo_documento} ${desgloseContratista.numero_documento}` : 'N/A'}
                        </strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Estado: <strong style={{ color: 'var(--text-primary)' }}>{desgloseContratista?.estado || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Email: <strong style={{ color: 'var(--text-primary)' }}>{desgloseContratista?.email || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Teléfono: <strong style={{ color: 'var(--text-primary)' }}>{desgloseContratista?.telefono || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Proveedor: <strong style={{ color: 'var(--text-primary)' }}>{desgloseContratista?.proveedor_nombre || 'Sin proveedor'}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Autogestión: <strong style={{ color: 'var(--text-primary)' }}>{formatDateTime(desgloseContratista?.autogestion_completada_en)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Casillas de checklist</div>
                    {(desgloseCumplimiento?.items || []).map((item) => (
                      <div key={`hist-${item.id}`} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: item.cumple === true ? 'rgba(40,149,108,0.08)' : item.cumple === false ? 'rgba(192,80,80,0.08)' : 'var(--bg-elevated)',
                      }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{item.orden}. {item.pregunta}</span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: item.cumple === true ? 'var(--success-400)' : item.cumple === false ? 'var(--danger-400)' : 'var(--text-muted)' }}>
                          {item.cumple === true ? 'Sí' : item.cumple === false ? 'No' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: '6px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Adjuntos de soporte</div>
                    {documentosPanel.length === 0 ? (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sin adjuntos.</div>
                    ) : (
                      documentosPanel.map((doc) => (
                        <DocumentoAccionRow
                          key={`hist-doc-${doc.key}`}
                          label={doc.label}
                          path={doc.path}
                          removing={removingAttachmentKey === `${doc.modulo}:${doc.campo}:${doc.segSocialId ?? ''}`}
                          onRemove={() => handleEliminarAdjunto(doc.modulo, doc.campo, doc.segSocialId)}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
