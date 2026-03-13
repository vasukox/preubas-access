"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Modelos de sede y ubicación.

Tablas:
  sedes      → instalaciones físicas de Permoda S.A.S.
  ubicaciones → zonas específicas dentro de cada sede

Las sedes son la unidad organizacional principal del sistema.
Cada módulo (Parking, HSE, NFC, GH) opera por sede.
El WebSocket se conecta por sede: ws/{sede_id}?token=JWT
"""

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


# ── Sede ──────────────────────────────────────────────────────────
class Sede(BaseModel):
    """
    Instalación física de Permoda S.A.S.

    Sedes conocidas (del módulo HSE):
      - Corporativo
      - Tequendama
      - Funza CIL
      - Funza Producción
      - Zona Franca
      - Terrapuerto
      - Calle 18
      - CDR Medellín
      - CDR Cali
      - Tiendas Bogotá
      - Calle 19
      - Girardota

    Cada sede tiene sus propias ubicaciones internas,
    cupos de parqueadero, configuración de pico y placa, etc.
    """

    __tablename__ = "sedes"

    nombre: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        comment="Nombre de la sede",
    )

    codigo: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        comment="Código corto para reportes y logs (ej: CORP, TEQ, FUNZA-CIL)",
    )

    ciudad: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        default="Bogotá",
        comment="Ciudad donde está ubicada la sede",
    )

    direccion: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Dirección física de la sede",
    )

    telefono: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono de contacto de la sede",
    )

    activa: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si la sede está operativa en el sistema",
    )

    # Configuración de parqueadero
    capacidad_carros: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Cupos disponibles para carros",
    )

    capacidad_motos: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Cupos disponibles para motos",
    )

    capacidad_bicis: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Cupos disponibles para bicicletas",
    )

    # Configuración pico y placa
    aplica_pico_placa: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Si esta sede aplica restricción pico y placa",
    )

    notas: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Notas internas sobre la sede",
    )

    # Relaciones
    ubicaciones: Mapped[list["Ubicacion"]] = relationship(
        back_populates="sede",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Sede {self.codigo} — {self.nombre}>"


# ── Ubicación ─────────────────────────────────────────────────────
class Ubicacion(BaseModel):
    """
    Zona específica dentro de una sede.

    Ejemplos por sede:
      - Bodega Principal
      - Área Administrativa
      - Zona de Producción
      - Parqueadero
      - Recepción
      - Área Técnica

    Las ubicaciones se usan en:
      - HSE: ubicación específica donde trabaja el contratista
      - Parking: ubicación del cupo asignado (ej: S2-A12)
      - NFC: ubicación de los activos
      - Excepciones HSE: ubicación del visitante pre-aprobado
    """

    __tablename__ = "ubicaciones"

    sede_id: Mapped[int] = mapped_column(
        ForeignKey("sedes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="FK a la sede que contiene esta ubicación",
    )

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Nombre de la ubicación (ej: Bodega Principal)",
    )

    codigo: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Código corto (ej: S2-A12 para parking)",
    )

    tipo: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="GENERAL",
        comment="Tipo: GENERAL, PARKING, PRODUCCION, ADMIN, BODEGA, TECNICA",
    )

    activa: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si la ubicación está disponible",
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Descripción adicional de la ubicación",
    )

    # Relaciones
    sede: Mapped["Sede"] = relationship(back_populates="ubicaciones")

    def __repr__(self) -> str:
        return f"<Ubicacion {self.nombre} @ sede={self.sede_id}>"