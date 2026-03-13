"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Modelos de persona y empresa.

Tablas:
  empresas   → razones sociales de contratistas y proveedores
  personas   → personas naturales que ingresan a las instalaciones

Las personas son el núcleo del módulo HSE. Una persona
puede pertenecer a una empresa o ser independiente.
Una persona puede tener múltiples autorizaciones HSE
a lo largo del tiempo (historial completo).
"""

from sqlalchemy import Boolean, Date, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel


# ── Empresa ───────────────────────────────────────────────────────
class Empresa(BaseModel):
    """
    Razón social de un contratista, proveedor o empresa externa.

    Una empresa puede tener múltiples personas asociadas.
    Los datos de la empresa se pre-cargan en el wizard de autogestión
    cuando el coordinador la selecciona al crear la autorización.

    Ejemplos:
      - Empresa contratista de mantenimiento eléctrico
      - Proveedor de insumos
      - Firma auditora
    """

    __tablename__ = "empresas"

    razon_social: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Razón social o nombre comercial",
    )

    nit: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="NIT de la empresa con dígito verificador (ej: 900123456-1)",
    )

    email_contacto: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
        comment="Email principal de contacto",
    )

    telefono: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Teléfono de contacto",
    )

    ciudad: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        comment="Ciudad de operación principal",
    )

    direccion: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        comment="Dirección de la empresa",
    )

    activa: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Si la empresa está activa en el sistema",
    )

    notas: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Notas internas sobre la empresa",
    )

    # Relaciones
    personas: Mapped[list["Persona"]] = relationship(
        back_populates="empresa",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Empresa {self.nit} — {self.razon_social}>"


# ── Persona ───────────────────────────────────────────────────────
class Persona(BaseModel):
    """
    Persona natural que ingresa a las instalaciones de Permoda.

    Usada por:
      - HSE: contratistas, técnicos, proveedores, inspectores,
             funcionarios públicos
      - Parking: empleados que solicitan cupo
      - GH: colaboradores con citas

    Una persona se registra una sola vez y puede tener
    múltiples autorizaciones HSE, solicitudes de parking
    y citas de GH a lo largo del tiempo.

    Tipologías HSE:
      CONTRATISTA_EMPRESA   → empresa contratista con cuadrilla
      TECNICO_INDEPENDIENTE → persona natural con contrato
      PROVEEDOR_SERVICIOS   → proveedor sin actividades de riesgo
      INSPECTOR_AUDITOR     → visita de inspección o auditoría
      FUNCIONARIO_PUBLICO   → entidad gubernamental
    """

    __tablename__ = "personas"

    # ── Identificación ────────────────────────────────────────────
    tipo_documento: Mapped[str] = mapped_column(
        Enum(
            'CC',           # Cédula de ciudadanía
            'CE',           # Cédula de extranjería
            'PASAPORTE',    # Pasaporte
            'TI',           # Tarjeta de identidad
            'NIT',          # NIT (para representantes legales)
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

    # ── Empresa / tipología ───────────────────────────────────────
    empresa_id: Mapped[int | None] = mapped_column(
        ForeignKey("empresas.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="FK a la empresa — null si es técnico independiente",
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
        comment="Teléfono fijo del contacto de emergencia (opcional)",
    )

    # ── Estado general ────────────────────────────────────────────
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
    empresa: Mapped["Empresa | None"] = relationship(
        back_populates="personas",
    )

    def __repr__(self) -> str:
        return f"<Persona {self.tipo_documento}{self.numero_documento} — {self.nombres} {self.apellidos}>"