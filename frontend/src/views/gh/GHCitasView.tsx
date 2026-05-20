import { useMemo, useState, type ElementType } from 'react'
import { CalendarDays, CalendarCheck2, CalendarX2, Clock3 } from 'lucide-react'

import { useSedeStore } from '@/store'
import { useGHStore } from '@/store/ghStore'
import { useCambiarEstadoGHCita, useEliminarGHCita, useGHCitas } from '@/hooks/gh/useGHCitas'
import type { GhCita, GhEstadoCita, GhTipoCita } from '@/types/gh'
import { useQueryClient } from '@tanstack/react-query'

import { CitasFiltersBar } from './components/CitasFiltersBar'
import { CitasTable } from './components/CitasTable'
import { CitaFormModal } from './components/CitaFormModal'

function pct(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  badge,
}: {
  label: string
  value: number | string
  icon: ElementType
  color: string
  bg: string
  badge?: string
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${color}22`,
        borderRadius: 'var(--radius-xl)',
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}18` }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: bg, borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
          <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
          {badge ? (
            <div style={{ marginTop: '8px', display: 'inline-flex', padding: '2px 8px', background: bg, border: `1px solid ${color}44`, borderRadius: 'var(--radius-sm)', fontSize: '0.68rem', color, fontFamily: 'var(--font-mono)' }}>
              {badge}
            </div>
          ) : null}
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: bg, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

export default function GHCitasView() {
  const sedeActiva = useSedeStore((s) => s.sedeActiva)
  const sedeId = sedeActiva?.id ?? 0
  const {
    activeEstadoFilter,
    activeTipoCitaFilter,
    busquedaFilter,
    fechaDesdeFilter,
    fechaHastaFilter,
    page,
    perPage,
    setPagination,
    resetFilters,
  } = useGHStore()
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const cambiarEstadoMutation = useCambiarEstadoGHCita()
  const eliminarCitaMutation = useEliminarGHCita()

  const query = useMemo(
    () => ({
      sede_id: sedeId,
      estado: activeEstadoFilter ?? undefined,
      tipo_cita: (activeTipoCitaFilter as GhTipoCita) ?? undefined,
      busqueda: busquedaFilter || undefined,
      fecha_desde: fechaDesdeFilter ? new Date(fechaDesdeFilter).toISOString() : undefined,
      fecha_hasta: fechaHastaFilter ? new Date(fechaHastaFilter).toISOString() : undefined,
      page,
      per_page: perPage,
    }),
    [
      sedeId,
      activeEstadoFilter,
      activeTipoCitaFilter,
      busquedaFilter,
      fechaDesdeFilter,
      fechaHastaFilter,
      page,
      perPage,
    ],
  )

  const firstPageQuery = useMemo(
    () => ({
      ...query,
      page: 1,
    }),
    [query],
  )

  const { data = [], isLoading, isFetching, refetch } = useGHCitas(query)

  const matchesQuery = (cita: GhCita, targetQuery: typeof query) => {
    if (cita.sede_id !== targetQuery.sede_id) return false
    if (targetQuery.estado && cita.estado !== targetQuery.estado) return false
    if (targetQuery.tipo_cita && cita.tipo_cita !== targetQuery.tipo_cita) return false
    if (targetQuery.busqueda) {
      const term = targetQuery.busqueda.trim().toLowerCase()
      const hayMatch = [
        cita.codigo,
        cita.candidato.numero_documento,
        cita.candidato.nombres,
        cita.candidato.apellidos,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
      if (!hayMatch) return false
    }

    const inicio = new Date(cita.fecha_hora_inicio).getTime()
    if (targetQuery.fecha_desde && inicio < new Date(targetQuery.fecha_desde).getTime()) return false
    if (targetQuery.fecha_hasta && inicio > new Date(targetQuery.fecha_hasta).getTime()) return false
    return true
  }

  const syncCreatedCitas = (createdCitas: GhCita[]) => {
    if (!createdCitas.length) return

    setPagination(1, perPage)

    const visibles = createdCitas.filter((cita) => matchesQuery(cita, firstPageQuery))
    if (visibles.length) {
      queryClient.setQueryData<GhCita[]>(['gh', 'citas', firstPageQuery], (old = []) => {
        const merged = [...visibles, ...old]
        const deduped = merged.filter((cita, index, arr) => arr.findIndex((item) => item.id === cita.id) === index)
        deduped.sort(
          (a, b) =>
            new Date(b.fecha_hora_inicio).getTime() - new Date(a.fecha_hora_inicio).getTime(),
        )
        return deduped.slice(0, perPage)
      })
    }

    void queryClient.invalidateQueries({ queryKey: ['gh', 'citas'] })
    void queryClient.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
  }

  const metrics = useMemo(() => {
    const total = data.length
    const confirmadas = data.filter((cita) => cita.estado === 'CONFIRMADA').length
    const enCurso = data.filter((cita) => cita.estado === 'EN_CURSO').length
    const noAsistio = data.filter((cita) => cita.estado === 'NO_ASISTIO').length
    return {
      total,
      confirmadas,
      enCurso,
      noAsistio,
      pendientes: Math.max(0, total - confirmadas - enCurso - noAsistio),
      asistencia: pct(confirmadas + enCurso, total),
    }
  }, [data])

  const estadoData = useMemo(
    () => [
      { label: 'Confirmadas/En Curso', value: metrics.confirmadas + metrics.enCurso, color: 'var(--success-400)', bg: 'rgba(40,149,108,0.12)' },
      { label: 'Por atender (Pendientes)', value: metrics.pendientes, color: '#5668B8', bg: 'rgba(86,104,184,0.12)' },
      { label: 'No asistió', value: metrics.noAsistio, color: 'var(--danger-400)', bg: 'rgba(192,80,80,0.12)' },
    ],
    [metrics.confirmadas, metrics.enCurso, metrics.pendientes, metrics.noAsistio],
  )

  const handleCambiarEstado = async (payload: { citaId: number; estado: GhEstadoCita; motivo?: string | null }) => {
    const actionKey = `${payload.citaId}:${payload.estado}`
    setErrorMsg(null)
    setActionLoadingKey(actionKey)

    // Optimistic update: actualizar el cache instantáneamente sin refetch visual
    const previousData = queryClient.getQueryData<typeof data>(['gh', 'citas', query])
    queryClient.setQueryData<typeof data>(['gh', 'citas', query], (old) =>
      old?.map((c) => c.id === payload.citaId ? { ...c, estado: payload.estado } : c) ?? old
    )

    try {
      await cambiarEstadoMutation.mutateAsync({
        citaId: payload.citaId,
        body: {
          estado: payload.estado,
          motivo: payload.motivo ?? null,
        },
      })
      // Sync silencioso en background — sin corte visual
      queryClient.invalidateQueries({ queryKey: ['gh', 'citas', query] })
      queryClient.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
    } catch (err) {
      // Rollback si falla
      queryClient.setQueryData(['gh', 'citas', query], previousData)
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'No se pudo actualizar el estado de la cita.'
      setErrorMsg(apiMessage)
    } finally {
      setActionLoadingKey(null)
    }
  }

  const handleEliminarCita = async (cita: GhCita) => {
    const actionKey = `${cita.id}:DELETE`
    setErrorMsg(null)
    setActionLoadingKey(actionKey)

    const previousData = queryClient.getQueryData<typeof data>(['gh', 'citas', query])
    queryClient.setQueryData<typeof data>(['gh', 'citas', query], (old) =>
      old?.filter((item) => item.id !== cita.id) ?? old
    )

    try {
      await eliminarCitaMutation.mutateAsync(cita.id)
      queryClient.invalidateQueries({ queryKey: ['gh', 'citas', query] })
      queryClient.invalidateQueries({ queryKey: ['gh', 'dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['gh', 'dashboard-citas-hoy'] })
    } catch (err) {
      queryClient.setQueryData(['gh', 'citas', query], previousData)
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'No se pudo eliminar la cita.'
      setErrorMsg(apiMessage)
    } finally {
      setActionLoadingKey(null)
    }
  }

  const canGoPrev = page > 1
  const canGoNext = data.length >= perPage

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-400)', boxShadow: '0 0 6px var(--primary-400)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--primary-400)', letterSpacing: '0.12em' }}>MÓDULO GH — AGENDA OPERATIVA</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Agendar Citas</h2>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sede activa: <strong style={{ color: 'var(--text-secondary)' }}>{sedeActiva?.nombre ?? '—'}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '5px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite' }} />
              Sincronizando
            </div>
          )}
          <div style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}>
            Pág. {page}
          </div>
        </div>
      </div>

      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <MetricCard label="Citas visibles" value={metrics.total} icon={CalendarDays} color="#0ea5e9" bg="rgba(14,165,233,0.12)" />
        <MetricCard label="Confirmadas" value={metrics.confirmadas} icon={CalendarCheck2} color="#10b981" bg="rgba(40,149,108,0.12)" badge={`${metrics.asistencia}% presente`} />
        <MetricCard label="En curso" value={metrics.enCurso} icon={Clock3} color="#5668B8" bg="rgba(86,104,184,0.12)" />
        <MetricCard label="Inasistencias" value={metrics.noAsistio} icon={CalendarX2} color="#ef4444" bg="rgba(192,80,80,0.12)" />
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', margin: '4px 0 10px 0', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Gráfico de estado operativo actual</div>
        <div style={{ display: 'flex', gap: '12px', height: '18px', borderRadius: 'var(--radius-full)', overflow: 'hidden', background: 'var(--border-subtle)' }}>
          {estadoData.map((item) => {
            const width = pct(item.value, metrics.total)
            if (width === 0) return null
            return (
              <div
                key={item.label}
                title={`${item.label}: ${item.value} (${width}%)`}
                style={{ width: `${width}%`, height: '100%', background: item.color, transition: 'width 0.3s ease' }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
           {estadoData.map((item) => (
             <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.label}: <strong style={{color: 'var(--text-primary)'}}>{item.value}</strong></span>
             </div>
           ))}
        </div>
      </div>

      <CitasFiltersBar
        onOpenCreate={() => setOpenCreateModal(true)}
        onClearFilters={() => resetFilters()}
        onRefresh={() => {
          void refetch()
        }}
        refreshing={isFetching}
      />

      {errorMsg ? (
        <div
          style={{
            border: '1px solid rgba(192,80,80,0.35)',
            background: 'rgba(192,80,80,0.12)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            color: 'var(--danger-400)',
            fontSize: '0.78rem',
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      {isLoading ? (
        <div style={{ color: 'var(--text-muted)' }}>Cargando citas...</div>
      ) : (
        <CitasTable
          citas={data}
          onCambiarEstado={handleCambiarEstado}
          onEliminarCita={handleEliminarCita}
          loadingKey={actionLoadingKey}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          className="btn-ghost"
          disabled={!canGoPrev || isFetching}
          onClick={() => setPagination(page - 1, perPage)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={!canGoNext || isFetching}
          onClick={() => setPagination(page + 1, perPage)}
        >
          Siguiente
        </button>
      </div>

      <CitaFormModal
        open={openCreateModal}
        sedeId={sedeId}
        onClose={() => setOpenCreateModal(false)}
        onCreated={syncCreatedCitas}
      />
    </div>
  )
}

