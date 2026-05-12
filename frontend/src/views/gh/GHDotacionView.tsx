import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Hash,
  Info,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react'

import { useSedeStore } from '@/store'
import {
  useAgregarDetalleEntregaDotacion,
  useBuscarCandidatosDotacion,
  useCerrarEntregaDotacion,
  useCrearGHEntregaDotacion,
  useCrearGHMaestroDotacion,
  useGHEntregasDotacion,
  useGHMaestroDotacion,
} from '@/hooks/gh/useGHDotacion'
import type { GhDotacionEntrega, GhEstadoEntregaDotacion, GhMaestroDotacion } from '@/types/gh'

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ESTADO_META: Record<GhEstadoEntregaDotacion, { label: string; color: string; bg: string; border: string }> = {
  PENDIENTE:    { label: 'Pendiente',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  PARCIAL:      { label: 'Parcial',      color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)' },
  COMPLETA:     { label: 'Completa',     color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  REPROGRAMADA: { label: 'Reprogramada', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)' },
  ANULADA:      { label: 'Anulada',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)' },
}

// ─── EstadoBadge ──────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: GhEstadoEntregaDotacion }) {
  const meta = ESTADO_META[estado] ?? ESTADO_META.PENDIENTE
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: 'var(--radius-full)', border: `1px solid ${meta.border}`, background: meta.bg, color: meta.color, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>
      {estado === 'COMPLETA' && <Check size={11} strokeWidth={3} />}
      {meta.label.toUpperCase()}
    </span>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = '#10b981', bg = 'rgba(16,185,129,0.08)' }: { value: number; color?: string; bg?: string }) {
  return (
    <div style={{ height: '6px', borderRadius: '999px', background: bg, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, value)}%`, background: color, borderRadius: '999px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

// ─── KitPreview — animated box shown when maestro is matched ──────────────────

function KitPreviewCard({ maestro }: { maestro: GhMaestroDotacion }) {
  return (
    <div
      style={{
        padding: '16px', borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(245,158,11,0.3)',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
        animation: 'slideDown 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Sparkles size={14} color="#f59e0b" />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em' }}>KIT ASIGNADO POR REGLA</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)' }}>
          {maestro.kit_codigo}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {maestro.cargo} · {maestro.tipo_contrato}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{maestro.kit_descripcion}</p>
    </div>
  )
}

// ─── NuevoMaestroModal ────────────────────────────────────────────────────────

function NuevoMaestroModal({
  sedeId,
  initialArea,
  onClose,
}: {
  sedeId: number
  initialArea?: string
  onClose: () => void
}) {
  const crearMaestro = useCrearGHMaestroDotacion()
  const [form, setForm] = useState({
    area: initialArea ?? '',
    cargo: '',
    tipo_contrato: '',
    kit_codigo: '',
    kit_descripcion: '',
  })

  const areaLocked = !!initialArea

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
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '5px',
    display: 'block',
  }

  const handleSave = () => {
    if (!form.area || !form.cargo || !form.tipo_contrato || !form.kit_codigo || !form.kit_descripcion) {
      toast.error('Completa todos los campos')
      return
    }
    crearMaestro.mutate(
      { sede_id: sedeId, area: form.area, cargo: form.cargo, tipo_contrato: form.tipo_contrato, kit_codigo: form.kit_codigo, kit_descripcion: form.kit_descripcion, activo: true },
      {
        onSuccess: () => { toast.success('Regla guardada'); onClose() },
        onError: () => toast.error('Error al guardar'),
      },
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2300, padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash size={16} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
              {areaLocked ? `Nueva regla — ${initialArea}` : 'Nueva regla de dotación'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Define qué kit se asigna según área, cargo y tipo de contrato
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: '22px 24px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={labelStyle}>Área</span>
              <input
                placeholder="Ej: VENTAS"
                value={form.area}
                disabled={areaLocked}
                onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                style={{ ...fieldStyle, ...(areaLocked ? { opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-elevated)' } : {}) }}
              />
            </div>
            <div>
              <span style={labelStyle}>Cargo</span>
              <input placeholder="Ej: ASESOR" value={form.cargo} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))} style={fieldStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={labelStyle}>Tipo de contrato</span>
              <input placeholder="Ej: Término Fijo" value={form.tipo_contrato} onChange={(e) => setForm((p) => ({ ...p, tipo_contrato: e.target.value }))} style={fieldStyle} />
            </div>
          </div>

          <div style={{ padding: '14px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-lg)', display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Sparkles size={13} color="#f59e0b" />
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.08em' }}>DETALLES DEL KIT</span>
            </div>
            <input
              placeholder="Código (KIT-01, KIT-VENTAS...)"
              value={form.kit_codigo}
              onChange={(e) => setForm((p) => ({ ...p, kit_codigo: e.target.value }))}
              style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }}
            />
            <textarea
              placeholder="Descripción completa del kit (qué incluye, tallas, cantidades...)"
              rows={3}
              value={form.kit_descripcion}
              onChange={(e) => setForm((p) => ({ ...p, kit_descripcion: e.target.value }))}
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-elevated)' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={crearMaestro.isPending} onClick={handleSave}>
            {crearMaestro.isPending ? 'Guardando...' : 'Guardar regla'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AreaCard ─────────────────────────────────────────────────────────────────

function AreaCard({ area, reglas, onAddRegla }: { area: string; reglas: GhMaestroDotacion[]; onAddRegla: (area: string) => void }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      {/* Header */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'background 0.1s' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Briefcase size={18} color="#f59e0b" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{area}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {reglas.length} regla{reglas.length !== 1 ? 's' : ''} de dotación configurada{reglas.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onAddRegla(area) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus size={13} /> Agregar regla
        </button>
        <div style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Rules table */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['CARGO', 'TIPO CONTRATO', 'KIT ASIGNADO', 'DESCRIPCIÓN'].map((h) => (
                  <th key={h} align="left" style={{ padding: '9px 16px', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reglas.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)', transition: 'background 0.1s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.03)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{r.cargo}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', padding: '3px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>
                      {r.tipo_contrato}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', padding: '4px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
                      {r.kit_codigo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '320px' }}>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.kit_descripcion}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── EntregaCard ──────────────────────────────────────────────────────────────

function EntregaCard({
  entrega,
  onAgregarDetalle,
  onCerrar,
}: {
  entrega: GhDotacionEntrega
  onAgregarDetalle: (entrega: GhDotacionEntrega) => void
  onCerrar: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = ESTADO_META[entrega.estado_entrega] ?? ESTADO_META.PENDIENTE
  const candidatoNombre = entrega.candidato
    ? `${entrega.candidato.nombres} ${entrega.candidato.apellidos}`
    : `Candidato #${entrega.candidato_id}`
  const canClose = entrega.estado_entrega === 'PENDIENTE' || entrega.estado_entrega === 'PARCIAL'

  return (
    <div style={{ border: `1px solid ${meta.border}`, borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      {/* Card header */}
      <div
        style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start', cursor: 'pointer' }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: 'grid', gap: '6px' }}>
          {/* Row 1: nombre + estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)', background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={14} color={meta.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{candidatoNombre}</div>
              {entrega.candidato && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                  {entrega.candidato.tipo_documento} {entrega.candidato.numero_documento}
                  {entrega.candidato.email && <span style={{ marginLeft: '8px' }}>· {entrega.candidato.email}</span>}
                </div>
              )}
            </div>
            <EstadoBadge estado={entrega.estado_entrega} />
          </div>

          {/* Row 2: area + cargo + kit */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '42px' }}>
            {(entrega.area || entrega.cargo) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <Briefcase size={11} />
                {[entrega.area, entrega.cargo].filter(Boolean).join(' — ')}
              </span>
            )}
            {entrega.maestro_dotacion && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                <Tag size={11} />
                {entrega.maestro_dotacion.kit_codigo}
              </span>
            )}
            {entrega.entregador_nombre && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <User size={10} />
                Resp: {entrega.entregador_nombre}
              </span>
            )}
          </div>

          {/* Row 3: progress + stats */}
          <div style={{ paddingLeft: '42px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>{entrega.items_entregados} de {entrega.total_items} ítems entregados</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: meta.color }}>{entrega.porcentaje_completitud}%</span>
            </div>
            <ProgressBar value={entrega.porcentaje_completitud} color={meta.color} bg={meta.bg} />
          </div>

          {/* Row 4: fecha */}
          <div style={{ paddingLeft: '42px', fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
            <span>Creada: {formatDateShort(entrega.fecha_creacion)}</span>
            {entrega.fecha_entrega && <span>Entregada: {formatDateShort(entrega.fecha_entrega)}</span>}
          </div>
        </div>

        {/* Right: chevron */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', paddingTop: '2px' }}>
          <div style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Expanded: items detail + actions */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 18px', background: 'var(--bg-elevated)' }}>

          {/* Maestro info box */}
          {entrega.maestro_dotacion && (
            <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700, marginBottom: '4px' }}>REGLA DE DOTACIÓN VINCULADA — {entrega.maestro_dotacion.kit_codigo}</div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{entrega.maestro_dotacion.kit_descripcion}</p>
              <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Contrato: <strong style={{ color: 'var(--text-secondary)' }}>{entrega.maestro_dotacion.tipo_contrato}</strong>
              </div>
            </div>
          )}

          {/* Items table */}
          {entrega.detalles.length > 0 ? (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '8px' }}>ÍTEMS DE ENTREGA</div>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th align="left" style={{ padding: '8px 12px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>CÓDIGO</th>
                      <th align="left" style={{ padding: '8px 12px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ÍTEM</th>
                      <th align="center" style={{ padding: '8px 12px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESPERADO</th>
                      <th align="center" style={{ padding: '8px 12px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENTREGADO</th>
                      <th align="left" style={{ padding: '8px 12px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entrega.detalles.map((d) => {
                      const itemColor = d.estado_item === 'ENTREGADO' ? '#10b981' : d.estado_item === 'FALTANTE' ? '#ef4444' : '#f59e0b'
                      return (
                        <tr key={d.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{d.item_codigo}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{d.item_nombre}</td>
                          <td align="center" style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{d.cantidad_esperada}</td>
                          <td align="center" style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: itemColor }}>{d.cantidad_entregada}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: `${itemColor}15`, color: itemColor, fontWeight: 700 }}>
                              {d.estado_item}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '14px', padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              Sin ítems registrados aún
            </div>
          )}

          {/* Observaciones */}
          {entrega.observaciones && (
            <div style={{ marginBottom: '14px', padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {entrega.observaciones}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {canClose && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAgregarDetalle(entrega) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.06)', color: '#0ea5e9', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={13} /> Agregar ítem
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCerrar(entrega.id) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)', color: '#10b981', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <CheckCircle2 size={13} /> Cerrar entrega
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`Entrega #${entrega.id} — ${candidatoNombre}`).then(() => toast.success('Copiado')).catch(() => {}) }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.74rem', cursor: 'pointer' }}
            >
              <Copy size={12} /> Copiar ref.
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AgregarDetalleModal ──────────────────────────────────────────────────────

function AgregarDetalleModal({ entrega, onClose }: { entrega: GhDotacionEntrega; onClose: () => void }) {
  const agregarMutation = useAgregarDetalleEntregaDotacion()
  const [form, setForm] = useState({ item_codigo: '', item_nombre: '', cantidad_esperada: 1, cantidad_entregada: 0 })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!form.item_codigo || !form.item_nombre) { setError('Código e ítem son obligatorios.'); return }
    try {
      await agregarMutation.mutateAsync({ id: entrega.id, payload: { item_codigo: form.item_codigo, item_nombre: form.item_nombre, cantidad_esperada: form.cantidad_esperada, cantidad_entregada: form.cantidad_entregada } })
      toast.success('Ítem agregado')
      onClose()
    } catch {
      setError('No se pudo agregar el ítem.')
    }
  }

  const fieldStyle = { padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', outline: 'none' } as const
  const labelStyle = { fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '5px', display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2400, padding: '20px', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={16} color="#0ea5e9" />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Agregar ítem de entrega</h3>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Entrega #{entrega.id} · {entrega.candidato?.nombres} {entrega.candidato?.apellidos}</p>
          </div>
        </div>
        <div style={{ padding: '20px 22px', display: 'grid', gap: '14px' }}>
          {error && <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.78rem' }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <span style={labelStyle}>Código</span>
              <input placeholder="ITM-001" value={form.item_codigo} onChange={(e) => setForm((p) => ({ ...p, item_codigo: e.target.value }))} style={{ ...fieldStyle, fontFamily: 'var(--font-mono)' }} />
            </div>
            <div>
              <span style={labelStyle}>Nombre del ítem</span>
              <input placeholder="Camiseta talla M..." value={form.item_nombre} onChange={(e) => setForm((p) => ({ ...p, item_nombre: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <span style={labelStyle}>Cantidad esperada</span>
              <input type="number" min={1} value={form.cantidad_esperada} onChange={(e) => setForm((p) => ({ ...p, cantidad_esperada: parseInt(e.target.value) || 1 }))} style={fieldStyle} />
            </div>
            <div>
              <span style={labelStyle}>Cantidad entregada</span>
              <input type="number" min={0} value={form.cantidad_entregada} onChange={(e) => setForm((p) => ({ ...p, cantidad_entregada: parseInt(e.target.value) || 0 }))} style={fieldStyle} />
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-elevated)' }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={agregarMutation.isPending}>
            {agregarMutation.isPending ? 'Guardando...' : 'Agregar ítem'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── NuevaEntregaModal ────────────────────────────────────────────────────────

function NuevaEntregaModal({ sedeId, maestroList, initialArea, onClose }: { sedeId: number; maestroList: GhMaestroDotacion[]; initialArea?: string; onClose: () => void }) {
  const crearMutation = useCrearGHEntregaDotacion()

  const [busquedaDoc, setBusquedaDoc] = useState('')
  const [candidatoSeleccionado, setCandidatoSeleccionado] = useState<{ id: number; nombre: string; doc: string } | null>(null)
  const [area, setArea] = useState(initialArea ?? '')
  const [cargo, setCargo] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: candidatosEncontrados = [], isFetching: buscandoCandidatos } = useBuscarCandidatosDotacion(busquedaDoc)

  const maestroMatch = useMemo(() => {
    if (!area.trim()) return null
    return maestroList.find(
      (m) => m.area.toLowerCase() === area.trim().toLowerCase() && (!cargo.trim() || m.cargo.toLowerCase() === cargo.trim().toLowerCase()),
    ) ?? maestroList.find(
      (m) => m.area.toLowerCase().includes(area.trim().toLowerCase()),
    ) ?? null
  }, [area, cargo, maestroList])

  const areasUnicas = useMemo(() => [...new Set(maestroList.map((m) => m.area))].sort(), [maestroList])
  const cargosParaArea = useMemo(() => {
    if (!area) return [...new Set(maestroList.map((m) => m.cargo))].sort()
    return [...new Set(maestroList.filter((m) => m.area.toLowerCase().includes(area.toLowerCase())).map((m) => m.cargo))].sort()
  }, [area, maestroList])

  const handleSubmit = async () => {
    if (!candidatoSeleccionado) { setError('Selecciona una persona.'); return }
    try {
      await crearMutation.mutateAsync({
        candidato_id: candidatoSeleccionado.id,
        maestro_dotacion_id: maestroMatch?.id ?? null,
        area: area.trim() || null,
        cargo: cargo.trim() || null,
        observaciones: observaciones.trim() || null,
      })
      toast.success(`Entrega creada para ${candidatoSeleccionado.nombre}`)
      onClose()
    } catch {
      setError('No se pudo crear la entrega.')
    }
  }

  const fieldStyle = { padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', outline: 'none' } as const
  const labelStyle = { fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: '5px', display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2300, padding: '20px', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shirt size={17} color="#f59e0b" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Nueva entrega de dotación</h3>
            <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>Registra la dotación para un colaborador y vincúlala al kit correspondiente</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'grid', gap: '22px' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.78rem' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* ── 1. Persona ── */}
          <section>
            <span style={labelStyle}>Persona que recibe la dotación</span>
            {candidatoSeleccionado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.06)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={16} color="#10b981" strokeWidth={3} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{candidatoSeleccionado.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>{candidatoSeleccionado.doc}</div>
                </div>
                <button type="button" onClick={() => setCandidatoSeleccionado(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
                  <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <input
                    placeholder="Buscar por nombre o documento..."
                    value={busquedaDoc}
                    onChange={(e) => setBusquedaDoc(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', color: 'var(--text-primary)' }}
                    autoFocus
                  />
                  {buscandoCandidatos && <div style={{ width: '14px', height: '14px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--primary-400)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', flexShrink: 0 }} />}
                </div>
                {candidatosEncontrados.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden' }}>
                    {candidatosEncontrados.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCandidatoSeleccionado({ id: c.id, nombre: `${c.nombres} ${c.apellidos}`, doc: `${c.tipo_documento} ${c.numero_documento}` }); setBusquedaDoc('') }}
                        style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color="var(--text-muted)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombres} {c.apellidos}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.tipo_documento} {c.numero_documento}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {busquedaDoc.length >= 2 && candidatosEncontrados.length === 0 && !buscandoCandidatos && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    No se encontraron resultados — el candidato debe tener una cita previa en el sistema.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 2. Área y Cargo ── */}
          <section>
            <span style={labelStyle}>Área y cargo de vinculación</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div>
                <span style={{ ...labelStyle, marginBottom: '4px' }}>Área</span>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: VENTAS, BODEGA..."
                  list="areas-entrega-list"
                  style={fieldStyle}
                />
                <datalist id="areas-entrega-list">
                  {areasUnicas.map((a) => <option key={a} value={a} />)}
                </datalist>
              </div>
              <div>
                <span style={{ ...labelStyle, marginBottom: '4px' }}>Cargo</span>
                <input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: VENDEDOR, AUXILIAR..."
                  list="cargos-entrega-list"
                  style={fieldStyle}
                />
                <datalist id="cargos-entrega-list">
                  {cargosParaArea.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            {/* Kit preview — animated reveal */}
            {maestroMatch ? (
              <KitPreviewCard maestro={maestroMatch} />
            ) : area.trim().length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.04)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <Info size={14} color="#6366f1" />
                No hay regla de dotación configurada para esta área. La entrega se creará sin kit vinculado.
              </div>
            ) : null}
          </section>

          {/* ── 3. Observaciones ── */}
          <section>
            <span style={labelStyle}>Observaciones (opcional)</span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas sobre esta entrega..."
              style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </section>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {candidatoSeleccionado ? candidatoSeleccionado.nombre : 'Sin persona seleccionada'}
            {maestroMatch && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>· Kit: {maestroMatch.kit_codigo}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={crearMutation.isPending || !candidatoSeleccionado}>
              {crearMutation.isPending ? 'Creando...' : 'Crear entrega'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function GHDotacionView() {
  const sede = useSedeStore((s) => s.sedeActiva)
  const sedeId = sede?.id ?? 0

  const [activeTab, setActiveTab] = useState<'entregas' | 'areas'>('entregas')
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [busqueda, setBusqueda] = useState('')
  const [openNuevaEntrega, setOpenNuevaEntrega] = useState(false)
  const [nuevaEntregaInitialArea, setNuevaEntregaInitialArea] = useState<string | undefined>(undefined)
  const [openNuevoMaestro, setOpenNuevoMaestro] = useState(false)
  const [nuevoMaestroInitialArea, setNuevoMaestroInitialArea] = useState<string | undefined>(undefined)
  const [detalleTarget, setDetalleTarget] = useState<GhDotacionEntrega | null>(null)

  const { data: maestro = [], isLoading: loadingMaestro, isFetching: fetchingMaestro } = useGHMaestroDotacion({ sede_id: sedeId, activos_only: true })
  const { data: entregas = [], isLoading: loadingEntregas, isFetching: fetchingEntregas, refetch: refetchEntregas } = useGHEntregasDotacion({ sede_id: sedeId, estado: filtroEstado || undefined })
  const cerrarEntregaMutation = useCerrarEntregaDotacion()

  const areasMaestro = useMemo(() => {
    const map = new Map<string, GhMaestroDotacion[]>()
    for (const m of maestro) {
      const key = m.area
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [maestro])

  // ── Filtered entregas ──
  const entregasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return entregas
    const term = busqueda.toLowerCase()
    return entregas.filter((e) => {
      const nombre = e.candidato ? `${e.candidato.nombres} ${e.candidato.apellidos}`.toLowerCase() : ''
      const doc = e.candidato?.numero_documento?.toLowerCase() ?? ''
      const area = e.area?.toLowerCase() ?? ''
      const kit = e.maestro_dotacion?.kit_codigo?.toLowerCase() ?? ''
      return nombre.includes(term) || doc.includes(term) || area.includes(term) || kit.includes(term)
    })
  }, [entregas, busqueda])

  // ── Stats ──
  const stats = useMemo(() => ({
    total: entregas.length,
    pendientes: entregas.filter((e) => e.estado_entrega === 'PENDIENTE').length,
    parciales: entregas.filter((e) => e.estado_entrega === 'PARCIAL').length,
    completas: entregas.filter((e) => e.estado_entrega === 'COMPLETA').length,
    anuladas: entregas.filter((e) => e.estado_entrega === 'ANULADA').length,
  }), [entregas])

  const handleCerrarEntrega = async (id: number) => {
    try {
      await cerrarEntregaMutation.mutateAsync(id)
      toast.success('Entrega cerrada correctamente')
    } catch {
      toast.error('No se pudo cerrar la entrega')
    }
  }

  if (!sede) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '40px', textAlign: 'center' }}>
        <Package size={36} color="var(--border-subtle)" style={{ marginBottom: '12px' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Selecciona una sede para gestionar dotación.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }} className="animate-fade-up">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#f59e0b', letterSpacing: '0.12em' }}>MÓDULO GH — DOTACIÓN</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Gestión de Dotación</h2>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sede activa: <strong style={{ color: 'var(--text-secondary)' }}>{sede.nombre}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {(fetchingEntregas || fetchingMaestro) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '5px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: '#f59e0b', animation: 'spin 0.8s linear infinite' }} />
              Sync
            </div>
          )}
          <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }} onClick={() => void refetchEntregas()}>
            <RefreshCw size={13} /> Actualizar
          </button>
          {activeTab === 'entregas' ? (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setNuevaEntregaInitialArea(undefined); setOpenNuevaEntrega(true) }}>
              <Plus size={15} /> Nueva entrega
            </button>
          ) : (
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setNuevoMaestroInitialArea(undefined); setOpenNuevoMaestro(true) }}>
              <Plus size={15} /> Nueva área
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }} className="animate-fade-up stagger-1">
        {([
          { key: '', label: 'Total', value: stats.total, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.18)' },
          { key: 'PENDIENTE', label: 'Pendientes', value: stats.pendientes, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
          { key: 'PARCIAL', label: 'Parciales', value: stats.parciales, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.18)' },
          { key: 'COMPLETA', label: 'Completas', value: stats.completas, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)' },
        ] as const).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => { setFiltroEstado(s.key); setActiveTab('entregas') }}
            style={{
              padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `1px solid ${filtroEstado === s.key ? s.color : s.border}`, background: filtroEstado === s.key ? s.bg : 'var(--bg-surface)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: filtroEstado === s.key ? s.color : 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
          </button>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden', alignSelf: 'flex-start', background: 'var(--bg-elevated)' }}>
        {(['entregas', 'areas'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === tab ? '#f59e0b' : 'transparent',
              color: activeTab === tab ? '#fff' : 'var(--text-muted)',
            }}
          >
            {tab === 'entregas' ? `Entregas (${stats.total})` : `Áreas (${areasMaestro.length})`}
          </button>
        ))}
      </div>

      {/* ── Entregas tab ── */}
      {activeTab === 'entregas' && (
        <div style={{ display: 'grid', gap: '12px' }} className="animate-fade-up">
          {/* Search + filter bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)' }}>
              <Search size={14} color="var(--text-muted)" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, documento, área o kit..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', color: 'var(--text-primary)' }} />
              {busqueda && <button type="button" onClick={() => setBusqueda('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14} /></button>}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['', 'PENDIENTE', 'PARCIAL', 'COMPLETA', 'ANULADA'] as const).map((e) => {
                const meta = e ? ESTADO_META[e as GhEstadoEntregaDotacion] : { label: 'Todos', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' }
                const isActive = filtroEstado === e
                return (
                  <button key={e} type="button" onClick={() => setFiltroEstado(e)} style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${isActive ? meta.color : 'var(--border-subtle)'}`, background: isActive ? meta.bg : 'transparent', color: isActive ? meta.color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {e ? meta.label : 'Todos'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Entregas list */}
          {loadingEntregas ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>Cargando entregas...</div>
          ) : entregasFiltradas.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              <Shirt size={36} color="var(--border-subtle)" style={{ marginBottom: '10px', display: 'inline-block' }} />
              <div style={{ fontSize: '0.85rem' }}>Sin entregas {filtroEstado ? `con estado "${filtroEstado}"` : 'registradas'}</div>
              <button type="button" className="btn-primary" style={{ marginTop: '16px', fontSize: '0.78rem' }} onClick={() => { setNuevaEntregaInitialArea(undefined); setOpenNuevaEntrega(true) }}>
                <Plus size={13} /> Crear primera entrega
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {entregasFiltradas.map((entrega) => (
                <EntregaCard key={entrega.id} entrega={entrega} onAgregarDetalle={setDetalleTarget} onCerrar={handleCerrarEntrega} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Áreas tab ── */}
      {activeTab === 'areas' && (
        <div style={{ display: 'grid', gap: '12px' }} className="animate-fade-up">
          {/* Info bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Info size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>Cada área puede tener múltiples reglas de dotación según cargo y tipo de contrato. El sistema usará estas reglas para sugerir automáticamente el kit al crear una entrega.</span>
          </div>

          {loadingMaestro ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.83rem' }}>Cargando áreas...</div>
          ) : areasMaestro.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              <ClipboardList size={36} color="var(--border-subtle)" style={{ marginBottom: '10px', display: 'inline-block' }} />
              <div style={{ fontSize: '0.85rem' }}>Sin áreas con dotación configurada</div>
              <div style={{ fontSize: '0.76rem', marginTop: '6px', marginBottom: '16px' }}>Crea la primera área y asígnale un kit de dotación</div>
              <button type="button" className="btn-primary" style={{ fontSize: '0.78rem' }} onClick={() => { setNuevoMaestroInitialArea(undefined); setOpenNuevoMaestro(true) }}>
                <Plus size={13} /> Crear primera área
              </button>
            </div>
          ) : (
            areasMaestro.map(([area, reglas]) => (
              <AreaCard
                key={area}
                area={area}
                reglas={reglas}
                onAddRegla={(a) => { setNuevoMaestroInitialArea(a); setOpenNuevoMaestro(true) }}
              />
            ))
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {openNuevaEntrega && (
        <NuevaEntregaModal
          sedeId={sedeId}
          maestroList={maestro}
          initialArea={nuevaEntregaInitialArea}
          onClose={() => { setOpenNuevaEntrega(false); setNuevaEntregaInitialArea(undefined) }}
        />
      )}

      {openNuevoMaestro && (
        <NuevoMaestroModal
          sedeId={sedeId}
          initialArea={nuevoMaestroInitialArea}
          onClose={() => { setOpenNuevoMaestro(false); setNuevoMaestroInitialArea(undefined) }}
        />
      )}

      {detalleTarget && (
        <AgregarDetalleModal entrega={detalleTarget} onClose={() => setDetalleTarget(null)} />
      )}
    </div>
  )
}

