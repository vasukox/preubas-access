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

import { Bell, Menu, Building2, ChevronDown, LogOut, X, CheckCheck, Archive, BellOff } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UsuarioMe, SedeBasica } from '@/types'
import type { ThemeMode } from '@/store/uiStore'
import { useNotificacionesStore } from '@/store'
import type { Notificacion } from '@/types/notificaciones'

interface TopbarProps {
  usuario:        UsuarioMe | null
  noLeidas:       number
  paginaActual:   string | undefined
  onMenuClick:    () => void
  themeMode:      ThemeMode
  onToggleTheme:  () => void
  sedes:          SedeBasica[]
  sedeActiva:     SedeBasica | null
  onSedeChange:   (sede: SedeBasica) => void
  onLogout:       () => void
  sedeIsLocked:   boolean   // true si el usuario tiene sede fija (vigilante)
}

function formatRelativo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} d`
}

function NotificacionesBell() {
  const conteo              = useNotificacionesStore(s => s.conteo)
  const notificaciones      = useNotificacionesStore(s => s.notificaciones)
  const cargando            = useNotificacionesStore(s => s.cargando)
  const fetchNotificaciones = useNotificacionesStore(s => s.fetchNotificaciones)
  const marcarLeida         = useNotificacionesStore(s => s.marcarLeida)
  const marcarTodas         = useNotificacionesStore(s => s.marcarTodas)

  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  // Inyectar keyframes CSS una sola vez
  useEffect(() => {
    if (document.getElementById('koaj-notif-styles')) return
    const s = document.createElement('style')
    s.id = 'koaj-notif-styles'
    s.textContent = `
      @keyframes bell-ring {
        0%,100%{transform:rotate(0deg)}
        10%{transform:rotate(-18deg)}
        25%{transform:rotate(16deg)}
        40%{transform:rotate(-12deg)}
        55%{transform:rotate(8deg)}
        70%{transform:rotate(-4deg)}
      }
      @keyframes badge-pop {
        0%{transform:scale(0)}
        70%{transform:scale(1.2)}
        100%{transform:scale(1)}
      }
      @keyframes notif-in {
        from{opacity:0;transform:translateY(4px)}
        to{opacity:1;transform:translateY(0)}
      }
      @keyframes shimmer-wave {
        0%{background-position:-300px 0}
        100%{background-position:300px 0}
      }
      .notif-item { transition: background 0.15s ease; }
      .notif-item:hover { background: var(--bg-raised) !important; }
    `
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleToggle() {
    setOpen(o => {
      if (!o) void fetchNotificaciones()
      return !o
    })
  }

  function handleClickNotif(n: Notificacion) {
    void marcarLeida(n.id)
    if (n.tipo === 'ARCHIVADO_PENDIENTE') {
      navigate('/hse/archivado')
      setOpen(false)
    }
  }

  // Meta por tipo de notificación
  function getNotifMeta(tipo: string) {
    if (tipo === 'ARCHIVADO_PENDIENTE') {
      return {
        Icon:   Archive,
        color:  '#d97706',
        bg:     'rgba(217,119,6,0.12)',
        accent: '#f59e0b',
        label:  'Ver cola',
      }
    }
    return {
      Icon:   Bell,
      color:  'var(--primary-500)',
      bg:     'rgba(15, 23, 42,0.1)',
      accent: 'var(--primary-400)',
      label:  null as string | null,
    }
  }

  const hayNoLeidas = notificaciones.some(n => !n.leida)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón bell */}
      <button
        onClick={handleToggle}
        title="Notificaciones"
        style={{
          position:        'relative',
          width:           '36px',
          height:          '36px',
          background:      open
            ? 'var(--primary-50)'
            : conteo > 0
              ? 'rgba(239,68,68,0.06)'
              : 'transparent',
          border:          `1px solid ${open
            ? 'var(--primary-300)'
            : conteo > 0
              ? 'var(--danger-200)'
              : 'var(--border-default)'}`,
          borderRadius:    'var(--radius-md)',
          color:           open
            ? 'var(--primary-600)'
            : conteo > 0
              ? 'var(--danger-500)'
              : 'var(--text-secondary)',
          cursor:          'pointer',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          transition:      'all 0.18s ease',
          flexShrink:      0,
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background    = 'var(--bg-elevated)'
            e.currentTarget.style.borderColor   = 'var(--border-strong)'
            e.currentTarget.style.color         = 'var(--text-primary)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background  = conteo > 0 ? 'rgba(239,68,68,0.06)' : 'transparent'
            e.currentTarget.style.borderColor = conteo > 0 ? 'var(--danger-200)' : 'var(--border-default)'
            e.currentTarget.style.color       = conteo > 0 ? 'var(--danger-500)' : 'var(--text-secondary)'
          }
        }}
      >
        <Bell
          size={15}
          style={{
            animation: conteo > 0 && !open
              ? 'bell-ring 1.2s ease 0.5s'
              : 'none',
            transformOrigin: 'top center',
          }}
        />

        {/* Badge contador */}
        {conteo > 0 && (
          <span
            style={{
              position:        'absolute',
              top:             '-5px',
              right:           '-5px',
              minWidth:        '17px',
              height:          '17px',
              padding:         '0 3px',
              background:      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color:           '#fff',
              fontSize:        '0.58rem',
              fontWeight:      700,
              borderRadius:    'var(--radius-full)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              boxShadow:       '0 2px 6px rgba(239,68,68,0.45)',
              animation:       'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              border:          '1.5px solid #fff',
              letterSpacing:   '-0.01em',
            }}
          >
            {conteo > 9 ? '9+' : conteo}
          </span>
        )}
      </button>

      {/* Panel dropdown */}
      <div
        style={{
          position:        'absolute',
          right:           0,
          top:             'calc(100% + 10px)',
          width:           '380px',
          background:      'rgba(255,255,255,0.97)',
          backdropFilter:  'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border:          '1px solid var(--border-default)',
          borderRadius:    'var(--radius-lg)',
          boxShadow:       '0 20px 60px -12px rgba(0,0,0,0.18), 0 8px 24px -4px rgba(0,0,0,0.06)',
          zIndex:          220,
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          opacity:         open ? 1 : 0,
          transform:       open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)',
          pointerEvents:   open ? 'auto' : 'none',
          transition:      'opacity 0.22s cubic-bezier(0.4,0,0.2,1), transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          transformOrigin: 'top right',
          maxHeight:       '480px',
        }}
      >
        {/* Línea de acento superior */}
        <div style={{
          height:     '3px',
          background: 'var(--gradient-primary)',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 16px 12px',
          borderBottom:   '1px solid var(--border-subtle)',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize:      '0.85rem',
              fontWeight:    700,
              color:         'var(--text-primary)',
              letterSpacing: '0.01em',
            }}>
              Notificaciones
            </span>
            {conteo > 0 && (
              <span style={{
                background:   'var(--primary-100)',
                color:        'var(--primary-700)',
                fontSize:     '0.65rem',
                fontWeight:   700,
                padding:      '1px 6px',
                borderRadius: 'var(--radius-full)',
              }}>
                {conteo} nueva{conteo !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {hayNoLeidas && (
              <button
                onClick={() => void marcarTodas()}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '4px',
                  background:   'transparent',
                  border:       '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  color:        'var(--text-muted)',
                  cursor:       'pointer',
                  padding:      '4px 8px',
                  fontSize:     '0.7rem',
                  fontWeight:   500,
                  transition:   'all 0.15s ease',
                  whiteSpace:   'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary-300)'
                  e.currentTarget.style.color       = 'var(--primary-600)'
                  e.currentTarget.style.background  = 'var(--primary-50)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.color       = 'var(--text-muted)'
                  e.currentTarget.style.background  = 'transparent'
                }}
              >
                <CheckCheck size={11} />
                Leer todas
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                width:          '26px',
                height:         '26px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'transparent',
                border:         'none',
                borderRadius:   'var(--radius-sm)',
                color:          'var(--text-muted)',
                cursor:         'pointer',
                transition:     'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-raised)'
                e.currentTarget.style.color      = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color      = 'var(--text-muted)'
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Cargando — skeletons */}
          {cargando && (
            <div style={{ padding: '8px' }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    display:      'flex',
                    gap:          '12px',
                    padding:      '12px',
                    marginBottom: '4px',
                    borderRadius: 'var(--radius-md)',
                    alignItems:   'flex-start',
                  }}
                >
                  <div style={{
                    width:          '36px',
                    height:         '36px',
                    borderRadius:   'var(--radius-md)',
                    flexShrink:     0,
                    background:     'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-elevated) 50%, var(--bg-raised) 75%)',
                    backgroundSize: '300px 100%',
                    animation:      'shimmer-wave 1.4s infinite ease',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height:         '11px',
                      borderRadius:   '4px',
                      marginBottom:   '8px',
                      width:          '65%',
                      background:     'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-elevated) 50%, var(--bg-raised) 75%)',
                      backgroundSize: '300px 100%',
                      animation:      'shimmer-wave 1.4s infinite ease',
                    }} />
                    <div style={{
                      height:         '9px',
                      borderRadius:   '4px',
                      width:          '90%',
                      background:     'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-elevated) 50%, var(--bg-raised) 75%)',
                      backgroundSize: '300px 100%',
                      animation:      `shimmer-wave 1.4s ${i * 0.15}s infinite ease`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vacío */}
          {!cargando && notificaciones.length === 0 && (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        '44px 20px',
              gap:            '12px',
            }}>
              <div style={{
                width:          '52px',
                height:         '52px',
                borderRadius:   'var(--radius-lg)',
                background:     'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-elevated) 100%)',
                border:         '1px solid var(--border-subtle)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                <BellOff size={22} color="var(--text-muted)" strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Al dia
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  No tienes notificaciones pendientes
                </div>
              </div>
            </div>
          )}

          {/* Lista de notificaciones */}
          {!cargando && notificaciones.length > 0 && (
            <div style={{ padding: '8px' }}>
              {notificaciones.map((n, idx) => {
                const meta = getNotifMeta(n.tipo)
                const { Icon } = meta
                return (
                  <div
                    key={n.id}
                    className="notif-item"
                    onClick={() => handleClickNotif(n)}
                    style={{
                      display:      'flex',
                      gap:          '12px',
                      padding:      '12px',
                      borderRadius: 'var(--radius-md)',
                      cursor:       meta.label ? 'pointer' : 'default',
                      background:   'transparent',
                      marginBottom: '2px',
                      animation:    `notif-in 0.28s ease ${idx * 0.06}s both`,
                      borderLeft:   `3px solid ${meta.accent}`,
                      paddingLeft:  '10px',
                    }}
                  >
                    {/* Icono tipo */}
                    <div style={{
                      width:          '36px',
                      height:         '36px',
                      borderRadius:   'var(--radius-md)',
                      background:     meta.bg,
                      border:         `1px solid ${meta.accent}30`,
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      flexShrink:     0,
                    }}>
                      <Icon size={16} color={meta.color} strokeWidth={2} />
                    </div>

                    {/* Contenido */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize:     '0.78rem',
                        fontWeight:   600,
                        color:        'var(--text-primary)',
                        marginBottom: '3px',
                        lineHeight:   1.3,
                      }}>
                        {n.titulo}
                      </div>
                      <div style={{
                        fontSize:        '0.71rem',
                        color:           'var(--text-secondary)',
                        lineHeight:      1.45,
                        display:         '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow:        'hidden',
                        marginBottom:    '6px',
                      }}>
                        {n.mensaje}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatRelativo(n.created_at)}
                        </span>
                        {meta.label && (
                          <span style={{
                            fontSize:   '0.65rem',
                            fontWeight: 600,
                            color:      meta.color,
                            display:    'flex',
                            alignItems: 'center',
                            gap:        '2px',
                          }}>
                            {meta.label} &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer solo si hay items */}
        {!cargando && notificaciones.length > 0 && (
          <div style={{
            padding:        '10px 16px',
            borderTop:      '1px solid var(--border-subtle)',
            flexShrink:     0,
            background:     'var(--bg-surface)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Haz clic en una notificacion para marcarla como leida
            </span>
          </div>
        )}
      </div>
    </div>
  )
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
                background: sedeActiva?.id === sede.id ? 'var(--primary-50)' : 'transparent',
                border:     'none',
                color:      sedeActiva?.id === sede.id ? 'var(--primary-600)' : 'var(--text-secondary)',
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

function UserMenuDropdown({
  usuario,
  onLogout,
}: {
  usuario: UsuarioMe | null
  onLogout: () => void
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

  if (!usuario) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          background:     open ? 'var(--bg-elevated)' : 'transparent',
          border:         `1px solid ${open ? 'var(--border-strong)' : 'transparent'}`,
          borderRadius:   'var(--radius-md)',
          color:          'var(--text-secondary)',
          cursor:         'pointer',
          padding:        '4px 8px 4px 4px',
          transition:     'all var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'var(--bg-elevated)'
            e.currentTarget.style.borderColor = 'var(--border-default)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }
        }}
      >
        <div
          style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   'var(--radius-full)',
            background:     'var(--gradient-brand)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '0.875rem',
            fontWeight:     700,
            color:          '#FFFFFF',
            flexShrink:     0,
            boxShadow:      '0 2px 8px rgba(15, 23, 42, 0.25)',
          }}
        >
          {usuario.nombre_completo.charAt(0).toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {usuario.nombre_completo.split(' ')[0]}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {usuario.roles?.[0]?.nombre?.replace(/_/g, ' ') || 'Sin Rol'}
          </span>
        </div>
        <ChevronDown
          size={13}
          style={{
            opacity:    0.65,
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        />
      </button>

      <div
        style={{
          position:      'absolute',
          right:         0,
          top:           'calc(100% + 8px)',
          width:         '240px',
          background:    'var(--bg-elevated)',
          border:        '1px solid var(--border-default)',
          borderRadius:  'var(--radius-lg)',
          boxShadow:     'var(--shadow-lg)',
          overflow:      'hidden',
          zIndex:        210,
          opacity:       open ? 1 : 0,
          transform:     open ? 'translateY(0px) scale(1)' : 'translateY(-6px) scale(0.98)',
          pointerEvents: open ? 'auto' : 'none',
          transition:    'opacity 0.18s ease, transform 0.18s ease',
          transformOrigin: 'top right',
          backdropFilter:  'blur(8px)',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {usuario.nombre_completo}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            {usuario.roles?.[0]?.nombre?.replace(/_/g, ' ') || 'SIN ROL'}
          </div>
        </div>

        <div style={{ padding: '8px' }}>
          <button
            onClick={onLogout}
            style={{
              width:          '100%',
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              border:         '1px solid transparent',
              background:     'transparent',
              color:          'var(--text-secondary)',
              borderRadius:   'var(--radius-md)',
              padding:        '9px 10px',
              cursor:         'pointer',
              transition:     'all var(--transition-fast)',
              fontSize:       '0.8rem',
              fontWeight:     500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger-50)'
              e.currentTarget.style.color = 'var(--danger-600)'
              e.currentTarget.style.borderColor = 'var(--danger-200)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export function Topbar({ usuario, noLeidas: _noLeidas, paginaActual, onMenuClick, themeMode: _themeMode, onToggleTheme: _onToggleTheme, sedes, sedeActiva, onSedeChange, onLogout, sedeIsLocked }: TopbarProps) {
  return (
    <header
      style={{
        height:               'var(--topbar-height)',
        background:           'rgba(255, 255, 255, 0.92)',
        backdropFilter:       'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        borderBottom:         '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow:            '0 1px 0 rgba(226,232,240,0.6), 0 4px 24px -4px rgba(0,0,0,0.04)',
        display:              'flex',
        alignItems:           'center',
        padding:              '0 24px',
        gap:                  '16px',
        position:             'sticky',
        top:                  0,
        zIndex:               50,
        flexShrink:           0,
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
      {sedeIsLocked ? (
        // Badge fijo para vigilantes — no pueden cambiarlo
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '6px 10px',
          background:   'var(--primary-50)',
          border:       '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-md)',
          fontSize:     '0.78rem',
          fontWeight:   600,
          color:        'var(--primary-600)',
          whiteSpace:   'nowrap',
        }}>
          <Building2 size={13} />
          {sedeActiva?.nombre ?? 'Sede asignada'}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: '999px', marginLeft: '2px' }}>
            fija
          </span>
        </div>
      ) : (
        <SedeSelectorDropdown
          sedes={sedes}
          sedeActiva={sedeActiva}
          onSedeChange={onSedeChange}
        />
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>



        <NotificacionesBell />

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--border-default)' }} />

        <UserMenuDropdown usuario={usuario} onLogout={onLogout} />
      </div>
    </header>
  )
}
