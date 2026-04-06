## KOAJ Access - Guia de instalacion para un PC nuevo

Esta guia explica, de forma detallada, como descargar el repositorio y poner a funcionar el backend y el frontend en otra maquina.

## 1) Que contiene el proyecto

- Backend: FastAPI + SQLAlchemy async + MySQL
- Frontend: React + TypeScript + Vite
- Base de datos: MySQL (schema koaj_access)
- Tiempo real: WebSocket en la API (ruta /ws/{sede_id})

## 2) Requisitos previos

Instala estas herramientas antes de empezar:

- Git
- Python 3.12.x
- uv (gestor de entornos y paquetes Python)
- Node.js 22 LTS (o 20.19+)
- npm (incluido con Node)
- MySQL 8.x

Notas:

- El backend esta configurado para Python 3.12.
- El frontend usa Vite 7, por eso se recomienda Node moderno.

## 3) Clonar el repositorio

Desde la carpeta donde quieras trabajar:

```powershell
git clone <URL_DEL_REPO>
cd Koaj_access
```

## 4) Configurar base de datos MySQL

1. Asegura que el servicio de MySQL este corriendo.
2. Crea la base de datos:

```sql
CREATE DATABASE koaj_access CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Crea (o usa) un usuario con permisos sobre esa base de datos.

Ejemplo (ajusta usuario/clave segun tu entorno):

```sql
CREATE USER 'koaj_user'@'localhost' IDENTIFIED BY 'koaj_password';
GRANT ALL PRIVILEGES ON koaj_access.* TO 'koaj_user'@'localhost';
FLUSH PRIVILEGES;
```

## 5) Backend - instalacion y arranque

En una terminal nueva:

```powershell
cd backend
```

### 5.1 Crear archivo de entorno

Copiar el ejemplo a .env:

```powershell
Copy-Item .env.example .env
```

Edita .env y ajusta, especialmente:

- DATABASE_URL
- SECRET_KEY
- ALLOWED_ORIGINS

### 5.2 Instalar dependencias de Python

```powershell
uv sync
```

Esto crea y/o actualiza el entorno virtual en backend/.venv con todas las dependencias del proyecto.

### 5.3 Migraciones y seed inicial

La aplicacion en modo desarrollo intenta crear tablas automaticamente en el startup.

Si quieres dejar el flujo de datos inicial listo (roles, sede, admin, catalogos HSE):

```powershell
uv run python -m app.seeders.seed
```

### 5.4 Levantar la API

```powershell
uv run uvicorn app.main:app --reload --port 8000
```

Si todo va bien:

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

## 6) Frontend - instalacion y arranque

En otra terminal:

```powershell
cd frontend
```

### 6.1 Crear archivo de entorno

```powershell
Copy-Item .env.example .env
```

Valores esperados en local:

- VITE_API_URL=http://localhost:8000
- VITE_WS_URL=ws://localhost:8000

### 6.2 Instalar dependencias

```powershell
npm ci
```

### 6.3 Levantar frontend

```powershell
npm run dev
```

Normalmente Vite abre en:

- http://localhost:5173

## 7) Credenciales iniciales (si ejecutaste seed)

- Email: andres@permoda.com.co
- Password: 123456Thomas*

Al primer login se solicita cambio de contrasena.

## 8) Flujo recomendado en un PC nuevo

1. Instalar prerequisitos (Git, Python 3.12, uv, Node, MySQL).
2. Clonar repositorio.
3. Crear base de datos MySQL.
4. Configurar backend/.env.
5. Ejecutar uv sync en backend.
6. Ejecutar seed inicial.
7. Levantar backend en puerto 8000.
8. Configurar frontend/.env.
9. Ejecutar npm ci en frontend.
10. Levantar frontend y validar login.

## 9) Comandos de verificacion rapida

Backend:

```powershell
cd backend
uv run python -V
uv run python -c "import fastapi, sqlalchemy; print('ok backend')"
```

Frontend:

```powershell
cd frontend
node -v
npm -v
```

## 10) Problemas comunes y solucion

### Error al arrancar backend (exit code 1)

Causa mas frecuente: no hay conexion a MySQL.

Revisa:

- Que MySQL este corriendo.
- Que DATABASE_URL tenga usuario, clave, host, puerto y base correctos.
- Que la base de datos exista.

### Frontend no consume API

Revisa:

- Que backend este levantado en puerto 8000.
- Que frontend/.env tenga VITE_API_URL correcto.
- Que ALLOWED_ORIGINS en backend permita http://localhost:5173.

### WebSocket desconectado

Revisa:

- VITE_WS_URL en frontend/.env.
- Que el token de sesion exista (el WS requiere JWT).

## 11) Estructura principal

- backend/app/main.py: entrada de FastAPI
- backend/app/config.py: variables de entorno y configuracion
- backend/app/database.py: engine y sesiones SQLAlchemy async
- backend/app/routers/: endpoints de API
- backend/app/seeders/seed.py: datos iniciales
- frontend/src/services/api.ts: cliente HTTP y refresh de token
- frontend/src/store/wsStore.ts: conexion WebSocket

## 12) Recomendaciones para trabajo en equipo

- No subir archivos .env al repositorio.
- Usar backend/.env.example y frontend/.env.example como plantilla.
- Mantener backend y frontend en terminales separadas.
- Ejecutar npm ci (no npm install) para respetar lockfile.
