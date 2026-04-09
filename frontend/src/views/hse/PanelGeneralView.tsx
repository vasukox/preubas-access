/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Panel General HSE — Gestión de autorizaciones
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ShieldCheck, Plus, Search, Eye, Trash2, Copy,
  RefreshCw, Calendar, Users,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  Building2, Pencil,
} from 'lucide-react'
import { hseService } from '@/services/hse.service'
import { useSedeStore } from '@/store/sedeStore'
import { useAuthStore } from '@/store/authStore'
import type { SedeBasica } from '@/types'
import type {
  AutorizacionListResponse,
  EstadoAutorizacion,
  TipoContratista,
  ProveedorHSEOption,
} from '@/types/hse'
import {
  ESTADO_AUTORIZACION_LABEL,
  ESTADO_AUTORIZACION_COLOR,
  TIPO_CONTRATISTA_LABEL,
} from '@/types/hse'
import { getErrorMessage } from '@/services/api'
import { ConfirmActionModal } from '@/components/feedback/ConfirmActionModal'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'

// ── Badge de estado ───────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: EstadoAutorizacion }) {
  const icons: Record<EstadoAutorizacion, React.ElementType> = {
    BORRADOR:              Clock,
    PENDIENTE_AUTOGESTION: Clock,
    EN_REVISION:           Clock,
    APROBADO:              CheckCircle2,
    DENEGADO:              XCircle,
    VENCIDO:               AlertTriangle,
  }
  const Icon  = icons[estado]
  const color = ESTADO_AUTORIZACION_COLOR[estado]

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 8px',
      background:   `${color}15`,
      border:       `1px solid ${color}30`,
      borderRadius: '20px',
      fontSize:     '0.7rem',
      color,
      fontWeight:   500,
      whiteSpace:   'nowrap',
    }}>
      <Icon size={10} />
      {ESTADO_AUTORIZACION_LABEL[estado]}
    </span>
  )
}

// ── Modal crear proveedor ─────────────────────────────────────────
function ModalCrearProveedor({
  onClose,
  onCreated,
}: {
  onClose:   () => void
  onCreated: (p: ProveedorHSEOption) => void
}) {
  const [nombre, setNombre] = useState('')
  const [nit,    setNit]    = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: '0.83rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
  }

  const handleCrear = async () => {
    if (!nombre.trim() || !nit.trim()) { setError('Debes ingresar nombre y NIT.'); return }
    setSaving(true); setError(null)
    try {
      const created = await hseService.crearProveedor({ nombre: nombre.trim(), nit: nit.trim() })
      toast.success(`Proveedor ${created.nombre} creado correctamente.`)
      onCreated(created)
      onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo crear el proveedor. ${msg}`)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={16} color="var(--primary-400)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nuevo proveedor</h3>
        </div>
        <div style={{ padding: '18px 22px', display: 'grid', gap: '12px' }}>
          {error && <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', fontSize: '0.8rem' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NOMBRE / RAZÓN SOCIAL</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Servicios Técnicos S.A.S." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NIT</label>
            <input type="text" value={nit} onChange={e => setNit(e.target.value)} placeholder="900123456-1" style={inputStyle} />
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleCrear} disabled={saving}>
            {saving ? 'Creando...' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal editar proveedor ────────────────────────────────────────
function ModalEditarProveedor({
  proveedor,
  onClose,
  onSaved,
}: {
  proveedor: ProveedorHSEOption
  onClose:   () => void
  onSaved:   () => void
}) {
  const [nombre, setNombre] = useState(proveedor.nombre)
  const [nit,    setNit]    = useState('')
  const [activo, setActivo] = useState(proveedor.activo)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: '0.83rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
  }

  const handleGuardar = async () => {
    if (!nombre.trim() || !nit.trim()) { setError('Nombre y NIT son requeridos.'); return }
    setSaving(true); setError(null)
    try {
      await hseService.actualizarProveedor(proveedor.id, { nombre: nombre.trim(), nit: nit.trim(), activo })
      toast.success(`Proveedor ${nombre.trim()} actualizado correctamente.`)
      onSaved(); onClose()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo actualizar el proveedor. ${msg}`)
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pencil size={16} color="var(--primary-400)" />
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Editar proveedor</h3>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{proveedor.nombre}</p>
          </div>
        </div>
        <div style={{ padding: '18px 22px', display: 'grid', gap: '12px' }}>
          {error && <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', fontSize: '0.8rem' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NOMBRE / RAZÓN SOCIAL</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>NIT</label>
            <input type="text" value={nit} onChange={e => setNit(e.target.value)} placeholder="900123456-1" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="chk-activo" checked={activo} onChange={e => setActivo(e.target.checked)} />
            <label htmlFor="chk-activo" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Proveedor activo</label>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Panel gestión de proveedores ──────────────────────────────────
function ModalGestionProveedores({
  proveedores,
  onClose,
  onRefresh,
}: {
  proveedores: ProveedorHSEOption[]
  onClose:     () => void
  onRefresh:   () => void
}) {
  const [creando,    setCreando]    = useState(false)
  const [editando,   setEditando]   = useState<ProveedorHSEOption | null>(null)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [confirmDeleteProviderId, setConfirmDeleteProviderId] = useState<number | null>(null)
  const [error,      setError]      = useState<string | null>(null)

  const pagination = usePagination(proveedores, 6)

  const handleEliminar = async (id: number) => {
    setEliminando(id); setError(null)
    try {
      await hseService.eliminarProveedor(id)
      toast.success('Proveedor eliminado correctamente.')
      setConfirmDeleteProviderId(null)
      onRefresh()
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      toast.error(`No se pudo eliminar el proveedor. ${msg}`)
    } finally { setEliminando(null) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '700px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', maxHeight: 'calc(100vh - 48px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={16} color="var(--primary-400)" />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestión de proveedores</h3>
              <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>{proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''} registrado{proveedores.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-primary" onClick={() => setCreando(true)} style={{ fontSize: '0.78rem' }}>
              <Plus size={13} /> Nuevo
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ padding: '10px 12px', marginBottom: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger-400)', fontSize: '0.8rem' }}>{error}</div>}

          {proveedores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              No hay proveedores registrados. Crea el primero.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pagination.paginatedData.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={14} color={p.activo ? 'var(--primary-400)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: p.activo ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.nombre}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        ID #{p.id} · {p.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn-icon" title="Editar" onClick={() => setEditando(p)} style={{ width: '28px', height: '28px' }}>
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Eliminar"
                      disabled={eliminando === p.id}
                      onClick={() => setConfirmDeleteProviderId(p.id)}
                      style={{ width: '28px', height: '28px', color: 'var(--danger-400)', borderColor: 'rgba(239,68,68,0.15)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onNext={pagination.nextPage}
          onPrev={pagination.prevPage}
          onGoTo={pagination.goToPage}
          totalItems={pagination.totalItems}
        />
      </div>

      {creando && (
        <ModalCrearProveedor
          onClose={() => setCreando(false)}
          onCreated={() => { setCreando(false); onRefresh() }}
        />
      )}
      {editando && (
        <ModalEditarProveedor
          proveedor={editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); onRefresh() }}
        />
      )}

      <ConfirmActionModal
        open={confirmDeleteProviderId !== null}
        title="Eliminar proveedor"
        message="Solo puedes eliminar este proveedor si no tiene autorizaciones ni contratistas asociados."
        confirmLabel="Eliminar proveedor"
        cancelLabel="Cancelar"
        tone="danger"
        loading={eliminando !== null}
        onCancel={() => setConfirmDeleteProviderId(null)}
        onConfirm={() => {
          if (confirmDeleteProviderId === null) return
          void handleEliminar(confirmDeleteProviderId)
        }}
      />
    </div>
  )
}

// ── Modal crear autorización ──────────────────────────────────────
function ModalCrear({
  initialSedeId,
  sedes,
  proveedores,
  onClose,
  onCreated,
  onNuevoProveedor,
}: {
  initialSedeId:    number
  sedes:            SedeBasica[]
  proveedores:      ProveedorHSEOption[]
  onClose:          () => void
  onCreated:        () => void
  onNuevoProveedor: () => void
}) {
  const [step, setStep]       = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [createdData, setCreatedData] = useState<any>(null)
  const [selectedSedeId, setSelectedSedeId] = useState<number>(initialSedeId > 0 ? initialSedeId : 0)

  const [form, setForm] = useState({
    tipo_contratista:      'ALTO_RIESGO' as TipoContratista,
    descripcion_actividad: '',
    fecha_inicio:          '',
    fecha_fin:             '',
    proveedor_id:          '' as string,
  })

  const [contratistas, setContratistas] = useState([{
    tipo_documento:   'CC',
    numero_documento: '',
    nombres:          '',
    apellidos:        '',
    email:            '',
    telefono:         '',
    es_extranjero:    false,
  }])

  const agregarContratista = () => {
    setContratistas(prev => [...prev, {
      tipo_documento:   'CC',
      numero_documento: '',
      nombres:          '',
      apellidos:        '',
      email:            '',
      telefono:         '',
      es_extranjero:    false,
    }])
  }

  const actualizarContratista = (idx: number, key: string, value: string | boolean) => {
    setContratistas(prev => prev.map((c, i) => i === idx ? { ...c, [key]: value } : c))
  }

  const eliminarContratista = (idx: number) => {
    if (contratistas.length === 1) return
    setContratistas(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await hseService.crearAutorizacion({
        sede_id:               selectedSedeId,
        tipo_contratista:      form.tipo_contratista,
        descripcion_actividad: form.descripcion_actividad,
        fecha_inicio:          form.fecha_inicio,
        fecha_fin:             form.fecha_fin,
        proveedor_id:          form.proveedor_id ? Number(form.proveedor_id) : undefined,
        contratistas:          contratistas as any,
      })

      const hayTokenEnRespuesta = (resp?.contratistas || []).every((c: any) => Boolean(c?.token_autogestion))
      if (!hayTokenEnRespuesta && resp?.id) {
        const refreshed = await hseService.getAutorizacion(resp.id)
        setCreatedData(refreshed)
      } else {
        setCreatedData(resp)
      }
      const totalContratistas = Array.isArray(resp?.contratistas) ? resp.contratistas.length : 0
      toast.success(`Autorización creada para ${totalContratistas} contratista${totalContratistas === 1 ? '' : 's'}.`)
      setStep(3)
    } catch (e) {
      const rawError = getErrorMessage(e)
      if (
        rawError.toLowerCase().includes('descripcion_actividad') &&
        rawError.toLowerCase().includes('at least 10')
      ) {
        setError('La descripción de la actividad debe tener al menos 10 caracteres para poder continuar.')
        toast.error('La descripción de la actividad debe tener al menos 10 caracteres para poder continuar.')
      } else {
        setError(rawError)
        toast.error(`No se pudo crear la autorización. ${rawError}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({
      tipo_contratista:      'ALTO_RIESGO' as TipoContratista,
      descripcion_actividad: '',
      fecha_inicio:          '',
      fecha_fin:             '',
      proveedor_id:          '',
    })
    setContratistas([{
      tipo_documento:   'CC',
      numero_documento: '',
      nombres:          '',
      apellidos:        '',
      email:            '',
      telefono:         '',
      es_extranjero:    false,
    }])
    setError(null)
    setCreatedData(null)
  }

  const handleCrearOtraMas = () => {
    resetForm()
    setStep(1)
    onCreated()  // Refresca la lista de autorizaciones
  }

  const handleTerminar = () => {
    resetForm()
    onClose()
    onCreated()  // Refresca la lista
  }

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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    colorScheme: 'dark',
    paddingRight: '32px',
    backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%)',
    backgroundPosition: 'calc(100% - 14px) calc(50% - 2px), calc(100% - 9px) calc(50% - 2px)',
    backgroundSize: '5px 5px, 5px 5px',
    backgroundRepeat: 'no-repeat',
    cursor: 'pointer',
  }

  const labelStyle: React.CSSProperties = {
    display:       'block',
    fontSize:      '0.72rem',
    fontWeight:    500,
    color:         'var(--text-secondary)',
    marginBottom:  '5px',
    letterSpacing: '0.04em',
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
        maxWidth:     '620px',
        maxHeight:    '90vh',
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow:     'hidden',
        display:      'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding:      '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          flexShrink:   0,
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {step === 3 ? '¡Autorización Creada!' : 'Nueva Autorización HSE'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {step === 3 ? 'Comparte el link con los contratistas' : `Paso ${step} de 2 — ${step === 1 ? 'Datos generales' : 'Contratistas'}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border:     'none',
              color:      'var(--text-muted)',
              cursor:     'pointer',
              padding:    '4px',
              fontSize:   '1.2rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Indicador de pasos */}
        <div style={{
          display:    'flex',
          padding:    '12px 24px',
          gap:        '8px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          {[1, 2].map(s => (
            <div
              key={s}
              style={{
                flex:         1,
                height:       '3px',
                borderRadius: '2px',
                background:   s <= step ? 'var(--primary-500)' : 'var(--border-default)',
                transition:   'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding:      '10px 14px',
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              fontSize:     '0.8rem',
              color:        'var(--danger-400)',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {step === 3 ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
               <CheckCircle2 size={42} color="var(--success-500)" style={{ margin: '0 auto 16px' }} />
               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                 Copia el link de autogestión y envíalo a cada contratista.
               </p>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                 {createdData?.contratistas?.map((c: any, i: number) => (
                   <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                     <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                       {c.nombres} {c.apellidos}
                     </div>
                     <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
                       {c.tipo_documento} {c.numero_documento}
                     </div>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       {c.token_autogestion ? (
                         <>
                           <input
                             type="text"
                             readOnly
                             value={`${window.location.origin}/portal/hse/${c.token_autogestion}`}
                             style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-secondary)', outline: 'none' }}
                           />
                           <button
                             onClick={() => {
                               navigator.clipboard.writeText(`${window.location.origin}/portal/hse/${c.token_autogestion}`);
                               toast.success(`Link de autogestión copiado para ${c.nombres} ${c.apellidos}.`)
                               const btn = document.activeElement as HTMLButtonElement;
                               if (btn) {
                                 const originalText = btn.innerHTML;
                                 btn.innerHTML = '¡Copiado!';
                                 setTimeout(() => btn.innerHTML = originalText, 2000);
                               }
                             }}
                             className="btn-primary"
                             style={{ padding: '0 16px', fontSize: '0.75rem' }}
                           >
                             <Copy size={14} /> Copiar
                           </button>
                         </>
                       ) : (
                         <div style={{
                           width: '100%',
                           padding: '8px 12px',
                           background: 'rgba(239,68,68,0.08)',
                           border: '1px solid rgba(239,68,68,0.2)',
                           borderRadius: 'var(--radius-md)',
                           fontSize: '0.74rem',
                           color: 'var(--danger-400)',
                         }}>
                           Token no disponible aún. Actualiza y copia el link desde Gestión.
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          ) : step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Sede */}
              <div>
                <label style={labelStyle}>SEDE</label>
                <select
                  value={selectedSedeId > 0 ? String(selectedSedeId) : ''}
                  onChange={e => setSelectedSedeId(Number(e.target.value))}
                  style={selectStyle}
                >
                  <option value="">
                    {sedes.length === 0 ? 'Cargando sedes...' : 'Selecciona una sede...'}
                  </option>
                  {sedes.map(sede => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}{sede.ciudad ? ` — ${sede.ciudad}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo contratista */}
              <div>
                <label style={labelStyle}>TIPO DE CONTRATISTA</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['ALTO_RIESGO', 'NORMAL'] as TipoContratista[]).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_contratista: tipo }))}
                      style={{
                        flex:         1,
                        padding:      '10px',
                        background:   form.tipo_contratista === tipo
                          ? tipo === 'ALTO_RIESGO' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
                          : 'var(--bg-elevated)',
                        border:       `1px solid ${form.tipo_contratista === tipo
                          ? tipo === 'ALTO_RIESGO' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'
                          : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-md)',
                        color:        form.tipo_contratista === tipo
                          ? tipo === 'ALTO_RIESGO' ? 'var(--danger-400)' : 'var(--success-400)'
                          : 'var(--text-secondary)',
                        fontSize:     '0.8rem',
                        fontWeight:   600,
                        cursor:       'pointer',
                        fontFamily:   'var(--font-ui)',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'center',
                        gap:          '6px',
                        transition:   'all var(--transition-fast)',
                      }}
                    >
                      {tipo === 'ALTO_RIESGO' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                      {TIPO_CONTRATISTA_LABEL[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción actividad */}
              <div>
                <label style={labelStyle}>DESCRIPCIÓN DE LA ACTIVIDAD</label>
                <textarea
                  value={form.descripcion_actividad}
                  onChange={e => setForm(f => ({ ...f, descripcion_actividad: e.target.value }))}
                  placeholder="Describe la actividad que realizarán los contratistas..."
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize:     'vertical',
                    lineHeight: 1.5,
                  }}
                />
                <p style={{
                  fontSize: '0.68rem',
                  color: form.descripcion_actividad.trim().length > 0 && form.descripcion_actividad.trim().length < 10
                    ? 'var(--danger-400)'
                    : 'var(--text-muted)',
                  marginTop: '4px',
                }}>
                  Mínimo 10 caracteres
                </p>
              </div>

              {/* Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>FECHA INICIO</label>
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>FECHA FIN</label>
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Proveedor / Empresa */}
              <div>
                <label style={labelStyle}>PROVEEDOR / EMPRESA (OPCIONAL)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={form.proveedor_id}
                    onChange={e => setForm(f => ({ ...f, proveedor_id: e.target.value }))}
                    style={{ ...selectStyle, flex: 1 }}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={String(p.id)}>{p.nombre}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onNuevoProveedor}
                    title="Crear nuevo proveedor"
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '4px',
                      padding:      '0 12px',
                      background:   'rgba(245,158,11,0.08)',
                      border:       '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 'var(--radius-md)',
                      color:        'var(--primary-400)',
                      fontSize:     '0.75rem',
                      fontWeight:   600,
                      cursor:       'pointer',
                      fontFamily:   'var(--font-ui)',
                      whiteSpace:   'nowrap',
                    }}
                  >
                    <Plus size={12} /> Nuevo
                  </button>
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Los contratistas quedarán vinculados a la empresa seleccionada.
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Banner de empresa seleccionada */}
              {form.proveedor_id ? (
                <div style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '10px 14px',
                  marginBottom: '16px',
                  background:   'rgba(99,102,241,0.08)',
                  border:       '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <Building2 size={15} color="#818CF8" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>EMPRESA / PROVEEDOR</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {proveedores.find(p => String(p.id) === form.proveedor_id)?.nombre ?? `Proveedor #${form.proveedor_id}`}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Los contratistas abajo quedarán vinculados a esta empresa.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding:      '8px 14px',
                  marginBottom: '16px',
                  background:   'var(--bg-elevated)',
                  border:       '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize:     '0.75rem',
                  color:        'var(--text-muted)',
                }}>
                  Sin empresa asignada — puedes volver al paso anterior para seleccionar un proveedor.
                </div>
              )}

              <div style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Se generará un link de autogestión único por contratista.
                </p>
                <button
                  type="button"
                  onClick={agregarContratista}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '4px',
                    padding:      '6px 12px',
                    background:   'rgba(245,158,11,0.1)',
                    border:       '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)',
                    color:        'var(--primary-400)',
                    fontSize:     '0.75rem',
                    fontWeight:   600,
                    cursor:       'pointer',
                    fontFamily:   'var(--font-ui)',
                  }}
                >
                  <Plus size={12} />
                  Agregar
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contratistas.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding:      '16px',
                      background:   'var(--bg-elevated)',
                      border:       '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      marginBottom:   '12px',
                    }}>
                      <span style={{
                        fontSize:   '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        color:      'var(--primary-400)',
                      }}>
                        CONTRATISTA #{idx + 1}
                      </span>
                      {contratistas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarContratista(idx)}
                          style={{
                            background: 'transparent',
                            border:     'none',
                            color:      'var(--danger-400)',
                            cursor:     'pointer',
                            padding:    '2px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={labelStyle}>TIPO DOC</label>
                        <select
                          value={c.tipo_documento}
                          onChange={e => actualizarContratista(idx, 'tipo_documento', e.target.value)}
                          style={selectStyle}
                        >
                          {['CC', 'CE', 'PASAPORTE', 'TI'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>NÚMERO DE DOCUMENTO</label>
                        <input
                          type="text"
                          value={c.numero_documento}
                          onChange={e => actualizarContratista(idx, 'numero_documento', e.target.value)}
                          placeholder="12345678"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={labelStyle}>NOMBRES</label>
                        <input
                          type="text"
                          value={c.nombres}
                          onChange={e => actualizarContratista(idx, 'nombres', e.target.value)}
                          placeholder="Juan"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>APELLIDOS</label>
                        <input
                          type="text"
                          value={c.apellidos}
                          onChange={e => actualizarContratista(idx, 'apellidos', e.target.value)}
                          placeholder="Pérez"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={labelStyle}>EMAIL</label>
                        <input
                          type="email"
                          value={c.email}
                          onChange={e => actualizarContratista(idx, 'email', e.target.value)}
                          placeholder="juan@empresa.com"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>TELÉFONO</label>
                        <input
                          type="text"
                          value={c.telefono}
                          onChange={e => actualizarContratista(idx, 'telefono', e.target.value)}
                          placeholder="3001234567"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:        '16px 24px',
          borderTop:      '1px solid var(--border-subtle)',
          display:        'flex',
          justifyContent: 'space-between',
          gap:            '12px',
          flexShrink:     0,
        }}>
          {step === 3 ? (
            <>
              <button
                type="button"
                onClick={handleCrearOtraMas}
                style={{
                  padding:      '10px 20px',
                  background:   'transparent',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-secondary)',
                  fontSize:     '0.83rem',
                  fontWeight:   600,
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                  flex:         1,
                }}
              >
                ← Crear una más
              </button>
              <button
                type="button"
                onClick={handleTerminar}
                className="btn-primary"
                style={{ padding: '10px 24px', flex: 1, justifyContent: 'center' }}
              >
                Terminar ✓
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={step === 1 ? onClose : () => setStep(1)}
                style={{
                  padding:      '9px 20px',
                  background:   'transparent',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-secondary)',
                  fontSize:     '0.83rem',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                {step === 1 ? 'Cancelar' : 'Atrás'}
              </button>

              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedSedeId || selectedSedeId < 1) {
                      setError('Selecciona una sede válida.')
                      return
                    }
                    if (!form.descripcion_actividad || !form.fecha_inicio || !form.fecha_fin) {
                      setError('Completa todos los campos requeridos.')
                      return
                    }
                    if (form.descripcion_actividad.trim().length < 10) {
                      setError('La descripción de la actividad debe tener al menos 10 caracteres.')
                      return
                    }
                    setError(null)
                    setStep(2)
                  }}
                  style={{
                    padding:      '9px 24px',
                    background:   'var(--primary-500)',
                    border:       'none',
                    borderRadius: 'var(--radius-md)',
                    color:        'var(--text-inverted)',
                    fontSize:     '0.83rem',
                    fontWeight:   600,
                    cursor:       'pointer',
                    fontFamily:   'var(--font-ui)',
                  }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding:      '9px 24px',
                    background:   loading ? 'var(--primary-700)' : 'var(--primary-500)',
                    border:       'none',
                    borderRadius: 'var(--radius-md)',
                    color:        'var(--text-inverted)',
                    fontSize:     '0.83rem',
                    fontWeight:   600,
                    cursor:       loading ? 'not-allowed' : 'pointer',
                    fontFamily:   'var(--font-ui)',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width:        '12px',
                        height:       '12px',
                        border:       '2px solid rgba(0,0,0,0.2)',
                        borderTop:    '2px solid white',
                        borderRadius: '50%',
                        animation:    'spin 1s linear infinite',
                      }} />
                      Creando...
                    </>
                  ) : 'Crear Autorización'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function PanelGeneralView() {
  const navigate = useNavigate()
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const sedesStore = useSedeStore(s => s.sedes)
  const hasAnyRole = useAuthStore(s => s.hasAnyRole)
  const canManageProviders = hasAnyRole(['ADMIN_GLOBAL', 'ADMIN_HSE'])

  const [autorizaciones, setAutorizaciones] = useState<AutorizacionListResponse[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showModal,      setShowModal]      = useState(false)
  const [sedesDisponibles, setSedesDisponibles] = useState<SedeBasica[]>([])
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroEstado,   setFiltroEstado]   = useState<string>('todos')
  const [refresh,        setRefresh]        = useState(0)
  const [proveedores,    setProveedores]    = useState<ProveedorHSEOption[]>([])
  const [showGestionProv,   setShowGestionProv]   = useState(false)
  const [showCrearProvModal, setShowCrearProvModal] = useState(false)
  const [autorizacionAEliminar, setAutorizacionAEliminar] = useState<number | null>(null)

  useEffect(() => {
    const loadSedes = async () => {
      try {
        const data = await hseService.getSedes()
        setSedesDisponibles(data)
      } catch {
        setSedesDisponibles(sedesStore)
      }
    }
    loadSedes()
  }, [sedesStore])

  useEffect(() => {
    const load = async () => {
      if (!sedeActiva?.id) {
        setAutorizaciones([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const params: any = { sede_id: sedeActiva.id, per_page: 50 }
        if (filtroEstado !== 'todos') params.estado = filtroEstado
        const data = await hseService.listarAutorizaciones(params)
        setAutorizaciones(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filtroEstado, refresh, sedeActiva?.id])

  const loadProveedores = async () => {
    try {
      const data = await hseService.getProveedores()
      setProveedores(data)
    } catch {
      setProveedores([])
    }
  }

  useEffect(() => {
    void loadProveedores()
  }, [])

  const esExcepcion = (a: AutorizacionListResponse) =>
    /^excepci[oó]n\s*hse\s*:/i.test((a.descripcion_actividad || '').trim())

  const autorizacionesNormales = autorizaciones
    .filter(a => !esExcepcion(a))
    .filter(a =>
      busqueda === '' ||
      a.codigo.toLowerCase().includes(busqueda.toLowerCase())
    )

  const autorizacionesPagination = usePagination(autorizacionesNormales, 10)

  const handleEliminar = async (id: number) => {
    try {
      await hseService.eliminarAutorizacion(id)
      toast.success('Autorización eliminada correctamente.')
      setAutorizacionAEliminar(null)
      setRefresh(r => r + 1)
    } catch (e) {
      toast.error(`No se pudo eliminar la autorización. ${getErrorMessage(e)}`)
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
            <ShieldCheck size={14} color="var(--primary-400)" />
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.68rem',
              color:         'var(--primary-400)',
              letterSpacing: '0.12em',
            }}>
              HSE / PANEL GENERAL
            </span>
          </div>
          <h1 style={{
            fontSize:      '1.5rem',
            fontWeight:    700,
            color:         'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom:  '4px',
          }}>
            Autorizaciones HSE
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            {autorizacionesNormales.length} autorización{autorizacionesNormales.length !== 1 ? 'es' : ''} estándar
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
              onClick={() => setShowGestionProv(true)}
              className="btn-ghost"
              title="Gestión de proveedores"
            >
              <Building2 size={14} />
              Proveedores
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={14} />
            Nueva Autorización
          </button>
        </div>
      </div>

      {!sedeActiva?.id && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 12px',
          fontSize: '0.78rem',
          color: 'var(--primary-400)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.06)',
        }}>
          Selecciona una sede en el topbar para ver autorizaciones. Para crear, puedes elegir la sede dentro del modal.
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          display:      'flex',
          gap:          '12px',
          marginBottom: '20px',
          flexWrap:     'wrap',
        }}
        className="animate-fade-up stagger-1"
      >
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search
            size={14}
            style={{
              position:  'absolute',
              left:      '12px',
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar por código..."
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

        {/* Filtro estado */}
        {(['todos', 'PENDIENTE_AUTOGESTION', 'EN_REVISION', 'APROBADO', 'DENEGADO', 'VENCIDO'] as const).map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            style={{
              padding:      '8px 14px',
              background:   filtroEstado === estado ? 'var(--primary-500)' : 'var(--bg-surface)',
              border:       `1px solid ${filtroEstado === estado ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              color:        filtroEstado === estado ? 'var(--text-inverted)' : 'var(--text-secondary)',
              fontSize:     '0.75rem',
              fontWeight:   500,
              cursor:       'pointer',
              fontFamily:   'var(--font-ui)',
              whiteSpace:   'nowrap',
              transition:   'all var(--transition-fast)',
            }}
          >
            {estado === 'todos' ? 'Todos' : ESTADO_AUTORIZACION_LABEL[estado as EstadoAutorizacion]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="animate-fade-up stagger-2" style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow:     'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '960px' }}>
            {/* Encabezados */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'minmax(240px, 1fr) 130px 210px 140px 170px 100px',
              columnGap:           '14px',
              padding:             '10px 20px',
              borderBottom:        '1px solid var(--border-subtle)',
              background:          'var(--bg-elevated)',
            }}>
              {['Nombre', 'Tipo', 'Vigencia', 'Contratistas', 'Estado', 'Acciones'].map(h => (
              <div key={h} style={{
                fontSize:      '0.68rem',
                fontWeight:    600,
                color:         'var(--text-muted)',
                letterSpacing: '0.08em',
              }}>
                {h.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Filas */}
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
          ) : autorizacionesNormales.length === 0 ? (
            <div style={{
              padding:   '48px',
              textAlign: 'center',
              color:     'var(--text-muted)',
              fontSize:  '0.83rem',
            }}>
              {busqueda ? 'No se encontraron resultados.' : 'No hay autorizaciones estándar. Crea la primera.'}
            </div>
          ) : (
            autorizacionesPagination.paginatedData.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display:             'grid',
                  gridTemplateColumns: 'minmax(240px, 1fr) 130px 210px 140px 170px 100px',
                  columnGap:           '14px',
                  padding:             '14px 20px',
                  borderBottom:        i < autorizacionesNormales.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems:          'center',
                  transition:          'background var(--transition-fast)',
                }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {/* Nombre (contratista principal) */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize:      '0.82rem',
                  color:         'var(--text-primary)',
                  fontWeight:    600,
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  whiteSpace:    'nowrap',
                }}>
                  {a.contratistas?.[0]
                    ? `${a.contratistas[0].nombres} ${a.contratistas[0].apellidos}`.trim()
                    : 'Sin contratista'}
                </div>
                <div style={{
                  marginTop:     '2px',
                  fontSize:      '0.68rem',
                  color:         'var(--text-muted)',
                  fontFamily:    'var(--font-mono)',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                  whiteSpace:    'nowrap',
                }}>
                  <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{a.codigo}</span> · {a.contratistas?.[0]
                    ? `${a.contratistas[0].tipo_documento} ${a.contratistas[0].numero_documento}`
                    : '—'}
                  {(a.total_contratistas ?? 0) > 1 ? `  +${(a.total_contratistas ?? 1) - 1}` : ''}
                </div>
              </div>

              {/* Tipo */}
              <div>
                <span style={{
                  display:      'inline-flex',
                  alignItems:   'center',
                  gap:          '4px',
                  padding:      '3px 8px',
                  background:   a.tipo_contratista === 'ALTO_RIESGO'
                    ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border:       `1px solid ${a.tipo_contratista === 'ALTO_RIESGO'
                    ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  borderRadius: '20px',
                  fontSize:     '0.7rem',
                  color:        a.tipo_contratista === 'ALTO_RIESGO'
                    ? 'var(--danger-400)' : 'var(--success-400)',
                }}>
                  {a.tipo_contratista === 'ALTO_RIESGO' ? <AlertTriangle size={9} /> : <CheckCircle2 size={9} />}
                  {TIPO_CONTRATISTA_LABEL[a.tipo_contratista]}
                </span>
              </div>

              {/* Vigencia */}
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '6px',
                fontSize:   '0.75rem',
                color:      'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}>
                <Calendar size={11} color="var(--text-muted)" />
                {a.fecha_inicio} → {a.fecha_fin}
              </div>

              {/* Contratistas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {a.total_contratistas}
                </span>
                {a.aprobados > 0 && (
                  <span style={{
                    fontSize:   '0.68rem',
                    color:      'var(--success-400)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    ({a.aprobados} ✓)
                  </span>
                )}
              </div>

              {/* Estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <EstadoBadge estado={a.estado} />
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px' }}>
                {/* Ver detalle */}
                <button
                  onClick={() => {
                    const contratistaId = a.contratistas?.[0]?.id
                    if (contratistaId) {
                      navigate(`/hse/gestion?contratista_id=${contratistaId}&autorizacion_id=${a.id}`)
                      return
                    }
                    navigate('/hse/gestion')
                  }}
                  className="btn-icon"
                  title="Ver contratista en Gestión"
                  style={{ width: '30px', height: '30px' }}
                >
                  <Eye size={13} />
                </button>
                {/* Eliminar */}
                <button
                  onClick={() => setAutorizacionAEliminar(a.id)}
                  className="btn-icon"
                  title="Eliminar autorización"
                  style={{
                    width:       '30px',
                    height:      '30px',
                    color:       'var(--danger-400)',
                    borderColor: 'rgba(239,68,68,0.15)',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            ))
          )}
          </div>
        </div>
        <Pagination
          currentPage={autorizacionesPagination.currentPage}
          totalPages={autorizacionesPagination.totalPages}
          onNext={autorizacionesPagination.nextPage}
          onPrev={autorizacionesPagination.prevPage}
          onGoTo={autorizacionesPagination.goToPage}
          totalItems={autorizacionesPagination.totalItems}
        />
      </div>

      {/* Modal nueva autorización */}
      {showModal && (
        <ModalCrear
          initialSedeId={sedeActiva?.id ?? 0}
          sedes={sedesDisponibles}
          proveedores={proveedores}
          onClose={() => setShowModal(false)}
          onCreated={() => setRefresh(r => r + 1)}
          onNuevoProveedor={() => setShowCrearProvModal(true)}
        />
      )}

      {/* Modal crear proveedor (inline desde ModalCrear) */}
      {showCrearProvModal && (
        <ModalCrearProveedor
          onClose={() => setShowCrearProvModal(false)}
          onCreated={(p) => {
            setShowCrearProvModal(false)
            void loadProveedores()
            // Seleccionar automáticamente el proveedor recién creado no es posible
            // desde aquí ya que ModalCrear maneja su propio estado; el usuario
            // lo verá en el dropdown al reabrirse o al refrescar.
            void p
          }}
        />
      )}

      {/* Panel gestión proveedores */}
      {showGestionProv && (
        <ModalGestionProveedores
          proveedores={proveedores}
          onClose={() => setShowGestionProv(false)}
          onRefresh={() => void loadProveedores()}
        />
      )}

      <ConfirmActionModal
        open={autorizacionAEliminar !== null}
        title="Eliminar autorización"
        message="Se eliminará la autorización seleccionada. Esta acción no se puede deshacer."
        confirmLabel="Eliminar autorización"
        cancelLabel="Cancelar"
        tone="danger"
        onCancel={() => setAutorizacionAEliminar(null)}
        onConfirm={() => {
          if (autorizacionAEliminar === null) return
          void handleEliminar(autorizacionAEliminar)
        }}
      />
    </div>
  )
}