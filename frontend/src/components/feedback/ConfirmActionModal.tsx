type ConfirmActionModalProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}

export function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmActionModalProps) {
  if (!open) return null

  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        background: 'rgba(15, 23, 42, 0.60)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex:     2200,
        padding:    '24px',
        backdropFilter:       'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        animation:  'overlay-in 0.2s ease both',
      }}
    >
      <div
        className="modal-enter"
        style={{
          width:        '100%',
          maxWidth:     '460px',
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow:    'var(--shadow-xl)',
          overflow:     'hidden',
        }}
      >
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
            {message}
          </p>
          {children && (
            <div style={{ marginTop: '14px' }}>
              {children}
            </div>
          )}
        </div>

        <div
          style={{
            padding:         '14px 22px',
            borderTop:       '1px solid var(--border-subtle)',
            display:         'flex',
            justifyContent:  'flex-end',
            gap:             '8px',
            background:      'var(--bg-raised)',
          }}
        >
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            style={{ minWidth: '132px', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Procesando...
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
