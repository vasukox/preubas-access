"""
KOAJ Access v2.0 — Permoda S.A.S.
Servicio base del módulo Gestión Humana (GH).
"""

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gh import (
    GhAccesoVigilancia,
    GhCandidato,
    GhCita,
    GhDotacionEntrega,
    GhDotacionEntregaDetalle,
    GhImportacion,
    GhImportacionDetalle,
    GhInduccionAsistencia,
    GhMaestroDotacion,
    GhPortalToken,
    GhSesionInduccion,
)
from app.repositories.gh_repository import (
    GhAuditoriaRepository,
    GhCitaRepository,
    GhDotacionRepository,
    GhInduccionRepository,
    GhImportacionRepository,
    GhPortalTokenRepository,
    GhVigilanciaRepository,
)
from app.schemas.gh import (
    GhCatalogoItemResponse,
    GhCandidatoBase,
    GhCitaEstadoRequest,
    GhCitaGrupoCreateRequest,
    GhCitaSesionInduccionResumenResponse,
    GhCitaCreateRequest,
    GhCitaResponse,
    GhCitaUpdateRequest,
    GhCandidatoResponse,
    GhDashboardResponse,
    GhImportacionCreateRequest,
    GhImportacionDetalleListadoResponse,
    GhImportacionDetalleResponse,
    GhImportacionResponse,
    GhPortalAccionResponse,
    GhPortalConfirmRequest,
    GhPortalReagendarRequest,
    GhPortalValidateResponse,
    GhPortalInduccionAccionResponse,
    GhPortalInduccionCodigoRequest,
    GhPortalInduccionValidateResponse,
    GhSesionInduccionCreateRequest,
    GhSesionInduccionEstadoRequest,
    GhInduccionAsistenciaResponse,
    GhSesionInduccionResponse,
    GhCodigoTemporalResponse,
    GhMaestroDotacionCreateRequest,
    GhMaestroDotacionResponse,
    GhMaestroDotacionUpdateRequest,
    GhDotacionEntregaCreateRequest,
    GhDotacionEntregaDetalleCreateRequest,
    GhDotacionEntregaResponse,
    GhDotacionEntregaDetalleResponse,
    GhVigilanteAccesoRequest,
    GhVigilanteAccesoResponse,
    GhVigilanteVerificarRequest,
    GhVigilanteVerificarResponse,
)


class GhService:
    LEGACY_TIPO_CITA_MAP = {
        "ENTREVISTA": "FIRMA_CONTRATO",
    }

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._citas = GhCitaRepository(db)
        self._tokens = GhPortalTokenRepository(db)
        self._vigilancia = GhVigilanciaRepository(db)
        self._importaciones = GhImportacionRepository(db)
        self._auditoria = GhAuditoriaRepository(db)
        self._inducciones = GhInduccionRepository(db)
        self._dotacion = GhDotacionRepository(db)

    def _validate_rango_fechas(self, inicio: datetime, fin: datetime) -> None:
        if fin <= inicio:
            raise ValueError("La fecha/hora fin debe ser mayor que inicio.")

    async def _upsert_candidato(self, candidato_data: GhCandidatoBase) -> GhCandidato:
        candidato = await self._citas.get_candidato_by_documento(
            tipo_documento=candidato_data.tipo_documento,
            numero_documento=candidato_data.numero_documento,
        )

        if candidato:
            candidato.nombres = candidato_data.nombres
            candidato.apellidos = candidato_data.apellidos
            candidato.email = candidato_data.email
            candidato.telefono = candidato_data.telefono
            await self._citas.update(candidato)
            return candidato

        candidato = GhCandidato(**candidato_data.model_dump())
        return await self._citas.create_candidato(candidato)

    async def _generate_cita_codigo(self, sede_id: int) -> str:
        codigo_seed = int(datetime.now(timezone.utc).timestamp())
        codigo = f"GH-{sede_id}-{codigo_seed}"
        if await self._citas.get_cita_by_codigo(codigo):
            codigo = f"{codigo}-{secrets.randbelow(9999):04d}"
        return codigo

    async def _create_cita_with_portal_token(
        self,
        *,
        candidato_id: int,
        sede_id: int,
        responsable_id: int | None,
        tipo_cita: str,
        fecha_hora_inicio: datetime,
        fecha_hora_fin: datetime,
        observaciones: str | None,
    ) -> GhCita:
        codigo = await self._generate_cita_codigo(sede_id)

        cita = GhCita(
            codigo=codigo,
            candidato_id=candidato_id,
            sede_id=sede_id,
            responsable_id=responsable_id,
            tipo_cita=tipo_cita,
            estado="PROGRAMADA",
            fecha_hora_inicio=fecha_hora_inicio,
            fecha_hora_fin=fecha_hora_fin,
            observaciones=observaciones,
        )
        cita = await self._citas.create_cita(cita)

        token = GhPortalToken(
            cita_id=cita.id,
            token=secrets.token_urlsafe(24),
            expira_en=cita.fecha_hora_fin,
            usado_en=None,
        )
        await self._tokens.create_token(token)
        return cita

    async def _audit(
        self,
        *,
        usuario_id: int | None,
        sede_id: int | None,
        accion: str,
        entidad: str,
        entidad_id: int | None,
        detalle: dict | None,
    ) -> None:
        await self._auditoria.log(
            usuario_id=usuario_id,
            sede_id=sede_id,
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            detalle=detalle,
        )

    @staticmethod
    def _now_utc() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _generate_short_code() -> str:
        return f"{secrets.randbelow(900000) + 100000}"

    def _is_portal_window_enabled(self, sesion: GhSesionInduccion) -> bool:
        now = self._now_utc()
        apertura = sesion.fecha_hora_inicio - timedelta(minutes=15)
        cierre = sesion.fecha_hora_fin + timedelta(minutes=30)
        return apertura <= now <= cierre

    @staticmethod
    def _serialize_dotacion_entrega(entrega: GhDotacionEntrega) -> GhDotacionEntregaResponse:
        return GhDotacionEntregaResponse(
            id=entrega.id,
            candidato_id=entrega.candidato_id,
            sesion_id=entrega.sesion_id,
            cita_id=entrega.cita_id,
            estado_entrega=entrega.estado_entrega,
            entregado_por_usuario_id=entrega.entregado_por_usuario_id,
            fecha_entrega=entrega.fecha_entrega,
            observaciones=entrega.observaciones,
            detalles=[GhDotacionEntregaDetalleResponse.model_validate(x) for x in entrega.detalles],
        )

    def _normalize_tipo_cita(self, tipo_cita: str) -> str:
        return self.LEGACY_TIPO_CITA_MAP.get(tipo_cita, tipo_cita)

    async def _serialize_cita(self, cita: GhCita) -> GhCitaResponse:
        sesion_relacionada = None
        if self._normalize_tipo_cita(cita.tipo_cita) == "INDUCCION":
            sesion = await self._inducciones.find_related_session_for_cita(cita)
            if sesion:
                sesion_relacionada = GhCitaSesionInduccionResumenResponse(
                    sesion_id=sesion.id,
                    estado_sesion=sesion.estado_sesion,
                    area=sesion.area,
                    tipo_induccion=sesion.tipo_induccion,
                )
        return GhCitaResponse(
            id=cita.id,
            codigo=cita.codigo,
            sede_id=cita.sede_id,
            tipo_cita=self._normalize_tipo_cita(cita.tipo_cita),
            estado=cita.estado,
            fecha_hora_inicio=cita.fecha_hora_inicio,
            fecha_hora_fin=cita.fecha_hora_fin,
            observaciones=cita.observaciones,
            candidato=GhCandidatoResponse.model_validate(cita.candidato),
            sesion_induccion=sesion_relacionada,
        )

    async def _serialize_sesion(self, sesion: GhSesionInduccion) -> GhSesionInduccionResponse:
        related_cita_ids = await self._inducciones.list_related_cita_ids_for_session(sesion)
        return GhSesionInduccionResponse(
            id=sesion.id,
            sede_id=sesion.sede_id,
            area=sesion.area,
            tipo_induccion=sesion.tipo_induccion,
            responsable_usuario_id=sesion.responsable_usuario_id,
            fecha_hora_inicio=sesion.fecha_hora_inicio,
            fecha_hora_fin=sesion.fecha_hora_fin,
            estado_sesion=sesion.estado_sesion,
            codigo_checkin_actual=sesion.codigo_checkin_actual,
            codigo_checkout_actual=sesion.codigo_checkout_actual,
            fecha_cierre=sesion.fecha_cierre,
            related_cita_ids=related_cita_ids,
            asistentes=[GhInduccionAsistenciaResponse.model_validate(x) for x in sesion.asistentes],
        )

    async def _resolve_asistentes_for_sesion(self, body: GhSesionInduccionCreateRequest) -> tuple[list[GhCita], list[GhCandidatoBase]]:
        citas_relacionadas = await self._citas.get_citas_by_ids(body.cita_ids)
        if body.cita_ids and len(citas_relacionadas) != len(set(body.cita_ids)):
            raise ValueError("Una o varias citas seleccionadas no existen o ya no están activas.")

        candidatos_map: dict[tuple[str, str], GhCandidatoBase] = {}

        for cita in citas_relacionadas:
            tipo_normalizado = self._normalize_tipo_cita(cita.tipo_cita)
            if tipo_normalizado != "INDUCCION":
                raise ValueError(f"La cita {cita.codigo} no corresponde al flujo de inducción.")
            if cita.sede_id != body.sede_id:
                raise ValueError(f"La cita {cita.codigo} pertenece a otra sede.")
            if not cita.candidato:
                raise ValueError(f"La cita {cita.codigo} no tiene candidato asociado.")

            key = (cita.candidato.tipo_documento, cita.candidato.numero_documento)
            candidatos_map[key] = GhCandidatoBase(
                tipo_documento=cita.candidato.tipo_documento,
                numero_documento=cita.candidato.numero_documento,
                nombres=cita.candidato.nombres,
                apellidos=cita.candidato.apellidos,
                email=cita.candidato.email,
                telefono=cita.candidato.telefono,
            )

        for asistente in body.asistentes:
            key = (asistente.tipo_documento, asistente.numero_documento)
            candidatos_map[key] = GhCandidatoBase.model_validate(asistente.model_dump())

        return citas_relacionadas, list(candidatos_map.values())

    async def _sync_citas_with_sesion(self, sesion: GhSesionInduccion) -> None:
        related_cita_ids = await self._inducciones.list_related_cita_ids_for_session(sesion)
        if not related_cita_ids:
            return

        related_citas = await self._citas.get_citas_by_ids(related_cita_ids)
        target_estado = None
        if sesion.estado_sesion == "EN_CURSO":
            target_estado = "EN_CURSO"
        elif sesion.estado_sesion in {"FINALIZADA", "CERRADA"}:
            target_estado = "FINALIZADA"
        elif sesion.estado_sesion == "CANCELADA":
            target_estado = "CANCELADA"

        if not target_estado:
            return

        for cita in related_citas:
            if cita.estado in {"CANCELADA", "NO_ASISTIO"} and target_estado != "CANCELADA":
                continue
            cita.estado = target_estado
            await self._citas.update(cita)

    async def list_tipos_cita(self) -> list[GhCatalogoItemResponse]:
        return [
            GhCatalogoItemResponse(id="INDUCCION", nombre="Inducción"),
            GhCatalogoItemResponse(id="FIRMA_CONTRATO", nombre="Firma de contrato"),
            GhCatalogoItemResponse(id="ENTREGA_DOTACION", nombre="Entrega de dotación"),
        ]

    async def list_estados_cita(self) -> list[GhCatalogoItemResponse]:
        return [
            GhCatalogoItemResponse(id="PROGRAMADA", nombre="Programada"),
            GhCatalogoItemResponse(id="CONFIRMADA", nombre="Confirmada"),
            GhCatalogoItemResponse(id="EN_CURSO", nombre="En curso"),
            GhCatalogoItemResponse(id="FINALIZADA", nombre="Finalizada"),
            GhCatalogoItemResponse(id="NO_ASISTIO", nombre="No asistió"),
            GhCatalogoItemResponse(id="CANCELADA", nombre="Cancelada"),
        ]

    async def listar_citas(
        self,
        *,
        sede_id: int,
        estado: str | None,
        tipo_cita: str | None,
        busqueda: str | None,
        fecha_desde: datetime | None,
        fecha_hasta: datetime | None,
        page: int,
        per_page: int,
    ) -> list[GhCitaResponse]:
        citas = await self._citas.list_citas(
            sede_id=sede_id,
            estado=estado,
            tipo_cita=tipo_cita,
            busqueda=busqueda,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            page=page,
            per_page=per_page,
        )
        return [await self._serialize_cita(cita) for cita in citas]

    async def get_cita(self, cita_id: int) -> GhCitaResponse:
        cita = await self._citas.get_cita(cita_id)
        if not cita:
            raise ValueError("La cita no existe.")
        return await self._serialize_cita(cita)

    async def crear_cita(self, body: GhCitaCreateRequest, responsable_id: int | None) -> GhCitaResponse:
        self._validate_rango_fechas(body.fecha_hora_inicio, body.fecha_hora_fin)
        candidato = await self._upsert_candidato(body.candidato)

        cita = await self._create_cita_with_portal_token(
            candidato_id=candidato.id,
            sede_id=body.sede_id,
            responsable_id=responsable_id,
            tipo_cita=body.tipo_cita,
            fecha_hora_inicio=body.fecha_hora_inicio,
            fecha_hora_fin=body.fecha_hora_fin,
            observaciones=body.observaciones,
        )

        await self._audit(
            usuario_id=responsable_id,
            sede_id=cita.sede_id,
            accion="CREAR_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle={"codigo": cita.codigo, "tipo_cita": cita.tipo_cita},
        )

        await self._db.commit()
        cita = await self._citas.get_cita(cita.id)
        return await self._serialize_cita(cita)

    async def crear_citas_grupo(self, body: GhCitaGrupoCreateRequest, responsable_id: int | None) -> list[GhCitaResponse]:
        self._validate_rango_fechas(body.fecha_hora_inicio, body.fecha_hora_fin)

        citas_ids: list[int] = []
        candidatos_unicos: set[tuple[str, str]] = set()
        for candidato_data in body.candidatos:
            unique_key = (candidato_data.tipo_documento, candidato_data.numero_documento)
            if unique_key in candidatos_unicos:
                continue
            candidatos_unicos.add(unique_key)

            candidato = await self._upsert_candidato(candidato_data)
            cita = await self._create_cita_with_portal_token(
                candidato_id=candidato.id,
                sede_id=body.sede_id,
                responsable_id=responsable_id,
                tipo_cita=body.tipo_cita,
                fecha_hora_inicio=body.fecha_hora_inicio,
                fecha_hora_fin=body.fecha_hora_fin,
                observaciones=body.observaciones,
            )
            citas_ids.append(cita.id)

        await self._audit(
            usuario_id=responsable_id,
            sede_id=body.sede_id,
            accion="CREAR_CITAS_GRUPO",
            entidad="GhCita",
            entidad_id=None,
            detalle={
                "cantidad": len(citas_ids),
                "tipo_cita": body.tipo_cita,
                "fecha_hora_inicio": body.fecha_hora_inicio.isoformat(),
                "fecha_hora_fin": body.fecha_hora_fin.isoformat(),
            },
        )

        await self._db.commit()
        citas = []
        for cita_id in citas_ids:
            cita = await self._citas.get_cita(cita_id)
            if cita:
                citas.append(await self._serialize_cita(cita))
        return citas

    async def actualizar_cita(
        self,
        cita_id: int,
        body: GhCitaUpdateRequest,
        usuario_id: int | None,
    ) -> GhCitaResponse:
        cita = await self._citas.get_cita(cita_id)
        if not cita:
            raise ValueError("La cita no existe.")

        data = body.model_dump(exclude_unset=True)
        nuevo_inicio = data.get("fecha_hora_inicio", cita.fecha_hora_inicio)
        nuevo_fin = data.get("fecha_hora_fin", cita.fecha_hora_fin)
        self._validate_rango_fechas(nuevo_inicio, nuevo_fin)

        for key, value in data.items():
            setattr(cita, key, value)

        await self._citas.update(cita)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=cita.sede_id,
            accion="ACTUALIZAR_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle=data,
        )
        await self._db.commit()
        cita = await self._citas.get_cita(cita_id)
        return await self._serialize_cita(cita)

    async def cambiar_estado(
        self,
        cita_id: int,
        body: GhCitaEstadoRequest,
        usuario_id: int | None,
    ) -> GhCitaResponse:
        cita = await self._citas.get_cita(cita_id)
        if not cita:
            raise ValueError("La cita no existe.")

        tipo_normalizado = self._normalize_tipo_cita(cita.tipo_cita)
        if tipo_normalizado == "INDUCCION" and body.estado in {"EN_CURSO", "FINALIZADA"}:
            raise ValueError(
                "Las citas de induccion no se inician ni finalizan desde agenda. Primero crea o gestiona la sesion en el submodulo de inducciones."
            )

        cita.estado = body.estado
        await self._citas.update(cita)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=cita.sede_id,
            accion="CAMBIAR_ESTADO_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle={"estado": body.estado, "motivo": body.motivo},
        )
        await self._db.commit()
        cita = await self._citas.get_cita(cita_id)
        return await self._serialize_cita(cita)

    async def eliminar_cita(
        self,
        cita_id: int,
        usuario_id: int | None,
    ) -> None:
        cita = await self._citas.get_cita(cita_id)
        if not cita:
            raise ValueError("La cita no existe.")

        tipo_normalizado = self._normalize_tipo_cita(cita.tipo_cita)
        if tipo_normalizado == "INDUCCION":
            sesion = await self._inducciones.find_related_session_for_cita(cita)
            if sesion:
                raise ValueError(
                    "No puedes eliminar una cita que ya esta vinculada a una sesion de induccion. Gestionala desde el submodulo de inducciones."
                )

        tokens = await self._tokens.list_tokens_by_cita_id(cita.id)
        for token in tokens:
            await self._tokens.delete(token)

        await self._citas.delete(cita)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=cita.sede_id,
            accion="ELIMINAR_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle={
                "codigo": cita.codigo,
                "tipo_cita": tipo_normalizado,
                "tokens_eliminados": len(tokens),
            },
        )
        await self._db.commit()

    async def validar_portal(self, token: str) -> GhPortalValidateResponse:
        token_obj = await self._tokens.get_token_activo(token)
        if not token_obj or not token_obj.cita or token_obj.cita.deleted_at is not None:
            raise ValueError("Token de portal inválido o expirado.")

        return GhPortalValidateResponse(
            token=token_obj.token,
            vigente=True,
            expira_en=token_obj.expira_en,
            cita=await self._serialize_cita(token_obj.cita),
        )

    async def portal_confirmar(
        self,
        token: str,
        body: GhPortalConfirmRequest,
    ) -> GhPortalAccionResponse:
        token_obj = await self._tokens.get_token_activo(token)
        if not token_obj or not token_obj.cita:
            raise ValueError("Token de portal inválido o expirado.")

        cita = token_obj.cita
        cita.estado = "CONFIRMADA" if body.confirmada else "CANCELADA"
        token_obj.usado_en = datetime.now(timezone.utc)

        await self._citas.update(cita)
        await self._tokens.update(token_obj)
        await self._audit(
            usuario_id=None,
            sede_id=cita.sede_id,
            accion="PORTAL_CONFIRMAR_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle={"confirmada": body.confirmada, "comentario": body.comentario},
        )
        await self._db.commit()

        cita = await self._citas.get_cita(cita.id)
        return GhPortalAccionResponse(
            token=token,
            accion="CONFIRMAR" if body.confirmada else "CANCELAR",
            cita=await self._serialize_cita(cita),
        )

    async def portal_reagendar(
        self,
        token: str,
        body: GhPortalReagendarRequest,
    ) -> GhPortalAccionResponse:
        token_obj = await self._tokens.get_token_activo(token)
        if not token_obj or not token_obj.cita:
            raise ValueError("Token de portal inválido o expirado.")

        self._validate_rango_fechas(body.fecha_hora_inicio, body.fecha_hora_fin)

        cita = token_obj.cita
        cita.fecha_hora_inicio = body.fecha_hora_inicio
        cita.fecha_hora_fin = body.fecha_hora_fin
        cita.estado = "PROGRAMADA"
        token_obj.usado_en = datetime.now(timezone.utc)

        await self._citas.update(cita)
        await self._tokens.update(token_obj)
        await self._audit(
            usuario_id=None,
            sede_id=cita.sede_id,
            accion="PORTAL_REAGENDAR_CITA",
            entidad="GhCita",
            entidad_id=cita.id,
            detalle={
                "fecha_hora_inicio": body.fecha_hora_inicio.isoformat(),
                "fecha_hora_fin": body.fecha_hora_fin.isoformat(),
                "comentario": body.comentario,
            },
        )
        await self._db.commit()

        cita = await self._citas.get_cita(cita.id)
        return GhPortalAccionResponse(
            token=token,
            accion="REAGENDAR",
            cita=await self._serialize_cita(cita),
        )

    async def verificar_vigilante(self, body: GhVigilanteVerificarRequest) -> GhVigilanteVerificarResponse:
        cita = await self._citas.find_cita_para_vigilancia(
            sede_id=body.sede_id,
            tipo_documento=body.tipo_documento,
            numero_documento=body.numero_documento,
        )
        if not cita:
            return GhVigilanteVerificarResponse(
                estado="NO_REGISTRADO",
                mensaje="No se encontró cita vigente para este documento en la sede.",
                cita=None,
            )

        return GhVigilanteVerificarResponse(
            estado="AUTORIZADO",
            mensaje="Cita vigente encontrada.",
            cita=await self._serialize_cita(cita),
        )

    async def registrar_acceso_vigilante(
        self,
        body: GhVigilanteAccesoRequest,
        vigilante_id: int | None,
    ) -> GhVigilanteAccesoResponse:
        cita = await self._citas.get_cita(body.cita_id)
        if not cita:
            raise ValueError("La cita no existe.")
        if cita.sede_id != body.sede_id:
            raise ValueError("La cita no pertenece a la sede indicada.")

        acceso = GhAccesoVigilancia(
            cita_id=body.cita_id,
            sede_id=body.sede_id,
            vigilante_id=vigilante_id,
            tipo_acceso=body.tipo_acceso,
            metodo=body.metodo,
            notas=body.notas,
        )
        acceso = await self._vigilancia.create_acceso(acceso)

        nuevo_estado = "EN_CURSO" if body.tipo_acceso == "ENTRADA" else "FINALIZADA"
        cita.estado = nuevo_estado
        await self._citas.update(cita)

        await self._audit(
            usuario_id=vigilante_id,
            sede_id=body.sede_id,
            accion="REGISTRAR_ACCESO_GH",
            entidad="GhAccesoVigilancia",
            entidad_id=acceso.id,
            detalle={"tipo_acceso": body.tipo_acceso, "cita_id": body.cita_id},
        )

        await self._db.commit()
        return GhVigilanteAccesoResponse.model_validate(acceso)

    async def crear_importacion(
        self,
        body: GhImportacionCreateRequest,
        usuario_id: int,
    ) -> GhImportacionResponse:
        item = GhImportacion(
            sede_id=body.sede_id,
            creado_por=usuario_id,
            nombre_archivo=body.nombre_archivo,
            estado="PENDIENTE",
            filas_totales=0,
            filas_exitosas=0,
            filas_fallidas=0,
            resumen_error=None,
        )
        item = await self._importaciones.create_importacion(item)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=body.sede_id,
            accion="CREAR_IMPORTACION_GH",
            entidad="GhImportacion",
            entidad_id=item.id,
            detalle={"nombre_archivo": body.nombre_archivo},
        )
        await self._importaciones.add_detalle(
            GhImportacionDetalle(
                importacion_id=item.id,
                numero_fila=0,
                estado="INFO",
                mensaje="Importación registrada. Procesamiento en cola.",
                payload=None,
            )
        )
        await self._db.commit()
        return GhImportacionResponse.model_validate(item)

    async def get_importacion(self, importacion_id: int) -> GhImportacionDetalleListadoResponse:
        item = await self._importaciones.get_importacion(importacion_id)
        if not item:
            raise ValueError("La importación no existe.")

        return GhImportacionDetalleListadoResponse(
            id=item.id,
            sede_id=item.sede_id,
            nombre_archivo=item.nombre_archivo,
            estado=item.estado,
            filas_totales=item.filas_totales,
            filas_exitosas=item.filas_exitosas,
            filas_fallidas=item.filas_fallidas,
            resumen_error=item.resumen_error,
            detalles=[GhImportacionDetalleResponse.model_validate(x) for x in item.detalles],
        )

    async def crear_sesion_induccion(
        self,
        body: GhSesionInduccionCreateRequest,
        usuario_id: int | None,
    ) -> GhSesionInduccionResponse:
        self._validate_rango_fechas(body.fecha_hora_inicio, body.fecha_hora_fin)
        citas_relacionadas, asistentes = await self._resolve_asistentes_for_sesion(body)
        if not asistentes:
            raise ValueError("Selecciona al menos una cita de inducción o define asistentes para la sesión.")

        sesion = GhSesionInduccion(
            sede_id=body.sede_id,
            area=body.area,
            tipo_induccion=body.tipo_induccion,
            responsable_usuario_id=body.responsable_usuario_id,
            fecha_hora_inicio=body.fecha_hora_inicio,
            fecha_hora_fin=body.fecha_hora_fin,
            estado_sesion="PROGRAMADA",
        )
        sesion = await self._inducciones.create_sesion(sesion)

        for asistente in asistentes:
            candidato = await self._upsert_candidato(asistente)
            await self._inducciones.add_asistencia(
                GhInduccionAsistencia(
                    sesion_id=sesion.id,
                    candidato_id=candidato.id,
                    token_autogestion=secrets.token_urlsafe(28),
                    estado_asistencia="PENDIENTE",
                )
            )

        await self._audit(
            usuario_id=usuario_id,
            sede_id=body.sede_id,
            accion="CREAR_SESION_INDUCCION",
            entidad="GhSesionInduccion",
            entidad_id=sesion.id,
            detalle={
                "area": body.area,
                "tipo_induccion": body.tipo_induccion,
                "asistentes": len(asistentes),
                "cita_ids": [cita.id for cita in citas_relacionadas],
            },
        )
        await self._db.commit()

        sesion = await self._inducciones.get_sesion(sesion.id)
        if not sesion:
            raise ValueError("No fue posible consultar la sesión creada.")
        return await self._serialize_sesion(sesion)

    async def listar_sesiones_induccion(
        self,
        *,
        sede_id: int | None,
        estado_sesion: str | None,
    ) -> list[GhSesionInduccionResponse]:
        sesiones = await self._inducciones.list_sesiones(sede_id=sede_id, estado_sesion=estado_sesion)
        return [await self._serialize_sesion(x) for x in sesiones]

    async def get_sesion_induccion(self, sesion_id: int) -> GhSesionInduccionResponse:
        sesion = await self._inducciones.get_sesion(sesion_id)
        if not sesion:
            raise ValueError("La sesión de inducción no existe.")
        return await self._serialize_sesion(sesion)

    async def cambiar_estado_sesion_induccion(
        self,
        *,
        sesion_id: int,
        body: GhSesionInduccionEstadoRequest,
        usuario_id: int | None,
    ) -> GhSesionInduccionResponse:
        sesion = await self._inducciones.get_sesion(sesion_id)
        if not sesion:
            raise ValueError("La sesión de inducción no existe.")

        sesion.estado_sesion = body.estado_sesion
        if body.estado_sesion in {"FINALIZADA", "CERRADA"}:
            sesion.fecha_cierre = self._now_utc()

        await self._inducciones.update(sesion)
        await self._sync_citas_with_sesion(sesion)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=sesion.sede_id,
            accion="CAMBIAR_ESTADO_SESION_INDUCCION",
            entidad="GhSesionInduccion",
            entidad_id=sesion.id,
            detalle={"estado_sesion": body.estado_sesion, "motivo": body.motivo},
        )
        await self._db.commit()

        sesion = await self._inducciones.get_sesion(sesion.id)
        if not sesion:
            raise ValueError("No fue posible consultar la sesión actualizada.")
        return await self._serialize_sesion(sesion)

    async def generar_codigo_temporal_induccion(
        self,
        *,
        sesion_id: int,
        tipo: str,
        usuario_id: int | None,
    ) -> GhCodigoTemporalResponse:
        sesion = await self._inducciones.get_sesion(sesion_id)
        if not sesion:
            raise ValueError("La sesión de inducción no existe.")

        codigo = self._generate_short_code()
        expira_en = self._now_utc() + timedelta(minutes=5)
        if tipo == "CHECKIN":
            sesion.codigo_checkin_actual = codigo
        else:
            sesion.codigo_checkout_actual = codigo

        await self._inducciones.update(sesion)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=sesion.sede_id,
            accion=f"GENERAR_CODIGO_{tipo}",
            entidad="GhSesionInduccion",
            entidad_id=sesion.id,
            detalle={"expira_en": expira_en.isoformat()},
        )
        await self._db.commit()

        return GhCodigoTemporalResponse(sesion_id=sesion.id, tipo=tipo, codigo=codigo, expira_en=expira_en)

    async def validar_portal_induccion(self, token: str) -> GhPortalInduccionValidateResponse:
        asistencia = await self._inducciones.get_asistencia_by_token(token)
        if not asistencia or not asistencia.sesion or not asistencia.candidato:
            raise ValueError("Token de inducción inválido.")

        sesion = asistencia.sesion
        if sesion.estado_sesion == "CANCELADA":
            raise ValueError("La sesión de inducción se encuentra cancelada.")

        return GhPortalInduccionValidateResponse(
            token=token,
            vigente=True,
            ventana_habilitada=self._is_portal_window_enabled(sesion),
            expira_en=sesion.fecha_hora_fin,
            sesion_id=sesion.id,
            estado_sesion=sesion.estado_sesion,
            estado_asistencia=asistencia.estado_asistencia,
            candidato=GhCandidatoResponse.model_validate(asistencia.candidato),
        )

    async def portal_induccion_checkin(
        self,
        *,
        token: str,
        body: GhPortalInduccionCodigoRequest,
        ip: str | None,
        user_agent: str | None,
    ) -> GhPortalInduccionAccionResponse:
        asistencia = await self._inducciones.get_asistencia_by_token(token)
        if not asistencia or not asistencia.sesion:
            raise ValueError("Token de inducción inválido.")
        sesion = asistencia.sesion

        if asistencia.intentos_codigo >= 5:
            raise ValueError("Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.")

        if not self._is_portal_window_enabled(sesion):
            raise ValueError("El link de inducción aún no está habilitado para esta sesión.")
        if not sesion.codigo_checkin_actual:
            raise ValueError("No hay código de check-in activo.")

        if body.codigo != sesion.codigo_checkin_actual:
            asistencia.intentos_codigo += 1
            asistencia.ultimo_error_codigo = "Código de check-in inválido"
            await self._inducciones.update(asistencia)
            await self._db.commit()
            raise ValueError(f"Código temporal inválido. Intento {asistencia.intentos_codigo} de 5.")

        now = self._now_utc()
        asistencia.checkin_at = now
        asistencia.estado_asistencia = "EN_SESION"
        asistencia.ip_entrada = ip
        asistencia.user_agent_entrada = user_agent
        asistencia.ultimo_error_codigo = None
        # Reiniciar intentos tras éxito
        asistencia.intentos_codigo = 0

        await self._inducciones.update(asistencia)
        await self._audit(
            usuario_id=None,
            sede_id=sesion.sede_id,
            accion="PORTAL_INDUCCION_CHECKIN",
            entidad="GhInduccionAsistencia",
            entidad_id=asistencia.id,
            detalle={"sesion_id": sesion.id},
        )
        await self._db.commit()

        return GhPortalInduccionAccionResponse(
            token=token,
            accion="CHECKIN",
            estado_asistencia=asistencia.estado_asistencia,
            timestamp=now,
        )

    async def portal_induccion_checkout(
        self,
        *,
        token: str,
        body: GhPortalInduccionCodigoRequest,
        ip: str | None,
        user_agent: str | None,
    ) -> GhPortalInduccionAccionResponse:
        asistencia = await self._inducciones.get_asistencia_by_token(token)
        if not asistencia or not asistencia.sesion:
            raise ValueError("Token de inducción inválido.")
        sesion = asistencia.sesion

        if asistencia.intentos_codigo >= 5:
            raise ValueError("Has excedido el máximo de intentos permitidos. Contacta a Gestión Humana.")

        if not asistencia.checkin_at:
            raise ValueError("No puedes registrar salida sin check-in previo.")
        if not sesion.codigo_checkout_actual:
            raise ValueError("No hay código de check-out activo.")

        if body.codigo != sesion.codigo_checkout_actual:
            asistencia.intentos_codigo += 1
            asistencia.ultimo_error_codigo = "Código de check-out inválido"
            await self._inducciones.update(asistencia)
            await self._db.commit()
            raise ValueError(f"Código temporal inválido. Intento {asistencia.intentos_codigo} de 5.")

        now = self._now_utc()
        asistencia.checkout_at = now
        asistencia.estado_asistencia = "CHECKOUT_OK"
        asistencia.ip_salida = ip
        asistencia.user_agent_salida = user_agent
        asistencia.ultimo_error_codigo = None
        # Reiniciar intentos tras éxito
        asistencia.intentos_codigo = 0

        await self._inducciones.update(asistencia)
        await self._audit(
            usuario_id=None,
            sede_id=sesion.sede_id,
            accion="PORTAL_INDUCCION_CHECKOUT",
            entidad="GhInduccionAsistencia",
            entidad_id=asistencia.id,
            detalle={"sesion_id": sesion.id},
        )
        await self._db.commit()

        return GhPortalInduccionAccionResponse(
            token=token,
            accion="CHECKOUT",
            estado_asistencia=asistencia.estado_asistencia,
            timestamp=now,
        )

    async def enviar_links_induccion(self, sesion_id: int, usuario_id: int | None) -> dict:
        sesion = await self._inducciones.get_sesion(sesion_id)
        if not sesion:
            raise ValueError("La sesión de inducción no existe.")

        # Aquí iría la integración real con servicio de correo/WhatsApp
        # Por ahora simulamos el envío para cada asistente
        count = 0
        for asistente in sesion.asistentes:
            if asistente.candidato and asistente.candidato.email:
                # print(f"Enviando link a {asistente.candidato.email}: /portal/induccion/{asistente.token_autogestion}")
                count += 1

        await self._audit(
            usuario_id=usuario_id,
            sede_id=sesion.sede_id,
            accion="ENVIAR_LINKS_INDUCCION",
            entidad="GhSesionInduccion",
            entidad_id=sesion.id,
            detalle={"cantidad_enviados": count},
        )
        await self._db.commit()
        return {"enviados": count}

    async def listar_maestro_dotacion(
        self,
        *,
        sede_id: int | None,
        area: str | None,
        cargo: str | None,
        tipo_contrato: str | None,
        activos_only: bool,
    ) -> list[GhMaestroDotacionResponse]:
        items = await self._dotacion.list_maestro(
            sede_id=sede_id,
            area=area,
            cargo=cargo,
            tipo_contrato=tipo_contrato,
            activos_only=activos_only,
        )
        return [GhMaestroDotacionResponse.model_validate(x) for x in items]

    async def crear_maestro_dotacion(
        self,
        body: GhMaestroDotacionCreateRequest,
        usuario_id: int | None,
    ) -> GhMaestroDotacionResponse:
        item = GhMaestroDotacion(**body.model_dump())
        item = await self._dotacion.create_maestro(item)

        await self._audit(
            usuario_id=usuario_id,
            sede_id=body.sede_id,
            accion="CREAR_MAESTRO_DOTACION",
            entidad="GhMaestroDotacion",
            entidad_id=item.id,
            detalle={"kit_codigo": item.kit_codigo, "cargo": item.cargo},
        )
        await self._db.commit()
        return GhMaestroDotacionResponse.model_validate(item)

    async def actualizar_maestro_dotacion(
        self,
        *,
        item_id: int,
        body: GhMaestroDotacionUpdateRequest,
        usuario_id: int | None,
    ) -> GhMaestroDotacionResponse:
        item = await self._dotacion.get_maestro(item_id)
        if not item:
            raise ValueError("El maestro de dotación no existe.")

        data = body.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(item, key, value)

        await self._dotacion.update(item)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=item.sede_id,
            accion="ACTUALIZAR_MAESTRO_DOTACION",
            entidad="GhMaestroDotacion",
            entidad_id=item.id,
            detalle=data,
        )
        await self._db.commit()
        return GhMaestroDotacionResponse.model_validate(item)

    async def listar_entregas_dotacion(self, estado: str | None) -> list[GhDotacionEntregaResponse]:
        items = await self._dotacion.list_entregas(estado)
        return [self._serialize_dotacion_entrega(x) for x in items]

    async def crear_entrega_dotacion(
        self,
        body: GhDotacionEntregaCreateRequest,
        usuario_id: int | None,
    ) -> GhDotacionEntregaResponse:
        entrega = GhDotacionEntrega(
            candidato_id=body.candidato_id,
            sesion_id=body.sesion_id,
            cita_id=body.cita_id,
            estado_entrega="PENDIENTE",
            observaciones=body.observaciones,
            entregado_por_usuario_id=usuario_id,
        )
        entrega = await self._dotacion.create_entrega(entrega)

        await self._audit(
            usuario_id=usuario_id,
            sede_id=None,
            accion="CREAR_ENTREGA_DOTACION",
            entidad="GhDotacionEntrega",
            entidad_id=entrega.id,
            detalle={"candidato_id": body.candidato_id},
        )
        await self._db.commit()

        entrega = await self._dotacion.get_entrega(entrega.id)
        if not entrega:
            raise ValueError("No fue posible consultar la entrega creada.")
        return self._serialize_dotacion_entrega(entrega)

    async def agregar_detalle_entrega_dotacion(
        self,
        *,
        entrega_id: int,
        body: GhDotacionEntregaDetalleCreateRequest,
        usuario_id: int | None,
    ) -> GhDotacionEntregaResponse:
        entrega = await self._dotacion.get_entrega(entrega_id)
        if not entrega:
            raise ValueError("La entrega de dotación no existe.")

        await self._dotacion.add_detalle_entrega(
            GhDotacionEntregaDetalle(
                entrega_id=entrega_id,
                item_codigo=body.item_codigo,
                item_nombre=body.item_nombre,
                cantidad_esperada=body.cantidad_esperada,
                cantidad_entregada=body.cantidad_entregada,
                estado_item=body.estado_item,
                evidencia_url=body.evidencia_url,
            )
        )

        await self._audit(
            usuario_id=usuario_id,
            sede_id=None,
            accion="AGREGAR_DETALLE_ENTREGA_DOTACION",
            entidad="GhDotacionEntrega",
            entidad_id=entrega_id,
            detalle={"item_codigo": body.item_codigo, "cantidad_entregada": body.cantidad_entregada},
        )
        await self._db.commit()

        entrega = await self._dotacion.get_entrega(entrega_id)
        if not entrega:
            raise ValueError("No fue posible consultar la entrega actualizada.")
        return self._serialize_dotacion_entrega(entrega)

    async def cerrar_entrega_dotacion(
        self,
        *,
        entrega_id: int,
        usuario_id: int | None,
    ) -> GhDotacionEntregaResponse:
        entrega = await self._dotacion.get_entrega(entrega_id)
        if not entrega:
            raise ValueError("La entrega de dotación no existe.")
        if not entrega.detalles:
            raise ValueError("No puedes cerrar una entrega sin detalle de ítems.")

        todos_entregados = all(
            x.estado_item == "ENTREGADO" and x.cantidad_entregada >= x.cantidad_esperada
            for x in entrega.detalles
        )
        entrega.estado_entrega = "COMPLETA" if todos_entregados else "PARCIAL"
        entrega.fecha_entrega = self._now_utc()
        entrega.entregado_por_usuario_id = usuario_id

        await self._dotacion.update(entrega)
        await self._audit(
            usuario_id=usuario_id,
            sede_id=None,
            accion="CERRAR_ENTREGA_DOTACION",
            entidad="GhDotacionEntrega",
            entidad_id=entrega.id,
            detalle={"estado_entrega": entrega.estado_entrega},
        )
        await self._db.commit()

        entrega = await self._dotacion.get_entrega(entrega.id)
        if not entrega:
            raise ValueError("No fue posible consultar la entrega cerrada.")
        return self._serialize_dotacion_entrega(entrega)

    async def dashboard(self, sede_id: int) -> GhDashboardResponse:
        citas_hoy_total = await self._citas.count_citas_hoy(sede_id)
        citas_hoy_confirmadas = await self._citas.count_citas_hoy(sede_id, estado="CONFIRMADA")
        citas_hoy_no_asistio = await self._citas.count_citas_hoy(sede_id, estado="NO_ASISTIO")
        citas_en_curso = await self._citas.count_citas_en_curso(sede_id)

        return GhDashboardResponse(
            citas_hoy_total=citas_hoy_total,
            citas_hoy_confirmadas=citas_hoy_confirmadas,
            citas_hoy_no_asistio=citas_hoy_no_asistio,
            citas_en_curso=citas_en_curso,
        )
