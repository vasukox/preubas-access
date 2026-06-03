import { useNavigate } from 'react-router-dom'
import {
  BarChart3, ShieldCheck, ArrowRight, RefreshCw,
  FileBarChart2, ClipboardList, Users, Eye, AlertTriangle,
  TrendingUp, Activity,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSedeStore, useAuthStore } from '@/store'
import { hseService } from '@/services/hse.service'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend,
} from 'recharts'

function NavCard({ label, sub, icon: Icon, color, bg, path, onClick }: {
  label: string; sub: string; icon: React.ElementType
  color: string; bg: string; path: string; onClick: (p: string) => void
}) {
  return (
    <button
      onClick={() => onClick(path)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', background: 'var(--bg-surface)',
        border: `1px solid ${color}26`, borderRadius: 'var(--radius-xl)',
        cursor: 'pointer', fontFamily: 'var(--font-ui)', textAlign: 'left',
        transition: 'border-color var(--transition-fast), background var(--transition-fast)',
        boxShadow: 'var(--shadow-card)', flex: '1 1 160px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = color
        ;(e.currentTarget as HTMLElement).style.background = `${color}0d`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}26`
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'
      }}
    >
      <div style={{ width: '34px', height: '34px', background: bg, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: '1px' }}>{sub}</div>
      </div>
      <ArrowRight size={13} color={color} style={{ flexShrink: 0 }} />
    </button>
  )
}

function ChartCard({ title, icon: Icon, color, children, span = 1 }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode; span?: number
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', padding: '20px',
      boxShadow: 'var(--shadow-card)', gridColumn: `span ${span}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {title.toUpperCase()}
        </span>
      </div>
      {children}
    </div>
  )
}

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', fontFamily: 'var(--font-ui)' }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.72rem' }}>{label}</div>}
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.fill ?? 'var(--text-primary)', fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

function KpiCard({ label, value, color, icon: Icon }: { label: string; value: string | number; color: string; icon: React.ElementType }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.69rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{label.toUpperCase()}</span>
        <Icon size={13} color={color} />
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

const EMPTY = <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin datos disponibles</div>

export default function ReportesView() {
  const navigate   = useNavigate()
  const sedeActiva = useSedeStore((s) => s.sedeActiva)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)
  const isAdmin    = useAuthStore((s) => s.isAdmin)
  const sedeId     = sedeActiva?.id ?? null
  const puedeVerHSE = isAdmin() || hasAnyRole(['ADMIN_HSE', 'GESTION_HSE', 'VIGILANTE_HSE'])

  const { data: hse, isLoading: loadingDash, refetch: refetchDash, isFetching } = useQuery({
    queryKey: ['reportes', 'dashboard', sedeId],
    queryFn:  () => hseService.getDashboard(sedeId as number),
    enabled:  Boolean(sedeId) && puedeVerHSE,
    staleTime: 60_000,
  })

  const { data: charts, isLoading: loadingCharts, refetch: refetchCharts } = useQuery({
    queryKey: ['reportes', 'charts', sedeId],
    queryFn:  () => hseService.getChartData(sedeId as number),
    enabled:  Boolean(sedeId) && puedeVerHSE,
    staleTime: 60_000,
  })

  if (!sedeId) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Selecciona una sede para ver los reportes.
      </div>
    )
  }

  const totalAut   = (hse?.autorizaciones_activas ?? 0) + (hse?.autorizaciones_pendientes ?? 0)
  const tasaActiva = totalAut > 0 ? Math.round(((hse?.autorizaciones_activas ?? 0) / totalAut) * 100) : 0
  const loading    = loadingDash || loadingCharts

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }} className="animate-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <BarChart3 size={13} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>REPORTES OPERATIVOS</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '3px' }}>Resumen ejecutivo</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{sedeActiva?.nombre} — métricas en tiempo real</p>
        </div>
        <button
          onClick={() => { void refetchDash(); void refetchCharts() }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}
        >
          <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          {isFetching ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Acceso rápido */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }} className="animate-fade-up">
        <NavCard label="Cumplimiento"  sub="Historial · Excel"  icon={FileBarChart2} color="var(--success-400)" bg="rgba(40,149,108,0.1)"  path="/reportes/hse"            onClick={navigate} />
        <NavCard label="Autorizaciones" sub="Filtros · Estados" icon={ClipboardList} color="var(--primary-400)" bg="rgba(86,104,184,0.1)"   path="/reportes/autorizaciones" onClick={navigate} />
        <NavCard label="Contratistas"  sub="Estado · Historial" icon={Users}         color="#8b5cf6"            bg="rgba(139,92,246,0.1)"   path="/reportes/contratistas"   onClick={navigate} />
        <NavCard label="Accesos"       sub="Entradas · Salidas" icon={Eye}           color="#0ea5e9"            bg="rgba(14,165,233,0.1)"   path="/reportes/accesos"        onClick={navigate} />
        <NavCard label="Vencimientos"  sub="Semáforo · Alertas" icon={AlertTriangle} color="var(--danger-400)" bg="rgba(239,68,68,0.1)"    path="/reportes/vencimientos"   onClick={navigate} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30vh', gap: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-default)', borderTop: '2px solid var(--primary-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Cargando datos...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '12px', marginBottom: '20px' }} className="animate-fade-up">
            <KpiCard label="Activas"          value={hse?.autorizaciones_activas   ?? 0}  color="var(--success-400)" icon={ShieldCheck}  />
            <KpiCard label="En revisión"      value={hse?.autorizaciones_pendientes ?? 0} color="var(--primary-400)" icon={Activity}     />
            <KpiCard label="En sitio ahora"   value={hse?.contratistas_dentro_ahora ?? 0} color="#0ea5e9"            icon={Users}        />
            <KpiCard label="Vencidas"         value={hse?.autorizaciones_vencidas   ?? 0} color="var(--danger-400)"  icon={AlertTriangle}/>
            <KpiCard label="Tasa activa"      value={`${tasaActiva}%`}                    color="var(--success-400)" icon={TrendingUp}   />
          </div>

          {/* Gráficas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }} className="animate-fade-up stagger-2">

            {/* Tendencia mensual — 7 cols */}
            <ChartCard title="Tendencia mensual de autorizaciones" icon={TrendingUp} color="var(--primary-400)" span={7}>
              {charts?.tendencia_mensual?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={charts.tendencia_mensual} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#5668B8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5668B8" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="mes"  tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Area type="monotone" dataKey="autorizaciones" name="Autorizaciones" stroke="#5668B8" fill="url(#gA)" strokeWidth={2} dot={{ r: 3, fill: '#5668B8' }} />
                    <Area type="monotone" dataKey="aprobadas"      name="Aprobadas"      stroke="#22c55e" fill="url(#gB)" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : EMPTY}
            </ChartCard>

            {/* Autorizaciones por estado — 5 cols */}
            <ChartCard title="Autorizaciones por estado" icon={BarChart3} color="var(--primary-400)" span={5}>
              {charts?.autorizaciones_por_estado?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={charts.autorizaciones_por_estado} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                      {charts.autorizaciones_por_estado.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<TT />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : EMPTY}
            </ChartCard>

            {/* Top proveedores — 6 cols */}
            <ChartCard title="Top proveedores por contratistas" icon={Users} color="#8b5cf6" span={6}>
              {charts?.top_proveedores?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.top_proveedores} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="nombre" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={110} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="total" name="Contratistas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : EMPTY}
            </ChartCard>

            {/* Contratistas por estado — 6 cols */}
            <ChartCard title="Contratistas por estado" icon={ShieldCheck} color="var(--success-400)" span={6}>
              {charts?.contratistas_por_estado?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.contratistas_por_estado} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="value" name="Contratistas" radius={[4, 4, 0, 0]}>
                      {charts.contratistas_por_estado.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : EMPTY}
            </ChartCard>

            {/* Accesos diarios — 8 cols */}
            <ChartCard title="Accesos últimos 7 días" icon={Eye} color="#0ea5e9" span={8}>
              {charts?.accesos_diarios?.some(d => d.entradas > 0 || d.salidas > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={charts.accesos_diarios} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="dia" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="salidas"  name="Salidas"  fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin accesos esta semana</div>
              )}
            </ChartCard>

            {/* Tipo contratista — 4 cols */}
            <ChartCard title="Tipo de contratista" icon={BarChart3} color="#0ea5e9" span={4}>
              {charts?.tipo_contratista?.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={charts.tipo_contratista} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value">
                      {charts.tipo_contratista.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<TT />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : EMPTY}
            </ChartCard>

          </div>
        </>
      )}
    </div>
  )
}
