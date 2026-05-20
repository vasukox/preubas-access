/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * Portal Autogestión HSE — Wizard premium / carrusel
 */
import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShieldCheck, ChevronLeft, CheckCircle2, AlertTriangle,
  User, FileText, Heart, BookOpen, Loader, Upload,
  Phone, Activity, Clipboard,
} from 'lucide-react'
import { hseService } from '@/services/hse.service'
import { getErrorMessage } from '@/services/api'
import type { AutogestionTokenResponse } from '@/types/hse'

type UploadModulo = 'clasificacion' | 'seg_social' | 'certificaciones' | 'examen'

// ── Paso keys ─────────────────────────────────────────────────────────
type PasoKey =
  | 'sede' | 'datos' | 'actividad'
  | 'seg_social' | 'certificaciones' | 'medico'
  | 'emergencia_contacto' | 'emergencia_medico'
  | 'emergencia' | 'normas'

const PASO_META: Record<PasoKey, { label: string; icon: React.ElementType; accent: string }> = {
  sede:                { label: 'Bienvenida',  icon: ShieldCheck, accent: '#4574C4' },
  datos:               { label: 'Datos',       icon: User,        accent: '#4574C4' },
  actividad:           { label: 'Actividad',   icon: Clipboard,   accent: '#E6922E' },
  seg_social:          { label: 'Seg. Social', icon: Heart,       accent: '#28956C' },
  certificaciones:     { label: 'Certifs.',    icon: FileText,    accent: '#28956C' },
  medico:              { label: 'Médico',      icon: Activity,    accent: '#5668B8' },
  emergencia_contacto: { label: 'Contacto',    icon: Phone,       accent: '#E6922E' },
  emergencia_medico:   { label: 'Info Médica', icon: Heart,       accent: '#C05050' },
  emergencia:          { label: 'Emergencia',  icon: Heart,       accent: '#C05050' },
  normas:              { label: 'Normas',      icon: BookOpen,    accent: '#28956C' },
}

const PASOS_AR: PasoKey[] = ['sede','datos','actividad','seg_social','certificaciones','medico','emergencia','normas']
const PASOS_NORMAL: PasoKey[] = ['sede','datos','actividad','emergencia_contacto','emergencia_medico','normas']

const CLASIF_AR_KEYS = ['trabajo_alturas','espacios_confinados','trabajo_electrico','trabajo_caliente','izaje_maquinaria'] as const
const CLASIF_BAJO_KEYS = ['visita_sin_riesgo','personal_extranjero','genera_residuos'] as const

// ── Base styles ────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width:'100%', padding:'10px 14px', fontSize:'.875rem',
  background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)',
  borderRadius:'8px', color:'var(--text-primary)', fontFamily:'var(--font-ui)',
  outline:'none', boxSizing:'border-box',
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'.68rem', fontWeight:600,
  color:'var(--text-muted)', marginBottom:'6px', letterSpacing:'.06em',
}
const sel: React.CSSProperties = {
  ...inp, cursor:'pointer', appearance:'none' as any,
  backgroundImage:'linear-gradient(45deg,transparent 50%,var(--text-muted) 50%),linear-gradient(135deg,var(--text-muted) 50%,transparent 50%)',
  backgroundPosition:'calc(100% - 14px) calc(50% - 2px),calc(100% - 9px) calc(50% - 2px)',
  backgroundSize:'5px 5px,5px 5px', backgroundRepeat:'no-repeat', paddingRight:'32px',
}
const grid2: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:12 }
const reqStar = <span style={{color:'var(--danger-400)',marginLeft:2}}>*</span>

// ── Helper: vigencia ──────────────────────────────────────────────────
function estadoVig(f?: string): 'vencido'|'proximo'|'vigente'|null {
  if (!f) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const d = Math.floor((new Date(f+'T00:00:00').getTime()-hoy.getTime())/86400000)
  return d < 0 ? 'vencido' : d <= 30 ? 'proximo' : 'vigente'
}
function VigenciaBadge({ fecha }: { fecha?: string }) {
  const e = estadoVig(fecha); if (!e) return null
  const cfg = {
    vencido:{ c:'var(--danger-400)',  bg:'rgba(192,80,80,.09)',  t:'⚠ Vencido' },
    proximo:{ c:'#4574C4',            bg:'rgba(69,116,196,.09)', t:'⚠ Vence pronto (< 30 días)' },
    vigente:{ c:'var(--success-400)', bg:'rgba(40,149,108,.09)', t:'✓ Vigente' },
  }[e]
  return <div style={{marginTop:4,padding:'3px 8px',borderRadius:6,fontSize:'.68rem',color:cfg.c,background:cfg.bg,fontWeight:600}}>{cfg.t}</div>
}

// ── Blood type picker ─────────────────────────────────────────────────
const BT = [{v:'A_POS',l:'A+'},{v:'A_NEG',l:'A−'},{v:'B_POS',l:'B+'},{v:'B_NEG',l:'B−'},{v:'AB_POS',l:'AB+'},{v:'AB_NEG',l:'AB−'},{v:'O_POS',l:'O+'},{v:'O_NEG',l:'O−'}]
function BloodPicker({ value, onChange }: { value?:string; onChange:(v:string)=>void }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
      {BT.map(t => {
        const on = value===t.v
        return (
          <button key={t.v} type="button" onClick={()=>onChange(t.v)} style={{
            padding:'9px 4px', borderRadius:10, cursor:'pointer', fontFamily:'var(--font-mono)',
            fontSize:'.9rem', fontWeight: on?700:500, textAlign:'center',
            background: on?'rgba(192,80,80,.14)':'rgba(255,255,255,.04)',
            border:`1.5px solid ${on?'rgba(192,80,80,.5)':'rgba(255,255,255,.1)'}`,
            color: on?'#E05050':'var(--text-muted)',
            boxShadow: on?'0 0 10px rgba(192,80,80,.2)':'none',
            transition:'all .18s ease',
          }}>{t.l}</button>
        )
      })}
    </div>
  )
}

// ── PDF Upload Zone ───────────────────────────────────────────────────
function PdfUploadZone({ label, value, required=false, uploading=false, progress=0, onSelect }:{
  label:string; value?:string; required?:boolean; uploading?:boolean; progress?:number; onSelect:(f:File)=>void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const name = value ? value.split('/').pop()! : ''
  const r=22, circ=2*Math.PI*r

  const pick = (f?:File) => { if(f) onSelect(f) }

  return (
    <div style={{minWidth:0}}>
      <label style={lbl}>{label}{required && reqStar}</label>
      <input ref={ref} type="file" accept="application/pdf,.pdf" style={{display:'none'}}
        onChange={e=>{ pick(e.target.files?.[0]); e.currentTarget.value='' }} />

      {uploading ? (
        <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',
          background:'rgba(69,116,196,.07)',border:'1.5px solid rgba(69,116,196,.3)',borderRadius:12}}>
          <svg width={56} height={56} style={{flexShrink:0}}>
            <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={3}/>
            <circle cx={28} cy={28} r={r} fill="none" stroke="#4574C4" strokeWidth={3}
              strokeDasharray={circ} strokeDashoffset={circ-(progress/100)*circ} strokeLinecap="round"
              style={{transformOrigin:'28px 28px',transform:'rotate(-90deg)',transition:'stroke-dashoffset .2s'}}/>
            <text x={28} y={33} textAnchor="middle" fill="#4574C4" fontSize={11} fontWeight={700}
              fontFamily="var(--font-mono)">{progress}%</text>
          </svg>
          <div>
            <div style={{fontSize:'.8rem',color:'#4574C4',fontWeight:600}}>Subiendo PDF…</div>
            <div style={{marginTop:8,height:4,borderRadius:99,background:'rgba(255,255,255,.08)',overflow:'hidden',width:160}}>
              <div style={{height:'100%',borderRadius:99,width:`${progress}%`,
                background:'linear-gradient(90deg,#4574C4,#6A95E0)',transition:'width .2s'}}/>
            </div>
          </div>
        </div>
      ) : value ? (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',
          background:'rgba(40,149,108,.07)',border:'1.5px solid rgba(40,149,108,.3)',borderRadius:12}}>
          <div style={{width:34,height:34,borderRadius:'50%',background:'rgba(40,149,108,.15)',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <CheckCircle2 size={18} color="var(--success-400)"/>
          </div>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontSize:'.65rem',color:'var(--success-400)',fontWeight:700,letterSpacing:'.05em'}}>CARGADO</div>
            <div title={name} style={{fontSize:'.78rem',color:'var(--text-secondary)',
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
          </div>
          <button type="button" onClick={()=>ref.current?.click()}
            style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',
              padding:4,display:'flex',alignItems:'center'}} title="Reemplazar">
            <Upload size={14}/>
          </button>
        </div>
      ) : (
        <div onClick={()=>ref.current?.click()}
          onDragOver={e=>{e.preventDefault();setDrag(true)}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);pick(e.dataTransfer.files?.[0])}}
          style={{padding:'22px 20px',borderRadius:12,cursor:'pointer',textAlign:'center',
            border:`1.5px dashed ${drag?'rgba(69,116,196,.7)':'rgba(255,255,255,.15)'}`,
            background: drag?'rgba(69,116,196,.08)':'rgba(255,255,255,.02)',
            transition:'all .2s'}}>
          <Upload size={26} color="rgba(100,130,200,.7)" style={{marginBottom:8,display:'block',margin:'0 auto 8px'}}/>
          <div style={{fontSize:'.78rem',color:'var(--text-muted)',marginBottom:4}}>
            <span style={{color:'#6A95E0',fontWeight:600}}>Haz clic</span> o arrastra el PDF aquí
          </div>
          <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.2)'}}>Solo PDF · Máx. 8 MB</div>
        </div>
      )}
    </div>
  )
}

// ── Paso indicador ────────────────────────────────────────────────────
function PasoIndicador({ paso, pasos }: { paso:number; pasos:PasoKey[] }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',rowGap:8,marginBottom:24}}>
      {pasos.map((key, i) => {
        const num=i+1, active=num===paso, done=num<paso
        const meta=PASO_META[key]
        return (
          <React.Fragment key={key}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{
                width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',
                justifyContent:'center',fontSize:'.72rem',fontWeight:700,transition:'all .3s',
                background: done?'var(--success-400)': active?`linear-gradient(135deg,${meta.accent},${meta.accent}bb)`:'rgba(255,255,255,.07)',
                border: active?`2px solid ${meta.accent}`:'2px solid transparent',
                color: done||active?'white':'var(--text-muted)',
                boxShadow: active?`0 0 14px ${meta.accent}55`:'none',
              }}>
                {done ? <CheckCircle2 size={14}/> : num}
              </div>
              <span style={{fontSize:'.56rem',letterSpacing:'.04em',whiteSpace:'nowrap',
                color: active?meta.accent:'var(--text-muted)', fontWeight:active?700:400}}>
                {meta.label.toUpperCase()}
              </span>
            </div>
            {i<pasos.length-1 && (
              <div style={{width:22,height:2,borderRadius:99,margin:'0 2px',marginBottom:16,flexShrink:0,
                background: done?'var(--success-400)':'rgba(255,255,255,.08)',transition:'background .4s'}}/>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Paso 1 — Sede ─────────────────────────────────────────────────────
function Paso1Sede({ data }: { data: AutogestionTokenResponse }) {
  const ar = data.tipo_contratista==='ALTO_RIESGO'
  return (
    <div style={{textAlign:'center'}}>
      <div style={{width:68,height:68,borderRadius:'50%',margin:'0 auto 20px',
        background:'rgba(69,116,196,.12)',border:'2px solid rgba(69,116,196,.3)',
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'0 0 28px rgba(69,116,196,.2)'}}>
        <ShieldCheck size={30} color="#6A95E0"/>
      </div>
      <h2 style={{fontSize:'1.3rem',fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>
        Portal de Autogestión HSE
      </h2>
      <p style={{fontSize:'.875rem',color:'var(--text-muted)',lineHeight:1.7,marginBottom:24}}>
        Hola <strong style={{color:'var(--text-primary)'}}>{data.nombres} {data.apellidos}</strong>, completa este formulario para habilitar tu ingreso a las instalaciones de Permoda S.A.S.
      </p>
      {data.empresa_proveedor && (
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',marginBottom:14,
          background:'rgba(86,104,184,.1)',border:'1px solid rgba(86,104,184,.25)',borderRadius:12,textAlign:'left'}}>
          <div style={{width:36,height:36,borderRadius:9,background:'rgba(86,104,184,.15)',
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#7080CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:'.6rem',color:'#7080CC',letterSpacing:'.08em',marginBottom:2}}>EMPRESA / PROVEEDOR</div>
            <div style={{fontSize:'1rem',fontWeight:700,color:'var(--text-primary)'}}>{data.empresa_proveedor}</div>
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <div style={{padding:'12px 14px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,textAlign:'left'}}>
          <div style={{fontSize:'.6rem',color:'var(--text-muted)',letterSpacing:'.07em',marginBottom:5}}>SEDE</div>
          <div style={{fontSize:'.9rem',fontWeight:600,color:'#6A95E0'}}>{data.sede_nombre}</div>
        </div>
        <div style={{padding:'12px 14px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,textAlign:'left'}}>
          <div style={{fontSize:'.6rem',color:'var(--text-muted)',letterSpacing:'.07em',marginBottom:5}}>TIPO</div>
          <span style={{padding:'2px 10px',borderRadius:20,fontSize:'.7rem',fontWeight:700,
            background: ar?'rgba(192,80,80,.12)':'rgba(40,149,108,.12)',
            border:`1px solid ${ar?'rgba(192,80,80,.35)':'rgba(40,149,108,.35)'}`,
            color: ar?'var(--danger-400)':'var(--success-400)'}}>
            {ar?'⚠ Alto Riesgo':'✓ Normal'}
          </span>
        </div>
      </div>
      <div style={{padding:'14px 16px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,textAlign:'left'}}>
        <div style={{fontSize:'.6rem',color:'var(--text-muted)',letterSpacing:'.07em',marginBottom:5}}>ACTIVIDAD AUTORIZADA</div>
        <div style={{fontSize:'.85rem',color:'var(--text-secondary)',lineHeight:1.6}}>{data.descripcion_actividad}</div>
        <div style={{marginTop:6,fontSize:'.7rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
          {data.fecha_inicio} → {data.fecha_fin}
        </div>
      </div>
    </div>
  )
}

// ── Paso 2 — Datos personales ─────────────────────────────────────────
function Paso2Datos({ form, setForm, empresa, tipologia, formClasif, setFormClasif, onUpload, uploadingCampo, uploadProgress }:{
  form:any; setForm:(f:any)=>void; empresa?:string|null; tipologia:string
  formClasif:any; setFormClasif:(f:any)=>void
  onUpload:(m:UploadModulo,c:string,f:File)=>Promise<string>
  uploadingCampo:string|null; uploadProgress:Record<string,number>
}) {
  const ext = form.tipo_documento==='CE'||form.tipo_documento==='PASAPORTE'
  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Datos personales</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>Confirma y completa tu información de contacto.</p>
      {empresa && (
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,padding:'8px 12px',
          borderRadius:10,background:'rgba(86,104,184,.08)',border:'1px solid rgba(86,104,184,.2)',
          fontSize:'.75rem',color:'var(--text-secondary)'}}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#7080CC" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{color:'var(--text-muted)'}}>Empresa:</span>
          <strong style={{color:'#7080CC'}}>{empresa}</strong>
        </div>
      )}
      <div style={grid2}>
        <div>
          <label style={lbl}>TIPO DOCUMENTO</label>
          <select value={form.tipo_documento??''} style={sel} onChange={e=>setForm((f:any)=>({...f,tipo_documento:e.target.value}))}>
            {['CC','CE','PASAPORTE','TI'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>NÚMERO DE DOCUMENTO</label>
          <input type="text" value={form.numero_documento??''} style={inp}
            onChange={e=>setForm((f:any)=>({...f,numero_documento:e.target.value}))}/>
        </div>
      </div>
      {ext && (
        <div style={{marginBottom:14,padding:16,background:'rgba(40,149,108,.05)',border:'1px solid rgba(40,149,108,.2)',borderRadius:12}}>
          <div style={{fontSize:'.68rem',color:'var(--success-400)',fontWeight:700,letterSpacing:'.06em',marginBottom:12}}>
            PÓLIZA DE SEGURO — COBERTURA COLOMBIA
            <span style={{fontSize:'.62rem',fontWeight:400,color:'var(--text-muted)',marginLeft:8}}>Obligatoria para CE / PASAPORTE</span>
          </div>
          <div style={grid2}>
            <div>
              <label style={lbl}>ASEGURADORA{reqStar}</label>
              <input type="text" value={formClasif.extran_aseguradora??''} style={inp} placeholder="Nombre aseguradora"
                onChange={e=>setFormClasif((f:any)=>({...f,extran_aseguradora:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>N° PÓLIZA{reqStar}</label>
              <input type="text" value={formClasif.extran_num_poliza??''} style={inp} placeholder="POL-0000000"
                onChange={e=>setFormClasif((f:any)=>({...f,extran_num_poliza:e.target.value}))}/>
            </div>
            <div>
              <label style={lbl}>VENCIMIENTO{reqStar}</label>
              <input type="date" value={formClasif.extran_poliza_venc??''} style={inp}
                onChange={e=>setFormClasif((f:any)=>({...f,extran_poliza_venc:e.target.value||undefined}))}/>
              <VigenciaBadge fecha={formClasif.extran_poliza_venc}/>
            </div>
          </div>
          <PdfUploadZone label="PDF póliza" required value={formClasif.extran_poliza_archivo}
            uploading={uploadingCampo==='clasificacion.extran_poliza_archivo'}
            progress={uploadProgress['clasificacion.extran_poliza_archivo']}
            onSelect={f=>void onUpload('clasificacion','extran_poliza_archivo',f).then(p=>setFormClasif((x:any)=>({...x,extran_poliza_archivo:p})))}/>
        </div>
      )}
      <div style={grid2}>
        <div>
          <label style={lbl}>NOMBRES</label>
          <input type="text" value={form.nombres??''} style={inp} onChange={e=>setForm((f:any)=>({...f,nombres:e.target.value}))}/>
        </div>
        <div>
          <label style={lbl}>APELLIDOS</label>
          <input type="text" value={form.apellidos??''} style={inp} onChange={e=>setForm((f:any)=>({...f,apellidos:e.target.value}))}/>
        </div>
      </div>
      <div style={grid2}>
        <div>
          <label style={lbl}>EMAIL</label>
          <input type="email" value={form.email??''} style={inp} onChange={e=>setForm((f:any)=>({...f,email:e.target.value}))}/>
        </div>
        <div>
          <label style={lbl}>TELÉFONO</label>
          <input type="text" value={form.telefono??''} style={inp} placeholder="3001234567" onChange={e=>setForm((f:any)=>({...f,telefono:e.target.value}))}/>
        </div>
      </div>
      <div style={{padding:'14px 16px',background:'rgba(69,116,196,.05)',border:'1px solid rgba(69,116,196,.15)',borderRadius:12,marginBottom:12}}>
        <div style={{fontSize:'.66rem',color:'#6A95E0',fontWeight:700,letterSpacing:'.06em',marginBottom:10}}>RESPONSABLE SST</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>NOMBRE</label>
            <input type="text" value={form.sst_responsable_nombre??''} style={inp} placeholder="Nombre completo"
              onChange={e=>setForm((f:any)=>({...f,sst_responsable_nombre:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>TELÉFONO SST</label>
            <input type="text" value={form.sst_responsable_telefono??''} style={inp} placeholder="3001234567"
              onChange={e=>setForm((f:any)=>({...f,sst_responsable_telefono:e.target.value}))}/>
          </div>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lbl}>TIPOLOGÍA DE TRABAJO</label>
        <input type="text" value={tipologia} readOnly tabIndex={-1}
          style={{...inp,opacity:.7,cursor:'not-allowed',background:'rgba(255,255,255,.02)'}}/>
      </div>
      <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
        <input type="checkbox" checked={form.tratamiento_datos??false} style={{width:16,height:16,marginTop:1,cursor:'pointer'}}
          onChange={e=>setForm((f:any)=>({...f,tratamiento_datos:e.target.checked}))}/>
        <span style={{fontSize:'.78rem',color:'var(--text-muted)',lineHeight:1.5}}>
          Acepto el tratamiento de mis datos personales por parte de Permoda S.A.S.
        </span>
      </label>
    </div>
  )
}

// ── Paso 3 — Clasificación ────────────────────────────────────────────
function Paso3Clasif({ form, setForm, esAR, onUpload, uploadingCampo, uploadProgress }:{
  form:any; setForm:(f:any)=>void; esAR:boolean
  onUpload:(m:UploadModulo,c:string,f:File)=>Promise<string>
  uploadingCampo:string|null; uploadProgress:Record<string,number>
}) {
  const preguntas = [
    {key:'trabajo_alturas',    label:'Trabajo en alturas',             riesgo:true},
    {key:'espacios_confinados',label:'Espacios confinados',            riesgo:true},
    {key:'trabajo_electrico',  label:'Trabajo eléctrico (CONTEC)',     riesgo:true},
    {key:'trabajo_caliente',   label:'Trabajo en caliente',            riesgo:true},
    {key:'izaje_maquinaria',   label:'Izaje de maquinaria',            riesgo:true},
    {key:'visita_sin_riesgo',  label:'Visita / inspección sin riesgo', riesgo:false},
    {key:'personal_extranjero',label:'Soy personal extranjero',        riesgo:false},
    {key:'genera_residuos',    label:'La actividad genera residuos',   riesgo:false},
  ]
  const filtradas = esAR ? preguntas : preguntas.filter(p=>!p.riesgo)

  const up = (campo:string,file:File) => void onUpload('clasificacion',campo,file).then(p=>setForm((f:any)=>({...f,[campo]:p})))
  const isUp = (c:string) => uploadingCampo===`clasificacion.${c}`
  const prog = (c:string) => uploadProgress[`clasificacion.${c}`]

  const toggle = (key:string) => {
    setForm((f:any)=>{
      if(f[key]) {
        const n:any={...f,[key]:false}
        const resets:Record<string,string[]>={
          trabajo_alturas:['alturas_nivel','alturas_cert_fecha_venc','alturas_cert_archivo'],
          espacios_confinados:['confinados_rol','confinados_cert_fecha','confinados_cert_archivo'],
          trabajo_electrico:['electrico_matricula_contec','electrico_num_matricula','electrico_matricula_venc','electrico_matricula_archivo'],
          trabajo_caliente:['caliente_extintor_fecha','caliente_extintor_archivo','caliente_permiso_fecha','caliente_permiso_archivo'],
          izaje_maquinaria:['izaje_tipo_equipo','izaje_inspeccion_archivo','izaje_doc_legal_archivo','izaje_licencia_archivo'],
          personal_extranjero:['extran_aseguradora','extran_num_poliza','extran_poliza_venc','extran_poliza_archivo'],
          genera_residuos:['residuos_tipo','residuos_plan_archivo'],
        }
        resets[key]?.forEach(k=>{ n[k]=undefined })
        return n
      }
      return {...f,[key]:true}
    })
  }

  const requisitos = (key:string) => {
    if(!form[key]) return null
    const boxStyle:React.CSSProperties={marginTop:8,padding:14,borderRadius:10,
      background:'rgba(192,80,80,.05)',border:'1px solid rgba(192,80,80,.2)'}
    if(key==='trabajo_alturas') return (
      <div style={boxStyle}>
        <div style={{fontSize:'.78rem',color:'var(--danger-400)',fontWeight:600,marginBottom:10}}>Requisitos — Alturas</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>NIVEL{reqStar}</label>
            <select value={form.alturas_nivel??''} style={sel} onChange={e=>setForm((f:any)=>({...f,alturas_nivel:e.target.value||undefined}))}>
              <option value="">Seleccionar…</option>
              {['BASICO','AVANZADO','COORDINADOR'].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>VENCIMIENTO CERT{reqStar}</label>
            <input type="date" value={form.alturas_cert_fecha_venc??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,alturas_cert_fecha_venc:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.alturas_cert_fecha_venc}/>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <PdfUploadZone label="PDF certificado alturas" required value={form.alturas_cert_archivo}
            uploading={isUp('alturas_cert_archivo')} progress={prog('alturas_cert_archivo')}
            onSelect={f=>up('alturas_cert_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='espacios_confinados') return (
      <div style={boxStyle}>
        <div style={{fontSize:'.78rem',color:'var(--danger-400)',fontWeight:600,marginBottom:10}}>Requisitos — Espacios confinados</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>ROL{reqStar}</label>
            <select value={form.confinados_rol??''} style={sel} onChange={e=>setForm((f:any)=>({...f,confinados_rol:e.target.value||undefined}))}>
              <option value="">Seleccionar…</option>
              {['SUPERVISOR','VIGIA','ENTRANTE'].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>FECHA CERT{reqStar}</label>
            <input type="date" value={form.confinados_cert_fecha??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,confinados_cert_fecha:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.confinados_cert_fecha}/>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <PdfUploadZone label="PDF certificado confinados" required value={form.confinados_cert_archivo}
            uploading={isUp('confinados_cert_archivo')} progress={prog('confinados_cert_archivo')}
            onSelect={f=>up('confinados_cert_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='trabajo_electrico') return (
      <div style={boxStyle}>
        <div style={{fontSize:'.78rem',color:'var(--danger-400)',fontWeight:600,marginBottom:10}}>Requisitos — Trabajo eléctrico</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>MATRÍCULA CONTEC{reqStar}</label>
            <select value={form.electrico_matricula_contec??''} style={sel} onChange={e=>setForm((f:any)=>({...f,electrico_matricula_contec:e.target.value||undefined}))}>
              <option value="">Seleccionar…</option>
              {['TE1','TE2','TE3','TE4','TE5','TE6'].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>N° MATRÍCULA{reqStar}</label>
            <input type="text" value={form.electrico_num_matricula??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,electrico_num_matricula:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>VENCIMIENTO{reqStar}</label>
            <input type="date" value={form.electrico_matricula_venc??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,electrico_matricula_venc:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.electrico_matricula_venc}/>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <PdfUploadZone label="PDF matrícula CONTEC" required value={form.electrico_matricula_archivo}
            uploading={isUp('electrico_matricula_archivo')} progress={prog('electrico_matricula_archivo')}
            onSelect={f=>up('electrico_matricula_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='trabajo_caliente') return (
      <div style={boxStyle}>
        <div style={{fontSize:'.78rem',color:'var(--danger-400)',fontWeight:600,marginBottom:10}}>Requisitos — Trabajo en caliente</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>FECHA EXTINTOR CO₂{reqStar}</label>
            <input type="date" value={form.caliente_extintor_fecha??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,caliente_extintor_fecha:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.caliente_extintor_fecha}/>
          </div>
          <div>
            <label style={lbl}>FECHA PERMISO{reqStar}</label>
            <input type="date" value={form.caliente_permiso_fecha??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,caliente_permiso_fecha:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.caliente_permiso_fecha}/>
          </div>
        </div>
        <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <PdfUploadZone label="PDF extintor" required value={form.caliente_extintor_archivo}
            uploading={isUp('caliente_extintor_archivo')} progress={prog('caliente_extintor_archivo')}
            onSelect={f=>up('caliente_extintor_archivo',f)}/>
          <PdfUploadZone label="PDF permiso trabajo caliente" required value={form.caliente_permiso_archivo}
            uploading={isUp('caliente_permiso_archivo')} progress={prog('caliente_permiso_archivo')}
            onSelect={f=>up('caliente_permiso_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='izaje_maquinaria') return (
      <div style={boxStyle}>
        <div style={{fontSize:'.78rem',color:'var(--danger-400)',fontWeight:600,marginBottom:10}}>Requisitos — Izaje de maquinaria</div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>TIPO DE EQUIPO{reqStar}</label>
          <input type="text" value={form.izaje_tipo_equipo??''} style={inp} placeholder="Grúa, montacargas…"
            onChange={e=>setForm((f:any)=>({...f,izaje_tipo_equipo:e.target.value}))}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
          <PdfUploadZone label="PDF inspección pre-operacional" required value={form.izaje_inspeccion_archivo}
            uploading={isUp('izaje_inspeccion_archivo')} progress={prog('izaje_inspeccion_archivo')}
            onSelect={f=>up('izaje_inspeccion_archivo',f)}/>
          <PdfUploadZone label="PDF documentos legales equipo" required value={form.izaje_doc_legal_archivo}
            uploading={isUp('izaje_doc_legal_archivo')} progress={prog('izaje_doc_legal_archivo')}
            onSelect={f=>up('izaje_doc_legal_archivo',f)}/>
          <PdfUploadZone label="PDF licencia operador" required value={form.izaje_licencia_archivo}
            uploading={isUp('izaje_licencia_archivo')} progress={prog('izaje_licencia_archivo')}
            onSelect={f=>up('izaje_licencia_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='personal_extranjero') return (
      <div style={{...boxStyle,background:'rgba(40,149,108,.05)',border:'1px solid rgba(40,149,108,.2)'}}>
        <div style={{fontSize:'.78rem',color:'var(--success-400)',fontWeight:600,marginBottom:10}}>Requisitos — Personal extranjero</div>
        <div style={grid2}>
          <div>
            <label style={lbl}>ASEGURADORA{reqStar}</label>
            <input type="text" value={form.extran_aseguradora??''} style={inp} onChange={e=>setForm((f:any)=>({...f,extran_aseguradora:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>N° PÓLIZA{reqStar}</label>
            <input type="text" value={form.extran_num_poliza??''} style={inp} onChange={e=>setForm((f:any)=>({...f,extran_num_poliza:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>VENCIMIENTO{reqStar}</label>
            <input type="date" value={form.extran_poliza_venc??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,extran_poliza_venc:e.target.value||undefined}))}/>
            <VigenciaBadge fecha={form.extran_poliza_venc}/>
          </div>
        </div>
        <div style={{marginTop:10}}>
          <PdfUploadZone label="PDF póliza" required value={form.extran_poliza_archivo}
            uploading={isUp('extran_poliza_archivo')} progress={prog('extran_poliza_archivo')}
            onSelect={f=>up('extran_poliza_archivo',f)}/>
        </div>
      </div>
    )
    if(key==='genera_residuos') return (
      <div style={{...boxStyle,background:'rgba(40,149,108,.05)',border:'1px solid rgba(40,149,108,.2)'}}>
        <div style={{fontSize:'.78rem',color:'var(--success-400)',fontWeight:600,marginBottom:10}}>Requisitos — Generación de residuos</div>
        <div style={{marginBottom:10}}>
          <label style={lbl}>TIPO DE RESIDUOS{reqStar}</label>
          <input type="text" value={form.residuos_tipo??''} style={inp} onChange={e=>setForm((f:any)=>({...f,residuos_tipo:e.target.value}))}/>
        </div>
        <PdfUploadZone label="PDF plan manejo residuos" required value={form.residuos_plan_archivo}
          uploading={isUp('residuos_plan_archivo')} progress={prog('residuos_plan_archivo')}
          onSelect={f=>up('residuos_plan_archivo',f)}/>
      </div>
    )
    if(key==='visita_sin_riesgo') return (
      <div style={{...boxStyle,background:'rgba(40,149,108,.08)',border:'1px solid rgba(40,149,108,.3)',
        color:'var(--success-400)',fontSize:'.78rem',marginTop:8}}>
        ✓ Visita sin riesgo: no se requieren documentos adicionales en esta sección.
      </div>
    )
    return null
  }

  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Clasificación de actividad</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>
        {esAR ? 'Selecciona todas las actividades que aplican a tu trabajo de hoy.' : 'Selecciona las opciones que aplican a tu visita.'}
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtradas.map(p=>(
          <div key={p.key}>
            <button type="button" onClick={()=>toggle(p.key)} style={{
              width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 16px',borderRadius:10,cursor:'pointer',textAlign:'left',
              fontFamily:'var(--font-ui)',transition:'all .2s ease',
              background: form[p.key] ? (p.riesgo?'rgba(192,80,80,.08)':'rgba(40,149,108,.08)') : 'rgba(255,255,255,.03)',
              border: `1px solid ${form[p.key] ? (p.riesgo?'rgba(192,80,80,.3)':'rgba(40,149,108,.3)') : 'rgba(255,255,255,.08)'}`,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {p.riesgo
                  ? <AlertTriangle size={15} color={form[p.key]?'var(--danger-400)':'var(--text-muted)'}/>
                  : <CheckCircle2  size={15} color={form[p.key]?'var(--success-400)':'var(--text-muted)'}/>}
                <span style={{fontSize:'.875rem',fontWeight:form[p.key]?600:400,
                  color:form[p.key]?'var(--text-primary)':'var(--text-muted)'}}>
                  {p.label}
                </span>
              </div>
              <div style={{width:20,height:20,borderRadius:4,display:'flex',alignItems:'center',
                justifyContent:'center',flexShrink:0,transition:'all .2s',
                background: form[p.key] ? (p.riesgo?'var(--danger-400)':'var(--success-400)') : 'rgba(255,255,255,.08)',
                border: `1px solid ${form[p.key]?'transparent':'rgba(255,255,255,.15)'}`}}>
                {form[p.key] && <CheckCircle2 size={12} color="white"/>}
              </div>
            </button>
            {requisitos(p.key)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Paso 4 (AR) — Seguridad social ────────────────────────────────────
function Paso4SegSocial({ form, setForm, cuadrilla, setCuadrilla, eps, arl, afp, onUpload, uploadingCampo, uploadProgress }:{
  form:any; setForm:(f:any)=>void
  cuadrilla:any[]; setCuadrilla:React.Dispatch<React.SetStateAction<any[]>>
  eps:any[]; arl:any[]; afp:any[]
  onUpload:(m:UploadModulo,c:string,f:File)=>Promise<string>
  uploadingCampo:string|null; uploadProgress:Record<string,number>
}) {
  const [draftOpen,setDraftOpen]=useState(false)
  const [draft,setDraft]=useState<any>({})
  const addP=()=>{ if(!draft.nombre_persona?.trim()||!draft.cedula_persona?.trim()) return; setCuadrilla(p=>[...p,{...draft,es_titular:false}]); setDraft({}); setDraftOpen(false) }
  const hayVencido=[form.eps_vigencia,form.arl_vigencia,form.afp_vigencia].some(d=>estadoVig(d)==='vencido')

  const segCard=(title:string,idKey:string,vigKey:string,catalog:any[],colorVenc:boolean)=>(
    <div style={{padding:'14px 16px',marginBottom:10,background:'rgba(255,255,255,.03)',
      border:`1px solid ${colorVenc&&estadoVig(form[vigKey])==='vencido'?'rgba(192,80,80,.35)':'rgba(255,255,255,.08)'}`,borderRadius:10}}>
      <div style={grid2}>
        <div>
          <label style={lbl}>{title}</label>
          <select value={form[idKey]??''} style={sel}
            onChange={e=>setForm((f:any)=>({...f,[idKey]:e.target.value?Number(e.target.value):undefined}))}>
            <option value="">Seleccionar…</option>
            {catalog.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>VIGENCIA {title}</label>
          <input type="date" value={form[vigKey]??''} style={{...inp,borderColor:colorVenc&&estadoVig(form[vigKey])==='vencido'?'rgba(192,80,80,.5)':undefined}}
            onChange={e=>setForm((f:any)=>({...f,[vigKey]:e.target.value||undefined}))}/>
          <VigenciaBadge fecha={form[vigKey]}/>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Seguridad social</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:16}}>Registra tu afiliación vigente para validación HSE.</p>
      {hayVencido && (
        <div style={{marginBottom:14,padding:'10px 14px',background:'rgba(192,80,80,.08)',
          border:'1px solid rgba(192,80,80,.25)',borderRadius:10,fontSize:'.78rem',color:'var(--danger-400)'}}>
          ⚠ Tienes documentos vencidos. Con documentos vencidos no podrás ser autorizado para ingresar.
        </div>
      )}
      {segCard('EPS','eps_id','eps_vigencia',eps,true)}
      {segCard('ARL','arl_id','arl_vigencia',arl,true)}
      {segCard('AFP','afp_id','afp_vigencia',afp,true)}
      <div style={grid2}>
        <div>
          <label style={lbl}>TIPO PILA{reqStar}</label>
          <select value={form.pila_tipo??''} style={sel} onChange={e=>setForm((f:any)=>({...f,pila_tipo:e.target.value||undefined}))}>
            <option value="">Seleccionar…</option>
            {['INTEGRADA','MANUAL'].map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>ESTADO PILA{reqStar}</label>
          <select value={form.pila_estado??''} style={{...sel,
            color:form.pila_estado==='VENCIDA'?'var(--danger-400)':form.pila_estado==='PAGADA'?'var(--success-400)':undefined,
            borderColor:form.pila_estado==='VENCIDA'?'rgba(192,80,80,.5)':undefined}}
            onChange={e=>setForm((f:any)=>({...f,pila_estado:e.target.value||undefined}))}>
            <option value="">Seleccionar…</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADA">Pagada ✓</option>
            <option value="VENCIDA">Vencida ⚠</option>
          </select>
          {form.pila_estado==='VENCIDA'&&<div style={{marginTop:4,fontSize:'.7rem',color:'var(--danger-400)'}}>⚠ Regulariza tu pago antes de ingresar</div>}
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <PdfUploadZone label="PDF planilla PILA" required value={form.pila_archivo}
          uploading={uploadingCampo==='seg_social.pila_archivo'}
          progress={uploadProgress['seg_social.pila_archivo']}
          onSelect={f=>void onUpload('seg_social','pila_archivo',f).then(p=>setForm((x:any)=>({...x,pila_archivo:p})))}/>
      </div>
      {/* Cuadrilla */}
      <div style={{borderTop:'1px solid rgba(255,255,255,.07)',paddingTop:18}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{fontSize:'.68rem',fontWeight:600,color:'var(--text-muted)',letterSpacing:'.06em'}}>CUADRILLA ADICIONAL</div>
            <div style={{fontSize:'.68rem',color:'var(--text-muted)',opacity:.7,marginTop:2}}>Si vienes con más personas, registra su seguridad social.</div>
          </div>
          {!draftOpen&&(
            <button type="button" onClick={()=>setDraftOpen(true)}
              style={{padding:'6px 14px',fontSize:'.74rem',fontWeight:600,
                background:'rgba(86,104,184,.12)',border:'1px solid rgba(86,104,184,.3)',
                borderRadius:8,color:'#7080CC',cursor:'pointer',whiteSpace:'nowrap'}}>
              + Agregar persona
            </button>
          )}
        </div>
        {cuadrilla.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
            {cuadrilla.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'10px 14px',background:'rgba(255,255,255,.03)',
                border:'1px solid rgba(255,255,255,.08)',borderRadius:8}}>
                <div>
                  <div style={{fontSize:'.82rem',color:'var(--text-primary)',fontWeight:600}}>{p.nombre_persona}</div>
                  <div style={{fontSize:'.7rem',color:'var(--text-muted)',marginTop:2}}>
                    CC {p.cedula_persona} · EPS: {eps.find(e=>e.id===Number(p.eps_id))?.nombre??'—'} · ARL: {arl.find(a=>a.id===Number(p.arl_id))?.nombre??'—'}
                    {p.pila_archivo&&' · PILA ✓'}
                  </div>
                </div>
                <button type="button" onClick={()=>setCuadrilla(prev=>prev.filter((_,j)=>j!==i))}
                  style={{background:'none',border:'none',cursor:'pointer',color:'var(--danger-400)',padding:'4px 8px'}}>✕</button>
              </div>
            ))}
          </div>
        )}
        {draftOpen&&(
          <div style={{padding:14,background:'rgba(86,104,184,.04)',border:'1px solid rgba(86,104,184,.2)',borderRadius:10}}>
            <div style={{fontSize:'.68rem',color:'#7080CC',fontWeight:600,letterSpacing:'.06em',marginBottom:10}}>NUEVA PERSONA</div>
            <div style={grid2}>
              <div>
                <label style={lbl}>NOMBRE COMPLETO{reqStar}</label>
                <input type="text" value={draft.nombre_persona??''} style={inp} placeholder="Nombres y apellidos"
                  onChange={e=>setDraft((d:any)=>({...d,nombre_persona:e.target.value}))}/>
              </div>
              <div>
                <label style={lbl}>CÉDULA{reqStar}</label>
                <input type="text" value={draft.cedula_persona??''} style={inp}
                  onChange={e=>setDraft((d:any)=>({...d,cedula_persona:e.target.value}))}/>
              </div>
            </div>
            <div style={grid2}>
              <div><label style={lbl}>EPS</label><select value={draft.eps_id??''} style={sel} onChange={e=>setDraft((d:any)=>({...d,eps_id:e.target.value?Number(e.target.value):undefined}))}>
                <option value="">—</option>{eps.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select></div>
              <div><label style={lbl}>VIGENCIA EPS</label><input type="date" value={draft.eps_vigencia??''} style={inp} onChange={e=>setDraft((d:any)=>({...d,eps_vigencia:e.target.value||undefined}))}/></div>
              <div><label style={lbl}>ARL</label><select value={draft.arl_id??''} style={sel} onChange={e=>setDraft((d:any)=>({...d,arl_id:e.target.value?Number(e.target.value):undefined}))}>
                <option value="">—</option>{arl.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select></div>
              <div><label style={lbl}>VIGENCIA ARL</label><input type="date" value={draft.arl_vigencia??''} style={inp} onChange={e=>setDraft((d:any)=>({...d,arl_vigencia:e.target.value||undefined}))}/></div>
            </div>
            <div style={{marginBottom:12}}>
              <PdfUploadZone label="PDF planilla PILA" value={draft.pila_archivo}
                uploading={uploadingCampo==='seg_social.cuadrilla_draft_pila_archivo'}
                progress={uploadProgress['seg_social.cuadrilla_draft_pila_archivo']}
                onSelect={f=>void onUpload('seg_social','cuadrilla_draft_pila_archivo',f).then(p=>setDraft((d:any)=>({...d,pila_archivo:p})))}/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button type="button" onClick={()=>{setDraftOpen(false);setDraft({})}}
                style={{padding:'7px 16px',fontSize:'.78rem',background:'none',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'var(--text-muted)',cursor:'pointer'}}>
                Cancelar
              </button>
              <button type="button" onClick={addP} disabled={!draft.nombre_persona?.trim()||!draft.cedula_persona?.trim()}
                style={{padding:'7px 16px',fontSize:'.78rem',fontWeight:600,border:'none',borderRadius:8,color:'#fff',cursor:'pointer',
                  background:(!draft.nombre_persona?.trim()||!draft.cedula_persona?.trim())?'rgba(86,104,184,.3)':'rgba(86,104,184,.8)'}}>
                Agregar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Paso 5 (AR) — Certificaciones ─────────────────────────────────────
function Paso5Cert({ form, setForm, onUpload, uploadingCampo, uploadProgress }:{
  form:any; setForm:(f:any)=>void
  onUpload:(m:UploadModulo,c:string,f:File)=>Promise<string>
  uploadingCampo:string|null; uploadProgress:Record<string,number>
}) {
  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Certificaciones</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>Para contratistas de alto riesgo se exige la ART diligenciada.</p>
      <div style={{marginBottom:18,padding:16,background:'rgba(69,116,196,.05)',border:'1px solid rgba(69,116,196,.2)',borderRadius:12}}>
        <label style={{...lbl,marginBottom:8}}>DESCRIPCIÓN DE TAREA — ART{reqStar}</label>
        <textarea value={form.art_descripcion_tarea??''} rows={3}
          style={{...inp,resize:'vertical' as any,lineHeight:1.5}}
          placeholder="Ej: Instalación de luminarias en techo de bodega…"
          onChange={e=>setForm((f:any)=>({...f,art_descripcion_tarea:e.target.value}))}/>
        <div style={{marginTop:10}}>
          <PdfUploadZone label="PDF ART diligenciada" required value={form.art_archivo}
            uploading={uploadingCampo==='certificaciones.art_archivo'}
            progress={uploadProgress['certificaciones.art_archivo']}
            onSelect={f=>void onUpload('certificaciones','art_archivo',f).then(p=>setForm((x:any)=>({...x,art_archivo:p})))}/>
        </div>
      </div>
      <div style={{padding:16,background:'rgba(86,104,184,.04)',border:'1px solid rgba(86,104,184,.15)',borderRadius:12}}>
        <div style={{fontSize:'.68rem',color:'#7080CC',fontWeight:700,letterSpacing:'.06em',marginBottom:12}}>
          PERMISO DE TRABAJO <span style={{fontSize:'.62rem',fontWeight:400,color:'var(--text-muted)',marginLeft:6}}>OPCIONAL</span>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>TIPO DE PERMISO</label>
            <select value={form.permiso_tipo??''} style={sel} onChange={e=>setForm((f:any)=>({...f,permiso_tipo:e.target.value||undefined}))}>
              <option value="">Seleccionar…</option>
              {['ALTURAS','CONFINADOS','CALIENTE','ELECTRICO','GENERAL'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>FECHA PERMISO</label>
            <input type="date" value={form.permiso_fecha??''} style={inp} onChange={e=>setForm((f:any)=>({...f,permiso_fecha:e.target.value||undefined}))}/>
          </div>
        </div>
        <PdfUploadZone label="PDF permiso de trabajo" value={form.permiso_archivo}
          uploading={uploadingCampo==='certificaciones.permiso_archivo'}
          progress={uploadProgress['certificaciones.permiso_archivo']}
          onSelect={f=>void onUpload('certificaciones','permiso_archivo',f).then(p=>setForm((x:any)=>({...x,permiso_archivo:p})))}/>
      </div>
    </div>
  )
}

// ── Paso 6 (AR) — Examen médico ───────────────────────────────────────
function Paso6Medico({ form, setForm, onUpload, uploadingCampo, uploadProgress }:{
  form:any; setForm:(f:any)=>void
  onUpload:(m:UploadModulo,c:string,f:File)=>Promise<string>
  uploadingCampo:string|null; uploadProgress:Record<string,number>
}) {
  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Examen médico ocupacional</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>Aplica para contratistas de alto riesgo.</p>
      <div style={grid2}>
        <div>
          <label style={lbl}>FECHA EXAMEN</label>
          <input type="date" value={form.fecha_examen??''} style={inp} onChange={e=>setForm((f:any)=>({...f,fecha_examen:e.target.value||undefined}))}/>
          <VigenciaBadge fecha={form.fecha_examen}/>
        </div>
        <div>
          <label style={lbl}>CONCEPTO MÉDICO{reqStar}</label>
          <select value={form.concepto??''} style={sel} onChange={e=>setForm((f:any)=>({...f,concepto:e.target.value||undefined}))}>
            <option value="">Seleccionar…</option>
            {['APTO','APTO_CON_RESTRICCION','NO_APTO','PENDIENTE'].map(v=><option key={v} value={v}>{v.split('_').join(' ')}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lbl}>DESCRIPCIÓN DE RESTRICCIÓN <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
        <textarea value={form.descripcion_restriccion??''} rows={3}
          style={{...inp,resize:'vertical' as any,lineHeight:1.5}}
          placeholder="Si aplica, describe restricciones médicas relevantes…"
          onChange={e=>setForm((f:any)=>({...f,descripcion_restriccion:e.target.value}))}/>
      </div>
      <PdfUploadZone label="PDF examen médico ocupacional" required value={form.archivo}
        uploading={uploadingCampo==='examen.archivo'} progress={uploadProgress['examen.archivo']}
        onSelect={f=>void onUpload('examen','archivo',f).then(p=>setForm((x:any)=>({...x,archivo:p})))}/>
    </div>
  )
}

// ── Paso — Contacto de emergencia (NORMAL paso 4) ─────────────────────
function PasoEmergenciaContacto({ form, setForm }:{ form:any; setForm:(f:any)=>void }) {
  return (
    <div>
      <div style={{width:52,height:52,borderRadius:'50%',margin:'0 0 16px',
        background:'rgba(230,146,46,.1)',border:'2px solid rgba(230,146,46,.3)',
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Phone size={22} color="#E6922E"/>
      </div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Contacto de emergencia</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>¿A quién debemos llamar en caso de emergencia?</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <label style={lbl}>NOMBRE COMPLETO DEL CONTACTO{reqStar}</label>
          <input type="text" value={form.nombre_completo??''} style={inp} placeholder="Nombre Apellido"
            onChange={e=>setForm((f:any)=>({...f,nombre_completo:e.target.value}))}/>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>RELACIÓN{reqStar}</label>
            <select value={form.relacion??''} style={sel} onChange={e=>setForm((f:any)=>({...f,relacion:e.target.value}))}>
              <option value="">Seleccionar…</option>
              {['FAMILIAR','CONYUGE','COLEGA','OTRO'].map(r=><option key={r} value={r}>{r.charAt(0)+r.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          {form.relacion==='OTRO'&&(
            <div>
              <label style={lbl}>¿CUÁL RELACIÓN?{reqStar}</label>
              <input type="text" value={form.relacion_otro??''} style={inp} placeholder="Ej: Vecino, amigo…"
                onChange={e=>setForm((f:any)=>({...f,relacion_otro:e.target.value}))}/>
            </div>
          )}
          <div>
            <label style={lbl}>TELÉFONO CELULAR{reqStar}</label>
            <input type="text" value={form.telefono_celular??''} style={inp} placeholder="3001234567"
              onChange={e=>setForm((f:any)=>({...f,telefono_celular:e.target.value}))}/>
          </div>
        </div>
        <div>
          <label style={lbl}>TELÉFONO FIJO <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
          <input type="text" value={form.telefono_fijo??''} style={inp} placeholder="6011234567"
            onChange={e=>setForm((f:any)=>({...f,telefono_fijo:e.target.value}))}/>
        </div>
      </div>
    </div>
  )
}

// ── Paso — Información médica (NORMAL paso 5) ─────────────────────────
function PasoEmergenciaMedico({ form, setForm }:{ form:any; setForm:(f:any)=>void }) {
  return (
    <div>
      <div style={{width:52,height:52,borderRadius:'50%',margin:'0 0 16px',
        background:'rgba(192,80,80,.1)',border:'2px solid rgba(192,80,80,.3)',
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Heart size={22} color="#C05050"/>
      </div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Información médica</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>
        Esta información se usa solo en caso de emergencia. Solo la EPS es obligatoria.
      </p>
      <div style={{marginBottom:14}}>
        <label style={lbl}>RH SANGUÍNEO <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
        <BloodPicker value={form.rh_sanguineo} onChange={v=>setForm((f:any)=>({...f,rh_sanguineo:v}))}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lbl}>ALERGIAS CONOCIDAS <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
        <input type="text" value={form.alergias??''} style={inp} placeholder="Ej: Penicilina, látex…"
          onChange={e=>setForm((f:any)=>({...f,alergias:e.target.value}))}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={lbl}>CONDICIÓN MÉDICA RELEVANTE <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
        <input type="text" value={form.condicion_medica??''} style={inp} placeholder="Ej: Diabetes, hipertensión…"
          onChange={e=>setForm((f:any)=>({...f,condicion_medica:e.target.value}))}/>
      </div>
      <div>
        <label style={lbl}>EPS DEL CONTRATISTA{reqStar}</label>
        <input type="text" value={form.eps_contratista??''} style={inp} placeholder="Ej: Compensar, Sanitas…"
          onChange={e=>setForm((f:any)=>({...f,eps_contratista:e.target.value}))}/>
        <div style={{marginTop:4,fontSize:'.68rem',color:'var(--text-muted)'}}>
          Requerida para facilitar la atención médica en caso de emergencia.
        </div>
      </div>
    </div>
  )
}

// ── Paso — Emergencia combinado (ALTO RIESGO) ─────────────────────────
function PasoEmergenciaAR({ form, setForm }:{ form:any; setForm:(f:any)=>void }) {
  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Contacto de emergencia</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:20}}>En caso de emergencia, ¿a quién debemos contactar?</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <label style={lbl}>NOMBRE COMPLETO{reqStar}</label>
          <input type="text" value={form.nombre_completo??''} style={inp} placeholder="Nombre Apellido"
            onChange={e=>setForm((f:any)=>({...f,nombre_completo:e.target.value}))}/>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>RELACIÓN{reqStar}</label>
            <select value={form.relacion??''} style={sel} onChange={e=>setForm((f:any)=>({...f,relacion:e.target.value}))}>
              <option value="">Seleccionar…</option>
              {['FAMILIAR','CONYUGE','COLEGA','OTRO'].map(r=><option key={r} value={r}>{r.charAt(0)+r.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          {form.relacion==='OTRO'&&(
            <div>
              <label style={lbl}>¿CUÁL RELACIÓN?</label>
              <input type="text" value={form.relacion_otro??''} style={inp}
                onChange={e=>setForm((f:any)=>({...f,relacion_otro:e.target.value}))}/>
            </div>
          )}
          <div>
            <label style={lbl}>TELÉFONO CELULAR{reqStar}</label>
            <input type="text" value={form.telefono_celular??''} style={inp} placeholder="3001234567"
              onChange={e=>setForm((f:any)=>({...f,telefono_celular:e.target.value}))}/>
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>TELÉFONO FIJO <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
            <input type="text" value={form.telefono_fijo??''} style={inp}
              onChange={e=>setForm((f:any)=>({...f,telefono_fijo:e.target.value}))}/>
          </div>
        </div>
        <div>
          <label style={lbl}>RH SANGUÍNEO <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
          <BloodPicker value={form.rh_sanguineo} onChange={v=>setForm((f:any)=>({...f,rh_sanguineo:v}))}/>
        </div>
        <div>
          <label style={lbl}>ALERGIAS CONOCIDAS <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
          <input type="text" value={form.alergias??''} style={inp} placeholder="Ej: Penicilina, látex…"
            onChange={e=>setForm((f:any)=>({...f,alergias:e.target.value}))}/>
        </div>
        <div>
          <label style={lbl}>CONDICIÓN MÉDICA RELEVANTE <span style={{color:'var(--text-muted)',fontSize:'.65rem',fontWeight:400}}>(opcional)</span></label>
          <input type="text" value={form.condicion_medica??''} style={inp}
            onChange={e=>setForm((f:any)=>({...f,condicion_medica:e.target.value}))}/>
        </div>
        <div>
          <label style={lbl}>EPS (para emergencias){reqStar}</label>
          <input type="text" value={form.eps_contratista??''} style={inp} placeholder="Ej: Compensar, Sanitas…"
            onChange={e=>setForm((f:any)=>({...f,eps_contratista:e.target.value}))}/>
        </div>
      </div>
    </div>
  )
}

// ── Paso Normas ───────────────────────────────────────────────────────
function PasoNormas({ form, setForm, normas }:{ form:any; setForm:(f:any)=>void; normas:any[] }) {
  const [scrolled, setScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const normasDefault = normas.length > 0 ? normas : [
    {id:1,numero:1,titulo:'Uso de EPP',contenido:'Es obligatorio el uso de los Elementos de Protección Personal asignados durante toda la jornada.'},
    {id:2,numero:2,titulo:'Reporte de incidentes',contenido:'Todo incidente o casi-accidente debe ser reportado inmediatamente al responsable HSE.'},
    {id:3,numero:3,titulo:'Prohibición de alcohol',contenido:'Está prohibido ingresar o trabajar bajo efectos de alcohol o sustancias psicoactivas.'},
    {id:4,numero:4,titulo:'Señalización',contenido:'Respetar toda la señalización de seguridad y las zonas restringidas.'},
    {id:5,numero:5,titulo:'Orden y aseo',contenido:'Mantener el área de trabajo ordenada y limpia durante y al finalizar la jornada.'},
  ]

  useEffect(()=>{
    const el = scrollRef.current
    if (el && el.scrollHeight <= el.clientHeight + 10) setScrolled(true)
  }, [normasDefault.length])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const pct = Math.min(100, Math.round((el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100))
    setScrollPct(pct)
    if (pct >= 95) setScrolled(true)
  }

  const canSign = scrolled
  return (
    <div>
      <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>Normas de seguridad</h2>
      <p style={{fontSize:'.8rem',color:'var(--text-muted)',marginBottom:12}}>Lee todas las normas antes de firmar digitalmente.</p>

      {/* Scroll progress */}
      <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,.07)',marginBottom:12,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,#4574C4,#28956C)',
          width:`${scrollPct}%`,transition:'width .15s'}}/>
      </div>

      <div ref={scrollRef} onScroll={onScroll}
        style={{maxHeight:260,overflowY:'auto',border:'1px solid rgba(255,255,255,.1)',
          borderRadius:12,padding:16,marginBottom:12,background:'rgba(255,255,255,.02)'}}>
        {normasDefault.map((n,i)=>(
          <div key={n.id} style={{marginBottom:i<normasDefault.length-1?16:0,
            paddingBottom:i<normasDefault.length-1?16:0,
            borderBottom:i<normasDefault.length-1?'1px solid rgba(255,255,255,.06)':'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontFamily:'var(--font-mono)',fontSize:'.65rem',color:'var(--primary-400)',fontWeight:700}}>
                {String(n.numero).padStart(2,'0')}
              </span>
              <span style={{fontSize:'.83rem',fontWeight:600,color:'var(--text-primary)'}}>{n.titulo}</span>
            </div>
            <p style={{fontSize:'.78rem',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>{n.contenido}</p>
          </div>
        ))}
      </div>

      {!scrolled && (
        <div style={{textAlign:'center',fontSize:'.72rem',color:'var(--primary-400)',marginBottom:10,
          animation:'pulse 2s infinite'}}>
          ↓ Desplázate al final para habilitar la firma
        </div>
      )}

      <div style={{padding:16,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)',
        borderRadius:12,display:'flex',flexDirection:'column',gap:12}}>
        <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:canSign?'pointer':'not-allowed',opacity:canSign?1:.5}}>
          <input type="checkbox" checked={form.acepto_normas??false} disabled={!canSign}
            style={{width:16,height:16,marginTop:1,cursor:canSign?'pointer':'not-allowed'}}
            onChange={e=>setForm((f:any)=>({...f,acepto_normas:e.target.checked}))}/>
          <span style={{fontSize:'.78rem',color:'var(--text-secondary)',lineHeight:1.5}}>
            He leído y acepto todas las normas de seguridad de Permoda S.A.S.
          </span>
        </label>
        <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:canSign?'pointer':'not-allowed',opacity:canSign?1:.5}}>
          <input type="checkbox" checked={form.acepto_datos??false} disabled={!canSign}
            style={{width:16,height:16,marginTop:1,cursor:canSign?'pointer':'not-allowed'}}
            onChange={e=>setForm((f:any)=>({...f,acepto_datos:e.target.checked}))}/>
          <span style={{fontSize:'.78rem',color:'var(--text-secondary)',lineHeight:1.5}}>
            Autorizo el tratamiento de mis datos personales según la política de privacidad.
          </span>
        </label>
        <div style={{opacity:canSign?1:.4,transition:'opacity .3s'}}>
          <label style={lbl}>FIRMA DIGITAL — ESCRIBE TU NOMBRE COMPLETO</label>
          <input type="text" value={form.firma_digital??''} disabled={!canSign}
            placeholder="Nombre Apellido"
            style={{...inp,fontStyle:'italic',fontSize:'1rem',cursor:canSign?'text':'not-allowed'}}
            onChange={e=>setForm((f:any)=>({...f,firma_digital:e.target.value}))}/>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────
export default function AutogestionView() {
  const { token } = useParams<{ token: string }>()
  const dirRef = useRef<'f'|'b'>('f')
  const [animKey, setAnimKey] = useState(0)

  const [tokenData,  setTokenData]  = useState<AutogestionTokenResponse|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tokenError, setTokenError] = useState<string|null>(null)
  const [error,      setError]      = useState<string|null>(null)
  const [paso,       setPaso]       = useState(1)
  const [saving,     setSaving]     = useState(false)
  const [done,       setDone]       = useState(false)
  const [normas,     setNormas]     = useState<any[]>([])
  const [epsCat,     setEpsCat]     = useState<any[]>([])
  const [arlCat,     setArlCat]     = useState<any[]>([])
  const [afpCat,     setAfpCat]     = useState<any[]>([])

  const [formDatos,     setFormDatos]     = useState<any>({})
  const [formClasif,    setFormClasif]    = useState<any>({})
  const [formSegSocial, setFormSegSocial] = useState<any>({es_titular:true})
  const [cuadrilla,     setCuadrilla]     = useState<any[]>([])
  const [formCert,      setFormCert]      = useState<any>({})
  const [formExamen,    setFormExamen]    = useState<any>({})
  const [formEmerg,     setFormEmerg]     = useState<any>({})
  const [formNormas,    setFormNormas]    = useState<any>({})
  const [uploadingCampo,   setUploadingCampo]   = useState<string|null>(null)
  const [uploadProgress,   setUploadProgress]   = useState<Record<string,number>>({})

  useEffect(()=>{
    if(!token) return
    const load = async ()=>{
      try {
        const d = await hseService.validarToken(token)
        setTokenData(d)
        setFormDatos({
          tipo_documento:d.tipo_documento, numero_documento:d.numero_documento,
          nombres:d.nombres, apellidos:d.apellidos, email:d.email, telefono:d.telefono,
          tipologia_hse:d.tipo_contratista==='ALTO_RIESGO'?'Contratista de Alto Riesgo':'Contratista / Visita sin Riesgo',
        })
        if(d.clasificacion) setFormClasif({...d.clasificacion})
        if(d.seguridad_social?.length) setFormSegSocial(d.seguridad_social[0])
        if(d.certificaciones) setFormCert(d.certificaciones)
        if(d.examen_medico) setFormExamen(d.examen_medico)
        if(d.contacto_emergencia) setFormEmerg(d.contacto_emergencia)
        const [n,eps,arl,afp]=await Promise.all([
          hseService.getNormas(d.sede_id),
          hseService.getEPS(), hseService.getARL(), hseService.getAFP(),
        ])
        setNormas(n); setEpsCat(eps); setArlCat(arl); setAfpCat(afp)
      } catch(e) { setTokenError(getErrorMessage(e)) }
      finally { setLoading(false) }
    }
    load()
  },[token])

  useEffect(()=>{
    const ext = formDatos.tipo_documento==='CE'||formDatos.tipo_documento==='PASAPORTE'
    if(ext) setFormClasif((f:any)=>({...f,personal_extranjero:true}))
  },[formDatos.tipo_documento])

  const esAR = tokenData?.tipo_contratista==='ALTO_RIESGO'
  const pasos = esAR ? PASOS_AR : PASOS_NORMAL
  const total = pasos.length
  const key = pasos[paso-1] as PasoKey|undefined

  const handleUpload = async (modulo:UploadModulo, campo:string, file:File): Promise<string>=>{
    if(!token) throw new Error('Token inválido.')
    if(!file.name.toLowerCase().endsWith('.pdf')&&!file.type.includes('pdf'))
      throw new Error('Solo se permiten archivos PDF.')
    const k=`${modulo}.${campo}`
    if(uploadingCampo&&uploadingCampo!==k) throw new Error('Hay otra carga en progreso.')
    setUploadingCampo(k); setUploadProgress(p=>({...p,[k]:0})); setError(null)
    try {
      const r = await hseService.uploadAutogestionArchivo(token,{modulo,campo,file},(pct)=>setUploadProgress(p=>({...p,[k]:pct})))
      setUploadProgress(p=>({...p,[k]:100})); return r.path
    } catch(e) { setError(getErrorMessage(e)); throw e }
    finally { setUploadingCampo(null) }
  }

  const validar = (): string|null => {
    switch(key) {
      case 'sede': return null
      case 'datos': {
        if(!formDatos.tipo_documento?.trim()) return 'Selecciona un tipo de documento.'
        if(!formDatos.numero_documento?.trim()) return 'Ingresa tu número de documento.'
        if(!formDatos.email?.includes('@')) return 'El correo electrónico es inválido.'
        if(!formDatos.telefono?.trim()) return 'Ingresa tu número de teléfono.'
        if(!formDatos.tratamiento_datos) return 'Debes aceptar el tratamiento de tus datos personales.'
        const ext = formDatos.tipo_documento==='CE'||formDatos.tipo_documento==='PASAPORTE'
        if(ext){
          if(!formClasif.extran_aseguradora?.trim()) return 'Ingresa la aseguradora de tu póliza.'
          if(!formClasif.extran_poliza_venc) return 'Ingresa la fecha de vencimiento de la póliza.'
          if(!formClasif.extran_poliza_archivo) return 'Adjunta el PDF de la póliza de seguro.'
          if(estadoVig(formClasif.extran_poliza_venc)==='vencido') return 'La póliza de seguro debe estar vigente.'
        }
        return null
      }
      case 'actividad': {
        const tieneSelec = Object.values(formClasif).some(v=>v===true)
        if(!tieneSelec) return 'Selecciona al menos una actividad.'
        if(formClasif.trabajo_alturas){
          if(!formClasif.alturas_nivel) return 'Selecciona el nivel del certificado de alturas.'
          if(!formClasif.alturas_cert_fecha_venc) return 'Ingresa la fecha de vencimiento del certificado de alturas.'
          if(!formClasif.alturas_cert_archivo) return 'Adjunta el PDF del certificado de alturas.'
          if(estadoVig(formClasif.alturas_cert_fecha_venc)==='vencido') return 'El certificado de alturas debe estar vigente.'
        }
        if(formClasif.espacios_confinados){
          if(!formClasif.confinados_rol) return 'Selecciona el rol para espacios confinados.'
          if(!formClasif.confinados_cert_fecha) return 'Ingresa la fecha del certificado de confinados.'
          if(!formClasif.confinados_cert_archivo) return 'Adjunta el PDF del certificado de confinados.'
          if(estadoVig(formClasif.confinados_cert_fecha)==='vencido') return 'El certificado de confinados debe estar vigente.'
        }
        if(formClasif.trabajo_electrico){
          if(!formClasif.electrico_matricula_contec) return 'Selecciona la matrícula CONTEC.'
          if(!formClasif.electrico_num_matricula?.trim()) return 'Ingresa el número de matrícula CONTEC.'
          if(!formClasif.electrico_matricula_venc) return 'Ingresa la fecha de vencimiento de la matrícula.'
          if(!formClasif.electrico_matricula_archivo) return 'Adjunta el PDF de la matrícula CONTEC.'
          if(estadoVig(formClasif.electrico_matricula_venc)==='vencido') return 'La matrícula CONTEC debe estar vigente.'
        }
        if(formClasif.trabajo_caliente){
          if(!formClasif.caliente_extintor_fecha) return 'Ingresa la fecha del extintor.'
          if(!formClasif.caliente_extintor_archivo) return 'Adjunta el PDF del extintor.'
          if(!formClasif.caliente_permiso_fecha) return 'Ingresa la fecha del permiso.'
          if(!formClasif.caliente_permiso_archivo) return 'Adjunta el PDF del permiso de trabajo en caliente.'
          if(estadoVig(formClasif.caliente_extintor_fecha)==='vencido') return 'El extintor debe estar vigente.'
          if(estadoVig(formClasif.caliente_permiso_fecha)==='vencido') return 'El permiso debe estar vigente.'
        }
        if(formClasif.izaje_maquinaria){
          if(!formClasif.izaje_tipo_equipo?.trim()) return 'Indica el tipo de equipo para izaje.'
          if(!formClasif.izaje_inspeccion_archivo) return 'Adjunta el PDF de inspección pre-operacional.'
          if(!formClasif.izaje_doc_legal_archivo) return 'Adjunta el PDF de documentos legales del equipo.'
          if(!formClasif.izaje_licencia_archivo) return 'Adjunta el PDF de licencia del operador.'
        }
        if(formClasif.personal_extranjero){
          if(!formClasif.extran_aseguradora?.trim()) return 'Ingresa la aseguradora del personal extranjero.'
          if(!formClasif.extran_num_poliza?.trim()) return 'Ingresa el número de póliza.'
          if(!formClasif.extran_poliza_venc) return 'Ingresa la fecha de vencimiento de la póliza.'
          if(!formClasif.extran_poliza_archivo) return 'Adjunta el PDF de la póliza.'
          if(estadoVig(formClasif.extran_poliza_venc)==='vencido') return 'La póliza debe estar vigente.'
        }
        if(formClasif.genera_residuos){
          if(!formClasif.residuos_tipo?.trim()) return 'Describe el tipo de residuos.'
          if(!formClasif.residuos_plan_archivo) return 'Adjunta el PDF del plan de manejo de residuos.'
        }
        return null
      }
      case 'seg_social':
        if(!formSegSocial.eps_id) return 'Selecciona una EPS.'
        if(!formSegSocial.arl_id) return 'Selecciona una ARL.'
        if(!formSegSocial.afp_id) return 'Selecciona una AFP.'
        if(!formSegSocial.eps_vigencia) return 'Ingresa la vigencia de EPS.'
        if(!formSegSocial.arl_vigencia) return 'Ingresa la vigencia de ARL.'
        if(!formSegSocial.afp_vigencia) return 'Ingresa la vigencia de AFP.'
        if(!formSegSocial.pila_tipo) return 'Selecciona el tipo PILA.'
        if(!formSegSocial.pila_estado) return 'Selecciona el estado PILA.'
        if(!formSegSocial.pila_archivo) return 'Adjunta el PDF de la planilla PILA.'
        return null
      case 'certificaciones':
        if(!formCert.art_descripcion_tarea?.trim()) return 'Ingresa la descripción de tarea (ART).'
        if(!formCert.art_archivo) return 'Adjunta el PDF de la ART diligenciada.'
        return null
      case 'medico':
        if(!formExamen.fecha_examen) return 'Ingresa la fecha del examen médico.'
        if(!formExamen.concepto) return 'Selecciona el concepto médico.'
        if(!formExamen.archivo) return 'Adjunta el PDF del examen médico.'
        if(formExamen.concepto==='APTO_CON_RESTRICCION'&&!formExamen.descripcion_restriccion?.trim())
          return 'Describe la restricción cuando el concepto es APTO CON RESTRICCIÓN.'
        return null
      case 'emergencia_contacto':
        if(!formEmerg.nombre_completo?.trim()) return 'Ingresa el nombre del contacto de emergencia.'
        if(!formEmerg.relacion) return 'Selecciona la relación con el contacto.'
        if(formEmerg.relacion==='OTRO'&&!formEmerg.relacion_otro?.trim()) return 'Indica cuál es la relación.'
        if(!formEmerg.telefono_celular?.trim()) return 'Ingresa el teléfono del contacto.'
        return null
      case 'emergencia_medico':
        if(!formEmerg.eps_contratista?.trim()) return 'Ingresa la EPS del contratista para emergencias.'
        return null
      case 'emergencia':
        if(!formEmerg.nombre_completo?.trim()) return 'Ingresa el nombre del contacto de emergencia.'
        if(!formEmerg.relacion) return 'Selecciona la relación con el contacto.'
        if(formEmerg.relacion==='OTRO'&&!formEmerg.relacion_otro?.trim()) return 'Indica cuál es la relación.'
        if(!formEmerg.telefono_celular?.trim()) return 'Ingresa el teléfono del contacto.'
        if(!formEmerg.eps_contratista?.trim()) return 'Ingresa la EPS del contratista.'
        return null
      case 'normas':
        if(!formNormas.acepto_normas) return 'Debes aceptar las normas de seguridad.'
        if(!formNormas.acepto_datos) return 'Debes aceptar el tratamiento de datos personales.'
        if(!formNormas.firma_digital?.trim()||formNormas.firma_digital.trim().length<3)
          return 'Escribe tu nombre completo como firma digital (mínimo 3 caracteres).'
        return null
      default: return null
    }
  }

  const avanzar = (dir: 'f'|'b') => {
    dirRef.current = dir
    setAnimKey(k=>k+1)
    setPaso(p=>dir==='f'?p+1:p-1)
    setError(null)
  }

  const handleSiguiente = async ()=>{
    if(!token||!tokenData) return
    if(uploadingCampo){ setError('Espera a que termine la carga del archivo.'); return }
    const err = validar()
    if(err){ setError(err); return }
    setSaving(true); setError(null)
    try {
      switch(key){
        case 'normas':
          await hseService.aceptarNormas(token,{acepto_normas:formNormas.acepto_normas,acepto_datos:formNormas.acepto_datos,firma_digital:formNormas.firma_digital})
          await hseService.finalizarAutogestion(token)
          setDone(true); return
        case 'datos':
          await hseService.guardarDatosPersonales(token,formDatos); break
        case 'actividad': {
          const c:Record<string,any>={...formClasif}
          if(!esAR){ CLASIF_AR_KEYS.forEach(k=>{ c[k]=false }); if(!CLASIF_BAJO_KEYS.some(k=>Boolean(c[k]))) c.visita_sin_riesgo=true }
          await hseService.guardarClasificacion(token,c); break
        }
        case 'seg_social':
          await hseService.guardarSeguridadSocial(token,{personas:[
            {...formSegSocial,es_titular:true,nombre_persona:`${formDatos.nombres??''} ${formDatos.apellidos??''}`.trim()||undefined,cedula_persona:formDatos.numero_documento||undefined},
            ...cuadrilla.map((p:any)=>({...p,es_titular:false})),
          ]}); break
        case 'certificaciones':
          await hseService.guardarCertificaciones(token,formCert); break
        case 'medico':
          await hseService.guardarExamenMedico(token,formExamen); break
        case 'emergencia_contacto':
          break // no API call yet, just advance
        case 'emergencia_medico':
          await hseService.guardarContactoEmergencia(token,formEmerg); break
        case 'emergencia':
          await hseService.guardarContactoEmergencia(token,formEmerg); break
        default: break
      }
      if(paso<total) avanzar('f')
    } catch(e) { setError(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  const renderPaso = ()=>{
    if(!tokenData) return null
    const tipologia = esAR?'Contratista de Alto Riesgo':'Contratista / Visita sin Riesgo'
    switch(key){
      case 'sede': return <Paso1Sede data={tokenData}/>
      case 'datos': return <Paso2Datos form={formDatos} setForm={setFormDatos} empresa={tokenData.empresa_proveedor} tipologia={tipologia}
        formClasif={formClasif} setFormClasif={setFormClasif} onUpload={handleUpload} uploadingCampo={uploadingCampo} uploadProgress={uploadProgress}/>
      case 'actividad': return <Paso3Clasif form={formClasif} setForm={setFormClasif} esAR={esAR}
        onUpload={handleUpload} uploadingCampo={uploadingCampo} uploadProgress={uploadProgress}/>
      case 'seg_social': return <Paso4SegSocial form={formSegSocial} setForm={setFormSegSocial}
        cuadrilla={cuadrilla} setCuadrilla={setCuadrilla} eps={epsCat} arl={arlCat} afp={afpCat}
        onUpload={handleUpload} uploadingCampo={uploadingCampo} uploadProgress={uploadProgress}/>
      case 'certificaciones': return <Paso5Cert form={formCert} setForm={setFormCert}
        onUpload={handleUpload} uploadingCampo={uploadingCampo} uploadProgress={uploadProgress}/>
      case 'medico': return <Paso6Medico form={formExamen} setForm={setFormExamen}
        onUpload={handleUpload} uploadingCampo={uploadingCampo} uploadProgress={uploadProgress}/>
      case 'emergencia_contacto': return <PasoEmergenciaContacto form={formEmerg} setForm={setFormEmerg}/>
      case 'emergencia_medico': return <PasoEmergenciaMedico form={formEmerg} setForm={setFormEmerg}/>
      case 'emergencia': return <PasoEmergenciaAR form={formEmerg} setForm={setFormEmerg}/>
      case 'normas': return <PasoNormas form={formNormas} setForm={setFormNormas} normas={normas}/>
      default: return null
    }
  }

  const accentColor = key ? PASO_META[key].accent : '#4574C4'
  const slideClass = dirRef.current==='f' ? 'ag-slide-right' : 'ag-slide-left'

  // ── Loading ──────────────────────────────────────────────────────
  if(loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg-base)',flexDirection:'column',gap:16}}>
      <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(69,116,196,.12)',
        border:'2px solid rgba(69,116,196,.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Loader size={24} color="#6A95E0" style={{animation:'spin 1s linear infinite'}}/>
      </div>
      <p style={{color:'var(--text-muted)',fontSize:'.875rem'}}>Validando tu enlace de autogestión…</p>
    </div>
  )

  // ── Token error ──────────────────────────────────────────────────
  if(tokenError||!tokenData) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg-base)',padding:24}}>
      <div style={{maxWidth:400,textAlign:'center',padding:'40px 32px',
        background:'var(--bg-surface)',borderRadius:'var(--radius-xl)',
        border:'1px solid var(--border-subtle)'}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(192,80,80,.1)',
          border:'2px solid rgba(192,80,80,.3)',display:'flex',alignItems:'center',
          justifyContent:'center',margin:'0 auto 20px'}}>
          <AlertTriangle size={28} color="var(--danger-400)"/>
        </div>
        <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',marginBottom:8}}>
          No fue posible abrir el formulario
        </h2>
        <p style={{fontSize:'.83rem',color:'var(--text-muted)',lineHeight:1.6}}>
          {tokenError??'Este enlace no es válido o ha expirado. Contacta al administrador HSE para que genere uno nuevo.'}
        </p>
      </div>
    </div>
  )

  // ── Completado ───────────────────────────────────────────────────
  if(done) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg-base)',padding:24}}>
      <div style={{maxWidth:440,width:'100%',textAlign:'center',padding:'48px 36px',
        background:'var(--bg-surface)',borderRadius:'var(--radius-xl)',
        border:'1px solid rgba(40,149,108,.25)',
        boxShadow:'0 0 40px rgba(40,149,108,.1)'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(40,149,108,.12)',
          border:'2px solid rgba(40,149,108,.35)',display:'flex',alignItems:'center',
          justifyContent:'center',margin:'0 auto 24px',
          boxShadow:'0 0 32px rgba(40,149,108,.25)'}}>
          <CheckCircle2 size={38} color="var(--success-400)"/>
        </div>
        <h2 style={{fontSize:'1.5rem',fontWeight:700,color:'var(--text-primary)',marginBottom:10}}>
          ¡Autogestión completada!
        </h2>
        <p style={{fontSize:'.875rem',color:'var(--text-muted)',lineHeight:1.7,marginBottom:24}}>
          Tu documentación fue enviada correctamente. El equipo HSE revisará tu información y recibirás confirmación de tu autorización.
        </p>
        <div style={{padding:'14px 18px',background:'rgba(40,149,108,.07)',
          border:'1px solid rgba(40,149,108,.2)',borderRadius:12,
          fontSize:'.8rem',color:'var(--success-400)',fontWeight:500}}>
          Puedes cerrar esta ventana con seguridad.
        </div>
      </div>
    </div>
  )

  // ── Wizard ───────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes ag-slide-right{from{transform:translateX(28px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes ag-slide-left{from{transform:translateX(-28px);opacity:0}to{transform:translateX(0);opacity:1}}
        .ag-slide-right{animation:ag-slide-right .3s cubic-bezier(.4,0,.2,1) both}
        .ag-slide-left{animation:ag-slide-left .3s cubic-bezier(.4,0,.2,1) both}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
      <div style={{minHeight:'100vh',background:'var(--bg-base)',padding:'clamp(12px,3vw,32px)',
        display:'flex',alignItems:'flex-start',justifyContent:'center'}}>
        <div style={{width:'100%',maxWidth:'min(600px,100%)'}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28,justifyContent:'center'}}>
            <div style={{width:36,height:36,background:'var(--gradient-brand)',borderRadius:8,
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 10px rgba(37,99,235,.35)'}}>
              <ShieldCheck size={20} color="white" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:'.85rem',fontWeight:700,
                color:'var(--text-primary)',letterSpacing:'.1em'}}>KOAJ ACCESS</div>
              <div style={{fontSize:'.62rem',color:'var(--text-muted)'}}>Portal de Autogestión HSE</div>
            </div>
          </div>

          {/* Step indicator */}
          <PasoIndicador paso={paso} pasos={pasos}/>

          {/* Progress bar */}
          <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,.06)',marginBottom:14,overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:99,
              background:`linear-gradient(90deg,${accentColor},${accentColor}aa)`,
              width:`${(paso/total)*100}%`,transition:'width .4s ease'}}/>
          </div>

          {/* Context chip */}
          <div style={{marginBottom:10,padding:'8px 12px',borderRadius:10,
            background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',
            display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',fontSize:'.72rem'}}>
            {tokenData.empresa_proveedor&&(
              <span style={{color:'var(--text-muted)'}}>
                Empresa: <strong style={{color:'#7080CC'}}>{tokenData.empresa_proveedor}</strong>
              </span>
            )}
            <span style={{color:'var(--text-muted)'}}>
              Tipo: <strong style={{color:esAR?'var(--danger-400)':'var(--success-400)'}}>{esAR?'Alto Riesgo':'Normal'}</strong>
            </span>
          </div>

          {/* Card */}
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-subtle)',
            borderRadius:'var(--radius-xl)',overflow:'hidden',marginBottom:16,
            boxShadow:'0 4px 24px rgba(0,0,0,.25)'}}>

            {/* Accent line */}
            <div style={{height:3,background:`linear-gradient(90deg,${accentColor},${accentColor}55,transparent)`,
              transition:'background .4s'}}/>

            {/* Animated content */}
            <div key={`${animKey}-${paso}`} className={animKey>0?slideClass:''} style={{padding:'clamp(16px,3vw,32px)'}}>
              {renderPaso()}
            </div>

            {/* Error */}
            {error&&(
              <div style={{margin:'0 clamp(16px,3vw,32px) 16px',padding:'10px 14px',
                background:'rgba(192,80,80,.08)',border:'1px solid rgba(192,80,80,.25)',
                borderRadius:8,fontSize:'.8rem',color:'#f87171',
                display:'flex',alignItems:'center',gap:8,justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <AlertTriangle size={14}/>
                  {error}
                </div>
                <button onClick={()=>setError(null)} style={{background:'none',border:'none',cursor:'pointer',
                  color:'#f87171',padding:2,display:'flex',alignItems:'center'}}>✕</button>
              </div>
            )}

            {/* Navigation */}
            <div style={{padding:'12px clamp(16px,3vw,32px)',borderTop:'1px solid var(--border-subtle)',
              display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
              <button onClick={()=>{ if(paso>1) avanzar('b') }} disabled={paso===1}
                style={{display:'flex',alignItems:'center',gap:6,padding:'10px 18px',
                  background:'transparent',border:'1px solid rgba(255,255,255,.12)',borderRadius:10,
                  color:paso===1?'var(--text-muted)':'var(--text-secondary)',fontSize:'.83rem',
                  cursor:paso===1?'not-allowed':'pointer',fontFamily:'var(--font-ui)',
                  opacity:paso===1?.35:1,transition:'all .2s'}}>
                <ChevronLeft size={15}/>
                Anterior
              </button>

              <span style={{fontFamily:'var(--font-mono)',fontSize:'.7rem',color:'var(--text-muted)'}}>
                {paso} / {total}
              </span>

              <button onClick={handleSiguiente} disabled={saving||Boolean(uploadingCampo)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'10px 22px',
                  background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                  border:'none',borderRadius:10,color:'white',fontSize:'.875rem',fontWeight:700,
                  cursor:saving||Boolean(uploadingCampo)?'not-allowed':'pointer',
                  fontFamily:'var(--font-ui)',opacity:saving||Boolean(uploadingCampo)?.6:1,
                  boxShadow:`0 2px 12px ${accentColor}44`,transition:'all .2s'}}>
                {saving
                  ? <><Loader size={14} style={{animation:'spin 1s linear infinite'}}/>Guardando…</>
                  : key==='normas'
                    ? <><CheckCircle2 size={15}/>Finalizar</>
                    : <>Continuar<svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></>
                }
              </button>
            </div>
          </div>

          <div style={{textAlign:'center',fontSize:'.65rem',color:'rgba(255,255,255,.15)',paddingBottom:16}}>
            KOAJ Access · Permoda S.A.S. · Portal seguro HSE
          </div>
        </div>
      </div>
    </>
  )
}
