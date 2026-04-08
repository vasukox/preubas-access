import { useState } from 'react'
import toast from 'react-hot-toast'
import { Edit2, ShieldAlert, Trash2 } from 'lucide-react'
import { configService, type NormaConfig, type SedeConfig } from '@/services/config.service'
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

export function NormasPanel({ 
  normas, 
  sedes, 
  onReload, 
  onLoadBase 
}: { 
  normas: NormaConfig[]; 
  sedes: SedeConfig[]; 
  onReload: () => void;
  onLoadBase: () => void;
}) {
  const [newNorma, setNewNorma] = useState({ numero: 1, titulo: '', contenido: '', sede_id: '' })
  const [editingNorma, setEditingNorma] = useState<NormaConfig | null>(null)
  const [saving, setSaving] = useState(false)

  const pagination = usePagination(normas, 5)

  const handleCrearNorma = async () => {
    if (!newNorma.titulo.trim() || !newNorma.contenido.trim()) {
      toast.error('Título y contenido son obligatorios.')
      return
    }
    try {
      setSaving(true)
      await configService.createNorma({
        numero: Number(newNorma.numero),
        titulo: newNorma.titulo.trim(),
        contenido: newNorma.contenido.trim(),
        sede_id: newNorma.sede_id ? Number(newNorma.sede_id) : null,
      })
      toast.success('Norma creada correctamente.')
      setNewNorma({ numero: 1, titulo: '', contenido: '', sede_id: '' })
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarEdicionNorma = async () => {
    if (!editingNorma) return
    if (!editingNorma.titulo.trim() || !editingNorma.contenido.trim()) {
      toast.error('Título y contenido son obligatorios.')
      return
    }
    try {
      setSaving(true)
      await configService.updateNorma(editingNorma.id, {
        numero: Number(editingNorma.numero),
        titulo: editingNorma.titulo.trim(),
        contenido: editingNorma.contenido.trim(),
        sede_id: editingNorma.sede_id ? Number(editingNorma.sede_id) : null,
      })
      toast.success('Norma actualizada correctamente.')
      setEditingNorma(null)
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarNorma = async (norma: NormaConfig) => {
    const okDelete = window.confirm(`¿Eliminar la norma "${norma.titulo}"?`)
    if (!okDelete) return
    try {
      setSaving(true)
      await configService.deleteNorma(norma.id)
      toast.success('Norma eliminada correctamente.')
      if (editingNorma?.id === norma.id) setEditingNorma(null)
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
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Crear norma</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '110px 1fr 180px' }}>
          <input type="number" min={1} value={newNorma.numero} onChange={(e) => setNewNorma((p) => ({ ...p, numero: Number(e.target.value) }))} style={inputStyle} />
          <input placeholder="Título" value={newNorma.titulo} onChange={(e) => setNewNorma((p) => ({ ...p, titulo: e.target.value }))} style={inputStyle} />
          <select value={newNorma.sede_id} onChange={(e) => setNewNorma((p) => ({ ...p, sede_id: e.target.value }))} style={inputStyle}>
            <option value="">Global (Todas las sedes)</option>
            {sedes.map((s) => (<option key={`create-sede-${s.id}`} value={String(s.id)}>{s.nombre}</option>))}
          </select>
        </div>
        <textarea placeholder="Contenido" value={newNorma.contenido} onChange={(e) => setNewNorma((p) => ({ ...p, contenido: e.target.value }))} style={{ ...inputStyle, minHeight: '96px', marginTop: '10px' }} />
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={handleCrearNorma} disabled={saving}>Crear norma</button>
        </div>
      </div>

      <div style={{ ...panel, padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Normas registradas</h3>
        {normas.length === 0 && (
          <div style={{ marginBottom: '10px', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px 12px', background: 'var(--bg-raised)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginBottom: '8px' }}>
              No hay normas para mostrar con el filtro actual. Puedes ajustar la búsqueda o cargar normas base.
            </div>
            <button className="btn-primary" onClick={onLoadBase}>Cargar normas base</button>
          </div>
        )}
        <div style={{ display: 'grid', gap: '8px' }}>
          {pagination.paginatedData.map((n) => (
            <div key={n.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px 12px', background: 'var(--bg-raised)' }}>
              <div style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600 }}>{n.numero}. {n.titulo}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>{n.sede_id ? `Sede #${n.sede_id}` : 'Global'}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: '6px', lineHeight: 1.45 }}>{n.contenido}</div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setEditingNorma(n)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.76rem' }}
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => handleEliminarNorma(n)}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.76rem', color: 'var(--danger-400)' }}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          ))}
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

      {/* Drawer / Modal de edición de Norma */}
      {editingNorma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Editar Norma</h3>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '90px 1fr' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Número</label>
                  <input type="number" min={1} value={editingNorma.numero} onChange={(e) => setEditingNorma({ ...editingNorma, numero: Number(e.target.value) })} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Título</label>
                  <input value={editingNorma.titulo} onChange={(e) => setEditingNorma({ ...editingNorma, titulo: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Sede (opcional)</label>
                <select value={editingNorma.sede_id || ''} onChange={(e) => setEditingNorma({ ...editingNorma, sede_id: e.target.value ? Number(e.target.value) : null })} style={inputStyle}>
                  <option value="">Global</option>
                  {sedes.map((s) => (<option key={`edit-sede-${s.id}`} value={s.id}>{s.nombre}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Contenido</label>
                <textarea value={editingNorma.contenido} onChange={(e) => setEditingNorma({ ...editingNorma, contenido: e.target.value })} style={{ ...inputStyle, minHeight: '88px' }} />
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-raised)' }}>
              <button className="btn-ghost" onClick={() => setEditingNorma(null)} disabled={saving}>Cancelar</button>
              <button className="btn-primary" onClick={handleGuardarEdicionNorma} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
