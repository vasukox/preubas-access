export function ImportacionResultadoTable({
  rows,
}: {
  rows: Array<{ fila: number; estado: string; mensaje: string }>
}) {
  return (
    <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Resultado de importación</h3>
      {rows.length === 0 ? (
        <div>Sin resultados todavía.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Fila</th>
              <th align="left">Estado</th>
              <th align="left">Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.fila}-${row.estado}`}>
                <td>{row.fila}</td>
                <td>{row.estado}</td>
                <td>{row.mensaje}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
