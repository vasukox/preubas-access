# Contrato Funcional - Modulo Gestion Humana (GH)

## 1. Objetivo
Definir el comportamiento funcional del modulo GH para operar tres procesos core:
- Contratacion (firma de contrato)
- Inducciones
- Dotacion

La operacion debe soportar agendamiento grupal, autogestion por link, control de asistencia con codigo temporal y trazabilidad completa por persona.

## 2. Submodulos oficiales
1. Dashboard (tiempo real)
2. Agendar Citas
3. Inducciones
4. Dotacion
5. Importacion GH (soporte de carga)

## 3. Alcance por submodulo

### 3.1 Dashboard
- Visualizar volumen del dia (citas, confirmadas, en curso, no asistencia).
- Distribucion por tipo de cita.
- Accesos rapidos a Agendar Citas, Inducciones, Dotacion e Importacion.

### 3.2 Agendar Citas
- Crear citas individuales o grupales.
- Tipos permitidos:
  - INDUCCION
  - FIRMA_CONTRATO
  - ENTREGA_DOTACION
- Gestionar estado operativo de la cita.
- No administrar reglas de entrega de dotacion ni logica de sesion de induccion en este submodulo.

### 3.3 Inducciones
- Convertir un grupo citado a una sesion de induccion.
- Relacionar personas por area, tipo de induccion y responsable.
- Enviar link de autogestion por persona.
- Controlar entrada y salida con codigos temporales visibles al administrador.

### 3.4 Dotacion
- Administrar maestro de dotacion por filtros:
  - area
  - cargo
  - tipo de contrato
  - sede (si aplica)
- Asignar kit esperado por persona.
- Registrar entrega parcial/completa, faltantes y evidencia.

### 3.5 Importacion GH
- Crear cargas por lote.
- Ver resultados por fila (exito/falla).
- Reproceso de filas fallidas en futuros incrementos.

## 4. Flujo funcional end-to-end

1. Admin crea cita grupal en Agendar Citas.
2. Si el tipo es INDUCCION, crea una sesion de induccion desde el submodulo Inducciones.
3. Sistema genera link individual por persona y lo envia por canal configurado.
4. El link permanece bloqueado hasta la ventana permitida (fecha/hora).
5. Durante entrada, el admin ve un codigo temporal de check-in.
6. Persona abre su link, digita codigo y queda asistencia de entrada.
7. Durante salida, el admin ve un codigo temporal de check-out.
8. Persona registra salida con codigo de cierre.
9. Al cerrar sesion, sistema consolida estados y evidencias.

## 5. Entidades funcionales

## 5.1 GH_Cita
- id
- codigo
- sede_id
- tipo_cita
- estado
- fecha_hora_inicio
- fecha_hora_fin
- observaciones

## 5.2 GH_Candidato
- id
- tipo_documento
- numero_documento
- nombres
- apellidos
- email
- telefono

## 5.3 GH_SesionInduccion (nueva)
- id
- cita_grupo_id (o coleccion de cita_ids)
- sede_id
- area_id
- tipo_induccion
- responsable_usuario_id
- fecha_hora_inicio
- fecha_hora_fin
- estado_sesion
- codigo_checkin_actual
- codigo_checkout_actual
- fecha_cierre

## 5.4 GH_InduccionAsistencia (nueva)
- id
- sesion_id
- candidato_id
- token_autogestion
- estado_asistencia
- checkin_at
- checkout_at
- intentos_codigo
- ultimo_error_codigo
- ip_entrada
- user_agent_entrada
- ip_salida
- user_agent_salida

## 5.5 GH_MaestroDotacion (nueva)
- id
- sede_id
- area_id
- cargo_id
- tipo_contrato
- kit_codigo
- kit_descripcion
- activo

## 5.6 GH_DotacionEntrega (nueva)
- id
- candidato_id
- sesion_o_cita_id
- estado_entrega
- entregado_por_usuario_id
- fecha_entrega
- observaciones

## 5.7 GH_DotacionEntregaDetalle (nueva)
- id
- entrega_id
- item_codigo
- item_nombre
- cantidad_esperada
- cantidad_entregada
- estado_item
- evidencia_url

## 6. Estados y transiciones

### 6.1 Cita (actual)
- PROGRAMADA -> CONFIRMADA -> EN_CURSO -> FINALIZADA
- PROGRAMADA/CONFIRMADA/EN_CURSO -> CANCELADA
- PROGRAMADA/CONFIRMADA -> NO_ASISTIO

### 6.2 Sesion de induccion (nueva)
- PROGRAMADA -> EN_CURSO -> FINALIZADA -> CERRADA
- PROGRAMADA/EN_CURSO -> CANCELADA

### 6.3 Asistencia de induccion por persona (nueva)
- PENDIENTE
- CHECKIN_OK
- EN_SESION
- CHECKOUT_OK
- NO_ASISTIO
- SALIDA_PENDIENTE

### 6.4 Entrega de dotacion (nueva)
- PENDIENTE
- PARCIAL
- COMPLETA
- REPROGRAMADA
- ANULADA

## 7. Reglas de autogestion para inducciones

1. Link individual por persona (token unico).
2. Link bloqueado fuera de ventana permitida.
3. Ventana recomendada:
   - apertura: 15 min antes de inicio
   - cierre de check-in: 30 min despues de inicio
4. Codigo temporal de check-in:
   - aleatorio
   - vigencia corta (2-5 min)
5. Codigo temporal de check-out:
   - distinto al de check-in
   - vigencia corta (2-5 min)
6. Maximo intentos por persona (ejemplo: 5) con bloqueo temporal.
7. Auditoria obligatoria por accion:
   - timestamp
   - usuario objetivo
   - sesion
   - IP
   - user_agent
8. El sistema no debe permitir check-out sin check-in previo.

## 8. APIs funcionales objetivo (contrato)

## 8.1 Agendar Citas
- GET /api/v1/gh/citas
- POST /api/v1/gh/citas
- POST /api/v1/gh/citas/grupo
- GET /api/v1/gh/citas/{id}
- PATCH /api/v1/gh/citas/{id}
- POST /api/v1/gh/citas/{id}/estado

## 8.2 Inducciones
- POST /api/v1/gh/inducciones/sesiones
- GET /api/v1/gh/inducciones/sesiones
- GET /api/v1/gh/inducciones/sesiones/{id}
- PATCH /api/v1/gh/inducciones/sesiones/{id}
- POST /api/v1/gh/inducciones/sesiones/{id}/estado
- POST /api/v1/gh/inducciones/sesiones/{id}/generar-codigo-checkin
- POST /api/v1/gh/inducciones/sesiones/{id}/generar-codigo-checkout
- POST /api/v1/gh/inducciones/sesiones/{id}/enviar-links

## 8.3 Portal induccion (autogestion)
- GET /api/v1/gh/portal/induccion/{token}
- POST /api/v1/gh/portal/induccion/{token}/checkin
- POST /api/v1/gh/portal/induccion/{token}/checkout

## 8.4 Dotacion
- GET /api/v1/gh/dotacion/maestro
- POST /api/v1/gh/dotacion/maestro
- PATCH /api/v1/gh/dotacion/maestro/{id}
- GET /api/v1/gh/dotacion/entregas
- POST /api/v1/gh/dotacion/entregas
- POST /api/v1/gh/dotacion/entregas/{id}/detalle
- POST /api/v1/gh/dotacion/entregas/{id}/cerrar

## 9. Roles y permisos

- ADMIN_GLOBAL:
  - control total de todos los submodulos GH
- ADMIN_GH:
  - control operativo de Agendar Citas, Inducciones y Dotacion
- VIGILANTE_GH:
  - lectura de dashboard y validaciones operativas definidas
- VISUALIZADOR:
  - solo consulta

## 10. Criterios de aceptacion por proceso

### 10.1 Agendar Citas
- Se puede crear cita grupal con tipo valido.
- Se puede cambiar estado de cita con trazabilidad.

### 10.2 Inducciones
- Una sesion puede asociar grupo, area, tipo y responsable.
- Link bloqueado antes de tiempo y habilitado en ventana.
- Check-in y check-out con codigos temporales validos.
- No permite checkout sin checkin.

### 10.3 Dotacion
- Existe maestro por area/cargo/tipo.
- Se calcula kit esperado por persona.
- Se registra entrega parcial/completa con evidencia.

## 11. MVP recomendado

1. Fase 1:
- Renombre y operacion de Agendar Citas.
- Tipos de cita finalizados.

2. Fase 2:
- Sesiones de Induccion + portal check-in/check-out por codigo.

3. Fase 3:
- Maestro Dotacion + entregas por persona.

4. Fase 4:
- Reportes consolidados y auditoria avanzada.

## 12. Definiciones pendientes de negocio

1. Tolerancia maxima para llegada tarde.
2. Politica de no asistencia justificada.
3. Canal oficial de envio de link (correo, WhatsApp, ambos).
4. Vigencia exacta de codigos temporales.
5. Reglas de reprogramacion por sesion/persona.
