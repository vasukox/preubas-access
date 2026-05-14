/**
 * KOAJ Access v2.0 — Configuración › Proveedores HSE
 * CRUD completo de empresas/proveedores contratistas.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Building2, Plus, Pencil, Trash2, Search,
  CheckCircle2, XCircle, X, Loader2,
} from 'lucide-react'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type { ProveedorHSEOption } from '@/types/hse'

// ── Modal overlay ─────────────────────────────────────────────────
function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function ModalBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', maxWidth: '420px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {children}
    </div>
  )
}

// ── Campo de formulario ───────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>
        {label.toUpperCase()}{required && <span style={{ color: 'var(--danger-400)', marginLeft: '2px' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '9px 12px', fontSize: '0.84rem',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-ui)', outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      />
    </div>
  )
}

// ── Modal Crear ───────────────────────────────────────────────────
function ModalCrear({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [nombre,  setNombre]  = useState('')
  const [nit,     setNit]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !nit.trim()) {
      setError('Nombre y NIT son obligatorios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await hseService.crearProveedor({ nombre: nombre.trim(), nit: nit.trim() })
      toast.success('Proveedor creado correctamente.')
      onDone()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={15} color="var(--primary-400)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Nuevo proveedor</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '9px 12px', background: 'rgba(192,80,80,0.07)', border: '1px solid rgba(192,80,80,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--danger-400)' }}>
                {error}
              </div>
            )}
            <Field label="Nombre de la empresa" value={nombre} onChange={setNombre} placeholder="Ej. Constructora ABC S.A.S." required />
            <Field label="NIT" value={nit} onChange={setNit} placeholder="Ej. 900123456-7" required />
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 18px', background: 'var(--primary-500)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Crear proveedor
            </button>
          </div>
        </form>
      </ModalBox>
    </Overlay>
  )
}

// ── Modal Editar ──────────────────────────────────────────────────
function ModalEditar({ proveedor, onClose, onDone }: { proveedor: ProveedorHSEOption; onClose: () => void; onDone: () => void }) {
  const [nombre,  setNombre]  = useState(proveedor.nombre)
  const [nit,     setNit]     = useState(proveedor.nit ?? '')
  const [activo,  setActivo]  = useState(proveedor.activo)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !nit.trim()) {
      setError('Nombre y NIT son obligatorios.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await hseService.actualizarProveedor(proveedor.id, { nombre: nombre.trim(), nit: nit.trim(), activo })
      toast.success('Proveedor actualizado.')
      onDone()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Pencil size={14} color="var(--primary-400)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Editar proveedor</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '9px 12px', background: 'rgba(192,80,80,0.07)', border: '1px solid rgba(192,80,80,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--danger-400)' }}>
                {error}
              </div>
            )}
            <Field label="Nombre de la empresa" value={nombre} onChange={setNombre} placeholder="Ej. Constructora ABC S.A.S." required />
            <Field label="NIT" value={nit} onChange={setNit} placeholder="Ej. 900123456-7" required />

            {/* Toggle activo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Estado</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {activo ? 'Activo — visible en el sistema' : 'Inactivo — no aparece en selecciones'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivo(v => !v)}
                style={{
                  width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  background: activo ? 'var(--success-400)' : 'var(--bg-base)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  outline: '1px solid var(--border-default)',
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: activo ? '21px' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 18px', background: 'var(--primary-500)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </ModalBox>
    </Overlay>
  )
}

// ── Modal Eliminar ────────────────────────────────────────────────
function ModalEliminar({ proveedor, onClose, onDone }: { proveedor: ProveedorHSEOption; onClose: () => void; onDone: () => void }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await hseService.eliminarProveedor(proveedor.id)
      toast.success('Proveedor eliminado.')
      onDone()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalBox>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={14} color="var(--danger-400)" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>Eliminar proveedor</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
            ¿Seguro que quieres eliminar a <strong style={{ color: 'var(--text-primary)' }}>{proveedor.nombre}</strong>?
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Los contratistas y excepciones asociadas quedarán sin empresa asignada. Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
            Cancelar
          </button>
          <button onClick={() => void handleDelete()} disabled={loading} style={{ padding: '8px 18px', background: 'var(--danger-400)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.7 : 1 }}>
            {loading && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
            Eliminar
          </button>
        </div>
      </ModalBox>
    </Overlay>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function ConfigProveedoresHSE() {
  const qc = useQueryClient()

  const [busqueda,      setBusqueda]      = useState('')
  const [modalCrear,    setModalCrear]    = useState(false)
  const [editando,      setEditando]      = useState<ProveedorHSEOption | null>(null)
  const [eliminando,    setEliminando]    = useState<ProveedorHSEOption | null>(null)

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey:  ['config_proveedores_hse'],
    queryFn:   () => hseService.getProveedores(),
    staleTime: 60_000,
  })

  function refrescar() {
    void qc.invalidateQueries({ queryKey: ['config_proveedores_hse'] })
  }

  const filtrados = proveedores.filter(p => {
    const t = busqueda.trim().toLowerCase()
    if (!t) return true
    return (
      p.nombre.toLowerCase().includes(t) ||
      (p.nit?.toLowerCase().includes(t) ?? false)
    )
  })

  const activos   = proveedores.filter(p => p.activo).length
  const inactivos = proveedores.length - activos

  return (
    <>
      {/* ── Barra superior ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Total: <strong style={{ color: 'var(--text-primary)' }}>{proveedores.length}</strong></span>
          <span style={{ color: 'var(--success-400)' }}>Activos: <strong>{activos}</strong></span>
          {inactivos > 0 && <span style={{ color: 'var(--text-muted)' }}>Inactivos: <strong>{inactivos}</strong></span>}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o NIT…"
              style={{
                padding: '8px 12px 8px 30px', fontSize: '0.82rem', width: '220px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', outline: 'none',
              }}
            />
          </div>

          <button
            onClick={() => setModalCrear(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', background: 'var(--primary-500)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
            }}
          >
            <Plus size={14} />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Cargando proveedores…
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {busqueda ? 'No se encontraron coincidencias.' : 'Aún no hay proveedores registrados.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Empresa',  w: undefined  },
                  { label: 'NIT',      w: '160px'    },
                  { label: 'Estado',   w: '110px'    },
                  { label: 'Acciones', w: '100px'    },
                ].map(col => (
                  <th key={col.label} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em',
                    color: 'var(--text-muted)', whiteSpace: 'nowrap',
                    width: col.w,
                  }}>
                    {col.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: idx < filtrados.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Empresa */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Building2 size={14} color="var(--text-muted)" />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.nombre}
                      </span>
                    </div>
                  </td>

                  {/* NIT */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {p.nit ?? '—'}
                    </span>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {p.activo
                        ? <><CheckCircle2 size={13} color="var(--success-400)" /><span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success-400)' }}>Activo</span></>
                        : <><XCircle size={13} color="var(--text-muted)" /><span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Inactivo</span></>
                      }
                    </div>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setEditando(p)}
                        title="Editar"
                        style={{
                          width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.color = 'var(--primary-400)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setEliminando(p)}
                        title="Eliminar"
                        style={{
                          width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger-400)'; e.currentTarget.style.color = 'var(--danger-400)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modales ── */}
      {modalCrear  && <ModalCrear    onClose={() => setModalCrear(false)}   onDone={refrescar} />}
      {editando    && <ModalEditar   proveedor={editando}   onClose={() => setEditando(null)}   onDone={refrescar} />}
      {eliminando  && <ModalEliminar proveedor={eliminando} onClose={() => setEliminando(null)} onDone={refrescar} />}
    </>
  )
}
