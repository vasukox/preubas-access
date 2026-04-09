/**
 * KOAJ Access v2.0 — Layout de Configuración
 * Wrapper general que contiene la cabecera dinámica
 * y el renderizado interno administrado por React-Router con <Outlet>.
 */
import { useLocation, Outlet } from 'react-router-dom'

type ConfigRoute = 'sistema' | 'estructura' | 'catalogos' | 'normas' | 'actividades'

const ROUTE_META: Record<ConfigRoute, { title: string; subtitle: string; accent: string; area: string }> = {
  sistema:     { title: 'Parámetros globales',  subtitle: 'Variables de entorno y seguridad del sistema (solo lectura).',             accent: '#6366F1', area: 'SISTEMA'    },
  estructura:  { title: 'Sedes y Ubicaciones',  subtitle: 'Gestiona la jerarquía física: sedes operativas y sus zonas internas.',      accent: '#10B981', area: 'ESTRUCTURA' },
  catalogos:   { title: 'Catálogos HSE',        subtitle: 'Administra las entidades base: EPS, ARL y AFP vinculadas a autorizaciones.', accent: '#F59E0B', area: 'REGLAS HSE' },
  normas:      { title: 'Normas de seguridad',  subtitle: 'Configura las normas HSE del flujo de autorización.',                       accent: '#F59E0B', area: 'REGLAS HSE' },
  actividades: { title: 'Actividades HSE',      subtitle: 'Gestión de actividades y clasificaciones operativas del módulo HSE.',         accent: '#EC4899', area: 'REGLAS HSE' },
}

function pathToRoute(pathname: string): ConfigRoute {
  if (pathname.includes('/config/estructura'))  return 'estructura'
  if (pathname.includes('/config/catalogos'))   return 'catalogos'
  if (pathname.includes('/config/normas'))      return 'normas'
  if (pathname.includes('/config/actividades')) return 'actividades'
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
        padding:      '16px 20px',
        display:      'flex',
        alignItems:   'center',
        gap:          '14px',
        boxShadow:    'var(--shadow-sm)',
      }}>
        {/* Barra de acento */}
        <div style={{
          width: '4px', height: '40px', flexShrink: 0,
          borderRadius: '3px',
          background: meta.accent,
          boxShadow: `0 0 12px ${meta.accent}55`,
        }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {meta.title}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {meta.subtitle}
          </p>
        </div>
        <span style={{
          fontSize: '0.67rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
          padding: '4px 10px', borderRadius: '999px',
          background: `${meta.accent}18`,
          border: `1px solid ${meta.accent}44`,
          color: meta.accent, letterSpacing: '0.06em',
        }}>
          {meta.area}
        </span>
      </div>

      {/* ── Contenido inyectado por React-Router (Rutas Hijas) ── */}
      <div style={{
        background:   'var(--bg-surface)',
        border:       '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding:      '20px',
        boxShadow:    'var(--shadow-sm)',
      }} className="animate-fade-up">
        {/* Aquí se montan ConfigSistema, ConfigEstructura, etc. */}
        <Outlet />
      </div>

    </div>
  )
}
