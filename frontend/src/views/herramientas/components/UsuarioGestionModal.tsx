import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { PermisosUsuario, RolSistema, UsuarioSistema } from '@/services/herramientas.service'
import { herramientasService } from '@/services/herramientas.service'
import { getErrorMessage } from '@/services/api'
import type { RolNombre } from '@/types'
import { PERMISOS_BD_LABELS, validarPassword } from '../constants'

interface UsuarioGestionModalProps {
  usuario: UsuarioSistema
  roles: RolSistema[]
  onClose: () => void
  onUserUpdated: (u: UsuarioSistema) => void
}

export function UsuarioGestionModal({
  usuario,
  roles,
  onClose,
  onUserUpdated,
}: UsuarioGestionModalProps) {
  const [usuarioLocal, setUsuarioLocal] = useState<UsuarioSistema>(usuario)
  const [rolNuevo, setRolNuevo] = useState<RolNombre | ''>('')
  const [saving, setSaving] = useState(false)
  const [savingPermisos, setSavingPermisos] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('')
  const [forzarCambio, setForzarCambio] = useState(true)
  const [permisos, setPermisos] = useState<PermisosUsuario>(usuario.permisos)

  useEffect(() => {
    setUsuarioLocal(usuario)
    setPermisos(usuario.permisos)
  }, [usuario])

  const actualizarLocal = (u: UsuarioSistema) => {
    setUsuarioLocal(u)
    setPermisos(u.permisos)
    onUserUpdated(u)
  }

  const handleToggleActivo = async () => {
    try {
      setSaving(true)
      const updated = await herramientasService.actualizarUsuario(usuarioLocal.id, {
        activo: !usuarioLocal.activo,
      })
      actualizarLocal(updated)
      toast.success(
        `Usuario ${updated.nombre_completo} ${updated.activo ? 'activado' : 'desactivado'}.`,
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleAsignarRol = async () => {
    if (!rolNuevo) return
    try {
      setSaving(true)
      const updated = await herramientasService.asignarRol(usuarioLocal.id, rolNuevo)
      actualizarLocal(updated)
      setRolNuevo('')
      toast.success(`Rol ${rolNuevo} asignado.`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleQuitarRol = async (rol: RolNombre) => {
    try {
      setSaving(true)
      const updated = await herramientasService.quitarRol(usuarioLocal.id, rol)
      actualizarLocal(updated)
      toast.success(`Rol ${rol} removido.`)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarPermisos = async () => {
    try {
      setSavingPermisos(true)
      const updated = await herramientasService.actualizarPermisos(usuarioLocal.id, permisos)
      actualizarLocal(updated)
      toast.success('Permisos actualizados correctamente.')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSavingPermisos(false)
    }
  }

  const handleResetPassword = async () => {
    const passError = validarPassword(passwordNueva)
    if (passError) {
      toast.error(passError)
      return
    }
    if (passwordNueva !== passwordConfirmacion) {
      toast.error('La confirmación de contraseña no coincide.')
      return
    }

    try {
      setSavingPassword(true)
      const updated = await herramientasService.resetPassword(usuarioLocal.id, {
        password_nueva: passwordNueva,
        password_confirmacion: passwordConfirmacion,
        forzar_cambio: forzarCambio,
      })
      actualizarLocal(updated)
      setPasswordNueva('')
      setPasswordConfirmacion('')
      toast.success('Contraseña actualizada correctamente.')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSavingPassword(false)
    }
  }

  const rolesDisponibles = roles.filter(
    (r) => !usuarioLocal.roles.some((ur) => ur.nombre === r.nombre),
  )

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.68)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1300,
    padding: '20px',
  }

  const modalContent: React.CSSProperties = {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '92vh',
    overflow: 'hidden',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column',
  }

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  }

  return (
    <div style={modalOverlay} className="animate-fade-in">
      <div style={modalContent} className="animate-fade-up">
        <div style={headerStyle}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {usuarioLocal.nombre_completo}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {usuarioLocal.email}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" title="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'grid', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
            }}
          >
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Estado de cuenta
            </div>
            <button
              onClick={handleToggleActivo}
              disabled={saving}
              className="btn-ghost"
              style={{ fontSize: '0.74rem' }}
            >
              {usuarioLocal.activo ? 'Desactivar usuario' : 'Activar usuario'}
            </button>
          </div>

          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Roles del usuario
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {usuarioLocal.roles.map((r) => (
                <span
                  key={`modal-role-${r.id}-${r.nombre}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    border: '1px solid var(--border-default)',
                    borderRadius: '999px',
                    background: 'var(--bg-raised)',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {r.nombre}
                  {r.nombre !== 'ADMIN_GLOBAL' && (
                    <button
                      onClick={() => handleQuitarRol(r.nombre as RolNombre)}
                      disabled={saving}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={rolNuevo}
                onChange={(e) => setRolNuevo(e.target.value as RolNombre | '')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                  fontSize: '0.76rem',
                }}
              >
                <option value="">Agregar rol...</option>
                {rolesDisponibles.map((r) => (
                  <option key={`modal-add-role-${r.id}`} value={r.nombre}>
                    {r.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAsignarRol}
                disabled={saving || !rolNuevo}
                className="btn-primary"
                style={{ fontSize: '0.74rem' }}
              >
                Asignar rol
              </button>
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Permisos operativos
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {PERMISOS_BD_LABELS.map(({ key, label }) => (
                <label
                  key={`modal-perm-${key}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={permisos[key]}
                    onChange={(e) => setPermisos((p) => ({ ...p, [key]: e.target.checked }))}
                    style={{ accentColor: 'var(--primary-500)' }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              onClick={handleGuardarPermisos}
              disabled={savingPermisos}
              className="btn-primary"
              style={{ justifySelf: 'start', fontSize: '0.74rem' }}
            >
              {savingPermisos ? 'Guardando...' : 'Guardar permisos'}
            </button>
          </div>

          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Cambiar contraseña
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Nueva contraseña"
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                }}
              />
              <input
                type="password"
                value={passwordConfirmacion}
                onChange={(e) => setPasswordConfirmacion(e.target.value)}
                placeholder="Confirmar contraseña"
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={forzarCambio}
                onChange={(e) => setForzarCambio(e.target.checked)}
                style={{ accentColor: 'var(--primary-500)' }}
              />
              Forzar cambio en próximo login
            </label>
            <button
              onClick={handleResetPassword}
              disabled={savingPassword}
              className="btn-primary"
              style={{ justifySelf: 'start', fontSize: '0.74rem' }}
            >
              {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
