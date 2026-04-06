import { BarChart3 } from 'lucide-react'

export default function ReportesView() {
  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <BarChart3 size={16} color="var(--primary-400)" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.11em',
            color: 'var(--primary-400)',
          }}>
            MÓDULO REPORTES
          </span>
        </div>

        <h1 style={{ margin: 0, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '1.45rem' }}>
          Reportes del sistema
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Este módulo ya está habilitado por rol y quedará listo para integrar tableros y exportables.
        </p>
      </div>
    </div>
  )
}
