import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { 
  Shirt, 
  Plus, 
  Search, 
  Package, 
  Info,
  CheckCircle2,
  FileText,
  Briefcase,
  Tag,
  Hash,
  Filter,
  AlertCircle
} from 'lucide-react'

import { useSedeStore } from '@/store'
import { 
  useCrearGHMaestroDotacion, 
  useGHEntregasDotacion, 
  useGHMaestroDotacion 
} from '@/hooks/gh/useGHDotacion'
import { cn } from '@/utils/cn'

/* ── Componente de Métrica (Estilo Koaj GH Original) ──────────────── */
function MetricCard({ label, value, icon: Icon, color, bg }: { label: string, value: any, icon: any, color: string, bg: string }) {
  return (
    <div className="animate-fade-up glass" style={{
      padding: '18px 20px',
      borderRadius: 'var(--radius-xl)',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${color}15`,
    }}>
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: bg, borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
      <div className="relative flex justify-between items-start">
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: bg, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

export default function GHDotacionView() {
  const sede = useSedeStore((s) => s.sedeActiva)
  const sedeId = sede?.id ?? 0
  const { data: maestro = [], isLoading, isFetching } = useGHMaestroDotacion({ 
    sede_id: sedeId, 
    activos_only: true 
  })
  const { data: entregas = [] } = useGHEntregasDotacion()
  const crearMaestro = useCrearGHMaestroDotacion()

  const [openModal, setOpenModal] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    area: '',
    cargo: '',
    tipo_contrato: '',
    kit_codigo: '',
    kit_descripcion: '',
  })

  const maestroFiltrado = useMemo(() => {
    return maestro.filter(m => 
      m.area.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.cargo.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.kit_codigo.toLowerCase().includes(busqueda.toLowerCase())
    )
  }, [maestro, busqueda])

  if (!sede) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] glass rounded-2xl border border-[var(--border-subtle)] text-center p-8">
        <Package size={32} color="var(--border-subtle)" style={{ marginBottom: '12px' }} />
        <div className="text-[var(--text-muted)] text-sm">Selecciona una sede para gestionar dotación.</div>
      </div>
    )
  }

  const handleCrear = () => {
    if (!form.area || !form.cargo || !form.tipo_contrato || !form.kit_codigo || !form.kit_descripcion) {
      toast.error('Completa todos los campos.')
      return
    }
    crearMaestro.mutate(
      {
        sede_id: sede.id,
        area: form.area,
        cargo: form.cargo,
        tipo_contrato: form.tipo_contrato,
        kit_codigo: form.kit_codigo,
        kit_descripcion: form.kit_descripcion,
        activo: true,
      },
      {
        onSuccess: () => {
          toast.success('Regla guardada.')
          setOpenModal(false)
          setForm({ area: '', cargo: '', tipo_contrato: '', kit_codigo: '', kit_descripcion: '' })
        },
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Header — Estilo GHCitas */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="status-dot active animate-pulse" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>MÓDULO GH — MAESTRO DE DOTACIÓN</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Gestión de Kits y Suministros</h2>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sede activa: <strong style={{ color: 'var(--text-secondary)' }}>{sede.nombre}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '5px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite' }} />
              Sync
            </div>
          )}
          <button className="btn-primary" onClick={() => setOpenModal(true)}>
            <Plus size={16} />
            Nueva Regla
          </button>
        </div>
      </div>

      {/* Métricas — Estilo GHCitas */}
      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <MetricCard label="Reglas de Dotación" value={maestro.length} icon={FileText} color="#0ea5e9" bg="rgba(14,165,233,0.12)" />
        <MetricCard label="Entregas Totales" value={entregas.length} icon={CheckCircle2} color="#10b981" bg="rgba(16,185,129,0.12)" />
        <MetricCard label="Sede Operativa" value={sede.nombre.slice(0,3).toUpperCase()} icon={Shirt} color="#f59e0b" bg="rgba(245,158,11,0.12)" />
      </div>

      {/* Barra de Filtros — Estilo GHCitas */}
      <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            style={{ width: '100%', height: '38px', paddingLeft: '36px', background: 'var(--bg-base)', border: 'none', fontSize: '0.75rem' }} 
            placeholder="Buscar por área, cargo o código de kit..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button className="btn-ghost" style={{ fontSize: '0.7rem' }}><Filter size={14} style={{ marginRight: '6px' }} /> Filtrar</button>
      </div>

      {/* Tabla — Estilo GHCitas */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>CARGO / ÁREA</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>TIPO CONTRATO</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>KIT ASIGNADO</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>ESPECIFICACIONES DEL SUMINISTRO</th>
                <th align="left" style={{ padding: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>GESTIÓN</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Consultando maestro...</td></tr>
              ) : maestroFiltrado.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin reglas de dotación.</td></tr>
              ) : (
                maestroFiltrado.map((m, idx) => (
                  <tr key={m.id} className={cn("table-row animate-fade-up", `stagger-${(idx % 6) + 1}`)} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Briefcase size={14} color="var(--text-muted)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{m.cargo}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 600 }}>{m.area}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{m.tipo_contrato}</span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div className="data-display" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                        {m.kit_codigo}
                      </div>
                    </td>
                    <td style={{ padding: '14px', maxWidth: '300px' }}>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }} className="line-clamp-2">
                        {m.kit_descripcion}
                      </p>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-ghost !p-2" title="Editar Regla"><FileText size={14} /></button>
                        <button className="btn-ghost !p-2" title="Eliminar"><AlertCircle size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Regla */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-[var(--border-strong)]">
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                 <Shirt size={14} color="var(--primary-400)" />
                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>CONFIGURACIÓN DE SUMINISTROS</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Nueva Regla de Dotación</h3>
            </div>
            
            <div style={{ padding: '24px', display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Área</span>
                  <input placeholder="Ej: Logística..." className="w-full h-10 px-3 text-xs" value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cargo</span>
                  <input placeholder="Ej: Operario..." className="w-full h-10 px-3 text-xs" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} />
                </label>
              </div>
              <label style={{ display: 'grid', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tipo de Contrato</span>
                <input placeholder="Ej: Término Fijo..." className="w-full h-10 px-3 text-xs" value={form.tipo_contrato} onChange={e => setForm({...form, tipo_contrato: e.target.value})} />
              </label>
              <div style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Hash size={12} color="var(--primary-400)" />
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>DETALLES DEL KIT</span>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input placeholder="Código de Kit (KIT-XX)" className="w-full h-10 px-3 text-xs font-mono" value={form.kit_codigo} onChange={e => setForm({...form, kit_codigo: e.target.value})} />
                  <textarea placeholder="Descripción del kit..." rows={3} className="w-full p-3 text-xs" value={form.kit_descripcion} onChange={e => setForm({...form, kit_descripcion: e.target.value})} />
                </div>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-ghost" onClick={() => setOpenModal(false)}>Cancelar</button>
              <button className="btn-primary glow-primary" onClick={handleCrear} disabled={crearMaestro.isPending}>
                Guardar Regla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
