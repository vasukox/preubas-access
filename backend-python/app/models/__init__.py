"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Exportaciones del paquete models.

Importar desde aquí garantiza que SQLAlchemy registre
todos los modelos en Base.metadata antes de create_all().
"""

from app.models.base import BaseModel
from app.models.sede import Sede
from app.models.persona import Persona, Proveedor
from app.models.usuario import Rol, Usuario, UsuarioRol, RefreshToken, Perfil
from app.models.hse import (
    CatEPS, CatARL, CatAFP, CatNormaSeguridad,
    HseAutorizacion, HseContratista,
    HseClasificacion, HseSegSocial, HseCertificaciones,
    HseExamenMedico, HseContactoEmergencia, HseAceptacionNormas,
    HseAcceso, HseCumplimiento, HseCumplimientoItem,
    HseExcepcion, HseHistorial,
)
from app.models.gh import (
    GhCandidato,
    GhCita,
    GhPortalToken,
    GhAccesoVigilancia,
    GhImportacion,
    GhImportacionDetalle,
    GhAuditoria,
    GhSesionInduccion,
    GhInduccionAsistencia,
    GhMaestroDotacion,
    GhDotacionEntrega,
    GhDotacionEntregaDetalle,
)

__all__ = [
    # Base
    "BaseModel",
    # Sede
    "Sede",
    # Persona
    "Persona",
    "Proveedor",
    # Usuario / Auth
    "Rol",
    "Usuario",
    "UsuarioRol",
    "RefreshToken",
    "Perfil",
    # HSE — Catálogos
    "CatEPS",
    "CatARL",
    "CatAFP",
    "CatNormaSeguridad",
    # HSE — Núcleo
    "HseAutorizacion",
    "HseContratista",
    # HSE — Autogestión
    "HseClasificacion",
    "HseSegSocial",
    "HseCertificaciones",
    "HseExamenMedico",
    "HseContactoEmergencia",
    "HseAceptacionNormas",
    # HSE — Operación
    "HseAcceso",
    "HseCumplimiento",
    "HseCumplimientoItem",
    # HSE — Control
    "HseExcepcion",
    "HseHistorial",
    # GH
    "GhCandidato",
    "GhCita",
    "GhPortalToken",
    "GhAccesoVigilancia",
    "GhImportacion",
    "GhImportacionDetalle",
    "GhAuditoria",
    "GhSesionInduccion",
    "GhInduccionAsistencia",
    "GhMaestroDotacion",
    "GhDotacionEntrega",
    "GhDotacionEntregaDetalle",
]
