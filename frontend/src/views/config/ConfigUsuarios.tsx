/**
 * ConfigUsuarios — gestión de usuarios y enrolamiento de roles.
 * Permite crear, editar, eliminar usuarios y asignar/quitar roles
 * desde una interfaz de tarjetas con toggle por rol.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { herramientasService, UsuarioSistema, RolSistema, UsuarioCreateRequest } from '@/services/herramientas.service'
import { getErrorMessage } from '@/services/api'
import toast from 'react-hot-toast'
import type { RolNombre } from '@/types'
import {
  UserPlus, Pencil, ShieldCheck, Trash2, X, Check, Loader2, Key, Search,
} from 'lucide-react'

// ── Colores y etiquetas por rol ──────────────────────────────────────
const ROL_COLOR: Record<string, string> = {
  ADMIN_GLOBAL:      '#F59E0B',
  ADMIN_HSE:         '#10B981',
  GESTION_HSE:       '#6366F1',
  VIGILANTE_HSE:     '#EC4899',
  ADMIN_PARKING:     '#FB923C',
  VIGILANTE_PARKING: '#F97316',
  ADMIN_NFC:         '#8B5CF6',
  ADMIN_GH:          '#14B8A6',
  VISUALIZADOR:      '#6B7280',
}

const ROL_LABEL: Record<string, string> = {
  ADMIN_GLOBAL:      'Admin Global',
  ADMIN_HSE:         'Admin HSE',
  GESTION_HSE:       'Gestión HSE',
  VIGILANTE_HSE:     'Vigilante HSE',
  ADMIN_PARKING:     'Admin Parking',
  VIGILANTE_PARKING: 'Vigilante Parking',
  ADMIN_NFC:         'Admin NFC',
  ADMIN_GH:          'Admin GH',
  VISUALIZADOR:      'Visualizador',
}

// Orden deseado en la cuadrícula de roles
const ROL_ORDER: RolNombre[] = [
  'ADMIN_GLOBAL',
  'ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE',
  'ADMIN_PARKING', 'VIGILANTE_PARKING',
  'ADMIN_NFC', 'ADMIN_GH',
  'VISUALIZADOR',
]

// ── Estilos compartidos ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: '0.68rem', textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600,
  padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
}

const tdStyle: React.CSSProperties = {
  padding: '11px 14px', verticalAlign: 'middle', fontSize: '0.83rem',
  color: 'var(--text-primary)',
}

// ── Overlay / Modal base ─────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {children}
    </div>
  )
}

// ── Chip de rol coloreado ─────────────────────────────────────────────
function RolChip({ nombre }: { nombre: string }) {
  const color = ROL_COLOR[nombre] ?? '#6B7280'
  const label = ROL_LABEL[nombre] ?? nombre
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px',
      background: `${color}18`,
      border: `1px solid ${color}44`,
      color, fontSize: '0.7rem', fontWeight: 700,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Tarjeta de rol con toggle ─────────────────────────────────────────
function RolCard({
  rol, assigned, loading, onToggle,
}: {
  rol: RolSistema
  assigned: boolean
  loading: boolean
  onToggle: () => void
}) {
  const color = ROL_COLOR[rol.nombre] ?? rol.color
  const label = ROL_LABEL[rol.nombre] ?? rol.nombre
  const scope = rol.grupos?.[0]?.grupo ?? rol.modulos?.[0] ?? '—'

  return (
    <div style={{
      border: `1px solid ${assigned ? color + '55' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)',
      background: assigned ? `${color}08` : 'var(--bg-raised)',
      overflow: 'hidden',
      transition: 'all 0.18s ease',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Barra de color superior */}
      <div style={{ height: '3px', background: assigned ? color : 'var(--border-subtle)' }} />

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Nombre del rol */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{
            fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: assigned ? color : 'var(--text-secondary)',
            letterSpacing: '0.04em',
          }}>
            {label}
          </span>
          {assigned && (
            <span style={{
              fontSize: '0.6rem', padding: '1px 6px', borderRadius: '999px',
              background: `${color}22`, border: `1px solid ${color}44`,
              color, fontWeight: 700, letterSpacing: '0.04em',
            }}>
              ACTIVO
            </span>
          )}
        </div>

        {/* Alcance */}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          {scope}
        </div>

        {/* Descripción */}
        <p style={{
          margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)',
          lineHeight: 1.45, flex: 1,
        }}>
          {rol.descripcion}
        </p>

        {/* Botón toggle */}
        <button
          onClick={onToggle}
          disabled={loading}
          style={{
            marginTop: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: 'var(--radius-md)',
            border: `1px solid ${assigned ? color + '66' : 'var(--border-default)'}`,
            background: assigned ? `${color}18` : 'var(--bg-surface)',
            color: assigned ? color : 'var(--text-muted)',
            fontSize: '0.76rem', fontWeight: 600, fontFamily: 'var(--font-ui)',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease',
            width: '100%',
          }}
        >
          {loading
            ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
            : assigned
              ? <><X size={12} /> Quitar rol</>
              : <><Check size={12} /> Asignar rol</>
          }
        </button>
      </div>
    </div>
  )
}

// ── Modal de gestión de roles ─────────────────────────────────────────
function RolesModal({
  usuario, roles, onClose,
}: {
  usuario: UsuarioSistema
  roles: RolSistema[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [assignedRoles, setAssignedRoles] = useState<Set<RolNombre>>(
    new Set(usuario.roles.map(r => r.nombre) as RolNombre[])
  )
  const [loadingRoles, setLoadingRoles] = useState<Set<RolNombre>>(new Set())

  const handleToggle = async (rolNombre: RolNombre) => {
    if (loadingRoles.has(rolNombre)) return
    const isAssigned = assignedRoles.has(rolNombre)

    // Optimistic update
    setAssignedRoles(prev => {
      const next = new Set(prev)
      isAssigned ? next.delete(rolNombre) : next.add(rolNombre)
      return next
    })
    setLoadingRoles(prev => new Set([...prev, rolNombre]))

    try {
      if (isAssigned) {
        await herramientasService.quitarRol(usuario.id, rolNombre)
        toast.success(`Rol ${ROL_LABEL[rolNombre] ?? rolNombre} removido`)
      } else {
        await herramientasService.asignarRol(usuario.id, rolNombre)
        toast.success(`Rol ${ROL_LABEL[rolNombre] ?? rolNombre} asignado`)
      }
      void queryClient.invalidateQueries({ queryKey: ['config_usuarios'] })
    } catch (err) {
      // Rollback
      setAssignedRoles(prev => {
        const next = new Set(prev)
        isAssigned ? next.add(rolNombre) : next.delete(rolNombre)
        return next
      })
      toast.error(getErrorMessage(err))
    } finally {
      setLoadingRoles(prev => {
        const next = new Set(prev)
        next.delete(rolNombre)
        return next
      })
    }
  }

  // Ordenar roles según ROL_ORDER
  const sortedRoles = [...roles].sort((a, b) => {
    const ai = ROL_ORDER.indexOf(a.nombre as RolNombre)
    const bi = ROL_ORDER.indexOf(b.nombre as RolNombre)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '700px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          gap: '12px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)', flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
            background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={18} color="var(--primary-500)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Roles de {usuario.nombre_completo}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              {usuario.email} · {assignedRoles.size} rol{assignedRoles.size !== 1 ? 'es' : ''} activo{assignedRoles.size !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Cuadrícula de roles */}
        <div style={{
          overflowY: 'auto', padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '10px',
        }}>
          {sortedRoles.map(rol => (
            <RolCard
              key={rol.id}
              rol={rol}
              assigned={assignedRoles.has(rol.nombre as RolNombre)}
              loading={loadingRoles.has(rol.nombre as RolNombre)}
              onToggle={() => handleToggle(rol.nombre as RolNombre)}
            />
          ))}
        </div>
      </div>
    </ModalOverlay>
  )
}

// ── Modal crear usuario ───────────────────────────────────────────────
function CrearModal({ roles, onClose }: { roles: RolSistema[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedRoles, setSelectedRoles] = useState<Set<RolNombre>>(new Set())
  const [showPass, setShowPass] = useState(false)

  const crearMut = useMutation({
    mutationFn: (data: UsuarioCreateRequest) => herramientasService.crearUsuario(data),
    onSuccess: () => {
      toast.success('Usuario creado correctamente.')
      void queryClient.invalidateQueries({ queryKey: ['config_usuarios'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleRol = (nombre: RolNombre) => {
    setSelectedRoles(prev => {
      const next = new Set(prev)
      next.has(nombre) ? next.delete(nombre) : next.add(nombre)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const pass = fd.get('password') as string
    const passConf = fd.get('password_confirmacion') as string
    if (pass !== passConf) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    crearMut.mutate({
      email:                 fd.get('email') as string,
      nombres:               fd.get('nombres') as string,
      apellidos:             fd.get('apellidos') as string,
      numero:                (fd.get('numero') as string) || '',
      direccion:             (fd.get('direccion') as string) || '',
      password:              pass,
      password_confirmacion: passConf,
      firma_creador:         'admin',
      roles_nombres:         selectedRoles.size > 0 ? [...selectedRoles] : undefined,
    })
  }

  const sortedRoles = [...roles].sort((a, b) => {
    const ai = ROL_ORDER.indexOf(a.nombre as RolNombre)
    const bi = ROL_ORDER.indexOf(b.nombre as RolNombre)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '560px',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          gap: '10px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)', flexShrink: 0,
        }}>
          <UserPlus size={18} color="var(--primary-500)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1 }}>
            Crear nuevo usuario
          </span>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '18px 20px', display: 'grid', gap: '12px' }}>

            {/* Sección datos */}
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Datos del usuario
            </div>

            <input name="email" type="email" placeholder="Email *" required style={inputStyle} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input name="nombres" placeholder="Nombres *" required style={inputStyle} />
              <input name="apellidos" placeholder="Apellidos *" required style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input name="numero" placeholder="Número de ID" style={inputStyle} />
              <input name="direccion" placeholder="Dirección" style={inputStyle} />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                name="password" type={showPass ? 'text' : 'password'}
                placeholder="Contraseña *" required style={{ ...inputStyle, paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '2px',
              }}>
                <Key size={14} />
              </button>
            </div>

            <input
              name="password_confirmacion" type={showPass ? 'text' : 'password'}
              placeholder="Confirmar contraseña *" required style={inputStyle}
            />

            {/* Sección roles */}
            <div style={{ marginTop: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Rol inicial {selectedRoles.size > 0 && (
                <span style={{ color: 'var(--primary-500)', marginLeft: '4px' }}>
                  · {selectedRoles.size} seleccionado{selectedRoles.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px',
            }}>
              {sortedRoles.map(rol => {
                const nombre = rol.nombre as RolNombre
                const color  = ROL_COLOR[nombre] ?? '#6B7280'
                const label  = ROL_LABEL[nombre] ?? nombre
                const active = selectedRoles.has(nombre)
                return (
                  <button
                    key={rol.id}
                    type="button"
                    onClick={() => toggleRol(nombre)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '7px 10px', borderRadius: 'var(--radius-md)',
                      border: `1px solid ${active ? color + '66' : 'var(--border-subtle)'}`,
                      background: active ? `${color}12` : 'var(--bg-raised)',
                      color: active ? color : 'var(--text-muted)',
                      fontSize: '0.75rem', fontWeight: active ? 700 : 400,
                      fontFamily: 'var(--font-ui)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: active ? color : 'var(--border-default)',
                      transition: 'background 0.15s ease',
                    }} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            background: 'var(--bg-raised)', flexShrink: 0,
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontFamily: 'var(--font-ui)', cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={crearMut.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-400)',
                background: 'var(--primary-500)', color: '#fff',
                fontSize: '0.82rem', fontWeight: 600,
                fontFamily: 'var(--font-ui)', cursor: crearMut.isPending ? 'wait' : 'pointer',
                opacity: crearMut.isPending ? 0.7 : 1,
              }}
            >
              {crearMut.isPending
                ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Creando…</>
                : <><Check size={13} /> Crear usuario</>
              }
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

// ── Modal editar usuario ──────────────────────────────────────────────
function EditarModal({ usuario, onClose }: { usuario: UsuarioSistema; onClose: () => void }) {
  const queryClient = useQueryClient()

  const editarMut = useMutation({
    mutationFn: (data: { nombre_completo: string; numero: string; direccion: string; activo: boolean }) =>
      herramientasService.actualizarUsuario(usuario.id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado.')
      void queryClient.invalidateQueries({ queryKey: ['config_usuarios'] })
      onClose()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    editarMut.mutate({
      nombre_completo: fd.get('nombre_completo') as string,
      numero:          (fd.get('numero') as string) || '',
      direccion:       (fd.get('direccion') as string) || '',
      activo:          fd.get('activo') === 'true',
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center',
          gap: '10px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)',
        }}>
          <Pencil size={16} color="var(--primary-500)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1 }}>
            Editar usuario
          </span>
          <button onClick={onClose} style={{
            width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 20px', display: 'grid', gap: '10px' }}>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              {usuario.email}
            </div>
            <input name="nombre_completo" defaultValue={usuario.nombre_completo} placeholder="Nombre completo *" required style={inputStyle} />
            <input name="numero" defaultValue={usuario.numero ?? ''} placeholder="Número de ID" style={inputStyle} />
            <input name="direccion" defaultValue={usuario.direccion ?? ''} placeholder="Dirección" style={inputStyle} />
            <select name="activo" defaultValue={usuario.activo ? 'true' : 'false'} style={inputStyle}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>

          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'flex-end', gap: '8px',
            background: 'var(--bg-raised)',
          }}>
            <button type="button" onClick={onClose} style={{
              padding: '7px 14px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.82rem',
              fontFamily: 'var(--font-ui)', cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={editarMut.isPending} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-400)', background: 'var(--primary-500)',
              color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              fontFamily: 'var(--font-ui)', cursor: editarMut.isPending ? 'wait' : 'pointer',
              opacity: editarMut.isPending ? 0.7 : 1,
            }}>
              {editarMut.isPending ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

// ── Vista principal ───────────────────────────────────────────────────
export default function ConfigUsuarios() {
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [modalCrear,   setModalCrear]   = useState(false)
  const [modalEditar,  setModalEditar]  = useState<UsuarioSistema | null>(null)
  const [modalRoles,   setModalRoles]   = useState<UsuarioSistema | null>(null)
  const [confirmElim,  setConfirmElim]  = useState<UsuarioSistema | null>(null)

  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ['config_usuarios'],
    queryFn:  herramientasService.listarUsuarios,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['config_roles'],
    queryFn:  herramientasService.listarRoles,
  })

  const eliminarMut = useMutation({
    mutationFn: (id: number) => herramientasService.eliminarUsuario(id),
    onSuccess: () => {
      toast.success('Usuario eliminado.')
      setConfirmElim(null)
      void queryClient.invalidateQueries({ queryKey: ['config_usuarios'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const usuariosFiltrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return usuarios
    return usuarios.filter(u =>
      u.email.toLowerCase().includes(q) ||
      (u.nombre_completo?.toLowerCase().includes(q) ?? false) ||
      u.roles.some(r => (ROL_LABEL[r.nombre] ?? r.nombre).toLowerCase().includes(q))
    )
  }, [usuarios, buscar])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando usuarios...
      </div>
    )
  }

  if (isError) {
    return <div style={{ color: 'var(--danger-500)', fontSize: '0.83rem' }}>Error al cargar usuarios.</div>
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>

      {/* ── Barra de herramientas ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            placeholder="Buscar por email, nombre o rol…"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
          />
        </div>
        <button
          onClick={() => setModalCrear(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-400)', background: 'var(--primary-500)',
            color: '#fff', fontSize: '0.82rem', fontWeight: 600,
            fontFamily: 'var(--font-ui)', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <UserPlus size={14} />
          Nuevo usuario
        </button>
      </div>

      {/* ── Tabla de usuarios ─────────────────────────────────────── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-raised)' }}>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Roles</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
                  {buscar ? 'Sin resultados para la búsqueda.' : 'No hay usuarios registrados.'}
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{u.nombre_completo}</div>
                    {u.sede_asignada && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {u.sede_asignada.nombre}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                      background: u.activo ? '#10B98118' : '#EF444418',
                      border: `1px solid ${u.activo ? '#10B98144' : '#EF444444'}`,
                      color: u.activo ? '#10B981' : '#EF4444',
                    }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {u.roles.length > 0
                        ? u.roles.map(r => <RolChip key={r.id} nombre={r.nombre} />)
                        : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin rol</span>
                      }
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      {/* Editar */}
                      <button
                        title="Editar datos"
                        onClick={() => setModalEditar(u)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)', background: 'transparent',
                          color: 'var(--text-muted)', cursor: 'pointer',
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      {/* Roles */}
                      <button
                        title="Gestionar roles"
                        onClick={() => setModalRoles(u)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--primary-200)', background: 'var(--primary-50)',
                          color: 'var(--primary-500)', cursor: 'pointer',
                        }}
                      >
                        <ShieldCheck size={13} />
                      </button>
                      {/* Eliminar */}
                      <button
                        title="Eliminar usuario"
                        onClick={() => setConfirmElim(u)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
                          border: '1px solid #EF444433', background: '#EF444408',
                          color: '#EF4444', cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Contador ─────────────────────────────────────────────── */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        {usuariosFiltrados.length} de {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
      </div>

      {/* ── Modales ───────────────────────────────────────────────── */}

      {modalCrear && (
        <CrearModal roles={roles} onClose={() => setModalCrear(false)} />
      )}

      {modalEditar && (
        <EditarModal usuario={modalEditar} onClose={() => setModalEditar(null)} />
      )}

      {modalRoles && (
        <RolesModal
          usuario={modalRoles}
          roles={roles}
          onClose={() => setModalRoles(null)}
        />
      )}

      {/* ── Confirmación de eliminación ───────────────────────────── */}
      {confirmElim && (
        <ModalOverlay onClose={() => setConfirmElim(null)}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            width: '100%', maxWidth: '380px',
            boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                  background: '#EF444412', border: '1px solid #EF444433',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={17} color="#EF4444" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Eliminar usuario
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Esta acción no se puede deshacer.
                  </div>
                </div>
              </div>
              <p style={{ margin: '12px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                ¿Confirmas la eliminación de <strong>{confirmElim.nombre_completo}</strong> ({confirmElim.email})?
              </p>
            </div>
            <div style={{
              padding: '12px 22px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
              background: 'var(--bg-raised)',
            }}>
              <button
                onClick={() => setConfirmElim(null)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '0.82rem',
                  fontFamily: 'var(--font-ui)', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarMut.mutate(confirmElim.id)}
                disabled={eliminarMut.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid #EF444466', background: '#EF4444',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                  fontFamily: 'var(--font-ui)', cursor: eliminarMut.isPending ? 'wait' : 'pointer',
                  opacity: eliminarMut.isPending ? 0.7 : 1,
                }}
              >
                {eliminarMut.isPending
                  ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Trash2 size={13} />
                }
                Eliminar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

    </div>
  )
}
