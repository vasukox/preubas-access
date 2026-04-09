import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { configService } from '@/services/config.service'
import { getErrorMessage } from '@/services/api'
import { NormasPanel } from './components/NormasPanel'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontSize: '0.84rem', fontFamily: 'var(--font-ui)', outline: 'none',
}

const NORMAS_BASE_TEMPLATE = [
  { numero: 1, titulo: 'Uso de EPP',             contenido: 'Es obligatorio el uso de Elementos de Protección Personal.' },
  { numero: 2, titulo: 'Reporte de incidentes',  contenido: 'Todo incidente debe ser reportado inmediatamente.' },
  { numero: 3, titulo: 'Prohibición de alcohol', contenido: 'Está prohibido ingresar bajo efectos del alcohol.' },
  { numero: 4, titulo: 'Señalización',           contenido: 'Respetar toda la señalización de seguridad.' },
  { numero: 5, titulo: 'Orden y aseo',           contenido: 'Mantener el área de trabajo ordenada y limpia.' },
]

export default function ConfigNormas() {
  const [normasSearch, setNormasSearch] = useState('')
  const queryClient = useQueryClient()

  // Fetch normas
  const { data: normas = [], isLoading: loadingNormas, refetch } = useQuery({
    queryKey: ['normas'],
    queryFn: () => configService.listNormas(),
  })

  // Fetch sedes
  const { data: sedes = [], isLoading: loadingSedes } = useQuery({
    queryKey: ['sedes'],
    queryFn: configService.listSedes,
  })

  const cargarNormasBaseMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(NORMAS_BASE_TEMPLATE.map(n => configService.createNorma({ ...n, sede_id: null })))
    },
    onSuccess: () => {
      toast.success('Normas base cargadas.')
      void queryClient.invalidateQueries({ queryKey: ['normas'] })
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    }
  })

  const normasFiltradas = useMemo(() => {
    const t = normasSearch.trim().toLowerCase()
    return t ? normas.filter(n => n.titulo.toLowerCase().includes(t) || String(n.numero).includes(t)) : normas
  }, [normas, normasSearch])

  if (loadingNormas || loadingSedes) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando normas de seguridad...
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <input
        placeholder="Buscar por número, título o contenido…"
        value={normasSearch}
        onChange={e => setNormasSearch(e.target.value)}
        style={inputStyle}
      />
      <NormasPanel 
        normas={normasFiltradas} 
        sedes={sedes} 
        onReload={() => refetch()} 
        onLoadBase={() => cargarNormasBaseMutation.mutate()} 
      />
    </div>
  )
}
