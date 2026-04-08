import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, Shield, SlidersHorizontal } from 'lucide-react'

import { getErrorMessage } from '@/services/api'
import {
  type CatalogoItem,
  type CatalogoTipo,
  configService,
  type GlobalParams,
  type NormaConfig,
  type SedeConfig,
} from '@/services/config.service'

import { EstructuraPanel } from './components/EstructuraPanel'
import { CatalogosPanel } from './components/CatalogosPanel'
import { NormasPanel } from './components/NormasPanel'

type ConfigTab = 'sistema' | 'estructura' | 'reglas_hse'
type ReglasSubtab = 'catalogos' | 'normas'

const NORMAS_BASE_TEMPLATE: Array<{ numero: number; titulo: string; contenido: string }> = [
  { numero: 1, titulo: 'Uso de EPP', contenido: 'Es obligatorio el uso de los Elementos de Protección Personal.' },
  { numero: 2, titulo: 'Reporte de incidentes', contenido: 'Todo incidente debe ser reportado inmediatamente.' },
  { numero: 3, titulo: 'Prohibición de alcohol', contenido: 'Está estrictamente prohibido ingresar bajo efectos de alcohol.' },
  { numero: 4, titulo: 'Señalización', contenido: 'Respetar toda la señalización de seguridad.' },
  { numero: 5, titulo: 'Orden y aseo', contenido: 'Mantener el área de trabajo ordenada y limpia.' },
]

const TABS: Array<{
  id: ConfigTab
  label: string
  description: string
  icon: React.ComponentType<{ size?: number }>
}> = [
  { id: 'sistema', label: 'Sistema', description: 'Parámetros globales del entorno y seguridad.', icon: SlidersHorizontal },
  { id: 'estructura', label: 'Estructura', description: 'Submódulos: Sedes y Ubicaciones.', icon: Building2 },
  { id: 'reglas_hse', label: 'Reglas HSE', description: 'Submódulos: Catálogos y Normas.', icon: Shield },
]

export default function ConfigView() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('sistema')
  const [loading, setLoading] = useState(true)

  const [params, setParams] = useState<GlobalParams | null>(null)
  const [sedes, setSedes] = useState<SedeConfig[]>([])
  const [normas, setNormas] = useState<NormaConfig[]>([])
  const [eps, setEps] = useState<CatalogoItem[]>([])
  const [arl, setArl] = useState<CatalogoItem[]>([])
  const [afp, setAfp] = useState<CatalogoItem[]>([])

  const [estructuraSearch, setEstructuraSearch] = useState('')
  
  const [reglasSubtab, setReglasSubtab] = useState<ReglasSubtab>('catalogos')
  const [catalogoTipo, setCatalogoTipo] = useState<CatalogoTipo>('eps')
  const [catalogoSearch, setCatalogoSearch] = useState('')
  const [normasSearch, setNormasSearch] = useState('')

  const panel: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-raised)',
    color: 'var(--text-primary)',
    fontSize: '0.84rem',
    fontFamily: 'var(--font-ui)',
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, s, n, e, a, f] = await Promise.all([
        configService.getSistema(),
        configService.listSedes(),
        configService.listNormas(),
        configService.listCatalogo('eps'),
        configService.listCatalogo('arl'),
        configService.listCatalogo('afp'),
      ])
      setParams(p)
      setSedes(s)
      setNormas(n)
      setEps(e)
      setArl(a)
      setAfp(f)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const catalogoActual = useMemo(() => {
    if (catalogoTipo === 'eps') return eps
    if (catalogoTipo === 'arl') return arl
    return afp
  }, [catalogoTipo, eps, arl, afp])

  const catalogoFiltrado = useMemo(() => {
    const term = catalogoSearch.trim().toLowerCase()
    if (!term) return catalogoActual
    return catalogoActual.filter((item) =>
      item.nombre.toLowerCase().includes(term) || item.codigo.toLowerCase().includes(term)
    )
  }, [catalogoActual, catalogoSearch])

  const normasFiltradas = useMemo(() => {
    const term = normasSearch.trim().toLowerCase()
    if (!term) return normas
    return normas.filter((n) =>
      n.titulo.toLowerCase().includes(term) || n.contenido.toLowerCase().includes(term) || String(n.numero).includes(term)
    )
  }, [normas, normasSearch])

  const sedesFiltradas = useMemo(() => {
    const term = estructuraSearch.trim().toLowerCase()
    if (!term) return sedes
    return sedes.filter((s) =>
      s.nombre.toLowerCase().includes(term) || s.codigo.toLowerCase().includes(term) || s.ciudad.toLowerCase().includes(term)
    )
  }, [sedes, estructuraSearch])

  const cargarNormasBase = async () => {
    try {
      await Promise.all(
        NORMAS_BASE_TEMPLATE.map((n) =>
          configService.createNorma({ ...n, sede_id: null })
        )
      )
      toast.success('Normas base cargadas correctamente.')
      await loadData()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const renderSistema = () => (
    <div style={{ ...panel, padding: '18px 20px' }}>
      <h3 style={{ margin: '0 0 14px', color: 'var(--text-primary)', fontSize: '0.98rem' }}>Parámetros globales (solo lectura)</h3>
      {!params ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>Sin datos.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Parametro label="Entorno" value={params.environment} />
          <Parametro label="Debug" value={params.debug ? 'True' : 'False'} />
          <Parametro label="Access token (min)" value={String(params.access_token_expire_minutes)} />
          <Parametro label="Refresh token (días)" value={String(params.refresh_token_expire_days)} />
          <Parametro label="Tamaño máximo upload (MB)" value={String(params.max_upload_size_mb)} />
          <Parametro label="Orígenes CORS" value={params.allowed_origins.join(', ')} />
        </div>
      )}
    </div>
  )

  const renderEstructura = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ ...panel, padding: '10px 12px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.05em' }}>SUBMÓDULOS DE ESTRUCTURA</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: '4px' }}>
          Gestiona sedes operativas y sus ubicaciones internas desde jerarquía.
        </div>
        <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
          <input placeholder="Buscar sede por nombre, código o ciudad" value={estructuraSearch} onChange={(e) => setEstructuraSearch(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <EstructuraPanel sedes={sedesFiltradas} onReload={loadData} />
    </div>
  )

  const renderReglasHSE = () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ ...panel, padding: '10px 12px' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.05em' }}>SUBMÓDULOS DE REGLAS HSE</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', marginTop: '4px' }}>
          Mantén catálogos base (EPS/ARL/AFP) y normas de seguridad en un flujo unificado.
        </div>
        <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className={reglasSubtab === 'catalogos' ? 'btn-primary' : 'btn-ghost'} onClick={() => setReglasSubtab('catalogos')}>Catálogos</button>
            <button className={reglasSubtab === 'normas' ? 'btn-primary' : 'btn-ghost'} onClick={() => setReglasSubtab('normas')}>Normas</button>
          </div>
          <input
            placeholder={reglasSubtab === 'catalogos' ? 'Buscar por nombre o código del catálogo' : 'Buscar norma por número, título o contenido'}
            value={reglasSubtab === 'catalogos' ? catalogoSearch : normasSearch}
            onChange={(e) => {
              if (reglasSubtab === 'catalogos') setCatalogoSearch(e.target.value)
              else setNormasSearch(e.target.value)
            }}
            style={inputStyle}
          />
        </div>
      </div>
      {reglasSubtab === 'catalogos'
        ? <CatalogosPanel items={catalogoFiltrado} tipo={catalogoTipo} onTipoChange={setCatalogoTipo} onReload={loadData} />
        : <NormasPanel normas={normasFiltradas} sedes={sedes} onReload={loadData} onLoadBase={cargarNormasBase} />}
    </div>
  )

  const renderContent = () => {
    if (loading && !params) return <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Cargando configuración...</div>
    if (activeTab === 'sistema') return renderSistema()
    if (activeTab === 'estructura') return renderEstructura()
    return renderReglasHSE()
  }

  const activeMeta = TABS.find((t) => t.id === activeTab)

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700 }}>Configuración</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>Fase 1: base del sistema, sedes, ubicaciones y catálogos.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '14px', alignItems: 'start', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)' }}>
        <div style={{ display: 'grid', gap: '10px' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const accentColor = isActive ? 'var(--primary-500)' : 'var(--border-subtle)'
            const badgeColor = isActive ? 'var(--primary-400)' : 'var(--text-muted)'

            let meta = 'Acciones disponibles'
            if (tab.id === 'estructura') meta = `${sedes.length} sedes · ${sedes.reduce((acc, s) => acc + s.ubicaciones.length, 0)} ubicaciones`
            if (tab.id === 'reglas_hse') meta = `${eps.length + arl.length + afp.length} catálogos · ${normas.length} normas`

            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(tab.id) } }}
                style={{
                  ...panel,
                  cursor: 'pointer', padding: '14px', borderColor: accentColor,
                  background: isActive ? 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, var(--bg-surface) 60%)' : 'var(--bg-surface)',
                  transition: 'all var(--transition-fast)', display: 'grid', gap: '7px',
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9px',
                  border: `1px solid ${isActive ? 'rgba(245,158,11,0.35)' : 'var(--border-default)'}`,
                  background: isActive ? 'rgba(245,158,11,0.12)' : 'var(--bg-raised)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                }}>
                  <Icon size={15} />
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>{tab.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', lineHeight: 1.35 }}>{tab.description}</div>
                <div style={{ color: badgeColor, fontSize: '0.68rem', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>{meta}</div>
              </div>
            )
          })}
        </div>

        <div style={{ ...panel, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Área de trabajo</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 700 }}>{activeMeta?.label}</div>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

function Parametro({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px 12px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.06em', marginBottom: '5px' }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontSize: '0.83rem', fontWeight: 600 }}>{value || '—'}</div>
    </div>
  )
}
