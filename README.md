## KOAJ Access - Guía de instalación para un PC nuevo

Esta guía explica, de forma detallada, cómo descargar el repositorio y poner a funcionar el backend y el frontend en otra máquina.

## 1) Qué contiene el proyecto

- **Backend**: NestJS + TypeORM + MySQL
- **Frontend**: React + TypeScript + Vite
- **Base de datos**: MySQL (schema `koaj_access`)
- **Tiempo real**: WebSocket integrado en NestJS (ruta `/ws/:sedeId`)

## 2) Requisitos previos

Instala estas herramientas antes de empezar:

- Git
- Node.js 22 LTS (o 20.19+)
- npm (incluido con Node)
- MySQL 8.x

> **Nota:** El backend ya NO requiere Python. Todo corre sobre Node.js.

## 3) Clonar el repositorio

Desde la carpeta donde quieras trabajar:

```powershell
git clone <URL_DEL_REPO>
cd Koaj_access
```

## 4) Configurar base de datos MySQL

1. Asegura que el servicio de MySQL esté corriendo.
2. Crea la base de datos:

```sql
CREATE DATABASE koaj_access CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Crea (o usa) un usuario con permisos sobre esa base de datos.

Ejemplo (ajusta usuario/clave según tu entorno):

```sql
CREATE USER 'koaj_user'@'localhost' IDENTIFIED BY 'koaj_password';
GRANT ALL PRIVILEGES ON koaj_access.* TO 'koaj_user'@'localhost';
FLUSH PRIVILEGES;
```

## 5) Backend NestJS - instalación y arranque

En una terminal nueva:

```powershell
cd backend-node
```

### 5.1 Crear archivo de entorno

Copiar el ejemplo a `.env`:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y ajusta, especialmente:

- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`

### 5.2 Instalar dependencias

```powershell
npm install
```

### 5.3 Levantar el backend

```powershell
npm run start:dev
```

Si todo va bien:

- API: http://localhost:8000
- Health: http://localhost:8000/health

## 6) Frontend - instalación y arranque

En otra terminal:

```powershell
cd frontend
```

### 6.1 Crear archivo de entorno

```powershell
Copy-Item .env.example .env
```

Valores esperados en local:

- `VITE_API_URL=http://localhost:8000`
- `VITE_WS_URL=ws://localhost:8000`

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

## 7) Credenciales iniciales

- Email: andres@permoda.com.co
- Password: 123456Thomas*

Al primer login se solicita cambio de contraseña.

## 8) Flujo recomendado en un PC nuevo

1. Instalar prerequisitos (Git, Node.js 22 LTS, MySQL).
2. Clonar repositorio.
3. Crear base de datos MySQL.
4. Configurar `backend-node/.env`.
5. Ejecutar `npm install` en `backend-node`.
6. Levantar backend en puerto 8000.
7. Configurar `frontend/.env`.
8. Ejecutar `npm ci` en `frontend`.
9. Levantar frontend y validar login.

## 9) Comandos de verificación rápida

Backend:

```powershell
cd backend-node
node -v
npm run start:dev
```

Frontend:

```powershell
cd frontend
node -v
npm -v
npm run dev
```

## 10) Problemas comunes y solución

### Error al arrancar backend (exit code 1)

Causa más frecuente: no hay conexión a MySQL.

Revisa:

- Que MySQL esté corriendo.
- Que `DB_*` en `.env` tenga usuario, clave, host, puerto y base correctos.
- Que la base de datos exista.

### Frontend no consume API

Revisa:

- Que el backend esté levantado en puerto 8000.
- Que `frontend/.env` tenga `VITE_API_URL` correcto.
- Que `ALLOWED_ORIGINS` en el backend permita `http://localhost:5173`.

### WebSocket desconectado

Revisa:

- `VITE_WS_URL` en `frontend/.env`.
- Que el token de sesión exista (el WS requiere JWT).

## 11) Estructura principal

```
backend-node/
  src/
    main.ts                 → Entrada NestJS
    app.module.ts           → Módulo raíz
    auth/                   → Autenticación JWT
    config-koaj/            → Configuración general
    gestion-humana/         → Módulo GH
    hse/                    → Módulo HSE
    websocket/              → Gateway WebSocket
frontend/
  src/
    services/api.ts         → Cliente HTTP y refresh de token
    store/wsStore.ts        → Conexión WebSocket
```

## 12) Recomendaciones para trabajo en equipo

- No subir archivos `.env` al repositorio.
- Usar `backend-node/.env.example` y `frontend/.env.example` como plantilla.
- Mantener backend y frontend en terminales separadas.
- Ejecutar `npm ci` (no `npm install`) en frontend para respetar lockfile.
