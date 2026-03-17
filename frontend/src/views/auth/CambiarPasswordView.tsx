/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Vista de cambio de contraseña obligatorio.
 * Se muestra cuando debe_cambiar_password = true.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store'
import { post, getErrorMessage } from '@/services/api'
import type { UsuarioMe } from '@/types'

// ── Schema ────────────────────────────────────────────────────────
const schema = z
  .object({
    password_actual:        z.string().min(1, 'Requerido'),
    password_nueva:         z.string().min(8, 'Mínimo 8 caracteres'),
    password_nueva_confirm: z.string().min(1, 'Requerido'),
  })
  .refine((d) => d.password_nueva === d.password_nueva_confirm, {
    message:  'Las contraseñas no coinciden',
    path:     ['password_nueva_confirm'],
  })

type FormData = z.infer<typeof schema>

// ── Requisitos de contraseña ──────────────────────────────────────
function getRequisitos(pwd: string) {
  return [
    { label: 'Mínimo 8 caracteres',       ok: pwd.length >= 8 },
    { label: 'Una letra mayúscula',        ok: /[A-Z]/.test(pwd) },
    { label: 'Una letra minúscula',        ok: /[a-z]/.test(pwd) },
    { label: 'Un número',                  ok: /\d/.test(pwd) },
    { label: 'Un carácter especial',       ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ]
}

export default function CambiarPasswordView() {
  const navigate   = useNavigate()
  const usuario    = useAuthStore((s) => s.usuario)
  const setUsuario = useAuthStore((s) => s.setUsuario)

  const [showActual,  setShowActual]  = useState(false)
  const [showNueva,   setShowNueva]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const passwordNueva = watch('password_nueva', '')
  const requisitos    = getRequisitos(passwordNueva)

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      await post('/auth/cambiar-password', {
        password_actual: data.password_actual,
        password_nueva:  data.password_nueva,
      })

      // Actualizar usuario en el store con debe_cambiar_password = false
      if (usuario) {
        const usuarioActualizado: UsuarioMe = {
          ...usuario,
          debe_cambiar_password: false,
        }
        const accessToken  = localStorage.getItem('koaj_access_token') ?? ''
        const refreshToken = localStorage.getItem('koaj_refresh_token') ?? ''
        setUsuario(usuarioActualizado, accessToken, refreshToken)
      }

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        display:        'flex',
        minHeight:      '100vh',
        background:     'var(--bg-base)',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position:      'fixed',
          inset:         0,
          background:    `
            radial-gradient(ellipse at 30% 40%, rgba(245,158,11,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 60%, rgba(99,102,241,0.04) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width:        '100%',
          maxWidth:     '440px',
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding:      '40px',
          position:     'relative',
          zIndex:       1,
        }}
        className="animate-fade-up"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width:          '40px',
              height:         '40px',
              background:     'rgba(245,158,11,0.1)',
              border:         '1px solid rgba(245,158,11,0.2)',
              borderRadius:   'var(--radius-md)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}
          >
            <ShieldCheck size={20} color="var(--primary-500)" />
          </div>
          <div>
            <h1
              style={{
                fontSize:     '1.2rem',
                fontWeight:   700,
                color:        'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Cambio de contraseña
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Requerido en el primer acceso
            </p>
          </div>
        </div>

        {/* Aviso */}
        <div
          style={{
            padding:      '10px 14px',
            background:   'rgba(245,158,11,0.06)',
            border:       '1px solid rgba(245,158,11,0.15)',
            borderRadius: 'var(--radius-md)',
            margin:       '20px 0',
            fontSize:     '0.8rem',
            color:        'var(--primary-400)',
            lineHeight:   1.5,
          }}
        >
          Por seguridad, debes cambiar tu contraseña antes de continuar.
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '10px 14px',
              background:   'rgba(239,68,68,0.08)',
              border:       '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={14} color="var(--danger-400)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--danger-400)' }}>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Contraseña actual */}
          {renderCampo({
            label:       'CONTRASEÑA ACTUAL',
            name:        'password_actual',
            register,
            error:       errors.password_actual?.message,
            show:        showActual,
            onToggle:    () => setShowActual((v) => !v),
          })}

          {/* Contraseña nueva */}
          {renderCampo({
            label:       'CONTRASEÑA NUEVA',
            name:        'password_nueva',
            register,
            error:       errors.password_nueva?.message,
            show:        showNueva,
            onToggle:    () => setShowNueva((v) => !v),
          })}

          {/* Requisitos */}
          {passwordNueva.length > 0 && (
            <div style={{ marginBottom: '16px', marginTop: '-8px' }}>
              {requisitos.map((req) => (
                <div
                  key={req.label}
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '6px',
                    marginBottom: '4px',
                  }}
                >
                  <CheckCircle2
                    size={12}
                    color={req.ok ? 'var(--success-400)' : 'var(--text-muted)'}
                  />
                  <span
                    style={{
                      fontSize: '0.73rem',
                      color:    req.ok ? 'var(--success-400)' : 'var(--text-muted)',
                    }}
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Confirmar nueva */}
          {renderCampo({
            label:       'CONFIRMAR CONTRASEÑA',
            name:        'password_nueva_confirm',
            register,
            error:       errors.password_nueva_confirm?.message,
            show:        showConfirm,
            onToggle:    () => setShowConfirm((v) => !v),
          })}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width:          '100%',
              padding:        '12px',
              marginTop:      '8px',
              background:     isLoading ? 'var(--primary-700)' : 'var(--primary-500)',
              border:         'none',
              borderRadius:   'var(--radius-md)',
              color:          'var(--text-inverted)',
              fontSize:       '0.875rem',
              fontWeight:     600,
              fontFamily:     'var(--font-ui)',
              cursor:         isLoading ? 'not-allowed' : 'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
              boxShadow:      isLoading ? 'none' : 'var(--shadow-glow-primary)',
              transition:     'all var(--transition-fast)',
            }}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width:        '14px',
                    height:       '14px',
                    border:       '2px solid rgba(0,0,0,0.3)',
                    borderTop:    '2px solid var(--text-inverted)',
                    borderRadius: '50%',
                    animation:    'spin 1s linear infinite',
                  }}
                />
                Guardando...
              </>
            ) : (
              'Cambiar contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Helper para campos de password ────────────────────────────────
function renderCampo({
  label, name, register, error, show, onToggle,
}: {
  label:    string
  name:     string
  register: any
  error?:   string
  show:     boolean
  onToggle: () => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display:       'block',
          fontSize:      '0.72rem',
          fontWeight:    500,
          color:         'var(--text-secondary)',
          marginBottom:  '6px',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Lock
          size={14}
          style={{
            position:      'absolute',
            left:          '12px',
            top:           '50%',
            transform:     'translateY(-50%)',
            color:         error ? 'var(--danger-400)' : 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          {...register(name)}
          type={show ? 'text' : 'password'}
          style={{
            width:       '100%',
            padding:     '10px 40px 10px 36px',
            fontSize:    '0.875rem',
            borderColor: error ? 'var(--danger-500)' : undefined,
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position:   'absolute',
            right:      '10px',
            top:        '50%',
            transform:  'translateY(-50%)',
            background: 'transparent',
            border:     'none',
            color:      'var(--text-muted)',
            cursor:     'pointer',
            padding:    '4px',
            display:    'flex',
          }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: '0.73rem', color: 'var(--danger-400)', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  )
}