/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Topbar — barra superior del layout autenticado.
 * Responsabilidades:
 * - Título de la página actual
 * - Selector de sede activa
 * - Botón de alertas con badge de no leídas
 * - Avatar y nombre del usuario activo
 * - Botón menú mobile
 */

import { Bell, Menu, Building2, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { UsuarioMe, SedeBasica } from '@/types'

interface TopbarProps {
  usuario:        UsuarioMe | null
  noLeidas:       number
  paginaActual:   string | undefined
  onMenuClick:    () => void
  sedes:          SedeBasica[]
  sedeActiva:     SedeBasica | null
  onSedeChange:   (sede: SedeBasica) => void
}

function SedeSelectorDropdown({
  sedes,
  sedeActiva,
  onSedeChange,
}: {
  sedes:        SedeBasica[]
  sedeActiva:   SedeBasica | null
  onSedeChange: (sede: SedeBasica) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '6px',
          padding:        '6px 10px',
          background:     'var(--bg-elevated)',
          border:         '1px solid var(--border-default)',
          borderRadius:   'var(--radius-md)',
          color:          sedeActiva ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor:         'pointer',
          fontSize:       '0.78rem',
          fontWeight:     500,
          whiteSpace:     'nowrap',
          transition:     'all var(--transition-fast)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-400)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
      >
        <Building2 size={13} color="var(--primary-400)" />
        {sedeActiva ? sedeActiva.nombre : 'Seleccionar sede'}
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position:   'absolute',
          top:        'calc(100% + 6px)',
          left:       0,
          minWidth:   '200px',
          background: 'var(--bg-elevated)',
          border:     '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow:  'var(--shadow-lg)',
          zIndex:     200,
          overflow:   'hidden',
        }}>
          {sedes.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Sin sedes disponibles
            </div>
          )}
          {sedes.map(sede => (
            <button
              key={sede.id}
              onClick={() => { onSedeChange(sede); setOpen(false) }}
              style={{
                display:    'block',
                width:      '100%',
                textAlign:  'left',
                padding:    '9px 12px',
                background: sedeActiva?.id === sede.id ? 'rgba(245,158,11,0.1)' : 'transparent',
                border:     'none',
                color:      sedeActiva?.id === sede.id ? 'var(--primary-400)' : 'var(--text-secondary)',
                cursor:     'pointer',
                fontSize:   '0.78rem',
                fontWeight: sedeActiva?.id === sede.id ? 600 : 400,
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={e => { if (sedeActiva?.id !== sede.id) e.currentTarget.style.background = 'var(--bg-surface)' }}
              onMouseLeave={e => { if (sedeActiva?.id !== sede.id) e.currentTarget.style.background = 'transparent' }}
            >
              {sede.nombre}
              {sede.ciudad && (
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {sede.ciudad}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Topbar({ usuario, noLeidas, paginaActual, onMenuClick, sedes, sedeActiva, onSedeChange }: TopbarProps) {
  return (
    <header
      style={{
        height:       'var(--topbar-height)',
        background:   'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display:      'flex',
        alignItems:   'center',
        padding:      '0 24px',
        gap:          '16px',
        position:     'sticky',
        top:          0,
        zIndex:       50,
        flexShrink:   0,
      }}
    >
      {/* Botón menú mobile */}
      <button
        onClick={onMenuClick}
        style={{
          background:   'transparent',
          border:       'none',
          color:        'var(--text-muted)',
          cursor:       'pointer',
          display:      'none',
          padding:      '4px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <Menu size={20} />
      </button>

      {/* Título de la página */}
      <div style={{ flex: 1 }}>
        {paginaActual && (
          <h1
            style={{
              fontSize:      '0.95rem',
              fontWeight:    600,
              color:         'var(--text-primary)',
              letterSpacing: '0.01em',
              margin:        0,
            }}
          >
            {paginaActual}
          </h1>
        )}
      </div>

      {/* Selector de sede */}
      <SedeSelectorDropdown
        sedes={sedes}
        sedeActiva={sedeActiva}
        onSedeChange={onSedeChange}
      />

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Botón alertas */}
        <button
          style={{
            position:       'relative',
            background:     'transparent',
            border:         '1px solid var(--border-default)',
            borderRadius:   'var(--radius-md)',
            color:          'var(--text-secondary)',
            cursor:         'pointer',
            padding:        '7px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.color       = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.color       = 'var(--text-secondary)'
          }}
        >
          <Bell size={16} />
          {noLeidas > 0 && (
            <span
              style={{
                position:       'absolute',
                top:            '-5px',
                right:          '-5px',
                background:     'var(--danger-500)',
                color:          '#fff',
                fontSize:       '0.6rem',
                fontWeight:     700,
                width:          '16px',
                height:         '16px',
                borderRadius:   'var(--radius-full)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
            >
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }} />

        {/* Avatar usuario */}
        {usuario && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width:          '32px',
                height:         '32px',
                borderRadius:   'var(--radius-full)',
                background:     'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '0.75rem',
                fontWeight:     700,
                color:          'var(--text-inverted)',
                cursor:         'pointer',
                boxShadow:      'var(--shadow-glow-primary)',
              }}
            >
              {usuario.nombre_completo.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {usuario.nombre_completo.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {usuario.roles?.[0]?.nombre?.replace(/_/g, ' ') || 'Sin Rol'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}