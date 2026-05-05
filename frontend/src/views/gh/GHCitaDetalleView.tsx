import { useParams } from 'react-router-dom'

import { useGHCitaDetalle } from '@/hooks/gh/useGHCitaDetalle'
import { ChecklistPanel } from './components/ChecklistPanel'

export default function GHCitaDetalleView() {
  const { id } = useParams()
  const citaId = id ? Number(id) : null
  const { data, isLoading } = useGHCitaDetalle(citaId)

  if (!citaId) return <div>Cita no válida.</div>
  if (isLoading) return <div>Cargando detalle...</div>
  if (!data) return <div>No se encontró la cita.</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Detalle de cita {data.codigo}</h2>
      <div>
        {data.candidato.nombres} {data.candidato.apellidos}
      </div>
      <ChecklistPanel />
    </div>
  )
}
