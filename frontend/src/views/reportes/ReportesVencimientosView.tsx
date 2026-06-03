/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Reporte de Vencimientos HSE — Semáforo de autorizaciones por fecha de vencimiento.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, Users, ChevronLeft, FileDown } from 'lucide-react'
import { useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type { ReporteVencimientoRow } from '@/types/hse'

// ── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Colores del semáforo ──────────────────────────────────────────────
const SEMAFORO_COLOR: Record<string, string> = {
  vencido:     'var(--danger-400)',
  critico:     '#f97316',
  advertencia: '#f59e0b',
  ok:          'var(--success-400)',
}

const SEMAFORO_BG: Record<string, string> = {
  vencido:     'rgba(220,38,38,0.1)',
  critico:     'rgba(249,115,22,0.1)',
  advertencia: 'rgba(245,158,11,0.1)',
  ok:          'rgba(34,197,94,0.1)',
}

const SEMAFORO_LABEL: Record<string, string> = {
  vencido:     'Vencido',
  critico:     'Crítico (≤7 días)',
  advertencia: 'Advertencia (8-15 días)',
  ok:          'En tiempo',
}

// ── Estado auth badge ─────────────────────────────────────────────────
const ESTADO_LABEL: Record<string, string> = {
  BORRADOR:              'Borrador',
  PENDIENTE_AUTOGESTION: 'Pend. Autogestión',
  EN_REVISION:           'En Revisión',
  APROBADO:              'Aprobado',
  DENEGADO:              'Denegado',
  VENCIDO:               'Vencido',
}

function estadoBadgeStyle(estado: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 'var(--radius-sm)',
    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  }
  switch (estado) {
    case 'APROBADO':
      return { ...base, background: 'rgba(34,197,94,0.1)', color: 'var(--success-400)' }
    case 'EN_REVISION':
      return { ...base, background: 'rgba(29, 78, 216,0.12)', color: 'var(--info-400)' }
    case 'DENEGADO':
    case 'VENCIDO':
      return { ...base, background: 'rgba(220,38,38,0.1)', color: 'var(--danger-400)' }
    case 'PENDIENTE_AUTOGESTION':
      return { ...base, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    default:
      return { ...base, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, color }: {
  label: string; value: number; color: string
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderTop: `3px solid ${color}`,
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '4px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color, lineHeight: 1 }}>
        {value}
      </span>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────
type FiltroSemaforo = 'todos' | 'vencido' | 'critico' | 'advertencia' | 'ok'

export default function ReportesVencimientosView() {
  const navigate    = useNavigate()
  const sedeActiva  = useSedeStore(s => s.sedeActiva)
  const sedeId      = sedeActiva?.id ?? null

  const [rows,    setRows]    = useState<ReporteVencimientoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [filtro,  setFiltro]  = useState<FiltroSemaforo>('todos')

  async function handleExport() {
    const target = filtro === 'todos' ? rows : rows.filter(r => r.semaforo === filtro)
    if (!target.length) return
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Vencimientos')
    ws.columns = [
      { header: 'Código',            key: 'codigo',           width: 16 },
      { header: 'Estado',            key: 'estado',           width: 20 },
      { header: 'Semáforo',          key: 'semaforo',         width: 14 },
      { header: 'Días restantes',    key: 'diasRestantes',    width: 14 },
      { header: 'Tipo contratista',  key: 'tipo_contratista', width: 16 },
      { header: 'Fecha inicio',      key: 'fecha_inicio',     width: 16 },
      { header: 'Fecha fin',         key: 'fecha_fin',        width: 16 },
      { header: 'Proveedor',         key: 'proveedor',        width: 32 },
      { header: 'Responsable',       key: 'responsable',      width: 28 },
      { header: 'Contratistas',      key: 'contratistas',     width: 12 },
    ]
    const SEMAFORO_LABEL_ES: Record<string, string> = {
      vencido: 'Vencido', critico: 'Crítico (≤7d)', advertencia: 'Advertencia (8-15d)', ok: 'En tiempo',
    }
    target.forEach(r => ws.addRow({
      codigo:          r.codigo,
      estado:          r.estado,
      semaforo:        SEMAFORO_LABEL_ES[r.semaforo] ?? r.semaforo,
      diasRestantes:   r.diasRestantes,
      tipo_contratista: r.tipo_contratista === 'ALTO_RIESGO' ? 'Alto Riesgo' : 'Normal',
      fecha_inicio:    fmtDate(r.fecha_inicio),
      fecha_fin:       fmtDate(r.fecha_fin),
      proveedor:       r.proveedor_nombre  ?? '—',
      responsable:     r.responsable_nombre ?? '—',
      contratistas:    r.total_contratistas,
    }))
    const buf  = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `vencimientos_${sedeActiva?.nombre ?? 'sede'}_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click(); URL.revokeObjectURL(url)
  }

  async function fetchData() {
    if (!sedeId) return
    setLoading(true)
    try {
      const data = await hseService.getReporteVencimientos({ sede_id: sedeId })
      setRows(data)
    } catch (err) {
      console.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeId])

  // KPIs
  const counts = useMemo(() => ({
    vencido:    rows.filter(r => r.semaforo === 'vencido').length,
    critico:    rows.filter(r => r.semaforo === 'critico').length,
    advertencia: rows.filter(r => r.semaforo === 'advertencia').length,
    ok:         rows.filter(r => r.semaforo === 'ok').length,
  }), [rows])

  const filtered = useMemo(() =>
    filtro === 'todos' ? rows : rows.filter(r => r.semaforo === filtro),
  [rows, filtro])

  if (!sedeId) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <Clock size={32} color="var(--text-muted)" strokeWidth={1.5} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Selecciona una sede para ver el reporte de vencimientos.
        </p>
      </div>
    )
  }

  const FILTROS: { id: FiltroSemaforo; label: string; count: number }[] = [
    { id: 'todos',     label: 'Todos',      count: rows.length },
    { id: 'vencido',   label: 'Vencidos',   count: counts.vencido },
    { id: 'critico',   label: 'Críticos',   count: counts.critico },
    { id: 'advertencia', label: 'Advertencia', count: counts.advertencia },
    { id: 'ok',        label: 'En tiempo',  count: counts.ok },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1280px' }}>

      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate('/reportes')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-ui)', marginBottom: '16px', padding: '0' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
      >
        <ChevronLeft size={14} /> Reportes
      </button>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
            <Clock size={13} color="var(--primary-400)" />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
              REPORTES HSE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Reporte de Vencimientos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {sedeActiva?.nombre} · Autorizaciones próximas a vencer (30 días)
          </p>
        </div>
        <button className="btn-ghost" onClick={() => void handleExport()} disabled={!rows.length} style={{ flexShrink: 0 }}>
          <FileDown size={13} />
          Exportar Excel {filtro !== 'todos' ? `(${filtered.length})` : `(${rows.length})`}
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Vencidas"    value={counts.vencido}    color={SEMAFORO_COLOR.vencido}    />
        <KpiCard label="Críticas"    value={counts.critico}    color={SEMAFORO_COLOR.critico}    />
        <KpiCard label="Advertencia" value={counts.advertencia} color={SEMAFORO_COLOR.advertencia} />
        <KpiCard label="En tiempo"   value={counts.ok}         color={SEMAFORO_COLOR.ok}         />
      </div>

      {/* ── Filtros semáforo (radio) ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {FILTROS.map(f => {
          const active = filtro === f.id
          const dotColor = f.id === 'todos' ? 'var(--primary-400)' : SEMAFORO_COLOR[f.id]
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px',
                background: active ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {f.id !== 'todos' && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              )}
              {f.label}
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px', borderRadius: '50%',
                background: active ? 'var(--border-default)' : 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                fontSize: '0.62rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
              }}>
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Cargando vencimientos…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <CheckCircle2 size={32} color="var(--success-400)" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {filtro === 'todos'
              ? 'No hay autorizaciones próximas a vencer.'
              : `No hay autorizaciones en estado "${SEMAFORO_LABEL[filtro]}".`}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Código', 'Proveedor', 'Tipo', 'Semáforo', 'Vencimiento', 'Estado', 'Contratistas', 'Responsable'].map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em',
                      color: 'var(--text-muted)', whiteSpace: 'nowrap',
                    }}>
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const sColor = SEMAFORO_COLOR[row.semaforo]
                  const sBg    = SEMAFORO_BG[row.semaforo]
                  const dias   = row.diasRestantes
                  return (
                    <tr
                      key={row.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
                          {row.codigo}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.proveedor_nombre ?? <span style={{ color: 'var(--text-muted)' }}>Sin proveedor</span>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 7px', borderRadius: 'var(--radius-sm)',
                          fontSize: '0.68rem', fontWeight: 700,
                          background: row.tipo_contratista === 'ALTO_RIESGO' ? 'rgba(245,158,11,0.1)' : 'rgba(29, 78, 216,0.08)',
                          color: row.tipo_contratista === 'ALTO_RIESGO' ? '#f59e0b' : 'var(--primary-400)',
                        }}>
                          {row.tipo_contratista === 'ALTO_RIESGO' ? 'Alto Riesgo' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem', fontWeight: 700,
                          background: sBg, color: sColor,
                        }}>
                          {SEMAFORO_LABEL[row.semaforo]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {fmtDate(row.fecha_fin)}
                        </div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: sColor }}>
                          {dias < 0
                            ? `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
                            : dias === 0
                              ? 'Vence hoy'
                              : `Vence en ${dias} día${dias !== 1 ? 's' : ''}`}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={estadoBadgeStyle(row.estado)}>
                          {ESTADO_LABEL[row.estado] ?? row.estado}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <Users size={11} />
                          <span>{row.total_contratistas}</span>
                          {row.aprobados > 0 && (
                            <span style={{ color: 'var(--success-400)' }}>· {row.aprobados} aprob.</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.78rem', color: row.responsable_nombre ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {row.responsable_nombre ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '11px 16px', borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filtered.length} autorización{filtered.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
