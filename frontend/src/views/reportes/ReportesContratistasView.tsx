/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Reporte de Contratistas HSE — Paginado con filtros y exportación Excel.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileDown, RefreshCw, Search, ChevronLeft, ChevronRight, Users,
} from 'lucide-react'
import { useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type { ReporteContratistaRow } from '@/types/hse'
import type { EstadoContratista } from '@/types/hse'

// ── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function today() { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_AUTOGESTION:   'Pendiente',
  AUTOGESTION_EN_PROGRESO: 'En Progreso',
  AUTOGESTION_COMPLETADA:  'Completada',
  EN_REVISION:             'En Revisión',
  APROBADO:                'Aprobado',
  DENEGADO:                'Denegado',
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
    case 'AUTOGESTION_COMPLETADA':
      return { ...base, background: 'rgba(29, 78, 216,0.12)', color: 'var(--info-400)' }
    case 'DENEGADO':
      return { ...base, background: 'rgba(220,38,38,0.1)', color: 'var(--danger-400)' }
    case 'AUTOGESTION_EN_PROGRESO':
      return { ...base, background: 'rgba(15, 23, 42,0.1)', color: 'var(--primary-400)' }
    case 'PENDIENTE_AUTOGESTION':
      return { ...base, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    default:
      return { ...base, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderTop: `3px solid ${color ?? 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '4px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
        {label.toUpperCase()}
      </span>
      <span style={{
        fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
        color: color ?? 'var(--text-primary)', lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────
export default function ReportesContratistasView() {
  const navigate    = useNavigate()
  const sedeActiva  = useSedeStore(s => s.sedeActiva)
  const sedeId      = sedeActiva?.id ?? null

  const [rows,        setRows]        = useState<ReporteContratistaRow[]>([])
  const [total,       setTotal]       = useState(0)
  const [totalPages,  setTotalPages]  = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [page,        setPage]        = useState(1)
  const [fechaInicio, setFechaInicio] = useState(daysAgo(30))
  const [fechaFin,    setFechaFin]    = useState(today())
  const [estado,      setEstado]      = useState('')
  const [busqueda,    setBusqueda]    = useState('')
  const PAGE_SIZE = 50

  async function fetchData(p: number = page) {
    if (!sedeId) return
    setLoading(true)
    try {
      const res = await hseService.getReporteContratistas({
        sede_id:      sedeId,
        estado:       estado as EstadoContratista || undefined,
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
        page:         p,
        limit:        PAGE_SIZE,
      })
      setRows(res.data)
      setTotal(res.total)
      setTotalPages(res.pages)
    } catch (err) {
      console.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData(1)
    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeId, fechaInicio, fechaFin, estado])

  // KPIs from current result
  const aprobados  = useMemo(() => rows.filter(r => r.estado === 'APROBADO').length,              [rows])
  const pendientes = useMemo(() => rows.filter(r => r.estado === 'PENDIENTE_AUTOGESTION').length, [rows])
  const denegados  = useMemo(() => rows.filter(r => r.estado === 'DENEGADO').length,             [rows])

  // Client-side search on current page
  const filtered = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(r =>
      r.nombres.toLowerCase().includes(term) ||
      r.apellidos.toLowerCase().includes(term) ||
      r.numero_documento.toLowerCase().includes(term),
    )
  }, [rows, busqueda])

  async function handleExport() {
    if (!rows.length) return
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reporte')
    ws.columns = [
      { header: 'Nombre completo',       key: 'nombre',          width: 30 },
      { header: 'Tipo Doc.',             key: 'tipo_documento',  width: 10 },
      { header: 'Nº Documento',          key: 'numero_documento', width: 16 },
      { header: 'Estado',                key: 'estado',          width: 22 },
      { header: 'Tipo contratista',      key: 'tipo_contratista', width: 16 },
      { header: 'Autorización',          key: 'autorizacion',    width: 16 },
      { header: 'Proveedor',             key: 'proveedor',       width: 28 },
      { header: 'Autogestión completada', key: 'autogestion',    width: 22 },
      { header: 'Creado',                key: 'creado',          width: 18 },
    ]
    rows.forEach(r => ws.addRow({
      nombre:          `${r.nombres} ${r.apellidos}`,
      tipo_documento:  r.tipo_documento,
      numero_documento: r.numero_documento,
      estado:          ESTADO_LABEL[r.estado] ?? r.estado,
      tipo_contratista: r.tipo_contratista === 'ALTO_RIESGO' ? 'Alto Riesgo' : 'Normal',
      autorizacion:    r.autorizacion_codigo ?? '—',
      proveedor:       r.proveedor_nombre   ?? '—',
      autogestion:     fmtDate(r.autogestion_completada_en),
      creado:          fmtDate(r.created_at),
    }))
    const buf  = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `contratistas_${fechaInicio}_${fechaFin}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  async function goToPage(p: number) {
    setPage(p)
    await fetchData(p)
  }

  if (!sedeId) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <Users size={32} color="var(--text-muted)" strokeWidth={1.5} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Selecciona una sede para ver el reporte de contratistas.
        </p>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', fontSize: '0.8rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)', outline: 'none',
    colorScheme: 'dark',
  }

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
            <Users size={13} color="var(--primary-400)" />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
              REPORTES HSE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Reporte de Contratistas
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {sedeActiva?.nombre} · {fmtDate(fechaInicio)} – {fmtDate(fechaFin)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn-ghost" onClick={() => void fetchData(page)}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
          <button className="btn-ghost" onClick={() => void handleExport()} disabled={!rows.length}>
            <FileDown size={13} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Total"     value={total}     color="var(--text-muted)" />
        <KpiCard label="Aprobados" value={aprobados} color="var(--success-400)" />
        <KpiCard label="Pendientes" value={pendientes} color="#f59e0b" />
        <KpiCard label="Denegados" value={denegados} color="var(--danger-400)" />
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '14px 16px',
        marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o documento…"
            style={{ ...inputStyle, width: '100%', paddingLeft: '32px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>DESDE</label>
          <input type="date" value={fechaInicio} max={fechaFin}
            onChange={e => setFechaInicio(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>HASTA</label>
          <input type="date" value={fechaFin} min={fechaInicio}
            onChange={e => setFechaFin(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
        </div>

        {/* Acceso rápido */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>ACCESO RÁPIDO</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([{ l: '7d', d: 7 }, { l: '30d', d: 30 }, { l: '90d', d: 90 }, { l: '6m', d: 180 }] as const).map(p => {
              const active = fechaInicio === daysAgo(p.d) && fechaFin === today()
              return (
                <button key={p.l} onClick={() => { setFechaInicio(daysAgo(p.d)); setFechaFin(today()) }} style={{ padding: '6px 9px', borderRadius: 'var(--radius-md)', background: active ? 'var(--bg-elevated)' : 'transparent', border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-subtle)'}`, color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.72rem', fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all var(--transition-fast)' }}>
                  {p.l}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>ESTADO</label>
          <select value={estado} onChange={e => setEstado(e.target.value)} style={inputStyle}>
            <option value="">Todos</option>
            <option value="PENDIENTE_AUTOGESTION">Pendiente</option>
            <option value="AUTOGESTION_EN_PROGRESO">En Progreso</option>
            <option value="AUTOGESTION_COMPLETADA">Completada</option>
            <option value="EN_REVISION">En Revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="DENEGADO">Denegado</option>
          </select>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Cargando reporte…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Users size={32} color="var(--text-muted)" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No hay contratistas para los filtros seleccionados.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Nombre completo', 'Documento', 'Estado', 'Tipo', 'Autorización', 'Proveedor', 'Autogestión', 'Creado'].map(col => (
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
                  {filtered.map(row => (
                    <tr key={row.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.nombres} {row.apellidos}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                          {row.tipo_documento}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {row.numero_documento}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={estadoBadgeStyle(row.estado)}>
                          {ESTADO_LABEL[row.estado] ?? row.estado}
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
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.8rem', color: row.autorizacion_codigo ? 'var(--primary-400)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {row.autorizacion_codigo ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.8rem', color: row.proveedor_nombre ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {row.proveedor_nombre ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {fmtDate(row.autogestion_completada_en)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {fmtDate(row.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer paginación */}
            <div style={{
              padding: '11px 16px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {filtered.length !== rows.length
                  ? `${filtered.length} filtrados de ${total} registros`
                  : `${total} registro${total !== 1 ? 's' : ''}`}
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => void goToPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    style={{
                      padding: '5px 9px', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)',
                      color: page <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '60px', textAlign: 'center' }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => void goToPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    style={{
                      padding: '5px 9px', border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)',
                      color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
