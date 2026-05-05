"""
KOAJ Access v2.0 — Permoda S.A.S.
Schemas del módulo Configuración (Fase 1).
"""

from pydantic import BaseModel, Field


class GlobalParamsResponse(BaseModel):
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    max_upload_size_mb: int
    allowed_origins: list[str]
    debug: bool
    environment: str


class UbicacionResponse(BaseModel):
    id: int
    sede_id: int
    nombre: str
    codigo: str | None
    tipo: str
    activa: bool
    descripcion: str | None

    model_config = {"from_attributes": True}


class UbicacionCreateRequest(BaseModel):
    sede_id: int
    nombre: str = Field(..., min_length=3, max_length=100)
    codigo: str | None = Field(default=None, max_length=20)
    tipo: str = Field(default="GENERAL", min_length=3, max_length=50)
    activa: bool = True
    descripcion: str | None = Field(default=None, max_length=500)


class UbicacionUpdateRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=100)
    codigo: str | None = Field(default=None, max_length=20)
    tipo: str | None = Field(default=None, min_length=3, max_length=50)
    activa: bool | None = None
    descripcion: str | None = Field(default=None, max_length=500)


class SedeResponse(BaseModel):
    id: int
    nombre: str
    codigo: str
    ciudad: str
    direccion: str | None
    telefono: str | None
    activa: bool
    capacidad_carros: int
    capacidad_motos: int
    capacidad_bicis: int
    aplica_pico_placa: bool
    notas: str | None
    ubicaciones: list[UbicacionResponse] = []


class SedeCreateRequest(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    codigo: str | None = Field(default=None, min_length=2, max_length=20)
    ciudad: str = Field(default="Bogotá", min_length=2, max_length=80)
    direccion: str | None = Field(default=None, max_length=200)
    telefono: str | None = Field(default=None, max_length=20)
    activa: bool = True
    capacidad_carros: int = Field(default=0, ge=0)
    capacidad_motos: int = Field(default=0, ge=0)
    capacidad_bicis: int = Field(default=0, ge=0)
    aplica_pico_placa: bool = False
    notas: str | None = Field(default=None, max_length=1000)


class SedeUpdateRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=100)
    codigo: str | None = Field(default=None, min_length=2, max_length=20)
    ciudad: str | None = Field(default=None, min_length=2, max_length=80)
    direccion: str | None = Field(default=None, max_length=200)
    telefono: str | None = Field(default=None, max_length=20)
    activa: bool | None = None
    capacidad_carros: int | None = Field(default=None, ge=0)
    capacidad_motos: int | None = Field(default=None, ge=0)
    capacidad_bicis: int | None = Field(default=None, ge=0)
    aplica_pico_placa: bool | None = None
    notas: str | None = Field(default=None, max_length=1000)


class CatalogoItemResponse(BaseModel):
    id: int
    nombre: str
    codigo: str
    activa: bool

    model_config = {"from_attributes": True}


class CatalogoItemCreateRequest(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=150)
    codigo: str = Field(..., min_length=2, max_length=20)
    activa: bool = True


class CatalogoItemUpdateRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=3, max_length=150)
    codigo: str | None = Field(default=None, min_length=2, max_length=20)
    activa: bool | None = None


class NormaConfigResponse(BaseModel):
    id: int
    numero: int
    titulo: str
    contenido: str
    activa: bool
    sede_id: int | None

    model_config = {"from_attributes": True}


class NormaCreateRequest(BaseModel):
    numero: int = Field(..., ge=1)
    titulo: str = Field(..., min_length=3, max_length=200)
    contenido: str = Field(..., min_length=10)
    activa: bool = True
    sede_id: int | None = None


class NormaUpdateRequest(BaseModel):
    numero: int | None = Field(default=None, ge=1)
    titulo: str | None = Field(default=None, min_length=3, max_length=200)
    contenido: str | None = Field(default=None, min_length=10)
    activa: bool | None = None
    sede_id: int | None = None
