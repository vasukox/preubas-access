import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { configService } from '@/services/config.service'
import { EstructuraPanel } from './components/EstructuraPanel'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

export default function ConfigEstructura() {
  const [estructuraSearch, setEstructuraSearch] = useState('')

  const { data: sedes = [], isLoading, refetch } = useQuery({
    queryKey: ['sedes'],
    queryFn: configService.listSedes,
  })

  const sedesFiltradas = useMemo(() => {
    const t = estructuraSearch.trim().toLowerCase()
    return t ? sedes.filter(s => s.nombre.toLowerCase().includes(t) || s.codigo.toLowerCase().includes(t) || s.ciudad.toLowerCase().includes(t)) : sedes
  }, [sedes, estructuraSearch])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando estructura organizacional...
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <input
        placeholder="Buscar sede por nombre, código o ciudad…"
        value={estructuraSearch}
        onChange={e => setEstructuraSearch(e.target.value)}
        style={inputStyle}
      />
      {/* Pasamos refetch para reemplazar el antiguo onReload manual */}
      <EstructuraPanel sedes={sedesFiltradas} onReload={() => refetch()} />
    </div>
  )
}
