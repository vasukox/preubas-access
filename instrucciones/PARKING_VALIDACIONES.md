# PARKING — VALIDACIONES, RESTRICCIONES Y REGLAS DE NEGOCIO

> Documento técnico de validación vehicular para el módulo Parking.  
> Cubre: placas colombianas y extranjeras, RUNT, SOAT, tecnomecánica, pico y placa,  
> licencias, restricciones y estrategia de fallback.  
> Fuentes: RUNT, Mintransporte, Fasecolda, Alcaldías de Bogotá, Medellín y Cali.

---

## 1. VALIDACIÓN DE FORMATO DE PLACAS

### 1.1 Principio de normalización (siempre primero)

Antes de cualquier validación, normalizar la placa:
```typescript
function normalizarPlaca(placa: string): string {
  return placa
    .toUpperCase()
    .replace(/\s+/g, '')   // quitar espacios
    .replace(/-/g, '')      // quitar guiones
    .trim()
}
// "abc 123" → "ABC123"  |  "ABC-12D" → "ABC12D"
```

---

### 1.2 Formatos vehiculares colombianos

| Tipo | Formato | Regex | Ejemplo |
|---|---|---|---|
| Carro particular / servicio público (actual) | 3L + 3N | `^[A-Z]{3}[0-9]{3}$` | ABC123 |
| Carro particular (formato viejo, pre-1988) | 2L + 4N | `^[A-Z]{2}[0-9]{4}$` | AB1234 |
| Moto nueva (post-2009) | 3L + 2N + 1L | `^[A-Z]{3}[0-9]{2}[A-Z]$` | ABC12D |
| Moto vieja (pre-2009) | 3L + 2N | `^[A-Z]{3}[0-9]{2}$` | ABC12 |
| Remolque / semirremolque | R o S + 5N | `^[RS][0-9]{5}$` | R12345 |
| Vehículo oficial / gobierno | O + 2L + 3N | `^O[A-Z]{2}[0-9]{3}$` | OAB123 |
| Diplomático / consular | 1L(DCOAM) + 1L + 4N | `^[DCOAM][A-Z][0-9]{4}$` | DA1234 |
| Policía Nacional | 2N + guion + 4N | `^[0-9]{2}-[0-9]{4}$` | 12-3456 |
| Fuerza Aérea Colombiana | FAC + 6N | `^FAC[0-9]{6}$` | FAC123456 |

> **Nota:** Vehículos eléctricos en Colombia **no tienen formato de placa diferente**. Usan el mismo formato `ABC123`. Se identifican en el RUNT por tipo de combustible.

---

### 1.3 Formatos de placas extranjeras (en tránsito en Colombia)

Los vehículos extranjeros que ingresan a Colombia operan bajo el **Permiso de Ingreso y Tránsito (PIT)** — Decreto 1165 de 2019. No se les asigna placa colombiana.

| País | Formato | Regex | Ejemplo |
|---|---|---|---|
| Argentina (Mercosur, desde 2016) | 2L + 3N + 2L | `^[A-Z]{2}[0-9]{3}[A-Z]{2}$` | AB123CD |
| Argentina (viejo, aún vigente) | 3L + 3N | `^[A-Z]{3}[0-9]{3}$` | ABC123 |
| Brasil (Mercosur, desde 2018) | 3L + 1N + 1L + 2N | `^[A-Z]{3}[0-9][A-Z][0-9]{2}$` | ABC1D23 |
| Brasil (viejo) | 3L + 4N | `^[A-Z]{3}[0-9]{4}$` | ABC1234 |
| Paraguay (Mercosur, desde 2019) | 4L + 3N | `^[A-Z]{4}[0-9]{3}$` | ABCD123 |
| Uruguay (Mercosur, desde 2015) | 3L + 4N | `^[A-Z]{3}[0-9]{4}$` | ABC1234 |
| Venezuela | 3L + 3N o 2L + 4N | `^[A-Z]{2,3}[0-9]{3,4}$` | ABC123 |
| Ecuador | 3L + 3N o 2L + 3N | Igual a Colombia | ABC123 |
| Perú | 3L + 3N | `^[A-Z]{3}[0-9]{3}$` | ABC123 |
| Panamá | 3L + 3N o similar | Variable | ABC123 |

---

### 1.4 Función de validación maestra (TypeScript)

```typescript
export type TipoPlaca =
  | 'COLOMBIANA_CARRO'
  | 'COLOMBIANA_CARRO_VIEJA'
  | 'COLOMBIANA_MOTO_NUEVA'
  | 'COLOMBIANA_MOTO_VIEJA'
  | 'COLOMBIANA_REMOLQUE'
  | 'COLOMBIANA_OFICIAL'
  | 'COLOMBIANA_DIPLOMATICA'
  | 'COLOMBIANA_POLICIA'
  | 'COLOMBIANA_FAC'
  | 'EXTRANJERA_MERCOSUR_ARG'
  | 'EXTRANJERA_MERCOSUR_BRA'
  | 'EXTRANJERA_MERCOSUR_PAR'
  | 'EXTRANJERA_MERCOSUR_URY'
  | 'EXTRANJERA_OTRO'
  | 'INVALIDA'

export interface ResultadoValidacionPlaca {
  valida: boolean
  tipo: TipoPlaca
  placaNormalizada: string
  esColombia: boolean
  esExtranjera: boolean
  mensaje?: string
}

const FORMATOS_PLACA: { tipo: TipoPlaca; regex: RegExp; esColombia: boolean }[] = [
  { tipo: 'COLOMBIANA_CARRO',         regex: /^[A-Z]{3}[0-9]{3}$/,      esColombia: true  },
  { tipo: 'COLOMBIANA_CARRO_VIEJA',   regex: /^[A-Z]{2}[0-9]{4}$/,      esColombia: true  },
  { tipo: 'COLOMBIANA_MOTO_NUEVA',    regex: /^[A-Z]{3}[0-9]{2}[A-Z]$/, esColombia: true  },
  { tipo: 'COLOMBIANA_MOTO_VIEJA',    regex: /^[A-Z]{3}[0-9]{2}$/,      esColombia: true  },
  { tipo: 'COLOMBIANA_REMOLQUE',      regex: /^[RS][0-9]{5}$/,           esColombia: true  },
  { tipo: 'COLOMBIANA_OFICIAL',       regex: /^O[A-Z]{2}[0-9]{3}$/,     esColombia: true  },
  { tipo: 'COLOMBIANA_DIPLOMATICA',   regex: /^[DCOAM][A-Z][0-9]{4}$/,  esColombia: true  },
  { tipo: 'COLOMBIANA_POLICIA',       regex: /^[0-9]{2}-[0-9]{4}$/,     esColombia: true  },
  { tipo: 'COLOMBIANA_FAC',           regex: /^FAC[0-9]{6}$/,            esColombia: true  },
  { tipo: 'EXTRANJERA_MERCOSUR_ARG',  regex: /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/, esColombia: false },
  { tipo: 'EXTRANJERA_MERCOSUR_BRA',  regex: /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, esColombia: false },
  { tipo: 'EXTRANJERA_MERCOSUR_PAR',  regex: /^[A-Z]{4}[0-9]{3}$/,      esColombia: false },
]

export function validarPlaca(placaRaw: string): ResultadoValidacionPlaca {
  const placa = normalizarPlaca(placaRaw)

  if (!placa || placa.length < 4 || placa.length > 9) {
    return { valida: false, tipo: 'INVALIDA', placaNormalizada: placa,
             esColombia: false, esExtranjera: false, mensaje: 'Longitud inválida' }
  }

  for (const formato of FORMATOS_PLACA) {
    if (formato.regex.test(placa)) {
      return {
        valida: true,
        tipo: formato.tipo,
        placaNormalizada: placa,
        esColombia: formato.esColombia,
        esExtranjera: !formato.esColombia,
      }
    }
  }

  // Placa con formato no reconocido pero con caracteres válidos
  if (/^[A-Z0-9-]{4,9}$/.test(placa)) {
    return { valida: true, tipo: 'EXTRANJERA_OTRO', placaNormalizada: placa,
             esColombia: false, esExtranjera: true,
             mensaje: 'Formato no estándar — registrar como extranjero' }
  }

  return { valida: false, tipo: 'INVALIDA', placaNormalizada: placa,
           esColombia: false, esExtranjera: false,
           mensaje: 'Contiene caracteres inválidos' }
}
```

---

### 1.5 Reglas de negocio por tipo de placa

| Tipo | ¿Requiere SOAT? | ¿Requiere Tecno? | ¿Pico y Placa aplica? | ¿Puede consultar RUNT? |
|---|:---:|:---:|:---:|:---:|
| Colombiana (carro/moto) | ✅ | ✅ | ✅ | ✅ |
| Colombiana oficial/policía | ✅ | ✅ | ❌ exento | ✅ |
| Diplomática | ❌ exento | ❌ exento | ❌ exento | ⚠️ parcial |
| Extranjera (PIT) | ❌ SOAT extranjero | ❌ exento < 3 meses | ✅ sí aplica | ❌ No en RUNT CO |
| Colombiana FAC/Remolque | ✅ | ✅ | Depende | ✅ |

---

## 2. INTEGRACIÓN CON RUNT

### 2.1 Arquitectura recomendada

El RUNT **no tiene API pública gratuita**. Las opciones reales son:

| Opción | Proveedor | Forma de acceso | Datos | Costo |
|---|---|---|---|---|
| **Recomendada** | Apitude (`apitude.co`) | API REST + `x-api-key` header | Completo | Por consulta |
| Alternativa | Verifik (`verifik.co`) | API REST + credenciales | Completo | Por consulta |
| Acceso institucional | RUNT directo | Convenio firmado + cert. | Completo | Tarifario RUNT |
| No usar | RUNT portal ciudadano | Manual / scraping | Parcial | Inestable |

**Variable de entorno a agregar:**
```env
RUNT_PROVIDER=apitude          # apitude | verifik | runt_directo
RUNT_API_KEY=your_key_here
RUNT_API_URL=https://apitude.co/api/v1.0
RUNT_TIMEOUT_MS=8000
RUNT_CACHE_TTL_SECONDS=3600    # 1 hora de caché por placa
```

---

### 2.2 Datos que retorna el RUNT (vía Apitude/Verifik)

```typescript
export interface RuntVehiculoResponse {
  placa: string
  marca: string
  linea: string
  modelo: string                // año
  color: string
  tipo_vehiculo: string
  cilindraje: number | null
  tipo_combustible: string      // 'GASOLINA' | 'ELECTRICO' | 'GAS' | 'DIESEL'
  numero_motor: string
  numero_chasis: string
  vin: string

  propietario: {
    tipo_documento: string
    numero_documento: string
    nombre: string
  }

  soat: {
    vigente: boolean
    numero_poliza: string
    aseguradora: string
    fecha_inicio: string        // 'YYYY-MM-DD'
    fecha_vencimiento: string
  } | null

  tecnomecanica: {
    vigente: boolean
    fecha_expedicion: string
    fecha_vencimiento: string
    cda: string                 // nombre del CDA
  } | null

  restricciones: {
    tiene_prenda: boolean
    tiene_embargo: boolean
    inmovilizado: boolean
    multas_pendientes: boolean
  }

  error?: string                // si el RUNT no encontró la placa
}
```

---

### 2.3 Servicio de integración (`runt.service.ts`)

```typescript
// Patrón: consultar → cachear → devolver
// Si el RUNT falla → modo manual (solicitar upload de documento)

async consultarPlaca(placa: string): Promise<RuntVehiculoResponse | null> {
  const cached = await this.cache.get(`runt:${placa}`)
  if (cached) return cached

  try {
    const response = await this.httpService.axiosRef.post(
      `${this.config.get('RUNT_API_URL')}/requests/runt-vehicle-co/`,
      { document_type: 'placa', document_number: placa },
      {
        headers: { 'x-api-key': this.config.get('RUNT_API_KEY') },
        timeout: parseInt(this.config.get('RUNT_TIMEOUT_MS')),
      }
    )

    const data = await this.poll(response.data.url)  // el RUNT es asíncrono
    await this.cache.set(`runt:${placa}`, data, this.config.get('RUNT_CACHE_TTL_SECONDS'))
    return data

  } catch (err) {
    this.logger.warn(`RUNT no disponible para placa ${placa}: ${err.message}`)
    return null  // fallback: modo manual
  }
}
```

---

### 2.4 Estrategia de caché

| Dato | TTL de caché | Justificación |
|---|---|---|
| Datos del vehículo (marca, color) | 24 horas | Cambia raramente |
| SOAT vigente | 6 horas | Puede renovarse |
| SOAT vencido | 1 hora | Puede renovarse y no queremos bloquear |
| Tecnomecánica | 24 horas | Cambia raramente |
| Restricciones (embargos) | 1 hora | Puede actualizarse |

---

### 2.5 Estrategia de fallback cuando el RUNT no está disponible

```
RUNT disponible →
  ✅ Consulta en tiempo real → cachear resultado

RUNT no disponible (timeout / error 5xx) →
  ✅ Revisar si hay caché válida → usar caché
  ✅ Si no hay caché → MODO MANUAL:
     - Solicitante sube documentos (SOAT, tecno) como archivos
     - Aprobador valida manualmente
     - El sistema registra "validado manualmente" en historial
     - Se genera alerta para re-consultar RUNT cuando vuelva
```

**Estados del campo `fuente_validacion` en `parking_documentos`:**
```
RUNT_AUTOMATICO    → consultado y verificado por API
RUNT_CACHEADO      → datos de caché (fecha de consulta guardada)
MANUAL_UPLOAD      → documento subido por usuario, validado por aprobador
PENDIENTE          → aún no validado
```

---

## 3. VALIDACIÓN DE SOAT

### 3.1 Cuándo validar

| Momento | Acción |
|---|---|
| Autogestión (paso 3: documentos) | Mostrar campos de SOAT + campo de fecha de vencimiento |
| Si RUNT disponible | Consultar automáticamente y pre-llenar datos |
| Si RUNT no disponible | Pedir upload del PDF/imagen del SOAT |
| Al aprobar solicitud | Re-consultar RUNT para confirmar |
| Cron diario (3am) | Revisar todos los SOAT que vencen en ≤ 30 días |
| Portal vigilancia | Mostrar alerta si SOAT vence en ≤ 30 días |

### 3.2 Reglas de negocio SOAT

| Escenario | Comportamiento del sistema |
|---|---|
| SOAT vigente, > 30 días | ✅ Sin alerta |
| SOAT vigente, ≤ 30 días para vencer | ⚠️ Alerta en dashboard y portal vigilancia |
| SOAT vencido (hoy > fecha_vencimiento) | 🔴 Autorización pasa a `SUSPENDIDA` automáticamente si `requiere_soat = true` |
| SOAT vencido pero sede no requiere SOAT | ⚠️ Alerta informativa, no bloquea |
| Vehículo extranjero | 🟡 No se puede consultar RUNT — registro manual o exención por política |
| Vehículo diplomático | ✅ Exento de SOAT colombiano — documentar en observaciones |
| Moto de emergencia / FAC | Aplicar según política de sede |

### 3.3 Aseguradoras SOAT autorizadas en Colombia (validar que el documento venga de estas)

Si el usuario sube el SOAT manualmente, el aprobador debe verificar que sea de una aseguradora autorizada por la Superfinanciera:

1. Seguros Generales Suramericana S.A. (SURA)
2. Seguros Bolívar S.A.
3. AXA Colpatria Seguros S.A.
4. Seguros del Estado S.A.
5. La Previsora S.A. Compañía de Seguros
6. Liberty Seguros S.A.
7. Mapfre Seguros Generales de Colombia S.A.
8. Seguros Mundial S.A.
9. La Equidad Seguros Generales Organismo Cooperativo
10. Aseguradora Solidaria de Colombia Entidad Cooperativa
11. HDI Seguros Colombia S.A.

**El sistema debe mostrar esta lista en el formulario de upload** para guiar al solicitante.

### 3.4 Datos a guardar del SOAT en `parking_documentos`

```typescript
{
  tipo_documento: 'SOAT',
  nombre_archivo: 'soat_ABC123_2026.pdf',
  ruta_archivo: '/parking/docs/ABC123/soat_...',
  fecha_vencimiento: '2026-11-30',
  estado: 'VIGENTE',               // calculado: hoy < fecha_vencimiento
  // Campos adicionales sugeridos (extender entidad o guardar en metadata JSON):
  numero_poliza: '1234567890',
  aseguradora: 'Seguros Bolívar',
  fuente_validacion: 'RUNT_AUTOMATICO',
  fecha_consulta_runt: '2026-06-05T10:00:00Z',
}
```

---

## 4. VALIDACIÓN DE TECNOMECÁNICA (RTM)

### 4.1 Reglas de vigencia

| Tipo de vehículo | Primera revisión | Renovación |
|---|---|---|
| Carro particular (nuevo) | A los **5 años** desde matrícula | Anual |
| Moto (nueva) | A los **2 años** desde matrícula | Anual |
| Servicio público (taxis, buses) | A los **2 años** | Anual |
| Carga (camiones, vans) | A los **2 años** | Anual |
| Vehículos eléctricos | Igual a su categoría | Anual |
| **Vehículos extranjeros < 3 meses** | **Exentos** | N/A |

### 4.2 ¿Qué vehículos NO requieren tecnomecánica en el parking?

- Bicicletas (sin motor)
- Vehículos diplomáticos
- Vehículos extranjeros en tránsito (< 3 meses)
- Vehículos del gobierno con revisión interna documentada

### 4.3 Reglas de negocio RTM

| Escenario | Comportamiento |
|---|---|
| RTM vigente | ✅ Sin restricción |
| RTM vence en ≤ 30 días | ⚠️ Alerta |
| RTM vencida + sede la requiere | 🔴 Autorización → `SUSPENDIDA` |
| Vehículo nuevo (< 5 años carros, < 2 años motos) | 🟢 Exento — el sistema debe calcular esto por año del vehículo |
| RUNT no disponible | ⚠️ Modo manual — upload del certificado RTM |

### 4.4 Lógica de exención automática por antigüedad

```typescript
function requiereTecnomecanica(tipoVehiculo: TipoVehiculo, modeloAnio: number, anioActual: number): boolean {
  if (!modeloAnio) return true // si no sabe el año, pedir el documento
  const antiguedad = anioActual - modeloAnio

  if (tipoVehiculo === 'CARRO' || tipoVehiculo === 'ELECTRICO') {
    return antiguedad >= 5
  }
  if (tipoVehiculo === 'MOTO') {
    return antiguedad >= 2
  }
  if (['CAMION', 'VAN'].includes(tipoVehiculo)) {
    return antiguedad >= 2
  }
  return false // BICICLETA
}
```

---

## 5. PICO Y PLACA

### 5.1 ¿Por qué importa el pico y placa en un sistema de parking?

El sistema de parking debe **informar al vigilante y al solicitante** si el vehículo está bajo restricción de circulación en la fecha/hora de ingreso. No puede permitir el parqueo de un vehículo que llegó circulando ilegalmente, y es una información útil para el aprobador al definir horarios.

> **Posición del sistema:** El parking **informa** la restricción pero **no bloquea** automáticamente el ingreso — la decisión la toma el vigilante según política de cada sede.

---

### 5.2 Bogotá — Regla estructural (par/impar)

**Vigencia:** Decreto 846/2019, 073/2021. Permanente.  
**Horario de restricción:** Lunes a viernes, 6:00 a.m. – 9:00 p.m.  
**No aplica:** Sábados, domingos, festivos.

**Regla:** El dígito del día del mes determina qué dígitos de placa están restringidos.

| Días pares del mes | Días impares del mes |
|---|---|
| Dígitos 6, 7, 8, 9, 0 | Dígitos 1, 2, 3, 4, 5 |

**Excepciones que NO aplica pico y placa:**
- Vehículos eléctricos y de cero emisiones
- Vehículos híbridos
- Motocicletas (completamente exentas)
- Vehículos de emergencia y seguridad
- Vehículos escolares
- Discapacitados (con permiso vigente)
- Quienes pagan el Pico y Placa Solidario (permiso diario/mensual/semestral en portal distrital)

```typescript
function bogotaPicoYPlaca(placa: string, fecha: Date): PicoYPlacaResult {
  const dia = fecha.getDate()
  const diaSemana = fecha.getDay()    // 0=dom, 6=sab
  const hora = fecha.getHours()
  const minuto = fecha.getMinutes()
  const horaDecimal = hora + minuto / 60

  // Fuera de horario
  if (diaSemana === 0 || diaSemana === 6) {
    return { restringido: false, motivo: 'Fin de semana' }
  }
  if (horaDecimal < 6 || horaDecimal >= 21) {
    return { restringido: false, motivo: 'Fuera de horario de restricción' }
  }

  const ultimoDigito = parseInt(placa.slice(-1))
  const esDiaPar = dia % 2 === 0

  const digitosPar = [6, 7, 8, 9, 0]
  const digitosImpar = [1, 2, 3, 4, 5]

  const restringidos = esDiaPar ? digitosPar : digitosImpar
  const restringido = restringidos.includes(ultimoDigito)

  return {
    restringido,
    ciudad: 'Bogotá',
    ultimoDigito,
    tipoDia: esDiaPar ? 'PAR' : 'IMPAR',
    horario: '6:00 a.m. – 9:00 p.m.',
    motivo: restringido
      ? `Dígito ${ultimoDigito} restringido en día ${esDiaPar ? 'par' : 'impar'}`
      : 'Sin restricción',
  }
}
```

---

### 5.3 Medellín — Regla semanal por dígito (rota semestral)

**Horario:** Lunes a viernes, 5:00 a.m. – 8:00 p.m.  
**No aplica:** Sábados, domingos, festivos.  
**Aplica a:** Carros, camionetas, vans, motos, mototaxis.  
**Exentos:** Vehículos eléctricos, híbridos, gas natural.

La tabla rota cada semestre (enero–junio / julio–diciembre). Debe mantenerse en base de datos.

**Tabla vigente primer semestre 2026 (2 febrero al 30 junio 2026):**

| Día | Dígitos restringidos |
|---|---|
| Lunes | 1, 7 |
| Martes | 0, 3 |
| Miércoles | 4, 6 |
| Jueves | 5, 9 |
| Viernes | 2, 8 |

**Vías exentas en Medellín** (no aplica pico y placa en estas vías):
- Avenida Regional / Sistema Vial del Río
- Avenida Las Palmas
- La Iguana
- Autopista Sur
- Avenida 33 (tramo específico)
- Los 5 corregimientos rurales

```typescript
// Tabla en BD: parking_picoYPlaca_reglas
// { ciudad, semestre ('2026-1' | '2026-2'), dia_semana (1-5), digitos: [1,7] }
```

---

### 5.4 Cali — Regla semanal por dígito (rota semestral)

**Horario:** Lunes a viernes, 6:00 a.m. – 7:00 p.m.  
**No aplica:** Sábados, domingos, festivos.  
**Exentos:** Vehículos eléctricos, híbridos, diplomáticos, carga ≥ 5 ton, motos, discapacitados.

**Tabla vigente primer semestre 2026 (5 enero al 30 junio 2026):**

| Día | Dígitos restringidos |
|---|---|
| Lunes | 1, 2 |
| Martes | 3, 4 |
| Miércoles | 5, 6 |
| Jueves | 7, 8 |
| Viernes | 9, 0 |

---

### 5.5 Otras ciudades

| Ciudad | Estado pico y placa |
|---|---|
| Barranquilla | Sin pico y placa permanente (2025) |
| Bucaramanga | Sin pico y placa permanente |
| Pereira | Sin pico y placa permanente |
| Manizales | Sin pico y placa permanente |
| Cúcuta | Sin pico y placa permanente |

---

### 5.6 Modelo en base de datos para pico y placa configurable

```sql
-- Tabla: parking_picoYPlaca_ciudades
ciudad_codigo VARCHAR(30)  -- 'BOGOTA' | 'MEDELLIN' | 'CALI'
activo BOOLEAN

-- Tabla: parking_picoYPlaca_reglas
ciudad_codigo VARCHAR(30)
semestre VARCHAR(10)      -- '2026-1' | '2026-2'
dia_semana TINYINT        -- 1=Lunes ... 5=Viernes
digitos_restringidos JSON -- [1, 7]
hora_inicio VARCHAR(5)    -- '05:00'
hora_fin VARCHAR(5)       -- '20:00'
vigente_desde DATE
vigente_hasta DATE

-- Tabla: parking_picoYPlaca_excepciones_tipo
tipo VARCHAR(50)           -- 'ELECTRICO' | 'HIBRIDO' | 'DISCAPACITADO' | etc.
descripcion TEXT
aplica_bogota BOOLEAN
aplica_medellin BOOLEAN
aplica_cali BOOLEAN
```

---

### 5.7 Función maestra de pico y placa

```typescript
export interface PicoYPlacaResult {
  restringido: boolean
  ciudad: string | null
  ultimoDigito: number
  horario: string | null
  motivo: string
  esExento: boolean
  tipoExencion?: string
}

async function verificarPicoYPlaca(
  placa: string,
  tipoVehiculo: TipoVehiculo,
  sedeId: number,
  fecha: Date,
  esElectrico: boolean,
  tienePermisoEspecial: boolean
): Promise<PicoYPlacaResult> {

  // 1. Bicicletas no aplica pico y placa
  if (tipoVehiculo === 'BICICLETA') {
    return { restringido: false, ciudad: null, ultimoDigito: -1,
             horario: null, motivo: 'Bicicleta — exento', esExento: true }
  }

  // 2. Eléctricos e híbridos exentos en todas las ciudades
  if (esElectrico) {
    return { restringido: false, ciudad: null, ultimoDigito: -1,
             horario: null, motivo: 'Vehículo eléctrico — exento', esExento: true, tipoExencion: 'ELECTRICO' }
  }

  // 3. Con permiso especial (solidario, discapacidad, etc.)
  if (tienePermisoEspecial) {
    return { restringido: false, ciudad: null, ultimoDigito: -1,
             horario: null, motivo: 'Permiso especial activo', esExento: true, tipoExencion: 'PERMISO_ESPECIAL' }
  }

  // 4. Consultar ciudad de la sede
  const ciudad = await this.sedeService.getCiudad(sedeId)
  const ultimoDigito = parseInt(placa.slice(-1))

  // 5. Aplicar lógica por ciudad
  if (ciudad === 'BOGOTA') return bogotaPicoYPlaca(placa, fecha)
  if (ciudad === 'MEDELLIN' || ciudad === 'CALI') {
    return this.verificarPicoYPlacaConTabla(ciudad, placa, fecha, ultimoDigito)
  }

  // 6. Ciudad sin pico y placa
  return { restringido: false, ciudad, ultimoDigito,
           horario: null, motivo: 'Ciudad sin restricción de pico y placa', esExento: false }
}
```

---

### 5.8 Cómo mantener la tabla actualizada

El pico y placa de Medellín y Cali cambia semestralmente. **Estrategia:**

1. Crear endpoint admin: `PUT /parking/configuracion/picoYPlaca/:ciudad`
2. El administrador actualiza la tabla cada semestre (enero y julio)
3. El sistema usa la regla vigente según `fecha BETWEEN vigente_desde AND vigente_hasta`
4. Generar alerta interna cuando queden 15 días para que venza una regla semestral

---

## 6. VALIDACIÓN DE LICENCIA DE CONDUCCIÓN

### 6.1 Categorías y vehículos que habilitan

| Categoría | Vehículo | Cilindraje |
|---|---|---|
| **A1** | Motocicleta particular | ≤ 125 cc |
| **A2** | Motocicleta, mototaxi, mototriciclo | > 125 cc (cualquier cc) |
| **B1** | Carro, campero, camioneta, microbús particular | Particular |
| **B2** | Camión rígido, bus particular | Particular |
| **B3** | Tractocamión / articulado particular | Particular |
| **C1** | Taxi, carro público | Servicio público |
| **C2** | Bus, buseta pública | Servicio público |
| **C3** | Tractocamión público | Servicio público |

**Jerarquía:** Una categoría superior habilita categorías inferiores del mismo grupo.  
`B2 → puede conducir B1` | `C2 → puede conducir C1`

### 6.2 Vigencia de la licencia

| Edad del conductor | Renovación |
|---|---|
| Menor de 60 años | Cada **10 años** |
| 60 a 79 años | Cada **5 años** |
| 80 años o más | **Anual** |
| Servicio público (C) | Cada **3 años** / anual si > 60 años |

### 6.3 Validación en el sistema

```typescript
function validarCategoriaLicencia(
  categoriaLicencia: string,
  tipoVehiculo: TipoVehiculo
): { valida: boolean; mensaje: string } {

  const requerimientos: Record<TipoVehiculo, string[]> = {
    CARRO:           ['B1', 'B2', 'B3', 'C1', 'C2', 'C3'],
    MOTO:            ['A1', 'A2'],
    BICICLETA:       [],           // no requiere licencia
    CAMION:          ['B2', 'B3', 'C2', 'C3'],
    VAN:             ['B1', 'B2', 'C1', 'C2'],
    TAXI_AUTORIZADO: ['C1', 'C2', 'C3'],
    ELECTRICO:       ['B1', 'B2', 'B3', 'C1', 'C2', 'C3'],
  }

  const categoriasValidas = requerimientos[tipoVehiculo]
  if (categoriasValidas.length === 0) {
    return { valida: true, mensaje: 'No requiere licencia' }
  }
  if (categoriasValidas.includes(categoriaLicencia)) {
    return { valida: true, mensaje: 'Categoría válida para el tipo de vehículo' }
  }
  return {
    valida: false,
    mensaje: `Categoría ${categoriaLicencia} no habilita conducir ${tipoVehiculo}. Requiere: ${categoriasValidas.join(' o ')}`
  }
}
```

### 6.4 Cuándo pedir la licencia

La licencia se pide **solo para vehículos motorizados**. Bicicletas: no aplica.

El sistema debe:
1. En autogestión: pedir foto/PDF de la licencia si `requiere_licencia = true` en política de sede
2. El aprobador verifica categoría y fecha de vencimiento manualmente (o vía RUNT si disponible)
3. Si la licencia está vencida → alerta al aprobador, no bloquea automáticamente (puede haber renovación en trámite)

---

## 7. RESTRICCIONES ADICIONALES DEL RUNT

Cuando se consulta el RUNT, puede retornar restricciones sobre el vehículo:

| Restricción | Qué significa | Acción del sistema |
|---|---|---|
| `tiene_prenda: true` | El vehículo tiene prenda (crédito de compra vigente) | ⚠️ Informativo — no bloquea |
| `tiene_embargo: true` | El vehículo está embargado judicialmente | 🔴 Alerta fuerte — aprobador decide |
| `inmovilizado: true` | Autoridad ordenó inmovilización | 🔴 No aprobar — requiere levantamiento |
| `multas_pendientes: true` | Tiene comparendos sin pagar en SIMIT | ⚠️ Informativo — no bloquea parking interno |

> **Posición del sistema:** El parking de Permoda no es una autoridad de tránsito. Informamos las restricciones pero la decisión de aprobar o no es del aprobador de Parking.

---

## 8. VALIDACIONES DE NEGOCIO INTERNAS

Estas son reglas del propio sistema, independientes de APIs externas:

### 8.1 Unicidad de placa activa por sede

```typescript
// Regla: Una placa no puede tener dos autorizaciones ACTIVA en la misma sede
// con rangos de fechas y horarios en conflicto.

async function validarUnicidadPlaca(
  placa: string,
  sedeId: number,
  fechaInicio: Date,
  fechaFin: Date,
  autorizacionIdExcluir?: number
): Promise<void> {
  const conflicto = await this.autorizacionRepo.findOne({
    where: {
      vehiculo: { placa },
      sede_id: sedeId,
      estado: EstadoAutorizacionParking.ACTIVA,
      // overlap de fechas
      fecha_inicio: LessThanOrEqual(fechaFin),
      fecha_fin: MoreThanOrEqual(fechaInicio),
      id: Not(autorizacionIdExcluir ?? 0),
    }
  })
  if (conflicto) {
    throw new BadRequestException(
      `La placa ${placa} ya tiene una autorización activa en esta sede para el período solicitado (Autorización #${conflicto.id})`
    )
  }
}
```

### 8.2 Límite de vehículos por persona

```typescript
// Regla: máximo N vehículos activos por persona según política de sede
async function validarLimiteVehiculos(personaId: number, sedeId: number): Promise<void> {
  const politica = await this.politicaRepo.findOneBy({ sede_id: sedeId })
  const maxPermitidos = politica?.max_vehiculos_por_persona ?? 1

  const activos = await this.autorizacionRepo.count({
    where: {
      persona_id: personaId,
      sede_id: sedeId,
      estado: EstadoAutorizacionParking.ACTIVA,
    }
  })

  if (activos >= maxPermitidos) {
    throw new BadRequestException(
      `La persona ya tiene ${activos} vehículo(s) autorizado(s) en esta sede. Máximo permitido: ${maxPermitidos}`
    )
  }
}
```

### 8.3 Cupo fijo exclusivo (MVP V2)

```typescript
// Regla: Un cupo en estado ASIGNADO no puede asignarse a otra persona
// en el mismo rango horario.
async function validarDisponibilidadCupo(
  cupoId: number,
  fechaInicio: Date,
  fechaFin: Date,
  horarioInicio: string,
  horarioFin: string,
): Promise<void> {
  // Verificar que no haya asignación activa para ese cupo en ese rango
  const asignacion = await this.asignacionRepo.findOne({
    where: {
      cupo_id: cupoId,
      activa: true,
      fecha_inicio: LessThanOrEqual(fechaFin),
      fecha_fin: MoreThanOrEqual(fechaInicio),
    }
  })
  if (asignacion) {
    throw new BadRequestException(`El cupo seleccionado ya está asignado en ese período`)
  }
}
```

### 8.4 Validaciones en el portal de vigilancia (< 2 segundos)

```typescript
async function verificarAccesoVigilante(placa: string, sedeId: number): Promise<VerificacionResultado> {
  const placaNorm = normalizarPlaca(placa)
  const validacion = validarPlaca(placaNorm)

  // 1. Placa con formato inválido
  if (!validacion.valida) {
    return { resultado: 'NO_REGISTRADO', color_semaforo: 'GRIS',
             mensaje: `Formato de placa no reconocido: ${validacion.mensaje}` }
  }

  // 2. Buscar autorización activa
  const autorizacion = await this.autorizacionRepo.findOne({
    where: {
      vehiculo: { placa: placaNorm },
      sede_id: sedeId,
      estado: EstadoAutorizacionParking.ACTIVA,
    },
    relations: ['vehiculo', 'persona', 'cupo']
  })

  // 3. Buscar excepción activa
  const excepcion = await this.excepcionRepo.findOne({
    where: {
      placa: placaNorm,
      sede_id: sedeId,
      activa: true,
      fecha_inicio: LessThanOrEqual(new Date()),
      fecha_fin: MoreThanOrEqual(new Date()),
    }
  })

  // 4. Sin registro
  if (!autorizacion && !excepcion) {
    return { resultado: 'NO_REGISTRADO', color_semaforo: 'GRIS',
             mensaje: 'Placa no registrada en el sistema para esta sede' }
  }

  // 5. Hay excepción activa
  if (excepcion && !autorizacion) {
    return { resultado: 'EXCEPCION', color_semaforo: 'AZUL',
             mensaje: `Excepción activa: ${excepcion.tipo_excepcion} — ${excepcion.motivo}`,
             excepcion }
  }

  // 6. Autorización vencida por fecha
  if (autorizacion.fecha_fin < new Date()) {
    return { resultado: 'VENCIDO', color_semaforo: 'ROJO',
             mensaje: `Autorización vencida el ${autorizacion.fecha_fin.toLocaleDateString()}` }
  }

  // 7. Autorización suspendida
  if (autorizacion.estado === EstadoAutorizacionParking.SUSPENDIDA) {
    return { resultado: 'SUSPENDIDO', color_semaforo: 'ROJO',
             mensaje: 'Autorización suspendida' }
  }

  // 8. Validar horario (si la autorización es por horario)
  if (autorizacion.horario_inicio && autorizacion.horario_fin) {
    const horaActual = new Date().toTimeString().slice(0, 5)
    if (horaActual < autorizacion.horario_inicio || horaActual > autorizacion.horario_fin) {
      return { resultado: 'NO_AUTORIZADO', color_semaforo: 'ROJO',
               mensaje: `Fuera del horario autorizado (${autorizacion.horario_inicio} – ${autorizacion.horario_fin})` }
    }
  }

  // 9. Verificar pico y placa (informativo, no bloquea)
  const picoPlaca = await verificarPicoYPlaca(placa, autorizacion.vehiculo.tipo_vehiculo, sedeId, new Date(), autorizacion.vehiculo.es_electrico, false)

  // 10. Alertas de documentos próximos a vencer
  const alertas: string[] = []
  if (picoPlaca.restringido) alertas.push(`⚠️ Pico y Placa activo en ${picoPlaca.ciudad}`)
  // agregar alertas de SOAT, tecno...

  return {
    resultado: 'AUTORIZADO',
    color_semaforo: alertas.length > 0 ? 'AMARILLO' : 'VERDE',
    mensaje: alertas.length > 0 ? 'Autorizado con alertas' : 'Puede ingresar',
    autorizacion,
    alertas,
  }
}
```

---

## 9. FLUJO COMPLETO DE VALIDACIONES POR MOMENTO

### Durante la autogestión (wizard paso a paso)

| Paso | Validación | Fuente |
|---|---|---|
| Paso 1 — Datos personales | Formato cédula/pasaporte | Local |
| Paso 2 — Vehículo | Formato de placa (regex) | Local |
| Paso 2 — Vehículo | Tipo vehículo vs categoría licencia | Local |
| Paso 2 — Vehículo | Consulta RUNT por placa | RUNT API |
| Paso 3 — Documentos | SOAT: fecha vencimiento válida | Local |
| Paso 3 — Documentos | SOAT: aseguradora autorizada | Lista local |
| Paso 3 — Documentos | Tecno: vigencia según año y tipo | Local |
| Paso 3 — Documentos | Licencia: categoría válida para tipo de vehículo | Local |
| Paso 4 — Horario | Fecha inicio < fecha fin | Local |
| Paso 4 — Horario | Fecha fin no excede límite de política | Política sede |
| Paso 5 — Aceptación | Checkbox obligatorio | Local |

### Al revisar la solicitud (aprobador)

| Validación | Fuente | Acción si falla |
|---|---|---|
| Re-consultar RUNT por placa | RUNT API | Alerta al aprobador |
| SOAT vigente al momento de aprobación | RUNT / documento | Solicitar corrección |
| Tecno vigente (si aplica) | RUNT / documento | Solicitar corrección |
| Placa no tiene otra autorización activa en la sede | BD | Error bloqueante |
| Persona no supera límite de vehículos por sede | BD + política | Error bloqueante |
| Cupo solicitado disponible (si aplica) | BD | Sugerir otro cupo |
| Información de pico y placa | Lógica local | Informativo |

### En el portal de vigilancia (tiempo real)

| Validación | Fuente | Tiempo máximo |
|---|---|---|
| Formato de placa | Local | < 10ms |
| Autorización activa en BD | BD (índice por placa+sede) | < 100ms |
| Estado de la autorización | BD | < 100ms |
| Fecha de vigencia | BD | < 10ms |
| Horario autorizado | BD | < 10ms |
| Pico y placa | Lógica local / BD | < 50ms |
| Excepción activa | BD | < 100ms |
| **Total** | | **< 500ms** |

> Nota: El RUNT **nunca** se consulta en tiempo real en el portal de vigilancia. Se usa la información ya guardada en BD + caché.

---

## 10. ARQUITECTURA DE SERVICIOS DE VALIDACIÓN

```
backend-node/src/parking/services/
├── validacion/
│   ├── placa-validator.service.ts        → formato regex por tipo
│   ├── runt.service.ts                   → integración API RUNT + caché
│   ├── soat-validator.service.ts         → reglas SOAT + alertas
│   ├── tecnomecanica-validator.service.ts → reglas RTM + exenciones
│   ├── pico-placa.service.ts             → lógica por ciudad + tabla BD
│   ├── licencia-validator.service.ts     → categorías vs tipo vehículo
│   └── acceso-validator.service.ts       → verificación integral vigilante
```

### `validacion-parking.module.ts` — providers a registrar

```typescript
@Module({
  imports: [HttpModule, CacheModule, TypeOrmModule.forFeature([...])],
  providers: [
    PlacaValidatorService,
    RuntService,
    SoatValidatorService,
    TecnomecanicaValidatorService,
    PicoPlacaService,
    LicenciaValidatorService,
    AccesoValidatorService,
  ],
  exports: [PlacaValidatorService, RuntService, AccesoValidatorService, PicoPlacaService],
})
export class ValidacionParkingModule {}
```

---

## 11. TABLA DE CONFIGURACIÓN DE VALIDACIONES POR SEDE

La política de sede (`parking_politicas_sede`) controla qué validaciones son obligatorias. Esto permite que una sede pueda exigir más o menos requisitos:

```typescript
// parking_politicas_sede (campos de validación)
requiere_soat: boolean              // bloquea si SOAT vencido
requiere_tecnomecanica: boolean     // bloquea si RTM vencida
requiere_licencia: boolean          // exige subir licencia de conducción
dias_alerta_vencimiento_docs: number // envía alerta X días antes del vencimiento

// Nuevos campos sugeridos para agregar
alerta_pico_placa: boolean          // mostrar alerta de P&P en portal vigilancia
bloquear_pico_placa: boolean        // bloquear ingreso por P&P (decisión corporativa)
verificar_runt_al_aprobar: boolean  // consultar RUNT automáticamente al aprobar
verificar_runt_manual_fallback: boolean // si RUNT falla, permitir modo manual
```

---

## 12. RESUMEN RÁPIDO — TABLA DE DECISIONES

| Situación | Resultado | Color | Acción vigilante |
|---|---|---|---|
| Autorización activa, todos los docs vigentes | AUTORIZADO | 🟢 VERDE | Dejar pasar |
| Autorizado pero SOAT vence en < 30 días | AUTORIZADO | 🟡 AMARILLO | Dejar pasar + notificar |
| Autorizado pero pico y placa activo | AUTORIZADO | 🟡 AMARILLO | Vigilante decide según política |
| Placa con excepción activa, sin autorización | EXCEPCION | 🔵 AZUL | Dejar pasar + anotar |
| Autorización activa pero SOAT vencido | SUSPENDIDO | 🔴 ROJO | No dejar pasar |
| Autorización vencida por fecha | VENCIDO | 🔴 ROJO | No dejar pasar |
| Autorización suspendida | SUSPENDIDO | 🔴 ROJO | No dejar pasar |
| Sin autorización ni excepción | NO_REGISTRADO | ⚫ GRIS | No dejar pasar / crear excepción manual |
| Autorización fuera de horario | NO_AUTORIZADO | 🔴 ROJO | No dejar pasar |
| Placa con embargo judicial | AUTORIZADO | 🟡 AMARILLO | Informar, aprobador decide |
| Vehículo inmovilizado por RUNT | NO_AUTORIZADO | 🔴 ROJO | No dejar pasar |
| Placa extranjera sin registro | NO_REGISTRADO | ⚫ GRIS | Crear excepción manual |
| Placa con formato inválido | NO_REGISTRADO | ⚫ GRIS | Verificar manualmente |

---

*Este documento es la fuente de verdad para todas las validaciones del módulo Parking.  
Actualizar la sección de Pico y Placa cada semestre (enero y julio).*
