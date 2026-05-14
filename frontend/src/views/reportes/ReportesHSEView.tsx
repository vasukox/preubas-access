/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Reportes HSE — Historial y trazabilidad de cumplimientos.
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import {
  ShieldCheck, Download, Search,
  ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle2, XCircle, Archive, SlidersHorizontal,
} from 'lucide-react'
import { useSedeStore } from '@/store/sedeStore'
import { hseService } from '@/services/hse.service'
import type { ReporteCumplimientoRow } from '@/types/hse'

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(val: string | null | undefined) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' })
}

function fmtDateTime(val: string | null | undefined) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ── Componentes pequeños ──────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</span>
      )}
    </div>
  )
}

function QuickDate({ label, days, current, onClick }: { label: string; days: number; current: number | null; onClick: () => void }) {
  const active = current === days
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 11px', fontSize: '0.73rem', fontWeight: 600,
        background: active ? 'var(--primary-500)' : 'var(--bg-elevated)',
        border: `1px solid ${active ? 'var(--primary-500)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-md)',
        color: active ? '#fff' : 'var(--text-secondary)',
        cursor: 'pointer', fontFamily: 'var(--font-mono)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ── Fila de tabla ─────────────────────────────────────────────────
function Fila({ row }: { row: ReporteCumplimientoRow }) {
  const aprobada = row.estado === 'COMPLETADO'
  const tasa     = row.total_items > 0 ? Math.round((row.items_cumplen / row.total_items) * 100) : 0

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Contratista */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
          {row.contratista_nombre}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {row.tipo_documento} {row.numero_documento}
          {row.autorizacion_codigo ? <span style={{ color: 'var(--text-secondary)' }}> · {row.autorizacion_codigo}</span> : null}
        </div>
      </td>

      {/* Encargado */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <span style={{ fontSize: '0.8rem', color: row.encargado_nombre ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {row.encargado_nombre ?? '—'}
        </span>
      </td>

      {/* Fecha cierre */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {fmtDateTime(row.fecha_cierre)}
        </span>
      </td>

      {/* % Cumplimiento */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle', minWidth: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            flex: 1, height: '5px', background: 'var(--bg-elevated)',
            borderRadius: '999px', overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: `${tasa}%`, height: '100%',
              background: tasa === 100
                ? 'var(--success-400)'
                : tasa >= 50
                  ? 'var(--primary-400)'
                  : 'var(--danger-400)',
              borderRadius: '999px',
            }} />
          </div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'right' }}>
            {tasa}%
          </span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
          {row.items_cumplen} / {row.total_items} ítems
        </div>
      </td>

      {/* Resultado */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          {aprobada
            ? <CheckCircle2 size={13} color="var(--success-400)" />
            : <XCircle size={13} color="var(--danger-400)" />
          }
          <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: aprobada ? 'var(--success-400)' : 'var(--danger-400)',
          }}>
            {aprobada ? 'Aprobada' : 'No aprobada'}
          </span>
        </div>
      </td>

      {/* Archivado */}
      <td style={{ padding: '13px 16px', verticalAlign: 'middle', textAlign: 'center' }}>
        {row.archivado
          ? <Archive size={13} color="var(--text-muted)" title="Archivado automáticamente" />
          : <span style={{ fontSize: '0.68rem', color: 'var(--success-400)', fontWeight: 500 }}>Reciente</span>
        }
      </td>
    </tr>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function ReportesHSEView() {
  const sedeActiva = useSedeStore(s => s.sedeActiva)
  const sedeId     = sedeActiva?.id ?? null

  const [fechaInicio,    setFechaInicio]    = useState(daysAgo(30))
  const [fechaFin,       setFechaFin]       = useState(today())
  const [estado,         setEstado]         = useState('')
  const [busqueda,       setBusqueda]       = useState('')
  const [page,           setPage]           = useState(1)
  const [quickDays,      setQuickDays]      = useState<number | null>(30)
  const [showFiltros,    setShowFiltros]    = useState(false)
  const PAGE_SIZE = 50

  const params = {
    sede_id:      sedeId ?? undefined,
    fecha_inicio: fechaInicio,
    fecha_fin:    fechaFin,
    estado:       estado || undefined,
    page,
    limit: PAGE_SIZE,
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey:  ['reporte_cumplimiento', params],
    queryFn:   () => hseService.getReporteCumplimiento(params),
    enabled:   Boolean(sedeId),
    staleTime: 30_000,
  })

  const rows = useMemo(() => {
    const src  = data?.data ?? []
    const term = busqueda.trim().toLowerCase()
    if (!term) return src
    return src.filter(r =>
      r.contratista_nombre.toLowerCase().includes(term) ||
      r.numero_documento.toLowerCase().includes(term) ||
      (r.autorizacion_codigo?.toLowerCase().includes(term) ?? false) ||
      (r.encargado_nombre?.toLowerCase().includes(term) ?? false),
    )
  }, [data?.data, busqueda])

  // KPIs
  const total      = data?.total  ?? 0
  const aprobadas  = data?.data?.filter(r => r.estado === 'COMPLETADO').length     ?? 0
  const noAprobadas = data?.data?.filter(r => r.estado === 'INCUMPLIMIENTO').length ?? 0
  const tasaAprobacion = total > 0 ? Math.round((aprobadas / (data?.data?.length ?? 1)) * 100) : 0

  // Quick date helper
  function applyQuickDate(days: number) {
    setFechaInicio(daysAgo(days))
    setFechaFin(today())
    setQuickDays(days)
    setPage(1)
  }

  // Export Excel
  function handleExport() {
    if (!rows.length) return
    const wsData = [
      ['ID', 'Contratista', 'Tipo Doc.', 'Nº Documento', 'Autorización',
       'Encargado', 'Fecha inicio', 'Fecha cierre', 'Resultado',
       'Total ítems', 'Cumplen', 'No cumplen', '% Cumplimiento', 'Archivado', 'Observación'],
      ...rows.map(r => [
        r.id,
        r.contratista_nombre,
        r.tipo_documento,
        r.numero_documento,
        r.autorizacion_codigo ?? '',
        r.encargado_nombre ?? '',
        fmtDate(r.fecha_inicio),
        fmtDate(r.fecha_cierre),
        r.estado === 'COMPLETADO' ? 'Aprobada' : 'No aprobada',
        r.total_items,
        r.items_cumplen,
        r.items_nos_cumplen,
        r.total_items > 0 ? `${Math.round((r.items_cumplen / r.total_items) * 100)}%` : '0%',
        r.archivado ? 'Sí' : 'No',
        r.observacion_general ?? '',
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [
      { wch: 6 }, { wch: 30 }, { wch: 9 }, { wch: 15 }, { wch: 16 },
      { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
      { wch: 10 }, { wch: 9 }, { wch: 10 }, { wch: 14 },
      { wch: 9 }, { wch: 35 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cumplimiento HSE')
    XLSX.writeFile(wb, `cumplimiento_${fechaInicio}_${fechaFin}.xlsx`)
  }

  const totalPages = data?.pages ?? 1

  if (!sedeId) {
    return (
      <div style={{ padding: '40px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Selecciona una sede para ver los reportes.
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
            <ShieldCheck size={13} color="var(--success-400)" />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--success-400)', fontFamily: 'var(--font-mono)' }}>
              REPORTES HSE
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Reporte de Cumplimiento
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {sedeActiva?.nombre} · {fmtDate(fechaInicio)} – {fmtDate(fechaFin)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => void refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 12px', background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <RefreshCw size={13} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            {isFetching ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            onClick={handleExport}
            disabled={!rows.length}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px',
              background: rows.length ? 'var(--bg-surface)' : 'var(--bg-elevated)',
              border: `1px solid ${rows.length ? 'var(--success-400)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              color: rows.length ? 'var(--success-400)' : 'var(--text-muted)',
              fontSize: '0.78rem', fontWeight: 600,
              cursor: rows.length ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <Download size={13} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total registros" value={total} />
        <StatCard label="Aprobadas" value={aprobadas} sub={total > 0 ? `${tasaAprobacion}% del período` : undefined} />
        <StatCard label="No aprobadas" value={noAprobadas} />
        <StatCard label="Período" value={quickDays ? `${quickDays}d` : 'Personalizado'} sub={`${fmtDate(fechaInicio)} – ${fmtDate(fechaFin)}`} />
      </div>

      {/* ── Filtros ── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '16px',
        overflow: 'hidden',
      }}>
        {/* Barra superior siempre visible */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cédula o código de autorización…"
              style={{
                width: '100%', padding: '8px 12px 8px 32px', fontSize: '0.82rem',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', outline: 'none',
              }}
            />
          </div>

          {/* Accesos rápidos de rango */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {([7, 30, 90] as const).map(d => (
              <QuickDate key={d} label={`${d}d`} days={d} current={quickDays} onClick={() => applyQuickDate(d)} />
            ))}
          </div>

          {/* Toggle filtros avanzados */}
          <button
            onClick={() => setShowFiltros(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 11px', fontSize: '0.75rem',
              background: showFiltros ? 'var(--bg-elevated)' : 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <SlidersHorizontal size={12} />
            Filtros
          </button>
        </div>

        {/* Filtros avanzados (colapsables) */}
        {showFiltros && (
          <div style={{
            padding: '0 16px 14px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '14px',
            display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>DESDE</label>
              <input
                type="date" value={fechaInicio} max={fechaFin}
                onChange={e => { setFechaInicio(e.target.value); setQuickDays(null); setPage(1) }}
                style={{
                  padding: '7px 10px', fontSize: '0.8rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>HASTA</label>
              <input
                type="date" value={fechaFin} min={fechaInicio}
                onChange={e => { setFechaFin(e.target.value); setQuickDays(null); setPage(1) }}
                style={{
                  padding: '7px 10px', fontSize: '0.8rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em' }}>RESULTADO</label>
              <select
                value={estado}
                onChange={e => { setEstado(e.target.value); setPage(1) }}
                style={{
                  padding: '7px 10px', fontSize: '0.8rem',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                <option value="">Todos</option>
                <option value="COMPLETADO">Aprobadas</option>
                <option value="INCUMPLIMIENTO">No aprobadas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabla ── */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '48px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            <div style={{ width: 16, height: 16, border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Cargando reporte…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '6px' }}>No hay registros para los filtros seleccionados.</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>Intenta con un rango de fechas más amplio.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                    {[
                      { label: 'Contratista',   w: undefined  },
                      { label: 'Encargado',      w: '160px'   },
                      { label: 'Fecha cierre',   w: '160px'   },
                      { label: 'Cumplimiento',   w: '150px'   },
                      { label: 'Resultado',      w: '130px'   },
                      { label: 'Estado',         w: '90px'    },
                    ].map(col => (
                      <th key={col.label} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em',
                        color: 'var(--text-muted)', whiteSpace: 'nowrap',
                        width: col.w,
                      }}>
                        {col.label.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => <Fila key={row.id} row={row} />)}
                </tbody>
              </table>
            </div>

            {/* Footer: conteo + paginación */}
            <div style={{
              padding: '11px 16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {rows.length !== total
                  ? `${rows.length} filtrados de ${total} registros`
                  : `${total} registro${total !== 1 ? 's' : ''}`
                }
              </span>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
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
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
