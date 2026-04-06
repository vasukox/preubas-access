# Backend KOAJ Access

La guia completa de instalacion y puesta en marcha esta en el README raiz del repositorio.

Ruta recomendada:

- ../README.md

Comandos rapidos (desarrollo):

```powershell
cd backend
Copy-Item .env.example .env
uv sync
uv run python -m app.seeders.seed
uv run uvicorn app.main:app --reload --port 8000
```

