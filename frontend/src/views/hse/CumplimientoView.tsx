/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Verificación de Cumplimiento HSE
 */

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ClipboardCheck, Search, CheckCircle2, XCircle,
  Clock, AlertTriangle,
  PenLine, Lock,
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
  EstadoContratista,
  EstadoCumplimiento,
} from '@/types/hse'

// ── Badge estado cumplimiento ─────────────────────────────────────
function CumplimientoBadge({ estado }: { estado: EstadoCumplimiento }) {
  const config = {
    EN_PROGRESO:    { color: 'var(--primary-400)',  bg: 'rgba(245,158,11,0.08)',  label: 'En progreso' },
    COMPLETADO:     { color: 'var(--success-400)',  bg: 'rgba(16,185,129,0.08)', label: 'Completado'  },
    INCUMPLIMIENTO: { color: 'var(--danger-400)',   bg: 'rgba(239,68,68,0.08)',  label: 'Incumplimiento' },
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
    ? 'rgba(16,185,129,0.06)'
    : item.cumple === false
      ? 'rgba(239,68,68,0.06)'
      : 'var(--bg-elevated)'

  const borderColor = item.cumple === true
    ? 'rgba(16,185,129,0.2)'
    : item.cumple === false
      ? 'rgba(239,68,68,0.2)'
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
                background:   item.cumple === true ? 'rgba(16,185,129,0.15)' : 'var(--bg-surface)',
                border:       `1px solid ${item.cumple === true ? 'rgba(16,185,129,0.4)' : 'var(--border-default)'}`,
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
                background:   item.cumple === false ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)',
                border:       `1px solid ${item.cumple === false ? 'rgba(239,68,68,0.3)' : 'var(--border-default)'}`,
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
    AUTOGESTION_EN_PROGRESO: { color: 'var(--primary-400)', bg: 'rgba(245,158,11,0.08)' },
    AUTOGESTION_COMPLETADA:  { color: '#6366F1',            bg: 'rgba(99,102,241,0.08)' },
    EN_REVISION:             { color: '#6366F1',            bg: 'rgba(99,102,241,0.08)' },
    APROBADO:                { color: 'var(--success-400)', bg: 'rgba(16,185,129,0.08)' },
    DENEGADO:                { color: 'var(--danger-400)',  bg: 'rgba(239,68,68,0.08)' },
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
        contratista_id: contratistaId,
        sede_id: sedeId,
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
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
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

  // Estado local de items para edición optimista
  const [itemsLocal, setItemsLocal] = useState<CumplimientoItemResponse[]>([])

  const handleIniciado = (c: CumplimientoResponse) => {
    setCumplimiento(c)
    setItemsLocal(c.items)
  }

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
          item_id:     item.id,
          cumple:      item.cumple ?? undefined,
          observacion: item.observacion ?? undefined,
        })),
        observacion_general: obsGeneral || undefined,
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
          item_id:     item.id,
          cumple:      item.cumple ?? undefined,
          observacion: item.observacion ?? undefined,
        })),
        observacion_general: obsGeneral || undefined,
      })

      const updated = await hseService.cerrarCumplimiento(cumplimiento.id, {
        firma_digital:        firma,
        observacion_general:  obsGeneral || undefined,
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
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            overflow: 'hidden',
            minHeight: '460px',
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
                      background: tabHistorial === tab.key ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
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
              <div style={{ padding: '22px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                Cargando verificaciones...
              </div>
            ) : errorHistorial ? (
              <div style={{ padding: '22px', fontSize: '0.92rem', color: 'var(--danger-400)' }}>
                {errorHistorial}
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div style={{ padding: '22px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
                No hay verificaciones para esta pestaña.
              </div>
            ) : (
              historialPagination.paginatedData.map((h, idx) => (
                <div
                  key={h.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < historialFiltrado.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '14px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.96rem',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {h.contratista_nombre}
                    </div>
                    <div style={{
                      marginTop: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {h.tipo_documento} {h.numero_documento}
                      {h.autorizacion_codigo ? ` · ${h.autorizacion_codigo}` : ''}
                      {` · ${h.respondidos}/${h.total_items} ítems`}
                    </div>
                  </div>

                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: h.estado === 'COMPLETADO' ? 'var(--success-400)' : 'var(--danger-400)',
                    background: h.estado === 'COMPLETADO' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: h.estado === 'COMPLETADO' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h.estado === 'COMPLETADO' ? 'Aprobada' : 'No aprobada'}
                  </div>
                </div>
              ))
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
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            gap:          '20px',
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
          </div>

          {/* Mensajes */}
          {error && (
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '10px 14px',
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize:     '0.8rem',
              color:        'var(--danger-400)',
              marginBottom: '14px',
            }}>
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Items checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {itemsLocal.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                editable={editable}
                onChange={handleItemChange}
              />
            ))}
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
                ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border:       `1px solid ${cumplimiento.estado === 'COMPLETADO'
                ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
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
    </div>
  )
}