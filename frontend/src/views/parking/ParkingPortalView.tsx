import React, { useState, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Car, CheckCircle2, AlertTriangle, Loader2,
  ChevronRight, ChevronLeft, Clock, Calendar,
} from 'lucide-react'
import { parkingService } from '@/services/parking.service'
import type { CompletarAutogestionPayload } from '@/services/parking.service'
import { getErrorMessage } from '@/services/api'

// ── Constantes ────────────────────────────────────────────────────

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO']
const DIAS_LABEL: Record<string, string> = {
  LUNES:'Lunes', MARTES:'Martes', MIERCOLES:'Miércoles', JUEVES:'Jueves',
  VIERNES:'Viernes', SABADO:'Sábado', DOMINGO:'Domingo',
}

const TIPO_VEHICULO_LABEL: Record<string, string> = {
  CARRO:'Carro', MOTO:'Moto', BICICLETA:'Bicicleta',
  CAMION:'Camión', VAN:'Van', TAXI_AUTORIZADO:'Taxi autorizado', ELECTRICO:'Eléctrico',
}

// ── Helpers ───────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ── Shared styles ─────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 500,
  color: '#374151', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
  background: '#fff', border: '1px solid #D1D5DB',
  borderRadius: 8, fontSize: '0.9rem', color: '#111827',
  outline: 'none', transition: 'border-color .15s',
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: '4px 0 0' }}>{children}</p>
}

// ── Wizard form state ─────────────────────────────────────────────

type WizardForm = CompletarAutogestionPayload & {
  nombres: string
  apellidos: string
  email: string
  telefono: string
}

function initialForm(): WizardForm {
  return {
    marca: '', linea: '', color: '', modelo_anio: undefined,
    horario_requerido: '', dias_requeridos: ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES'],
    motivo: '',
    nombres: '', apellidos: '', email: '', telefono: '',
  }
}

// ── Step 1: Datos del vehículo ────────────────────────────────────

function Step1({
  form, onChange, touched,
}: {
  form: WizardForm
  onChange: <K extends keyof WizardForm>(k: K, v: WizardForm[K]) => void
  touched: boolean
}) {
  const err = useMemo(() => {
    if (!touched) return {}
    return {
      marca:  !form.marca.trim() ? 'Requerido' : '',
      linea:  !form.linea.trim() ? 'Requerido' : '',
      color:  !form.color.trim() ? 'Requerido' : '',
    }
  }, [form, touched])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Marca *</label>
          <input
            value={form.marca}
            onChange={e => onChange('marca', e.target.value)}
            placeholder="Ej: Chevrolet"
            style={{ ...inputStyle, borderColor: err.marca ? '#EF4444' : undefined }}
            autoFocus
          />
          {err.marca && <ErrMsg>{err.marca}</ErrMsg>}
        </div>
        <div>
          <label style={labelStyle}>Línea / Modelo *</label>
          <input
            value={form.linea}
            onChange={e => onChange('linea', e.target.value)}
            placeholder="Ej: Spark, Civic, Activa 125"
            style={{ ...inputStyle, borderColor: err.linea ? '#EF4444' : undefined }}
          />
          {err.linea && <ErrMsg>{err.linea}</ErrMsg>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Color *</label>
          <input
            value={form.color}
            onChange={e => onChange('color', e.target.value)}
            placeholder="Ej: Blanco, Rojo oscuro"
            style={{ ...inputStyle, borderColor: err.color ? '#EF4444' : undefined }}
          />
          {err.color && <ErrMsg>{err.color}</ErrMsg>}
        </div>
        <div>
          <label style={labelStyle}>Año del vehículo</label>
          <input
            type="number" min={1990} max={2100}
            value={form.modelo_anio ?? ''}
            onChange={e => onChange('modelo_anio', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ej: 2020"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Horario y motivo ──────────────────────────────────────

function Step2({
  form, onChange, touched,
}: {
  form: WizardForm
  onChange: <K extends keyof WizardForm>(k: K, v: WizardForm[K]) => void
  touched: boolean
}) {
  const err = useMemo(() => {
    if (!touched) return {}
    return {
      horario: !form.horario_requerido.trim() ? 'Requerido' : '',
      motivo:  !form.motivo.trim() ? 'Requerido'
               : form.motivo.trim().length < 10 ? 'Mínimo 10 caracteres' : '',
    }
  }, [form, touched])

  const toggleDia = useCallback((dia: string) => {
    const dias = form.dias_requeridos ?? []
    onChange('dias_requeridos', dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia])
  }, [form.dias_requeridos, onChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>Horario de uso requerido *</label>
        <input
          value={form.horario_requerido}
          onChange={e => onChange('horario_requerido', e.target.value)}
          placeholder="Ej: 7:00am a 6:00pm"
          style={{ ...inputStyle, borderColor: err.horario ? '#EF4444' : undefined }}
          autoFocus
        />
        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
          Describe el rango de horas en que necesitas usar el parqueadero.
        </p>
        {err.horario && <ErrMsg>{err.horario}</ErrMsg>}
      </div>

      <div>
        <label style={labelStyle}>Días que requieres acceso</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DIAS.map(dia => {
            const sel = (form.dias_requeridos ?? []).includes(dia)
            return (
              <button
                key={dia}
                type="button"
                onClick={() => toggleDia(dia)}
                style={{
                  padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: sel ? '#2563EB' : '#D1D5DB',
                  background: sel ? '#EFF6FF' : '#fff',
                  color: sel ? '#1D4ED8' : '#6B7280',
                  fontSize: '0.82rem', fontWeight: sel ? 600 : 400,
                  transition: 'all .15s',
                }}
              >
                {DIAS_LABEL[dia]}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Motivo de la solicitud *</label>
        <textarea
          value={form.motivo}
          onChange={e => onChange('motivo', e.target.value)}
          rows={4}
          placeholder="Describe brevemente por qué necesitas el acceso al parqueadero..."
          style={{
            ...inputStyle, resize: 'vertical', minHeight: 90,
            borderColor: err.motivo ? '#EF4444' : undefined,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span />
          <span style={{ fontSize: '0.72rem', color: form.motivo.length < 10 ? '#EF4444' : '#9CA3AF' }}>
            {form.motivo.length} / mín. 10
          </span>
        </div>
        {err.motivo && <ErrMsg>{err.motivo}</ErrMsg>}
      </div>
    </div>
  )
}

// ── Step 3: Confirmación + contacto opcional ──────────────────────

function Step3({
  form, onChange, portalData,
}: {
  form: WizardForm
  onChange: <K extends keyof WizardForm>(k: K, v: WizardForm[K]) => void
  portalData: { placa: string; tipo_vehiculo: string; fecha_inicio: string; fecha_fin: string; solicitante_nombre: string | null }
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Resumen */}
      <div style={{
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: 12, padding: '16px 20px',
      }}>
        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Resumen de tu solicitud
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Placa', portalData.placa],
            ['Tipo', TIPO_VEHICULO_LABEL[portalData.tipo_vehiculo] ?? portalData.tipo_vehiculo],
            ['Vehículo', `${form.marca} ${form.linea} ${form.color}${form.modelo_anio ? ` (${form.modelo_anio})` : ''}`],
            ['Horario', form.horario_requerido],
            ['Vigencia', `${formatFecha(portalData.fecha_inicio)} — ${formatFecha(portalData.fecha_fin)}`],
            ['Días', (form.dias_requeridos ?? []).map(d => DIAS_LABEL[d]).join(', ') || '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#1E293B', fontWeight: 500 }}>{value}</p>
            </div>
          ))}
        </div>
        {form.motivo && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.72rem', color: '#94A3B8' }}>Motivo</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>{form.motivo}</p>
          </div>
        )}
      </div>

      {/* Contacto opcional */}
      <div>
        <p style={{ margin: '0 0 14px', fontSize: '0.84rem', fontWeight: 600, color: '#374151' }}>
          Datos de contacto <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nombres</label>
              <input value={form.nombres} onChange={e => onChange('nombres', e.target.value)}
                placeholder={portalData.solicitante_nombre ?? 'Tu nombre'} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Apellidos</label>
              <input value={form.apellidos} onChange={e => onChange('apellidos', e.target.value)}
                placeholder="Apellidos" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input type="email" value={form.email} onChange={e => onChange('email', e.target.value)}
                placeholder="correo@empresa.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input value={form.telefono} onChange={e => onChange('telefono', e.target.value.replace(/\D/g, ''))}
                placeholder="3001234567" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Portal View ──────────────────────────────────────────────

export function ParkingPortalView() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<WizardForm>(initialForm)
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)

  const portalQ = useQuery({
    queryKey: ['parking', 'portal', token],
    queryFn:  () => parkingService.getAutogestion(token!),
    enabled:  !!token,
    retry:    false,
    staleTime: 60_000,
  })

  const completarMut = useMutation({
    mutationFn: () => {
      const payload: CompletarAutogestionPayload = {
        marca:             form.marca,
        linea:             form.linea,
        color:             form.color,
        modelo_anio:       form.modelo_anio,
        horario_requerido: form.horario_requerido,
        dias_requeridos:   form.dias_requeridos,
        motivo:            form.motivo,
        nombres:           form.nombres.trim() || undefined,
        apellidos:         form.apellidos.trim() || undefined,
        email:             form.email.trim() || undefined,
        telefono:          form.telefono.trim() || undefined,
      }
      return parkingService.completarAutogestion(token!, payload)
    },
    onSuccess: () => setDone(true),
  })

  const onChange = useCallback(<K extends keyof WizardForm>(k: K, v: WizardForm[K]) => {
    setForm(p => ({ ...p, [k]: v }))
  }, [])

  function validateStep(s: number): boolean {
    if (s === 1) return !!(form.marca.trim() && form.linea.trim() && form.color.trim())
    if (s === 2) return !!(form.horario_requerido.trim() && form.motivo.trim().length >= 10)
    return true
  }

  function handleNext() {
    setTouched(true)
    if (!validateStep(step)) return
    setTouched(false)
    setStep(s => s + 1)
  }

  function handleBack() {
    setTouched(false)
    setStep(s => s - 1)
  }

  function handleSubmit() {
    completarMut.mutate()
  }

  const portalData = portalQ.data

  // ── Layout shell ──────────────────────────────────────────────

  const isExpired = portalData &&
    portalData.estado !== 'PENDIENTE_AUTOGESTION' &&
    portalData.estado !== 'AUTOGESTION_EN_PROGRESO'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 50%, #F5F3FF 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .portal-card { animation: fadeUp .3s ease; }
      `}</style>

      {/* Logo / Brand */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
          boxShadow: '0 8px 24px rgba(37,99,235,.3)', marginBottom: 10,
        }}>
          <Car size={28} color="#fff" />
        </div>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
          Portal de Autogestión
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
          Permoda S.A.S. — Módulo de Parqueaderos
        </p>
      </div>

      {/* Card */}
      <div className="portal-card" style={{
        width: '100%', maxWidth: 600,
        background: '#fff', borderRadius: 20,
        boxShadow: '0 4px 32px rgba(0,0,0,.08)',
        border: '1px solid rgba(255,255,255,.8)',
        overflow: 'hidden',
      }}>

        {/* Loading */}
        {portalQ.isLoading && (
          <div style={{ padding: '72px 40px', textAlign: 'center' }}>
            <Loader2 size={32} style={{ color: '#2563EB', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p style={{ color: '#64748B', margin: 0 }}>Verificando el link...</p>
          </div>
        )}

        {/* Error — token inválido */}
        {portalQ.isError && (
          <div style={{ padding: '56px 40px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={26} color="#EF4444" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
              Link inválido o expirado
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Este enlace no es válido o ha expirado.<br />
              Contacta con el administrador para obtener un nuevo link.
            </p>
          </div>
        )}

        {/* Estado no válido para autogestión */}
        {portalData && isExpired && (
          <div style={{ padding: '56px 40px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Clock size={26} color="#CA8A04" />
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
              Esta solicitud ya fue procesada
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Estado actual: <strong>{portalData.estado.replace(/_/g, ' ')}</strong><br />
              Si tienes preguntas, contacta al administrador de parking.
            </p>
          </div>
        )}

        {/* Éxito final */}
        {done && (
          <div style={{ padding: '56px 40px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 4px 16px rgba(22,163,74,.2)',
            }}>
              <CheckCircle2 size={32} color="#16A34A" />
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>
              ¡Solicitud completada!
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
              Tus datos han sido enviados correctamente.
            </p>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8' }}>
              El administrador revisará tu solicitud y recibirás una respuesta pronto.
            </p>
          </div>
        )}

        {/* Wizard */}
        {portalData && !isExpired && !done && (
          <>
            {/* Header solicitud */}
            <div style={{
              background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
              padding: '20px 28px',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.72rem', opacity: .8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Solicitud
                  </p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {portalData.codigo}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '0.72rem', opacity: .8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Vigencia
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>
                    {formatFecha(portalData.fecha_inicio)}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: .85 }}>
                    — {formatFecha(portalData.fecha_fin)}
                  </p>
                </div>
              </div>
              {(portalData.solicitante_nombre || portalData.placa) && (
                <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
                  {portalData.solicitante_nombre && (
                    <div>
                      <p style={{ margin: '0 0 1px', fontSize: '0.7rem', opacity: .75 }}>Solicitante</p>
                      <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>{portalData.solicitante_nombre}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.7rem', opacity: .75 }}>Placa</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>
                      {portalData.placa}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '0.7rem', opacity: .75 }}>Vehículo</p>
                    <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>
                      {TIPO_VEHICULO_LABEL[portalData.tipo_vehiculo] ?? portalData.tipo_vehiculo}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Steps indicator */}
            <div style={{
              display: 'flex', padding: '16px 28px',
              borderBottom: '1px solid #F1F5F9',
              gap: 0,
            }}>
              {['Vehículo', 'Horario y motivo', 'Confirmar'].map((label, i) => {
                const n = i + 1
                const active = step === n
                const done2 = step > n
                return (
                  <React.Fragment key={label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                        background: done2 ? '#16A34A' : active ? '#2563EB' : '#F1F5F9',
                        color: (active || done2) ? '#fff' : '#94A3B8',
                        border: active ? '2px solid #2563EB' : done2 ? '2px solid #16A34A' : '2px solid #E2E8F0',
                        transition: 'all .2s',
                      }}>
                        {done2 ? '✓' : n}
                      </div>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                        color: active ? '#1E293B' : '#94A3B8',
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ flex: 1, height: 1, background: '#E2E8F0', margin: '0 10px', alignSelf: 'center' }} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>

            {/* Step content */}
            <div style={{ padding: '24px 28px' }}>
              {step === 1 && <Step1 form={form} onChange={onChange} touched={touched} />}
              {step === 2 && <Step2 form={form} onChange={onChange} touched={touched} />}
              {step === 3 && (
                <Step3
                  form={form}
                  onChange={onChange}
                  portalData={{
                    placa:               portalData.placa,
                    tipo_vehiculo:       portalData.tipo_vehiculo,
                    fecha_inicio:        portalData.fecha_inicio,
                    fecha_fin:           portalData.fecha_fin,
                    solicitante_nombre:  portalData.solicitante_nombre,
                  }}
                />
              )}

              {completarMut.isError && (
                <div style={{
                  marginTop: 16, padding: '10px 14px',
                  background: '#FEF2F2', border: '1px solid #FECACA',
                  borderRadius: 8, fontSize: '0.82rem', color: '#DC2626',
                }}>
                  {getErrorMessage(completarMut.error)}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 28px 24px',
            }}>
              <button
                onClick={handleBack}
                disabled={step === 1}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 20px',
                  background: step === 1 ? 'transparent' : '#F8FAFC',
                  border: '1px solid',
                  borderColor: step === 1 ? 'transparent' : '#E2E8F0',
                  borderRadius: 10, cursor: step === 1 ? 'default' : 'pointer',
                  color: step === 1 ? 'transparent' : '#475569',
                  fontSize: '0.88rem', fontWeight: 500,
                  transition: 'all .15s',
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(37,99,235,.3)',
                    transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.9' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={completarMut.isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 28px',
                    background: completarMut.isPending
                      ? '#9CA3AF'
                      : 'linear-gradient(135deg, #16A34A, #15803D)',
                    border: 'none', borderRadius: 10,
                    cursor: completarMut.isPending ? 'default' : 'pointer',
                    color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                    boxShadow: completarMut.isPending ? 'none' : '0 2px 8px rgba(22,163,74,.3)',
                    transition: 'all .2s',
                  }}
                >
                  {completarMut.isPending
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                    : <><CheckCircle2 size={16} /> Enviar solicitud</>
                  }
                </button>
              )}
            </div>

            {/* Expiry notice */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '12px 28px', borderTop: '1px solid #F1F5F9',
              background: '#FAFAFA',
            }}>
              <Calendar size={13} style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Este link expira el{' '}
                {new Date(portalData.token_expira_en).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: '0.75rem', color: '#94A3B8' }}>
        KOAJ Access — Permoda S.A.S.
      </p>
    </div>
  )
}

export default ParkingPortalView
