import { useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronRight, Edit2, MapPin, Plus, ShieldAlert } from 'lucide-react'
import { configService, type SedeConfig, type UbicacionConfig } from '@/services/config.service'
import { getErrorMessage } from '@/services/api'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { useSedeStore } from '@/store/sedeStore'
import type { SedeBasica } from '@/types'

const panelStyle: React.CSSProperties = {
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

export function EstructuraPanel({ sedes, onReload }: { sedes: SedeConfig[]; onReload: () => void }) {
  const [newSede, setNewSede] = useState({ nombre: '', ciudad: 'Bogotá' })
  const [editingSede, setEditingSede] = useState<SedeConfig | null>(null)
  const sedesSelector = useSedeStore(s => s.sedes)
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const setSedesSelector = useSedeStore(s => s.setSedes)
  const setSedeActiva = useSedeStore(s => s.setSedeActiva)
  
  // Array de sede_ids expandidos para ver sus ubicaciones
  const [expandedSedes, setExpandedSedes] = useState<number[]>([])

  // Estado para crear una nueva ubicación inline en una sede específica
  const [addingUbicacionSedeId, setAddingUbicacionSedeId] = useState<number | null>(null)
  const [newUbicacion, setNewUbicacion] = useState({ nombre: '', codigo: '', tipo: 'GENERAL' })
  
  // Estado para editar ubicación existente
  const [editingUbicacion, setEditingUbicacion] = useState<UbicacionConfig | null>(null)

  const [saving, setSaving] = useState(false)

  const pagination = usePagination(sedes, 8)

  const toSedeBasica = (sede: SedeConfig): SedeBasica => ({
    id: sede.id,
    nombre: sede.nombre,
    ciudad: sede.ciudad,
  })

  const syncSedeSelector = (sede: SedeConfig) => {
    const nextSede = toSedeBasica(sede)
    const nextSedes = sede.activa
      ? [...sedesSelector.filter(s => s.id !== sede.id), nextSede]
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      : sedesSelector.filter(s => s.id !== sede.id)

    setSedesSelector(nextSedes)

    if (!sedeActiva && sede.activa) {
      setSedeActiva(nextSede)
    } else if (sedeActiva?.id === sede.id) {
      if (sede.activa) setSedeActiva(nextSede)
      else if (nextSedes.length > 0) setSedeActiva(nextSedes[0])
    }
  }

  const toggleExpand = (sedeId: number) => {
    setExpandedSedes((prev) => 
      prev.includes(sedeId) ? prev.filter((id) => id !== sedeId) : [...prev, sedeId]
    )
  }

  // ─── LÓGICA DE SEDES ───
  const handleCrearSede = async () => {
    if (!newSede.nombre.trim() || !newSede.ciudad.trim()) {
      toast.error('Nombre de sede y ciudad son obligatorios.')
      return
    }
    try {
      setSaving(true)
      const sedeCreada = await configService.createSede({
        nombre: newSede.nombre.trim(),
        ciudad: newSede.ciudad.trim(),
      })
      toast.success('Sede creada correctamente.')
      setNewSede({ nombre: '', ciudad: 'Bogotá' })
      syncSedeSelector(sedeCreada)
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarEdicionSede = async () => {
    if (!editingSede) return
    if (!editingSede.nombre.trim() || !editingSede.ciudad.trim()) {
      toast.error('Nombre y ciudad son obligatorios.')
      return
    }
    try {
      setSaving(true)
      const sedeActualizada = await configService.updateSede(editingSede.id, {
        nombre: editingSede.nombre.trim(),
        ciudad: editingSede.ciudad.trim(),
      })
      toast.success('Sede actualizada correctamente.')
      setEditingSede(null)
      syncSedeSelector(sedeActualizada)
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleSede = async (sede: SedeConfig) => {
    try {
      setSaving(true)
      const sedeActualizada = await configService.updateSede(sede.id, { activa: !sede.activa })
      toast.success(`Sede ${!sede.activa ? 'activada' : 'desactivada'} correctamente.`)
      syncSedeSelector(sedeActualizada)
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // ─── LÓGICA DE UBICACIONES ───
  const handleCrearUbicacion = async (sedeId: number) => {
    if (!newUbicacion.nombre.trim()) {
      toast.error('El nombre de la ubicación es obligatorio.')
      return
    }
    try {
      setSaving(true)
      await configService.createUbicacion({
        sede_id: sedeId,
        nombre: newUbicacion.nombre.trim(),
        tipo: newUbicacion.tipo.trim() || 'GENERAL',
      })
      toast.success('Ubicación creada correctamente.')
      setAddingUbicacionSedeId(null)
      setNewUbicacion({ nombre: '', codigo: '', tipo: 'GENERAL' })
      if (!expandedSedes.includes(sedeId)) {
        setExpandedSedes((prev) => [...prev, sedeId])
      }
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleGuardarEdicionUbicacion = async () => {
    if (!editingUbicacion) return
    if (!editingUbicacion.nombre.trim()) {
      toast.error('El nombre es obligatorio.')
      return
    }
    try {
      setSaving(true)
      await configService.updateUbicacion(editingUbicacion.id, {
        nombre: editingUbicacion.nombre.trim(),
        tipo: editingUbicacion.tipo?.trim() || 'GENERAL',
      })
      toast.success('Ubicación actualizada correctamente.')
      setEditingUbicacion(null)
      onReload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div style={{ ...panelStyle, padding: '14px' }}>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-primary)', fontSize: '0.92rem' }}>Registrar nueva sede</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '2fr 1.3fr auto', alignItems: 'end' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '6px' }}>NOMBRE DE LA SEDE</div>
            <input placeholder="Ej: Soacha" value={newSede.nombre} onChange={(e) => setNewSede((p) => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '6px' }}>CIUDAD</div>
            <input placeholder="Ej: Soacha" value={newSede.ciudad} onChange={(e) => setNewSede((p) => ({ ...p, ciudad: e.target.value }))} style={inputStyle} />
          </div>
          <button className="btn-primary" onClick={handleCrearSede} disabled={saving}>Crear Sede</button>
        </div>
      </div>

      <div style={{ ...panelStyle, padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.92rem' }}>Estructura Organizacional</h3>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{sedes.length} sedes registradas</span>
        </div>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          {pagination.paginatedData.map((sede) => {
            const isExpanded = expandedSedes.includes(sede.id)
            const isAddingLoc = addingUbicacionSedeId === sede.id

            return (
              <div key={sede.id} style={{ 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '10px', 
                background: 'var(--bg-raised)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}>
                {/* Cabecera Sede */}
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '10px 12px',
                  borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }} 
                    onClick={() => toggleExpand(sede.id)}
                  >
                    <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>{sede.nombre}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {sede.ciudad} 
                        <span style={{ fontSize: '10px', color: 'var(--border-strong)' }}>•</span> 
                        {sede.ubicaciones.length} ubicaciones
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-ghost"
                      onClick={(e) => { e.stopPropagation(); setEditingSede(sede); }}
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      title="Editar sede"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={(e) => { e.stopPropagation(); handleToggleSede(sede); }}
                      disabled={saving}
                      style={{ 
                        padding: '4px 8px', fontSize: '0.74rem', 
                        color: sede.activa ? 'var(--danger-400)' : 'var(--success-400)' 
                      }}
                      title={sede.activa ? 'Desactivar sede' : 'Activar sede'}
                    >
                      <ShieldAlert size={14} />
                    </button>
                  </div>
                </div>

                {/* Contenido Expandido: Ubicaciones */}
                {isExpanded && (
                  <div style={{ padding: '12px 12px 12px 42px', background: 'var(--bg-base)' }}>
                    {sede.ubicaciones.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '10px', fontStyle: 'italic' }}>
                        No hay ubicaciones registradas en esta sede.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {sede.ubicaciones.map((u) => (
                          <div key={u.id} style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '6px', 
                            padding: '4px 10px', border: '1px solid var(--border-default)', 
                            borderRadius: '999px', fontSize: '0.72rem', 
                            color: 'var(--text-primary)', background: 'var(--bg-surface)' 
                          }}>
                            <MapPin size={10} color="var(--primary-400)" />
                            <span>{u.nombre} <span style={{ color: 'var(--text-muted)' }}>({u.tipo})</span></span>
                            <button 
                              onClick={() => setEditingUbicacion(u)} 
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex' }}
                              title="Editar ubicación"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Form para Añadir Ubicación */}
                    {isAddingLoc ? (
                        <div style={{ display: 'grid', gap: '8px', background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', animation: 'fadeIn 0.2s ease-out' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Añadir Ubicación en {sede.nombre}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '8px' }}>
                                <input placeholder="Nombre (Ej. Puerta Principal)" value={newUbicacion.nombre} onChange={(e) => setNewUbicacion({ ...newUbicacion, nombre: e.target.value })} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.76rem' }} autoFocus />
                                <select value={newUbicacion.tipo} onChange={(e) => setNewUbicacion({ ...newUbicacion, tipo: e.target.value })} style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                    <option value="GENERAL">General</option>
                                    <option value="PARKING">Parqueadero</option>
                                    <option value="PRODUCCION">Producción</option>
                                    <option value="ADMIN">Administrativa</option>
                                    <option value="BODEGA">Bodega</option>
                                    <option value="TECNICA">Técnica</option>
                                </select>
                                <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.72rem' }} onClick={() => setAddingUbicacionSedeId(null)} disabled={saving}>Cancelar</button>
                                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.72rem' }} onClick={() => handleCrearUbicacion(sede.id)} disabled={saving}>Añadir</button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            className="btn-ghost" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--primary-500)', padding: '4px 8px' }}
                            onClick={() => {
                                setAddingUbicacionSedeId(sede.id)
                                setNewUbicacion({ nombre: '', codigo: '', tipo: 'GENERAL' })
                            }}
                        >
                            <Plus size={12} /> Añadir ubicación
                        </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          
          {sedes.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', padding: '10px' }}>No hay sedes que coincidan con la búsqueda.</div>
          )}
        </div>
        
        <div style={{ marginTop: '14px' }}>
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

      {/* Modal Edición Sede */}
      {editingSede && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', overflow: 'hidden', animation: 'fadeIn 0.2s' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Editar Sede</h3>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Nombre</label>
                <input value={editingSede.nombre} onChange={(e) => setEditingSede({ ...editingSede, nombre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Ciudad</label>
                <input value={editingSede.ciudad} onChange={(e) => setEditingSede({ ...editingSede, ciudad: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-raised)' }}>
              <button className="btn-ghost" onClick={() => setEditingSede(null)} disabled={saving}>Cancelar</button>
              <button className="btn-primary" onClick={handleGuardarEdicionSede} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición Ubicación */}
      {editingUbicacion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', overflow: 'hidden', animation: 'fadeIn 0.2s' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Editar Ubicación</h3>
            </div>
            <div style={{ padding: '20px', display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Nombre</label>
                <input value={editingUbicacion.nombre} onChange={(e) => setEditingUbicacion({ ...editingUbicacion, nombre: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '6px' }}>Tipo de Zona</label>
                <select value={editingUbicacion.tipo || 'GENERAL'} onChange={(e) => setEditingUbicacion({ ...editingUbicacion, tipo: e.target.value })} style={inputStyle}>
                    <option value="GENERAL">General</option>
                    <option value="PARKING">Parqueadero</option>
                    <option value="PRODUCCION">Producción</option>
                    <option value="ADMIN">Administrativa</option>
                    <option value="BODEGA">Bodega</option>
                    <option value="TECNICA">Técnica</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'var(--bg-raised)' }}>
              <button className="btn-ghost" onClick={() => setEditingUbicacion(null)} disabled={saving}>Cancelar</button>
              <button className="btn-primary" onClick={handleGuardarEdicionUbicacion} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar ubicación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
