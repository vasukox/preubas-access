import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { configService, type CatalogoItem, type CatalogoTipo } from '@/services/config.service'
import { getErrorMessage } from '@/services/api'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'

const panel: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--shadow-sm)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem',
  fontFamily: 'var(--font-ui)',
}

export function CatalogosPanel({ 
  items, 
  tipo, 
  onTipoChange, 
  onReload 
}: { 
  items: CatalogoItem[]; 
  tipo: CatalogoTipo; 
  onTipoChange: (tipo: CatalogoTipo) => void;
  onReload: () => void 
}) {
  const [newCatalogo, setNewCatalogo] = useState({ nombre: '', codigo: '' })
  const [saving, setSaving] = useState(false)

  const pagination = usePagination(items, 10)

  const handleCrearCatalogo = async () => {
    if (!newCatalogo.nombre.trim() || !newCatalogo.codigo.trim()) {
      toast.error('Nombre y código son obligatorios.')
      return
    }
    try {
      setSaving(true)
      await configService.createCatalogoItem(tipo, {
        nombre: newCatalogo.nombre.trim(),
        codigo: newCatalogo.codigo.trim().toUpperCase(),
        activa: true,
      })
      toast.success('Ítem de catálogo creado correctamente.')
      setNewCatalogo({ nombre: '', codigo: '' })
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarCatalogo = async (item: CatalogoItem) => {
    const okDelete = window.confirm(`¿Eliminar ${tipo.toUpperCase()} "${item.nombre}"?`)
    if (!okDelete) return
    try {
      setSaving(true)
      await configService.deleteCatalogoItem(tipo, item.id)
      toast.success('Ítem de catálogo eliminado correctamente.')
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div style={{ ...panel, padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Crear ítem de catálogo</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 2fr 1fr auto' }}>
          <select value={tipo} onChange={(e) => onTipoChange(e.target.value as CatalogoTipo)} style={inputStyle}>
            <option value="eps">EPS</option>
            <option value="arl">ARL</option>
            <option value="afp">AFP</option>
          </select>
          <input placeholder="Nombre" value={newCatalogo.nombre} onChange={(e) => setNewCatalogo((p) => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
          <input placeholder="Código" value={newCatalogo.codigo} onChange={(e) => setNewCatalogo((p) => ({ ...p, codigo: e.target.value }))} style={inputStyle} />
          <button className="btn-primary" onClick={handleCrearCatalogo} disabled={saving}>Crear</button>
        </div>
      </div>

      <div style={{ ...panel, padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Listado {tipo.toUpperCase()}</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {pagination.paginatedData.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '9px 11px', background: 'var(--bg-raised)' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{item.nombre} ({item.codigo})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: item.activa ? 'var(--success-400)' : 'var(--text-muted)' }}>{item.activa ? 'Activa' : 'Inactiva'}</span>
                <button
                  className="btn-ghost"
                  onClick={() => handleEliminarCatalogo(item)}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', color: 'var(--danger-400)' }}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>No hay ítems para el filtro actual.</div>
          )}
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onNext={pagination.nextPage}
          onPrev={pagination.prevPage}
          onGoTo={pagination.goToPage}
          totalItems={pagination.totalItems}
        />
      </div>
    </div>
  )
}
