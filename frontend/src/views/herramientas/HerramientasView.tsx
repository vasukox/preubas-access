import { useEffect, useState } from 'react'
import { Clock, Plus, RefreshCw, Shield, UserCheck, UserCog } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { RolSistema, UsuarioSistema } from '@/services/herramientas.service'
import { herramientasService } from '@/services/herramientas.service'
import { type VistaHerramientas } from './constants'
import { RolesPanel } from './components/RolesPanel'
import { AuditoriaPanel } from './components/AuditoriaPanel'
import { UsuariosPanel } from './components/UsuariosPanel'
import { CrearUsuarioWizard } from './components/CrearUsuarioWizard'

export default function HerramientasView() {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [roles, setRoles] = useState<RolSistema[]>([])
  const [vistaActiva, setVistaActiva] = useState<VistaHerramientas>('inicio')

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

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
  }

  const usuariosActivos = usuarios.filter((u) => u.activo).length
  const usuariosInactivos = usuarios.length - usuariosActivos

  return (
    <div style={{ padding: '32px', maxWidth: '1240px' }}>
      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={15} color="var(--primary-500)" />
          <span
            style={{
              fontSize: '0.76rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
            }}
          >
            Módulo de herramientas
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.62rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              Centro de administración
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Gestiona usuarios, roles y trazabilidad de accesos del sistema.
            </p>
          </div>
          <button
            onClick={cargarTodo}
            className="btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} />
            Recargar
          </button>
        </div>
      </div>

      {/* ── Métricas ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
        className="animate-fade-up stagger-1"
      >
        {[
          { label: 'Usuarios', value: usuarios.length, color: 'var(--text-primary)' },
          { label: 'Activos', value: usuariosActivos, color: 'var(--success-500)' },
          { label: 'Inactivos', value: usuariosInactivos, color: 'var(--danger-500)' },
          { label: 'Roles', value: roles.length, color: 'var(--primary-500)' },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              ...panelStyle,
              padding: '14px 18px',
              background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-raised) 100%)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '1.48rem', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Vista: inicio ────────────────────────────────────────────────── */}
      {vistaActiva === 'inicio' && (
        <div
          className="animate-fade-up stagger-2"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
          }}
        >
          {[
            {
              icon: <Plus size={16} color="var(--success-400)" />,
              title: 'Crear usuario',
              desc: 'Flujo guiado por pasos: datos, rol, permisos y firma digital.',
              onClick: () => setVistaActiva('crear'),
            },
            {
              icon: <UserCog size={16} color="var(--primary-400)" />,
              title: 'Gestionar usuarios',
              desc: 'Activa, desactiva y administra roles de usuarios existentes.',
              onClick: () => setVistaActiva('usuarios'),
            },
            {
              icon: <UserCheck size={16} color="var(--text-secondary)" />,
              title: 'Catálogo de roles',
              desc: 'Consulta los roles y el alcance operativo definido para cada uno.',
              onClick: () => setVistaActiva('roles'),
            },
            {
              icon: <Clock size={16} color="var(--text-secondary)" />,
              title: 'Registro de auditoría',
              desc: 'Historial completo de cambios: usuarios, roles y permisos.',
              onClick: () => setVistaActiva('auditoria'),
            },
          ].map((card) => (
            <button
              key={card.title}
              onClick={card.onClick}
              style={{
                ...panelStyle,
                textAlign: 'left',
                padding: '18px',
                cursor: 'pointer',
                background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-raised) 100%)',
                transition: 'border-color var(--transition-fast), transform var(--transition-fast), background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.background =
                  'linear-gradient(180deg, var(--bg-raised) 0%, var(--bg-surface) 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background =
                  'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-raised) 100%)'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-default)',
                  marginBottom: '12px',
                }}
              >
                {card.icon}
              </div>
              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.77rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                {card.desc}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ── Delegación de Vistas a Componentes ───────────────────────────── */}
      {vistaActiva === 'crear' && (
        <CrearUsuarioWizard 
          roles={roles} 
          setVistaActiva={setVistaActiva} 
          onUserCreated={cargarTodo} 
        />
      )}

      {vistaActiva === 'roles' && <RolesPanel roles={roles} setVistaActiva={setVistaActiva} />}

      {vistaActiva === 'auditoria' && <AuditoriaPanel setVistaActiva={setVistaActiva} />}

      {vistaActiva === 'usuarios' && (
        <UsuariosPanel
          usuarios={usuarios}
          roles={roles}
          loading={loading}
          setVistaActiva={setVistaActiva}
          setUsuarios={setUsuarios}
        />
      )}
    </div>
  )
}
