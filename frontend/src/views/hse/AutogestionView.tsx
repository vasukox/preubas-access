/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Portal Autogestión HSE — Wizard público para contratistas
 * Acceso via: /portal/hse/:token
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShieldCheck, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, User, FileText,
  Heart, BookOpen, Loader,
} from 'lucide-react'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type {
  AutogestionTokenResponse,
} from '@/types/hse'

type UploadModulo = 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen'

const CLASIFICACION_ALTO_RIESGO_KEYS = [
  'trabajo_alturas',
  'espacios_confinados',
  'trabajo_electrico',
  'trabajo_caliente',
  'izaje_maquinaria',
] as const

const CLASIFICACION_BAJO_RIESGO_KEYS = [
  'visita_sin_riesgo',
  'personal_extranjero',
  'genera_residuos',
] as const

// ── Pasos del wizard ──────────────────────────────────────────────
type PasoKey =
  | 'sede' | 'datos' | 'actividad'
  | 'seg_social' | 'certificaciones' | 'medico'
  | 'emergencia' | 'normas'

const PASO_META: Record<PasoKey, { label: string; icon: React.ElementType }> = {
  sede:            { label: 'Sede',            icon: ShieldCheck   },
  datos:           { label: 'Datos',           icon: User          },
  actividad:       { label: 'Actividad',       icon: AlertTriangle },
  seg_social:      { label: 'Seg. Social',     icon: FileText      },
  certificaciones: { label: 'Certificaciones', icon: FileText      },
  medico:          { label: 'Médico',          icon: Heart         },
  emergencia:      { label: 'Emergencia',      icon: Heart         },
  normas:          { label: 'Normas',          icon: BookOpen      },
}

/** ALTO_RIESGO: 8 pasos completos */
const PASOS_ALTO_RIESGO: PasoKey[] = [
  'sede', 'datos', 'actividad',
  'seg_social', 'certificaciones', 'medico',
  'emergencia', 'normas',
]

/** NORMAL: solo 5 pasos — sin seg. social, sin certificaciones, sin médico */
const PASOS_NORMAL: PasoKey[] = [
  'sede', 'datos', 'actividad',
  'emergencia', 'normas',
]

// ── Estilos reutilizables ─────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  fontSize:     '0.875rem',
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  color:        'var(--text-primary)',
  fontFamily:   'var(--font-ui)',
  outline:      'none',
}

const labelStyle: React.CSSProperties = {
  display:       'block',
  fontSize:      '0.72rem',
  fontWeight:    500,
  color:         'var(--text-muted)',
  marginBottom:  '6px',
  letterSpacing: '0.05em',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  paddingRight: '32px',
  backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--text-muted) 50%), linear-gradient(135deg, var(--text-muted) 50%, transparent 50%)',
  backgroundPosition: 'calc(100% - 14px) calc(50% - 2px), calc(100% - 9px) calc(50% - 2px)',
  backgroundSize: '5px 5px, 5px 5px',
  backgroundRepeat: 'no-repeat',
  cursor: 'pointer',
}

function PdfUploadField({
  label,
  value,
  required = false,
  uploading = false,
  progress,
  onSelect,
}: {
  label: string
  value?: string
  required?: boolean
  uploading?: boolean
  progress?: number
  onSelect: (file: File) => void
}) {
  const fileName = value ? value.split('/').slice(-1)[0] : ''

  return (
    <div style={{ minWidth: 0 }}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: 'var(--danger-400)' }}>*</span>}
      </label>
      <div style={{ marginBottom: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        Solo PDF. Tamaño máximo recomendado: 8 MB.
      </div>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={e => {
          const file = e.target.files?.[0]
          if (!file) return
          onSelect(file)
          e.currentTarget.value = ''
        }}
        style={{ ...inputStyle, padding: '8px 10px' }}
      />
      {uploading && (
        <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--primary-400)' }}>
          Subiendo PDF... {progress ?? 0}%
        </div>
      )}
      {!uploading && value && (
        <div style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--success-400)', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <FileText size={13} style={{ flexShrink: 0 }} />
          <span style={{ flexShrink: 0 }}>✓ Archivo cargado:</span>
          <span
            title={fileName}
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              maxWidth: '100%',
            }}
          >
            {fileName}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Indicador de pasos ────────────────────────────────────────────
function PasoIndicador({
  pasoActual,
  pasosActivos,
}: {
  pasoActual:   number
  pasosActivos: PasoKey[]
}) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '4px',
      marginBottom:   '32px',
      flexWrap:       'wrap',
    }}>
      {pasosActivos.map((key, i) => {
        const meta      = PASO_META[key]
        const numero    = i + 1
        const activo    = numero === pasoActual
        const completado = numero < pasoActual
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '4px',
            }}>
              <div style={{
                width:          '32px',
                height:         '32px',
                borderRadius:   '50%',
                background:     completado
                  ? 'var(--success-400)'
                  : activo
                    ? 'var(--primary-500)'
                    : 'rgba(255,255,255,0.08)',
                border:         activo ? '2px solid var(--primary-400)' : '2px solid transparent',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '0.72rem',
                fontWeight:     700,
                color:          completado || activo ? 'white' : 'var(--text-muted)',
                boxShadow:      activo ? 'var(--shadow-glow-primary)' : 'none',
                transition:     'all 0.3s ease',
              }}>
                {completado ? <CheckCircle2 size={14} /> : numero}
              </div>
              <span style={{
                fontSize:  '0.6rem',
                color:     activo ? 'var(--primary-400)' : 'var(--text-muted)',
                fontWeight: activo ? 600 : 400,
                whiteSpace: 'nowrap',
              }}>
                {meta.label}
              </span>
            </div>
            {i < pasosActivos.length - 1 && (
              <div style={{
                width:      '24px',
                height:     '1px',
                background: completado ? 'var(--success-400)' : 'rgba(255,255,255,0.1)',
                margin:     '0 2px',
                marginBottom: '16px',
                transition: 'background 0.3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Paso 1 — Sede ─────────────────────────────────────────────────
function Paso1Sede({ data }: { data: AutogestionTokenResponse }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width:          '64px',
        height:         '64px',
        borderRadius:   '50%',
        background:     'rgba(245,158,11,0.1)',
        border:         '2px solid rgba(245,158,11,0.3)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        margin:         '0 auto 20px',
      }}>
        <ShieldCheck size={28} color="var(--primary-400)" />
      </div>
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Bienvenido al portal de autogestión
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: data.empresa_proveedor ? '16px' : '28px', lineHeight: 1.6 }}>
        Hola <strong style={{ color: 'var(--text-primary)' }}>{data.nombres}</strong>, completa tu información para autorizar tu ingreso a las instalaciones de Permoda S.A.S.
      </p>

      {/* Empresa destacada */}
      {data.empresa_proveedor && (
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '12px',
          padding:        '12px 16px',
          marginBottom:   '20px',
          background:     'rgba(99,102,241,0.1)',
          border:         '1px solid rgba(99,102,241,0.25)',
          borderRadius:   '12px',
          textAlign:      'left',
        }}>
          <div style={{
            width:          '36px',
            height:         '36px',
            borderRadius:   '8px',
            background:     'rgba(99,102,241,0.15)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#818CF8', letterSpacing: '0.08em', marginBottom: '2px' }}>EMPRESA / PROVEEDOR</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{data.empresa_proveedor}</div>
          </div>
        </div>
      )}

      <div style={{
        padding:      '16px 20px',
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        marginBottom: '16px',
        textAlign:    'left',
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '6px' }}>
          SEDE DE LA AUTORIZACIÓN
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-400)' }}>
          {data.sede_nombre}
        </div>
      </div>

      <div style={{
        padding:      '14px 20px',
        background:   'rgba(255,255,255,0.04)',
        border:       '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        textAlign:    'left',
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '6px' }}>
          ACTIVIDAD
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {data.descripcion_actividad}
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <span style={{
            padding:      '2px 8px',
            background:   data.tipo_contratista === 'ALTO_RIESGO'
              ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border:       `1px solid ${data.tipo_contratista === 'ALTO_RIESGO'
              ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            borderRadius: '20px',
            fontSize:     '0.72rem',
            color:        data.tipo_contratista === 'ALTO_RIESGO'
              ? 'var(--danger-400)' : 'var(--success-400)',
          }}>
            {data.tipo_contratista === 'ALTO_RIESGO' ? '⚠ Alto Riesgo' : '✓ Normal'}
          </span>
          <span style={{
            fontSize:   '0.72rem',
            color:      'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {data.fecha_inicio} → {data.fecha_fin}
          </span>
        </div>
      </div>

      {!data.empresa_proveedor && (
        <div style={{
          marginTop: '16px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px' }}>
            EMPRESA / PROVEEDOR AUTORIZADO
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No asignado
          </div>
        </div>
      )}
    </div>
  )
}

// ── Paso 2 — Datos personales ─────────────────────────────────────
function Paso2Datos({
  form,
  setForm,
  empresaProveedor,
}: {
  form:    any
  setForm: (f: any) => void
  empresaProveedor?: string | null
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Datos personales
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Confirma y completa tu información personal.
      </p>

      {empresaProveedor && (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          marginBottom: '14px',
          padding:      '8px 12px',
          borderRadius: '10px',
          background:   'rgba(99,102,241,0.08)',
          border:       '1px solid rgba(99,102,241,0.2)',
          fontSize:     '0.76rem',
          color:        'var(--text-secondary)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>EMPRESA: </span>
          <strong style={{ color: '#818CF8' }}>{empresaProveedor}</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>TIPO DOCUMENTO</label>
          <select
            value={form.tipo_documento}
            onChange={e => setForm((f: any) => ({ ...f, tipo_documento: e.target.value }))}
            style={selectStyle}
          >
            {['CC', 'CE', 'PASAPORTE', 'TI'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>NÚMERO DE DOCUMENTO</label>
          <input
            type="text"
            value={form.numero_documento}
            onChange={e => setForm((f: any) => ({ ...f, numero_documento: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>NOMBRES</label>
          <input
            type="text"
            value={form.nombres}
            onChange={e => setForm((f: any) => ({ ...f, nombres: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>APELLIDOS</label>
          <input
            type="text"
            value={form.apellidos}
            onChange={e => setForm((f: any) => ({ ...f, apellidos: e.target.value }))}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>EMAIL</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>TELÉFONO</label>
          <input
            type="text"
            value={form.telefono ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, telefono: e.target.value }))}
            placeholder="3001234567"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>CIUDAD</label>
          <input
            type="text"
            value={form.ciudad_operacion ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, ciudad_operacion: e.target.value }))}
            placeholder="Bogotá"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>DIRECCIÓN</label>
          <input
            type="text"
            value={form.direccion_domicilio ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, direccion_domicilio: e.target.value }))}
            placeholder="Calle 123 # 45-67"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Responsable SST */}
      <div style={{
        padding:      '14px 16px',
        background:   'rgba(245,158,11,0.05)',
        border:       '1px solid rgba(245,158,11,0.15)',
        borderRadius: '10px',
        marginTop:    '8px',
      }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--primary-400)', marginBottom: '10px', fontWeight: 600, letterSpacing: '0.06em' }}>
          RESPONSABLE SST
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>NOMBRE RESPONSABLE SST</label>
            <input
              type="text"
              value={form.sst_responsable_nombre ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, sst_responsable_nombre: e.target.value }))}
              placeholder="Nombre completo"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>TELÉFONO SST</label>
            <input
              type="text"
              value={form.sst_responsable_telefono ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, sst_responsable_telefono: e.target.value }))}
              placeholder="3001234567"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          id="tratamiento"
          checked={form.tratamiento_datos ?? false}
          onChange={e => setForm((f: any) => ({ ...f, tratamiento_datos: e.target.checked }))}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label htmlFor="tratamiento" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Acepto el tratamiento de mis datos personales por parte de Permoda S.A.S.
        </label>
      </div>
    </div>
  )
}

// ── Paso 3 — Clasificación ────────────────────────────────────────
function Paso3Clasificacion({
  form,
  setForm,
  esAltoRiesgo,
  onUploadPdf,
  uploadingCampo,
  uploadProgress,
}: {
  form:         any
  setForm:      (f: any) => void
  esAltoRiesgo: boolean
  onUploadPdf: (modulo: UploadModulo, campo: string, file: File) => Promise<string>
  uploadingCampo: string | null
  uploadProgress: Record<string, number>
}) {
  const preguntas = [
    { key: 'trabajo_alturas',    label: 'Trabajo en alturas',           riesgo: true  },
    { key: 'espacios_confinados', label: 'Espacios confinados',         riesgo: true  },
    { key: 'trabajo_electrico',  label: 'Trabajo eléctrico (CONTEC)',   riesgo: true  },
    { key: 'trabajo_caliente',   label: 'Trabajo en caliente',          riesgo: true  },
    { key: 'izaje_maquinaria',   label: 'Izaje de maquinaria',          riesgo: true  },
    { key: 'visita_sin_riesgo',  label: 'Visita / inspección sin riesgo', riesgo: false },
    { key: 'personal_extranjero', label: 'Soy personal extranjero',     riesgo: false },
    { key: 'genera_residuos',    label: 'La actividad genera residuos', riesgo: false },
  ]
  const preguntasFiltradas = esAltoRiesgo
    ? preguntas
    : preguntas.filter(p => !p.riesgo)

  const onUpload = (campo: string, file: File) => {
    void onUploadPdf('clasificacion', campo, file).then((path) => {
      setForm((f: any) => ({ ...f, [campo]: path }))
    })
  }

  const toggleActividad = (key: string) => {
    setForm((f: any) => {
      const activo = Boolean(f[key])
      if (activo) {
        const next = { ...f, [key]: false }
        if (key === 'trabajo_alturas') {
          next.alturas_nivel = undefined
          next.alturas_cert_fecha_venc = undefined
          next.alturas_cert_archivo = undefined
        }
        if (key === 'espacios_confinados') {
          next.confinados_rol = undefined
          next.confinados_cert_fecha = undefined
          next.confinados_cert_archivo = undefined
        }
        if (key === 'trabajo_electrico') {
          next.electrico_matricula_contec = undefined
          next.electrico_num_matricula = undefined
          next.electrico_matricula_venc = undefined
          next.electrico_matricula_archivo = undefined
        }
        if (key === 'trabajo_caliente') {
          next.caliente_extintor_fecha = undefined
          next.caliente_extintor_archivo = undefined
          next.caliente_permiso_fecha = undefined
          next.caliente_permiso_archivo = undefined
        }
        if (key === 'izaje_maquinaria') {
          next.izaje_tipo_equipo = undefined
          next.izaje_inspeccion_archivo = undefined
          next.izaje_doc_legal_archivo = undefined
          next.izaje_licencia_archivo = undefined
        }
        if (key === 'personal_extranjero') {
          next.extran_aseguradora = undefined
          next.extran_num_poliza = undefined
          next.extran_poliza_venc = undefined
          next.extran_poliza_archivo = undefined
        }
        if (key === 'genera_residuos') {
          next.residuos_tipo = undefined
          next.residuos_plan_archivo = undefined
        }
        return next
      }
      return { ...f, [key]: true }
    })
  }

  const isUploading = (campo: string) => uploadingCampo === `clasificacion.${campo}`
  const progressOf = (campo: string) => uploadProgress[`clasificacion.${campo}`]

  const renderRequisitos = (key: string) => {
    if (!form[key]) return null

    if (key === 'trabajo_alturas') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--danger-400)', fontWeight: 600 }}>Requisitos — Trabajo en alturas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>NIVEL DEL CERTIFICADO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <select value={form.alturas_nivel ?? ''} onChange={e => setForm((f: any) => ({ ...f, alturas_nivel: e.target.value || undefined }))} style={selectStyle}>
                <option value="">Seleccionar...</option>
                {['BASICO', 'AVANZADO', 'COORDINADOR'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>VENCIMIENTO CERTIFICADO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.alturas_cert_fecha_venc ?? ''} onChange={e => setForm((f: any) => ({ ...f, alturas_cert_fecha_venc: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.alturas_cert_fecha_venc} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <PdfUploadField
              label="PDF certificado alturas"
              required
              value={form.alturas_cert_archivo}
              uploading={isUploading('alturas_cert_archivo')}
              progress={progressOf('alturas_cert_archivo')}
              onSelect={(file) => onUpload('alturas_cert_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'espacios_confinados') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--danger-400)', fontWeight: 600 }}>Requisitos — Espacios confinados</div>
          <div style={{ marginBottom: '10px', fontSize: '0.74rem', color: '#F59E0B' }}>Operación sugerida con roles diferenciados: supervisor, vigía y entrante según el alcance de la tarea.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ROL EN EL TRABAJO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <select value={form.confinados_rol ?? ''} onChange={e => setForm((f: any) => ({ ...f, confinados_rol: e.target.value || undefined }))} style={selectStyle}>
                <option value="">Seleccionar...</option>
                {['SUPERVISOR', 'VIGIA', 'ENTRANTE'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>FECHA CERTIFICADO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.confinados_cert_fecha ?? ''} onChange={e => setForm((f: any) => ({ ...f, confinados_cert_fecha: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.confinados_cert_fecha} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <PdfUploadField
              label="PDF certificado espacios confinados"
              required
              value={form.confinados_cert_archivo}
              uploading={isUploading('confinados_cert_archivo')}
              progress={progressOf('confinados_cert_archivo')}
              onSelect={(file) => onUpload('confinados_cert_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'trabajo_electrico') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--danger-400)', fontWeight: 600 }}>Requisitos — Trabajo eléctrico</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>MATRÍCULA CONTEC <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <select value={form.electrico_matricula_contec ?? ''} onChange={e => setForm((f: any) => ({ ...f, electrico_matricula_contec: e.target.value || undefined }))} style={selectStyle}>
                <option value="">Seleccionar...</option>
                {['TE1', 'TE2', 'TE3', 'TE4', 'TE5', 'TE6'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>NÚMERO MATRÍCULA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="text" value={form.electrico_num_matricula ?? ''} onChange={e => setForm((f: any) => ({ ...f, electrico_num_matricula: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>VENCIMIENTO MATRÍCULA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.electrico_matricula_venc ?? ''} onChange={e => setForm((f: any) => ({ ...f, electrico_matricula_venc: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.electrico_matricula_venc} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <PdfUploadField
              label="PDF matrícula CONTEC"
              required
              value={form.electrico_matricula_archivo}
              uploading={isUploading('electrico_matricula_archivo')}
              progress={progressOf('electrico_matricula_archivo')}
              onSelect={(file) => onUpload('electrico_matricula_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'trabajo_caliente') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--danger-400)', fontWeight: 600 }}>Requisitos — Trabajo en caliente</div>
          <div style={{ marginBottom: '10px', fontSize: '0.74rem', color: '#F59E0B' }}>Verifica control de chispas, material combustible en el entorno y extintor disponible durante toda la labor.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>FECHA EXTINTOR CO₂ 20Lbs <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.caliente_extintor_fecha ?? ''} onChange={e => setForm((f: any) => ({ ...f, caliente_extintor_fecha: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.caliente_extintor_fecha} />
            </div>
            <div>
              <label style={labelStyle}>FECHA PERMISO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.caliente_permiso_fecha ?? ''} onChange={e => setForm((f: any) => ({ ...f, caliente_permiso_fecha: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.caliente_permiso_fecha} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <PdfUploadField
              label="PDF certificado extintor"
              required
              value={form.caliente_extintor_archivo}
              uploading={isUploading('caliente_extintor_archivo')}
              progress={progressOf('caliente_extintor_archivo')}
              onSelect={(file) => onUpload('caliente_extintor_archivo', file)}
            />
            <PdfUploadField
              label="PDF permiso trabajo en caliente"
              required
              value={form.caliente_permiso_archivo}
              uploading={isUploading('caliente_permiso_archivo')}
              progress={progressOf('caliente_permiso_archivo')}
              onSelect={(file) => onUpload('caliente_permiso_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'izaje_maquinaria') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--danger-400)', fontWeight: 600 }}>Requisitos — Izaje de maquinaria</div>
          <div>
            <label style={labelStyle}>TIPO DE EQUIPO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
            <input type="text" value={form.izaje_tipo_equipo ?? ''} onChange={e => setForm((f: any) => ({ ...f, izaje_tipo_equipo: e.target.value }))} placeholder="Grúa, montacargas, etc." style={inputStyle} />
          </div>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <PdfUploadField
              label="PDF inspección pre-operacional"
              required
              value={form.izaje_inspeccion_archivo}
              uploading={isUploading('izaje_inspeccion_archivo')}
              progress={progressOf('izaje_inspeccion_archivo')}
              onSelect={(file) => onUpload('izaje_inspeccion_archivo', file)}
            />
            <PdfUploadField
              label="PDF documentos legales equipo"
              required
              value={form.izaje_doc_legal_archivo}
              uploading={isUploading('izaje_doc_legal_archivo')}
              progress={progressOf('izaje_doc_legal_archivo')}
              onSelect={(file) => onUpload('izaje_doc_legal_archivo', file)}
            />
            <PdfUploadField
              label="PDF licencia operador"
              required
              value={form.izaje_licencia_archivo}
              uploading={isUploading('izaje_licencia_archivo')}
              progress={progressOf('izaje_licencia_archivo')}
              onSelect={(file) => onUpload('izaje_licencia_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'personal_extranjero') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--success-400)', fontWeight: 600 }}>Requisitos — Personal extranjero</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ASEGURADORA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="text" value={form.extran_aseguradora ?? ''} onChange={e => setForm((f: any) => ({ ...f, extran_aseguradora: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>NÚMERO DE PÓLIZA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="text" value={form.extran_num_poliza ?? ''} onChange={e => setForm((f: any) => ({ ...f, extran_num_poliza: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>VENCIMIENTO PÓLIZA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
              <input type="date" value={form.extran_poliza_venc ?? ''} onChange={e => setForm((f: any) => ({ ...f, extran_poliza_venc: e.target.value || undefined }))} style={inputStyle} />
              <VigenciaBadge fecha={form.extran_poliza_venc} />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <PdfUploadField
              label="PDF póliza"
              required
              value={form.extran_poliza_archivo}
              uploading={isUploading('extran_poliza_archivo')}
              progress={progressOf('extran_poliza_archivo')}
              onSelect={(file) => onUpload('extran_poliza_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'genera_residuos') {
      return (
        <div style={{ marginTop: '8px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--success-400)', fontWeight: 600 }}>Requisitos — Generación de residuos</div>
          <div>
            <label style={labelStyle}>TIPO DE RESIDUOS <span style={{ color: 'var(--danger-400)' }}>*</span></label>
            <input type="text" value={form.residuos_tipo ?? ''} onChange={e => setForm((f: any) => ({ ...f, residuos_tipo: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ marginTop: '12px' }}>
            <PdfUploadField
              label="PDF plan manejo de residuos"
              required
              value={form.residuos_plan_archivo}
              uploading={isUploading('residuos_plan_archivo')}
              progress={progressOf('residuos_plan_archivo')}
              onSelect={(file) => onUpload('residuos_plan_archivo', file)}
            />
          </div>
        </div>
      )
    }

    if (key === 'visita_sin_riesgo') {
      return (
        <div style={{ marginTop: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--success-400)', fontSize: '0.78rem' }}>
          ✓ Visita sin riesgo: no se requieren documentos adicionales en esta sección.
        </div>
      )
    }

    return null
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Clasificación de actividad
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        {esAltoRiesgo
          ? 'Selecciona todas las actividades que aplican a tu trabajo de hoy.'
          : 'Solo verás opciones aplicables a contratistas sin actividad de alto riesgo.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {preguntasFiltradas.map(p => (
          <div key={p.key}>
            <button
              type="button"
              onClick={() => toggleActividad(p.key)}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '12px 16px',
                background:     form[p.key]
                  ? p.riesgo ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border:         `1px solid ${form[p.key]
                  ? p.riesgo ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'
                  : 'rgba(255,255,255,0.08)'}`,
                borderRadius:   '10px',
                cursor:         'pointer',
                textAlign:      'left',
                transition:     'all 0.2s ease',
                fontFamily:     'var(--font-ui)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {p.riesgo
                  ? <AlertTriangle size={15} color={form[p.key] ? 'var(--danger-400)' : 'var(--text-muted)'} />
                  : <CheckCircle2  size={15} color={form[p.key] ? 'var(--success-400)' : 'var(--text-muted)'} />
                }
                <span style={{
                  fontSize:  '0.875rem',
                  color:     form[p.key] ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: form[p.key] ? 600 : 400,
                }}>
                  {p.label}
                </span>
              </div>
              <div style={{
                width:        '20px',
                height:       '20px',
                borderRadius: '4px',
                background:   form[p.key]
                  ? p.riesgo ? 'var(--danger-400)' : 'var(--success-400)'
                  : 'rgba(255,255,255,0.08)',
                border:       `1px solid ${form[p.key]
                  ? 'transparent'
                  : 'rgba(255,255,255,0.15)'}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                {form[p.key] && <CheckCircle2 size={12} color="white" />}
              </div>
            </button>
            {renderRequisitos(p.key)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helper vigencia ───────────────────────────────────────────────
function estadoVigencia(fecha: string | undefined): 'vencido' | 'proximo' | 'vigente' | null {
  if (!fecha) return null
  const hoy  = new Date(); hoy.setHours(0,0,0,0)
  const exp  = new Date(fecha + 'T00:00:00')
  const diff = Math.floor((exp.getTime() - hoy.getTime()) / 86400000)
  if (diff < 0)  return 'vencido'
  if (diff <= 30) return 'proximo'
  return 'vigente'
}

function VigenciaBadge({ fecha }: { fecha: string | undefined }) {
  const estado = estadoVigencia(fecha)
  if (!estado) return null
  const cfg = {
    vencido: { color: 'var(--danger-400)',  bg: 'rgba(239,68,68,0.08)',   texto: '⚠ Vencido — no podrás ingresar' },
    proximo: { color: '#F59E0B',            bg: 'rgba(245,158,11,0.08)', texto: '⚠ Vence pronto (menos de 30 días)' },
    vigente: { color: 'var(--success-400)', bg: 'rgba(16,185,129,0.08)', texto: '✓ Vigente' },
  }[estado]
  return (
    <div style={{
      marginTop:    '4px', padding: '4px 8px',
      background:   cfg.bg, borderRadius: '6px',
      fontSize:     '0.7rem', color: cfg.color, fontWeight: 500,
    }}>
      {cfg.texto}
    </div>
  )
}

// ── Paso 4 — Seguridad social ───────────────────────────────────
function Paso4SeguridadSocial({
  form, setForm, eps, arl, afp, onUploadPdf, uploadingCampo, uploadProgress,
}: {
  form: any; setForm: (f: any) => void
  eps: Array<{ id: number; nombre: string }>
  arl: Array<{ id: number; nombre: string }>
  afp: Array<{ id: number; nombre: string }>
  onUploadPdf: (modulo: UploadModulo, campo: string, file: File) => Promise<string>
  uploadingCampo: string | null
  uploadProgress: Record<string, number>
}) {
  const hayVencido = estadoVigencia(form.eps_vigencia) === 'vencido'
    || estadoVigencia(form.arl_vigencia) === 'vencido'
    || estadoVigencia(form.afp_vigencia) === 'vencido'

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Seguridad social
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Registra la afiliación principal para validación HSE.
      </p>

      {hayVencido && (
        <div style={{
          marginBottom: '16px', padding: '10px 14px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px', fontSize: '0.78rem', color: 'var(--danger-400)',
        }}>
          ⚠ Tienes documentos vencidos. Con documentos vencidos no podrás ser autorizado para ingresar. Actualiza tu afiliación antes de continuar.
        </div>
      )}

      {/* EPS */}
      <div style={{
        padding: '14px 16px', marginBottom: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${estadoVigencia(form.eps_vigencia) === 'vencido' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>EPS</label>
            <select value={form.eps_id ?? ''} onChange={e => setForm((f: any) => ({ ...f, eps_id: e.target.value ? Number(e.target.value) : undefined }))} style={selectStyle}>
              <option value="">Seleccionar...</option>
              {eps.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>VIGENCIA EPS</label>
            <input type="date" value={form.eps_vigencia ?? ''} onChange={e => setForm((f: any) => ({ ...f, eps_vigencia: e.target.value || undefined }))}
              style={{ ...inputStyle, borderColor: estadoVigencia(form.eps_vigencia) === 'vencido' ? 'rgba(239,68,68,0.5)' : undefined }} />
            <VigenciaBadge fecha={form.eps_vigencia} />
          </div>
        </div>
      </div>

      {/* ARL */}
      <div style={{
        padding: '14px 16px', marginBottom: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${estadoVigencia(form.arl_vigencia) === 'vencido' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>ARL</label>
            <select value={form.arl_id ?? ''} onChange={e => setForm((f: any) => ({ ...f, arl_id: e.target.value ? Number(e.target.value) : undefined }))} style={selectStyle}>
              <option value="">Seleccionar...</option>
              {arl.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>VIGENCIA ARL</label>
            <input type="date" value={form.arl_vigencia ?? ''} onChange={e => setForm((f: any) => ({ ...f, arl_vigencia: e.target.value || undefined }))}
              style={{ ...inputStyle, borderColor: estadoVigencia(form.arl_vigencia) === 'vencido' ? 'rgba(239,68,68,0.5)' : undefined }} />
            <VigenciaBadge fecha={form.arl_vigencia} />
          </div>
        </div>
      </div>

      {/* AFP */}
      <div style={{
        padding: '14px 16px', marginBottom: '14px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${estadoVigencia(form.afp_vigencia) === 'vencido' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '10px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>AFP</label>
            <select value={form.afp_id ?? ''} onChange={e => setForm((f: any) => ({ ...f, afp_id: e.target.value ? Number(e.target.value) : undefined }))} style={selectStyle}>
              <option value="">Seleccionar...</option>
              {afp.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>VIGENCIA AFP</label>
            <input type="date" value={form.afp_vigencia ?? ''} onChange={e => setForm((f: any) => ({ ...f, afp_vigencia: e.target.value || undefined }))}
              style={{ ...inputStyle, borderColor: estadoVigencia(form.afp_vigencia) === 'vencido' ? 'rgba(239,68,68,0.5)' : undefined }} />
            <VigenciaBadge fecha={form.afp_vigencia} />
          </div>
        </div>
      </div>

      {/* PILA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>TIPO PILA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
          <select value={form.pila_tipo ?? ''} onChange={e => setForm((f: any) => ({ ...f, pila_tipo: e.target.value || undefined }))} style={selectStyle}>
            <option value="">Seleccionar...</option>
            {['INTEGRADA', 'MANUAL'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>ESTADO PILA <span style={{ color: 'var(--danger-400)' }}>*</span></label>
          <select value={form.pila_estado ?? ''} onChange={e => setForm((f: any) => ({ ...f, pila_estado: e.target.value || undefined }))}
            style={{ ...selectStyle, borderColor: form.pila_estado === 'VENCIDA' ? 'rgba(239,68,68,0.5)' : undefined,
              color: form.pila_estado === 'VENCIDA' ? 'var(--danger-400)' : form.pila_estado === 'PAGADA' ? 'var(--success-400)' : undefined }}>
            <option value="">Seleccionar...</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada ✓</option>
            <option value="VENCIDA">Vencida ⚠</option>
          </select>
          {form.pila_estado === 'VENCIDA' && (
            <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--danger-400)' }}>
              ⚠ PILA vencida — regulariza tu pago antes de ingresar
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <PdfUploadField
          label="PDF planilla PILA"
          required
          value={form.pila_archivo}
          uploading={uploadingCampo === 'seg_social.pila_archivo'}
          progress={uploadProgress['seg_social.pila_archivo']}
          onSelect={(file) => {
            void onUploadPdf('seg_social', 'pila_archivo', file).then((path) => {
              setForm((f: any) => ({ ...f, pila_archivo: path }))
            })
          }}
        />
      </div>
    </div>
  )
}

// ── Paso 5 — Certificaciones ────────────────────────────────────
function Paso5Certificaciones({
  form,
  setForm,
  onUploadPdf,
  uploadingCampo,
  uploadProgress,
}: {
  form:       any
  setForm:    (f: any) => void
  onUploadPdf: (modulo: UploadModulo, campo: string, file: File) => Promise<string>
  uploadingCampo: string | null
  uploadProgress: Record<string, number>
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Certificaciones
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Para contratista de alto riesgo este paso exige únicamente la ART diligenciada.
      </p>

      {/* ART — requerida para ALTO_RIESGO */}
      <div style={{
        marginBottom:  '20px',
        padding:       '16px',
        background:    'rgba(245,158,11,0.05)',
        border:        '1px solid rgba(245,158,11,0.2)',
        borderRadius:  '10px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            DESCRIPCIÓN DE TAREA — ART <span style={{ color: 'var(--danger-400)' }}>*</span>
          </label>
          </div>
        <textarea
          value={form.art_descripcion_tarea ?? ''}
          onChange={e => setForm((f: any) => ({ ...f, art_descripcion_tarea: e.target.value }))}
          placeholder="Ej: Instalación de luminarias en techo de bodega, cambio de tubería en segundo piso..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
        <div style={{ marginTop: '10px' }}>
          <PdfUploadField
            label="PDF ART diligenciada"
            required
            value={form.art_archivo}
            uploading={uploadingCampo === 'certificaciones.art_archivo'}
            progress={uploadProgress['certificaciones.art_archivo']}
            onSelect={(file) => {
              void onUploadPdf('certificaciones', 'art_archivo', file).then((path) => {
                setForm((f: any) => ({ ...f, art_archivo: path }))
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Paso 6 — Examen médico ──────────────────────────────────────
function Paso6ExamenMedico({
  form,
  setForm,
  onUploadPdf,
  uploadingCampo,
  uploadProgress,
}: {
  form: any
  setForm: (f: any) => void
  onUploadPdf: (modulo: UploadModulo, campo: string, file: File) => Promise<string>
  uploadingCampo: string | null
  uploadProgress: Record<string, number>
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Examen médico ocupacional
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Este paso aplica para contratistas de alto riesgo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>FECHA EXAMEN</label>
          <input
            type="date"
            value={form.fecha_examen ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, fecha_examen: e.target.value || undefined }))}
            style={inputStyle}
          />
          <VigenciaBadge fecha={form.fecha_examen} />
        </div>
        <div>
          <label style={labelStyle}>CONCEPTO MÉDICO <span style={{ color: 'var(--danger-400)' }}>*</span></label>
          <select
            value={form.concepto ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, concepto: e.target.value || undefined }))}
            style={selectStyle}
          >
            <option value="">Seleccionar...</option>
            {['APTO', 'APTO_CON_RESTRICCION', 'NO_APTO', 'PENDIENTE'].map(concepto => (
              <option key={concepto} value={concepto}>{concepto.split('_').join(' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>DESCRIPCIÓN DE RESTRICCIÓN (opcional)</label>
        <textarea
          value={form.descripcion_restriccion ?? ''}
          onChange={e => setForm((f: any) => ({ ...f, descripcion_restriccion: e.target.value }))}
          placeholder="Si aplica, describe restricciones médicas relevantes..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      <div style={{ marginTop: '12px' }}>
        <PdfUploadField
          label="PDF examen médico ocupacional"
          required
          value={form.archivo}
          uploading={uploadingCampo === 'examen.archivo'}
          progress={uploadProgress['examen.archivo']}
          onSelect={(file) => {
            void onUploadPdf('examen', 'archivo', file).then((path) => {
              setForm((f: any) => ({ ...f, archivo: path }))
            })
          }}
        />
      </div>
    </div>
  )
}

// ── Paso 7 — Contacto de emergencia ──────────────────────────────
function Paso7Emergencia({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Contacto de emergencia
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        En caso de emergencia, ¿a quién debemos contactar?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={labelStyle}>NOMBRE COMPLETO DEL CONTACTO</label>
          <input
            type="text"
            value={form.nombre_completo ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, nombre_completo: e.target.value }))}
            placeholder="Nombre Apellido"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>RELACIÓN</label>
            <select
              value={form.relacion ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, relacion: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Seleccionar...</option>
              {['FAMILIAR', 'CONYUGE', 'COLEGA', 'OTRO'].map(r => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          {form.relacion === 'OTRO' && (
            <div>
              <label style={labelStyle}>¿CUÁL RELACIÓN?</label>
              <input
                type="text"
                value={form.relacion_otro ?? ''}
                onChange={e => setForm((f: any) => ({ ...f, relacion_otro: e.target.value }))}
                placeholder="Ej: Vecino, amigo..."
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>TELÉFONO CELULAR</label>
            <input
              type="text"
              value={form.telefono_celular ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, telefono_celular: e.target.value }))}
              placeholder="3001234567"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>TELÉFONO FIJO (opcional)</label>
            <input
              type="text"
              value={form.telefono_fijo ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, telefono_fijo: e.target.value }))}
              placeholder="6011234567"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>RH SANGUÍNEO</label>
            <select
              value={form.rh_sanguineo ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, rh_sanguineo: e.target.value }))}
              style={selectStyle}
            >
              <option value="">Seleccionar...</option>
              {['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'].map(rh => (
                <option key={rh} value={rh}>{rh.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>ALERGIAS CONOCIDAS (opcional)</label>
          <input
            type="text"
            value={form.alergias ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, alergias: e.target.value }))}
            placeholder="Ej: Penicilina, látex..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>CONDICIÓN MÉDICA RELEVANTE (opcional)</label>
          <input
            type="text"
            value={form.condicion_medica ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, condicion_medica: e.target.value }))}
            placeholder="Ej: Diabetes, hipertensión..."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>EPS (para emergencias)</label>
          <input
            type="text"
            value={form.eps_contratista ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, eps_contratista: e.target.value }))}
            placeholder="Ej: Compensar, Sanitas..."
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}

// ── Paso 8 — Normas ───────────────────────────────────────────────
function Paso8Normas({
  form,
  setForm,
  normas,
}: {
  form:    any
  setForm: (f: any) => void
  normas:  { id: number; numero: number; titulo: string; contenido: string }[]
}) {
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const normasDefault = normas.length > 0 ? normas : [
    { id: 1, numero: 1, titulo: 'Uso de EPP',            contenido: 'Es obligatorio el uso de los Elementos de Protección Personal asignados durante toda la jornada.' },
    { id: 2, numero: 2, titulo: 'Reporte de incidentes', contenido: 'Todo incidente o casi-accidente debe ser reportado inmediatamente al responsable HSE.' },
    { id: 3, numero: 3, titulo: 'Prohibición de alcohol', contenido: 'Está estrictamente prohibido ingresar o trabajar bajo efectos de alcohol o sustancias psicoactivas.' },
    { id: 4, numero: 4, titulo: 'Señalización',           contenido: 'Respetar toda la señalización de seguridad y las zonas restringidas.' },
    { id: 5, numero: 5, titulo: 'Orden y aseo',           contenido: 'Mantener el área de trabajo ordenada y limpia durante y al finalizar la jornada.' },
  ]

  React.useEffect(() => {
    const el = scrollRef.current
    if (el && el.scrollHeight <= el.clientHeight + 10) {
      setScrolled(true)
    }
  }, [normasDefault.length])

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
        Normas de seguridad
      </h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Lee todas las normas antes de firmar. El scroll es obligatorio.
      </p>

      {/* Contenedor de normas con scroll */}
      <div
        ref={scrollRef}
        onScroll={e => {
          const el = e.currentTarget
          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
          if (atBottom) setScrolled(true)
        }}
        style={{
          maxHeight:   '280px',
          overflowY:   'auto',
          border:      '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding:     '16px',
          marginBottom: '16px',
          background:  'rgba(255,255,255,0.02)',
        }}
      >
        {normasDefault.map((norma, i) => (
          <div
            key={norma.id}
            style={{
              marginBottom: i < normasDefault.length - 1 ? '16px' : '0',
              paddingBottom: i < normasDefault.length - 1 ? '16px' : '0',
              borderBottom: i < normasDefault.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
              marginBottom: '6px',
            }}>
              <span style={{
                fontFamily:  'var(--font-mono)',
                fontSize:    '0.68rem',
                color:       'var(--primary-400)',
                fontWeight:  700,
              }}>
                {String(norma.numero).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {norma.titulo}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {norma.contenido}
            </p>
          </div>
        ))}
      </div>

      {!scrolled && (
        <p style={{
          fontSize:  '0.72rem',
          color:     'var(--primary-400)',
          textAlign: 'center',
          marginBottom: '12px',
          animation: 'pulse 2s infinite',
        }}>
          ↓ Desplázate hasta el final para continuar
        </p>
      )}

      {/* Firma */}
      <div style={{
        padding:    '16px',
        background: 'rgba(255,255,255,0.03)',
        border:     '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        display:    'flex',
        flexDirection: 'column',
        gap:        '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="acepto-normas"
            checked={form.acepto_normas ?? false}
            onChange={e => setForm((f: any) => ({ ...f, acepto_normas: e.target.checked }))}
            disabled={!scrolled}
            style={{ width: '16px', height: '16px', cursor: scrolled ? 'pointer' : 'not-allowed' }}
          />
          <label htmlFor="acepto-normas" style={{
            fontSize: '0.78rem',
            color:    scrolled ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor:   scrolled ? 'pointer' : 'not-allowed',
          }}>
            He leído y acepto todas las normas de seguridad de Permoda S.A.S.
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="acepto-datos"
            checked={form.acepto_datos ?? false}
            onChange={e => setForm((f: any) => ({ ...f, acepto_datos: e.target.checked }))}
            disabled={!scrolled}
            style={{ width: '16px', height: '16px', cursor: scrolled ? 'pointer' : 'not-allowed' }}
          />
          <label htmlFor="acepto-datos" style={{
            fontSize: '0.78rem',
            color:    scrolled ? 'var(--text-secondary)' : 'var(--text-muted)',
            cursor:   scrolled ? 'pointer' : 'not-allowed',
          }}>
            Autorizo el tratamiento de mis datos personales según la política de privacidad.
          </label>
        </div>

        <div>
          <label style={labelStyle}>FIRMA DIGITAL — ESCRIBE TU NOMBRE COMPLETO</label>
          <input
            type="text"
            value={form.firma_digital ?? ''}
            onChange={e => setForm((f: any) => ({ ...f, firma_digital: e.target.value }))}
            placeholder="Nombre Apellido"
            disabled={!scrolled}
            style={{
              ...inputStyle,
              fontStyle:  'italic',
              fontSize:   '1rem',
              cursor:     scrolled ? 'text' : 'not-allowed',
              opacity:    scrolled ? 1 : 0.5,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────
export default function AutogestionView() {
  const { token } = useParams<{ token: string }>()

  const [tokenData,   setTokenData]   = useState<AutogestionTokenResponse | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [tokenError,  setTokenError]  = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [pasoActual,  setPasoActual]  = useState(1)
  const [saving,     setSaving]     = useState(false)
  const [completado, setCompletado] = useState(false)
  const [normas,     setNormas]     = useState<any[]>([])
  const [epsCatalog, setEpsCatalog] = useState<any[]>([])
  const [arlCatalog, setArlCatalog] = useState<any[]>([])
  const [afpCatalog, setAfpCatalog] = useState<any[]>([])

  // Forms por paso
  const [formDatos,        setFormDatos]        = useState<any>({})
  const [formClasif,       setFormClasif]       = useState<any>({})
  const [formSegSocial,    setFormSegSocial]    = useState<any>({ es_titular: true })
  const [formCert,         setFormCert]         = useState<any>({})
  const [formExamen,       setFormExamen]       = useState<any>({})
  const [formEmergencia,   setFormEmergencia]   = useState<any>({})
  const [formNormas,       setFormNormas]       = useState<any>({})
  const [uploadingCampo,   setUploadingCampo]   = useState<string | null>(null)
  const [uploadProgress,   setUploadProgress]   = useState<Record<string, number>>({})

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const data = await hseService.validarToken(token)
        setTokenData(data)
        // Pre-llenar con datos existentes
        setFormDatos({
          tipo_documento:   data.tipo_documento,
          numero_documento: data.numero_documento,
          nombres:          data.nombres,
          apellidos:        data.apellidos,
          email:            data.email,
          telefono:         data.telefono,
        })
        if (data.clasificacion) setFormClasif(data.clasificacion)
        if (data.seguridad_social?.length) setFormSegSocial(data.seguridad_social[0])
        if (data.certificaciones) setFormCert(data.certificaciones)
        if (data.examen_medico) setFormExamen(data.examen_medico)
        if (data.contacto_emergencia) setFormEmergencia(data.contacto_emergencia)

        // Cargar catálogos + normas
        const [n, eps, arl, afp] = await Promise.all([
          hseService.getNormas(data.sede_id),
          hseService.getEPS(),
          hseService.getARL(),
          hseService.getAFP(),
        ])
        setNormas(n)
        setEpsCatalog(eps)
        setArlCatalog(arl)
        setAfpCatalog(afp)
      } catch (e) {
        setTokenError(getErrorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const esAltoRiesgo   = tokenData?.tipo_contratista === 'ALTO_RIESGO'
  const pasosActivos   = esAltoRiesgo ? PASOS_ALTO_RIESGO : PASOS_NORMAL
  const totalPasos     = pasosActivos.length
  const pasoMax        = totalPasos
  const pasoKey        = pasosActivos[pasoActual - 1] as PasoKey | undefined

  const handleUploadPdf = async (modulo: UploadModulo, campo: string, file: File): Promise<string> => {
    if (!token) throw new Error('Token de autogestión inválido.')

    const esPdfPorNombre = file.name.toLowerCase().endsWith('.pdf')
    const esPdfPorTipo = (file.type || '').toLowerCase().includes('pdf')
    if (!esPdfPorNombre && !esPdfPorTipo) {
      throw new Error('Solo se permiten archivos PDF.')
    }

    const key = `${modulo}.${campo}`

    if (uploadingCampo && uploadingCampo !== key) {
      throw new Error('Hay otra carga en progreso. Espera a que termine para subir el siguiente archivo.')
    }

    setUploadingCampo(key)
    setUploadProgress((prev) => ({ ...prev, [key]: 0 }))
    setError(null)

    try {
      const resp = await hseService.uploadAutogestionArchivo(
        token,
        { modulo, campo, file },
        (percent) => setUploadProgress((prev) => ({ ...prev, [key]: percent })),
      )
      setUploadProgress((prev) => ({ ...prev, [key]: 100 }))
      return resp.path
    } catch (e) {
      const msg = getErrorMessage(e)
      setError(msg)
      throw e
    } finally {
      setUploadingCampo(null)
    }
  }

  // ── FUNCIONES DE VALIDACIÓN ────────────────────────────────────
  const validarPaso = (): string | null => {
    switch (pasoKey) {
      case 'sede':
        return null

      case 'datos':
        if (!formDatos.tipo_documento?.trim()) return 'Selecciona un tipo de documento.'
        if (!formDatos.numero_documento?.trim()) return 'Ingresa tu número de documento.'
        if (!formDatos.nombres?.trim()) return 'Ingresa tus nombres.'
        if (!formDatos.apellidos?.trim()) return 'Ingresa tus apellidos.'
        if (!formDatos.email?.trim()) return 'Ingresa tu correo electrónico.'
        if (!formDatos.email.includes('@')) return 'El correo electrónico es inválido.'
        if (!formDatos.telefono?.trim()) return 'Ingresa tu número de teléfono.'
        if (!formDatos.tratamiento_datos) return 'Debes aceptar el tratamiento de tus datos personales.'
        return null

      case 'actividad': {
        if (!formClasif || Object.keys(formClasif).length === 0)
          return 'Debes seleccionar al menos una clasificación de actividad.'
        const tieneSeleccion = Object.values(formClasif).some(v => v === true)
        if (!tieneSeleccion)
          return 'Debes seleccionar al menos una actividad que realizarás.'
        if (formClasif.trabajo_alturas) {
          if (!formClasif.alturas_nivel) return 'Selecciona el nivel de certificado de alturas.'
          if (!formClasif.alturas_cert_fecha_venc) return 'Ingresa la fecha de vencimiento del certificado de alturas.'
          if (!formClasif.alturas_cert_archivo) return 'Adjunta el PDF del certificado de alturas.'
          if (estadoVigencia(formClasif.alturas_cert_fecha_venc) === 'vencido')
            return 'El certificado de alturas debe estar vigente para continuar.'
        }
        if (formClasif.espacios_confinados) {
          if (!formClasif.confinados_rol) return 'Selecciona el rol para espacios confinados.'
          if (!formClasif.confinados_cert_fecha) return 'Ingresa la fecha del certificado de espacios confinados.'
          if (!formClasif.confinados_cert_archivo) return 'Adjunta el PDF del certificado de espacios confinados.'
          if (estadoVigencia(formClasif.confinados_cert_fecha) === 'vencido')
            return 'El certificado de espacios confinados debe estar vigente para continuar.'
        }
        if (formClasif.trabajo_electrico) {
          if (!formClasif.electrico_matricula_contec) return 'Selecciona la matrícula CONTEC.'
          if (!formClasif.electrico_num_matricula?.trim()) return 'Ingresa el número de matrícula CONTEC.'
          if (!formClasif.electrico_matricula_venc) return 'Ingresa la fecha de vencimiento de la matrícula eléctrica.'
          if (!formClasif.electrico_matricula_archivo) return 'Adjunta el PDF de la matrícula CONTEC.'
          if (estadoVigencia(formClasif.electrico_matricula_venc) === 'vencido')
            return 'La matrícula CONTEC debe estar vigente para continuar.'
        }
        if (formClasif.trabajo_caliente) {
          if (!formClasif.caliente_extintor_fecha) return 'Ingresa la fecha de extintor para trabajo en caliente.'
          if (!formClasif.caliente_extintor_archivo) return 'Adjunta el PDF de certificado de extintor.'
          if (!formClasif.caliente_permiso_fecha) return 'Ingresa la fecha del permiso de trabajo en caliente.'
          if (!formClasif.caliente_permiso_archivo) return 'Adjunta el PDF del permiso de trabajo en caliente.'
          if (estadoVigencia(formClasif.caliente_extintor_fecha) === 'vencido')
            return 'El certificado del extintor debe estar vigente para continuar.'
          if (estadoVigencia(formClasif.caliente_permiso_fecha) === 'vencido')
            return 'El permiso de trabajo en caliente debe estar vigente para continuar.'
        }
        if (formClasif.izaje_maquinaria) {
          if (!formClasif.izaje_tipo_equipo?.trim()) return 'Indica el tipo de equipo para izaje.'
          if (!formClasif.izaje_inspeccion_archivo) return 'Adjunta el PDF de inspección pre-operacional de izaje.'
          if (!formClasif.izaje_doc_legal_archivo) return 'Adjunta el PDF de documentos legales del equipo de izaje.'
          if (!formClasif.izaje_licencia_archivo) return 'Adjunta el PDF de licencia del operador de izaje.'
        }
        if (formClasif.personal_extranjero) {
          if (!formClasif.extran_aseguradora?.trim()) return 'Ingresa la aseguradora del personal extranjero.'
          if (!formClasif.extran_num_poliza?.trim()) return 'Ingresa el número de póliza del personal extranjero.'
          if (!formClasif.extran_poliza_venc) return 'Ingresa la fecha de vencimiento de la póliza del personal extranjero.'
          if (!formClasif.extran_poliza_archivo) return 'Adjunta el PDF de póliza del personal extranjero.'
          if (estadoVigencia(formClasif.extran_poliza_venc) === 'vencido')
            return 'La póliza del personal extranjero debe estar vigente para continuar.'
        }
        if (formClasif.genera_residuos) {
          if (!formClasif.residuos_tipo?.trim()) return 'Describe el tipo de residuos generados.'
          if (!formClasif.residuos_plan_archivo) return 'Adjunta el PDF del plan de manejo de residuos.'
        }
        return null
      }

      case 'seg_social':
        // Solo llega aquí ALTO_RIESGO
        if (!formSegSocial.eps_id) return 'Selecciona una EPS.'
        if (!formSegSocial.arl_id) return 'Selecciona una ARL.'
        if (!formSegSocial.afp_id) return 'Selecciona una AFP.'
        if (!formSegSocial.eps_vigencia) return 'Ingresa la vigencia de EPS.'
        if (!formSegSocial.arl_vigencia) return 'Ingresa la vigencia de ARL.'
        if (!formSegSocial.afp_vigencia) return 'Ingresa la vigencia de AFP.'
        if (!formSegSocial.pila_tipo) return 'Selecciona el tipo PILA.'
        if (!formSegSocial.pila_estado) return 'Selecciona el estado PILA.'
        if (!formSegSocial.pila_archivo)
          return 'Adjunta el PDF de la planilla PILA.'
        return null

      case 'certificaciones': {
        // Solo llega aquí ALTO_RIESGO
        // ART siempre obligatoria para ALTO_RIESGO
        if (!formCert.art_descripcion_tarea?.trim())
          return 'Ingresa la descripción de tarea (ART).'
        if (!formCert.art_archivo)
          return 'Adjunta el PDF de la ART diligenciada.'
        return null
      }

      case 'medico':
        // Solo llega aquí ALTO_RIESGO
        if (!formExamen.fecha_examen) return 'Ingresa la fecha del examen médico.'
        if (!formExamen.concepto) return 'Selecciona el concepto médico.'
        if (!formExamen.archivo) return 'Adjunta el PDF del examen médico ocupacional.'
        if (formExamen.concepto === 'APTO_CON_RESTRICCION' && !formExamen.descripcion_restriccion?.trim())
          return 'Describe la restricción médica cuando el concepto es APTO CON RESTRICCIÓN.'
        return null

      case 'emergencia':
        if (!formEmergencia.nombre_completo?.trim()) return 'Ingresa el nombre del contacto de emergencia.'
        if (!formEmergencia.relacion) return 'Selecciona la relación con el contacto.'
        if (formEmergencia.relacion === 'OTRO' && !formEmergencia.relacion_otro?.trim())
          return 'Indica cuál es la relación cuando seleccionas OTRO.'
        if (!formEmergencia.telefono_celular?.trim()) return 'Ingresa el teléfono del contacto de emergencia.'
        if (!formEmergencia.rh_sanguineo) return 'Selecciona el RH sanguíneo.'
        if (!formEmergencia.eps_contratista?.trim()) return 'Ingresa la EPS del contratista para emergencias.'
        return null

      case 'normas':
        if (!formNormas.acepto_normas) return 'Debes aceptar las normas de seguridad.'
        if (!formNormas.acepto_datos) return 'Debes aceptar el tratamiento de datos personales.'
        if (!formNormas.firma_digital?.trim() || formNormas.firma_digital.trim().length < 3)
          return 'Ingresa tu firma digital (mínimo 3 caracteres).'
        return null

      default:
        return null
    }
  }

  const handleSiguiente = async () => {
    if (!token || !tokenData) return

    if (uploadingCampo) {
      setError('Espera a que termine la carga del archivo antes de continuar.')
      return
    }
    
    // Validar antes de continuar
    const errorValidacion = validarPaso()
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Guardar según el key del paso actual
      switch (pasoKey) {
        case 'normas':
          await hseService.aceptarNormas(token, {
            acepto_normas: formNormas.acepto_normas,
            acepto_datos:  formNormas.acepto_datos,
            firma_digital: formNormas.firma_digital,
          })
          setCompletado(true)
          return

        case 'datos':
          await hseService.guardarDatosPersonales(token, formDatos)
          break

        case 'actividad': {
          const clasificacionNormalizada: Record<string, any> = { ...formClasif }
          if (!esAltoRiesgo) {
            for (const k of CLASIFICACION_ALTO_RIESGO_KEYS) clasificacionNormalizada[k] = false
            const noRiesgoMarcado = CLASIFICACION_BAJO_RIESGO_KEYS.some(
              k => Boolean(clasificacionNormalizada[k]),
            )
            if (!noRiesgoMarcado) clasificacionNormalizada.visita_sin_riesgo = true
          }
          await hseService.guardarClasificacion(token, clasificacionNormalizada)
          break
        }

        case 'seg_social':
          await hseService.guardarSeguridadSocial(token, {
            personas: [{
              ...formSegSocial,
              es_titular:     true,
              nombre_persona: `${formDatos.nombres ?? ''} ${formDatos.apellidos ?? ''}`.trim() || undefined,
              cedula_persona: formDatos.numero_documento || undefined,
            }],
          })
          break

        case 'certificaciones':
          await hseService.guardarCertificaciones(token, formCert)
          break

        case 'medico':
          await hseService.guardarExamenMedico(token, formExamen)
          break

        case 'emergencia':
          await hseService.guardarContactoEmergencia(token, formEmergencia)
          break

        default:
          break
      }

      if (pasoActual < pasoMax) {
        setPasoActual(p => p + 1)
      }
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const handleAnterior = () => {
    if (pasoActual > 1) {
      setError(null)
      setPasoActual(p => p - 1)
    }
  }

  // Renderizar el paso actual
  const renderPaso = () => {
    if (!tokenData) return null
    switch (pasoKey) {
      case 'sede':
        return <Paso1Sede data={tokenData} />
      case 'datos':
        return (
          <Paso2Datos
            form={formDatos}
            setForm={setFormDatos}
            empresaProveedor={tokenData.empresa_proveedor}
          />
        )
      case 'actividad':
        return (
          <Paso3Clasificacion
            form={formClasif}
            setForm={setFormClasif}
            esAltoRiesgo={esAltoRiesgo}
            onUploadPdf={handleUploadPdf}
            uploadingCampo={uploadingCampo}
            uploadProgress={uploadProgress}
          />
        )
      case 'seg_social':
        return (
          <Paso4SeguridadSocial
            form={formSegSocial}
            setForm={setFormSegSocial}
            eps={epsCatalog}
            arl={arlCatalog}
            afp={afpCatalog}
            onUploadPdf={handleUploadPdf}
            uploadingCampo={uploadingCampo}
            uploadProgress={uploadProgress}
          />
        )
      case 'certificaciones':
        return (
          <Paso5Certificaciones
            form={formCert}
            setForm={setFormCert}
            onUploadPdf={handleUploadPdf}
            uploadingCampo={uploadingCampo}
            uploadProgress={uploadProgress}
          />
        )
      case 'medico':
        return (
          <Paso6ExamenMedico
            form={formExamen}
            setForm={setFormExamen}
            onUploadPdf={handleUploadPdf}
            uploadingCampo={uploadingCampo}
            uploadProgress={uploadProgress}
          />
        )
      case 'emergencia':
        return <Paso7Emergencia form={formEmergencia} setForm={setFormEmergencia} />
      case 'normas':
        return <Paso8Normas form={formNormas} setForm={setFormNormas} normas={normas} />
      default:
        return null
    }
  }

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg-base)',
        flexDirection:  'column',
        gap:            '16px',
      }}>
        <Loader size={32} color="var(--primary-400)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Validando tu link de autogestión...
        </p>
      </div>
    )
  }

  // ── Error de token ────────────────────────────────────────────
  if (tokenError || !tokenData) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg-base)',
        padding:        '24px',
      }}>
        <div style={{
          maxWidth:     '400px',
          textAlign:    'center',
          padding:      '40px',
          background:   'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border:       '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width:          '64px',
            height:         '64px',
            borderRadius:   '50%',
            background:     'rgba(239,68,68,0.1)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 20px',
          }}>
            <AlertTriangle size={28} color="var(--danger-400)" />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No fue posible abrir el formulario
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {tokenError ?? 'Este link de autogestión no es válido o ha expirado. Contacta al administrador HSE para que genere uno nuevo.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Completado ────────────────────────────────────────────────
  if (completado) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--bg-base)',
        padding:        '24px',
      }}>
        <div style={{
          maxWidth:     '440px',
          textAlign:    'center',
          padding:      '48px 40px',
          background:   'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border:       '1px solid rgba(16,185,129,0.2)',
        }}
        className="animate-fade-up">
          <div style={{
            width:          '72px',
            height:         '72px',
            borderRadius:   '50%',
            background:     'rgba(16,185,129,0.1)',
            border:         '2px solid rgba(16,185,129,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 24px',
          }}>
            <CheckCircle2 size={34} color="var(--success-400)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            ¡Autogestión completada!
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
            Tu información fue enviada correctamente. El administrador HSE revisará tu documentación y recibirás confirmación de tu autorización.
          </p>
          <div style={{
            padding:      '14px 18px',
            background:   'rgba(16,185,129,0.06)',
            border:       '1px solid rgba(16,185,129,0.15)',
            borderRadius: '10px',
            fontSize:     '0.78rem',
            color:        'var(--success-400)',
          }}>
            Puedes cerrar esta ventana.
          </div>
        </div>
      </div>
    )
  }

  // ── Wizard ────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:  '100vh',
      background: 'var(--bg-base)',
      padding:    '32px 24px',
      display:    'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }}>
      <div style={{
        width:     '100%',
        maxWidth:  '620px',
      }}>

        {/* Logo */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '10px',
          marginBottom:   '32px',
          justifyContent: 'center',
        }}>
          <div style={{
            width:          '36px',
            height:         '36px',
            background:     'var(--primary-500)',
            borderRadius:   '8px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      'var(--shadow-glow-primary)',
          }}>
            <ShieldCheck size={20} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '0.85rem',
              fontWeight:    700,
              color:         'var(--text-primary)',
              letterSpacing: '0.1em',
            }}>
              KOAJ ACCESS
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Portal de Autogestión HSE
            </div>
          </div>
        </div>

        {/* Indicador de pasos */}
        <PasoIndicador pasoActual={pasoActual} pasosActivos={pasosActivos} />

        {/* Barra de progreso */}
        <div style={{
          width:        '100%',
          height:       '3px',
          background:   'rgba(255,255,255,0.06)',
          borderRadius: '999px',
          marginBottom: '16px',
          overflow:     'hidden',
        }}>
          <div style={{
            height:     '100%',
            width:      `${((pasoActual - 1) / totalPasos) * 100}%`,
            background: 'linear-gradient(90deg, var(--primary-500), var(--primary-400))',
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{
          marginBottom: '12px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
          fontSize: '0.74rem',
        }}>
          {tokenData.empresa_proveedor && (
            <span style={{ color: 'var(--text-muted)' }}>
              Empresa: <strong style={{ color: '#818CF8' }}>{tokenData.empresa_proveedor}</strong>
            </span>
          )}
          <span style={{ color: 'var(--text-muted)' }}>
            Tipo: <strong style={{ color: esAltoRiesgo ? 'var(--danger-400)' : 'var(--success-400)' }}>{tokenData.tipo_contratista === 'ALTO_RIESGO' ? 'Alto riesgo' : 'Normal'}</strong>
          </span>
        </div>

        {/* Card del paso */}
        <div style={{
          background:   'var(--bg-surface)',
          border:       '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow:     'hidden',
          marginBottom: '16px',
        }}
        className="animate-fade-up">
          <div style={{ padding: '32px' }}>
            {renderPaso()}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              margin:         '0 32px 20px',
              padding:        '10px 14px',
              background:     'rgba(245,158,11,0.08)',
              border:         '1px solid rgba(245,158,11,0.25)',
              borderRadius:   '8px',
              fontSize:       '0.8rem',
              color:          '#f59e0b',
              display:        'flex',
              alignItems:     'center',
              gap:            '8px',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} />
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  color:      '#f59e0b',
                  padding:    '2px',
                  display:    'flex',
                  alignItems: 'center',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Navegación */}
          <div style={{
            padding:        '16px 32px',
            borderTop:      '1px solid var(--border-subtle)',
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
          }}>
            <button
              onClick={handleAnterior}
              disabled={pasoActual === 1}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '10px 18px',
                background:   'transparent',
                border:       '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color:        pasoActual === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize:     '0.83rem',
                cursor:       pasoActual === 1 ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font-ui)',
                opacity:      pasoActual === 1 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={15} />
              Anterior
            </button>

            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   '0.72rem',
              color:      'var(--text-muted)',
            }}>
              {pasoActual} / {pasoMax}
            </span>

            <button
              onClick={handleSiguiente}
              disabled={saving || Boolean(uploadingCampo)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '10px 22px',
                background:   (saving || uploadingCampo) ? 'var(--primary-700)' : 'var(--primary-500)',
                border:       'none',
                borderRadius: 'var(--radius-md)',
                color:        'white',
                fontSize:     '0.875rem',
                fontWeight:   700,
                cursor:       (saving || uploadingCampo) ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font-ui)',
                boxShadow:    (saving || uploadingCampo) ? 'none' : 'var(--shadow-glow-primary)',
                transition:   'all var(--transition-fast)',
              }}
            >
              {saving ? (
                <>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Guardando...
                </>
              ) : pasoActual === pasoMax ? (
                <>
                  <CheckCircle2 size={15} />
                  Completar
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}