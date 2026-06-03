export interface Notificacion {
  id:         number
  usuario_id: number
  tipo:       string
  titulo:     string
  mensaje:    string
  leida:      boolean
  metadata:   Record<string, unknown> | null
  created_at: string
}

export interface NotificacionesListResponse {
  data: Notificacion[]
  total: number
  page: number
  pages: number
}
