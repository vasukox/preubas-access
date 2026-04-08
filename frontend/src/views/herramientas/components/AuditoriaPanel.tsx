import { useEffect, useState } from 'react'
import { Activity, ChevronLeft, History, RefreshCw, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { AuditLogEntry } from '@/services/herramientas.service'
import { herramientasService } from '@/services/herramientas.service'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { ACCIONES_AUDITORIA, type VistaHerramientas } from '../constants'

interface AuditoriaPanelProps {
  setVistaActiva: (vista: VistaHerramientas) => void
}

export function AuditoriaPanel({ setVistaActiva }: AuditoriaPanelProps) {
  const [auditoria, setAuditoria] = useState<AuditLogEntry[]>([])
  const [loadingAuditoria, setLoadingAuditoria] = useState(false)
  const [filtroAccion, setFiltroAccion] = useState('')

  const cargarAuditoria = async (accion?: string) => {
    setLoadingAuditoria(true)
    try {
      const data = await herramientasService.listarAuditoria({ limit: 100, accion: accion || undefined })
      setAuditoria(data)
    } catch {
      toast.error('No se pudo cargar el registro de auditoría.')
    } finally {
      setLoadingAuditoria(false)
    }
  }

  useEffect(() => {
    cargarAuditoria(filtroAccion || undefined)
  }, []) // Solo on mount, el select dispara reload manual o onChange

  const auditoriaPagination = usePagination(auditoria, 20)

  const panelStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  }

  const fieldStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.84rem',
    outline: 'none',
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    borderColor: 'transparent',
    background: 'var(--bg-raised)',
    padding: '8px 14px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <div className="animate-fade-up stagger-2" style={panelStyle}>
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={15} color="var(--primary-400)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Registro de Auditoría <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({auditoria.length})</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <select
                value={filtroAccion}
                onChange={(e) => {
                  setFiltroAccion(e.target.value)
                  cargarAuditoria(e.target.value || undefined)
                }}
                style={{ ...fieldStyle, width: 'auto', padding: '8px 14px 8px 34px', fontSize: '0.76rem', borderRadius: 'var(--radius-lg)', appearance: 'none' }}
              >
                <option value="">Todas las acciones</option>
                {Object.entries(ACCIONES_AUDITORIA).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
          </div>
          <button
            onClick={() => cargarAuditoria(filtroAccion || undefined)}
            className="btn-ghost"
            style={{
              ...backButtonStyle,
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
            title="Recargar registros"
          >
            <RefreshCw size={14} color="var(--text-muted)" />
          </button>
          <button
            onClick={() => setVistaActiva('inicio')}
            className="btn-ghost"
            style={backButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-raised)')}
          >
            <ChevronLeft size={14} />
            Atrás
          </button>
        </div>
      </div>

      {loadingAuditoria ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid var(--primary-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
          Sincronizando registros...
        </div>
      ) : auditoria.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <History size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          No hay actividad registrada en este filtro.
        </div>
      ) : (
        <>
        <div style={{ position: 'relative', padding: '20px 24px', background: 'var(--bg-surface)' }}>
          {/* Timeline Line */}
          <div style={{ position: 'absolute', left: '40px', top: '30px', bottom: '30px', width: '2px', background: 'var(--border-subtle)', borderRadius: '2px' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {auditoriaPagination.paginatedData.map((log, idx) => {
              const dateObj = log.fecha ? new Date(log.fecha) : null;
              const dateStr = dateObj ? dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              const timeStr = dateObj ? dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
              
              const accionC = ACCIONES_AUDITORIA[log.accion] ?? log.accion;
              const isDanger = log.accion.includes('ELIMINAR') || log.accion.includes('QUITAR') || log.accion.includes('DESACTIVAR');
              const isCreate = log.accion.includes('CREAR') || log.accion.includes('NUEVO') || log.accion.includes('ASIGNAR');

              return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: '20px',
                  position: 'relative',
                  padding: '16px 0',
                  borderBottom: idx < auditoriaPagination.paginatedData.length - 1 ? '1px dashed var(--border-subtle)' : 'none',
                  transition: 'background 0.2s',
                  borderRadius: 'var(--radius-lg)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Timeline Icon */}
                <div style={{ 
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, zIndex: 1, marginTop: '2px',
                  background: isDanger ? 'var(--danger-500)' : isCreate ? 'var(--success-500)' : 'var(--primary-500)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 6px var(--bg-surface)`
                }}>
                  <Activity size={16} color="#fff" />
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {log.actor_nombre}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>realizó</span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        border: `1px solid ${isDanger ? 'rgba(239,68,68,0.2)' : isCreate ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.2)'}`,
                        color: isDanger ? 'var(--danger-400)' : isCreate ? 'var(--success-400)' : 'var(--primary-400)',
                        background: isDanger ? 'rgba(239,68,68,0.08)' : isCreate ? 'rgba(16,185,129,0.08)' : 'rgba(56,189,248,0.08)',
                      }}
                    >
                      {accionC}
                    </span>
                  </div>
                  {log.descripcion && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-raised)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginTop: '4px', border: '1px solid var(--border-subtle)' }}>
                      {log.descripcion}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', minWidth: '80px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>{timeStr}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                </div>
              </div>
            )})}
          </div>
        </div>
          <Pagination
            currentPage={auditoriaPagination.currentPage}
            totalPages={auditoriaPagination.totalPages}
            onNext={auditoriaPagination.nextPage}
            onPrev={auditoriaPagination.prevPage}
            onGoTo={auditoriaPagination.goToPage}
            totalItems={auditoriaPagination.totalItems}
          />
        </>
      )}
    </div>
  )
}
