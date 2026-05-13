import { useState } from 'react'
import { Check, CheckSquare, Square } from 'lucide-react'

import type { GhTipoCita } from '@/types/gh'

type CheckItem = { id: string; label: string; hint?: string }

const CHECKLISTS: Record<GhTipoCita, CheckItem[]> = {
  INDUCCION: [
    { id: 'identidad',    label: 'Verificación de identidad',         hint: 'Confirmar documento contra sistema' },
    { id: 'bienvenida',   label: 'Bienvenida y presentación',          hint: 'Presentación del equipo y espacio' },
    { id: 'normas',       label: 'Revisión de normas de convivencia',   hint: 'Reglamento interno y código de conducta' },
    { id: 'sst',          label: 'Inducción SST',                       hint: 'Seguridad y salud en el trabajo' },
    { id: 'procesos',     label: 'Procesos y procedimientos clave',     hint: 'Operación del cargo / área' },
    { id: 'firma_acuerdo',label: 'Firma de acuerdo de confidencialidad',hint: 'Acuerdo de no divulgación' },
    { id: 'credencial',   label: 'Entrega de credencial / carnet',      hint: 'Accesos y control de entrada' },
    { id: 'recorrido',    label: 'Recorrido de instalaciones',          hint: 'Áreas, salidas de emergencia, baños' },
  ],
  FIRMA_CONTRATO: [
    { id: 'revision_contrato',  label: 'Revisión del contrato con el candidato', hint: 'Leer cláusulas principales' },
    { id: 'verificacion_datos', label: 'Verificación de datos personales',        hint: 'Nombres, dirección, documento' },
    { id: 'firma_colaborador',  label: 'Firma del colaborador',                   hint: 'Firma y huella digital si aplica' },
    { id: 'firma_empresa',      label: 'Firma representante empresa',             hint: 'Representante legal o apoderado' },
    { id: 'copia_contrato',     label: 'Entrega de copia al colaborador',         hint: 'Original empresa, copia colaborador' },
    { id: 'registro_sistema',   label: 'Registro en sistema de nómina',           hint: 'SGSSS, ARL, caja compensación' },
    { id: 'documentos_soporte', label: 'Radicación de documentos soporte',        hint: 'Estudios, cuentas bancarias, etc.' },
  ],
  ENTREGA_DOTACION: [
    { id: 'verificacion_talla',  label: 'Verificación de talla / medidas',  hint: 'Confirmar talla en sistema' },
    { id: 'alistamiento_kit',    label: 'Alistamiento del kit de dotación',  hint: 'Preparar todos los elementos del kit' },
    { id: 'revision_items',      label: 'Revisión de ítems con el colaborador', hint: 'Verificar cada pieza antes de firmar' },
    { id: 'entrega_completa',    label: 'Entrega completa de dotación',      hint: 'Todos los ítems entregados' },
    { id: 'firma_acta',          label: 'Firma de acta de recibido',         hint: 'Acta con fecha, ítems y firma' },
    { id: 'registro_dotacion',   label: 'Registro en módulo de dotación',    hint: 'Marcar entrega como completa en sistema' },
  ],
}

interface ChecklistPanelProps {
  tipoCita?: GhTipoCita
}

export function ChecklistPanel({ tipoCita }: ChecklistPanelProps) {
  const items = tipoCita ? (CHECKLISTS[tipoCita] ?? []) : []
  const [checked, setChecked] = useState<Set<string>>(new Set())

  if (!tipoCita || items.length === 0) return null

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const done = checked.size
  const total = items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = done === total

  const labelMap: Record<GhTipoCita, string> = {
    INDUCCION: 'Checklist de inducción',
    FIRMA_CONTRATO: 'Checklist de firma de contrato',
    ENTREGA_DOTACION: 'Checklist de entrega de dotación',
  }

  const colorMap: Record<GhTipoCita, string> = {
    INDUCCION: '#6366f1',
    FIRMA_CONTRATO: '#10b981',
    ENTREGA_DOTACION: '#f59e0b',
  }

  const color = colorMap[tipoCita] ?? '#6366f1'

  return (
    <div style={{ padding: '20px 22px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{labelMap[tipoCita]}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {done} de {total} ítems completados
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {allDone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(40,149,108,0.1)', border: '1px solid rgba(40,149,108,0.25)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700 }}>
              <Check size={12} strokeWidth={3} /> Completo
            </span>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: allDone ? '#10b981' : color, lineHeight: 1 }}>{pct}%</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '5px', borderRadius: '999px', background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: '18px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: allDone ? '#10b981' : color, borderRadius: '999px', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>

      {/* Items */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {items.map((item) => {
          const isChecked = checked.has(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isChecked ? `${color}30` : 'var(--border-subtle)'}`,
                background: isChecked ? `${color}06` : 'var(--bg-elevated)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '1px' }}>
                {isChecked
                  ? <CheckSquare size={17} color={color} strokeWidth={2.5} />
                  : <Square size={17} color="var(--text-muted)" strokeWidth={1.5} />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: isChecked ? 600 : 500, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: isChecked ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                  {item.label}
                </div>
                {item.hint && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.hint}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

