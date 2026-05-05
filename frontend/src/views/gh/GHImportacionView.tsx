import { useMemo, useState } from 'react'

import { useSedeStore } from '@/store'
import { useGHImportacionDetalle } from '@/hooks/gh/useGHImportacion'
import { ImportacionDropzone } from './components/ImportacionDropzone'
import { ImportacionResultadoTable } from './components/ImportacionResultadoTable'

export default function GHImportacionView() {
  const sedeId = useSedeStore((s) => s.sedeActiva?.id ?? null)
  const [importacionId, setImportacionId] = useState<number | null>(null)
  const { data: detalle, isFetching } = useGHImportacionDetalle(importacionId)

  const rows = useMemo(
    () =>
      (detalle?.detalles ?? []).map((item) => ({
        fila: item.numero_fila,
        estado: item.estado,
        mensaje: item.mensaje,
      })),
    [detalle],
  )

  if (!sedeId) return <div>Selecciona una sede para importar datos GH.</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ margin: 0 }}>Importación GH</h2>

      <ImportacionDropzone sedeId={sedeId} onImportacionCreada={setImportacionId} />

      {importacionId ? (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Importación #{importacionId} {isFetching ? 'actualizando...' : ''}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Registra una importación para ver su resultado.
        </div>
      )}

      <ImportacionResultadoTable rows={rows} />
    </div>
  )
}
