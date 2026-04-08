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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      borderRadius: '0 0 var(--radius-xl) var(--radius-xl)'
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        T. registros: {totalItems}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            border: 'none', background: 'transparent',
            color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {getPagesToShow().map(p => (
          <button
            key={p}
            onClick={() => onGoTo(p)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '28px', height: '28px', borderRadius: '6px', padding: '0 8px',
              border: p === currentPage ? '1px solid var(--primary-400)' : '1px solid var(--border-subtle)',
              background: p === currentPage ? 'rgba(245,158,11,0.1)' : 'var(--bg-raised)',
              color: p === currentPage ? 'var(--primary-400)' : 'var(--text-secondary)',
              fontSize: '0.75rem', fontWeight: p === currentPage ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            {p}
          </button>
        ))}

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            border: 'none', background: 'transparent',
            color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
