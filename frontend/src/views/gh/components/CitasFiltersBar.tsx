import type { CSSProperties } from 'react'
import { Search, X } from 'lucide-react'
import { useGHStore } from '@/store/ghStore'

interface CitasFiltersBarProps {
  onOpenCreate: () => void
  onClearFilters: () => void
  onRefresh: () => void
  refreshing: boolean
}

export function CitasFiltersBar({ onOpenCreate, onClearFilters, onRefresh, refreshing }: CitasFiltersBarProps) {
  const activeEstadoFilter = useGHStore((s) => s.activeEstadoFilter)
  const activeTipoCitaFilter = useGHStore((s) => s.activeTipoCitaFilter)
  const busquedaFilter = useGHStore((s) => s.busquedaFilter)

  const setActiveEstadoFilter = useGHStore((s) => s.setActiveEstadoFilter)
  const setActiveTipoCitaFilter = useGHStore((s) => s.setActiveTipoCitaFilter)
  const setBusquedaFilter = useGHStore((s) => s.setBusquedaFilter)

  const fieldWrapper: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--primary-200)',
    flex: 1,
    minWidth: '280px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  }

  return (
    <section
      style={{
        width: '100%',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--bg-surface)',
        padding: '20px',
        display: 'grid',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={fieldWrapper}>
          <Search size={18} color="var(--primary-400)" />
          <input
            value={busquedaFilter}
            onChange={(e) => setBusquedaFilter(e.target.value)}
            placeholder="Buscar por nombre, apellido o número de cédula..."
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.88rem' }}
          />
          {busquedaFilter && (
            <button
              onClick={() => setBusquedaFilter('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} color="var(--text-muted)" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button type="button" className="btn-ghost" onClick={onRefresh}>
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button type="button" className="btn-ghost" onClick={onClearFilters}>
            Limpiar filtros
          </button>
          <button type="button" className="btn-primary" onClick={onOpenCreate}>
            Nueva cita
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTADO:</span>
          <select 
            value={activeEstadoFilter ?? ''} 
            onChange={(e) => setActiveEstadoFilter(e.target.value || null)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', background: 'var(--bg-elevated)' }}
          >
            <option value="">Todos los estados</option>
            <option value="PROGRAMADA">PROGRAMADA</option>
            <option value="CONFIRMADA">CONFIRMADA</option>
            <option value="EN_CURSO">EN_CURSO</option>
            <option value="FINALIZADA">FINALIZADA</option>
            <option value="NO_ASISTIO">NO_ASISTIO</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPO:</span>
          <select 
            value={activeTipoCitaFilter ?? ''} 
            onChange={(e) => setActiveTipoCitaFilter(e.target.value || null)}
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', background: 'var(--bg-elevated)' }}
          >
            <option value="">Todos los motivos</option>
            <option value="INDUCCION">INDUCCION</option>
            <option value="FIRMA_CONTRATO">FIRMA_CONTRATO</option>
            <option value="ENTREGA_DOTACION">ENTREGA_DOTACION</option>
          </select>
        </div>
      </div>
    </section>
  )
}

