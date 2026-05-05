import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Info,
  LogIn,
  LogOut,
  MoreVertical,
  Play,
  Plus,
  Send,
  Square,
  UserCheck,
} from 'lucide-react'

import { useSedeStore } from '@/store'
import { useGHCitas } from '@/hooks/gh/useGHCitas'
import {
  useCambiarEstadoSesionInduccion,
  useCrearGHSesionInduccion,
  useEnviarLinksInduccion,
  useGenerarCodigoCheckin,
  useGenerarCodigoCheckout,
  useGHSesionesInduccion,
} from '@/hooks/gh/useGHInducciones'
import type { GhCita, GhSesionInduccion } from '@/types/gh'
import { cn } from '@/utils/cn'

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string
  value: number | string
  icon: any
  color: string
  bg: string
}) {
  return (
    <div
      className="animate-fade-up glass"
      style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-xl)',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${color}15`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: bg,
          borderRadius: '50%',
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}
      />
      <div className="relative flex justify-between items-start">
        <div>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: bg,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  )
}

function formatWindow(start: string, end: string) {
  return `${new Date(start).toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase()} · ${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatBadgeColor(estado: GhSesionInduccion['estado_sesion']) {
  if (estado === 'EN_CURSO') return { color: 'var(--success-400)', bg: 'rgba(16,185,129,0.08)' }
  if (estado === 'FINALIZADA' || estado === 'CERRADA') return { color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' }
  if (estado === 'CANCELADA') return { color: 'var(--danger-400)', bg: 'rgba(239,68,68,0.08)' }
  return { color: 'var(--text-muted)', bg: 'var(--bg-base)' }
}

export default function GHInduccionesView() {
  const sede = useSedeStore((s) => s.sedeActiva)
  const sedeId = sede?.id ?? 0

  const { data: sesiones = [], isLoading, isFetching } = useGHSesionesInduccion({ sede_id: sedeId })
  const { data: citasInduccion = [] } = useGHCitas({
    sede_id: sedeId,
    tipo_cita: 'INDUCCION',
    page: 1,
    per_page: 100,
  })

  const crearSesion = useCrearGHSesionInduccion()
  const codigoCheckin = useGenerarCodigoCheckin()
  const codigoCheckout = useGenerarCodigoCheckout()
  const cambiarEstado = useCambiarEstadoSesionInduccion()
  const enviarLinks = useEnviarLinksInduccion()

  const [openModal, setOpenModal] = useState(false)
  const [selectedCitaIds, setSelectedCitaIds] = useState<number[]>([])
  const [form, setForm] = useState({
    area: '',
    tipo_induccion: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
  })

  const eligibleCitas = useMemo(
    () =>
      citasInduccion.filter(
        (cita) =>
          !cita.sesion_induccion &&
          !['CANCELADA', 'NO_ASISTIO', 'FINALIZADA'].includes(cita.estado),
      ),
    [citasInduccion],
  )

  const selectedCitas = useMemo(
    () => eligibleCitas.filter((cita) => selectedCitaIds.includes(cita.id)),
    [eligibleCitas, selectedCitaIds],
  )

  useEffect(() => {
    if (!selectedCitas.length) return
    const ordered = [...selectedCitas].sort(
      (a, b) => new Date(a.fecha_hora_inicio).getTime() - new Date(b.fecha_hora_inicio).getTime(),
    )
    const start = ordered[0]?.fecha_hora_inicio ?? ''
    const end = ordered[ordered.length - 1]?.fecha_hora_fin ?? ''
    setForm((prev) => ({
      ...prev,
      fecha_hora_inicio: start ? toDateTimeLocalValue(start) : prev.fecha_hora_inicio,
      fecha_hora_fin: end ? toDateTimeLocalValue(end) : prev.fecha_hora_fin,
    }))
  }, [selectedCitas])

  const metrics = useMemo(() => {
    const activas = sesiones.filter((s) => s.estado_sesion === 'EN_CURSO').length
    const programadas = sesiones.filter((s) => s.estado_sesion === 'PROGRAMADA').length
    const relacionadas = sesiones.reduce((acc, s) => acc + s.related_cita_ids.length, 0)
    return { activas, programadas, relacionadas }
  }, [sesiones])

  if (!sede) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] glass rounded-2xl border border-[var(--border-subtle)] text-center p-8">
        <Info size={40} color="var(--border-subtle)" style={{ marginBottom: '16px' }} />
        <div className="text-[var(--text-muted)] text-base font-medium">
          Selecciona una sede operativa para gestionar inducciones.
        </div>
      </div>
    )
  }

  const resetForm = () => {
    setOpenModal(false)
    setSelectedCitaIds([])
    setForm({
      area: '',
      tipo_induccion: '',
      fecha_hora_inicio: '',
      fecha_hora_fin: '',
    })
  }

  const handleCreateSession = () => {
    if (!selectedCitaIds.length) {
      toast.error('Selecciona al menos una cita de induccion para convertirla en sesion.')
      return
    }
    if (!form.area || !form.tipo_induccion || !form.fecha_hora_inicio || !form.fecha_hora_fin) {
      toast.error('Completa el area, el tipo de induccion y la ventana operativa.')
      return
    }

    crearSesion.mutate(
      {
        sede_id: sede.id,
        area: form.area,
        tipo_induccion: form.tipo_induccion,
        fecha_hora_inicio: new Date(form.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(form.fecha_hora_fin).toISOString(),
        cita_ids: selectedCitaIds,
        asistentes: [],
      },
      {
        onSuccess: () => {
          toast.success('Sesion de induccion creada y vinculada a las citas seleccionadas.')
          resetForm()
        },
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }

  const toggleCita = (cita: GhCita) => {
    setSelectedCitaIds((prev) =>
      prev.includes(cita.id) ? prev.filter((id) => id !== cita.id) : [...prev, cita.id],
    )
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div
        className="animate-fade-up"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="status-dot active animate-pulse" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--primary-400)', letterSpacing: '0.15em', fontWeight: 800 }}>
              MODULO GH - INDUCCIONES OPERATIVAS
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Sesiones de Induccion
          </h2>
          <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Las citas tipo induccion se convierten aqui en sesiones operativas con asistencia y codigos.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isFetching ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite' }} />
              Sincronizando
            </div>
          ) : null}
          <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem' }} onClick={() => setOpenModal(true)}>
            <Plus size={18} />
            Crear desde citas
          </button>
        </div>
      </div>

      <div className="animate-fade-up stagger-1" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <MetricCard label="Sesiones Totales" value={sesiones.length} icon={CalendarDays} color="#0ea5e9" bg="rgba(14,165,233,0.12)" />
        <MetricCard label="En Curso" value={metrics.activas} icon={Play} color="#10b981" bg="rgba(16,185,129,0.12)" />
        <MetricCard label="Pendientes" value={metrics.programadas} icon={Clock} color="#6366F1" bg="rgba(99,102,241,0.12)" />
        <MetricCard label="Citas Vinculadas" value={metrics.relacionadas} icon={CheckCircle2} color="#f59e0b" bg="rgba(245,158,11,0.12)" />
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>Citas de induccion pendientes por convertir</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Estas citas siguen en agenda. Para operar asistencia, codigos y links de autogestion primero deben pasar a una sesion.</div>
          </div>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem' }} onClick={() => setOpenModal(true)}>
            <Plus size={16} />
            Convertir a sesion
          </button>
        </div>
        <div style={{ padding: '18px 24px', display: 'grid', gap: '12px' }}>
          {eligibleCitas.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No hay citas pendientes por convertir en esta sede.
            </div>
          ) : (
            eligibleCitas.map((cita) => (
              <div key={cita.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', padding: '14px 16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-base)', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cita.candidato.nombres} {cita.candidato.apellidos}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {cita.codigo} · {cita.candidato.tipo_documento} {cita.candidato.numero_documento}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {formatWindow(cita.fecha_hora_inicio, cita.fecha_hora_fin)}
                  </div>
                </div>
                <button
                  className="btn-ghost"
                  style={{ padding: '8px 16px', fontSize: '0.78rem', fontWeight: 700 }}
                  onClick={() => {
                    setOpenModal(true)
                    setSelectedCitaIds((prev) => (prev.includes(cita.id) ? prev : [...prev, cita.id]))
                  }}
                >
                  Seleccionar
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>Sesiones registradas</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>El cambio de estado operativo se controla desde aqui y se refleja en las citas relacionadas.</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: 'var(--radius-full)', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', padding: '6px 12px', color: '#0ea5e9', fontSize: '0.74rem', fontWeight: 600 }}>
            {eligibleCitas.length} citas de induccion listas para vincular
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>AREA / TIPO</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>VENTANA OPERATIVA</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>CITAS VINCULADAS</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>ASISTENTES</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>ESTADO</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>CODIGOS</th>
                <th align="left" style={{ padding: '18px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>GESTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Cargando sesiones operativas...
                  </td>
                </tr>
              ) : sesiones.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No hay sesiones registradas. Convierte una o varias citas de induccion en una sesion para iniciar la operacion.
                  </td>
                </tr>
              ) : (
                sesiones.map((sesion, idx) => {
                  const badge = formatBadgeColor(sesion.estado_sesion)
                  return (
                    <tr key={sesion.id} className={cn('table-row animate-fade-up', `stagger-${(idx % 6) + 1}`)} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{sesion.area}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{sesion.tipo_induccion}</div>
                      </td>
                      <td style={{ padding: '20px 24px', fontSize: '0.82rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {formatWindow(sesion.fecha_hora_inicio, sesion.fecha_hora_fin)}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
                          <CalendarDays size={16} color="var(--text-secondary)" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sesion.related_cita_ids.length}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
                          <UserCheck size={16} color="var(--text-secondary)" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{sesion.asistentes.length}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: badge.bg }}>
                          <div className="status-dot" style={{ backgroundColor: badge.color }} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {sesion.estado_sesion.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
                            title="Generar codigo de entrada"
                            onClick={() => codigoCheckin.mutate(sesion.id, { onSuccess: (r) => toast.success(`Check-In: ${r.codigo}`) })}
                          >
                            <LogIn size={16} />
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
                            title="Generar codigo de salida"
                            onClick={() => codigoCheckout.mutate(sesion.id, { onSuccess: (r) => toast.success(`Check-Out: ${r.codigo}`) })}
                          >
                            <LogOut size={16} />
                          </button>
                          <button
                            className="btn-ghost"
                            style={{ padding: '8px', borderRadius: 'var(--radius-md)' }}
                            title="Enviar links de autogestion"
                            onClick={() => {
                              if (confirm('Enviar links a los asistentes vinculados a esta sesion?')) {
                                enviarLinks.mutate(sesion.id)
                              }
                            }}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {sesion.estado_sesion === 'PROGRAMADA' ? (
                            <button
                              className="btn-ghost hover:!bg-[var(--success-500)]/10 hover:!text-[var(--success-400)] hover:!border-[var(--success-500)]/30"
                              style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                              onClick={() => cambiarEstado.mutate({ id: sesion.id, payload: { estado_sesion: 'EN_CURSO' } })}
                            >
                              <Play size={14} className="mr-2" /> INICIAR
                            </button>
                          ) : null}
                          {sesion.estado_sesion === 'EN_CURSO' ? (
                            <button
                              className="btn-ghost hover:!bg-[var(--danger-500)]/10 hover:!text-[var(--danger-400)] hover:!border-[var(--danger-500)]/30"
                              style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700 }}
                              onClick={() => cambiarEstado.mutate({ id: sesion.id, payload: { estado_sesion: 'FINALIZADA' } })}
                            >
                              <Square size={14} className="mr-2" /> FINALIZAR
                            </button>
                          ) : null}
                          <button className="btn-ghost" style={{ padding: '8px', borderRadius: 'var(--radius-md)' }} onClick={() => toast.error('Mas acciones en desarrollo')}>
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-base)]/80 backdrop-blur-md animate-fade-in">
          <div className="glass w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in border border-[var(--border-strong)]">
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-400)', boxShadow: '0 0 8px var(--primary-400)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.15em' }}>VINCULAR CITAS</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Crear sesion desde citas de induccion</h3>
            </div>

            <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', background: 'var(--bg-base)' }}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>Citas elegibles</div>
                <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'grid', gap: '12px', paddingRight: '4px' }}>
                  {eligibleCitas.length === 0 ? (
                    <div style={{ border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay citas de induccion pendientes por vincular en esta sede.
                    </div>
                  ) : (
                    eligibleCitas.map((cita) => {
                      const selected = selectedCitaIds.includes(cita.id)
                      return (
                        <label
                          key={cita.id}
                          style={{
                            display: 'grid',
                            gap: '8px',
                            border: selected ? '1px solid rgba(14,165,233,0.35)' : '1px solid var(--border-subtle)',
                            background: selected ? 'rgba(14,165,233,0.08)' : 'var(--bg-surface)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '14px 16px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {cita.candidato.nombres} {cita.candidato.apellidos}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {cita.codigo} · {cita.candidato.tipo_documento} {cita.candidato.numero_documento}
                              </div>
                            </div>
                            <input type="checkbox" checked={selected} onChange={() => toggleCita(cita)} />
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {formatWindow(cita.fecha_hora_inicio, cita.fecha_hora_fin)}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ borderLeft: '3px solid var(--primary-500)', paddingLeft: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Configuracion operativa</h4>
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area</span>
                      <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Ej: Operaciones, SST..." style={{ width: '100%', height: '44px', padding: '0 16px', fontSize: '0.85rem' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de induccion</span>
                      <input value={form.tipo_induccion} onChange={(e) => setForm({ ...form, tipo_induccion: e.target.value })} placeholder="Ej: General, Seguridad, Bienvenida..." style={{ width: '100%', height: '44px', padding: '0 16px', fontSize: '0.85rem' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inicio operativo</span>
                      <input type="datetime-local" value={form.fecha_hora_inicio} onChange={(e) => setForm({ ...form, fecha_hora_inicio: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 16px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fin operativo</span>
                      <input type="datetime-local" value={form.fecha_hora_fin} onChange={(e) => setForm({ ...form, fecha_hora_fin: e.target.value })} style={{ width: '100%', height: '44px', padding: '0 16px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }} />
                    </label>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', padding: '18px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Resumen de vinculacion</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Al crear la sesion, las citas seleccionadas se gestionaran operativamente desde este modulo y su estado operativo dejara de manejarse manualmente desde agenda.
                  </div>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <div>Citas seleccionadas: <strong style={{ color: 'var(--text-primary)' }}>{selectedCitaIds.length}</strong></div>
                    <div>Asistentes esperados: <strong style={{ color: 'var(--text-primary)' }}>{selectedCitaIds.length}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button className="btn-ghost" style={{ padding: '10px 24px', fontSize: '0.85rem' }} onClick={resetForm}>
                Cancelar
              </button>
              <button className="btn-primary glow-primary" style={{ padding: '10px 28px', fontSize: '0.85rem' }} onClick={handleCreateSession} disabled={crearSesion.isPending}>
                {crearSesion.isPending ? 'Procesando...' : 'Crear sesion vinculada'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
