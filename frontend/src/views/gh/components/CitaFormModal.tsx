import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle, Users, User, BookOpen, PenTool, Shirt, Info } from 'lucide-react'

import { useCrearGHCita, useCrearGHCitasGrupo } from '@/hooks/gh/useGHCitas'
import type { GhCita, GhTipoCita } from '@/types/gh'

interface CitaFormModalProps {
  open: boolean
  sedeId: number
  onClose: () => void
  onCreated?: (citas: GhCita[]) => void
}

const TIPOS_CITA = [
  {
    value: 'INDUCCION',
    label: 'Inducción',
    Icon: BookOpen,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.25)',
    desc: 'Orientación al cargo y empresa',
  },
  {
    value: 'FIRMA_CONTRATO',
    label: 'Firma contrato',
    Icon: PenTool,
    color: '#10b981',
    bg: 'rgba(40,149,108,0.08)',
    border: 'rgba(40,149,108,0.25)',
    desc: 'Vinculación y firma de documentos',
  },
  {
    value: 'ENTREGA_DOTACION',
    label: 'Entrega dotación',
    Icon: Shirt,
    color: '#f59e0b',
    bg: 'rgba(69,116,196,0.08)',
    border: 'rgba(69,116,196,0.25)',
    desc: 'Elementos de dotación laboral',
  },
] as const

const HORA_SLOTS: string[] = []
for (let h = 7; h <= 18; h++) {
  HORA_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 18) HORA_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

const AREAS_SUGERIDAS = [
  'VENTAS', 'BODEGA', 'ADMINISTRATIVO', 'LOGÍSTICA', 'CAJA',
  'VISUAL MERCHANDISING', 'SERVICIO AL CLIENTE', 'ALMACÉN',
]

const TIPOS_INDUCCION_SUGERIDOS = [
  'GENERAL', 'CARGO ESPECÍFICO', 'SST', 'MARCA Y CULTURA',
  'NORMAS Y POLÍTICAS', 'SISTEMAS Y HERRAMIENTAS',
]

type CandidateDraft = {
  tipo_documento: string
  numero_documento: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
}

const EMPTY_CANDIDATE: CandidateDraft = {
  tipo_documento: 'CC',
  numero_documento: '',
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
}

function todayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(dateStr: string, delta: number): string {
  const d = parseLocalDate(dateStr)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function buildISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

export function CitaFormModal({ open, sedeId, onClose, onCreated }: CitaFormModalProps) {
  const createMutation = useCrearGHCita()
  const createGroupMutation = useCrearGHCitasGrupo()

  const [isGroupMode, setIsGroupMode] = useState(false)
  const [candidatos, setCandidatos] = useState<CandidateDraft[]>([{ ...EMPTY_CANDIDATE }])
  const [tipoCita, setTipoCita] = useState<GhTipoCita>('INDUCCION')
  const [fechaSeleccionada, setFechaSeleccionada] = useState(todayStr)
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('09:30')
  const [observaciones, setObservaciones] = useState('')
  const [areaInduccion, setAreaInduccion] = useState('')
  const [tipoInduccionHint, setTipoInduccionHint] = useState('')
  const [error, setError] = useState<string | null>(null)

  const duracionMin = useMemo(() => {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFin.split(':').map(Number)
    return (hf * 60 + mf) - (hi * 60 + mi)
  }, [horaInicio, horaFin])

  useEffect(() => {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFin.split(':').map(Number)
    if (hf * 60 + mf <= hi * 60 + mi) {
      const newFin = hi * 60 + mi + 30
      setHoraFin(`${String(Math.floor(newFin / 60) % 24).padStart(2, '0')}:${String(newFin % 60).padStart(2, '0')}`)
    }
  }, [horaInicio, horaFin])

  const availableHoraFin = useMemo(() => {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const startMins = hi * 60 + mi
    const slots = []
    for (let i = 30; ; i += 30) {
      const hfTotal = startMins + i
      if (hfTotal > 18 * 60 + 30) break
      const h = Math.floor(hfTotal / 60)
      const m = hfTotal % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
    return slots
  }, [horaInicio])

  const isSubmitting = createMutation.isPending || createGroupMutation.isPending

  if (!open) return null

  const updateCandidate = (index: number, patch: Partial<CandidateDraft>) => {
    setCandidatos((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  const clearForm = () => {
    setIsGroupMode(false)
    setCandidatos([{ ...EMPTY_CANDIDATE }])
    setTipoCita('INDUCCION')
    setFechaSeleccionada(todayStr())
    setHoraInicio('09:00')
    setHoraFin('09:30')
    setObservaciones('')
    setAreaInduccion('')
    setTipoInduccionHint('')
    setError(null)
  }

  const handleClose = () => {
    if (isSubmitting) return
    clearForm()
    onClose()
  }

  const buildObservaciones = (): string | null => {
    const parts: string[] = []
    if (tipoCita === 'INDUCCION') {
      if (areaInduccion.trim()) parts.push(`Área: ${areaInduccion.trim()}`)
      if (tipoInduccionHint.trim()) parts.push(`Inducción: ${tipoInduccionHint.trim()}`)
    }
    if (observaciones.trim()) parts.push(observaciones.trim())
    return parts.length > 0 ? parts.join(' · ') : null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const candidatosNormalizados = (isGroupMode ? candidatos : [candidatos[0]])
      .map((item) => ({
        tipo_documento: item.tipo_documento,
        numero_documento: item.numero_documento.trim(),
        nombres: item.nombres.trim(),
        apellidos: item.apellidos.trim(),
        email: item.email.trim() || null,
        telefono: item.telefono.trim() || null,
      }))
      .filter((item) => item.numero_documento && item.nombres && item.apellidos)

    if (candidatosNormalizados.length === 0) {
      setError('Completa al menos una persona con documento, nombres y apellidos.')
      return
    }

    const inicioISO = buildISO(fechaSeleccionada, horaInicio)
    const finISO = buildISO(fechaSeleccionada, horaFin)
    const obsBuilt = buildObservaciones()

    try {
      let createdCitas: GhCita[] = []
      if (isGroupMode) {
        createdCitas = await createGroupMutation.mutateAsync({
          candidatos: candidatosNormalizados,
          sede_id: sedeId,
          tipo_cita: tipoCita,
          fecha_hora_inicio: inicioISO,
          fecha_hora_fin: finISO,
          observaciones: obsBuilt,
        })
      } else {
        const created = await createMutation.mutateAsync({
          candidato: candidatosNormalizados[0],
          sede_id: sedeId,
          tipo_cita: tipoCita,
          fecha_hora_inicio: inicioISO,
          fecha_hora_fin: finISO,
          observaciones: obsBuilt,
        })
        createdCitas = [created]
      }
      clearForm()
      onCreated?.(createdCitas)
      onClose()
    } catch (err) {
      const apiMessage =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'No fue posible crear la cita.'
      setError(apiMessage)
    }
  }

  const fieldStyle = {
    padding: '8px 10px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    width: '100%',
    outline: 'none',
  } as const

  const labelStyle = {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    marginBottom: '6px',
    display: 'block',
  }

  const selectedTipo = TIPOS_CITA.find((t) => t.value === tipoCita)!

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2300,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
              background: selectedTipo.bg, border: `1px solid ${selectedTipo.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
          >
            <selectedTipo.Icon size={17} color={selectedTipo.color} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Nueva cita — {selectedTipo.label}
            </h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedTipo.desc} · agenda {isGroupMode ? 'grupal' : 'individual'}
            </p>
          </div>
          {/* Modo toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsGroupMode(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.72rem', fontWeight: 600, background: !isGroupMode ? 'var(--primary-400)' : 'transparent', color: !isGroupMode ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <User size={12} /> Individual
            </button>
            <button
              type="button"
              onClick={() => setIsGroupMode(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.72rem', fontWeight: 600, background: isGroupMode ? 'var(--primary-400)' : 'transparent', color: isGroupMode ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <Users size={12} /> Grupo
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 24px', display: 'grid', gap: '22px' }}>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(192,80,80,0.35)', background: 'rgba(192,80,80,0.08)', color: 'var(--danger-400)', fontSize: '0.78rem' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* ── 1. Tipo de cita — card grid ── */}
          <section>
            <span style={labelStyle}>Motivo de la cita</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {TIPOS_CITA.map((tipo) => {
                const Icon = tipo.Icon
                const isActive = tipoCita === tipo.value
                return (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() => setTipoCita(tipo.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '16px 12px', borderRadius: 'var(--radius-lg)',
                      border: `1.5px solid ${isActive ? tipo.color : 'var(--border-subtle)'}`,
                      background: isActive ? tipo.bg : 'var(--bg-elevated)',
                      color: isActive ? tipo.color : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: isActive ? `0 4px 16px ${tipo.color}22` : 'none',
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{tipo.label}</span>
                    <span style={{ fontSize: '0.68rem', color: isActive ? tipo.color : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4, opacity: 0.85 }}>{tipo.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── 1b. Inducción callout ── */}
          {tipoCita === 'INDUCCION' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(14,165,233,0.2)', background: 'rgba(14,165,233,0.05)' }}>
              <Info size={15} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Las citas de inducción pueden agruparse en <strong style={{ color: '#0ea5e9' }}>sesiones sincrónicas o virtuales</strong>. Una vez creada, ve a <strong>Inducciones</strong> para vincularla a una sesión con link de videoconferencia o sala física.
              </p>
            </div>
          )}

          {/* ── 2. Horario ── */}
          <section style={{ display: 'grid', gap: '16px' }}>
            {/* Fecha */}
            <div>
              <span style={labelStyle}>Fecha</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setFechaSeleccionada((d) => addDays(d, -1))}
                  disabled={fechaSeleccionada <= todayStr()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', cursor: fechaSeleccionada <= todayStr() ? 'not-allowed' : 'pointer', opacity: fechaSeleccionada <= todayStr() ? 0.35 : 1, flexShrink: 0 }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Clickable date display — transparent input overlay */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ textAlign: 'center', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {formatDateLabel(fechaSeleccionada)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {fechaSeleccionada} — clic para cambiar
                    </div>
                  </div>
                  <input
                    type="date"
                    value={fechaSeleccionada}
                    min={todayStr()}
                    onChange={(e) => { if (e.target.value) setFechaSeleccionada(e.target.value) }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFechaSeleccionada((d) => addDays(d, 1))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', cursor: 'pointer', flexShrink: 0 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '16px 20px' }}>
              {/* Hora inicio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Clock size={14} color="#6366f1" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hora de inicio</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {HORA_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setHoraInicio(slot)}
                    style={{
                      flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                      border: `1px solid ${horaInicio === slot ? '#6366f1' : 'var(--border-default)'}`,
                      background: horaInicio === slot ? '#6366f1' : 'var(--bg-surface)',
                      color: horaInicio === slot ? '#fff' : 'var(--text-muted)',
                      boxShadow: horaInicio === slot ? '0 4px 14px rgba(86,104,184,0.28)' : 'none',
                      cursor: 'pointer', transition: 'all 0.18s',
                      transform: horaInicio === slot ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Hora fin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Clock size={14} color="#10b981" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hora de finalización</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {availableHoraFin.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setHoraFin(slot)}
                    style={{
                      flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                      border: `1px solid ${horaFin === slot ? '#10b981' : 'var(--border-default)'}`,
                      background: horaFin === slot ? '#10b981' : 'var(--bg-surface)',
                      color: horaFin === slot ? '#fff' : 'var(--text-muted)',
                      boxShadow: horaFin === slot ? '0 4px 14px rgba(40,149,108,0.28)' : 'none',
                      cursor: 'pointer', transition: 'all 0.18s',
                      transform: horaFin === slot ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Resumen visual */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'linear-gradient(to right, rgba(86,104,184,0.06), rgba(40,149,108,0.06))', border: '1px solid rgba(86,104,184,0.15)', borderRadius: 'var(--radius-lg)' }}>
                <Calendar size={16} color="#6366f1" />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{formatDateLabel(fechaSeleccionada)}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{horaInicio}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{horaFin}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-surface)', border: '1px solid rgba(86,104,184,0.2)', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', fontFamily: 'var(--font-mono)' }}>
                    {duracionMin} min
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* ── 2b. Datos de inducción (solo para INDUCCION) ── */}
          {tipoCita === 'INDUCCION' && (
            <section>
              <span style={labelStyle}>Datos de inducción (opcional)</span>
              <div style={{ padding: '14px', background: 'var(--bg-elevated)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={labelStyle}>Área de vinculación</span>
                    <input
                      value={areaInduccion}
                      onChange={(e) => setAreaInduccion(e.target.value)}
                      placeholder="Ej: VENTAS, BODEGA..."
                      list="areas-induccion-list"
                      style={fieldStyle}
                    />
                    <datalist id="areas-induccion-list">
                      {AREAS_SUGERIDAS.map((a) => <option key={a} value={a} />)}
                    </datalist>
                  </div>
                  <div>
                    <span style={labelStyle}>Tipo de inducción</span>
                    <input
                      value={tipoInduccionHint}
                      onChange={(e) => setTipoInduccionHint(e.target.value)}
                      placeholder="Ej: GENERAL, SST..."
                      list="tipos-induccion-list"
                      style={fieldStyle}
                    />
                    <datalist id="tipos-induccion-list">
                      {TIPOS_INDUCCION_SUGERIDOS.map((t) => <option key={t} value={t} />)}
                    </datalist>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <Info size={11} />
                  Se añaden a las observaciones — útil al crear la sesión de inducción después.
                </div>
              </div>
            </section>
          )}

          {/* ── 3. Candidatos ── */}
          <section>
            <span style={labelStyle}>
              {isGroupMode ? `Personas en el grupo (${candidatos.length})` : 'Datos del candidato'}
            </span>
            <div style={{ display: 'grid', gap: '10px' }}>
              {(isGroupMode ? candidatos : [candidatos[0]]).map((item, index) => (
                <div
                  key={index}
                  style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', padding: '12px', display: 'grid', gap: '10px' }}
                >
                  {isGroupMode && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>PERSONA {index + 1}</span>
                      {candidatos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCandidatos((p) => p.filter((_, i) => i !== index))}
                          style={{ fontSize: '0.7rem', color: 'var(--danger-400)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <div>
                      <span style={labelStyle}>Tipo doc.</span>
                      <select value={item.tipo_documento} onChange={(e) => updateCandidate(index, { tipo_documento: e.target.value })} style={fieldStyle}>
                        <option value="CC">CC</option>
                        <option value="CE">CE</option>
                        <option value="TI">TI</option>
                        <option value="PP">PP</option>
                      </select>
                    </div>
                    <div>
                      <span style={labelStyle}>N° documento</span>
                      <input value={item.numero_documento} onChange={(e) => updateCandidate(index, { numero_documento: e.target.value })} placeholder="Ej: 1023456789" style={fieldStyle} />
                    </div>
                    <div>
                      <span style={labelStyle}>Nombres</span>
                      <input value={item.nombres} onChange={(e) => updateCandidate(index, { nombres: e.target.value })} placeholder="Nombres" style={fieldStyle} />
                    </div>
                    <div>
                      <span style={labelStyle}>Apellidos</span>
                      <input value={item.apellidos} onChange={(e) => updateCandidate(index, { apellidos: e.target.value })} placeholder="Apellidos" style={fieldStyle} />
                    </div>
                    <div>
                      <span style={labelStyle}>Email (opcional)</span>
                      <input type="text" value={item.email} onChange={(e) => updateCandidate(index, { email: e.target.value })} placeholder="correo@dominio.com" style={fieldStyle} />
                    </div>
                    <div>
                      <span style={labelStyle}>Teléfono (opcional)</span>
                      <input value={item.telefono} onChange={(e) => updateCandidate(index, { telefono: e.target.value })} placeholder="3001234567" style={fieldStyle} />
                    </div>
                  </div>
                </div>
              ))}
              {isGroupMode && (
                <button
                  type="button"
                  onClick={() => setCandidatos((p) => [...p, { ...EMPTY_CANDIDATE }])}
                  disabled={isSubmitting}
                  style={{ padding: '9px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', background: 'transparent', color: 'var(--primary-400)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Agregar persona al grupo
                </button>
              )}
            </div>
          </section>

          {/* ── 4. Observaciones ── */}
          <section>
            <span style={labelStyle}>Observaciones internas (opcional)</span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas adicionales sobre esta cita..."
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </section>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {selectedTipo.label} · {formatDateLabel(fechaSeleccionada)} · {horaInicio} → {horaFin} ({duracionMin} min)
            </div>
            {tipoCita === 'INDUCCION' && (areaInduccion || tipoInduccionHint) && (
              <div style={{ fontSize: '0.7rem', color: '#0ea5e9', marginTop: '3px' }}>
                {[areaInduccion, tipoInduccionHint].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isGroupMode ? `Crear grupo (${candidatos.length})` : 'Crear cita'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

