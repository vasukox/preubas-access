"""
KOAJ Access v2.0 — Permoda S.A.S.
Servicio del módulo HSE

Lógica de negocio para:
  - Gestión de autorizaciones
  - Portal de autogestión (wizard)
  - Portal del vigilante (verificación y accesos)
  - Verificación de cumplimiento
  - Excepciones
"""

import secrets
import logging
import re
from datetime import datetime, timezone, timedelta


class HseNotFoundError(ValueError):
    """Recurso HSE no encontrado — el router lo mapea a HTTP 404."""

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.models.hse import (
    HseAutorizacion,
    HseContratista,
    HseClasificacion,
    HseSegSocial,
    HseCertificaciones,
    HseExamenMedico,
    HseContactoEmergencia,
    HseAceptacionNormas,
    HseAcceso,
    HseCumplimiento,
    HseCumplimientoItem,
    HseExcepcion,
)
from app.models.persona import Persona, Proveedor
from app.repositories.hse_repository import (
    AutorizacionRepository,
    ContratistaRepository,
    ClasificacionRepository,
    SegSocialRepository,
    CertificacionesRepository,
    ExamenMedicoRepository,
    ContactoEmergenciaRepository,
    AceptacionNormasRepository,
    AccesoRepository,
    CumplimientoRepository,
    CumplimientoItemRepository,
    ExcepcionRepository,
    HistorialRepository,
    CatEPSRepository,
    CatARLRepository,
    CatAFPRepository,
    NormasRepository,
    SedeRepository,
    ProveedorRepository,
)
from app.schemas.hse import (
    AutorizacionCreateRequest,
    AutorizacionUpdateRequest,
    AutorizacionDenegarRequest,
    ContratistaPreliminarRequest,
    ContratistaTokenRequest,
    ContratistaDenegarRequest,
    ContratistaEliminarRequest,
    ContratistaActualizarProveedorRequest,
    AutogestionValidarTokenResponse,
    DatosPersonalesRequest,
    ClasificacionRequest,
    SegSocialRequest,
    CertificacionesRequest,
    ExamenMedicoRequest,
    ContactoEmergenciaRequest,
    AceptacionNormasRequest,
    AceptacionNormasResponse,
    VerificarAccesoRequest,
    VerificarAccesoResponse,
    RegistrarAccesoRequest,
    CumplimientoIniciarRequest,
    CumplimientoActualizarRequest,
    CumplimientoCerrarRequest,
    CumplimientoListadoResponse,
    ExcepcionCreateRequest,
    ExcepcionLoteCreateRequest,
    ExcepcionUpdateRequest,
    ExcepcionResponse,
    ProveedorHSEOptionResponse,
    ProveedorHSECreateRequest,
    ProveedorHSEUpdateRequest,
    DashboardHSEResponse,
    UploadArchivoResponse,
)
from app.utils.files import save_pdf_upload


# ── Checklist por tipo de contratista ────────────────────────────
CHECKLIST_ALTO_RIESGO = [
    "¿El contratista usó EPP completo durante toda la jornada?",
    "¿Se diligenciaron correctamente los permisos de trabajo?",
    "¿Se cumplió el procedimiento seguro de la actividad?",
    "¿Hubo incidentes o casi-accidentes durante la jornada?",
    "¿Se dejó el área de trabajo en orden y limpia?",
    "¿Se devolvieron todos los equipos de protección?",
    "¿Se cumplió el objetivo de la actividad contratada?",
]

CHECKLIST_NORMAL = [
    "¿Se cumplió el objetivo de la visita o auditoría?",
    "¿El visitante respetó las zonas autorizadas?",
    "¿Se firmó el registro de visitas?",
    "¿Se cumplió con las normas de seguridad de la sede?",
]

EXCEPCION_AUTORIZACION_RE = re.compile(r"^excepci[oó]n\s*hse\s*:", re.IGNORECASE)


class HseService:
    """
    Servicio principal del módulo HSE.
    Instanciar con una sesión de BD por request.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        # Repositorios
        self._autorizacion_repo    = AutorizacionRepository(db)
        self._contratista_repo     = ContratistaRepository(db)
        self._clasificacion_repo   = ClasificacionRepository(db)
        self._seg_social_repo      = SegSocialRepository(db)
        self._certificaciones_repo = CertificacionesRepository(db)
        self._examen_repo          = ExamenMedicoRepository(db)
        self._contacto_repo        = ContactoEmergenciaRepository(db)
        self._aceptacion_repo      = AceptacionNormasRepository(db)
        self._acceso_repo          = AccesoRepository(db)
        self._cumplimiento_repo    = CumplimientoRepository(db)
        self._item_repo            = CumplimientoItemRepository(db)
        self._excepcion_repo       = ExcepcionRepository(db)
        self._historial_repo       = HistorialRepository(db)
        self._eps_repo             = CatEPSRepository(db)
        self._arl_repo             = CatARLRepository(db)
        self._afp_repo             = CatAFPRepository(db)
        self._normas_repo          = NormasRepository(db)
        self._sede_repo            = SedeRepository(db)
        self._proveedor_repo       = ProveedorRepository(db)

    @staticmethod
    def _es_autorizacion_excepcion(descripcion_actividad: str | None) -> bool:
        return bool(EXCEPCION_AUTORIZACION_RE.match((descripcion_actividad or "").strip()))

    @staticmethod
    def _nombre_completo_limpio(nombres: str | None, apellidos: str | None) -> str:
        n = (nombres or "").strip()
        a = (apellidos or "").strip()
        if not a or a.upper() == "N/A":
            return n or "Sin nombre"
        return f"{n} {a}".strip() or "Sin nombre"

    # ═══════════════════════════════════════════════════════════════
    # CATÁLOGOS
    # ═══════════════════════════════════════════════════════════════

    async def get_eps(self):
        return await self._eps_repo.get_activas()

    async def get_arl(self):
        return await self._arl_repo.get_activas()

    async def get_afp(self):
        return await self._afp_repo.get_activas()

    async def get_normas(self, sede_id: int):
        return await self._normas_repo.get_por_sede(sede_id)

    async def get_sedes(self):
        return await self._sede_repo.get_activas()

    async def get_proveedores(self) -> list[ProveedorHSEOptionResponse]:
        proveedores = await self._proveedor_repo.get_activos()
        return [
            ProveedorHSEOptionResponse(
                id=p.id,
                nombre=p.nom_proveedor,
                activo=p.estado_prov,
            )
            for p in proveedores
        ]

    async def crear_proveedor_hse(
        self,
        data: ProveedorHSECreateRequest,
    ) -> ProveedorHSEOptionResponse:
        nit = data.nit.strip()
        nombre = data.nombre.strip()
        if not nit or not nombre:
            raise ValueError("Nombre y NIT del proveedor son obligatorios.")

        existente_result = await self._db.execute(
            select(Proveedor).where(
                Proveedor.nit_proveedor == nit,
                Proveedor.deleted_at == None,  # noqa
            )
        )
        existente = existente_result.scalar_one_or_none()
        if existente:
            raise ValueError("Ya existe un proveedor con ese NIT.")

        nuevo = Proveedor(
            nom_proveedor=nombre,
            nit_proveedor=nit,
            estado_prov=True,
            tratamiento_datos=False,
        )
        self._db.add(nuevo)
        await self._db.flush()
        await self._db.commit()

        return ProveedorHSEOptionResponse(
            id=nuevo.id,
            nombre=nuevo.nom_proveedor,
            activo=nuevo.estado_prov,
        )

    async def actualizar_proveedor_hse(
        self,
        proveedor_id: int,
        data: ProveedorHSEUpdateRequest,
    ) -> ProveedorHSEOptionResponse:
        proveedor = await self._db.get(Proveedor, proveedor_id)
        if not proveedor or proveedor.deleted_at is not None:
            raise HseNotFoundError("Proveedor no encontrado.")

        nit = data.nit.strip()
        nombre = data.nombre.strip()
        if not nit or not nombre:
            raise ValueError("Nombre y NIT del proveedor son obligatorios.")

        if nit != proveedor.nit_proveedor:
            existente_result = await self._db.execute(
                select(Proveedor).where(
                    Proveedor.nit_proveedor == nit,
                    Proveedor.id != proveedor_id,
                    Proveedor.deleted_at == None,  # noqa
                )
            )
            if existente_result.scalar_one_or_none():
                raise ValueError("Ya existe otro proveedor con ese NIT.")

        proveedor.nom_proveedor = nombre
        proveedor.nit_proveedor = nit
        proveedor.estado_prov = data.activo
        await self._db.commit()

        return ProveedorHSEOptionResponse(
            id=proveedor.id,
            nombre=proveedor.nom_proveedor,
            activo=proveedor.estado_prov,
        )

    async def eliminar_proveedor_hse(self, proveedor_id: int) -> None:
        proveedor = await self._db.get(Proveedor, proveedor_id)
        if not proveedor or proveedor.deleted_at is not None:
            raise HseNotFoundError("Proveedor no encontrado.")

        total_contratistas = await self._proveedor_repo.contar_contratistas_asociados(proveedor_id)
        if total_contratistas > 0:
            raise ValueError(
                "No se puede eliminar el proveedor porque tiene contratistas asociados. "
                "Primero elimina o reasigna esos contratistas/autorizaciones."
            )

        total_autorizaciones = await self._proveedor_repo.contar_autorizaciones_asociadas(proveedor_id)
        if total_autorizaciones > 0:
            raise ValueError(
                "No se puede eliminar el proveedor porque tiene autorizaciones asociadas. "
                "Primero elimina o reasigna esas autorizaciones."
            )

        proveedor.deleted_at = datetime.now(timezone.utc)
        await self._db.commit()

    # ═══════════════════════════════════════════════════════════════
    # PANEL GENERAL — Autorizaciones
    # ═══════════════════════════════════════════════════════════════

    async def crear_autorizacion(
        self,
        data:       AutorizacionCreateRequest,
        usuario_id: int,
    ) -> HseAutorizacion:
        """
        Crea una autorización con sus contratistas preliminares.
        Genera un token de autogestión por cada contratista.

        Flujo:
          1. Validar fechas
          2. Generar código único
          3. Crear autorización
          4. Crear contratistas con tokens
        """

        # 1. Validar fechas
        if data.fecha_fin < data.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio.")

        # 2. Generar código
        codigo = await self._autorizacion_repo.generar_codigo(data.sede_id)

        # 3. Crear autorización
        autorizacion = HseAutorizacion(
            codigo                 = codigo,
            proveedor_id           = data.proveedor_id,
            sede_id                = data.sede_id,
            creado_por             = usuario_id,
            responsable_interno_id = data.responsable_interno_id,
            tipo_contratista       = data.tipo_contratista,
            descripcion_actividad  = data.descripcion_actividad,
            fecha_inicio           = data.fecha_inicio,
            fecha_fin              = data.fecha_fin,
            estado                 = "PENDIENTE_AUTOGESTION",
        )
        await self._autorizacion_repo.create(autorizacion)

        # 4. Crear contratistas con tokens
        for c in data.contratistas:
            token     = secrets.token_urlsafe(32)
            expira_en = datetime.now(timezone.utc) + timedelta(hours=48)

            contratista = HseContratista(
                autorizacion_id      = autorizacion.id,
                tipo_documento       = c.tipo_documento,
                numero_documento     = c.numero_documento,
                nombres              = c.nombres,
                apellidos            = c.apellidos,
                email                = c.email,
                telefono             = c.telefono,
                es_extranjero        = c.es_extranjero,
                estado               = "PENDIENTE_AUTOGESTION",
                token_autogestion    = token,
                token_expira_en      = expira_en,
                token_duracion_horas = 48,
            )
            await self._contratista_repo.create(contratista)

        await self._db.commit()
        return await self._autorizacion_repo.get_with_contratistas(autorizacion.id)

    async def listar_autorizaciones(
        self,
        sede_id: int,
        estado:  str | None = None,
        skip:    int = 0,
        limit:   int = 20,
    ) -> tuple[list[HseAutorizacion], int]:
        items = await self._autorizacion_repo.listar_por_sede(sede_id, estado, skip, limit)
        cambios = False
        for auth in items:
            if not self._es_autorizacion_excepcion(auth.descripcion_actividad):
                continue

            if auth.estado != "APROBADO":
                auth.estado = "APROBADO"
                await self._autorizacion_repo.update(auth)
                cambios = True

            for c in (auth.contratistas or []):
                if c.estado != "APROBADO":
                    c.estado = "APROBADO"
                    await self._contratista_repo.update(c)
                    cambios = True

        if cambios:
            await self._db.commit()

        total = await self._autorizacion_repo.contar_por_sede(sede_id, estado)
        return items, total

    async def get_autorizacion(self, autorizacion_id: int) -> HseAutorizacion:
        auth = await self._autorizacion_repo.get_with_contratistas(autorizacion_id)
        if not auth:
            raise HseNotFoundError("Autorización no encontrada.")
        return auth

    async def actualizar_autorizacion(
        self,
        autorizacion_id: int,
        data:            AutorizacionUpdateRequest,
    ) -> HseAutorizacion:
        auth = await self._autorizacion_repo.get_by_id(autorizacion_id)
        if not auth:
            raise HseNotFoundError("Autorización no encontrada.")

        if auth.estado not in ("BORRADOR", "PENDIENTE_AUTOGESTION"):
            raise ValueError("Solo se pueden editar autorizaciones en estado BORRADOR o PENDIENTE_AUTOGESTION.")

        for key, value in data.model_dump(exclude_none=True).items():
            setattr(auth, key, value)

        await self._autorizacion_repo.update(auth)
        await self._db.commit()
        return auth

    async def eliminar_autorizacion(self, autorizacion_id: int) -> None:
        auth = await self._autorizacion_repo.get_by_id(autorizacion_id)
        if not auth:
            raise HseNotFoundError("Autorización no encontrada.")

        tiene_cumplimiento = await self._cumplimiento_repo.existe_por_autorizacion(autorizacion_id)
        if tiene_cumplimiento:
            raise ValueError(
                "No se puede eliminar la autorización porque ya tiene verificaciones de cumplimiento iniciadas."
            )

        await self._autorizacion_repo.delete(auth)
        await self._db.commit()

    # ═══════════════════════════════════════════════════════════════
    # GESTIÓN HSE — Revisión y aprobación
    # ═══════════════════════════════════════════════════════════════

    async def get_contratista_detalle(self, contratista_id: int) -> HseContratista:
        contratista = await self._contratista_repo.get_detalle_completo(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        proveedor_id = autorizacion.proveedor_id if autorizacion else None
        proveedor_nombre = None
        if proveedor_id:
            proveedor = await self._db.get(Proveedor, proveedor_id)
            if proveedor and proveedor.deleted_at is None:
                proveedor_nombre = proveedor.nom_proveedor

        # Atributos dinámicos para serialización en ContratistaDetalleResponse.
        setattr(contratista, "proveedor_id", proveedor_id)
        setattr(contratista, "proveedor_nombre", proveedor_nombre)
        return contratista

    async def actualizar_proveedor_contratista(
        self,
        contratista_id: int,
        data: ContratistaActualizarProveedorRequest,
    ) -> HseContratista:
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        if await self._acceso_repo.esta_dentro(contratista_id):
            raise ValueError(
                "No se puede cambiar la empresa/proveedor porque el contratista está actualmente dentro de la sede."
            )

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("Autorización no encontrada para el contratista.")

        if data.proveedor_id is not None:
            proveedor = await self._db.get(Proveedor, data.proveedor_id)
            if not proveedor or proveedor.deleted_at is not None:
                raise HseNotFoundError("Proveedor no encontrado.")
            if not proveedor.estado_prov:
                raise ValueError("No se puede asignar un proveedor inactivo.")

        autorizacion.proveedor_id = data.proveedor_id
        await self._autorizacion_repo.update(autorizacion)
        await self._db.commit()

        return await self.get_contratista_detalle(contratista_id)

    async def _sincronizar_estado_autorizacion(self, autorizacion_id: int) -> None:
        """
        Recalcula y actualiza el estado de la autorización
        basándose en el estado actual de todos sus contratistas.

        IMPORTANTE: Consulta estados directamente con SQL escalar para evitar
        que el identity map (cache) de SQLAlchemy devuelva valores obsoletos
        tras un UPDATE bulk (cambiar_estado).

        Reglas:
          - Alguno AUTOGESTION_COMPLETADA o EN_REVISION → EN_REVISION
          - Todos APROBADO                              → APROBADO
          - Mix APROBADO + DENEGADO (sin pendientes)    → APROBADO
          - Todos DENEGADO                              → DENEGADO
          - Cualquier otro caso                         → PENDIENTE_AUTOGESTION
        """
        from sqlalchemy import select as _select

        # Adquirir el lock en la autorización PRIMERO para serializar cualquier
        # sincronización concurrente sobre la misma autorización.
        # Dos requests que aprueben contratistas al mismo tiempo bloquearán aquí
        # de forma secuencial: el segundo leerá los estados ya actualizados por el
        # primero, evitando así sobrescribir el estado con datos obsoletos.
        res_auth = await self._db.execute(
            _select(HseAutorizacion.estado)
            .where(HseAutorizacion.id == autorizacion_id)
            .with_for_update()
        )
        estado_actual = res_auth.scalar_one_or_none()

        # Consultar estados de contratistas DENTRO del lock para garantizar
        # que reflejan la realidad en el momento en que tenemos control exclusivo.
        res_estados = await self._db.execute(
            _select(HseContratista.estado)
            .where(
                HseContratista.autorizacion_id == autorizacion_id,
                HseContratista.deleted_at      == None,  # noqa
            )
        )
        estados = list(res_estados.scalars().all())
        logger.info("[SYNC] autorizacion_id=%s estados_contratistas=%s", autorizacion_id, estados)

        if not estados:
            return

        if any(e in ("AUTOGESTION_COMPLETADA", "EN_REVISION") for e in estados):
            nuevo = "EN_REVISION"
        elif all(e == "APROBADO" for e in estados):
            nuevo = "APROBADO"
        elif all(e in ("APROBADO", "DENEGADO") for e in estados) and any(e == "APROBADO" for e in estados):
            nuevo = "APROBADO"
        elif all(e == "DENEGADO" for e in estados):
            nuevo = "DENEGADO"
        else:
            nuevo = "PENDIENTE_AUTOGESTION"

        logger.info("[SYNC] autorizacion_id=%s estado_actual=%s nuevo=%s", autorizacion_id, estado_actual, nuevo)
        if estado_actual != nuevo:
            await self._autorizacion_repo.cambiar_estado(autorizacion_id, nuevo)
            logger.info("[SYNC] autorizacion_id=%s actualizada a %s", autorizacion_id, nuevo)

    async def aprobar_contratista(
        self,
        contratista_id: int,
        usuario_id:     int,
    ) -> None:
        """Aprueba un contratista para que pueda ingresar."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        if contratista.estado != "AUTOGESTION_COMPLETADA":
            raise ValueError(
                "Solo se pueden aprobar contratistas que hayan completado la autogestión."
            )

        estado_anterior = contratista.estado
        autorizacion_id = contratista.autorizacion_id
        await self._contratista_repo.cambiar_estado(contratista_id, "APROBADO")

        await self._historial_repo.registrar(
            contratista_id  = contratista_id,
            usuario_id      = usuario_id,
            estado_anterior = estado_anterior,
            estado_nuevo    = "APROBADO",
        )
        await self._sincronizar_estado_autorizacion(autorizacion_id)
        await self._db.commit()

    async def denegar_contratista(
        self,
        contratista_id: int,
        data:           ContratistaDenegarRequest,
        usuario_id:     int,
    ) -> None:
        """
        Deniega un contratista.
        El mismo token se reactiva para que corrija lo que falta.
        """
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        estado_anterior = contratista.estado
        autorizacion_id = contratista.autorizacion_id

        # Generar NUEVO token con nueva expiración para que el contratista
        # pueda corregir su información desde un link fresco.
        duracion = contratista.token_duracion_horas or 48
        nuevo_token  = secrets.token_urlsafe(32)
        nueva_expira = datetime.now(timezone.utc) + timedelta(hours=duracion)
        await self._contratista_repo.actualizar_token(
            contratista_id  = contratista_id,
            token           = nuevo_token,
            expira_en       = nueva_expira,
            duracion_horas  = duracion,
        )

        await self._contratista_repo.cambiar_estado(
            contratista_id, "DENEGADO", data.motivo
        )

        await self._historial_repo.registrar(
            contratista_id  = contratista_id,
            usuario_id      = usuario_id,
            estado_anterior = estado_anterior,
            estado_nuevo    = "DENEGADO",
            motivo          = data.motivo,
        )
        await self._sincronizar_estado_autorizacion(autorizacion_id)
        await self._db.commit()

    async def renovar_token(
        self,
        contratista_id: int,
        data:           ContratistaTokenRequest,
    ) -> str:
        """Genera un nuevo token con duración personalizada."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        nuevo_token = secrets.token_urlsafe(32)
        expira_en   = datetime.now(timezone.utc) + timedelta(hours=data.duracion_horas)

        await self._contratista_repo.actualizar_token(
            contratista_id  = contratista_id,
            token           = nuevo_token,
            expira_en       = expira_en,
            duracion_horas  = data.duracion_horas,
        )
        await self._db.commit()
        return nuevo_token

    async def eliminar_contratista(
        self,
        contratista_id: int,
        data:           ContratistaEliminarRequest,
        usuario_id:     int,
    ) -> None:
        """
        Elimina (soft delete) un contratista de una autorización.

        - Registra la acción en HseHistorial con estado_nuevo='ELIMINADO',
          el motivo y los datos del contratista para trazabilidad completa.
        - Sincroniza el estado de la autorización padre.
        """
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        estado_anterior = contratista.estado
        autorizacion_id = contratista.autorizacion_id

        # Registrar ANTES del soft-delete para que el FK siga válido.
        # La entrada queda inmutable en historial para trazabilidad futura.
        await self._historial_repo.registrar(
            contratista_id  = contratista_id,
            usuario_id      = usuario_id,
            estado_anterior = estado_anterior,
            estado_nuevo    = "ELIMINADO",
            motivo          = data.motivo,
            metadata        = {
                "accion":           "ELIMINACION_MANUAL",
                "nombres":          contratista.nombres,
                "apellidos":        contratista.apellidos,
                "tipo_documento":   contratista.tipo_documento,
                "numero_documento": contratista.numero_documento,
                "email":            contratista.email,
            },
        )

        # Soft delete del contratista (y sus subtablas en cascada)
        await self._contratista_repo.delete(contratista)
        await self._db.flush()

        # Recalcular estado de la autorización sin el contratista eliminado
        await self._sincronizar_estado_autorizacion(autorizacion_id)
        await self._db.commit()

    # ═══════════════════════════════════════════════════════════════
    # PORTAL AUTOGESTIÓN — Wizard
    # ═══════════════════════════════════════════════════════════════

    _UPLOAD_FIELDS: dict[str, set[str]] = {
        "clasificacion": {
            "alturas_cert_archivo",
            "confinados_cert_archivo",
            "electrico_matricula_archivo",
            "caliente_extintor_archivo",
            "caliente_permiso_archivo",
            "izaje_inspeccion_archivo",
            "izaje_doc_legal_archivo",
            "izaje_licencia_archivo",
            "extran_poliza_archivo",
            "residuos_plan_archivo",
        },
        "seg_social": {
            "pila_archivo",
        },
        "certificaciones": {
            "art_archivo",
            "permiso_archivo",
        },
        "examen": {
            "archivo",
        },
    }

    async def subir_archivo_autogestion(
        self,
        *,
        contratista_id: int,
        modulo: str,
        campo: str,
        archivo: UploadFile,
    ) -> UploadArchivoResponse:
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        modulo_key = (modulo or "").strip().lower()
        campo_key = (campo or "").strip()
        campos_permitidos = self._UPLOAD_FIELDS.get(modulo_key)
        if not campos_permitidos:
            raise ValueError("Módulo de carga inválido.")

        if campo_key not in campos_permitidos:
            raise ValueError("Campo de archivo inválido para el módulo seleccionado.")

        ruta_relativa, size = await save_pdf_upload(
            file=archivo,
            folder=f"hse/autogestion/{contratista_id}/{modulo_key}",
            filename_prefix=campo_key,
        )

        return UploadArchivoResponse(
            modulo=modulo_key,
            campo=campo_key,
            path=ruta_relativa,
            filename=archivo.filename or "archivo.pdf",
            content_type=archivo.content_type or "application/pdf",
            size_bytes=size,
        )

    async def validar_token_autogestion(
        self,
        token: str,
        *,
        allow_closed_states: bool = False,
        advance_to_in_progress: bool = True,
    ) -> HseContratista:
        """
        Valida el token y retorna los datos del contratista
        para pre-llenar el wizard.
        """
        contratista = await self._contratista_repo.get_by_token(token)
        if not contratista:
            raise ValueError("El link de autogestión es inválido o ha expirado.")

        if not allow_closed_states:
            if contratista.estado == "APROBADO":
                raise ValueError("Tu autorización ya fue aprobada. No necesitas completar el formulario.")

            if contratista.estado == "AUTOGESTION_COMPLETADA":
                raise ValueError(
                    "Ya enviaste tu autogestión y está en revisión del administrador HSE."
                )

        # Actualizar estado a EN_PROGRESO si estaba PENDIENTE y resincronizar
        # la autorización padre para que el panel HSE refleje el cambio.
        if advance_to_in_progress and contratista.estado == "PENDIENTE_AUTOGESTION":
            autorizacion_id = contratista.autorizacion_id  # capturar antes del flush (evita MissingGreenlet)
            await self._contratista_repo.cambiar_estado(
                contratista.id, "AUTOGESTION_EN_PROGRESO"
            )
            await self._db.flush()
            await self._sincronizar_estado_autorizacion(autorizacion_id)
            await self._db.commit()

        return await self._contratista_repo.get_detalle_completo(contratista.id)

    async def validar_token_autogestion_editable(self, token: str) -> HseContratista:
        """Valida token para endpoints que modifican información del wizard."""
        return await self.validar_token_autogestion(
            token,
            allow_closed_states=False,
            advance_to_in_progress=True,
        )

    async def get_autogestion_token_data(
        self,
        token: str,
    ) -> AutogestionValidarTokenResponse:
        """Retorna el payload completo del wizard para un token válido."""
        contratista = await self.validar_token_autogestion(
            token,
            allow_closed_states=True,
            advance_to_in_progress=True,
        )

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        empresa_proveedor: str | None = None
        if autorizacion.proveedor_id:
            proveedor = await self._db.get(Proveedor, autorizacion.proveedor_id)
            if proveedor:
                empresa_proveedor = proveedor.nom_proveedor

        return AutogestionValidarTokenResponse(
            contratista_id        = contratista.id,
            autorizacion_id       = contratista.autorizacion_id,
            tipo_documento        = contratista.tipo_documento,
            numero_documento      = contratista.numero_documento,
            nombres               = contratista.nombres,
            apellidos             = contratista.apellidos,
            email                 = contratista.email,
            telefono              = contratista.telefono,
            es_extranjero         = contratista.es_extranjero,
            estado                = contratista.estado,
            sede_id               = autorizacion.sede_id,
            tipo_contratista      = autorizacion.tipo_contratista,
            empresa_proveedor     = empresa_proveedor,
            descripcion_actividad = autorizacion.descripcion_actividad,
            fecha_inicio          = autorizacion.fecha_inicio,
            fecha_fin             = autorizacion.fecha_fin,
            clasificacion         = contratista.clasificacion,
            seguridad_social      = contratista.seguridad_social or [],
            certificaciones       = contratista.certificaciones,
            examen_medico         = contratista.examen_medico,
            contacto_emergencia   = contratista.contacto_emergencia,
            aceptacion_normas     = contratista.aceptacion_normas,
        )

    async def guardar_datos_personales(
        self,
        contratista_id: int,
        data:           DatosPersonalesRequest,
    ) -> HseContratista:
        """Paso 2 del wizard — actualiza datos personales."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        if not data.tratamiento_datos:
            raise ValueError("Debes aceptar el tratamiento de datos para guardar este paso.")

        if not data.telefono or not data.telefono.strip():
            raise ValueError("Debes diligenciar el teléfono del contratista.")

        if not data.sst_responsable_nombre or not data.sst_responsable_nombre.strip():
            raise ValueError("Debes diligenciar el nombre del responsable SST.")

        if not data.sst_responsable_telefono or not data.sst_responsable_telefono.strip():
            raise ValueError("Debes diligenciar el teléfono del responsable SST.")

        # Campos pre-llenados por el admin — el contratista NO puede modificarlos.
        CAMPOS_BLOQUEADOS = {"tipo_documento", "numero_documento", "nombres", "apellidos", "email"}
        for key, value in data.model_dump(exclude_none=True).items():
            if key in CAMPOS_BLOQUEADOS:
                continue
            if hasattr(contratista, key):
                setattr(contratista, key, value)

        await self._contratista_repo.update(contratista)
        await self._db.commit()
        return contratista

    async def guardar_clasificacion(
        self,
        contratista_id: int,
        data:           ClasificacionRequest,
    ) -> HseClasificacion:
        """Paso 3 del wizard — clasificación de actividad."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        if not contratista.telefono:
            raise ValueError("Debes completar primero el paso 2 (datos personales).")

        if not contratista.sst_responsable_nombre or not contratista.sst_responsable_telefono:
            raise ValueError("Debes completar primero el responsable SST en el paso 2.")

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        es_alto_riesgo = autorizacion.tipo_contratista == "ALTO_RIESGO"
        respuestas = data.model_dump()
        if es_alto_riesgo:
            claves = [
                "trabajo_alturas",
                "espacios_confinados",
                "trabajo_electrico",
                "trabajo_caliente",
                "izaje_maquinaria",
            ]
            if not any(bool(respuestas.get(k)) for k in claves):
                raise ValueError(
                    "Debes marcar al menos una actividad de alto riesgo en la clasificación."
                )
        else:
            claves = ["visita_sin_riesgo", "personal_extranjero", "genera_residuos"]
            if not any(bool(respuestas.get(k)) for k in claves):
                raise ValueError(
                    "Debes marcar al menos una actividad aplicable en la clasificación."
                )

        hoy = datetime.now(timezone.utc).date()

        if data.trabajo_alturas:
            if not data.alturas_nivel:
                raise ValueError("Paso 3: para trabajo en alturas debes seleccionar el nivel del certificado.")
            if not data.alturas_cert_fecha_venc:
                raise ValueError("Paso 3: para trabajo en alturas debes ingresar la fecha de vencimiento del certificado.")
            if data.alturas_cert_fecha_venc < hoy:
                raise ValueError("Paso 3: el certificado de alturas debe estar vigente.")
            if not data.alturas_cert_archivo:
                raise ValueError("Paso 3: para trabajo en alturas debes adjuntar el PDF del certificado.")

        if data.espacios_confinados:
            if not data.confinados_rol:
                raise ValueError("Paso 3: para espacios confinados debes seleccionar el rol.")
            if not data.confinados_cert_fecha:
                raise ValueError("Paso 3: para espacios confinados debes ingresar la fecha del certificado.")
            if not data.confinados_cert_archivo:
                raise ValueError("Paso 3: para espacios confinados debes adjuntar el PDF del certificado.")

        if data.trabajo_electrico:
            if not data.electrico_matricula_contec:
                raise ValueError("Paso 3: para trabajo eléctrico debes seleccionar la matrícula CONTEC.")
            if not data.electrico_num_matricula or not data.electrico_num_matricula.strip():
                raise ValueError("Paso 3: para trabajo eléctrico debes ingresar el número de matrícula.")
            if not data.electrico_matricula_venc:
                raise ValueError("Paso 3: para trabajo eléctrico debes ingresar la fecha de vencimiento.")
            if not data.electrico_matricula_archivo:
                raise ValueError("Paso 3: para trabajo eléctrico debes adjuntar el PDF de la matrícula.")

        if data.trabajo_caliente:
            if not data.caliente_extintor_fecha:
                raise ValueError("Paso 3: para trabajo en caliente debes ingresar la fecha de extintor CO₂.")
            if not data.caliente_extintor_archivo:
                raise ValueError("Paso 3: para trabajo en caliente debes adjuntar el PDF del certificado de extintor.")
            if not data.caliente_permiso_fecha:
                raise ValueError("Paso 3: para trabajo en caliente debes ingresar la fecha del permiso.")
            if not data.caliente_permiso_archivo:
                raise ValueError("Paso 3: para trabajo en caliente debes adjuntar el PDF del permiso.")

        if data.izaje_maquinaria:
            if not data.izaje_tipo_equipo or not data.izaje_tipo_equipo.strip():
                raise ValueError("Paso 3: para izaje de maquinaria debes indicar el tipo de equipo.")
            if not data.izaje_inspeccion_archivo:
                raise ValueError("Paso 3: para izaje de maquinaria debes adjuntar el PDF de inspección pre-operacional.")
            if not data.izaje_doc_legal_archivo:
                raise ValueError("Paso 3: para izaje de maquinaria debes adjuntar el PDF de documentos legales.")
            if not data.izaje_licencia_archivo:
                raise ValueError("Paso 3: para izaje de maquinaria debes adjuntar el PDF de licencia del operador.")

        if data.personal_extranjero:
            if not data.extran_aseguradora or not data.extran_aseguradora.strip():
                raise ValueError("Paso 3: para personal extranjero debes indicar la aseguradora.")
            if not data.extran_num_poliza or not data.extran_num_poliza.strip():
                raise ValueError("Paso 3: para personal extranjero debes ingresar el número de póliza.")
            if not data.extran_poliza_venc:
                raise ValueError("Paso 3: para personal extranjero debes ingresar la fecha de vencimiento de la póliza.")
            if not data.extran_poliza_archivo:
                raise ValueError("Paso 3: para personal extranjero debes adjuntar el PDF de la póliza.")

        if data.genera_residuos:
            if not data.residuos_tipo or not data.residuos_tipo.strip():
                raise ValueError("Paso 3: cuando se generan residuos debes indicar el tipo.")
            if not data.residuos_plan_archivo:
                raise ValueError("Paso 3: cuando se generan residuos debes adjuntar el PDF del plan de manejo.")

        clasificacion = await self._clasificacion_repo.upsert(
            contratista_id = contratista_id,
            datos          = data.model_dump(),
        )
        await self._db.commit()
        return clasificacion

    async def guardar_seguridad_social(
        self,
        contratista_id: int,
        data:           SegSocialRequest,
    ) -> list[HseSegSocial]:
        """
        Paso 4 del wizard — seguridad social.
        Reemplaza todos los registros anteriores.
        """
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        clasificacion = await self._clasificacion_repo.get_by_contratista(contratista_id)
        if not clasificacion:
            raise ValueError("Debes completar primero el paso 3 (clasificación).")

        for idx, item in enumerate(data.personas, start=1):
            if not item.eps_id:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener EPS.")
            if not item.arl_id:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener ARL.")
            if not item.afp_id:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener AFP.")
            if not item.eps_vigencia:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener vigencia EPS.")
            if not item.arl_vigencia:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener vigencia ARL.")
            if not item.afp_vigencia:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener vigencia AFP.")
            if not item.pila_tipo:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener tipo PILA.")
            if not item.pila_estado:
                raise ValueError(f"Paso 4: la persona #{idx} debe tener estado PILA.")
            if not item.pila_archivo:
                raise ValueError(f"Paso 4: la persona #{idx} debe adjuntar la planilla PILA en PDF.")

            if item.pila_tipo not in {"INTEGRADA", "MANUAL", "NO_APLICA"}:
                raise ValueError(
                    f"Paso 4: la persona #{idx} tiene tipo PILA inválido. Usa INTEGRADA, MANUAL o NO_APLICA."
                )

            if item.pila_estado not in {"PENDIENTE", "PAGADA", "VENCIDA"}:
                raise ValueError(
                    f"Paso 4: la persona #{idx} tiene estado PILA inválido. Usa PENDIENTE, PAGADA o VENCIDA."
                )

        # Eliminar registros anteriores y crear nuevos
        await self._seg_social_repo.eliminar_por_contratista(contratista_id)

        nuevos = []
        for item in data.personas:
            nuevo = HseSegSocial(
                contratista_id = contratista_id,
                **item.model_dump(),
            )
            await self._seg_social_repo.create(nuevo)
            nuevos.append(nuevo)

        await self._db.commit()
        return nuevos

    async def guardar_certificaciones(
        self,
        contratista_id: int,
        data:           CertificacionesRequest,
    ) -> HseCertificaciones:
        """Paso 5 del wizard."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        clasificacion = await self._clasificacion_repo.get_by_contratista(contratista_id)
        if not clasificacion:
            raise ValueError("Debes completar primero el paso 3 (clasificación).")

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        # Para ALTO_RIESGO, seguridad social debe existir antes de certificaciones.
        if autorizacion.tipo_contratista == "ALTO_RIESGO":
            seg_social = await self._seg_social_repo.get_by_contratista(contratista_id)
            if not seg_social:
                raise ValueError("Debes completar primero el paso 4 (seguridad social).")

        # En ALTO_RIESGO, certificaciones requiere ART (sin duplicar documentos
        # ya exigidos en clasificación como altura/caliente/eléctrico/etc.).
        if autorizacion.tipo_contratista == "ALTO_RIESGO":
            if not data.art_descripcion_tarea or not data.art_descripcion_tarea.strip():
                raise ValueError("Paso 5: la descripción de tarea (ART) es obligatoria.")

            if not data.art_archivo:
                raise ValueError("Paso 5: debes adjuntar el PDF de la ART diligenciada.")

        # Permiso (tipo/fecha/archivo) es opcional, pero si se diligencia debe ser completo.
        permiso_fields = [data.permiso_tipo, data.permiso_fecha, data.permiso_archivo]
        if any(permiso_fields) and not all(permiso_fields):
            raise ValueError(
                "Paso 5: si diligencias permiso de trabajo debes completar tipo, fecha y archivo PDF."
            )

        cert = await self._certificaciones_repo.upsert(
            contratista_id = contratista_id,
            datos          = data.model_dump(),
        )
        await self._db.commit()
        return cert

    async def guardar_examen_medico(
        self,
        contratista_id: int,
        data:           ExamenMedicoRequest,
    ) -> HseExamenMedico:
        """Paso 6 del wizard — solo ALTO_RIESGO."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        if autorizacion.tipo_contratista != "ALTO_RIESGO":
            raise ValueError("El examen médico solo aplica para contratistas de ALTO_RIESGO.")

        certificaciones = await self._certificaciones_repo.get_by_contratista(contratista_id)
        if not certificaciones:
            raise ValueError("Debes completar primero el paso 5 (certificaciones).")

        if not data.fecha_examen:
            raise ValueError("Paso 6: la fecha del examen es obligatoria.")

        if not data.concepto:
            raise ValueError("Paso 6: el concepto médico es obligatorio.")

        if data.concepto == "APTO_CON_RESTRICCION" and (
            not data.descripcion_restriccion or not data.descripcion_restriccion.strip()
        ):
            raise ValueError(
                "Paso 6: debes describir la restricción cuando el concepto es APTO_CON_RESTRICCION."
            )

        if not data.archivo:
            raise ValueError("Paso 6: debes adjuntar el PDF del examen médico ocupacional.")

        examen = await self._examen_repo.upsert(
            contratista_id = contratista_id,
            datos          = data.model_dump(),
        )
        await self._db.commit()
        return examen

    async def guardar_contacto_emergencia(
        self,
        contratista_id: int,
        data:           ContactoEmergenciaRequest,
    ) -> HseContactoEmergencia:
        """Paso 7 del wizard."""
        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        if autorizacion.tipo_contratista == "ALTO_RIESGO":
            certificaciones = await self._certificaciones_repo.get_by_contratista(contratista_id)
            if not certificaciones:
                raise ValueError("Debes completar primero el paso 5 (certificaciones).")

            examen = await self._examen_repo.get_by_contratista(contratista_id)
            if not examen:
                raise ValueError("Debes completar primero el paso 6 (examen médico).")

        if data.relacion == "OTRO" and (not data.relacion_otro or not data.relacion_otro.strip()):
            raise ValueError("Paso 7: debes especificar la relación cuando seleccionas OTRO.")

        if not data.rh_sanguineo:
            raise ValueError("Paso 7: el RH sanguíneo es obligatorio.")

        if not data.eps_contratista or not data.eps_contratista.strip():
            raise ValueError("Paso 7: la EPS del contratista es obligatoria.")

        contacto = await self._contacto_repo.upsert(
            contratista_id = contratista_id,
            datos          = data.model_dump(),
        )
        await self._db.commit()
        return contacto

    async def _validar_autogestion_completa(self, contratista_id: int) -> tuple[bool, str | None]:
        """
        Valida que todos los pasos de autogestión estén completos.
        
        Retorna:
            (es_válido, mensaje_error_si_falta_algo)
        
        Pasos requeridos:
            1. Datos personales (actualización en contratista)
            2. Clasificación de actividad
            3. Seguridad social
            4. Certificaciones
            5. Examen médico (si es ALTO_RIESGO)
            6. Contacto de emergencia
            7. Aceptación de normas (se valida después de esto)
        """
        
        # Obtener datos con relaciones para validar
        contratista = await self._contratista_repo.get_detalle_completo(contratista_id)
        if not contratista:
            return False, "Contratista no encontrado."
        
        # Validar paso 1: Datos personales
        campos_obligatorios_personales = [
            contratista.tipo_documento,
            contratista.numero_documento,
            contratista.nombres,
            contratista.apellidos,
            contratista.email,
            contratista.telefono,
            contratista.sst_responsable_nombre,
            contratista.sst_responsable_telefono,
        ]
        if not all(campos_obligatorios_personales):
            return False, "Paso 1: Faltan datos personales o información del responsable SST."
        
        # Validar paso 2: Clasificación de actividad
        clasificacion = await self._clasificacion_repo.get_by_contratista(contratista_id)
        if not clasificacion:
            return False, "Paso 2: No completaste la clasificación de actividad."

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            return False, "No fue posible validar la autorización asociada."

        if autorizacion.tipo_contratista == "ALTO_RIESGO":
            if not any([
                bool(clasificacion.trabajo_alturas),
                bool(clasificacion.espacios_confinados),
                bool(clasificacion.trabajo_electrico),
                bool(clasificacion.trabajo_caliente),
                bool(clasificacion.izaje_maquinaria),
            ]):
                return False, "Paso 2: Debes marcar al menos una actividad de alto riesgo."
        else:
            if not any([
                bool(clasificacion.visita_sin_riesgo),
                bool(clasificacion.personal_extranjero),
                bool(clasificacion.genera_residuos),
            ]):
                return False, "Paso 2: Debes marcar al menos una actividad aplicable."
        
        if autorizacion.tipo_contratista == "ALTO_RIESGO":
            # Validar paso 3: Seguridad social
            seg_social = await self._seg_social_repo.get_by_contratista(contratista_id)
            if not seg_social or len(seg_social) == 0:
                return False, "Paso 3: No completaste la información de seguridad social."

            for idx, persona in enumerate(seg_social, start=1):
                if not persona.eps_id or not persona.arl_id or not persona.afp_id:
                    return False, f"Paso 3: La persona #{idx} no tiene EPS/ARL/AFP completos."
                if not persona.eps_vigencia or not persona.arl_vigencia or not persona.afp_vigencia:
                    return False, f"Paso 3: La persona #{idx} no tiene vigencias completas."
                if not persona.pila_tipo or not persona.pila_estado:
                    return False, f"Paso 3: La persona #{idx} no tiene información PILA completa."
                if not persona.pila_archivo:
                    return False, f"Paso 3: La persona #{idx} debe adjuntar la planilla PILA en PDF."

            # Validar paso 4: Certificaciones
            certificaciones = await self._certificaciones_repo.get_by_contratista(contratista_id)
            if not certificaciones:
                return False, "Paso 4: No completaste la información de certificaciones."

            if not certificaciones.art_descripcion_tarea:
                return False, "Paso 4: Falta la descripción de tarea (ART)."
            if not certificaciones.art_archivo:
                return False, "Paso 4: Falta el archivo PDF de la ART diligenciada."

            # Validar paso 5: Examen médico (solo ALTO_RIESGO)
            examen = await self._examen_repo.get_by_contratista(contratista_id)
            if not examen:
                return False, "Paso 5: Como contratista de ALTO RIESGO, debes completar el examen médico."
            if not examen.fecha_examen:
                return False, "Paso 5: Falta la fecha del examen médico."
            if not examen.concepto:
                return False, "Paso 5: Falta el concepto del examen médico."
            if examen.concepto == "APTO_CON_RESTRICCION" and not examen.descripcion_restriccion:
                return False, "Paso 5: Falta la descripción de la restricción médica."
        
        # Validar paso 6: Contacto de emergencia
        contacto = await self._contacto_repo.get_by_contratista(contratista_id)
        if not contacto:
            return False, "Paso 6: No completaste los datos del contacto de emergencia."

        if contacto.relacion == "OTRO" and not contacto.relacion_otro:
            return False, "Paso 6: Falta especificar la relación del contacto de emergencia."
        if not contacto.rh_sanguineo:
            return False, "Paso 6: Falta el RH sanguíneo del contratista."
        if not contacto.eps_contratista:
            return False, "Paso 6: Falta la EPS del contratista para emergencias."
        
        # Si llegamos aquí, todos los pasos están completos
        return True, None

    async def guardar_aceptacion_normas(
        self,
        contratista_id: int,
        data:           AceptacionNormasRequest,
        ip_address:     str | None = None,
    ) -> AceptacionNormasResponse:
        """
        Paso 8 del wizard — firma digital.
        Si acepto_normas y acepto_datos → marca autogestión como completada.
        
        VALIDACIÓN: Antes de marcar como completada, verifica que todos los pasos anteriores se completaron.
        """
        if not data.acepto_normas or not data.acepto_datos:
            raise ValueError(
                "Debes aceptar las normas de seguridad y el tratamiento de datos para continuar."
            )

        contratista = await self._contratista_repo.get_by_id(contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        # 🔐 VALIDACIÓN DE INTEGRIDAD: Verificar que TODOS los pasos anteriores estén completos
        es_valido, mensaje_error = await self._validar_autogestion_completa(contratista_id)
        if not es_valido:
            raise ValueError(
                f"No puedes completar la autogestión. {mensaje_error}\n\n"
                f"Por favor, completa todos los pasos del formulario antes de continuar."
            )

        aceptacion = await self._aceptacion_repo.upsert(
            contratista_id = contratista_id,
            datos          = {
                **data.model_dump(),
                "fecha_aceptacion": datetime.now(timezone.utc),
                "ip_address":       ip_address,
            },
        )

        # Construir DTO ANTES de cualquier operación que pueda expirar
        # el identity map (por ejemplo _sincronizar_estado_autorizacion).
        payload = AceptacionNormasResponse(
            id=aceptacion.id,
            contratista_id=aceptacion.contratista_id,
            acepto_normas=aceptacion.acepto_normas,
            acepto_datos=aceptacion.acepto_datos,
            firma_digital=aceptacion.firma_digital,
            fecha_aceptacion=aceptacion.fecha_aceptacion,
            ip_address=aceptacion.ip_address,
        )

        # Marcar autogestión completada
        await self._contratista_repo.marcar_autogestion_completada(contratista_id)

        # Registrar en historial (usuario_id=None → acción automática del contratista)
        await self._historial_repo.registrar(
            contratista_id  = contratista_id,
            usuario_id      = None,
            estado_anterior = contratista.estado,
            estado_nuevo    = "AUTOGESTION_COMPLETADA",
            motivo          = "Autogestión completada por el contratista",
        )

        # Sincronizar estado de la autorización padre
        await self._sincronizar_estado_autorizacion(contratista.autorizacion_id)

        await self._db.commit()
        return payload

    # ═══════════════════════════════════════════════════════════════
    # PORTAL VIGILANTE — Verificación y accesos
    # ═══════════════════════════════════════════════════════════════

    async def verificar_acceso(
        self,
        data: VerificarAccesoRequest,
    ) -> VerificarAccesoResponse:
        """
        Verifica si un contratista puede ingresar.
        Retorna estado inmediato para mostrar en pantalla del vigilante.
        """

        # Buscar contratista aprobado para esta sede
        contratista = await self._contratista_repo.get_by_documento_y_sede(
            data.numero_documento, data.sede_id
        )

        if not contratista:
            excepcion_activa, persona_excepcion = await self._get_excepcion_activa_por_documento(
                data.numero_documento,
                data.sede_id,
            )
            if excepcion_activa:
                contratista_excepcion = await self._contratista_repo.get_by_documento_y_sede_cualquiera(
                    data.numero_documento,
                    data.sede_id,
                )
                creado_en_verificacion = False
                if not contratista_excepcion and persona_excepcion:
                    contratista_excepcion = await self._asegurar_contratista_excepcion_core(
                        persona=persona_excepcion,
                        sede_id=data.sede_id,
                        motivo=excepcion_activa.motivo,
                        fecha_inicio=excepcion_activa.fecha_inicio,
                        fecha_fin=excepcion_activa.fecha_fin,
                        creado_por=excepcion_activa.aprobado_por,
                    )
                    creado_en_verificacion = True

                # Persistir creación automática para que el siguiente POST /vigilante/acceso
                # pueda resolver contratista_id sin caer en "Contratista no encontrado".
                if creado_en_verificacion:
                    await self._db.commit()
                nombre = None
                if persona_excepcion:
                    nombre = self._nombre_completo_limpio(persona_excepcion.nombres, persona_excepcion.apellidos)
                elif contratista_excepcion:
                    nombre = self._nombre_completo_limpio(contratista_excepcion.nombres, contratista_excepcion.apellidos)

                dentro = False
                contratista_id = None
                autorizacion_id = None
                tipo_contratista = None

                if contratista_excepcion:
                    dentro = await self._acceso_repo.esta_dentro(contratista_excepcion.id)
                    contratista_id = contratista_excepcion.id
                    autorizacion = await self._autorizacion_repo.get_by_id(contratista_excepcion.autorizacion_id)
                    if autorizacion:
                        autorizacion_id = autorizacion.id
                        tipo_contratista = autorizacion.tipo_contratista

                return VerificarAccesoResponse(
                    estado="EXCEPCION",
                    color="blue",
                    nombre=nombre,
                    empresa=None,
                    tipo_contratista=tipo_contratista,
                    mensaje="Ingreso autorizado por excepción activa.",
                    problemas=[],
                    dentro_actualmente=dentro,
                    contratista_id=contratista_id,
                    autorizacion_id=autorizacion_id,
                )

            return VerificarAccesoResponse(
                estado           = "NO_REGISTRADO",
                color            = "gray",
                nombre           = None,
                empresa          = None,
                tipo_contratista = None,
                mensaje          = "Documento no encontrado. El contratista debe tramitar su autorización.",
                problemas        = [],
                dentro_actualmente = False,
            )

        # Obtener autorización
        autorizacion = await self._autorizacion_repo.get_by_id(
            contratista.autorizacion_id
        )

        # Verificar vigencia
        hoy = datetime.now(timezone.utc).date()
        problemas = []

        if autorizacion.fecha_fin < hoy:
            problemas.append("La autorización está vencida.")

        # Verificar si está dentro
        dentro = await self._acceso_repo.esta_dentro(contratista.id)

        nombre = self._nombre_completo_limpio(contratista.nombres, contratista.apellidos)

        if problemas:
            return VerificarAccesoResponse(
                estado            = "NO_AUTORIZADO",
                color             = "red",
                nombre            = nombre,
                empresa           = None,
                tipo_contratista  = autorizacion.tipo_contratista,
                mensaje           = "Contratista NO autorizado para ingresar.",
                problemas         = problemas,
                dentro_actualmente = dentro,
                contratista_id    = contratista.id,
                autorizacion_id   = autorizacion.id,
            )

        return VerificarAccesoResponse(
            estado             = "AUTORIZADO",
            color              = "green",
            nombre             = nombre,
            empresa            = None,
            tipo_contratista   = autorizacion.tipo_contratista,
            mensaje            = "Contratista AUTORIZADO para ingresar.",
            problemas          = [],
            dentro_actualmente = dentro,
            contratista_id     = contratista.id,
            autorizacion_id    = autorizacion.id,
        )

    async def registrar_acceso(
        self,
        data:       RegistrarAccesoRequest,
        usuario_id: int,
    ) -> HseAcceso:
        """Registra entrada o salida de un contratista."""
        contratista = await self._contratista_repo.get_by_id(data.contratista_id)
        if not contratista:
            raise ValueError(
                "No se encontró el registro del contratista para este intento de acceso. "
                "Vuelve a verificar la cédula y luego registra la entrada/salida."
            )

        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        if autorizacion.sede_id != data.sede_id:
            raise ValueError("El contratista no pertenece a la sede indicada.")

        tiene_excepcion_activa = await self._tiene_excepcion_activa_por_documento(
            contratista.numero_documento,
            data.sede_id,
        )
        if contratista.estado != "APROBADO" and not tiene_excepcion_activa:
            raise ValueError("Solo contratistas APROBADOS o con excepción activa pueden registrar accesos.")

        acceso = HseAcceso(
            contratista_id = data.contratista_id,
            sede_id        = data.sede_id,
            registrado_por = usuario_id,
            tipo           = data.tipo,
            metodo         = data.metodo,
            ubicacion_id   = data.ubicacion_id,
            observacion    = data.observacion,
            fecha_hora     = datetime.now(timezone.utc),
        )
        await self._acceso_repo.create(acceso)
        await self._db.commit()
        return acceso

    async def _get_excepcion_activa_por_documento(
        self,
        numero_documento: str,
        sede_id: int,
    ) -> tuple[HseExcepcion | None, Persona | None]:
        persona_result = await self._db.execute(
            select(Persona)
            .where(
                Persona.numero_documento == numero_documento,
                Persona.deleted_at == None,  # noqa
            )
            .order_by(Persona.created_at.desc())
            .limit(1)
        )
        persona = persona_result.scalar_one_or_none()
        if not persona:
            return None, None

        excepcion = await self._excepcion_repo.get_activa_por_persona(persona.id, sede_id)
        return excepcion, persona

    async def _tiene_excepcion_activa_por_documento(
        self,
        numero_documento: str,
        sede_id: int,
    ) -> bool:
        excepcion, _persona = await self._get_excepcion_activa_por_documento(numero_documento, sede_id)
        return excepcion is not None

    async def get_personas_dentro(self, sede_id: int) -> list[dict]:
        """Lista de personas actualmente dentro de la sede."""
        accesos = await self._acceso_repo.get_personas_dentro(sede_id)
        ahora   = datetime.now(timezone.utc)
        resultado = []

        for acceso in accesos:
            contratista = await self._contratista_repo.get_by_id(acceso.contratista_id)
            if not contratista:
                # Evitar romper todo el endpoint por registros históricos huérfanos.
                continue
            autorizacion = await self._autorizacion_repo.get_by_id(
                contratista.autorizacion_id
            )
            if not autorizacion:
                continue
            fecha_hora = acceso.fecha_hora if acceso.fecha_hora.tzinfo else acceso.fecha_hora.replace(tzinfo=timezone.utc)
            minutos = int((ahora - fecha_hora).total_seconds() / 60)

            resultado.append({
                "contratista_id":   contratista.id,
                "nombre":           self._nombre_completo_limpio(contratista.nombres, contratista.apellidos),
                "numero_documento": contratista.numero_documento,
                "empresa":          None,
                "tipo_contratista": autorizacion.tipo_contratista,
                "hora_entrada":     acceso.fecha_hora,
                "minutos_dentro":   minutos,
                "alerta_tiempo":    minutos > 480,  # más de 8 horas
            })

        return resultado

    # ═══════════════════════════════════════════════════════════════
    # VERIFICACIÓN DE CUMPLIMIENTO
    # ═══════════════════════════════════════════════════════════════

    async def iniciar_cumplimiento(
        self,
        data:       CumplimientoIniciarRequest,
        usuario_id: int,
    ) -> HseCumplimiento:
        """
        Inicia el registro de cumplimiento para un contratista.
        Crea el checklist según el tipo de contratista.
        """
        contratista  = await self._contratista_repo.get_by_id(data.contratista_id)
        if not contratista:
            raise HseNotFoundError("Contratista no encontrado.")

        # Verificar si ya hay uno en progreso
        existente = await self._cumplimiento_repo.get_activo_por_contratista(
            data.contratista_id
        )
        if existente:
            return existente

        # Obtener tipo de contratista
        autorizacion = await self._autorizacion_repo.get_by_id(
            contratista.autorizacion_id
        )

        if not autorizacion:
            raise HseNotFoundError("La autorización asociada no existe.")

        es_excepcion = self._es_autorizacion_excepcion(autorizacion.descripcion_actividad)

        # Para flujo estándar, exigir que el contratista haya completado autogestión.
        # En excepciones no aplica esta validación.
        if not es_excepcion and contratista.estado not in (
            "AUTOGESTION_COMPLETADA",
            "EN_REVISION",
            "APROBADO",
        ):
            raise ValueError(
                "Solo puedes iniciar verificación cuando el contratista complete su autogestión."
            )

        # Sincronía con Vigilante: solo se verifica cumplimiento si la persona
        # está actualmente dentro (último acceso = ENTRADA), sin restringir por sede.
        esta_dentro = await self._acceso_repo.esta_dentro(contratista.id)
        if not esta_dentro:
            raise ValueError(
                "Solo puedes iniciar verificación cuando el contratista esté dentro de la empresa."
            )

        cumplimiento = HseCumplimiento(
            contratista_id = data.contratista_id,
            sede_id        = data.sede_id,
            encargado_id   = usuario_id,
            estado         = "EN_PROGRESO",
            fecha_inicio   = datetime.now(timezone.utc),
        )
        await self._cumplimiento_repo.create(cumplimiento)

        # Crear items del checklist según tipo
        preguntas = (
            CHECKLIST_ALTO_RIESGO
            if autorizacion.tipo_contratista == "ALTO_RIESGO"
            else CHECKLIST_NORMAL
        )

        for i, pregunta in enumerate(preguntas, 1):
            item = HseCumplimientoItem(
                cumplimiento_id = cumplimiento.id,
                pregunta        = pregunta,
                aplica          = True,
                cumple          = None,
                orden           = i,
            )
            await self._item_repo.create(item)

        await self._db.commit()
        return await self._cumplimiento_repo.get_with_items(cumplimiento.id)

    async def listar_cumplimientos(
        self,
        sede_id: int,
        estado: str | None = None,
    ) -> list[CumplimientoListadoResponse]:
        registros = await self._cumplimiento_repo.listar_por_sede(sede_id, estado)
        result: list[CumplimientoListadoResponse] = []

        for r in registros:
            contratista = r.contratista
            if not contratista:
                continue

            total_items = sum(1 for i in r.items if i.aplica)
            respondidos = sum(1 for i in r.items if i.aplica and i.cumple is not None)

            result.append(CumplimientoListadoResponse(
                id=r.id,
                estado=r.estado,
                fecha_inicio=r.fecha_inicio,
                fecha_cierre=r.fecha_cierre,
                firma_digital=r.firma_digital,
                contratista_id=contratista.id,
                contratista_nombre=self._nombre_completo_limpio(contratista.nombres, contratista.apellidos),
                tipo_documento=contratista.tipo_documento,
                numero_documento=contratista.numero_documento,
                autorizacion_codigo=(contratista.autorizacion.codigo if contratista.autorizacion else None),
                proveedor_id=(contratista.autorizacion.proveedor_id if contratista.autorizacion else None),
                total_items=total_items,
                respondidos=respondidos,
            ))

        return result

    async def actualizar_cumplimiento(
        self,
        cumplimiento_id: int,
        data:            CumplimientoActualizarRequest,
    ) -> HseCumplimiento:
        """Actualiza respuestas del checklist."""
        cumplimiento = await self._cumplimiento_repo.get_with_items(cumplimiento_id)
        if not cumplimiento:
            raise HseNotFoundError("Registro de cumplimiento no encontrado.")

        if cumplimiento.estado != "EN_PROGRESO":
            raise ValueError("Solo se puede actualizar un cumplimiento en progreso.")

        # Actualizar items
        items_dict = {item.id: item for item in cumplimiento.items}
        for item_data in data.items:
            if item_data.item_id in items_dict:
                item = items_dict[item_data.item_id]
                if item_data.cumple is not None:
                    item.cumple = item_data.cumple
                if item_data.observacion is not None:
                    item.observacion = item_data.observacion
                await self._item_repo.update(item)

        if data.observacion_general:
            cumplimiento.observacion_general = data.observacion_general
            await self._cumplimiento_repo.update(cumplimiento)

        await self._db.commit()
        return await self._cumplimiento_repo.get_with_items(cumplimiento_id)

    async def cerrar_cumplimiento(
        self,
        cumplimiento_id: int,
        data:            CumplimientoCerrarRequest,
    ) -> HseCumplimiento:
        """
        Cierra el registro de cumplimiento.
        Si hay items sin cumplir → estado INCUMPLIMIENTO.
        Si todo OK → estado COMPLETADO.
        """
        cumplimiento = await self._cumplimiento_repo.get_with_items(cumplimiento_id)
        if not cumplimiento:
            raise HseNotFoundError("Registro de cumplimiento no encontrado.")

        if cumplimiento.estado != "EN_PROGRESO":
            raise ValueError("Solo se puede cerrar un cumplimiento en progreso.")

        # Determinar estado final
        items_aplicables = [i for i in cumplimiento.items if i.aplica]
        hay_incumplimiento = any(
            i.cumple == False for i in items_aplicables  # noqa
        )
        hay_sin_responder = any(
            i.cumple is None for i in items_aplicables
        )

        if hay_sin_responder:
            raise ValueError("Debes responder todos los items antes de cerrar.")

        estado_final = "INCUMPLIMIENTO" if hay_incumplimiento else "COMPLETADO"

        cumplimiento.estado              = estado_final
        cumplimiento.firma_digital       = data.firma_digital
        cumplimiento.observacion_general = data.observacion_general or cumplimiento.observacion_general
        cumplimiento.fecha_cierre        = datetime.now(timezone.utc)

        await self._cumplimiento_repo.update(cumplimiento)
        await self._db.commit()
        return cumplimiento

    # ═══════════════════════════════════════════════════════════════
    # EXCEPCIONES
    # ═══════════════════════════════════════════════════════════════

    async def crear_excepcion(
        self,
        data:       ExcepcionCreateRequest,
        usuario_id: int,
    ) -> ExcepcionResponse:
        if data.fecha_fin < data.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio.")

        persona = await self._resolver_persona_excepcion(data)
        await self._asegurar_contratista_excepcion(persona, data, usuario_id)

        existente_activa = await self._excepcion_repo.get_activa_por_persona(persona.id, data.sede_id)
        if existente_activa:
            raise ValueError("Ya existe una excepción activa para esta persona en la sede.")

        excepcion = HseExcepcion(
            persona_id   = persona.id,
            sede_id      = data.sede_id,
            aprobado_por = usuario_id,
            motivo       = data.motivo,
            ubicacion_id = data.ubicacion_id,
            fecha_inicio = data.fecha_inicio,
            fecha_fin    = data.fecha_fin,
            activa       = True,
        )
        await self._excepcion_repo.create(excepcion)
        await self._db.commit()
        proveedor = None
        if persona.proveedor_id:
            proveedor = await self._db.get(Proveedor, persona.proveedor_id)
        return self._build_excepcion_response(excepcion, persona, proveedor)

    async def crear_excepciones_lote(
        self,
        data: ExcepcionLoteCreateRequest,
        usuario_id: int,
    ) -> list[ExcepcionResponse]:
        if data.fecha_fin < data.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio.")

        if data.proveedor_id is not None:
            proveedor = await self._db.get(Proveedor, data.proveedor_id)
            if not proveedor or proveedor.deleted_at is not None:
                raise HseNotFoundError("El proveedor seleccionado no existe.")

        creadas: list[ExcepcionResponse] = []
        for item in data.contratistas:
            payload = ExcepcionCreateRequest(
                tipo_documento=item.tipo_documento,
                numero_documento=item.numero_documento,
                nombre_completo=item.nombre_completo,
                sede_id=data.sede_id,
                motivo=data.motivo,
                fecha_inicio=data.fecha_inicio,
                fecha_fin=data.fecha_fin,
            )
            persona = await self._resolver_persona_excepcion(payload, proveedor_id=data.proveedor_id)
            await self._asegurar_contratista_excepcion(persona, payload, usuario_id)

            existente_activa = await self._excepcion_repo.get_activa_por_persona(persona.id, data.sede_id)
            if existente_activa:
                raise ValueError(
                    f"Ya existe una excepción activa para el documento {item.numero_documento}."
                )

            excepcion = HseExcepcion(
                persona_id=persona.id,
                sede_id=data.sede_id,
                aprobado_por=usuario_id,
                motivo=data.motivo,
                ubicacion_id=None,
                fecha_inicio=data.fecha_inicio,
                fecha_fin=data.fecha_fin,
                activa=True,
            )
            await self._excepcion_repo.create(excepcion)
            proveedor = None
            if persona.proveedor_id:
                proveedor = await self._db.get(Proveedor, persona.proveedor_id)
            creadas.append(self._build_excepcion_response(excepcion, persona, proveedor))

        await self._db.commit()
        return creadas

    async def _asegurar_contratista_excepcion(
        self,
        persona: Persona,
        data: ExcepcionCreateRequest,
        usuario_id: int,
    ) -> HseContratista:
        return await self._asegurar_contratista_excepcion_core(
            persona=persona,
            sede_id=data.sede_id,
            motivo=data.motivo,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            creado_por=usuario_id,
        )

    async def _asegurar_contratista_excepcion_core(
        self,
        persona: Persona,
        sede_id: int,
        motivo: str,
        fecha_inicio,
        fecha_fin,
        creado_por: int,
    ) -> HseContratista:
        existente = await self._contratista_repo.get_by_documento_y_sede_cualquiera(
            persona.numero_documento,
            sede_id,
        )
        if existente:
            cambios_existente = False
            token_nuevo = secrets.token_urlsafe(32)
            expira_en = datetime.now(timezone.utc) + timedelta(hours=48)

            if not existente.persona_id:
                existente.persona_id = persona.id
                cambios_existente = True

            autorizacion_existente = await self._autorizacion_repo.get_by_id(existente.autorizacion_id)
            if autorizacion_existente and self._es_autorizacion_excepcion(autorizacion_existente.descripcion_actividad):
                if autorizacion_existente.estado != "APROBADO":
                    autorizacion_existente.estado = "APROBADO"
                    await self._autorizacion_repo.update(autorizacion_existente)
                    cambios_existente = True
                if existente.estado != "APROBADO":
                    existente.estado = "APROBADO"
                    cambios_existente = True

            # Al crear/actualizar una excepción, renovar token para compartir
            # un link vigente inmediatamente desde cualquier vista.
            existente.token_autogestion = token_nuevo
            existente.token_expira_en = expira_en
            existente.token_duracion_horas = 48
            cambios_existente = True

            if cambios_existente:
                await self._contratista_repo.update(existente)
                await self._db.commit()
            return existente

        codigo = await self._autorizacion_repo.generar_codigo(sede_id)
        descripcion_base = motivo.strip().replace("\n", " ")
        descripcion = f"Excepción HSE: {descripcion_base}"[:500]

        autorizacion = HseAutorizacion(
            codigo=codigo,
            proveedor_id=persona.proveedor_id,
            sede_id=sede_id,
            creado_por=creado_por,
            responsable_interno_id=None,
            tipo_contratista="NORMAL",
            descripcion_actividad=descripcion,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            estado="APROBADO",
        )
        await self._autorizacion_repo.create(autorizacion)

        tipo_doc = persona.tipo_documento if persona.tipo_documento in {"CC", "CE", "PASAPORTE", "TI"} else "CC"
        email = (persona.email or "").strip()
        if not email:
            email = f"excepcion.{persona.numero_documento}@koaj.local"

        contratista = HseContratista(
            autorizacion_id=autorizacion.id,
            persona_id=persona.id,
            tipo_documento=tipo_doc,
            numero_documento=persona.numero_documento,
            nombres=persona.nombres,
            apellidos=persona.apellidos,
            email=email,
            telefono=persona.telefono_celular,
            es_extranjero=persona.es_extranjero,
            estado="APROBADO",
            token_autogestion=secrets.token_urlsafe(32),
            token_expira_en=datetime.now(timezone.utc) + timedelta(hours=48),
            token_duracion_horas=48,
        )
        await self._contratista_repo.create(contratista)
        return contratista

    async def listar_excepciones(self, sede_id: int) -> list[ExcepcionResponse]:
        excepciones = await self._excepcion_repo.listar_por_sede(sede_id)
        if not excepciones:
            return []

        persona_ids = list({e.persona_id for e in excepciones})
        personas_result = await self._db.execute(
            select(Persona).where(
                Persona.id.in_(persona_ids),
                Persona.deleted_at == None,  # noqa
            )
        )
        personas = {p.id: p for p in personas_result.scalars().all()}

        proveedor_ids = list({p.proveedor_id for p in personas.values() if p.proveedor_id})
        proveedores: dict[int, Proveedor] = {}
        if proveedor_ids:
            proveedores_result = await self._db.execute(
                select(Proveedor).where(
                    Proveedor.id.in_(proveedor_ids),
                    Proveedor.deleted_at == None,  # noqa
                )
            )
            proveedores = {p.id: p for p in proveedores_result.scalars().all()}

        return [
            self._build_excepcion_response(
                excepcion,
                personas.get(excepcion.persona_id),
                proveedores.get(personas.get(excepcion.persona_id).proveedor_id) if personas.get(excepcion.persona_id) and personas.get(excepcion.persona_id).proveedor_id else None,
            )
            for excepcion in excepciones
        ]

    async def desactivar_excepcion(self, excepcion_id: int) -> None:
        excepcion = await self._excepcion_repo.get_by_id(excepcion_id)
        if not excepcion:
            raise HseNotFoundError("Excepción no encontrada.")

        persona = await self._db.get(Persona, excepcion.persona_id)
        if persona and persona.numero_documento:
            contratista = await self._contratista_repo.get_aprobado_por_documento(
                numero_documento=persona.numero_documento,
                sede_id=excepcion.sede_id,
            )
            if contratista and await self._acceso_repo.esta_dentro(contratista.id):
                raise ValueError(
                    "No se puede desactivar la excepción porque el contratista está actualmente dentro de la sede."
                )

        excepcion.activa = False
        await self._excepcion_repo.update(excepcion)
        await self._db.commit()

    async def get_excepcion(self, excepcion_id: int) -> ExcepcionResponse:
        excepcion = await self._excepcion_repo.get_by_id(excepcion_id)
        if not excepcion:
            raise HseNotFoundError("Excepción no encontrada.")

        persona = await self._db.get(Persona, excepcion.persona_id)
        proveedor = None
        if persona and persona.proveedor_id:
            proveedor = await self._db.get(Proveedor, persona.proveedor_id)

        return self._build_excepcion_response(excepcion, persona, proveedor)

    async def actualizar_excepcion_fechas(
        self,
        excepcion_id: int,
        data: ExcepcionUpdateRequest,
    ) -> ExcepcionResponse:
        if data.fecha_fin < data.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio.")

        excepcion = await self._excepcion_repo.get_by_id(excepcion_id)
        if not excepcion:
            raise HseNotFoundError("Excepción no encontrada.")

        # Resolver persona destino y actualizar proveedor si cambió.
        payload = ExcepcionCreateRequest(
            tipo_documento=data.tipo_documento,
            numero_documento=data.numero_documento,
            nombre_completo=data.nombre_completo,
            sede_id=excepcion.sede_id,
            motivo=data.motivo,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
        )
        persona = await self._resolver_persona_excepcion(payload, proveedor_id=data.proveedor_id)

        # Si el documento cambió y resolvió otra persona, reasignar la excepción.
        if excepcion.persona_id != persona.id:
            excepcion.persona_id = persona.id

        excepcion.motivo = data.motivo
        excepcion.fecha_inicio = data.fecha_inicio
        excepcion.fecha_fin = data.fecha_fin
        await self._excepcion_repo.update(excepcion)

        # Asegurar/obtener el contratista de excepción y sincronizar proveedor
        # en la autorización cabecera para que Gestión refleje la empresa al instante.
        contratista = await self._asegurar_contratista_excepcion_core(
            persona=persona,
            sede_id=excepcion.sede_id,
            motivo=data.motivo,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            creado_por=excepcion.aprobado_por,
        )
        autorizacion = await self._autorizacion_repo.get_by_id(contratista.autorizacion_id)
        if autorizacion and autorizacion.proveedor_id != persona.proveedor_id:
            autorizacion.proveedor_id = persona.proveedor_id
            await self._autorizacion_repo.update(autorizacion)

        await self._db.commit()

        return await self.get_excepcion(excepcion_id)

    async def activar_excepcion(self, excepcion_id: int) -> None:
        excepcion = await self._excepcion_repo.get_by_id(excepcion_id)
        if not excepcion:
            raise HseNotFoundError("Excepción no encontrada.")
        excepcion.activa = True
        await self._excepcion_repo.update(excepcion)
        await self._db.commit()

    async def _resolver_persona_excepcion(
        self,
        data: ExcepcionCreateRequest,
        proveedor_id: int | None = None,
    ) -> Persona:
        if data.persona_id is not None:
            persona = await self._db.get(Persona, data.persona_id)
            if not persona or persona.deleted_at is not None:
                raise HseNotFoundError("La persona indicada no existe.")
            if proveedor_id is not None and persona.proveedor_id != proveedor_id:
                persona.proveedor_id = proveedor_id
            return persona

        if not data.numero_documento or not data.nombre_completo:
            raise ValueError("Debes ingresar cédula y nombre completo de la persona.")

        documento = data.numero_documento.strip()
        nombre = data.nombre_completo.strip()
        if not documento or not nombre:
            raise ValueError("Debes ingresar cédula y nombre completo de la persona.")

        existente_result = await self._db.execute(
            select(Persona)
            .where(
                Persona.tipo_documento == data.tipo_documento,
                Persona.numero_documento == documento,
                Persona.deleted_at == None,  # noqa
            )
            .order_by(Persona.created_at.desc())
            .limit(1)
        )
        persona = existente_result.scalar_one_or_none()
        if persona:
            if proveedor_id is not None and persona.proveedor_id != proveedor_id:
                persona.proveedor_id = proveedor_id
            return persona

        partes = [p for p in nombre.split() if p]
        if len(partes) == 1:
            nombres = partes[0]
            apellidos = "N/A"
        else:
            nombres = " ".join(partes[:-1])
            apellidos = partes[-1]

        persona = Persona(
            tipo_documento=data.tipo_documento,
            numero_documento=documento,
            nombres=nombres,
            apellidos=apellidos,
            proveedor_id=proveedor_id,
            tratamiento_datos=False,
        )
        self._db.add(persona)
        await self._db.flush()
        return persona

    def _build_excepcion_response(
        self,
        excepcion: HseExcepcion,
        persona: Persona | None,
        proveedor: Proveedor | None = None,
    ) -> ExcepcionResponse:
        nombre_completo = None
        if persona:
            nombre_completo = self._nombre_completo_limpio(persona.nombres, persona.apellidos)

        return ExcepcionResponse(
            id=excepcion.id,
            persona_id=excepcion.persona_id,
            tipo_documento=persona.tipo_documento if persona else None,
            numero_documento=persona.numero_documento if persona else None,
            nombre_completo=nombre_completo,
            proveedor_id=proveedor.id if proveedor else None,
            proveedor_nombre=proveedor.nom_proveedor if proveedor else None,
            origen_excepcion="EMPRESA" if proveedor else "INDIVIDUAL",
            sede_id=excepcion.sede_id,
            aprobado_por=excepcion.aprobado_por,
            motivo=excepcion.motivo,
            ubicacion_id=excepcion.ubicacion_id,
            fecha_inicio=excepcion.fecha_inicio,
            fecha_fin=excepcion.fecha_fin,
            activa=excepcion.activa,
        )

    # ═══════════════════════════════════════════════════════════════
    # DASHBOARD
    # ═══════════════════════════════════════════════════════════════

    async def get_dashboard(self, sede_id: int) -> DashboardHSEResponse:
        total      = await self._autorizacion_repo.contar_por_sede(sede_id)
        activas    = await self._autorizacion_repo.contar_por_sede(sede_id, "APROBADO")
        pendientes = await self._autorizacion_repo.contar_por_sede(sede_id, "EN_REVISION")
        vencidas   = await self._autorizacion_repo.contar_por_sede(sede_id, "VENCIDO")
        total_contratistas = await self._contratista_repo.contar_por_sede(sede_id)
        alto_riesgo_activos = await self._contratista_repo.contar_por_sede(
            sede_id,
            estado="APROBADO",
            tipo_contratista="ALTO_RIESGO",
        )
        normal_activos = await self._contratista_repo.contar_por_sede(
            sede_id,
            estado="APROBADO",
            tipo_contratista="NORMAL",
        )

        personas_dentro = await self.get_personas_dentro(sede_id)
        alertas_activas = sum(1 for p in personas_dentro if p.get("alerta_tiempo"))

        return DashboardHSEResponse(
            total_autorizaciones      = total,
            autorizaciones_activas    = activas,
            autorizaciones_pendientes = pendientes,
            autorizaciones_vencidas   = vencidas,
            total_contratistas        = total_contratistas,
            contratistas_dentro_ahora = len(personas_dentro),
            alto_riesgo_activos       = alto_riesgo_activos,
            normal_activos            = normal_activos,
            alertas_activas           = alertas_activas,
        )