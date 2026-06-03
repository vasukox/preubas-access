/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Vista de cambio de contraseña obligatorio.
 * Diseño: Industrial Luxury Dark — mismo layout que LoginView.
 * Se muestra cuando debe_cambiar_password = true.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ShieldCheck, Lock, Eye, EyeOff, AlertCircle,
  CheckCircle2, ArrowRight, ArrowLeft, KeyRound,
} from 'lucide-react'
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
    message: 'Las contraseñas no coinciden',
    path:    ['password_nueva_confirm'],
  })

type FormData = z.infer<typeof schema>

// ── Requisitos de contraseña ──────────────────────────────────────
function getRequisitos(pwd: string) {
  return [
    { label: 'Mínimo 8 caracteres',  ok: pwd.length >= 8 },
    { label: 'Una letra mayúscula',  ok: /[A-Z]/.test(pwd) },
    { label: 'Una letra minúscula',  ok: /[a-z]/.test(pwd) },
    { label: 'Un número',            ok: /\d/.test(pwd) },
    { label: 'Un carácter especial', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ]
}

// ═════════════════════════════════════════════════════════════════
export default function CambiarPasswordView() {
  const navigate     = useNavigate()
  const usuario      = useAuthStore((s) => s.usuario)
  const setUsuario   = useAuthStore((s) => s.setUsuario)
  const clearSession = useAuthStore((s) => s.clearSession)

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
      await post('/auth/change-password', {
        password_actual: data.password_actual,
        password_nueva:  data.password_nueva,
      })
      if (usuario) {
        const updated: UsuarioMe = { ...usuario, debe_cambiar_password: false }
        const access  = localStorage.getItem('koaj_access_token')  ?? ''
        const refresh = localStorage.getItem('koaj_refresh_token') ?? ''
        setUsuario(updated, access, refresh)
      }
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMsg(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVolverLogin = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ══ PANEL IZQUIERDO — Branding ═══════════════════════════ */}
      <div
        style={{
          flex: '1', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'flex-start',
          padding: '64px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F5FF 45%, #F8FAFE 100%)',
        }}
        className="animate-fade-in"
      >
        {/* Gradiente decorativo */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at 15% 55%, rgba(219, 234, 254, 0.80) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(191, 219, 254, 0.60) 0%, transparent 50%),
            radial-gradient(ellipse at 65% 88%, rgba(224, 242, 254, 0.50) 0%, transparent 40%)
          `,
        }} />
        <div className="bg-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />

        {/* Formas geométricas decorativas */}
        <div style={{ position: 'absolute', width: '440px', height: '440px', borderRadius: '50%', border: '1px solid rgba(15, 23, 42,0.10)', top: '-110px', right: '-140px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', border: '1px solid rgba(15, 23, 42,0.07)', bottom: '-80px', left: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15, 23, 42,0.07) 0%, transparent 70%)', top: '32%', right: '6%', pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '1px',
          background: 'linear-gradient(to bottom, transparent, var(--border-default), transparent)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>

          {/* Logo */}
          <div className="animate-fade-up stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '64px' }}>
            <div style={{
              width: '44px', height: '44px', background: 'var(--gradient-brand)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 4px 16px rgba(15, 23, 42,0.35)',
            }}>
              <ShieldCheck size={24} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.15em' }}>
                KOAJ ACCESS
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Permoda LTDA
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="animate-fade-up stagger-2" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.1,
            color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.02em',
          }}>
            Configura tu{' '}
            <span style={{
              color: 'var(--primary-600)',
            }}>
              contraseña
            </span>
            <br />
            segura.
          </h1>

          <p className="animate-fade-up stagger-3" style={{
            fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7,
            marginBottom: '48px', maxWidth: '380px',
          }}>
            Es tu primer acceso al sistema. Por seguridad, debes establecer
            una contraseña personal diferente antes de continuar.
          </p>

          {/* Requisitos como features */}
          <div className="animate-fade-up stagger-4" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requisitos.map((r) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
                <CheckCircle2
                  size={15}
                  color={r.ok ? 'var(--success-400)' : 'var(--border-default)'}
                  style={{ flexShrink: 0, transition: 'color 0.2s' }}
                />
                <span style={{ fontSize: '0.83rem', color: r.ok ? 'var(--text-secondary)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PANEL DERECHO — Formulario ════════════════════════════ */}
      <div
        style={{
          width: '480px', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '64px 48px',
          background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)',
          position: 'relative', boxShadow: '-16px 0 48px rgba(0,0,0,0.04)',
        }}
        className="animate-slide-right"
      >
        {/* Gradiente sutil */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '300px', pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 0%, var(--primary-50) 0%, transparent 70%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            {/* Ícono */}
            <div style={{
              width: '48px', height: '48px', marginBottom: '20px',
              background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound size={22} color="var(--primary-500)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
              Cambio de contraseña
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Requerido en el primer acceso al sistema
            </p>
          </div>

          {/* Aviso */}
          <div style={{
            padding: '10px 14px', marginBottom: '28px',
            background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
            borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--primary-600)', lineHeight: 1.5,
          }}>
            Por seguridad, debes cambiar tu contraseña antes de continuar.
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', marginBottom: '20px',
              background: 'rgba(220, 38, 38,0.08)', border: '1px solid rgba(220, 38, 38,0.2)',
              borderRadius: 'var(--radius-md)', animation: 'fadeUp 0.2s ease both',
            }}>
              <AlertCircle size={16} color="var(--danger-400)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '0.83rem', color: 'var(--danger-400)', lineHeight: 1.5 }}>{errorMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <Campo label="CONTRASEÑA ACTUAL"   name="password_actual"        register={register} error={errors.password_actual?.message}        show={showActual}  onToggle={() => setShowActual(v => !v)} />
            <Campo label="CONTRASEÑA NUEVA"    name="password_nueva"         register={register} error={errors.password_nueva?.message}         show={showNueva}   onToggle={() => setShowNueva(v => !v)} />
            <Campo label="CONFIRMAR CONTRASEÑA" name="password_nueva_confirm" register={register} error={errors.password_nueva_confirm?.message} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '13px 24px', marginTop: '4px',
                background: 'var(--gradient-primary)',
                border: 'none', borderRadius: 'var(--radius-md)',
                color: 'var(--text-inverted)', fontSize: '0.875rem', fontWeight: 600,
                fontFamily: 'var(--font-ui)', cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                boxShadow: '0 2px 4px rgba(15, 23, 42,0.20), 0 8px 24px rgba(15, 23, 42,0.22)',
                letterSpacing: '0.02em',
                opacity: isLoading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(15, 23, 42,0.28), 0 12px 32px rgba(15, 23, 42,0.30)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(15, 23, 42,0.20), 0 8px 24px rgba(15, 23, 42,0.22)' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Guardando...
                </>
              ) : (
                <>
                  Cambiar contraseña
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={handleVolverLogin}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.82rem',
                cursor: 'pointer', fontFamily: 'var(--font-ui)',
                padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </button>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
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

// ── Campo de contraseña reutilizable ─────────────────────────────
function Campo({ label, name, register, error, show, onToggle }: {
  label:    string
  name:     string
  register: any
  error?:   string
  show:     boolean
  onToggle: () => void
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.03em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: error ? 'var(--danger-400)' : 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          {...register(name)}
          type={show ? 'text' : 'password'}
          style={{ width: '100%', padding: '11px 44px 11px 40px', fontSize: '0.875rem', borderColor: error ? 'var(--danger-500)' : undefined }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--danger-400)', marginTop: '6px' }}>{error}</p>}
    </div>
  )
}
