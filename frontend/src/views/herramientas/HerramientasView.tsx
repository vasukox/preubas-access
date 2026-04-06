import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Lock,
  PenSquare,
  Plus,
  PlusCircle,
  RefreshCw,
  Shield,
  Trash2,
  UserCheck,
  UserCog,
  UserX,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  herramientasService,
  type AuditLogEntry,
  type PermisosUsuario,
  type RolSistema,
  type UsuarioSistema,
} from '@/services/herramientas.service'
import { useAuthStore } from '@/store/authStore'
import type { RolNombre } from '@/types'

type VistaHerramientas = 'inicio' | 'crear' | 'usuarios' | 'roles' | 'auditoria'

// PermisosUI es alias del tipo del servicio para el wizard (usa keys sin "puede_")
interface PermisosUI {
  ver: boolean
  crear: boolean
  editar: boolean
  eliminar: boolean
}

const PERMISOS_LABELS: Array<{ key: keyof PermisosUI; label: string }> = [
  { key: 'ver', label: 'Ver' },
  { key: 'crear', label: 'Crear' },
  { key: 'editar', label: 'Editar' },
  { key: 'eliminar', label: 'Eliminar' },
]

const PERMISOS_BD_LABELS: Array<{ key: keyof PermisosUsuario; label: string }> = [
  { key: 'puede_ver', label: 'Ver' },
  { key: 'puede_crear', label: 'Crear' },
  { key: 'puede_editar', label: 'Editar' },
  { key: 'puede_eliminar', label: 'Eliminar' },
]

const DEFAULT_PERMISOS: PermisosUI = {
  ver: true,
  crear: false,
  editar: false,
  eliminar: false,
}

const PERMISSION_META: Record<keyof PermisosUI, { descripcion: string; color: string; icon: React.ComponentType<{ size?: number; color?: string }> }> = {
  ver: {
    descripcion: 'Consultar informacion y paneles habilitados.',
    color: 'var(--info-400)',
    icon: Eye,
  },
  crear: {
    descripcion: 'Registrar nuevos elementos del flujo.',
    color: 'var(--success-400)',
    icon: PlusCircle,
  },
  editar: {
    descripcion: 'Actualizar datos existentes del modulo.',
    color: 'var(--primary-400)',
    icon: PenSquare,
  },
  eliminar: {
    descripcion: 'Eliminar registros permitidos por politica.',
    color: 'var(--danger-400)',
    icon: Trash2,
  },
}

// Permisos por defecto sugeridos al seleccionar un rol en el wizard
const roleCapabilities: Record<RolNombre, PermisosUI> = {
  ADMIN_GLOBAL:      { ver: true, crear: true,  editar: true,  eliminar: true  },
  ADMIN_HSE:         { ver: true, crear: true,  editar: true,  eliminar: false },
  GESTION_HSE:       { ver: true, crear: true,  editar: true,  eliminar: false },
  VIGILANTE_HSE:     { ver: true, crear: false, editar: true,  eliminar: false },
  ADMIN_PARKING:     { ver: true, crear: true,  editar: true,  eliminar: false },
  VIGILANTE_PARKING: { ver: true, crear: false, editar: true,  eliminar: false },
  ADMIN_NFC:         { ver: true, crear: true,  editar: true,  eliminar: false },
  ADMIN_GH:          { ver: true, crear: true,  editar: true,  eliminar: false },
  VISUALIZADOR:      { ver: true, crear: false, editar: false, eliminar: false },
}

const ACCIONES_AUDITORIA: Record<string, string> = {
  CREAR_USUARIO:        'Crear usuario',
  ACTUALIZAR_USUARIO:   'Actualizar usuario',
  DESACTIVAR_USUARIO:   'Desactivar usuario',
  ASIGNAR_ROL:          'Asignar rol',
  QUITAR_ROL:           'Quitar rol',
  ACTUALIZAR_PERMISOS:  'Actualizar permisos',
}

function badgeColor(color: string): React.CSSProperties {
  return {
    background: `${color}1A`,
    border: `1px solid ${color}55`,
    color,
  }
}

export default function HerramientasView() {
  const [loading, setLoading] = useState(true)
  const [savingUser, setSavingUser] = useState(false)
  const [savingPermisos, setSavingPermisos] = useState(false)
  const [loadingAuditoria, setLoadingAuditoria] = useState(false)
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [roles, setRoles] = useState<RolSistema[]>([])
  const [auditoria, setAuditoria] = useState<AuditLogEntry[]>([])
  const [filtro, setFiltro] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [rolSeleccionado, setRolSeleccionado] = useState<Record<number, RolNombre | ''>>({})
  const [editandoPermisos, setEditandoPermisos] = useState<number | null>(null)
  const [permisosEnEdicion, setPermisosEnEdicion] = useState<PermisosUsuario>({
    puede_ver: true, puede_crear: false, puede_editar: false, puede_eliminar: false,
  })
  const [vistaActiva, setVistaActiva] = useState<VistaHerramientas>('inicio')
  const [wizardStep, setWizardStep] = useState(1)

  const usuarioActual = useAuthStore((s) => s.usuario)
  const nombreFirmante = usuarioActual?.nombre_completo ?? ''

  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    nombres: '',
    apellidos: '',
    numero: '',
    direccion: '',
    rol_nombre: '' as RolNombre | '',
    password: '',
    password_confirmacion: '',
    firma_creador: '',
    permisos: { ...DEFAULT_PERMISOS },
  })

  const validarPassword = (password: string): string | null => {
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    if (!/[A-Z]/.test(password)) return 'La contraseña debe incluir una mayúscula.'
    if (!/[a-z]/.test(password)) return 'La contraseña debe incluir una minúscula.'
    if (!/\d/.test(password)) return 'La contraseña debe incluir un número.'
    if (!/[^A-Za-z0-9]/.test(password)) return 'La contraseña debe incluir un carácter especial.'
    return null
  }

  const cargarTodo = async () => {
    setLoading(true)
    try {
      const [rolesData, usuariosData] = await Promise.all([
        herramientasService.listarRoles(),
        herramientasService.listarUsuarios(),
      ])
      setRoles(rolesData)
      setUsuarios(usuariosData)
    } catch {
      toast.error('No se pudo cargar el módulo de herramientas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  useEffect(() => {
    if (wizardStep !== 3) return
    if (nuevoUsuario.firma_creador.trim()) return
    if (!nombreFirmante.trim()) return

    setNuevoUsuario((prev) => ({ ...prev, firma_creador: nombreFirmante }))
  }, [wizardStep, nombreFirmante, nuevoUsuario.firma_creador])

  const usuariosFiltrados = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    if (!q) return usuarios
    return usuarios.filter(
      (u) => u.nombre_completo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [usuarios, filtro])

  const resetWizard = () => {
    setWizardStep(1)
    setNuevoUsuario({
      email: '',
      nombres: '',
      apellidos: '',
      numero: '',
      direccion: '',
      rol_nombre: '',
      password: '',
      password_confirmacion: '',
      firma_creador: '',
      permisos: { ...DEFAULT_PERMISOS },
    })
  }

  const goToCrearWizard = () => {
    resetWizard()
    setVistaActiva('crear')
  }

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
    if (!nuevoUsuario.rol_nombre) {
      toast.error('Selecciona un rol para continuar.')
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

  const handleNextStep = () => {
    if (wizardStep === 1 && !validarPaso1()) return
    if (wizardStep === 2 && !validarPaso2()) return
    setWizardStep((s) => Math.min(s + 1, 3))
  }

  const handlePrevStep = () => setWizardStep((s) => Math.max(s - 1, 1))

  const handleCrearUsuarioFinal = async () => {
    if (!validarPaso1() || !validarPaso2() || !validarPaso3()) return

    const firmaFinal = (nuevoUsuario.firma_creador || nombreFirmante).trim()

    try {
      setSavingUser(true)
      await herramientasService.crearUsuario({
        email: nuevoUsuario.email,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
        numero: nuevoUsuario.numero,
        direccion: nuevoUsuario.direccion,
        rol_nombre: nuevoUsuario.rol_nombre as RolNombre,
        password: nuevoUsuario.password,
        password_confirmacion: nuevoUsuario.password_confirmacion,
        firma_creador: firmaFinal,
        permisos: nuevoUsuario.permisos,
      })
      toast.success(`Usuario ${nuevoUsuario.nombres} ${nuevoUsuario.apellidos} creado correctamente.`)
      await cargarTodo()
      setVistaActiva('usuarios')
      resetWizard()
    } catch {
      toast.error('No se pudo crear el usuario.')
    } finally {
      setSavingUser(false)
    }
  }

  const handleToggleActivo = async (u: UsuarioSistema) => {
    try {
      await herramientasService.actualizarUsuario(u.id, { activo: !u.activo })
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x)))
      toast.success(`Usuario ${u.nombre_completo} ${u.activo ? 'desactivado' : 'activado'}.`)
    } catch {
      toast.error('No se pudo actualizar el estado del usuario.')
    }
  }

  const handleAsignarRol = async (u: UsuarioSistema) => {
    const rol = rolSeleccionado[u.id]
    if (!rol) {
      toast.error('Selecciona un rol para asignar.')
      return
    }

    try {
      const actualizado = await herramientasService.asignarRol(u.id, rol)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? actualizado : x)))
      setRolSeleccionado((prev) => ({ ...prev, [u.id]: '' }))
      toast.success(`Rol ${rol} asignado a ${u.nombre_completo}.`)
    } catch {
      toast.error('No se pudo asignar el rol.')
    }
  }

  const handleQuitarRol = async (u: UsuarioSistema, rol: RolNombre) => {
    try {
      const actualizado = await herramientasService.quitarRol(u.id, rol)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? actualizado : x)))
      toast.success(`Rol ${rol} removido de ${u.nombre_completo}.`)
    } catch {
      toast.error('No se pudo quitar el rol.')
    }
  }

  const handleAbrirEditarPermisos = (u: UsuarioSistema) => {
    setPermisosEnEdicion({ ...u.permisos })
    setEditandoPermisos(u.id)
  }

  const handleGuardarPermisos = async (u: UsuarioSistema) => {
    try {
      setSavingPermisos(true)
      const actualizado = await herramientasService.actualizarPermisos(u.id, permisosEnEdicion)
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? actualizado : x)))
      setEditandoPermisos(null)
      toast.success(`Permisos de ${u.nombre_completo} actualizados.`)
    } catch {
      toast.error('No se pudo actualizar los permisos.')
    } finally {
      setSavingPermisos(false)
    }
  }

  const cargarAuditoria = async (accion?: string) => {
    setLoadingAuditoria(true)
    try {
      const data = await herramientasService.listarAuditoria({ limit: 100, accion: accion || undefined })
      setAuditoria(data)
    } catch {
      toast.error('No se pudo cargar el registro de auditoría.')
    } finally {
      setLoadingAuditoria(false)
    }
  }

  useEffect(() => {
    if (vistaActiva === 'auditoria') {
      cargarAuditoria(filtroAccion || undefined)
    }
  }, [vistaActiva])

  const steps = [
    { id: 1, title: 'Datos personales' },
    { id: 2, title: 'Rol y permisos' },
    { id: 3, title: 'Firma y trazabilidad' },
  ]

  const usuariosActivos = usuarios.filter((u) => u.activo).length
  const usuariosInactivos = usuarios.length - usuariosActivos
  const rolWizardSeleccionado = roles.find((r) => r.nombre === nuevoUsuario.rol_nombre)
  const wizardGrupos = rolWizardSeleccionado?.grupos ?? []

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
  }

  const fieldStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.82rem',
    outline: 'none',
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Shield size={14} color="var(--primary-400)" />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--primary-400)',
                letterSpacing: '0.12em',
              }}
            >
              MÓDULO HERRAMIENTAS
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}
          >
            Centro de administración
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Gestiona creación de usuarios, roles y trazabilidad de accesos.
          </p>
        </div>

        <button
          onClick={cargarTodo}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} />
          Recargar
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
        className="animate-fade-up stagger-1"
      >
        <div style={{ ...panelStyle, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>USUARIOS</div>
          <div style={{ fontSize: '1.45rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 700 }}>{usuarios.length}</div>
        </div>
        <div style={{ ...panelStyle, padding: '14px 16px', background: 'rgba(16,185,129,0.06)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ACTIVOS</div>
          <div style={{ fontSize: '1.45rem', fontFamily: 'var(--font-mono)', color: 'var(--success-400)', fontWeight: 700 }}>{usuariosActivos}</div>
        </div>
        <div style={{ ...panelStyle, padding: '14px 16px', background: 'rgba(239,68,68,0.06)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>INACTIVOS</div>
          <div style={{ fontSize: '1.45rem', fontFamily: 'var(--font-mono)', color: 'var(--danger-400)', fontWeight: 700 }}>{usuariosInactivos}</div>
        </div>
        <div style={{ ...panelStyle, padding: '14px 16px', background: 'rgba(245,158,11,0.06)' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ROLES</div>
          <div style={{ fontSize: '1.45rem', fontFamily: 'var(--font-mono)', color: 'var(--primary-400)', fontWeight: 700 }}>{roles.length}</div>
        </div>
      </div>

      {vistaActiva === 'inicio' && (
        <div className="animate-fade-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <button
            onClick={goToCrearWizard}
            style={{
              textAlign: 'left',
              border: '1px solid rgba(16,185,129,0.3)',
              background: 'rgba(16,185,129,0.09)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)' }}>
              <Plus size={16} color="var(--success-400)" />
            </div>
            <h3 style={{ margin: '10px 0 4px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>Crear usuarios y roles</h3>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
              Flujo guiado por pasos: datos, rol/permisos y firma digital.
            </p>
          </button>

          <button
            onClick={() => setVistaActiva('usuarios')}
            style={{
              textAlign: 'left',
              border: '1px solid rgba(59,130,246,0.3)',
              background: 'rgba(59,130,246,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: 'rgba(59,130,246,0.16)' }}>
              <UserCog size={16} color="var(--primary-400)" />
            </div>
            <h3 style={{ margin: '10px 0 4px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>Gestionar usuarios</h3>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
              Activa, desactiva y administra roles de usuarios existentes.
            </p>
          </button>

          <button
            onClick={() => setVistaActiva('roles')}
            style={{
              textAlign: 'left',
              border: '1px solid rgba(245,158,11,0.35)',
              background: 'rgba(245,158,11,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: 'rgba(245,158,11,0.17)' }}>
              <UserCheck size={16} color="#F59E0B" />
            </div>
            <h3 style={{ margin: '10px 0 4px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>Catálogo de roles</h3>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
              Consulta los roles y el alcance operativo definido para cada uno.
            </p>
          </button>

          <button
            onClick={() => setVistaActiva('auditoria')}
            style={{
              textAlign: 'left',
              border: '1px solid rgba(139,92,246,0.35)',
              background: 'rgba(139,92,246,0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '12px', background: 'rgba(139,92,246,0.17)' }}>
              <Clock size={16} color="#8B5CF6" />
            </div>
            <h3 style={{ margin: '10px 0 4px', fontSize: '0.94rem', color: 'var(--text-primary)' }}>Registro de auditoría</h3>
            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-muted)' }}>
              Historial completo de cambios: usuarios creados, roles y permisos modificados.
            </p>
          </button>
        </div>
      )}

      {vistaActiva === 'crear' && (
        <div className="animate-fade-up stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
          <div style={{ ...panelStyle, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.96rem' }}>Wizard de creación de usuario</h3>
              <button
                onClick={() => setVistaActiva('inicio')}
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={12} />
                Volver al inicio
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
                      padding: '6px 10px',
                      borderRadius: '999px',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'var(--border-subtle)'}`,
                      background: active ? 'rgba(59,130,246,0.1)' : completed ? 'rgba(16,185,129,0.1)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'inline-grid',
                        placeItems: 'center',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: completed ? 'rgba(16,185,129,0.2)' : active ? 'rgba(59,130,246,0.2)' : 'var(--bg-base)',
                        color: completed ? 'var(--success-400)' : active ? 'var(--primary-400)' : 'var(--text-muted)',
                      }}
                    >
                      {completed ? <Check size={11} /> : step.id}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.title}</span>
                  </div>
                )
              })}
            </div>

            {wizardStep === 1 && (
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    value={nuevoUsuario.nombres}
                    onChange={(e) => setNuevoUsuario((p) => ({ ...p, nombres: e.target.value }))}
                    placeholder="Nombres"
                    style={fieldStyle}
                  />
                  <input
                    value={nuevoUsuario.apellidos}
                    onChange={(e) => setNuevoUsuario((p) => ({ ...p, apellidos: e.target.value }))}
                    placeholder="Apellidos"
                    style={fieldStyle}
                  />
                </div>
                <input
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, email: e.target.value }))}
                  placeholder="correo@empresa.com"
                  style={fieldStyle}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    value={nuevoUsuario.numero}
                    onChange={(e) => setNuevoUsuario((p) => ({ ...p, numero: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="Número"
                    style={fieldStyle}
                  />
                  <input
                    value={nuevoUsuario.direccion}
                    onChange={(e) => setNuevoUsuario((p) => ({ ...p, direccion: e.target.value }))}
                    placeholder="Dirección"
                    style={fieldStyle}
                  />
                </div>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Contraseña inicial"
                  style={fieldStyle}
                />
                <input
                  type="password"
                  value={nuevoUsuario.password_confirmacion}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, password_confirmacion: e.target.value }))}
                  placeholder="Confirmar contraseña"
                  style={fieldStyle}
                />
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Debe contener mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.
                </p>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ display: 'grid', gap: '14px' }}>
                <select
                  value={nuevoUsuario.rol_nombre}
                  onChange={(e) => {
                    const rol = e.target.value as RolNombre | ''
                    setNuevoUsuario((p) => ({
                      ...p,
                      rol_nombre: rol,
                      permisos: rol ? { ...roleCapabilities[rol] } : { ...DEFAULT_PERMISOS },
                    }))
                  }}
                  style={fieldStyle}
                >
                  <option value="">Rol inicial...</option>
                  {roles.map((r) => (
                    <option key={`wizard-rol-${r.id}`} value={r.nombre}>{r.nombre}</option>
                  ))}
                </select>

                <div
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(13,15,18,0.2) 100%)',
                    padding: '12px',
                    display: 'grid',
                    gap: '10px',
                  }}
                  className="animate-fade-up"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Permisos operativos personalizados
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Define exactamente que acciones puede ejecutar esta persona.
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: '999px',
                        border: '1px solid rgba(99,102,241,0.35)',
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        color: 'var(--info-400)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                      }}
                    >
                      {Object.values(nuevoUsuario.permisos).filter(Boolean).length}/4 activos
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  {PERMISOS_LABELS.map((perm) => (
                    (() => {
                      const meta = PERMISSION_META[perm.key]
                      const active = nuevoUsuario.permisos[perm.key]
                      const Icon = meta.icon
                      return (
                    <label
                      key={perm.key}
                      style={{
                        border: `1px solid ${active ? `${meta.color}55` : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        gap: '8px',
                        background: active ? `${meta.color}12` : 'rgba(255,255,255,0.01)',
                        transition: 'all var(--transition-base)',
                        cursor: 'pointer',
                      }}
                      className="animate-fade-up"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                          <span
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '8px',
                              display: 'inline-grid',
                              placeItems: 'center',
                              background: active ? `${meta.color}22` : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${active ? `${meta.color}55` : 'var(--border-subtle)'}`,
                            }}
                          >
                            <Icon size={14} color={active ? meta.color : 'var(--text-muted)'} />
                          </span>
                          <span style={{ fontSize: '0.75rem', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {perm.label}
                          </span>
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
                          style={{ width: '15px', height: '15px', accentColor: '#F59E0B', cursor: 'pointer' }}
                        />
                      </div>

                      <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                        {meta.descripcion}
                      </span>
                    </label>
                      )
                    })()
                  ))}
                </div>
                </div>

                {rolWizardSeleccionado && (
                  <div
                    style={{
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'linear-gradient(160deg, rgba(99,102,241,0.1) 0%, rgba(13,15,18,0.35) 60%, rgba(16,185,129,0.06) 100%)',
                      padding: '12px',
                      display: 'grid',
                      gap: '10px',
                    }}
                    className="animate-fade-up"
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      Alcance detallado del rol {rolWizardSeleccionado.nombre}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Modulos visibles</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(rolWizardSeleccionado.modulos ?? []).map((m) => (
                          <span
                            key={`wiz-mod-${rolWizardSeleccionado.nombre}-${m}`}
                            style={{
                              fontSize: '0.69rem',
                              padding: '3px 9px',
                              borderRadius: '999px',
                              border: '1px solid rgba(245,158,11,0.35)',
                              color: 'var(--primary-300)',
                              background: 'rgba(245,158,11,0.1)',
                              transition: 'all var(--transition-base)',
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                      {wizardGrupos.map((g, idx) => (
                        <div
                          key={`wiz-grp-${rolWizardSeleccionado.nombre}-${idx}`}
                          style={{
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            padding: '9px',
                            background: 'rgba(13,15,18,0.78)',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                          className={`animate-fade-up stagger-${Math.min(idx + 1, 6)}`}
                        >
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                            Grupo: {g.grupo} ({g.modulo})
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Submodulos que puede ver: {g.submodulos.join(', ')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Que puede eliminar: {g.puede_eliminar.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-base)',
                    padding: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Firmante esperado</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {nombreFirmante || 'Sin usuario en sesión'}
                  </div>
                </div>

                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.04em',
                  }}
                >
                  FIRMA DIGITAL - ESCRIBE TU NOMBRE COMPLETO
                </label>

                <input
                  value={nuevoUsuario.firma_creador}
                  onChange={(e) => setNuevoUsuario((p) => ({ ...p, firma_creador: e.target.value }))}
                  placeholder="Nombre Apellido"
                  style={{
                    ...fieldStyle,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setNuevoUsuario((p) => ({ ...p, firma_creador: nombreFirmante }))}
                  className="btn-ghost"
                  style={{ justifySelf: 'start', fontSize: '0.72rem', padding: '6px 10px' }}
                >
                  Usar nombre de sesión
                </button>

                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Puedes escribir tu firma digital como en Autogestión HSE. Para mayor rapidez, usa tu nombre de sesión.
                </p>
              </div>
            )}

            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={handlePrevStep}
                disabled={wizardStep === 1}
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', opacity: wizardStep === 1 ? 0.45 : 1 }}
              >
                <ChevronLeft size={12} />
                Anterior
              </button>

              {wizardStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  Siguiente
                  <ChevronRight size={12} />
                </button>
              ) : (
                <button
                  onClick={handleCrearUsuarioFinal}
                  disabled={savingUser}
                  className="btn-primary"
                  style={{ opacity: savingUser ? 0.75 : 1 }}
                >
                  {savingUser ? 'Creando usuario...' : 'Crear usuario con trazabilidad'}
                </button>
              )}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: '14px' }}>
            <h4 style={{ margin: 0, marginBottom: '10px', color: 'var(--text-primary)', fontSize: '0.84rem' }}>Resumen de roles</h4>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '70vh', overflowY: 'auto' }}>
              {roles.map((r) => (
                <div key={r.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      ...badgeColor(r.color),
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {r.nombre}
                  </span>
                  <p style={{ margin: '7px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {vistaActiva === 'roles' && (
        <div className="animate-fade-up stagger-2" style={{ ...panelStyle, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Catálogo de roles</h3>
            <button
              onClick={() => setVistaActiva('inicio')}
              className="btn-ghost"
              style={{ fontSize: '0.75rem' }}
            >
              Volver
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
            {roles.map((r) => (
              <div key={r.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '10px', display: 'grid', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    ...badgeColor(r.color),
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {r.nombre}
                </span>
                <p style={{ margin: '8px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.descripcion}</p>

                <div>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Modulos / submodulos visibles</div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {(r.grupos ?? []).map((g, idx) => (
                      <div key={`cat-grp-${r.id}-${idx}`} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {g.grupo} ({g.modulo}): {g.submodulos.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Que puede eliminar</div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {(r.grupos ?? []).map((g, idx) => (
                      <div key={`cat-del-${r.id}-${idx}`} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {g.grupo}: {g.puede_eliminar.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vistaActiva === 'usuarios' && (
        <div className="animate-fade-up stagger-2" style={{ ...panelStyle, overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCog size={14} color="#3B82F6" />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Usuarios del sistema ({usuariosFiltrados.length})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar por nombre o email"
                style={{ ...fieldStyle, width: '290px', maxWidth: '100%' }}
              />
              <button
                onClick={() => setVistaActiva('inicio')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem' }}
              >
                Volver
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '30px 16px', color: 'var(--text-muted)' }}>Cargando usuarios...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ padding: '30px 16px', color: 'var(--text-muted)' }}>No hay usuarios para mostrar.</div>
          ) : (
            <div style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {usuariosFiltrados.map((u, idx) => {
                const tieneRol = (rol: RolNombre) => u.roles.some((x) => x.nombre === rol)
                return (
                  <div
                    key={u.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: idx < usuariosFiltrados.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      display: 'grid',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>{u.nombre_completo}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {u.numero || 'Sin número'} · {u.direccion || 'Sin dirección'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleActivo(u)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${u.activo ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          background: u.activo ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: u.activo ? 'var(--danger-400)' : 'var(--success-400)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {u.activo ? <UserX size={12} /> : <Check size={12} />}
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {u.roles.length === 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sin roles asignados</span>
                      )}
                      {u.roles.map((r) => {
                        const meta = roles.find((x) => x.nombre === r.nombre)
                        const color = meta?.color ?? '#6B7280'
                        return (
                          <span
                            key={`${u.id}-${r.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              ...badgeColor(color),
                            }}
                          >
                            {r.nombre}
                            {r.nombre !== 'ADMIN_GLOBAL' && (
                              <button
                                onClick={() => handleQuitarRol(u, r.nombre)}
                                style={{ border: 'none', background: 'transparent', color: 'inherit', display: 'inline-flex', alignItems: 'center', padding: 0, margin: 0, cursor: 'pointer' }}
                                title={`Quitar rol ${r.nombre}`}
                              >
                                <X size={11} />
                              </button>
                            )}
                          </span>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={rolSeleccionado[u.id] ?? ''}
                        onChange={(e) => setRolSeleccionado((prev) => ({ ...prev, [u.id]: e.target.value as RolNombre | '' }))}
                        style={{ ...fieldStyle, padding: '6px 10px', fontSize: '0.76rem' }}
                      >
                        <option value="">Seleccionar rol...</option>
                        {roles
                          .filter((r) => !tieneRol(r.nombre as RolNombre))
                          .map((r) => (
                            <option key={`${u.id}-${r.id}`} value={r.nombre}>{r.nombre}</option>
                          ))}
                      </select>

                      <button
                        onClick={() => handleAsignarRol(u)}
                        className="btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
                      >
                        <Plus size={12} />
                        Asignar rol
                      </button>
                    </div>

                    {/* ── Permisos granulares desde BD ─────────────────── */}
                    {editandoPermisos === u.id ? (
                      <div
                        style={{
                          border: '1px solid rgba(99,102,241,0.4)',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(99,102,241,0.07)',
                          padding: '10px',
                          display: 'grid',
                          gap: '8px',
                        }}
                      >
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          Editando permisos de {u.nombre_completo}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {PERMISOS_BD_LABELS.map(({ key, label }) => {
                            const active = permisosEnEdicion[key]
                            return (
                              <label
                                key={key}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '5px 10px',
                                  borderRadius: '999px',
                                  border: `1px solid ${active ? 'rgba(99,102,241,0.5)' : 'var(--border-subtle)'}`,
                                  background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
                                  cursor: 'pointer',
                                  fontSize: '0.73rem',
                                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={(e) =>
                                    setPermisosEnEdicion((p) => ({ ...p, [key]: e.target.checked }))
                                  }
                                  style={{ accentColor: '#6366F1', cursor: 'pointer' }}
                                />
                                {label}
                              </label>
                            )
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleGuardarPermisos(u)}
                            disabled={savingPermisos}
                            className="btn-primary"
                            style={{ fontSize: '0.73rem', padding: '5px 12px', opacity: savingPermisos ? 0.7 : 1 }}
                          >
                            {savingPermisos ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditandoPermisos(null)}
                            className="btn-ghost"
                            style={{ fontSize: '0.73rem', padding: '5px 10px' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Lock size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Permisos:</span>
                        {PERMISOS_BD_LABELS.map(({ key, label }) => {
                          const active = u.permisos[key]
                          return (
                            <span
                              key={key}
                              style={{
                                fontSize: '0.67rem',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'var(--border-subtle)'}`,
                                color: active ? '#818CF8' : 'var(--text-muted)',
                                background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {label}
                            </span>
                          )
                        })}
                        {!tieneRol('ADMIN_GLOBAL') && (
                          <button
                            onClick={() => handleAbrirEditarPermisos(u)}
                            className="btn-ghost"
                            style={{ fontSize: '0.7rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <PenSquare size={10} />
                            Editar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {vistaActiva === 'auditoria' && (
        <div className="animate-fade-up stagger-2" style={{ ...panelStyle, overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="#8B5CF6" />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Registro de auditoría ({auditoria.length})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={filtroAccion}
                onChange={(e) => {
                  setFiltroAccion(e.target.value)
                  cargarAuditoria(e.target.value || undefined)
                }}
                style={{ ...fieldStyle, padding: '6px 10px', fontSize: '0.76rem' }}
              >
                <option value="">Todas las acciones</option>
                {Object.entries(ACCIONES_AUDITORIA).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => cargarAuditoria(filtroAccion || undefined)}
                className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
              >
                <RefreshCw size={12} />
                Recargar
              </button>
              <button
                onClick={() => setVistaActiva('inicio')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem' }}
              >
                Volver
              </button>
            </div>
          </div>

          {loadingAuditoria ? (
            <div style={{ padding: '30px 16px', color: 'var(--text-muted)' }}>Cargando auditoría...</div>
          ) : auditoria.length === 0 ? (
            <div style={{ padding: '30px 16px', color: 'var(--text-muted)' }}>No hay registros de auditoría.</div>
          ) : (
            <div style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {auditoria.map((log, idx) => (
                <div
                  key={log.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: idx < auditoria.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'grid',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: 'rgba(139,92,246,0.15)',
                        border: '1px solid rgba(139,92,246,0.35)',
                        color: '#A78BFA',
                      }}
                    >
                      {ACCIONES_AUDITORIA[log.accion] ?? log.accion}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {log.actor_nombre}
                    </span>
                    <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                      {log.fecha ? new Date(log.fecha).toLocaleString('es-CO') : '—'}
                    </span>
                  </div>
                  {log.descripcion && (
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>
                      {log.descripcion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}