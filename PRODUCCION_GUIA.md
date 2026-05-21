# KOAJ Access v2.0 — Guía de producción en Okitup
### Permoda S.A.S.

> Okitup es un panel de hosting con soporte Node.js. Él maneja el servidor web
> y el proxy internamente — tú solo creas la app, subes los archivos y configuras
> las variables de entorno en el panel. No tienes que tocar nginx ni configurar
> nada de red a mano.

---

## Visión general de lo que vas a hacer

```
Tu PC                          Okitup (servidor)
──────────────────             ──────────────────────────────────────
1. Build frontend  ──────────► carpeta frontend/dist/ (archivos estáticos)
2. Build backend   ──────────► carpeta backend-node/dist/ (Node.js)
3. Generar migrac. ──────────► se corre una vez desde el shell del panel
                               para crear las 30 tablas en MySQL
```

El panel de Okitup hace automáticamente:
- Apuntar el dominio a los archivos del frontend
- Crear el proceso Node.js que corre el backend
- Redirigir `/api/*` al backend (proxy)
- Gestionar el servidor web

---

## PARTE 1 — En tu PC (haces esto primero, antes de subir nada)

---

### Paso 1.1 — Generar el JWT_SECRET seguro

Abre una terminal en tu PC y ejecuta:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Te imprime una cadena larga como esta:
```
a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6f7a8b9
```

**Copia y guarda ese valor.** Lo pegas más adelante en las variables de entorno del panel.

---

### Paso 1.2 — Construir el backend

En la carpeta `backend-node/`:

```bash
cd backend-node
npm install
npm run build
```

Esto genera la carpeta `backend-node/dist/` con todo el JavaScript compilado.

---

### Paso 1.3 — Generar las migraciones de base de datos

> **Por qué:** En producción `synchronize` está apagado (correcto y seguro).
> TypeORM no crea las tablas solo — necesita un archivo de migración que
> le diga exactamente qué crear.

Con tu `.env` de desarrollo activo (apuntando a tu MySQL local), ejecuta:

```bash
cd backend-node
npm run migration:generate -- src/database/migrations/InitialSchema
```

Verifica que se creó el archivo:
```bash
# Windows PowerShell
Get-ChildItem src/database/migrations/
# Debes ver: 1234567890000-InitialSchema.ts
```

Luego vuelve a compilar para incluir la migración en el dist:
```bash
npm run build
```

---

### Paso 1.4 — Construir el frontend

Primero crea (o edita) el archivo `frontend/.env.production`:

```env
# Si el frontend y backend están en el MISMO dominio (recomendado):
# Dejar vacío — el panel redirige /api al backend automáticamente
VITE_API_URL=
VITE_WS_URL=

# Si están en dominios DISTINTOS (ej: app.permoda.com y api.permoda.com):
# VITE_API_URL=https://api.permoda.com
# VITE_WS_URL=wss://api.permoda.com
```

Luego construir:
```bash
cd frontend
npm install
npm run build
```

Esto genera `frontend/dist/` con los archivos HTML/CSS/JS listos.

---

## PARTE 2 — En el panel de Okitup

---

### Paso 2.1 — Crear la base de datos MySQL

1. Entra al panel de Okitup
2. Busca la sección **"Bases de datos"** o **"MySQL Databases"**
3. Crea una base de datos nueva:
   - Nombre: `koaj_access`
   - Charset: `utf8mb4` (si el panel lo pide)
4. Crea un **usuario de base de datos**:
   - Usuario: `koaj_user`
   - Contraseña: una contraseña segura (guárdala)
5. **Asigna el usuario a la base de datos** con todos los permisos (ALL PRIVILEGES)

> El panel te va a dar los datos de conexión:
> - Host: normalmente `127.0.0.1` o `localhost`
> - Puerto: `3306`
> Anótalos, los necesitas en el siguiente paso.

---

### Paso 2.2 — Crear la aplicación Node.js en el panel

1. En el panel busca **"Node.js"** o **"Application Manager"** o **"Setup Node.js App"**
2. Crea una nueva aplicación:
   - **Versión de Node:** elige 20.x o la más reciente disponible
   - **Modo:** Production
   - **Directorio raíz de la app:** la carpeta donde subirás el backend
     (ej: `backend-node/` o `public_html/backend/`)
   - **Archivo de inicio:** `dist/main.js`
   - **Dominio/URL:** tu dominio o subdominio para el backend

3. El panel va a crear el proceso Node.js pero aún no tiene los archivos ni las variables.

---

### Paso 2.3 — Configurar las variables de entorno en el panel

Dentro de la configuración de tu app Node.js en el panel, busca
**"Environment Variables"** o **"Variables de entorno"** y agrega estas una por una:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8000` (o el que el panel asigne) |
| `DATABASE_HOST` | `127.0.0.1` |
| `DATABASE_PORT` | `3306` |
| `DATABASE_USER` | `koaj_user` |
| `DATABASE_PASSWORD` | la contraseña que pusiste en Paso 2.1 |
| `DATABASE_NAME` | `koaj_access` |
| `JWT_SECRET` | el valor largo que generaste en Paso 1.1 |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_ACCESS_EXPIRE_MINUTES` | `30` |
| `JWT_REFRESH_EXPIRE_DAYS` | `7` |
| `CORS_ORIGINS` | `https://tu-dominio.com` (tu dominio real) |
| `UPLOAD_DIR` | la ruta absoluta dentro del servidor donde guardar PDFs |
| `MAX_UPLOAD_SIZE_MB` | `5` |
| `LPR_API_KEY` | (dejar vacío por ahora) |
| `NFC_READER_API_KEY` | (dejar vacío por ahora) |

> **Nota sobre `UPLOAD_DIR`:** Si no sabes la ruta absoluta, usa el shell del
> panel (Paso 2.4) para ejecutar `pwd` dentro de la carpeta de tu app y construirla.
> Ejemplo: `/home/tuusuario/koaj-access/uploads`

---

### Paso 2.4 — Subir los archivos al servidor

**Opción A — FTP (más fácil si el panel tiene gestor de archivos):**

Sube estas dos carpetas:
- `backend-node/dist/` → a la carpeta raíz de tu app Node.js en el servidor
- `backend-node/package.json` → al mismo lugar (necesario para `npm install`)
- `frontend/dist/` → a la carpeta pública del dominio del frontend

> En paneles tipo cPanel la carpeta pública del dominio se llama
> `public_html/` o el nombre del dominio.

**Opción B — SSH/Shell desde el panel:**

Si el panel tiene terminal o acceso SSH:
```bash
# Clonar el repo (si tienes git en el servidor)
git clone https://github.com/tu-usuario/koaj_access.git /home/tuusuario/koaj-access

# Instalar dependencias del backend
cd /home/tuusuario/koaj-access/backend-node
npm install --omit=dev

# Copiar frontend al directorio público
cp -r /home/tuusuario/koaj-access/frontend/dist/* /home/tuusuario/public_html/
```

---

### Paso 2.5 — Instalar dependencias Node en el servidor

En el shell del panel o SSH:

```bash
cd /ruta-a-tu-app-backend/
npm install --omit=dev
```

`--omit=dev` significa que no instala herramientas de desarrollo (jest, eslint, etc.)
— solo lo que la app necesita para correr. Hace la instalación más ligera.

---

### Paso 2.6 — Correr las migraciones (crea las 30 tablas)

En el shell del panel:

```bash
cd /ruta-a-tu-app-backend/
npm run migration:run
```

Debes ver:
```
Running migration: InitialSchema1234567890000
Migration InitialSchema1234567890000 has been executed successfully.
```

Esto crea todas las tablas en MySQL. Solo se hace **una vez** en la instalación inicial.

> Si ves un error de conexión revisa que el `DATABASE_HOST`, `DATABASE_USER`
> y `DATABASE_PASSWORD` estén correctos.

---

### Paso 2.7 — Iniciar la aplicación Node.js

Vuelve al panel, a la sección de tu app Node.js, y haz clic en **"Start"** o **"Restart"**.

El panel arranca `dist/main.js` como proceso Node y lo mantiene vivo automáticamente.

---

### Paso 2.8 — Apuntar el dominio al frontend

En el panel, en la sección de dominios:
- El dominio principal (ej: `koaj.permoda.com`) debe apuntar a la carpeta
  donde subiste `frontend/dist/`
- Las rutas `/api/*` y `/ws/*` deben redirigir al backend Node.js

> En la mayoría de paneles con soporte Node.js esto se configura en la
> misma pantalla de "Setup Node.js App" — hay un campo para el dominio
> y automáticamente hace el proxy `/api → Node`.
> Si el panel no lo hace automático, busca la opción de
> **"Proxy rules"** o **"URL rewriting"** y agrega:
> - `/api/*` → `http://127.0.0.1:8000/api/*`
> - `/ws/*` → `http://127.0.0.1:8000/ws/*`

---

## PARTE 3 — Verificación

Una vez todo esté arriba, prueba desde el navegador:

- [ ] `https://tu-dominio.com` → debe cargar la pantalla de login de KOAJ Access
- [ ] Iniciar sesión → debe funcionar y entrar al dashboard
- [ ] Módulo HSE → debe cargar sin errores
- [ ] Subir un PDF en autogestión → debe guardarse y mostrarse

Desde el shell del panel puedes revisar los logs del proceso Node:
```bash
# Si el panel usa pm2 internamente
pm2 logs

# O revisa los logs donde el panel los guarda (varía por panel)
# Busca en el panel una sección "Logs" dentro de tu app Node.js
```

---

## PARTE 4 — Checklist final

| # | Tarea | Dónde | ✓ |
|---|---|---|---|
| 1 | Generar JWT_SECRET | Tu PC — Paso 1.1 | ☐ |
| 2 | `npm run build` backend | Tu PC — Paso 1.2 | ☐ |
| 3 | Generar migraciones | Tu PC — Paso 1.3 | ☐ |
| 4 | `npm run build` frontend | Tu PC — Paso 1.4 | ☐ |
| 5 | Crear BD `koaj_access` + usuario | Panel Okitup — Paso 2.1 | ☐ |
| 6 | Crear app Node.js en el panel | Panel Okitup — Paso 2.2 | ☐ |
| 7 | Configurar todas las variables de entorno | Panel Okitup — Paso 2.3 | ☐ |
| 8 | Subir archivos `dist/` via FTP o SSH | Panel Okitup — Paso 2.4 | ☐ |
| 9 | `npm install --omit=dev` en servidor | Shell Okitup — Paso 2.5 | ☐ |
| 10 | `npm run migration:run` | Shell Okitup — Paso 2.6 | ☐ |
| 11 | Start de la app Node.js en el panel | Panel Okitup — Paso 2.7 | ☐ |
| 12 | Dominio apuntando al frontend | Panel Okitup — Paso 2.8 | ☐ |
| 13 | Login funciona desde el dominio real | Navegador — Parte 3 | ☐ |
| 14 | Módulo HSE funciona correctamente | Navegador — Parte 3 | ☐ |

---

## Notas importantes

**TypeORM y MariaDB:**
El driver `mysql2` que usa el proyecto es 100% compatible con MariaDB sin ningún
cambio en el código. Si Okitup usa MariaDB en vez de MySQL, funciona igual.

**`synchronize` en producción:**
El código ya está correcto — con `NODE_ENV=production` se apaga automáticamente.
Nunca pongas `synchronize: true` en producción, puede borrar columnas sin avisar.

**Actualizaciones futuras:**
Cuando cambies el esquema de la BD (nueva tabla, nueva columna):
1. En desarrollo: se aplica solo (`synchronize: true`)
2. Para producción: generar migración → subir → correr `migration:run`
   ```bash
   npm run migration:generate -- src/database/migrations/NuevoCambio
   npm run build
   # subir y en el servidor:
   npm run migration:run
   ```

**Si algo falla al arrancar el backend:**
Revisa los logs del panel. El 95% de los errores al arrancar son:
- Variable de entorno mal copiada (espacio extra, comilla sobrante)
- `DATABASE_PASSWORD` incorrecto
- Puerto ocupado (el panel debería asignarlo automáticamente)
