/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Reporte de Accesos HSE — Entradas y salidas por sede.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileDown, Search, LogIn, LogOut, Activity, ChevronLeft,
} from 'lucide-react'
import { useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type { ReporteAccesoRow } from '@/types/hse'

// ── Helpers ──────────────────────────────────────────────────────────
function fmtDate(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function today() { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}

// ── KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon }: {
  label: string; value: number; color?: string; icon?: React.ElementType
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
      borderTop: `3px solid ${color ?? 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '6px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {Icon && <Icon size={13} color={color ?? 'var(--text-muted)'} />}
        <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
          {label.toUpperCase()}
        </span>
      </div>
      <span style={{
        fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
        color: color ?? 'var(--text-primary)', lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Badge tipo acceso ─────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: 'ENTRADA' | 'SALIDA' }) {
  const isEntrada = tipo === 'ENTRADA'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '2px 8px', borderRadius: 'var(--radius-sm)',
      fontSize: '0.7rem', fontWeight: 700,
      background: isEntrada ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
      color: isEntrada ? 'var(--success-400)' : 'var(--text-muted)',
    }}>
      {isEntrada ? <LogIn size={10} /> : <LogOut size={10} />}
      {isEntrada ? 'Entrada' : 'Salida'}
    </span>
  )
}

// ── Vista principal ───────────────────────────────────────────────────
export default function ReportesAccesosView() {
  const navigate    = useNavigate()
  const sedeActiva  = useSedeStore(s => s.sedeActiva)
  const sedeId      = sedeActiva?.id ?? null

  const [rows,        setRows]        = useState<ReporteAccesoRow[]>([])
  const [loading,     setLoading]     = useState(false)
  const [fechaInicio, setFechaInicio] = useState(daysAgo(7))
  const [fechaFin,    setFechaFin]    = useState(today())
  const [busqueda,    setBusqueda]    = useState('')

  async function fetchData() {
    if (!sedeId) return
    setLoading(true)
    try {
      const data = await hseService.getReporteAccesos({
        sede_id:      sedeId,
        fecha_inicio: fechaInicio,
        fecha_fin:    fechaFin,
      })
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
  }, [sedeId, fechaInicio, fechaFin])

  // KPIs
  const totalEntradas   = useMemo(() => rows.filter(r => r.tipoAcceso === 'ENTRADA').length, [rows])
  const totalSalidas    = useMemo(() => rows.filter(r => r.tipoAcceso === 'SALIDA').length,  [rows])
  const unicosIds       = useMemo(() => new Set(rows.map(r => r.contratista_id)).size,       [rows])

  // Filtro cliente
  const filtered = useMemo(() => {
    const term = busqueda.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(r =>
      r.contratistaNombre.toLowerCase().includes(term) ||
      r.contratistaDoc.toLowerCase().includes(term),
    )
  }, [rows, busqueda])

  async function handleExport() {
    if (!rows.length) return
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reporte')
    ws.columns = [
      { header: 'Contratista',  key: 'contratistaNombre', width: 30 },
      { header: 'Documento',    key: 'contratistaDoc',    width: 16 },
      { header: 'Tipo Acceso',  key: 'tipoAcceso',        width: 12 },
      { header: 'Método',       key: 'metodo',            width: 16 },
      { header: 'Fecha / Hora', key: 'fecha',             width: 22 },
      { header: 'Registrado por', key: 'registradoPor',   width: 24 },
    ]
    filtered.forEach(r => ws.addRow({
      ...r,
      fecha:        fmtDateTime(r.fecha),
      registradoPor: r.registradoPor ?? '—',
    }))
    const buf  = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `accesos_${fechaInicio}_${fechaFin}.xlsx`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!sedeId) {
    return (
      <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <Activity size={32} color="var(--text-muted)" strokeWidth={1.5} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Selecciona una sede para ver el reporte de accesos.
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
            <Activity size={13} color="var(--primary-400)" />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
              REPORTES HSE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Reporte de Accesos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {sedeActiva?.nombre} · {fmtDate(fechaInicio)} – {fmtDate(fechaFin)}
          </p>
        </div>

        <button className="btn-ghost" onClick={() => void handleExport()} disabled={!rows.length}>
          <FileDown size={13} />
          Exportar Excel
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <KpiCard label="Total Accesos"       value={rows.length}   icon={Activity} color="var(--text-muted)" />
        <KpiCard label="Entradas"            value={totalEntradas} color="var(--success-400)" icon={LogIn} />
        <KpiCard label="Salidas"             value={totalSalidas}  color="var(--text-muted)"  icon={LogOut} />
        <KpiCard label="Contratistas únicos" value={unicosIds}     color="var(--primary-400)" />
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
            placeholder="Buscar por nombre o documento del contratista…"
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
      </div>

      {/* ── Tabla ── */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Cargando accesos…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Activity size={32} color="var(--text-muted)" strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No hay registros de acceso para los filtros seleccionados.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Contratista', 'Tipo', 'Método', 'Fecha / Hora', 'Registrado por'].map(col => (
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
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {row.contratistaNombre}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {row.contratistaDoc}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <TipoBadge tipo={row.tipoAcceso} />
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {row.metodo}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {fmtDateTime(row.fecha)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.8rem', color: row.registradoPor ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                          {row.registradoPor ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: '11px 16px', borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {filtered.length !== rows.length
                  ? `${filtered.length} filtrados de ${rows.length} registros`
                  : `${rows.length} registro${rows.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
