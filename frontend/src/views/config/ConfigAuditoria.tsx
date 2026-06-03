import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { herramientasService } from '@/services/herramientas.service'
import { toast } from 'react-hot-toast'
import { Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

const ACCIONES = [
  'LOGIN', 'LOGOUT', 'CREAR', 'ACTUALIZAR', 'ELIMINAR',
  'ASIGNAR_ROL', 'QUITAR_ROL', 'RESET_PASSWORD', 'VER',
]

function exportCSV(rows: ReturnType<typeof buildRows>) {
  const header = ['Fecha', 'Actor', 'Acción', 'Entidad', 'Detalle']
  const lines = [
    header.join(';'),
    ...rows.map(r => [r.fecha, r.actor, r.accion, r.entidad, `"${(r.detalle ?? '').replace(/"/g, '""')}"`].join(';')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function buildRows(logs: Awaited<ReturnType<typeof herramientasService.listarAuditoria>>) {
  return logs.map(l => ({
    id:      l.id,
    fecha:   l.fecha ? `${l.fecha.slice(0, 10)} ${l.fecha.slice(11, 16)}` : '—',
    actor:   l.actor_nombre || '—',
    accion:  l.accion       || '—',
    entidad: l.entidad       || '—',
    detalle: l.descripcion  || '—',
  }))
}

export default function ConfigAuditoria() {
  // ── filtros ──────────────────────────────────────────────────────
  const [buscar,   setBuscar]   = useState('')
  const [accion,   setAccion]   = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(1)

  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['config_auditoria'],
    queryFn:  () => herramientasService.listarAuditoria({ limit: 2000 }),
  })

  const rows = useMemo(() => buildRows(logs), [logs])

  const filtrados = useMemo(() => {
    let r = rows
    if (buscar.trim()) {
      const q = buscar.trim().toLowerCase()
      r = r.filter(l =>
        l.actor.toLowerCase().includes(q) ||
        l.accion.toLowerCase().includes(q) ||
        l.entidad.toLowerCase().includes(q) ||
        l.detalle.toLowerCase().includes(q)
      )
    }
    if (accion) r = r.filter(l => l.accion === accion)
    if (fechaDesde) r = r.filter(l => l.fecha >= fechaDesde)
    if (fechaHasta) r = r.filter(l => l.fecha.slice(0, 10) <= fechaHasta)
    return r
  }, [rows, buscar, accion, fechaDesde, fechaHasta])

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtrados.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // reset page when filters change
  const resetPage = () => setPage(1)

  // ── styles ───────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-elevated)', color: 'var(--text-primary)',
    fontSize: '0.82rem', outline: 'none',
  }
  const thStyle: React.CSSProperties = {
    textAlign: 'left', fontSize: '0.67rem', textTransform: 'uppercase',
    letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600,
    padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)',
    whiteSpace: 'nowrap',
  }
  const tdStyle: React.CSSProperties = {
    padding: '9px 12px', verticalAlign: 'middle', fontSize: '0.83rem',
  }

  // ── loading / error ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando auditoría…
      </div>
    )
  }

  if (isError) {
    toast.error('Error al cargar auditoría')
    return <div style={{ color: 'var(--danger-500)', fontSize: '0.83rem' }}>Error al cargar auditoría.</div>
  }

  // ── render ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'grid', gap: '14px' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Auditoría de acciones</h2>
        <button
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          onClick={() => exportCSV(filtrados)}
          title="Exportar resultados filtrados como CSV"
        >
          <Download size={13} /> Exportar CSV
        </button>
      </div>

      {/* Barra de filtros */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
        padding: '10px 12px', border: '1px solid var(--border-subtle)',
      }}>
        <Filter size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />

        <input
          placeholder="Buscar…"
          value={buscar}
          onChange={e => { setBuscar(e.target.value); resetPage() }}
          style={{ ...inputStyle, flex: '1 1 140px', minWidth: '120px' }}
        />

        <select
          value={accion}
          onChange={e => { setAccion(e.target.value); resetPage() }}
          style={{ ...inputStyle, flex: '0 1 150px' }}
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Desde
          <input
            type="date"
            value={fechaDesde}
            onChange={e => { setFechaDesde(e.target.value); resetPage() }}
            style={{ ...inputStyle, paddingTop: '5px', paddingBottom: '5px' }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={e => { setFechaHasta(e.target.value); resetPage() }}
            style={{ ...inputStyle, paddingTop: '5px', paddingBottom: '5px' }}
          />
        </label>

        {(buscar || accion || fechaDesde || fechaHasta) && (
          <button
            className="btn-ghost"
            style={{ fontSize: '0.78rem', padding: '5px 10px' }}
            onClick={() => { setBuscar(''); setAccion(''); setFechaDesde(''); setFechaHasta(''); setPage(1) }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Conteo */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
        {filtrados.length !== rows.length && ` de ${rows.length} entradas`}
        {' · '}página {safePage} de {totalPages}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Actor</th>
              <th style={thStyle}>Acción</th>
              <th style={thStyle}>Entidad</th>
              <th style={{ ...thStyle, width: '40%' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  Sin resultados para los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginated.map((l, idx) => (
                <tr
                  key={l.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.04))')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)')}
                >
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{l.fecha}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{l.actor}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
                      letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '999px',
                      background: 'var(--primary-500, #0F172A)22',
                      color: 'var(--primary-400)',
                      border: '1px solid var(--primary-500, #0F172A)44',
                    }}>
                      {l.accion}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{l.entidad}</td>
                  <td style={{ ...tdStyle, fontSize: '0.79rem', color: 'var(--text-secondary, var(--text-muted))' }}>{l.detalle}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            className="btn-ghost"
            style={{ padding: '5px 8px' }}
            disabled={safePage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={15} />
          </button>

          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            // ventana de páginas centrada en la actual
            const half  = 3
            let start = Math.max(1, safePage - half)
            const end   = Math.min(totalPages, start + 6)
            start = Math.max(1, end - 6)
            return start + i
          }).filter(p => p >= 1 && p <= totalPages).map(p => (
            <button
              key={p}
              className={p === safePage ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '4px 10px', fontSize: '0.82rem', minWidth: '32px' }}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}

          <button
            className="btn-ghost"
            style={{ padding: '5px 8px' }}
            disabled={safePage === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
