import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onNext: () => void
  onPrev: () => void
  onGoTo: (page: number) => void
  totalItems: number
}

export function Pagination({ currentPage, totalPages, onNext, onPrev, onGoTo, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null

  // Mostrar un máximo de 5 páginas. Si hay más, agregamos puntos suspensivos o logica simple.
  // Para simplificar, mostraremos hasta 5 botones:
  // prev [1] [2] [3] [4] [5] next
  const getPagesToShow = () => {
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + 4)
    if (end - start < 4) {
      start = Math.max(1, end - 4)
    }
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const navBtnBase: CSSProperties = {
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    width:           '30px',
    height:          '30px',
    borderRadius:    'var(--radius-md)',
    border:          '1px solid var(--border-subtle)',
    background:      'var(--bg-surface)',
    cursor:          'pointer',
    transition:      'all var(--transition-fast)',
    color:           'var(--text-secondary)',
    flexShrink:      0,
  }

  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '10px 16px',
      borderTop:       '1px solid var(--border-subtle)',
      background:      'var(--bg-raised)',
      borderRadius:    '0 0 var(--radius-xl) var(--radius-xl)',
      gap:             '12px',
    }}>
      <div style={{
        color:       'var(--text-muted)',
        fontSize:    '0.73rem',
        fontFamily:  'var(--font-ui)',
        whiteSpace:  'nowrap',
      }}>
        {totalItems.toLocaleString('es-CO')} {totalItems === 1 ? 'registro' : 'registros'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          style={{
            ...navBtnBase,
            opacity: currentPage === 1 ? 0.38 : 1,
            cursor:  currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (currentPage !== 1) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          <ChevronLeft size={15} />
        </button>

        {getPagesToShow().map(p => (
          <button
            key={p}
            onClick={() => onGoTo(p)}
            style={{
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              minWidth:     '30px',
              height:       '30px',
              borderRadius: 'var(--radius-md)',
              padding:      '0 6px',
              border:       p === currentPage ? '1px solid var(--primary-300)' : '1px solid transparent',
              background:   p === currentPage
                ? 'var(--gradient-primary)'
                : 'transparent',
              color:        p === currentPage ? '#FFFFFF' : 'var(--text-secondary)',
              fontSize:     '0.75rem',
              fontWeight:   p === currentPage ? 700 : 400,
              cursor:       'pointer',
              transition:   'all var(--transition-fast)',
              boxShadow:    p === currentPage ? '0 1px 4px rgba(59,130,246,0.25)' : 'none',
              fontFamily:   'var(--font-ui)',
            }}
            onMouseEnter={e => { if (p !== currentPage) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' } }}
            onMouseLeave={e => { if (p !== currentPage) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' } }}
          >
            {p}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          style={{
            ...navBtnBase,
            opacity: currentPage === totalPages ? 0.38 : 1,
            cursor:  currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (currentPage !== totalPages) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}

