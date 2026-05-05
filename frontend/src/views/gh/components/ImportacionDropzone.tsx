import { useState } from 'react'

import { useGHImportacion } from '@/hooks/gh/useGHImportacion'

export function ImportacionDropzone({
  sedeId,
  onImportacionCreada,
}: {
  sedeId: number
  onImportacionCreada: (importacionId: number) => void
}) {
  const [fileName, setFileName] = useState('')
  const importacion = useGHImportacion()

  const handleRegistrar = () => {
    importacion.mutate(
      { sede_id: sedeId, nombre_archivo: fileName },
      {
        onSuccess: (created) => {
          onImportacionCreada(created.id)
        },
      },
    )
  }

  return (
    <div style={{ border: '1px dashed var(--border-default)', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Carga de archivo</h3>
      <input
        type="file"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
      />
      <div style={{ marginTop: 8 }}>{fileName || 'Sin archivo seleccionado'}</div>
      <button
        type="button"
        disabled={!fileName || importacion.isPending}
        onClick={handleRegistrar}
      >
        Registrar importación
      </button>
    </div>
  )
}
