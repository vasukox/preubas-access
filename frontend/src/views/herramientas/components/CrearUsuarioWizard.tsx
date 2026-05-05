import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Lock, ChevronDown, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { herramientasService, type RolSistema } from '@/services/herramientas.service'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { RolNombre, SedeBasica } from '@/types'
import {
  DEFAULT_PERMISOS,
  PERMISSION_META,
  PERMISOS_LABELS,
  ROL_AREAS_POR_CATEGORIA,
  ROL_CATEGORIAS,
  resolverRolFinal,
  roleCapabilities,
  validarPassword,
  type RolCategoria,
  type VistaHerramientas,
} from '../constants'

interface CrearUsuarioWizardProps {
  roles: RolSistema[]
  setVistaActiva: (vista: VistaHerramientas) => void
  onUserCreated: () => void
}

export function CrearUsuarioWizard({ setVistaActiva, onUserCreated }: CrearUsuarioWizardProps) {
  const [wizardStep, setWizardStep] = useState(1)
  const [savingUser, setSavingUser] = useState(false)
  const [sedesDisponibles, setSedesDisponibles] = useState<SedeBasica[]>([])

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
    sede_asignada_id: null as number | null,
  })

  // Estado del selector en cascada (no necesita persistirse en nuevoUsuario)
  const [rolCategoria, setRolCategoria] = useState<RolCategoria | ''>('')
  const [rolArea,      setRolArea]      = useState<RolNombre | ''  >('')

  // Toggle visibilidad de contraseña
  const [showPassword,    setShowPassword]    = useState(false)
  const [showPasswordConf, setShowPasswordConf] = useState(false)

  // Cargar sedes al montar
  useEffect(() => {
    hseService
      .getSedes()
      .then(setSedesDisponibles)
      .catch((e) => {
        toast.error(getErrorMessage(e))
      })
  }, [])

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

  const ROLES_VIGILANTE: RolNombre[] = ['VIGILANTE_HSE', 'VIGILANTE_PARKING']
  const esVigilante = nuevoUsuario.roles_nombres.some(r => ROLES_VIGILANTE.includes(r))
    || ROLES_VIGILANTE.includes(nuevoUsuario.rol_nombre as RolNombre)

  const validarPaso2 = () => {
    if (nuevoUsuario.roles_nombres.length === 0 && !nuevoUsuario.rol_nombre) {
      toast.error('Selecciona al menos un subrol para continuar.')
      return false
    }
    if (esVigilante && !nuevoUsuario.sede_asignada_id) {
      toast.error('Los vigilantes deben tener una sede asignada. Selecciona una sede.')
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

  // Handler principal del selector en cascada
  const handleCategoriaChange = (cat: RolCategoria | '') => {
    setRolCategoria(cat)
    setRolArea('')
    // Si la categoría ya resuelve un rol directamente (ADMIN_GLOBAL / VISUALIZADOR) lo aplicamos ya
    const rolResuelto = resolverRolFinal(cat, '')
    aplicarRolInicial(rolResuelto)
  }

  const handleAreaChange = (area: RolNombre | '') => {
    setRolArea(area)
    const rolResuelto = resolverRolFinal(rolCategoria, area)
    aplicarRolInicial(rolResuelto)
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
    // Con el selector en cascada, solo hay un rol resuelto — limpio y sin subroles extra
    const rolFinal = nuevoUsuario.rol_nombre
    if (!rolFinal) return
    try {
      setSavingUser(true)
      await herramientasService.crearUsuario({
        email:                 nuevoUsuario.email,
        nombres:               nuevoUsuario.nombres,
        apellidos:             nuevoUsuario.apellidos,
        numero:                nuevoUsuario.numero,
        direccion:             nuevoUsuario.direccion,
        rol_nombre:            rolFinal,
        roles_nombres:         [rolFinal] as RolNombre[],
        password:              nuevoUsuario.password,
        password_confirmacion: nuevoUsuario.password_confirmacion,
        firma_creador:         firmaFinal,
        permisos:              nuevoUsuario.permisos,
        sede_asignada_id:      esVigilante ? nuevoUsuario.sede_asignada_id : null,
      })
      toast.success(`Usuario ${nuevoUsuario.nombres} ${nuevoUsuario.apellidos} creado correctamente.`)
      onUserCreated()
      setVistaActiva('usuarios')
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setSavingUser(false)
    }
  }

  const steps = [
    { id: 1, title: 'Datos personales' },
    { id: 2, title: 'Rol y permisos' },
    { id: 3, title: 'Firma y trazabilidad' },
  ]

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
            {/* ── Contraseña con indicador premium ──────────────────────── */}
            {(() => {
              const pwd = nuevoUsuario.password
              const rules = [
                { key: 'len',     label: 'Mínimo 8 caracteres',   ok: pwd.length >= 8 },
                { key: 'upper',   label: 'Una mayúscula',          ok: /[A-Z]/.test(pwd) },
                { key: 'lower',   label: 'Una minúscula',          ok: /[a-z]/.test(pwd) },
                { key: 'digit',   label: 'Un número',              ok: /\d/.test(pwd) },
                { key: 'special', label: 'Carácter especial',      ok: /[^A-Za-z0-9]/.test(pwd) },
              ]
              const passed   = rules.filter((r) => r.ok).length
              const strength = pwd.length === 0 ? 0 : passed
              const strengthConfig = [
                { label: '',          color: 'var(--border-subtle)' },
                { label: 'Muy débil', color: '#ef4444' },
                { label: 'Débil',     color: '#f97316' },
                { label: 'Regular',   color: '#eab308' },
                { label: 'Fuerte',    color: '#22c55e' },
                { label: 'Perfecta',  color: '#10b981' },
              ][strength]

              const confirm  = nuevoUsuario.password_confirmacion
              const matches  = confirm.length > 0 && pwd === confirm
              const mismatch = confirm.length > 0 && pwd !== confirm

              return (
                <div style={{ display: 'grid', gap: '12px' }}>

                  {/* Campo contraseña */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', letterSpacing: '0.04em' }}>
                      CONTRASEÑA INICIAL
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={pwd}
                        onChange={(e) => setNuevoUsuario((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Mínimo 8 caracteres"
                        style={{
                          ...fieldStyle,
                          paddingRight: '38px',
                          borderColor: pwd.length > 0
                            ? passed === 5 ? '#22c55e66'
                            : passed >= 3  ? '#eab30866'
                            : '#ef444466'
                            : 'var(--border-default)',
                          transition: 'border-color 0.3s ease',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: '4px', display: 'flex',
                        }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Barra de fuerza */}
                    {pwd.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                          {[1,2,3,4,5].map((i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1, height: '3px', borderRadius: '2px',
                                background: i <= strength ? strengthConfig.color : 'var(--border-subtle)',
                                transition: 'background 0.3s ease',
                              }}
                            />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: strengthConfig.color, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {strengthConfig.label}
                        </div>
                      </div>
                    )}

                    {/* Chips de requisitos */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                      {rules.map((rule) => (
                        <span
                          key={rule.key}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', borderRadius: '999px', fontSize: '0.67rem', fontWeight: 600,
                            border: `1px solid ${rule.ok ? 'rgba(16,185,129,0.35)' : 'var(--border-subtle)'}`,
                            background: rule.ok ? 'rgba(16,185,129,0.08)' : 'var(--bg-raised)',
                            color: rule.ok ? 'var(--success-400)' : 'var(--text-muted)',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          {rule.ok
                            ? <Check size={10} color="var(--success-400)" />
                            : <X size={10} color="var(--text-muted)" />}
                          {rule.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Campo confirmación */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '5px', letterSpacing: '0.04em' }}>
                      CONFIRMAR CONTRASEÑA
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswordConf ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setNuevoUsuario((p) => ({ ...p, password_confirmacion: e.target.value }))}
                        placeholder="Repite la contraseña"
                        style={{
                          ...fieldStyle,
                          paddingRight: '38px',
                          borderColor: matches ? '#22c55e66' : mismatch ? '#ef444466' : 'var(--border-default)',
                          transition: 'border-color 0.3s ease',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConf((v) => !v)}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', padding: '4px', display: 'flex',
                        }}
                        tabIndex={-1}
                      >
                        {showPasswordConf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {matches && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.7rem', color: 'var(--success-400)', fontWeight: 600 }}>
                        <Check size={12} /> Las contraseñas coinciden
                      </div>
                    )}
                    {mismatch && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.7rem', color: 'var(--danger-400)', fontWeight: 600 }}>
                        <X size={12} /> No coinciden
                      </div>
                    )}
                  </div>

                </div>
              )
            })()}
          </div>

          {/* PASO 2 */}
          <div
            style={{
              display: wizardStep === 2 ? 'grid' : 'none',
              gap: '16px',
              animation: 'fadeIn 0.3s ease-out forwards',
            }}
          >
            {/* ── Selector en cascada ────────────────────────────────────── */}
            <div style={{ display: 'grid', gap: '14px' }}>

              {/* Nivel 1 — Categoría */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.06em' }}>
                  TIPO DE ROL
                </label>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {ROL_CATEGORIAS.map((cat) => {
                    const selected = rolCategoria === cat.value
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => handleCategoriaChange(cat.value)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${selected ? 'var(--primary-400)' : 'var(--border-default)'}`,
                          background: selected ? 'rgba(245,158,11,0.07)' : 'var(--bg-raised)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.18s ease',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                            background: selected ? 'var(--primary-500)' : 'var(--border-default)',
                            border: `2px solid ${selected ? 'var(--primary-400)' : 'var(--border-subtle)'}`,
                            transition: 'all 0.18s',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: selected ? 700 : 500, color: selected ? 'var(--primary-400)' : 'var(--text-primary)' }}>
                            {cat.label}
                          </div>
                          <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {cat.descripcion}
                          </div>
                        </div>
                        {selected && <Check size={14} color="var(--primary-500)" style={{ flexShrink: 0 }} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nivel 2 — Área (aparece si la categoría tiene sub-opciones) */}
              {rolCategoria && ROL_AREAS_POR_CATEGORIA[rolCategoria] && (
                <div
                  style={{
                    borderLeft: '2px solid var(--primary-500)',
                    paddingLeft: '14px',
                    animation: 'fadeIn 0.25s ease-out',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                    <ChevronDown size={12} color="var(--primary-400)" />
                    ÁREA DE OPERACIÓN
                  </label>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {ROL_AREAS_POR_CATEGORIA[rolCategoria]!.map((area) => {
                      const selected = rolArea === area.value
                      return (
                        <button
                          key={area.value}
                          type="button"
                          onClick={() => handleAreaChange(area.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${selected ? 'var(--primary-400)' : 'var(--border-subtle)'}`,
                            background: selected ? 'rgba(245,158,11,0.06)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.18s ease',
                            width: '100%',
                          }}
                        >
                          <div
                            style={{
                              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                              background: selected ? 'var(--primary-500)' : 'var(--border-default)',
                              transition: 'all 0.18s',
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: selected ? 600 : 400, color: selected ? 'var(--primary-400)' : 'var(--text-secondary)', flex: 1 }}>
                            {area.label}
                          </span>
                          {selected && <Check size={12} color="var(--primary-500)" style={{ flexShrink: 0 }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Confirmación visual del rol resuelto */}
              {nuevoUsuario.rol_nombre && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)',
                }}>
                  <Check size={14} color="var(--success-400)" />
                  <span style={{ fontSize: '0.77rem', color: 'var(--success-400)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {nuevoUsuario.rol_nombre}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>asignado como rol base</span>
                </div>
              )}
            </div>

            {/* Selector de sede — solo para vigilantes */}
            {esVigilante && (
              <div style={{ ...panelStyle, padding: '14px', boxShadow: 'none', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Lock size={13} color="var(--primary-400)" />
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-400)' }}>
                    Sede operativa fija — requerida
                  </div>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Los vigilantes quedan atados a una única sede. No podrán cambiarlo una vez creada la cuenta.
                </p>
                <select
                  value={nuevoUsuario.sede_asignada_id ?? ''}
                  onChange={(e) => setNuevoUsuario((p) => ({
                    ...p,
                    sede_asignada_id: e.target.value ? Number(e.target.value) : null,
                  }))}
                  style={{ ...fieldStyle, borderColor: nuevoUsuario.sede_asignada_id ? 'var(--primary-400)' : 'rgba(245,158,11,0.6)' }}
                >
                  <option value="">Selecciona la sede fija del vigilante...</option>
                  {sedesDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} {s.ciudad ? `— ${s.ciudad}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Subroles eliminados: el nuevo selector en cascada resuelve un único rol */}

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
