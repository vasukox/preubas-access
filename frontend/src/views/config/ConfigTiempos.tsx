import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Shield, AlertTriangle, Zap, Pencil, X, Check } from 'lucide-react'
import { configService, TiemposContratista, TipoContratistaConfig } from '@/services/config.service'
import { getErrorMessage } from '@/services/api'

// ── Meta visual por tipo de contratista ─────────────────────────────
const TYPE_META: Record<TipoContratistaConfig, {
  label:       string
  description: string
  color:       string
  icon:        React.ReactNode
}> = {
  NORMAL: {
    label:       'Normal',
    description: 'Contratistas con acceso estándar sin restricciones adicionales.',
    color:       '#28956C',
    icon:        <Shield size={17} />,
  },
  ALTO_RIESGO: {
    label:       'Alto Riesgo',
    description: 'Actividades de alto riesgo. Requiere examen médico y seguridad social vigentes.',
    color:       '#D4860A',
    icon:        <AlertTriangle size={17} />,
  },
  EXCEPCION: {
    label:       'Excepción',
    description: 'Acceso temporal por excepción. Plazos reducidos y supervisión reforzada.',
    color:       '#7C3AED',
    icon:        <Zap size={17} />,
  },
}

type DraftTiempos = Omit<TiemposContratista, 'id' | 'tipo_contratista'>

// ── Estilos compartidos ──────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.73rem',
  color: 'var(--text-muted)',
  fontWeight: 500,
  letterSpacing: '0.02em',
  marginBottom: '4px',
}

// ── Tarjeta de tipo de contratista ───────────────────────────────────
function TiemposCard({ tiempos }: { tiempos: TiemposContratista }) {
  const queryClient = useQueryClient()
  const meta    = TYPE_META[tiempos.tipo_contratista]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState<DraftTiempos>({
    token_duracion_horas:      tiempos.token_duracion_horas,
    autorizacion_duracion_dias: tiempos.autorizacion_duracion_dias,
    alerta_vencimiento_dias:   tiempos.alerta_vencimiento_dias,
    requiere_examen_medico:    tiempos.requiere_examen_medico,
    requiere_seguridad_social: tiempos.requiere_seguridad_social,
  })

  const mutation = useMutation({
    mutationFn: (data: DraftTiempos) =>
      configService.updateTiemposContratista(tiempos.tipo_contratista, data),
    onSuccess: () => {
      toast.success(`Parámetros de tipo ${meta.label} guardados.`)
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['tiempos-contratista'] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleCancel = () => {
    setDraft({
      token_duracion_horas:      tiempos.token_duracion_horas,
      autorizacion_duracion_dias: tiempos.autorizacion_duracion_dias,
      alerta_vencimiento_dias:   tiempos.alerta_vencimiento_dias,
      requiere_examen_medico:    tiempos.requiere_examen_medico,
      requiere_seguridad_social: tiempos.requiere_seguridad_social,
    })
    setEditing(false)
  }

  return (
    <div style={{
      border:       `1px solid ${editing ? meta.color + '55' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-xl)',
      background:   'var(--bg-raised)',
      overflow:     'hidden',
      transition:   'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      boxShadow:    'var(--shadow-card)',
    }}>
      {/* ── Cabecera ─────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '12px',
        padding:    '14px 16px',
        background: `${meta.color}0D`,
        borderBottom: `1px solid ${meta.color}22`,
      }}>
        {/* Ícono de tipo */}
        <div style={{
          width: '34px', height: '34px', flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: `${meta.color}20`,
          border: `1px solid ${meta.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta.color,
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {meta.label}
            </span>
            <span style={{
              fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
              padding: '2px 8px', borderRadius: '999px',
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}44`,
              color: meta.color, letterSpacing: '0.06em',
            }}>
              {tiempos.tipo_contratista}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {meta.description}
          </p>
        </div>

        {/* Botón editar / acciones */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem', fontFamily: 'var(--font-ui)',
              cursor: 'pointer',
            }}
          >
            <Pencil size={13} />
            Editar
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCancel}
              disabled={mutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 10px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                fontSize: '0.78rem', fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate(draft)}
              disabled={mutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${meta.color}66`,
                background: `${meta.color}18`,
                color: meta.color,
                fontSize: '0.78rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
                cursor: mutation.isPending ? 'wait' : 'pointer',
                opacity: mutation.isPending ? 0.7 : 1,
              }}
            >
              <Check size={13} />
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* ── Campos de configuración ───────────────────────────────── */}
      <div style={{
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
      }}>

        {/* Token duración */}
        <div>
          <div style={labelStyle}>Token de acceso (horas)</div>
          {editing ? (
            <input
              type="number" min={1} max={8760}
              value={draft.token_duracion_horas}
              onChange={e => setDraft(d => ({ ...d, token_duracion_horas: Number(e.target.value) }))}
              style={inputStyle}
            />
          ) : (
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)' }}>
              {tiempos.token_duracion_horas}h
            </div>
          )}
        </div>

        {/* Autorización duración */}
        <div>
          <div style={labelStyle}>Autorización máxima (días)</div>
          {editing ? (
            <input
              type="number" min={1} max={365}
              value={draft.autorizacion_duracion_dias}
              onChange={e => setDraft(d => ({ ...d, autorizacion_duracion_dias: Number(e.target.value) }))}
              style={inputStyle}
            />
          ) : (
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)' }}>
              {tiempos.autorizacion_duracion_dias}d
            </div>
          )}
        </div>

        {/* Alerta vencimiento */}
        <div>
          <div style={labelStyle}>Alerta de vencimiento (días previos)</div>
          {editing ? (
            <input
              type="number" min={1} max={30}
              value={draft.alerta_vencimiento_dias}
              onChange={e => setDraft(d => ({ ...d, alerta_vencimiento_dias: Number(e.target.value) }))}
              style={inputStyle}
            />
          ) : (
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: meta.color, fontFamily: 'var(--font-mono)' }}>
              {tiempos.alerta_vencimiento_dias}d
            </div>
          )}
        </div>

        {/* Requiere examen médico */}
        <div>
          <div style={labelStyle}>Requiere examen médico</div>
          {editing ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '4px' }}>
              <input
                type="checkbox"
                checked={draft.requiere_examen_medico}
                onChange={e => setDraft(d => ({ ...d, requiere_examen_medico: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: meta.color }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {draft.requiere_examen_medico ? 'Sí, obligatorio' : 'No requerido'}
              </span>
            </label>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '999px',
              background: tiempos.requiere_examen_medico ? `${meta.color}18` : 'var(--bg-surface)',
              border: `1px solid ${tiempos.requiere_examen_medico ? meta.color + '44' : 'var(--border-subtle)'}`,
              fontSize: '0.78rem', fontWeight: 600,
              color: tiempos.requiere_examen_medico ? meta.color : 'var(--text-muted)',
            }}>
              {tiempos.requiere_examen_medico ? '✓ Sí' : '✗ No'}
            </div>
          )}
        </div>

        {/* Requiere seguridad social */}
        <div>
          <div style={labelStyle}>Requiere seguridad social</div>
          {editing ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '4px' }}>
              <input
                type="checkbox"
                checked={draft.requiere_seguridad_social}
                onChange={e => setDraft(d => ({ ...d, requiere_seguridad_social: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: meta.color }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {draft.requiere_seguridad_social ? 'Sí, obligatorio' : 'No requerido'}
              </span>
            </label>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '999px',
              background: tiempos.requiere_seguridad_social ? `${meta.color}18` : 'var(--bg-surface)',
              border: `1px solid ${tiempos.requiere_seguridad_social ? meta.color + '44' : 'var(--border-subtle)'}`,
              fontSize: '0.78rem', fontWeight: 600,
              color: tiempos.requiere_seguridad_social ? meta.color : 'var(--text-muted)',
            }}>
              {tiempos.requiere_seguridad_social ? '✓ Sí' : '✗ No'}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Vista principal ──────────────────────────────────────────────────
export default function ConfigTiempos() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['tiempos-contratista'],
    queryFn:  configService.listTiemposContratista,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando tiempos por tipo de contratista…
      </div>
    )
  }

  const ORDER: TipoContratistaConfig[] = ['NORMAL', 'ALTO_RIESGO', 'EXCEPCION']

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      {ORDER.map(tipo => {
        const tiempos = data.find(t => t.tipo_contratista === tipo)
        return tiempos ? <TiemposCard key={tipo} tiempos={tiempos} /> : null
      })}
    </div>
  )
}
