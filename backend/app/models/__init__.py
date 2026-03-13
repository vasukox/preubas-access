"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Exportaciones del paquete models.

Importar desde aquí garantiza que SQLAlchemy registre
todos los modelos en Base.metadata antes de create_all().
"""

from app.models.base import BaseModel
from app.models.sede import Sede
from app.models.persona import Persona
from app.models.usuario import Rol, Usuario, UsuarioRol, RefreshToken

__all__ = [
    # Base
    "BaseModel",
    # Sede
    "Sede",
    # Persona
    "Persona",
    # Usuario / Auth
    "Rol",
    "Usuario",
    "UsuarioRol",
    "RefreshToken",
]
