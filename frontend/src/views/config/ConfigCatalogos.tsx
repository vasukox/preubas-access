import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { configService, type CatalogoTipo } from '@/services/config.service'
import { CatalogosPanel } from './components/CatalogosPanel'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

export default function ConfigCatalogos() {
  const [catalogoTipo, setCatalogoTipo] = useState<CatalogoTipo>('eps')
  const [catalogoSearch, setCatalogoSearch] = useState('')

  // Aquí sacamos el listado del catálogo dependiendo del `catalogoTipo` activo. 
  // React-query guarda la caché diferenciándola en la key.
  const { data: catalogoActual = [], isLoading, refetch } = useQuery({
    queryKey: ['catalogos', catalogoTipo],
    queryFn: () => configService.listCatalogo(catalogoTipo),
  })

  const catalogoFiltrado = useMemo(() => {
    const t = catalogoSearch.trim().toLowerCase()
    return t ? catalogoActual.filter(i => i.nombre.toLowerCase().includes(t) || i.codigo.toLowerCase().includes(t)) : catalogoActual
  }, [catalogoActual, catalogoSearch])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando catálogos...
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <input
        placeholder="Buscar por nombre o código del catálogo…"
        value={catalogoSearch}
        onChange={e => setCatalogoSearch(e.target.value)}
        style={inputStyle}
      />
      <CatalogosPanel 
        items={catalogoFiltrado} 
        tipo={catalogoTipo} 
        onTipoChange={setCatalogoTipo} 
        onReload={() => refetch()} 
      />
    </div>
  )
}
