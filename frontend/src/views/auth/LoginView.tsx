/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Vista de login.
 *
 * Diseño: Industrial Luxury Dark
 * - Panel izquierdo: branding y atmosfera visual
 * - Panel derecho: formulario de login
 * - Animaciones de entrada escalonadas
 * - Validación con React Hook Form + Zod
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '@/store'
import { post, getErrorMessage } from '@/services/api'
import type { LoginResponse } from '@/types'

// ── Schema de validación ──────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

// ── Vista principal ───────────────────────────────────────────────
export default function LoginView() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const setUsuario = useAuthStore((s) => s.setUsuario)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [errorMsg, setErrorMsg]         = useState<string | null>(null)

  // Ruta a la que redirigir después del login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const response = await post<LoginResponse>('/auth/login', data)
      setUsuario(
        response.usuario,
        response.tokens.access_token,
        response.tokens.refresh_token,
      )

      // Si debe cambiar password → redirigir a cambiar-password
      if (response.tokens.debe_cambiar_password) {
        navigate('/cambiar-password', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        display:    'flex',
        minHeight:  '100vh',
        background: 'var(--bg-base)',
        overflow:   'hidden',
      }}
    >

      {/* ══ PANEL IZQUIERDO — Branding ════════════════════════════ */}
      <div
        style={{
          flex:           '1',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          alignItems:     'flex-start',
          padding:        '64px',
          position:       'relative',
          overflow:       'hidden',
        }}
        className="animate-fade-in"
      >
        {/* Gradiente de fondo decorativo */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(69,116,196,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(86,104,184,0.06) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }}
        />

        {/* Grid decorativo */}
        <div
          className="bg-grid"
          style={{
            position:   'absolute',
            inset:      0,
            opacity:    0.4,
            pointerEvents: 'none',
          }}
        />

        {/* Línea decorativa vertical */}
        <div
          style={{
            position:     'absolute',
            right:        0,
            top:          0,
            bottom:       0,
            width:        '1px',
            background:   'linear-gradient(to bottom, transparent, var(--border-default), transparent)',
          }}
        />

        {/* Contenido del branding */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>

          {/* Logo */}
          <div
            className="animate-fade-up stagger-1"
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '14px',
              marginBottom: '64px',
            }}
          >
            <div
              style={{
                width:          '44px',
                height:         '44px',
                background:     'var(--primary-500)',
                borderRadius:   'var(--radius-md)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                boxShadow:      'var(--shadow-glow-primary)',
              }}
            >
              <ShieldCheck size={24} color="var(--text-inverted)" strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      '1rem',
                  fontWeight:    700,
                  color:         'var(--text-primary)',
                  letterSpacing: '0.15em',
                }}
              >
                KOAJ ACCESS
              </div>
              <div
                style={{
                  fontFamily:    'var(--font-ui)',
                  fontSize:      '0.7rem',
                  color:         'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                Permoda S.A.S.
              </div>
            </div>
          </div>

          {/* Título principal */}
          <h1
            className="animate-fade-up stagger-2"
            style={{
              fontSize:      'clamp(2rem, 4vw, 3rem)',
              fontWeight:    800,
              lineHeight:    1.1,
              color:         'var(--text-primary)',
              marginBottom:  '24px',
              letterSpacing: '-0.02em',
            }}
          >
            Control de{' '}
            <span
              style={{
                color:             'transparent',
                backgroundImage:   'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                WebkitBackgroundClip: 'text',
                backgroundClip:    'text',
              }}
            >
              accesos
            </span>
            <br />
            inteligente.
          </h1>

          {/* Descripción */}
          <p
            className="animate-fade-up stagger-3"
            style={{
              fontSize:     '0.95rem',
              color:        'var(--text-secondary)',
              lineHeight:   1.7,
              marginBottom: '48px',
              maxWidth:     '380px',
            }}
          >
            Sistema unificado para gestión de parqueadero, autorizaciones HSE,
            activos NFC y citas de gestión humana.
          </p>


        </div>
      </div>

      {/* ══ PANEL DERECHO — Formulario ════════════════════════════ */}
      <div
        style={{
          width:          '480px',
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          padding:        '64px 48px',
          background:     'var(--bg-surface)',
          borderLeft:     '1px solid var(--border-subtle)',
          position:       'relative',
        }}
        className="animate-slide-right"
      >

        {/* Gradiente sutil en el panel */}
        <div
          style={{
            position:      'absolute',
            top:           0,
            left:          0,
            right:         0,
            height:        '300px',
            background:    'radial-gradient(ellipse at 50% 0%, rgba(69,116,196,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header del formulario */}
          <div style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize:     '1.5rem',
                fontWeight:   700,
                color:        'var(--text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.01em',
              }}
            >
              Iniciar sesión
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error global */}
          {errorMsg && (
            <div
              style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:          '10px',
                padding:      '12px 14px',
                background:   'rgba(192,80,80,0.08)',
                border:       '1px solid rgba(192,80,80,0.2)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                animation:    'fadeUp 0.2s ease both',
              }}
            >
              <AlertCircle size={16} color="var(--danger-400)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '0.83rem', color: 'var(--danger-400)', lineHeight: 1.5 }}>
                {errorMsg}
              </span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Campo email */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display:      'block',
                  fontSize:     '0.78rem',
                  fontWeight:   500,
                  color:        'var(--text-secondary)',
                  marginBottom: '8px',
                  letterSpacing: '0.03em',
                }}
              >
                CORREO ELECTRÓNICO
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  style={{
                    position:  'absolute',
                    left:      '14px',
                    top:       '50%',
                    transform: 'translateY(-50%)',
                    color:     errors.email ? 'var(--danger-400)' : 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="usuario@permoda.com"
                  autoComplete="email"
                  style={{
                    width:        '100%',
                    padding:      '11px 14px 11px 40px',
                    fontSize:     '0.875rem',
                    borderColor:  errors.email ? 'var(--danger-500)' : undefined,
                  }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger-400)', marginTop: '6px' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo password */}
            <div style={{ marginBottom: '28px' }}>
              <label
                style={{
                  display:      'block',
                  fontSize:     '0.78rem',
                  fontWeight:   500,
                  color:        'var(--text-secondary)',
                  marginBottom: '8px',
                  letterSpacing: '0.03em',
                }}
              >
                CONTRASEÑA
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  style={{
                    position:  'absolute',
                    left:      '14px',
                    top:       '50%',
                    transform: 'translateY(-50%)',
                    color:     errors.password ? 'var(--danger-400)' : 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width:        '100%',
                    padding:      '11px 44px 11px 40px',
                    fontSize:     '0.875rem',
                    borderColor:  errors.password ? 'var(--danger-500)' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position:   'absolute',
                    right:      '12px',
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
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: '0.75rem', color: 'var(--danger-400)', marginTop: '6px' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width:          '100%',
                padding:        '13px 24px',
                background:     isLoading
                  ? 'var(--primary-700)'
                  : 'var(--primary-500)',
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
                transition:     'all var(--transition-fast)',
                boxShadow:      isLoading ? 'none' : 'var(--shadow-glow-primary)',
                letterSpacing:  '0.02em',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = 'var(--primary-600)'
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = 'var(--primary-500)'
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width:        '16px',
                      height:       '16px',
                      border:       '2px solid rgba(0,0,0,0.3)',
                      borderTop:    '2px solid var(--text-inverted)',
                      borderRadius: '50%',
                      animation:    'spin 1s linear infinite',
                    }}
                  />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop:  '40px',
              paddingTop: '24px',
              borderTop:  '1px solid var(--border-subtle)',
              textAlign:  'center',
            }}
          >
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Sistema de uso exclusivo para personal autorizado de{' '}
              <span style={{ color: 'var(--text-secondary)' }}>Permoda S.A.S.</span>
              <br />
              v2.0.0 — {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
