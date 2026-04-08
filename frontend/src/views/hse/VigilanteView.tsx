/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Portal Vigilante HSE — Verificación de acceso en portería
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ShieldCheck, UserCheck, UserX, User, AlertTriangle,
  LogIn, LogOut, Clock, Activity, RefreshCw,
} from 'lucide-react'
import { useSedeStore } from '@/store'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type {
  VerificarAccesoResponse,
  PersonaDentroResponse,
  EstadoAccesoVigilante,
} from '@/types/hse'

// ── Helper ────────────────────────────────────────────────────────
function formatMinutos(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Tarjeta de resultado de escaneo ──────────────────────────────
function ResultadoCard({ resultado }: { resultado: VerificarAccesoResponse }) {
  const config: Record<EstadoAccesoVigilante, {
    bg: string; border: string; icon: React.ComponentType<{ size?: number; color?: string }>; iconColor: string; title: string
  }> = {
    AUTORIZADO:    { bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.3)',  icon: UserCheck,    iconColor: 'var(--success-400)', title: 'AUTORIZADO' },
    NO_AUTORIZADO: { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.3)',   icon: UserX,        iconColor: 'var(--danger-400)',  title: 'NO AUTORIZADO' },
    NO_REGISTRADO: { bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.3)', icon: User,         iconColor: 'var(--text-muted)',  title: 'NO REGISTRADO' },
    EXCEPCION:     { bg: 'rgba(99,102,241,0.06)',  border: 'rgba(99,102,241,0.3)',  icon: ShieldCheck,  iconColor: '#6366F1',            title: 'EXCEPCIÓN' },
  }

  const { bg, border, icon: Icon, iconColor, title } = config[resultado.estado]

  return (
    <div style={{
      padding:      '24px',
      background:   bg,
      border:       `2px solid ${border}`,
      borderRadius: 'var(--radius-xl)',
      animation:    'fadeUp 0.3s ease both',
    }}>
      {/* Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width:          '48px',
          height:         '48px',
          background:     `${iconColor}15`,
          border:         `2px solid ${iconColor}40`,
          borderRadius:   '50%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          <Icon size={22} color={iconColor} />
        </div>
        <div>
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '1.1rem',
            fontWeight:    800,
            color:         iconColor,
            letterSpacing: '0.06em',
          }}>
            {title}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {resultado.mensaje}
          </div>
        </div>
      </div>

      {/* Datos del contratista */}
      {resultado.nombre && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 '8px',
          marginBottom:        resultado.problemas.length > 0 ? '14px' : '0',
        }}>
          {[
            { label: 'Nombre',          value: resultado.nombre },
            { label: 'Tipo',            value: resultado.tipo_contratista ?? '—' },
            { label: 'Empresa',         value: resultado.empresa ?? '—' },
            { label: 'Dentro ahora',    value: resultado.dentro_actualmente ? 'Sí' : 'No' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              padding:      '8px 12px',
              background:   'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border:       '1px solid var(--border-subtle)',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '2px' }}>
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problemas */}
      {resultado.problemas.length > 0 && (
        <div style={{
          padding:      '10px 14px',
          background:   'rgba(239,68,68,0.06)',
          border:       '1px solid rgba(239,68,68,0.15)',
          borderRadius: 'var(--radius-md)',
        }}>
          {resultado.problemas.map((p, i) => (
            <div key={i} style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
              fontSize:   '0.78rem',
              color:      'var(--danger-400)',
              marginBottom: i < resultado.problemas.length - 1 ? '4px' : '0',
            }}>
              <AlertTriangle size={11} />
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function VigilanteView() {
  const inputRef = useRef<HTMLInputElement>(null)
  const sedeActiva = useSedeStore(s => s.sedeActiva)

  const [documento,   setDocumento]   = useState('')
  const [resultado,   setResultado]   = useState<VerificarAccesoResponse | null>(null)
  const [dentro,      setDentro]      = useState<PersonaDentroResponse[]>([])
  const [loadingVerif, setLoadingVerif] = useState(false)
  const [loadingAcceso, setLoadingAcceso] = useState(false)
  const [loadingDentro, setLoadingDentro] = useState(false)
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)
  const [refresh,     setRefresh]     = useState(0)

  // Enfocar input al montar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Cargar personas dentro
  useEffect(() => {
    const loadDentro = async () => {
      if (!sedeActiva?.id) {
        setDentro([])
        setLoadingDentro(false)
        return
      }

      setLoadingDentro(true)
      try {
        const data = await hseService.getPersonasDentro(sedeActiva.id)
        setDentro(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingDentro(false)
      }
    }
    loadDentro()
  }, [refresh, sedeActiva?.id])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => setRefresh(r => r + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleVerificar = async () => {
    if (!documento.trim()) return
    if (!sedeActiva?.id) {
      const msg = 'Selecciona una sede activa para verificar accesos.'
      setErrorMsg(msg)
      toast.error(msg)
      return
    }

    setLoadingVerif(true)
    setResultado(null)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await hseService.verificarAcceso({
        numero_documento: documento.trim(),
        sede_id:          sedeActiva.id,
      })
      setResultado(res)
    } catch (e) {
      const msg = getErrorMessage(e)
      setErrorMsg(msg)
      toast.error(`No se pudo verificar el documento. ${msg}`)
    } finally {
      setLoadingVerif(false)
    }
  }

  const handleAcceso = async (tipo: 'ENTRADA' | 'SALIDA') => {
    if (!resultado?.contratista_id) return
    if (!sedeActiva?.id) {
      const msg = 'Selecciona una sede activa para registrar accesos.'
      setErrorMsg(msg)
      toast.error(msg)
      return
    }

    setLoadingAcceso(true)
    setErrorMsg(null)

    try {
      await hseService.registrarAcceso({
        contratista_id: resultado.contratista_id,
        sede_id:        sedeActiva.id,
        tipo,
        metodo:         'LECTOR_USB',
      })
      const msg = `${tipo === 'ENTRADA' ? 'Entrada' : 'Salida'} registrada correctamente.`
      setSuccessMsg(msg)
      toast.success(msg)
      setDocumento('')
      setResultado(null)
      setRefresh(r => r + 1)
      setTimeout(() => {
        setSuccessMsg(null)
        inputRef.current?.focus()
      }, 2500)
    } catch (e) {
      const msg = getErrorMessage(e)
      setErrorMsg(msg)
      toast.error(`No se pudo registrar la ${tipo === 'ENTRADA' ? 'entrada' : 'salida'}. ${msg}`)
    } finally {
      setLoadingAcceso(false)
    }
  }

  const limpiar = () => {
    setDocumento('')
    setResultado(null)
    setErrorMsg(null)
    setSuccessMsg(null)
    inputRef.current?.focus()
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={14} color="var(--success-400)" />
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.68rem',
            color:         'var(--success-400)',
            letterSpacing: '0.12em',
          }}>
            HSE / PORTAL VIGILANTE
          </span>
        </div>
        <h1 style={{
          fontSize:      '1.5rem',
          fontWeight:    700,
          color:         'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom:  '4px',
        }}>
          Verificación de Acceso
        </h1>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
          Escanea o digita la cédula del contratista
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>

        {/* Panel izquierdo — verificación */}
        <div>

          {/* Input cédula */}
          <div
            style={{
              background:   'var(--bg-surface)',
              border:       '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding:      '28px',
              marginBottom: '20px',
            }}
            className="animate-fade-up stagger-1"
          >
            <label style={{
              display:       'block',
              fontSize:      '0.72rem',
              fontWeight:    600,
              color:         'var(--text-muted)',
              letterSpacing: '0.1em',
              marginBottom:  '12px',
            }}>
              NÚMERO DE DOCUMENTO
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                ref={inputRef}
                type="text"
                value={documento}
                onChange={e => setDocumento(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerificar()}
                placeholder="Ej: 12345678"
                style={{
                  flex:         1,
                  padding:      '14px 16px',
                  fontSize:     '1.4rem',
                  fontFamily:   'var(--font-mono)',
                  fontWeight:   700,
                  letterSpacing: '0.08em',
                  background:   'var(--bg-elevated)',
                  border:       '2px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  color:        'var(--text-primary)',
                  outline:      'none',
                  transition:   'border-color var(--transition-fast)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary-500)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
              />
              <button
                onClick={handleVerificar}
                disabled={loadingVerif || !documento.trim()}
                style={{
                  padding:      '14px 24px',
                  background:   loadingVerif || !documento.trim()
                    ? 'var(--bg-elevated)' : 'var(--primary-500)',
                  border:       'none',
                  borderRadius: 'var(--radius-lg)',
                  color:        loadingVerif || !documento.trim()
                    ? 'var(--text-muted)' : 'var(--text-inverted)',
                  fontSize:     '0.9rem',
                  fontWeight:   700,
                  cursor:       loadingVerif || !documento.trim() ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-ui)',
                  transition:   'all var(--transition-fast)',
                  boxShadow:    loadingVerif || !documento.trim()
                    ? 'none' : 'var(--shadow-glow-primary)',
                  minWidth:     '100px',
                }}
              >
                {loadingVerif ? '...' : 'Verificar'}
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Compatible con lector USB — presiona Enter o el botón para verificar
            </p>
          </div>

          {/* Mensaje de éxito */}
          {successMsg && (
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '14px 18px',
              background:   'rgba(16,185,129,0.08)',
              border:       '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '16px',
              animation:    'fadeUp 0.3s ease both',
            }}>
              <UserCheck size={18} color="var(--success-400)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--success-400)', fontWeight: 500 }}>
                {successMsg}
              </span>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '12px 16px',
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '16px',
            }}>
              <AlertTriangle size={16} color="var(--danger-400)" />
              <span style={{ fontSize: '0.83rem', color: 'var(--danger-400)' }}>{errorMsg}</span>
            </div>
          )}

          {/* Resultado de verificación */}
          {resultado && (
            <div className="animate-fade-up">
              <ResultadoCard resultado={resultado} />

              {/* Botones de acción */}
              {(resultado.estado === 'AUTORIZADO' || resultado.estado === 'EXCEPCION' || (resultado.estado === 'NO_AUTORIZADO' && resultado.dentro_actualmente)) && resultado.contratista_id && (
                <div style={{
                  display:        'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap:            '12px',
                  marginTop:      '14px',
                }}>
                  <button
                    onClick={() => handleAcceso('ENTRADA')}
                    disabled={loadingAcceso || resultado.dentro_actualmente}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      gap:          '8px',
                      padding:      '14px',
                      background:   resultado.dentro_actualmente
                        ? 'var(--bg-elevated)' : 'rgba(16,185,129,0.1)',
                      border:       `2px solid ${resultado.dentro_actualmente
                        ? 'var(--border-subtle)' : 'rgba(16,185,129,0.4)'}`,
                      borderRadius: 'var(--radius-lg)',
                      color:        resultado.dentro_actualmente
                        ? 'var(--text-muted)' : 'var(--success-400)',
                      fontSize:     '0.9rem',
                      fontWeight:   700,
                      cursor:       resultado.dentro_actualmente ? 'not-allowed' : 'pointer',
                      fontFamily:   'var(--font-ui)',
                      transition:   'all var(--transition-fast)',
                    }}
                  >
                    <LogIn size={18} />
                    Registrar Entrada
                  </button>
                  <button
                    onClick={() => handleAcceso('SALIDA')}
                    disabled={loadingAcceso || !resultado.dentro_actualmente}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      gap:          '8px',
                      padding:      '14px',
                      background:   !resultado.dentro_actualmente
                        ? 'var(--bg-elevated)' : 'rgba(245,158,11,0.1)',
                      border:       `2px solid ${!resultado.dentro_actualmente
                        ? 'var(--border-subtle)' : 'rgba(245,158,11,0.4)'}`,
                      borderRadius: 'var(--radius-lg)',
                      color:        !resultado.dentro_actualmente
                        ? 'var(--text-muted)' : 'var(--primary-400)',
                      fontSize:     '0.9rem',
                      fontWeight:   700,
                      cursor:       !resultado.dentro_actualmente ? 'not-allowed' : 'pointer',
                      fontFamily:   'var(--font-ui)',
                      transition:   'all var(--transition-fast)',
                    }}
                  >
                    <LogOut size={18} />
                    Registrar Salida
                  </button>
                </div>
              )}

              {resultado.estado === 'EXCEPCION' && !resultado.contratista_id && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  color: '#6366F1',
                }}>
                  Excepción válida encontrada, pero la persona no tiene contratista HSE asociado para registrar trazabilidad de entrada/salida.
                </div>
              )}

              <button
                onClick={limpiar}
                style={{
                  width:        '100%',
                  marginTop:    '10px',
                  padding:      '10px',
                  background:   'transparent',
                  border:       '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color:        'var(--text-muted)',
                  fontSize:     '0.8rem',
                  cursor:       'pointer',
                  fontFamily:   'var(--font-ui)',
                }}
              >
                Limpiar y verificar otro
              </button>
            </div>
          )}
        </div>

        {/* Panel derecho — personas dentro */}
        <div
          style={{
            background:    'var(--bg-surface)',
            border:        '1px solid var(--border-subtle)',
            borderRadius:  'var(--radius-xl)',
            overflow:      'hidden',
            height:        'fit-content',
            position:      'sticky',
            top:           '24px',
          }}
          className="animate-fade-up stagger-2"
        >
          <div style={{
            padding:        '14px 18px',
            borderBottom:   '1px solid var(--border-subtle)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={13} color="var(--success-400)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Dentro ahora
              </span>
              <span style={{
                padding:      '1px 7px',
                background:   'rgba(16,185,129,0.1)',
                border:       '1px solid rgba(16,185,129,0.2)',
                borderRadius: '20px',
                fontSize:     '0.68rem',
                color:        'var(--success-400)',
                fontFamily:   'var(--font-mono)',
              }}>
                {dentro.length}
              </span>
            </div>
            <button
              onClick={() => setRefresh(r => r + 1)}
              style={{
                background: 'transparent',
                border:     'none',
                color:      'var(--text-muted)',
                cursor:     'pointer',
                padding:    '2px',
              }}
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {loadingDentro ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Cargando...
              </div>
            ) : dentro.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Nadie dentro actualmente
              </div>
            ) : (
              dentro.map((p, i) => (
                <div
                  key={p.contratista_id}
                  style={{
                    padding:      '10px 16px',
                    borderBottom: i < dentro.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'space-between',
                    gap:          '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <div style={{
                      width:          '28px',
                      height:         '28px',
                      borderRadius:   '50%',
                      background:     p.tipo_contratista === 'ALTO_RIESGO'
                        ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      fontSize:       '0.7rem',
                      fontWeight:     700,
                      color:          p.tipo_contratista === 'ALTO_RIESGO'
                        ? 'var(--danger-400)' : 'var(--success-400)',
                      flexShrink:     0,
                    }}>
                      {p.nombre.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize:     '0.78rem',
                        fontWeight:   500,
                        color:        'var(--text-primary)',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}>
                        {p.nombre}
                      </div>
                      <div style={{
                        fontSize:   '0.65rem',
                        color:      'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {p.numero_documento}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        '3px',
                      fontSize:   '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color:      p.alerta_tiempo ? 'var(--danger-400)' : 'var(--text-muted)',
                      fontWeight: p.alerta_tiempo ? 700 : 400,
                    }}>
                      <Clock size={10} />
                      {formatMinutos(p.minutos_dentro)}
                    </div>
                    {p.alerta_tiempo && (
                      <div style={{ fontSize: '0.62rem', color: 'var(--danger-400)', marginTop: '1px' }}>
                        ⚠ tiempo exc.
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}