import { useMemo, useState } from 'react'
import { Check, ChevronLeft, Search, Shield, Trash2, UserCog, UserX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { RolSistema, UsuarioSistema } from '@/services/herramientas.service'
import { herramientasService } from '@/services/herramientas.service'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { badgeColor, type VistaHerramientas } from '../constants'
import { UsuarioGestionModal } from './UsuarioGestionModal'
import { HERRAMIENTAS_KEYS } from '../HerramientasView'

interface UsuariosPanelProps {
  usuarios: UsuarioSistema[]
  roles: RolSistema[]
  loading: boolean
  setVistaActiva: (vista: VistaHerramientas) => void
}

export function UsuariosPanel({
  usuarios,
  roles,
  loading,
  setVistaActiva,
}: UsuariosPanelProps) {
  const queryClient = useQueryClient()
  const [filtro, setFiltro] = useState('')
  const [usuarioGestionando, setUsuarioGestionando] = useState<UsuarioSistema | null>(null)

  const usuariosFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return usuarios
    return usuarios.filter(
      (u) => aString(u.nombre_completo).includes(q) || aString(u.email).includes(q),
    )
  }, [usuarios, filtro])

  function aString(val: string | null | undefined) {
    return (val || '').toLowerCase()
  }

  const usuariosPagination = usePagination(usuariosFiltrados, 10)

  const handleToggleActivo = async (u: UsuarioSistema) => {
    try {
      await herramientasService.actualizarUsuario(u.id, { activo: !u.activo })
      // Invalida la caché para que React Query re-fetche la lista actualizada
      queryClient.invalidateQueries({ queryKey: HERRAMIENTAS_KEYS.usuarios })
      toast.success(
        `Usuario ${u.nombre_completo} ${u.activo ? 'desactivado' : 'activado'}.`,
      )
    } catch {
      toast.error('No se pudo actualizar el estado del usuario.')
    }
  }

  const handleEliminarUsuario = async (u: UsuarioSistema) => {
    if (!window.confirm(`¿Estás completamente seguro de eliminar el usuario "${u.nombre_completo}"? Esta acción no se puede deshacer.`)) {
      return
    }
    try {
      await herramientasService.eliminarUsuario(u.id)
      // Invalida la caché — React Query re-sincroniza la lista
      queryClient.invalidateQueries({ queryKey: HERRAMIENTAS_KEYS.usuarios })
      toast.success(`Usuario ${u.nombre_completo} eliminado.`)
      if (usuariosPagination.paginatedData.length === 1 && usuariosPagination.currentPage > 1) {
        usuariosPagination.prevPage()
      }
    } catch (e: any) {
      if (e?.response?.data?.error?.message) {
        toast.error(e.response.data.error.message)
      } else {
        toast.error('No se pudo eliminar el usuario.')
      }
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(p => p.trim() !== '')
    if (parts.length === 0) return 'UN'
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  }

  const fieldStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.84rem',
    outline: 'none',
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderColor: 'transparent',
    background: 'var(--bg-raised)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const tableHeaderStyle: React.CSSProperties = {
    padding: '14px 20px',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    fontWeight: 700,
    borderBottom: '1px solid var(--border-subtle)',
    textAlign: 'left',
    background: 'rgba(0,0,0,0.1)',
  }

  return (
    <>
      <div className="animate-fade-up stagger-2" style={panelStyle}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCog size={14} color="var(--primary-400)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Usuarios del sistema ({usuariosFiltrados.length})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar usuario o email..."
                style={{ ...fieldStyle, width: '300px', maxWidth: '100%', paddingLeft: '34px', borderRadius: 'var(--radius-lg)' }}
                />
            </div>
            <button
              onClick={() => setVistaActiva('inicio')}
              className="btn-ghost"
              style={backButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
            >
              <ChevronLeft size={14} />
              Atrás
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid var(--primary-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <UserX size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            No hay usuarios que coincidan con la búsqueda.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Usuario</th>
                    <th style={tableHeaderStyle}>Estado</th>
                    <th style={tableHeaderStyle}>Roles</th>
                    <th style={tableHeaderStyle}>Contacto</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
              {usuariosPagination.paginatedData.map((u, idx) => {
                const isLast = idx === usuariosPagination.paginatedData.length - 1
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '38px', height: '38px', borderRadius: '10px', 
                            background: u.activo ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' : 'var(--bg-raised)', 
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', flexShrink: 0,
                            boxShadow: u.activo ? '0 4px 12px rgba(var(--primary-500-rgb), 0.3)' : 'none'
                          }}>
                              {getInitials(u.nombre_completo)}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {u.nombre_completo}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {u.email}
                            </div>
                          </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              border: `1px solid ${ u.activo ? 'rgba(40,149,108,0.35)' : 'rgba(192,80,80,0.25)' }`,
                              color: u.activo ? 'var(--success-400)' : 'var(--danger-400)',
                              background: u.activo ? 'rgba(40,149,108,0.08)' : 'rgba(192,80,80,0.06)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                            }}
                          >
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: u.activo ? 'var(--success-400)' : 'var(--danger-400)', marginRight: '6px' }} />
                            {u.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {u.roles.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Visualizador (por defecto)
                            </span>
                          )}
                          {u.roles.map((r, i) => {
                            if (i > 1) return null; // Show max 2 roles to keep it clean
                            const meta = roles.find((x) => x.nombre === r.nombre)
                            const color = meta?.color ?? '#6B7280'
                            return (
                              <span
                                key={`${u.id}-${r.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px',
                                  borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                                  ...badgeColor(color),
                                }}
                              >
                                <Shield size={10} style={{ opacity: 0.7 }} />
                                {r.nombre.replace('ADMIN_', 'ADM_')}
                              </span>
                            )
                          })}
                          {u.roles.length > 2 && (
                               <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: '4px' }}>
                                   +{u.roles.length - 2}
                               </span>
                          )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <div>{u.numero || '—'}</div>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={u.direccion || ''}>{u.direccion || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setUsuarioGestionando(u)}
                          className="btn-ghost"
                          style={{ fontSize: '0.76rem', padding: '6px 12px', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)' }}
                        >
                          Edición
                        </button>
                        <button
                          onClick={() => handleToggleActivo(u)}
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px', height: '32px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${ u.activo ? 'rgba(192,80,80,0.2)' : 'rgba(40,149,108,0.2)' }`,
                            background: u.activo ? 'rgba(192,80,80,0.05)' : 'rgba(40,149,108,0.05)',
                            color: u.activo ? 'var(--danger-400)' : 'var(--success-400)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = u.activo ? 'rgba(192,80,80,0.15)' : 'rgba(40,149,108,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = u.activo ? 'rgba(192,80,80,0.05)' : 'rgba(40,149,108,0.05)'
                          }}
                        >
                          {u.activo ? <UserX size={14} /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => handleEliminarUsuario(u)}
                          title="Eliminar usuario"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px', height: '32px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid rgba(192,80,80,0.2)`,
                            background: 'rgba(192,80,80,0.05)',
                            color: 'var(--danger-500)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(192,80,80,0.15)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(192,80,80,0.05)'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                )
              })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={usuariosPagination.currentPage}
              totalPages={usuariosPagination.totalPages}
              onNext={usuariosPagination.nextPage}
              onPrev={usuariosPagination.prevPage}
              onGoTo={usuariosPagination.goToPage}
              totalItems={usuariosPagination.totalItems}
            />
          </>
        )}
      </div>

      {usuarioGestionando && (
        <UsuarioGestionModal
          usuario={usuarioGestionando}
          roles={roles}
          onClose={() => setUsuarioGestionando(null)}
          onUserUpdated={(updated) => {
            // Invalida la caché en lugar de mutar el estado local
            queryClient.invalidateQueries({ queryKey: HERRAMIENTAS_KEYS.usuarios })
            setUsuarioGestionando(updated)
          }}
        />
      )}
    </>
  )
}

