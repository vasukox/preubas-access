/**
 * KOAJ Access v2.0 — Layout de Configuración
 * Wrapper general que contiene la cabecera dinámica
 * y el renderizado interno administrado por React-Router con <Outlet>.
 */
import { useLocation, Outlet } from 'react-router-dom'

type ConfigRoute = 'sistema' | 'estructura' | 'catalogos' | 'normas' | 'tiempos' | 'usuarios' | 'auditoria' | 'proveedores'

const ROUTE_META: Record<ConfigRoute, { title: string; subtitle: string; accent: string; area: string }> = {
  sistema:      { title: 'Parámetros globales',             subtitle: 'Variables de entorno y seguridad del sistema (solo lectura).',             accent: 'var(--info-400)', area: 'INFRAESTRUCTURA' },
  estructura:   { title: 'Sedes y Ubicaciones',             subtitle: 'Gestiona la jerarquía física: sedes operativas y sus zonas internas.',      accent: '#28956C', area: 'INFRAESTRUCTURA' },
  catalogos:    { title: 'Catálogos HSE',                   subtitle: 'Administra las entidades base: EPS, ARL y AFP vinculadas a autorizaciones.', accent: '#4574C4', area: 'REGLAS HSE' },
  normas:       { title: 'Normas de seguridad',             subtitle: 'Configura las normas HSE del flujo de autorización.',                       accent: '#4574C4', area: 'REGLAS HSE' },
  tiempos:      { title: 'Tiempos por tipo de contratista', subtitle: 'Parámetros de duración y requisitos según el tipo de contratista (Normal, Alto Riesgo, Excepción).', accent: '#D4860A', area: 'REGLAS HSE' },
  proveedores:  { title: 'Proveedores HSE',                 subtitle: 'Gestión de empresas contratistas: creación, edición y estado activo.',      accent: '#28956C', area: 'REGLAS HSE' },
  usuarios:     { title: 'Usuarios del sistema',            subtitle: 'Listado global de cuentas con acceso al aplicativo (login).', accent: '#C05050', area: 'GOBIERNO' },
  auditoria:    { title: 'Auditoría',                       subtitle: 'Registro de cambios y acciones realizadas por los usuarios.', accent: '#C05050', area: 'GOBIERNO' },
}

function pathToRoute(pathname: string): ConfigRoute {
  if (pathname.includes('/config/usuarios'))    return 'usuarios'
  if (pathname.includes('/config/auditoria'))   return 'auditoria'
  if (pathname.includes('/config/estructura'))  return 'estructura'
  if (pathname.includes('/config/catalogos'))   return 'catalogos'
  if (pathname.includes('/config/normas'))      return 'normas'
  if (pathname.includes('/config/tiempos'))     return 'tiempos'
  if (pathname.includes('/config/proveedores')) return 'proveedores'
  return 'sistema'
}

export default function ConfigLayout() {
  const { pathname } = useLocation()
  const route = pathToRoute(pathname)
  const meta  = ROUTE_META[route]

  return (
    <div style={{ display: 'grid', gap: '16px' }}>

      {/* ── Cabecera con acento cromático ────────────────────── */}
      <div style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding:      '18px 22px',
        display:      'flex',
        alignItems:   'center',
        gap:          '16px',
        boxShadow:    'var(--shadow-card)',
      }}>
        {/* Barra de acento */}
        <div style={{
          width: '4px', height: '44px', flexShrink: 0,
          borderRadius: '4px',
          background: `linear-gradient(180deg, ${meta.accent} 0%, ${meta.accent}99 100%)`,
          boxShadow: `2px 0 12px ${meta.accent}40`,
        }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {meta.title}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {meta.subtitle}
          </p>
        </div>
        <span style={{
          fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          padding: '4px 11px', borderRadius: '999px',
          background: `${meta.accent}14`,
          border: `1px solid ${meta.accent}38`,
          color: meta.accent, letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}>
          {meta.area}
        </span>
      </div>

      {/* ── Contenido inyectado por React-Router (Rutas Hijas) ── */}
      <div style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding:      '24px',
        boxShadow:    'var(--shadow-card)',
      }} className="animate-fade-up">
        {/* Aquí se montan ConfigSistema, ConfigEstructura, etc. */}
        <Outlet />
      </div>

    </div>
  )
}

