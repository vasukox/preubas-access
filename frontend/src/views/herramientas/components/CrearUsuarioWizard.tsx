import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { herramientasService, type RolSistema } from '@/services/herramientas.service'
import { useAuthStore } from '@/store/authStore'
import type { RolNombre } from '@/types'
import {
  DEFAULT_PERMISOS,
  HSE_ROLES_ACTIVOS,
  HSE_SUBMODULO_ROLES,
  HSE_SUBROLES_POR_ROL,
  PERMISSION_META,
  PERMISOS_LABELS,
  roleCapabilities,
  validarPassword,
  type VistaHerramientas,
} from '../constants'

interface CrearUsuarioWizardProps {
  roles: RolSistema[]
  setVistaActiva: (vista: VistaHerramientas) => void
  onUserCreated: () => void
}

export function CrearUsuarioWizard({ roles, setVistaActiva, onUserCreated }: CrearUsuarioWizardProps) {
  const [wizardStep, setWizardStep] = useState(1)
  const [savingUser, setSavingUser] = useState(false)
  
  const usuarioActual = useAuthStore((s) => s.usuario)
  const nombreFirmante = usuarioActual?.nombre_completo ?? ''

  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    nombres: '',
    apellidos: '',
    numero: '',
    direccion: '',
    rol_nombre: '' as RolNombre | '',
    roles_nombres: [] as RolNombre[],
    password: '',
    password_confirmacion: '',
    firma_creador: '',
    permisos: { ...DEFAULT_PERMISOS },
  })

  // Autofill firma cuando se entra al paso 3
  useEffect(() => {
    if (wizardStep !== 3) return
    if (nuevoUsuario.firma_creador.trim()) return
    if (!nombreFirmante.trim()) return
    setNuevoUsuario((prev) => ({ ...prev, firma_creador: nombreFirmante }))
  }, [wizardStep, nombreFirmante, nuevoUsuario.firma_creador])

  const validarPaso1 = () => {
    if (
      !nuevoUsuario.email ||
      !nuevoUsuario.nombres ||
      !nuevoUsuario.apellidos ||
      !nuevoUsuario.numero ||
      !nuevoUsuario.direccion ||
      !nuevoUsuario.password ||
      !nuevoUsuario.password_confirmacion
    ) {
      toast.error('Completa todos los datos del paso 1.')
      return false
    }
    if (!/^\d{7,20}$/.test(nuevoUsuario.numero)) {
      toast.error('El número debe contener solo dígitos (7 a 20).')
      return false
    }
    const passwordError = validarPassword(nuevoUsuario.password)
    if (passwordError) {
      toast.error(passwordError)
      return false
    }
    if (nuevoUsuario.password !== nuevoUsuario.password_confirmacion) {
      toast.error('La confirmación de contraseña no coincide.')
      return false
    }
    return true
  }

  const validarPaso2 = () => {
    if (nuevoUsuario.roles_nombres.length === 0 && !nuevoUsuario.rol_nombre) {
      toast.error('Selecciona al menos un subrol para continuar.')
      return false
    }
    return true
  }

  const validarPaso3 = () => {
    const firmaFinal = (nuevoUsuario.firma_creador || nombreFirmante).trim()
    if (firmaFinal.length < 3) {
      toast.error('La firma digital debe tener al menos 3 caracteres.')
      return false
    }
    return true
  }

  const aplicarRolInicial = (rol: RolNombre | '') => {
    setNuevoUsuario((p) => ({
      ...p,
      rol_nombre: rol,
      roles_nombres: rol ? [rol] : [],
      permisos: rol ? { ...roleCapabilities[rol as RolNombre] } : { ...DEFAULT_PERMISOS },
    }))
  }

  const toggleSubrolWizard = (subrol: RolNombre) => {
    setNuevoUsuario((p) => {
      if (!p.rol_nombre) return p
      const yaTiene = p.roles_nombres.includes(subrol)
      const nextRoles = yaTiene
        ? p.roles_nombres.filter((x) => x !== subrol)
        : [...p.roles_nombres, subrol]
      return { ...p, roles_nombres: nextRoles }
    })
  }

  const handleNextStep = () => {
    if (wizardStep === 1 && !validarPaso1()) return
    if (wizardStep === 2 && !validarPaso2()) return
    setWizardStep((s) => Math.min(s + 1, 3))
  }

  const handlePrevStep = () => setWizardStep((s) => Math.max(s - 1, 1))

  const handleCrearUsuarioFinal = async () => {
    if (!validarPaso1() || !validarPaso2() || !validarPaso3()) return
    const firmaFinal = (nuevoUsuario.firma_creador || nombreFirmante).trim()
    const rolesFinales = Array.from(
      new Set([
        ...nuevoUsuario.roles_nombres,
        ...(nuevoUsuario.rol_nombre ? [nuevoUsuario.rol_nombre] : []),
      ]),
    )
    try {
      setSavingUser(true)
      await herramientasService.crearUsuario({
        email: nuevoUsuario.email,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
        numero: nuevoUsuario.numero,
        direccion: nuevoUsuario.direccion,
        rol_nombre: rolesFinales[0] ?? undefined,
        roles_nombres: rolesFinales as RolNombre[],
        password: nuevoUsuario.password,
        password_confirmacion: nuevoUsuario.password_confirmacion,
        firma_creador: firmaFinal,
        permisos: nuevoUsuario.permisos,
      })
      toast.success(`Usuario ${nuevoUsuario.nombres} ${nuevoUsuario.apellidos} creado correctamente.`)
      onUserCreated()
      setVistaActiva('usuarios')
    } catch {
      toast.error('No se pudo crear el usuario.')
    } finally {
      setSavingUser(false)
    }
  }

  const steps = [
    { id: 1, title: 'Datos personales' },
    { id: 2, title: 'Rol y permisos' },
    { id: 3, title: 'Firma y trazabilidad' },
  ]

  const rolWizardActual: RolNombre | null = (nuevoUsuario.rol_nombre as RolNombre) || null
  const rolWizardSeleccionado = roles.find((r) => r.nombre === nuevoUsuario.rol_nombre)
  const wizardGrupos = rolWizardSeleccionado?.grupos ?? []
  const subrolesDisponibles = rolWizardActual ? HSE_SUBROLES_POR_ROL[rolWizardActual] ?? [] : []
  const submodulosActivosSubrol = rolWizardActual
    ? HSE_SUBMODULO_ROLES.filter((item) => item.roles.includes(rolWizardActual as RolNombre))
    : []

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
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
    width: '100%',
    transition: 'border-color 0.2s',
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderColor: 'var(--border-strong)',
    background: 'var(--bg-raised)',
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <div
      className="animate-fade-up stagger-2"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}
    >
      <div style={{ ...panelStyle, padding: '22px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginBottom: '2px',
              }}
            >
              Nuevo usuario
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Creación guiada
            </h3>
          </div>
          <button onClick={() => setVistaActiva('inicio')} className="btn-ghost" style={backButtonStyle}>
            <ChevronLeft size={12} />
            Volver
          </button>
        </div>

        {/* Steps Navbar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', flexWrap: 'wrap' }}>
          {steps.map((step) => {
            const active = step.id === wizardStep
            const completed = step.id < wizardStep
            return (
              <div
                key={step.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  border: `1px solid ${active ? 'var(--primary-400)' : 'var(--border-subtle)'}`,
                  background: active ? 'var(--bg-raised)' : 'transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'inline-grid',
                    placeItems: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: completed ? 'var(--success-500)' : 'transparent',
                    border: `1px solid ${
                      completed ? 'transparent' : active ? 'var(--primary-400)' : 'var(--border-subtle)'
                    }`,
                    color: completed ? '#fff' : active ? 'var(--primary-500)' : 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {completed ? <Check size={10} color="#fff" /> : step.id}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ minHeight: '380px', position: 'relative' }}>
          {/* PASO 1 */}
          <div
            style={{
              display: wizardStep === 1 ? 'grid' : 'none',
              gap: '10px',
              animation: 'fadeIn 0.3s ease-out forwards',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  NOMBRES
                </label>
                <input
                  value={nuevoUsuario.nombres}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, nombres: e.target.value }))}
                  placeholder="Nombres"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  APELLIDOS
                </label>
                <input
                  value={nuevoUsuario.apellidos}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, apellidos: e.target.value }))}
                  placeholder="Apellidos"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                CORREO ELECTRÓNICO
              </label>
              <input
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario((p) => ({ ...p, email: e.target.value }))}
                placeholder="correo@empresa.com"
                style={fieldStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  NÚMERO
                </label>
                <input
                  value={nuevoUsuario.numero}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, numero: e.target.value.replace(/[^\d]/g, '') }))}
                  placeholder="Número de documento"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  DIRECCIÓN
                </label>
                <input
                  value={nuevoUsuario.direccion}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, direccion: e.target.value }))}
                  placeholder="Dirección"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  CONTRASEÑA INICIAL
                </label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  CONFIRMAR CONTRASEÑA
                </label>
                <input
                  type="password"
                  value={nuevoUsuario.password_confirmacion}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, password_confirmacion: e.target.value }))}
                  placeholder="Repite la contraseña"
                  style={fieldStyle}
                />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Debe contener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
            </p>
          </div>

          {/* PASO 2 */}
          <div
            style={{
              display: wizardStep === 2 ? 'grid' : 'none',
              gap: '16px',
              animation: 'fadeIn 0.3s ease-out forwards',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              <div style={{ ...panelStyle, padding: '12px', boxShadow: 'none' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Guía de asignación
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>1. Selecciona el rol principal.</div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                    2. Marca los subroles secundarios.
                  </div>
                  <div style={{ fontSize: '0.71rem', color: 'var(--text-secondary)' }}>
                    3. Revisa los permisos asignados.
                  </div>
                </div>
              </div>

              <div style={{ ...panelStyle, padding: '12px', boxShadow: 'none' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  ROL PRINCIPAL
                </label>
                <select
                  value={nuevoUsuario.rol_nombre}
                  onChange={(e) => aplicarRolInicial(e.target.value as RolNombre | '')}
                  style={fieldStyle}
                >
                  <option value="">Seleccionar rol...</option>
                  {HSE_ROLES_ACTIVOS.map((rol) => (
                    <option key={`wizard-main-rol-${rol}`} value={rol}>
                      {rol}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '7px 0 0', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Este rol se asigna siempre de base.
                </p>
              </div>
            </div>

            {nuevoUsuario.rol_nombre && (
              <div style={{ ...panelStyle, padding: '12px', boxShadow: 'none' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '7px',
                  }}
                >
                  SUBROLES PERMITIDOS PARA {nuevoUsuario.rol_nombre}
                </label>
                {subrolesDisponibles.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Este rol principal no tiene subroles configurados.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '7px' }}>
                    {subrolesDisponibles.map((subrol) => {
                      const activo = nuevoUsuario.roles_nombres.includes(subrol)
                      return (
                        <label
                          key={`wizard-subrol-${subrol}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${activo ? 'var(--primary-400)' : 'var(--border-default)'}`,
                            background: activo ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-raised)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.76rem',
                              color: activo ? 'var(--primary-500)' : 'var(--text-secondary)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: activo ? 700 : 500,
                            }}
                          >
                            {subrol}
                          </span>
                          <input
                            type="checkbox"
                            checked={activo}
                            onChange={() => toggleSubrolWizard(subrol)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                          />
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Permisos */}
            {nuevoUsuario.rol_nombre && (
              <div style={{ ...panelStyle, padding: '14px', boxShadow: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Permisos operativos
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Define las acciones base del usuario en los módulos permitidos.
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {Object.values(nuevoUsuario.permisos).filter(Boolean).length}/4 activos
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {PERMISOS_LABELS.map((perm) => {
                    const meta = PERMISSION_META[perm.key]
                    const active = nuevoUsuario.permisos[perm.key]
                    const Icon = meta.icon
                    return (
                      <label
                        key={perm.key}
                        style={{
                          border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: active ? 'var(--bg-elevated)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            background: 'var(--bg-base)',
                            border: `1px solid ${active ? meta.color + '66' : 'var(--border-subtle)'}`,
                          }}
                        >
                          <Icon size={14} color={active ? meta.color : 'var(--text-muted)'} />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.77rem',
                              fontWeight: 600,
                              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {perm.label}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) =>
                            setNuevoUsuario((p) => ({
                              ...p,
                              permisos: { ...p.permisos, [perm.key]: e.target.checked },
                            }))
                          }
                          style={{ width: '14px', height: '14px', accentColor: meta.color, cursor: 'pointer', flexShrink: 0 }}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PASO 3 */}
          <div
            style={{
              display: wizardStep === 3 ? 'grid' : 'none',
              gap: '12px',
              animation: 'fadeIn 0.3s ease-out forwards',
            }}
          >
            <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>Trazabilidad requerida</div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                El registro de un usuario en el Centro de Administración queda asociado automáticamente al usuario en sesión como responsable del alta. Acepta que tu firma sea insertada en los registros de auditoría operativa.
              </p>
            </div>
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Firmante detectado
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {nombreFirmante || 'Sin usuario en sesión'}
              </div>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                  letterSpacing: '0.04em',
                }}
              >
                FIRMA DIGITAL / NOMBRE COMPLETO
              </label>
              <input
                value={nuevoUsuario.firma_creador}
                onChange={(e) => setNuevoUsuario((p) => ({ ...p, firma_creador: e.target.value }))}
                placeholder="Nombre Apellido"
                style={{ ...fieldStyle, fontStyle: 'italic', fontSize: '1rem' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setNuevoUsuario((p) => ({ ...p, firma_creador: nombreFirmante }))}
              className="btn-ghost"
              style={{ justifySelf: 'start', fontSize: '0.72rem' }}
            >
              Autocompletar mi nombre
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px',
          }}
        >
          <button
            onClick={handlePrevStep}
            disabled={wizardStep === 1}
            className="btn-ghost"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              opacity: wizardStep === 1 ? 0.4 : 1,
              padding: '8px 14px',
            }}
          >
            <ChevronLeft size={14} />
            Atrás
          </button>
          {wizardStep < 3 ? (
            <button
              onClick={handleNextStep}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 18px' }}
            >
              Siguiente
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCrearUsuarioFinal}
              disabled={savingUser}
              className="btn-primary"
              style={{ padding: '8px 18px', opacity: savingUser ? 0.75 : 1 }}
            >
              {savingUser ? 'Creando usuario...' : 'Crear y firmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
