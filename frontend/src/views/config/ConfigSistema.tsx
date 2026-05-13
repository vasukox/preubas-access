import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { configService } from '@/services/config.service'

function Param({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      border: '1px solid var(--border-subtle)', borderRadius: '10px',
      padding: '12px 14px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accent, opacity: 0.45 }} />
      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '7px' }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '0.84rem', fontWeight: 600, paddingLeft: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Lock size={11} color="var(--text-muted)" />
        {value || '—'}
      </div>
    </div>
  )
}

export default function ConfigSistema() {
  const { data: params, isLoading, isError } = useQuery({
    queryKey: ['config_sistema'],
    queryFn: configService.getSistema,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.83rem', padding: '8px 0' }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)', borderTopColor: 'var(--primary-400)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        Cargando parámetros...
      </div>
    )
  }

  if (isError || !params) {
    return <div style={{ color: 'var(--danger-500)', fontSize: '0.83rem' }}>Error cargando los parámetros del sistema.</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
      <Param accent="#5668B8" label="Entorno"              value={params.environment} />
      <Param accent="#5668B8" label="Debug"                value={params.debug ? 'Activo' : 'Desactivado'} />
      <Param accent="#5668B8" label="Access token (min)"   value={String(params.access_token_expire_minutes)} />
      <Param accent="#5668B8" label="Refresh token (días)" value={String(params.refresh_token_expire_days)} />
      <Param accent="#5668B8" label="Upload máx. (MB)"     value={String(params.max_upload_size_mb)} />
      <Param accent="#5668B8" label="Orígenes CORS"        value={params.allowed_origins.join(', ')} />
    </div>
  )
}

