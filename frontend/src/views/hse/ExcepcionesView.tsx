/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Excepciones HSE — Pre-aprobados especiales
 */

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, AlertTriangle,
  RefreshCw, User, Trash2, ChevronDown, ChevronRight, Eye, Pencil,
} from 'lucide-react'
import { useSedeStore } from '@/store/sedeStore'
import { useAuthStore } from '@/store/authStore'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import type { ExcepcionResponse, ExcepcionUpdateRequest, ProveedorHSEOption } from '@/types/hse'
import { ConfirmActionModal } from '@/components/feedback/ConfirmActionModal'
import { localDateStr } from '@/utils/dates'

function formatDisplayName(e: ExcepcionResponse): string {
  const full = (e.nombre_completo || '').trim()
  if (!full) return `Persona #${e.persona_id}`
  if (full.toUpperCase().endsWith(' N/A')) {
    return full.slice(0, -4).trim()
  }
  if (full.toUpperCase() === 'N/A') {
    return `Persona #${e.persona_id}`
  }
  return full
}

function ModalDetalleExcepcion({
  excepcionId,
  onClose,
}: {
  excepcionId: number
  onClose: () => void
}) {
  const [data, setData] = useState<ExcepcionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const detalle = await hseService.getExcepcion(excepcionId)
        setData(detalle)
      } catch (e) {
        setError(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [excepcionId])

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    gap: '10px',
    fontSize: '0.8rem',
    padding: '10px 0',
    borderBottom: '1px solid var(--border-subtle)',
  }

  const valueStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontWeight: 500,
    wordBreak: 'break-word',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Detalle de excepción</h3>
          <button onClick={onClose} className="btn-ghost">Cerrar</button>
        </div>

        <div style={{ padding: '18px 22px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Cargando detalle...</div>
          ) : error ? (
            <div style={{ color: 'var(--danger-400)', fontSize: '0.83rem' }}>{error}</div>
          ) : data ? (
            <div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>ID</div><div style={valueStyle}>#{data.id}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Nombre</div><div style={valueStyle}>{formatDisplayName(data)}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Documento</div><div style={valueStyle}>{data.tipo_documento || 'CC'} {data.numero_documento || '—'}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Proveedor</div><div style={valueStyle}>{data.proveedor_nombre || 'Sin proveedor'}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Origen</div><div style={valueStyle}>{data.origen_excepcion}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Motivo</div><div style={valueStyle}>{data.motivo}</div></div>
              <div style={rowStyle}><div style={{ color: 'var(--text-muted)' }}>Vigencia</div><div style={valueStyle}>{data.fecha_inicio} → {data.fecha_fin}</div></div>
              <div style={{ ...rowStyle, borderBottom: 'none' }}><div style={{ color: 'var(--text-muted)' }}>Estado</div><div style={valueStyle}>{data.activa ? 'Activa' : 'Inactiva'}</div></div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No se encontró información.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModalEditarExcepcion({
  excepcion,
  proveedores,
  onClose,
  onSaved,
}: {
  excepcion: ExcepcionResponse
  proveedores: ProveedorHSEOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const normalizeTipoDocumento = (value: string | null | undefined): ExcepcionUpdateRequest['tipo_documento'] => {
    if (value === 'CC' || value === 'CE' || value === 'PASAPORTE' || value === 'TI' || value === 'NIT') {
      return value
    }
    return 'CC'
  }

  const [tipoDocumento, setTipoDocumento] = useState<ExcepcionUpdateRequest['tipo_documento']>(
    normalizeTipoDocumento(excepcion.tipo_documento),
  )
  const [numeroDocumento, setNumeroDocumento] = useState(excepcion.numero_documento || '')
  const [nombreCompleto, setNombreCompleto] = useState(formatDisplayName(excepcion))
  const [proveedorId, setProveedorId] = useState<string>(excepcion.proveedor_id ? String(excepcion.proveedor_id) : '')
  const [motivo, setMotivo] = useState(excepcion.motivo || '')
  const [fechaInicio, setFechaInicio] = useState(excepcion.fecha_inicio)
  const [fechaFin, setFechaFin] = useState(excepcion.fecha_fin)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGuardar = async () => {
    if (!nombreCompleto.trim()) {
      setError('Debes ingresar el nombre completo.')
      return
    }
    const esPasaporte = tipoDocumento === 'PASAPORTE' || tipoDocumento === 'CE'
    const docRegex = esPasaporte ? /^[A-Za-z0-9]{4,20}$/ : /^\d{5,20}$/
    if (!docRegex.test(numeroDocumento.trim())) {
      setError(esPasaporte ? 'El documento debe tener entre 4 y 20 caracteres alfanuméricos.' : 'El documento debe contener solo números (5 a 20 dígitos).')
      return
    }
    if (!motivo || motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      return
    }
    if (!fechaInicio || !fechaFin) {
      setError('Debes seleccionar fecha de inicio y fin.')
      return
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await hseService.actualizarExcepcion(excepcion.id, {
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
        nombre_completo: nombreCompleto.trim(),
        proveedor_id: proveedorId ? Number(proveedorId) : null,
        motivo: motivo.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      })
      toast.success('Excepción actualizada correctamente.')
      onSaved()
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo actualizar la excepción. ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '0.83rem',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '640px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Editar excepción</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{formatDisplayName(excepcion)}</p>
        </div>

        <div style={{ padding: '18px 22px', display: 'grid', gap: '12px', overflowY: 'auto' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(192,80,80,0.08)',
              border: '1px solid rgba(192,80,80,0.2)',
              color: 'var(--danger-400)',
              fontSize: '0.8rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>TIPO DOC</label>
              <select value={tipoDocumento} onChange={(e) => setTipoDocumento(normalizeTipoDocumento(e.target.value))} style={inputStyle}>
                {['CC', 'CE', 'PASAPORTE', 'TI', 'NIT'].map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>DOCUMENTO</label>
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => {
                  const v = e.target.value
                  if (tipoDocumento === 'PASAPORTE' || tipoDocumento === 'CE') {
                    setNumeroDocumento(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  } else {
                    setNumeroDocumento(v.replace(/[^\d]/g, ''))
                  }
                }}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NOMBRE COMPLETO</label>
            <input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>COMPAÑÍA / PROVEEDOR</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} style={inputStyle}>
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>MOTIVO</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.4 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>FECHA INICIO</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>FECHA FIN</label>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCrearProveedor({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (created: ProveedorHSEOption) => void
}) {
  const [nombre, setNombre] = useState('')
  const [nit, setNit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '0.83rem',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
  }

  const handleCrear = async () => {
    if (!nombre.trim() || !nit.trim()) {
      setError('Debes ingresar nombre y NIT.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await hseService.crearProveedor({
        nombre: nombre.trim(),
        nit: nit.trim(),
      })
      toast.success(`Proveedor ${created.nombre} creado correctamente.`)
      onCreated(created)
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo crear el proveedor. ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nuevo proveedor</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Crea proveedores por fuera del formulario de excepciones.</p>
        </div>

        <div style={{ padding: '18px 22px', display: 'grid', gap: '12px' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(192,80,80,0.08)',
              border: '1px solid rgba(192,80,80,0.2)',
              color: 'var(--danger-400)',
              fontSize: '0.8rem',
            }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NOMBRE</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} placeholder="Nombre de la empresa" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NIT</label>
            <input type="text" value={nit} onChange={(e) => setNit(e.target.value)} style={inputStyle} placeholder="900123456-1" />
          </div>
        </div>

        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleCrear} disabled={saving}>
            {saving ? 'Creando...' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal crear excepción ─────────────────────────────────────────
function ModalCrear({
  sedeId,
  proveedores,
  onClose,
  onCreated,
}: {
  sedeId:    number | null
  proveedores: ProveedorHSEOption[]
  onClose:   () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [modo,    setModo]    = useState<'individual' | 'empresa'>('individual')
  const [tipoDocIndividual, setTipoDocIndividual] = useState<'CC' | 'CE' | 'PASAPORTE' | 'TI'>('CC')
  const hoy = localDateStr()
  const manana = localDateStr(1)
  const [formIndividual, setFormIndividual] = useState({
    nombre_completo: '',
    numero_documento: '',
  })
  const [formBase, setFormBase] = useState({
    proveedor_id: '',
    motivo:       '',
    fecha_inicio: hoy,
    fecha_fin:    manana,
  })
  const [contratistas, setContratistas] = useState<Array<{ numero_documento: string; nombre_completo: string }>>([
    { numero_documento: '', nombre_completo: '' },
  ])

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '9px 12px',
    fontSize:     '0.83rem',
    background:   'var(--bg-elevated)',
    border:       '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color:        'var(--text-primary)',
    fontFamily:   'var(--font-ui)',
    outline:      'none',
  }

  const labelStyle: React.CSSProperties = {
    display:       'block',
    fontSize:      '0.72rem',
    fontWeight:    500,
    color:         'var(--text-secondary)',
    marginBottom:  '5px',
    letterSpacing: '0.04em',
  }

  const handleSubmit = async () => {
    if (!sedeId) {
      setError('Selecciona una sede activa antes de crear una excepción.')
      return
    }

    if (!formBase.motivo || !formBase.fecha_inicio || !formBase.fecha_fin) {
      setError('Completa todos los campos requeridos.')
      return
    }
    if (formBase.motivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres.')
      return
    }
    if (formBase.fecha_fin < formBase.fecha_inicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.')
      return
    }

    if (modo === 'individual') {
      if (!formIndividual.nombre_completo || !formIndividual.numero_documento) {
        setError('Completa nombre y cédula del contratista.')
        return
      }
      const esPasInd = tipoDocIndividual === 'PASAPORTE' || tipoDocIndividual === 'CE'
      const regexInd = esPasInd ? /^[A-Za-z0-9]{4,20}$/ : /^\d{5,20}$/
      if (!regexInd.test(formIndividual.numero_documento.trim())) {
        setError(esPasInd ? 'El documento debe tener entre 4 y 20 caracteres alfanuméricos.' : 'La cédula debe contener solo números (5 a 20 dígitos).')
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const modoCreacion = modo
      const totalLote = contratistas.filter(c => c.numero_documento.trim() || c.nombre_completo.trim()).length
      if (modo === 'individual') {
        await hseService.crearExcepcion({
          tipo_documento: tipoDocIndividual,
          numero_documento: formIndividual.numero_documento.trim(),
          nombre_completo: formIndividual.nombre_completo.trim(),
          sede_id:      sedeId,
          motivo:       formBase.motivo,
          fecha_inicio: formBase.fecha_inicio,
          fecha_fin:    formBase.fecha_fin,
        })
      } else {
        if (!formBase.proveedor_id) {
          setError('Selecciona un proveedor para crear excepciones por empresa.')
          setLoading(false)
          return
        }
        const filasValidas = contratistas.filter(c => c.numero_documento.trim() || c.nombre_completo.trim())
        if (filasValidas.length === 0) {
          setError('Ingresa al menos un contratista.')
          setLoading(false)
          return
        }
        if (filasValidas.some(c => !/^\d{5,20}$/.test(c.numero_documento.trim()) || !c.nombre_completo.trim())) {
          setError('Cada contratista debe tener cédula válida y nombre completo.')
          setLoading(false)
          return
        }

        await hseService.crearExcepcionesLote({
          sede_id: sedeId,
          proveedor_id: Number(formBase.proveedor_id),
          motivo: formBase.motivo,
          fecha_inicio: formBase.fecha_inicio,
          fecha_fin: formBase.fecha_fin,
          contratistas: filasValidas.map(c => ({
            tipo_documento: 'CC',
            numero_documento: c.numero_documento.trim(),
            nombre_completo: c.nombre_completo.trim(),
          })),
        })
      }
      if (modoCreacion === 'individual') {
        toast.success('Excepción individual creada correctamente.')
      } else {
        toast.success(`Excepciones creadas para ${totalLote} contratista${totalLote === 1 ? '' : 's'}.`)
      }
      onCreated()
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo crear la excepción. ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const updateContratista = (idx: number, patch: Partial<{ numero_documento: string; nombre_completo: string }>) => {
    setContratistas((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  }

  const addContratista = () => {
    setContratistas((prev) => [...prev, { numero_documento: '', nombre_completo: '' }])
  }

  const removeContratista = (idx: number) => {
    setContratistas((prev) => (prev.length <= 1 ? prev : prev.filter((_c, i) => i !== idx)))
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
        maxWidth:     '760px',
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow:     'hidden',
        maxHeight:    'calc(100vh - 48px)',
        display:      'flex',
        flexDirection:'column',
      }}
      className="modal-enter"
      >

        {/* Header */}
        <div style={{
          padding:        '20px 24px',
          borderBottom:   '1px solid var(--border-subtle)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width:          '34px',
              height:         '34px',
              background:     'rgba(192,80,80,0.08)',
              border:         '1px solid rgba(192,80,80,0.2)',
              borderRadius:   'var(--radius-md)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={16} color="var(--danger-400)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Nueva Excepción
              </h2>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                Pre-aprobado sin protocolo completo (individual o por empresa)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

          {/* Aviso */}
          <div style={{
            padding:      '10px 14px',
            background:   'rgba(192,80,80,0.06)',
            border:       '1px solid rgba(192,80,80,0.15)',
            borderRadius: 'var(--radius-md)',
            fontSize:     '0.78rem',
            color:        'var(--danger-400)',
            lineHeight:   1.5,
          }}>
            ⚠ Las excepciones permiten ingreso sin cumplir el protocolo HSE completo. Úsalas con criterio y documenta bien el motivo.
          </div>

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

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setModo('individual')}
              className={modo === 'individual' ? 'btn-primary' : 'btn-ghost'}
            >
              Individual
            </button>
            <button
              type="button"
              onClick={() => setModo('empresa')}
              className={modo === 'empresa' ? 'btn-primary' : 'btn-ghost'}
            >
              Por Empresa
            </button>
          </div>

          {modo === 'individual' ? (
            <>
              <div>
                <label style={labelStyle}>NOMBRE COMPLETO</label>
                <input
                  type="text"
                  value={formIndividual.nombre_completo}
                  onChange={e => setFormIndividual(f => ({ ...f, nombre_completo: e.target.value }))}
                  placeholder="Ej: Carlos Alberto Ruiz"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>TIPO DOC</label>
                  <select
                    value={tipoDocIndividual}
                    onChange={e => {
                      setTipoDocIndividual(e.target.value as 'CC' | 'CE' | 'PASAPORTE' | 'TI')
                      setFormIndividual(f => ({ ...f, numero_documento: '' }))
                    }}
                    style={inputStyle}
                  >
                    {(['CC', 'CE', 'PASAPORTE', 'TI'] as const).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>NÚMERO DE DOCUMENTO</label>
                  <input
                    type="text"
                    value={formIndividual.numero_documento}
                    onChange={e => {
                      const v = e.target.value
                      const cleaned = (tipoDocIndividual === 'PASAPORTE' || tipoDocIndividual === 'CE')
                        ? v.toUpperCase().replace(/[^A-Z0-9]/g, '')
                        : v.replace(/[^\d]/g, '')
                      setFormIndividual(f => ({ ...f, numero_documento: cleaned }))
                    }}
                    placeholder={tipoDocIndividual === 'PASAPORTE' ? 'Ej: AB123456' : 'Ej: 1012345678'}
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={labelStyle}>PROVEEDOR / EMPRESA</label>
                <select
                  value={formBase.proveedor_id}
                  onChange={e => setFormBase(f => ({ ...f, proveedor_id: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Seleccionar proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Si falta un proveedor, créalo desde el botón Nuevo Proveedor en la vista principal.
                </p>
              </div>
              <div>
                <label style={labelStyle}>CONTRATISTAS DEL PROVEEDOR</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contratistas.map((c, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '8px' }}>
                      <input
                        type="text"
                        value={c.numero_documento}
                        onChange={e => updateContratista(idx, { numero_documento: e.target.value.replace(/[^\d]/g, '') })}
                        placeholder="Cédula"
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        value={c.nombre_completo}
                        onChange={e => updateContratista(idx, { nombre_completo: e.target.value })}
                        placeholder="Nombre completo"
                        style={inputStyle}
                      />
                      <button type="button" className="btn-icon-danger" onClick={() => removeContratista(idx)} title="Quitar fila">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn-ghost" onClick={addContratista}>
                    <Plus size={14} /> Agregar contratista
                  </button>
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Cada contratista se diligencia por separado para evitar confusiones.
                </p>
              </div>
            </>
          )}

          {/* Motivo */}
          <div>
            <label style={labelStyle}>MOTIVO DE LA EXCEPCIÓN</label>
            <textarea
              value={formBase.motivo}
              onChange={e => setFormBase(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Describe detalladamente por qué se otorga esta excepción..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
            <p style={{
              fontSize:  '0.68rem',
              color:     formBase.motivo.length < 10 ? 'var(--danger-400)' : 'var(--text-muted)',
              marginTop: '4px',
            }}>
              {formBase.motivo.length}/10 mínimo
            </p>
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>FECHA INICIO</label>
              <input
                type="date"
                value={formBase.fecha_inicio}
                onChange={e => setFormBase(f => ({ ...f, fecha_inicio: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>FECHA FIN</label>
              <input
                type="date"
                value={formBase.fecha_fin}
                onChange={e => setFormBase(f => ({ ...f, fecha_fin: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:        '16px 24px',
          borderTop:      '1px solid var(--border-subtle)',
          display:        'flex',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-danger"
          >
            {loading ? (
              <>
                <div style={{
                  width:        '12px',
                  height:       '12px',
                  border:       '2px solid rgba(255,255,255,0.3)',
                  borderTop:    '2px solid white',
                  borderRadius: '50%',
                  animation:    'spin 1s linear infinite',
                }} />
                Creando...
              </>
            ) : 'Crear Excepción'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function ExcepcionesView() {
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const hasAnyRole = useAuthStore(s => s.hasAnyRole)
  const canManageProviders = hasAnyRole(['ADMIN_GLOBAL', 'ADMIN_HSE'])

  const [excepciones, setExcepciones] = useState<ExcepcionResponse[]>([])
  const [proveedores, setProveedores] = useState<ProveedorHSEOption[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [refresh,     setRefresh]     = useState(0)
  const [accionando, setAccionando] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [excepcionDetalleId, setExcepcionDetalleId] = useState<number | null>(null)
  const [excepcionEditando, setExcepcionEditando] = useState<ExcepcionResponse | null>(null)
  const [confirmAccion, setConfirmAccion] = useState<{ id: number; tipo: 'ACTIVAR' | 'DESACTIVAR'; nombre: string } | null>(null)
  const [confirmEliminar, setConfirmEliminar] = useState<{ tipo: 'EXCEPCION' | 'PROVEEDOR'; id: number; nombre: string } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!sedeActiva?.id) {
        setExcepciones([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await hseService.listarExcepciones(sedeActiva.id)
        setExcepciones(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [refresh, sedeActiva?.id])

  const loadProveedores = async () => {
    try {
      const data = await hseService.getProveedores()
      setProveedores(data)
    } catch (_e) {
      setProveedores([])
    }
  }

  useEffect(() => {
    void loadProveedores()
  }, [])

  const handleDesactivar = async (id: number) => {
    setAccionando(id)
    try {
      await hseService.desactivarExcepcion(id)
      toast.success('Excepción desactivada correctamente.')
      setConfirmAccion(null)
      setRefresh(r => r + 1)
    } catch (e) {
      toast.error(`No se pudo desactivar la excepción. ${getErrorMessage(e)}`)
    } finally {
      setAccionando(null)
    }
  }

  const handleActivar = async (id: number) => {
    setAccionando(id)
    try {
      await hseService.activarExcepcion(id)
      toast.success('Excepción activada correctamente.')
      setConfirmAccion(null)
      setRefresh(r => r + 1)
    } catch (e) {
      toast.error(`No se pudo activar la excepción. ${getErrorMessage(e)}`)
    } finally {
      setAccionando(null)
    }
  }

  const handleEliminarExcepcion = async (id: number) => {
    setEliminando(true)
    try {
      await hseService.eliminarExcepcion(id)
      toast.success('Excepción eliminada correctamente.')
      setConfirmEliminar(null)
      setRefresh(r => r + 1)
    } catch (e) {
      toast.error(`No se pudo eliminar la excepción. ${getErrorMessage(e)}`)
    } finally {
      setEliminando(false)
    }
  }

  const handleEliminarProveedor = async (id: number) => {
    setEliminando(true)
    try {
      await hseService.eliminarProveedor(id)
      toast.success('Proveedor eliminado correctamente.')
      setConfirmEliminar(null)
      setProveedores(prev => prev.filter(p => p.id !== id))
      setRefresh(r => r + 1)
    } catch (e) {
      toast.error(`No se pudo eliminar el proveedor. ${getErrorMessage(e)}`)
    } finally {
      setEliminando(false)
    }
  }

  const activas   = excepciones.filter(e => e.activa)
  const inactivas = excepciones.filter(e => !e.activa)

  const filteredExcepciones = excepciones.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const nombre = (e.nombre_completo || '').toLowerCase()
    const cedula = (e.numero_documento || '').toLowerCase()
    const proveedor = (e.proveedor_nombre || '').toLowerCase()
    return nombre.includes(q) || cedula.includes(q) || proveedor.includes(q)
  })

  const groupedByProveedor: Record<string, { label: string; isEmpresa: boolean; items: ExcepcionResponse[] }> = {}
  for (const ex of filteredExcepciones) {
    const tieneProveedor = Boolean(ex.proveedor_id)
    const key = tieneProveedor ? `prov-${ex.proveedor_id}` : 'sin-proveedor'
    if (!groupedByProveedor[key]) {
      groupedByProveedor[key] = {
        label: tieneProveedor
          ? (ex.proveedor_nombre || 'Proveedor sin nombre')
          : 'Sin proveedor asignado',
        isEmpresa: tieneProveedor,
        items: [],
      }
    }
    groupedByProveedor[key].items.push(ex)
  }

  const gruposOrdenados = Object.entries(groupedByProveedor).sort((a, b) => {
    if (a[1].isEmpresa === b[1].isEmpresa) return a[1].label.localeCompare(b[1].label)
    return a[1].isEmpresa ? -1 : 1
  })

  const gruposPagination = usePagination(gruposOrdenados, 5)

  useEffect(() => {
    setExpandedGroups((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [key] of gruposOrdenados) {
        if (next[key] === undefined) {
          next[key] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [filteredExcepciones.length])

  const hoy = localDateStr()

  const getVigenciaColor = (e: ExcepcionResponse) => {
    if (!e.activa) return 'var(--text-muted)'
    if (e.fecha_fin < hoy) return 'var(--danger-400)'
    return 'var(--success-400)'
  }

  const getVigenciaLabel = (e: ExcepcionResponse) => {
    if (!e.activa) return 'Desactivada'
    if (e.fecha_fin < hoy) return 'Vencida'
    if (e.fecha_inicio > hoy) return 'Próxima'
    return 'Activa'
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>

      {/* Header */}
      <div
        style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
        className="animate-fade-up"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <AlertTriangle size={14} color="var(--danger-400)" />
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.68rem',
              color:         'var(--danger-400)',
              letterSpacing: '0.12em',
            }}>
              HSE / EXCEPCIONES
            </span>
          </div>
          <h1 style={{
            fontSize:      '1.5rem',
            fontWeight:    700,
            color:         'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom:  '4px',
          }}>
            Excepciones HSE
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {activas.length} activa{activas.length !== 1 ? 's' : ''} · {inactivas.length} inactiva{inactivas.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setRefresh(r => r + 1)}
            className="btn-icon"
            title="Actualizar"
          >
            <RefreshCw size={14} />
          </button>
          {canManageProviders && (
            <button
              onClick={() => setShowProveedorModal(true)}
              className="btn-ghost"
              title="Crear proveedor"
            >
              <Plus size={14} />
              Nuevo Proveedor
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-danger"
          >
            <Plus size={14} />
            Nueva Excepción
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en tiempo real por nombre, cédula o proveedor..."
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '0.83rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            outline: 'none',
          }}
        />
      </div>

      {/* Stats */}
      <div
        style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:                 '14px',
          marginBottom:        '24px',
        }}
        className="animate-fade-up stagger-1"
      >
        {[
          {
            label: 'Activas vigentes',
            value: activas.filter(e => e.fecha_fin >= hoy && e.fecha_inicio <= hoy).length,
            color: 'var(--success-400)',
            bg:    'rgba(40,149,108,0.08)',
          },
          {
            label: 'Vencidas activas',
            value: activas.filter(e => e.fecha_fin < hoy).length,
            color: 'var(--danger-400)',
            bg:    'rgba(192,80,80,0.08)',
          },
          {
            label: 'Total registradas',
            value: excepciones.length,
            color: 'var(--text-secondary)',
            bg:    'var(--bg-elevated)',
          },
          {
            label: 'Origen empresa',
            value: excepciones.filter(e => e.origen_excepcion === 'EMPRESA').length,
            color: '#7080CC',
            bg:    'rgba(86,104,184,0.10)',
          },
        ].map(stat => (
        <div key={stat.label}
          className="stat-card"
          style={{
            padding:      '16px 20px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {stat.label.toUpperCase()}
            </div>
            <div style={{
              fontSize:   '1.75rem',
              fontWeight: 800,
              color:      stat.color,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Lista agrupada */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        className="animate-fade-up stagger-2"
      >
        {loading ? (
          <div style={{
            padding:        '48px',
            textAlign:      'center',
            color:          'var(--text-muted)',
            fontSize:       '0.83rem',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '10px',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              width:        '16px',
              height:       '16px',
              border:       '2px solid var(--border-default)',
              borderTop:    '2px solid var(--primary-500)',
              borderRadius: '50%',
              animation:    'spin 1s linear infinite',
            }} />
            Cargando...
          </div>
        ) : filteredExcepciones.length === 0 ? (
          <div style={{
            padding:   '48px',
            textAlign: 'center',
            color:     'var(--text-muted)',
            fontSize:  '0.83rem',
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
          }}>
            No hay resultados para tu búsqueda.
          </div>
        ) : (
          gruposPagination.paginatedData.map(([groupKey, group], groupIndex) => {
            const isExpanded = expandedGroups[groupKey] ?? true
            const activosGrupo = group.items.filter(i => i.activa).length

            return (
              <div key={groupKey}>
                {groupIndex > 0 && (
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
                    background:   'var(--bg-surface)',
                    border:       '1px solid var(--border-subtle)',
                    borderLeft:   group.isEmpresa ? '4px solid rgba(86,104,184,0.5)' : '4px solid rgba(148,163,184,0.55)',
                    borderRadius: 'var(--radius-lg)',
                    overflow:     'hidden',
                  }}
                >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: group.isEmpresa ? 'rgba(86,104,184,0.08)' : 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !isExpanded }))}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      minWidth: 0,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      textAlign: 'left',
                    }}
                  >
                    {isExpanded ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                    <div style={{ display: 'grid', gap: '1px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'left' }}>
                        Empresa / proveedor
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>
                        {group.label}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      {group.items.length} contratista{group.items.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {activosGrupo} activas
                    </span>
                    {canManageProviders && group.isEmpresa && (
                      <button
                        type="button"
                        onClick={() => {
                          const provId = Number(groupKey.replace('prov-', ''))
                          setConfirmEliminar({ tipo: 'PROVEEDOR', id: provId, nombre: group.label })
                        }}
                        title="Eliminar proveedor"
                        style={{
                          padding: '4px 8px',
                          background: 'transparent',
                          color: 'var(--danger-400)',
                          border: '1px solid rgba(192,80,80,0.25)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={12} /> Eliminar empresa
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '12px', display: 'grid', gap: '10px' }}>
                    {group.items.map((e) => (
                      <div
                        key={e.id}
                        style={{
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)',
                          padding: '12px',
                          opacity: e.activa ? 1 : 0.62,
                          display: 'grid',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <User size={12} color="var(--text-muted)" />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                {formatDisplayName(e)}
                              </div>
                              <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                                #{e.id} · {e.tipo_documento || 'CC'} {e.numero_documento || '—'}
                              </div>
                            </div>
                          </div>

                          <span style={{
                            padding: '3px 8px',
                            background: `${getVigenciaColor(e)}15`,
                            border: `1px solid ${getVigenciaColor(e)}30`,
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            color: getVigenciaColor(e),
                            fontWeight: 600,
                            height: 'fit-content',
                          }}>
                            {getVigenciaLabel(e)}
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '8px 12px',
                          fontSize: '0.73rem',
                        }}>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Vigencia:</strong> {e.fecha_inicio} → {e.fecha_fin}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Proveedor:</strong> {e.proveedor_nombre || 'Sin proveedor'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Estado:</strong> {e.activa ? 'Activa' : 'Inactiva'}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <strong style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Motivo:</strong> {e.motivo}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            onClick={() => setExcepcionDetalleId(e.id)}
                            className="btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                            title="Ver detalle"
                          >
                            <Eye size={13} /> Ver
                          </button>
                          <button
                            onClick={() => setExcepcionEditando(e)}
                            className="btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                            title="Editar excepción"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                          {e.activa ? (
                            <button
                              onClick={() => setConfirmAccion({ id: e.id, tipo: 'DESACTIVAR', nombre: formatDisplayName(e) })}
                              disabled={accionando === e.id}
                              style={{
                                padding: '6px 10px',
                                minWidth: '96px',
                                background: 'var(--danger-500)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: accionando === e.id ? 'not-allowed' : 'pointer',
                                opacity: accionando === e.id ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {accionando === e.id ? '...' : 'Desactivar'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmAccion({ id: e.id, tipo: 'ACTIVAR', nombre: formatDisplayName(e) })}
                              disabled={accionando === e.id}
                              style={{
                                padding: '6px 10px',
                                minWidth: '96px',
                                background: 'var(--primary-500)',
                                color: 'var(--text-inverted)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: accionando === e.id ? 'not-allowed' : 'pointer',
                                opacity: accionando === e.id ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {accionando === e.id ? '...' : 'Activar'}
                            </button>
                          )}
                          {canManageProviders && (
                            <button
                              onClick={() => setConfirmEliminar({ tipo: 'EXCEPCION', id: e.id, nombre: formatDisplayName(e) })}
                              title="Eliminar excepción definitivamente"
                              style={{
                                marginLeft: 'auto',
                                padding: '6px 10px',
                                background: 'transparent',
                                color: 'var(--danger-400)',
                                border: '1px solid rgba(192,80,80,0.25)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )
          })
        )}
        <Pagination
          currentPage={gruposPagination.currentPage}
          totalPages={gruposPagination.totalPages}
          onNext={gruposPagination.nextPage}
          onPrev={gruposPagination.prevPage}
          onGoTo={gruposPagination.goToPage}
          totalItems={gruposPagination.totalItems}
        />
      </div>

      {showModal && (
        <ModalCrear
          sedeId={sedeActiva?.id ?? null}
          proveedores={proveedores}
          onClose={() => setShowModal(false)}
          onCreated={() => setRefresh(r => r + 1)}
        />
      )}

      {showProveedorModal && (
        <ModalCrearProveedor
          onClose={() => setShowProveedorModal(false)}
          onCreated={(created) => {
            setProveedores((prev) => {
              const exists = prev.some((p) => p.id === created.id)
              return exists ? prev : [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre))
            })
          }}
        />
      )}

      {excepcionDetalleId && (
        <ModalDetalleExcepcion
          excepcionId={excepcionDetalleId}
          onClose={() => setExcepcionDetalleId(null)}
        />
      )}

      {excepcionEditando && (
        <ModalEditarExcepcion
          excepcion={excepcionEditando}
          proveedores={proveedores}
          onClose={() => setExcepcionEditando(null)}
          onSaved={() => setRefresh((r) => r + 1)}
        />
      )}

      <ConfirmActionModal
        open={confirmAccion !== null}
        title={confirmAccion?.tipo === 'DESACTIVAR' ? 'Desactivar excepción' : 'Activar excepción'}
        message={
          confirmAccion?.tipo === 'DESACTIVAR'
            ? `Vas a desactivar la excepción de ${confirmAccion.nombre}. El contratista no podrá ingresar con esta excepción.`
            : `Vas a activar nuevamente la excepción de ${confirmAccion?.nombre}.`
        }
        confirmLabel={confirmAccion?.tipo === 'DESACTIVAR' ? 'Desactivar excepción' : 'Activar excepción'}
        cancelLabel="Cancelar"
        tone={confirmAccion?.tipo === 'DESACTIVAR' ? 'danger' : 'primary'}
        loading={accionando !== null}
        onCancel={() => setConfirmAccion(null)}
        onConfirm={() => {
          if (!confirmAccion) return
          if (confirmAccion.tipo === 'DESACTIVAR') {
            void handleDesactivar(confirmAccion.id)
            return
          }
          void handleActivar(confirmAccion.id)
        }}
      />

      <ConfirmActionModal
        open={confirmEliminar !== null}
        title={confirmEliminar?.tipo === 'PROVEEDOR' ? 'Eliminar proveedor' : 'Eliminar excepción'}
        message={
          confirmEliminar?.tipo === 'PROVEEDOR'
            ? `Vas a eliminar el proveedor "${confirmEliminar.nombre}". Las excepciones asociadas quedarán sin proveedor asignado. Esta acción no se puede deshacer.`
            : `Vas a eliminar definitivamente la excepción de ${confirmEliminar?.nombre}. Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Cancelar"
        tone="danger"
        loading={eliminando}
        onCancel={() => setConfirmEliminar(null)}
        onConfirm={() => {
          if (!confirmEliminar) return
          if (confirmEliminar.tipo === 'PROVEEDOR') {
            void handleEliminarProveedor(confirmEliminar.id)
          } else {
            void handleEliminarExcepcion(confirmEliminar.id)
          }
        }}
      />
    </div>
  )
}
