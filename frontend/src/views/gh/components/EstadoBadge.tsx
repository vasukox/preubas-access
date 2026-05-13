import type { GhEstadoCita } from '@/types/gh'

const CONFIG: Record<GhEstadoCita, { label: string; color: string; bg: string; dot: string }> = {
  PROGRAMADA:  { label: 'Programada',  color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',  dot: '#0ea5e9' },
  CONFIRMADA:  { label: 'Confirmada',  color: '#10b981', bg: 'rgba(40,149,108,0.1)',  dot: '#10b981' },
  EN_CURSO:    { label: 'En curso',    color: '#6366f1', bg: 'rgba(86,104,184,0.1)',  dot: '#6366f1' },
  FINALIZADA:  { label: 'Finalizada',  color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   dot: '#16a34a' },
  NO_ASISTIO:  { label: 'No asistió',  color: '#f59e0b', bg: 'rgba(69,116,196,0.1)',  dot: '#f59e0b' },
  CANCELADA:   { label: 'Cancelada',   color: '#ef4444', bg: 'rgba(192,80,80,0.1)',   dot: '#ef4444' },
}

export function EstadoBadge({ estado }: { estado: GhEstadoCita }) {
  const cfg = CONFIG[estado]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: 999,
        border: `1px solid ${cfg.color}44`,
        background: cfg.bg,
        color: cfg.color,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.25s ease',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
          boxShadow: estado === 'EN_CURSO' ? `0 0 6px ${cfg.dot}` : undefined,
        }}
      />
      {cfg.label}
    </span>
  )
}

