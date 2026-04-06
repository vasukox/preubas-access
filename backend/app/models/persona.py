"""
KOAJ Access v2.0 — Permoda S.A.S.
Modelos de persona y proveedor.

Tablas:
  proveedores → empresas/proveedores de contratistas
  personas    → personas naturales que ingresan a instalaciones

Relación clave:
  Un contratista viene en nombre de un proveedor.
  proveedor → personas (contratistas) → autorizaciones HSE
"""

from sqlalchemy import Boolean, Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


# ── Proveedor ─────────────────────────────────────────────────────
class Proveedor(BaseModel):
    """
    Empresa o proveedor del que vienen los contratistas.

    Un proveedor puede tener múltiples contratistas asociados.
    Los datos del proveedor se pre-cargan en el wizard de
    autogestión cuando el admin lo selecciona al crear
    la autorización HSE.

    Ejemplos:
      - Empresa contratista de mantenimiento eléctrico
      - Proveedor de insumos
      - Firma auditora
    """

    __tablename__ = "proveedores"

    nom_proveedor: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Razón social o nombre comercial del proveedor",
    )

    nit_proveedor: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="NIT con dígito verificador (ej: 900123456-1)",
    )

    tipo_identificacion_prov: Mapped[str | None] = mapped_column(
        Enum(
            'NIT',
            'CC',
            'CE',
            'PASAPORTE',
            name='tipo_ident_proveedor_enum',
        ),
        nullable=True,
        comment="Tipo de identificación del proveedor",
    )

    estado_prov: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si el proveedor está activo en el sistema",
    )

    direccion_prov: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Dirección del proveedor",
    )

    telefono_prov: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono de contacto",
    )

    email_contacto: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        comment="Email principal de contacto",
    )

    ciudad: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        comment="Ciudad de operación principal",
    )

    tratamiento_datos: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Aceptación de tratamiento de datos",
    )

    notas: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Notas internas sobre el proveedor",
    )

    # Relaciones
    personas: Mapped[list["Persona"]] = relationship(
        back_populates="proveedor",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Proveedor {self.nit_proveedor} — {self.nom_proveedor}>"


# ── Persona ───────────────────────────────────────────────────────
class Persona(BaseModel):
    """
    Persona natural que ingresa a las instalaciones de Permoda.

    Usada por:
      - HSE: contratistas que vienen en nombre de un proveedor
      - Parking: empleados que solicitan cupo de vehículo
      - GH: colaboradores con citas programadas
      - GH: visitantes externos

    Una persona se registra una sola vez y puede tener
    múltiples autorizaciones HSE, solicitudes de parking
    y citas de GH a lo largo del tiempo.

    Tipologías HSE:
      CONTRATISTA_EMPRESA   → viene en nombre de un proveedor
      TECNICO_INDEPENDIENTE → persona natural con contrato directo
      PROVEEDOR_SERVICIOS   → proveedor sin actividades de riesgo
      INSPECTOR_AUDITOR     → visita de inspección o auditoría
      FUNCIONARIO_PUBLICO   → entidad gubernamental
    """

    __tablename__ = "personas"

    # ── Identificación ────────────────────────────────────────────
    tipo_documento: Mapped[str] = mapped_column(
        Enum(
            'CC',
            'CE',
            'PASAPORTE',
            'TI',
            'NIT',
            name='tipo_documento_enum',
        ),
        nullable=False,
        comment="Tipo de documento de identidad",
    )

    numero_documento: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
        comment="Número de documento sin puntos ni comas",
    )

    nombres: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Nombres de la persona",
    )

    apellidos: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Apellidos de la persona",
    )

    email: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        index=True,
        comment="Correo electrónico personal",
    )

    telefono_celular: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono celular",
    )

    ciudad_operacion: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        comment="Ciudad desde donde opera habitualmente",
    )

    direccion_domicilio: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Dirección de domicilio",
    )

    es_extranjero: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True si la persona es de nacionalidad extranjera",
    )

    fecha_nacimiento: Mapped[str | None] = mapped_column(
        Date,
        nullable=True,
        comment="Fecha de nacimiento",
    )

    tratamiento_datos: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Aceptación de tratamiento de datos personales",
    )

    # ── Proveedor / tipología ─────────────────────────────────────
    proveedor_id: Mapped[int | None] = mapped_column(
        ForeignKey("proveedores.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="FK al proveedor — null si es técnico independiente",
    )

    tipologia_hse: Mapped[str | None] = mapped_column(
        Enum(
            'CONTRATISTA_EMPRESA',
            'TECNICO_INDEPENDIENTE',
            'PROVEEDOR_SERVICIOS',
            'INSPECTOR_AUDITOR',
            'FUNCIONARIO_PUBLICO',
            name='tipologia_hse_enum',
        ),
        nullable=True,
        comment="Tipología HSE — define qué documentos se requieren",
    )

    # ── Contacto de emergencia ────────────────────────────────────
    emergencia_nombre: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        comment="Nombre completo del contacto de emergencia",
    )

    emergencia_relacion: Mapped[str | None] = mapped_column(
        Enum(
            'FAMILIAR',
            'CONYUGE',
            'COLEGA',
            'OTRO',
            name='emergencia_relacion_enum',
        ),
        nullable=True,
        comment="Relación con el contacto de emergencia",
    )

    emergencia_relacion_otro: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        comment="Descripción si la relación es OTRO",
    )

    emergencia_telefono_celular: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Celular del contacto de emergencia",
    )

    emergencia_telefono_fijo: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono fijo del contacto de emergencia",
    )

    # ── Estado ────────────────────────────────────────────────────
    activo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si la persona está activa en el sistema",
    )

    notas: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Notas internas sobre la persona",
    )

    # ── Relaciones ────────────────────────────────────────────────
    proveedor: Mapped["Proveedor | None"] = relationship(
        back_populates="personas",
    )

    def __repr__(self) -> str:
        return f"<Persona {self.tipo_documento}{self.numero_documento} — {self.nombres} {self.apellidos}>"