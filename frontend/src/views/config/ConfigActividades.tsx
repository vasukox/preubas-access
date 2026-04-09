import { Construction } from 'lucide-react'

export default function ConfigActividades() {
  const accent = '#EC4899'
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '16px',
      padding:        '48px 24px',
      textAlign:      'center',
    }}>
      <div style={{
        width:          '56px', height: '56px', borderRadius: '16px',
        background:     `${accent}15`,
        border:         `1px solid ${accent}44`,
        display:        'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Construction size={24} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Actividades HSE
        </div>
        <div style={{
          display: 'inline-block',
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
          padding: '3px 10px', borderRadius: '999px',
          background: `${accent}15`, border: `1px solid ${accent}44`,
          color: accent,
        }}>
          EN DESARROLLO
        </div>
        <p style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: 1.6 }}>
          Este sub-módulo está planificado para una próxima versión.
          Su funcionalidad está siendo evaluada.
        </p>
      </div>
    </div>
  )
}
