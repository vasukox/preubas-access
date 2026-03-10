"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Schemas comunes y envelope de respuesta.

Responsabilidades:
- Definir el envelope estándar de TODAS las respuestas de la API
- Proveer helpers para construir respuestas exitosas y de error
- Definir el schema de paginación reutilizable

Regla de oro:
    TODOS los endpoints retornan ApiResponse o ApiError.
    Nunca retornar un dict plano ni un modelo directamente.
    Esto garantiza que el frontend siempre recibe { success, data, message }.
"""

import math
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from fastapi import HTTPException, status

# TypeVar para respuestas genéricas tipadas
T = TypeVar("T")


# ── Envelope principal ────────────────────────────────────────────────
class ApiResponse(BaseModel, Generic[T]):
    """
    Envelope estándar para respuestas exitosas.

    Ejemplo de uso en un router:
        from app.schemas.common import ApiResponse, ok

        @router.get("/personas", response_model=ApiResponse[list[PersonaOut]])
        def listar_personas(db: Session = Depends(get_db)):
            personas = db.query(Persona).all()
            return ok(personas)
    """
    success: bool = True
    data: T
    message: Optional[str] = None


class ApiError(BaseModel):
    """
    Envelope estándar para respuestas de error.

    No se usa directamente — se lanza via HTTPException.
    FastAPI serializa el detail de HTTPException automáticamente.

    Ejemplo de respuesta:
        {
            "success": false,
            "error": {
                "code": "PERSONA_NO_ENCONTRADA",
                "message": "No existe una persona con el documento 12345678"
            }
        }
    """
    success: bool = False
    error: dict[str, str] = Field(
        example={
            "code": "CODIGO_DEL_ERROR",
            "message": "Descripción del error para el usuario"
        }
    )


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Envelope para respuestas paginadas.

    Ejemplo de uso:
        @router.get("/personas", response_model=PaginatedResponse[PersonaOut])
        def listar_personas(page: int = 1, per_page: int = 20, ...):
            ...
    """
    success: bool = True
    data: list[T]
    total: int = Field(description="Total de registros que coinciden con los filtros")
    page: int = Field(description="Página actual (inicia en 1)")
    per_page: int = Field(description="Registros por página")
    total_pages: int = Field(description="Total de páginas disponibles")


# ── Helpers de respuesta ──────────────────────────────────────────────
def ok(data: Any, message: str | None = None) -> dict:
    """
    Construye una respuesta exitosa con el envelope estándar.

    Args:
        data:    Los datos a retornar (modelo, lista, dict, etc.)
        message: Mensaje opcional de éxito (ej: "Persona creada correctamente")

    Returns:
        Dict con { success: True, data: ..., message: ... }

    Ejemplo:
        return ok(persona, "Persona creada correctamente")
        return ok(lista_personas)
    """
    result: dict = {"success": True, "data": data}
    if message:
        result["message"] = message
    return result


def ok_paginated(
    data: list,
    total: int,
    page: int,
    per_page: int,
) -> dict:
    """
    Construye una respuesta paginada exitosa.

    Args:
        data:     Lista de registros de la página actual
        total:    Total de registros que coinciden con los filtros
        page:     Página actual
        per_page: Registros por página

    Returns:
        Dict con { success, data, total, page, per_page, total_pages }

    Ejemplo:
        return ok_paginated(personas, total=150, page=1, per_page=20)
    """
    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": math.ceil(total / per_page) if per_page > 0 else 0,
    }


def err(code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
    """
    Lanza un HTTPException con el envelope de error estándar.

    Args:
        code:        Código de error en SCREAMING_SNAKE_CASE (para el frontend)
        message:     Mensaje legible para el usuario final
        status_code: Código HTTP (default 400)

    Raises:
        HTTPException con detail en formato ApiError

    Códigos de error comunes:
        400 — Error de negocio (CAPACIDAD_LLENA, PLACA_DUPLICADA, etc.)
        401 — No autenticado (TOKEN_INVALIDO, TOKEN_EXPIRADO)
        403 — Sin permisos (SIN_PERMISOS, USUARIO_INACTIVO)
        404 — No encontrado (PERSONA_NO_ENCONTRADA, SOLICITUD_NO_ENCONTRADA)
        409 — Conflicto (EMAIL_YA_REGISTRADO, PLACA_YA_REGISTRADA)
        422 — Validación (manejado automáticamente por Pydantic)
        500 — Error interno (manejado por el exception handler global)

    Ejemplo:
        err("PERSONA_NO_ENCONTRADA", "No existe una persona con ese documento", 404)
        err("CAPACIDAD_LLENA", "No hay espacios disponibles en esta sede")
    """
    raise HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
            },
        },
    )


# ── Schemas de parámetros comunes ─────────────────────────────────────
class PaginationParams(BaseModel):
    """
    Parámetros de paginación estándar para endpoints de listado.

    Uso:
        @router.get("/personas")
        def listar(params: PaginationParams = Depends()):
            offset = (params.page - 1) * params.per_page
            ...
    """
    page: int = Field(default=1, ge=1, description="Número de página (inicia en 1)")
    per_page: int = Field(default=20, ge=1, le=100, description="Registros por página (máx 100)")

    @property
    def offset(self) -> int:
        """Calcula el offset para la query SQL."""
        return (self.page - 1) * self.per_page