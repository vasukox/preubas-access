import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react'

import { useSedeStore } from '@/store'
import { useGHImportacion, useGHImportacionDetalle } from '@/hooks/gh/useGHImportacion'

// ─── helpers ──────────────────────────────────────────────────────────────────

type RowStatus = 'EXITOSO' | 'ERROR' | string

function StatusIcon({ estado }: { estado: RowStatus }) {
  if (estado === 'EXITOSO') return <CheckCircle2 size={14} color="#10b981" />
  if (estado === 'ERROR') return <XCircle size={14} color="#ef4444" />
  return <AlertCircle size={14} color="#f59e0b" />
}

function rowColor(estado: RowStatus) {
  if (estado === 'EXITOSO') return { color: '#10b981', bg: 'rgba(40,149,108,0.04)', border: 'rgba(40,149,108,0.15)' }
  if (estado === 'ERROR') return { color: '#ef4444', bg: 'rgba(192,80,80,0.04)', border: 'rgba(192,80,80,0.15)' }
  return { color: '#f59e0b', bg: 'rgba(69,116,196,0.04)', border: 'rgba(69,116,196,0.15)' }
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  const color = done ? '#10b981' : active ? 'var(--primary-400)' : 'var(--text-muted)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `2px solid ${color}`, background: done ? '#10b981' : active ? 'rgba(14,165,233,0.1)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', fontSize: '0.78rem', fontWeight: 800, color: done ? '#fff' : color }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

function Steps({ step }: { step: number }) {
  const steps = ['Seleccionar archivo', 'Registrar', 'Resultados']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      {steps.map((label, i) => (
        <>
          <StepDot key={label} n={i + 1} label={label} active={step === i + 1} done={step > i + 1} />
          {i < steps.length - 1 && (
            <div key={`sep-${i}`} style={{ flex: 1, height: '2px', background: step > i + 1 ? '#10b981' : 'var(--border-subtle)', borderRadius: '1px', transition: 'background 0.3s', minWidth: '40px', maxWidth: '80px' }} />
          )}
        </>
      ))}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function GHImportacionView() {
  const sedeActiva = useSedeStore((s) => s.sedeActiva)
  const sedeId = sedeActiva?.id ?? null

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [importacionId, setImportacionId] = useState<number | null>(null)

  const importacionMutation = useGHImportacion()
  const { data: detalle, isFetching: fetchingDetalle } = useGHImportacionDetalle(importacionId)

  const step = !file ? 1 : !importacionId ? 2 : 3

  const rows = useMemo(
    () => (detalle?.detalles ?? []).map((item) => ({
      fila: item.numero_fila,
      estado: item.estado,
      mensaje: item.mensaje,
    })),
    [detalle],
  )

  const statsRows = useMemo(() => ({
    total: rows.length,
    exitosos: rows.filter((r) => r.estado === 'EXITOSO').length,
    errores: rows.filter((r) => r.estado === 'ERROR').length,
  }), [rows])

  const handleRegistrar = () => {
    if (!file || !sedeId) return
    importacionMutation.mutate(
      { sede_id: sedeId, nombre_archivo: file.name },
      {
        onSuccess: (created) => {
          setImportacionId(created.id)
          toast.success(`Importación #${created.id} registrada`)
        },
        onError: () => toast.error('No se pudo registrar la importación.'),
      },
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  const handleReset = () => {
    setFile(null)
    setImportacionId(null)
  }

  if (!sedeId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Selecciona una sede para importar datos GH.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>

      {/* ── Header ── */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 6px #6366f1' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#6366f1', letterSpacing: '0.12em' }}>MÓDULO GH — IMPORTACIÓN MASIVA</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Importación GH</h2>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Carga masiva de candidatos — Sede: <strong style={{ color: 'var(--text-secondary)' }}>{sedeActiva?.nombre}</strong>
          </div>
        </div>
        {importacionId && (
          <button type="button" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }} onClick={handleReset}>
            <RefreshCw size={13} /> Nueva importación
          </button>
        )}
      </div>

      {/* ── Step indicator ── */}
      <div className="animate-fade-up stagger-1" style={{ padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
        <Steps step={step} />
      </div>

      {/* ── Step 1 & 2: Upload + Register ── */}
      {!importacionId && (
        <div className="animate-fade-up stagger-2" style={{ display: 'grid', gap: '16px' }}>
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? '#6366f1' : file ? 'rgba(40,149,108,0.4)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '40px 24px',
              textAlign: 'center',
              background: dragging ? 'rgba(86,104,184,0.04)' : file ? 'rgba(40,149,108,0.03)' : 'var(--bg-surface)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('gh-file-input')?.click()}
          >
            <input
              id="gh-file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }}
            />
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(40,149,108,0.1)', border: '1px solid rgba(40,149,108,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{file.name}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {(file.size / 1024).toFixed(1)} KB · {file.type || 'archivo'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  style={{ fontSize: '0.72rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: dragging ? 'rgba(86,104,184,0.1)' : 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color={dragging ? '#6366f1' : 'var(--text-muted)'} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dragging ? 'Suelta el archivo aquí' : 'Arrastra el archivo o haz clic para seleccionar'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Formatos aceptados: CSV, XLSX, XLS
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info + submit */}
          <div style={{ padding: '14px 18px', background: 'rgba(86,104,184,0.04)', border: '1px solid rgba(86,104,184,0.15)', borderRadius: 'var(--radius-lg)', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            El archivo debe contener columnas: <strong style={{ color: 'var(--text-secondary)' }}>tipo_documento, numero_documento, nombres, apellidos, email, telefono</strong>. La primera fila debe ser el encabezado.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 24px', fontSize: '0.85rem' }}
              disabled={!file || importacionMutation.isPending}
              onClick={handleRegistrar}
            >
              {importacionMutation.isPending
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Registrando...</>
                : <><ChevronRight size={15} /> Registrar importación</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {importacionId && (
        <div className="animate-fade-up stagger-2" style={{ display: 'grid', gap: '14px' }}>
          {/* Summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Total filas', value: statsRows.total, color: '#6366f1', bg: 'rgba(86,104,184,0.08)', border: 'rgba(86,104,184,0.18)' },
              { label: 'Exitosas', value: statsRows.exitosos, color: '#10b981', bg: 'rgba(40,149,108,0.08)', border: 'rgba(40,149,108,0.18)' },
              { label: 'Con error', value: statsRows.errores, color: '#ef4444', bg: 'rgba(192,80,80,0.08)', border: 'rgba(192,80,80,0.18)' },
            ].map((s) => (
              <div key={s.label} style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `1px solid ${s.border}`, background: s.bg }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
            <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Importación</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>#{importacionId}</div>
              {fetchingDetalle && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> actualizando</div>}
            </div>
          </div>

          {/* Rows table */}
          {rows.length > 0 && (
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th align="left" style={{ padding: '11px 16px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>#</th>
                      <th align="left" style={{ padding: '11px 16px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>ESTADO</th>
                      <th align="left" style={{ padding: '11px 16px', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>MENSAJE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const c = rowColor(row.estado)
                      return (
                        <tr key={row.fila} style={{ borderTop: '1px solid var(--border-subtle)', background: c.bg }}>
                          <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>{row.fila}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: `1px solid ${c.border}`, background: `${c.color}10`, color: c.color, fontSize: '0.68rem', fontWeight: 700 }}>
                              <StatusIcon estado={row.estado} />
                              {row.estado}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.mensaje}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rows.length === 0 && !fetchingDetalle && (
            <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No hay resultados disponibles aún para la importación #{importacionId}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

