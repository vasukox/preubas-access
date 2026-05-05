import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Filter, Search, Users, UserX } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { getErrorMessage } from '@/services/api'
import { hseService } from '@/services/hse.service'
import { ConfirmActionModal } from '@/components/feedback/ConfirmActionModal'
import type { EstadoContratista } from '@/types/hse'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-elevated))',
      }}
    >
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

export default function ConfigUsuariosGenerales() {
  const queryClient = useQueryClient()
  const ITEMS_POR_SEDE = 8

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoContratista>('todos')
  const [filtroSede, setFiltroSede] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'ALTO_RIESGO' | 'NORMAL'>('todos')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [usuarioObjetivo, setUsuarioObjetivo] = useState<ContratistaRow | null>(null)
  const [motivoEliminacion, setMotivoEliminacion] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [paginasPorSede, setPaginasPorSede] = useState<Record<string, number>>({})

  useEffect(() => {
    setPaginasPorSede({})
  }, [busqueda, filtroEstado, filtroSede, filtroTipo])

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<{ rows: ContratistaRow[]; sedes: { id: number; nombre: string }[] }>({
    queryKey: ['config', 'usuarios-generales'],
    queryFn: async () => {
      const [sedes, proveedores] = await Promise.all([
        hseService.getSedes(),
        hseService.getProveedores().catch(() => []),
      ])

      const proveedoresMap = new Map<number, string>()
      for (const p of proveedores) proveedoresMap.set(p.id, p.nombre)

      const rows: ContratistaRow[] = []

      for (const sede of sedes) {
        const perPage = 100
        const maxPages = 20
        let page = 1

        while (page <= maxPages) {
          const chunk = await hseService.listarAutorizaciones({
            sede_id: sede.id,
            page,
            per_page: perPage,
          })

          for (const a of chunk) {
            const proveedorNombre = a.proveedor_id ? (proveedoresMap.get(a.proveedor_id) || `Proveedor #${a.proveedor_id}`) : 'Sin empresa'
            for (const c of a.contratistas || []) {
              rows.push({
                id: c.id,
                nombre: `${c.nombres} ${c.apellidos}`.trim(),
                email: c.email,
                tipo_documento: c.tipo_documento,
                numero_documento: c.numero_documento,
                estado: c.estado,
                sede_id: sede.id,
                sede_nombre: sede.nombre,
                autorizacion_codigo: a.codigo,
                proveedor_nombre: proveedorNombre,
                tipo_contratista: a.tipo_contratista,
              })
            }
          }

          if (chunk.length < perPage) break
          page += 1
        }
      }

      return {
        rows,
        sedes: sedes.map((s) => ({ id: s.id, nombre: s.nombre })),
      }
    },
    staleTime: 30_000,
  })

  const rows = data?.rows || []
  const sedes = data?.sedes || []

  const usuariosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()

    return rows.filter((u) => {
      if (filtroEstado !== 'todos' && u.estado !== filtroEstado) return false

      if (filtroSede !== 'todos' && String(u.sede_id) !== filtroSede) return false

      if (filtroTipo !== 'todos' && u.tipo_contratista !== filtroTipo) return false

      if (!q) return true

      return (
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.numero_documento.toLowerCase().includes(q) ||
        u.proveedor_nombre.toLowerCase().includes(q) ||
        u.sede_nombre.toLowerCase().includes(q) ||
        u.autorizacion_codigo.toLowerCase().includes(q)
      )
    })
  }, [rows, busqueda, filtroEstado, filtroSede, filtroTipo])

  const gruposPorSede = useMemo(() => {
    const acc = new Map<string, { key: string; sedeLabel: string; items: ContratistaRow[] }>()

    for (const u of usuariosFiltrados) {
      const key = `sede-${u.sede_id}`
      const sedeLabel = u.sede_nombre
      if (!acc.has(key)) acc.set(key, { key, sedeLabel, items: [] })
      acc.get(key)!.items.push(u)
    }

    return Array.from(acc.values())
      .map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      }))
      .sort((a, b) => a.sedeLabel.localeCompare(b.sedeLabel))
  }, [usuariosFiltrados])

  const total = rows.length
  const aprobados = rows.filter((u) => u.estado === 'APROBADO').length
  const enRevision = rows.filter((u) => u.estado === 'EN_REVISION').length
  const denegados = rows.filter((u) => u.estado === 'DENEGADO').length
  const sedesConUsuarios = new Set(rows.map((u) => u.sede_id)).size

  const abrirEliminar = (u: ContratistaRow) => {
    setUsuarioObjetivo(u)
    setMotivoEliminacion('')
    setConfirmOpen(true)
  }

  const confirmarEliminar = async () => {
    if (!usuarioObjetivo) return
    const motivo = motivoEliminacion.trim()
    if (motivo.length < 8) {
      toast.error('Debes escribir un motivo de al menos 8 caracteres.')
      return
    }

    try {
      setDeleting(true)
      await hseService.eliminarContratista(usuarioObjetivo.id, { motivo })
      toast.success(`Contratista ${usuarioObjetivo.nombre} eliminado.`)
      setConfirmOpen(false)
      setUsuarioObjetivo(null)
      setMotivoEliminacion('')
      queryClient.invalidateQueries({ queryKey: ['config', 'usuarios-generales'] })
      queryClient.invalidateQueries({ queryKey: ['hse', 'autorizaciones'] })
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Cargando contratistas del aplicativo...</div>
  }

  if (isError) {
    return (
      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ fontSize: '0.84rem', color: 'var(--danger-400)' }}>
          No se pudo cargar el listado global de contratistas.
        </div>
        <button className="btn-ghost" onClick={() => refetch()} style={{ width: 'fit-content' }}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gap: '14px' }}>
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px',
            background:
              'radial-gradient(120% 120% at 0% 0%, rgba(56,189,248,0.10) 0%, rgba(56,189,248,0) 45%), linear-gradient(180deg, var(--bg-surface), var(--bg-elevated))',
            display: 'grid',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={15} color="var(--primary-400)" />
            <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Usuarios reales del aplicativo (Contratistas)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <StatCard label="Total contratistas" value={total} color="var(--text-primary)" />
            <StatCard label="Aprobados" value={aprobados} color="var(--success-400)" />
            <StatCard label="En revisión" value={enRevision} color="var(--primary-400)" />
            <StatCard label="Denegados" value={denegados} color="var(--danger-400)" />
            <StatCard label="Sedes con contratistas" value={sedesConUsuarios} color="var(--text-secondary)" />
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '14px',
            display: 'grid',
            gap: '10px',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filtros</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, cédula, empresa, código o sede..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 32px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                }}
              />
            </div>

            <select
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
              style={{
                padding: '9px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="todos">Todas las sedes</option>
              {sedes.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'ALTO_RIESGO' | 'NORMAL')}
              style={{
                padding: '9px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="todos">Todos los tipos</option>
              <option value="ALTO_RIESGO">ALTO_RIESGO</option>
              <option value="NORMAL">NORMAL</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todos' | EstadoContratista)}
              style={{
                padding: '9px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE_AUTOGESTION">PENDIENTE_AUTOGESTION</option>
              <option value="AUTOGESTION_EN_PROGRESO">AUTOGESTION_EN_PROGRESO</option>
              <option value="AUTOGESTION_COMPLETADA">AUTOGESTION_COMPLETADA</option>
              <option value="EN_REVISION">EN_REVISION</option>
              <option value="APROBADO">APROBADO</option>
              <option value="DENEGADO">DENEGADO</option>
            </select>
          </div>
        </div>

        {gruposPorSede.length === 0 ? (
          <div
            style={{
              border: '1px dashed var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: '30px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
            }}
          >
            No hay usuarios para los filtros aplicados.
            No hay contratistas para los filtros aplicados.
          </div>
        ) : (
          gruposPorSede.map((grupo) => (
            <section
              key={grupo.key}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
              }}
            >
              {(() => {
                const totalPages = Math.max(1, Math.ceil(grupo.items.length / ITEMS_POR_SEDE))
                const currentPage = Math.min(paginasPorSede[grupo.key] || 1, totalPages)
                const start = (currentPage - 1) * ITEMS_POR_SEDE
                const end = start + ITEMS_POR_SEDE
                const usuariosPagina = grupo.items.slice(start, end)

                return (
                  <>
              <header
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={14} color="var(--text-secondary)" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {grupo.sedeLabel}
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {grupo.items.length} contratista{grupo.items.length !== 1 ? 's' : ''} · Página {currentPage}/{totalPages}
                </span>
              </header>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Contratista</th>
                      <th style={thStyle}>Documento</th>
                      <th style={thStyle}>Empresa</th>
                      <th style={thStyle}>Autorización</th>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Estado</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosPagina.map((u, idx) => (
                      <tr
                        key={`usr-global-${u.id}`}
                        style={{ borderBottom: idx < usuariosPagina.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>{u.nombre}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {u.tipo_documento} {u.numero_documento}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.proveedor_nombre}</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{u.autorizacion_codigo}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-elevated)',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            {u.tipo_contratista}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '4px 8px',
                              borderRadius: '999px',
                              border: `1px solid ${estadoColor(u.estado).border}`,
                              color: estadoColor(u.estado).text,
                              background: estadoColor(u.estado).bg,
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {u.estado}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                            onClick={() => abrirEliminar(u)}
                          >
                            <UserX size={12} />
                            Eliminar contratista
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Mostrando {start + 1}-{Math.min(end, grupo.items.length)} de {grupo.items.length}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setPaginasPorSede((prev) => ({
                          ...prev,
                          [grupo.key]: Math.max(1, currentPage - 1),
                        }))
                      }
                    >
                      Anterior
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPaginasPorSede((prev) => ({
                          ...prev,
                          [grupo.key]: Math.min(totalPages, currentPage + 1),
                        }))
                      }
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
                  </>
                )
              })()}
            </section>
          ))
        )}
      </div>

      <ConfirmActionModal
        open={confirmOpen}
        title="Eliminar contratista"
        message={`Vas a eliminar el contratista ${usuarioObjetivo?.nombre || ''}. Esta acción lo retira del flujo HSE activo.`}
        confirmLabel="Eliminar contratista"
        cancelLabel="Cancelar"
        tone="danger"
        loading={deleting}
        onCancel={() => {
          if (deleting) return
          setConfirmOpen(false)
          setUsuarioObjetivo(null)
          setMotivoEliminacion('')
        }}
        onConfirm={confirmarEliminar}
      >
        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Motivo de eliminación
        </label>
        <textarea
          value={motivoEliminacion}
          onChange={(e) => setMotivoEliminacion(e.target.value)}
          rows={3}
          placeholder="Ejemplo: Contratista retirado del proceso por solicitud del área operativa."
          style={{
            width: '100%',
            padding: '9px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            resize: 'vertical',
          }}
        />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '5px' }}>
          Mínimo 8 caracteres.
        </div>
      </ConfirmActionModal>
    </>
  )
}

type ContratistaRow = {
  id: number
  nombre: string
  email: string
  tipo_documento: string
  numero_documento: string
  estado: EstadoContratista
  sede_id: number
  sede_nombre: string
  autorizacion_codigo: string
  proveedor_nombre: string
  tipo_contratista: 'ALTO_RIESGO' | 'NORMAL'
}

function estadoColor(estado: EstadoContratista): { text: string; bg: string; border: string } {
  const map: Record<EstadoContratista, { text: string; bg: string; border: string }> = {
    PENDIENTE_AUTOGESTION: { text: 'var(--text-muted)', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.35)' },
    AUTOGESTION_EN_PROGRESO: { text: 'var(--primary-400)', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.35)' },
    AUTOGESTION_COMPLETADA: { text: '#6366F1', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.35)' },
    EN_REVISION: { text: 'var(--warning-500)', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.35)' },
    APROBADO: { text: 'var(--success-400)', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.35)' },
    DENEGADO: { text: 'var(--danger-400)', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)' },
  }
  return map[estado]
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  fontWeight: 700,
  padding: '11px 14px',
  borderBottom: '1px solid var(--border-subtle)',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
}
