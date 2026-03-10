"""
KOAJ Access v2.0 — Permoda S.A.S.
--------------------------------------
Utilidades para manejo seguro de contraseñas.

Responsabilidades:
- Hashear contraseñas con bcrypt (nunca guardar texto plano)
- Verificar contraseñas contra su hash
- Validar la fortaleza de contraseñas nuevas
- Generar contraseñas temporales seguras

Patrón:
    Solo este módulo conoce el algoritmo de hashing.
    auth_service.py usa hash_password() al crear/actualizar.
    auth_service.py usa verify_password() al hacer login.
    Nadie más importa passlib directamente.
"""

import logging
import re
import secrets
import string
from dataclasses import dataclass

from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# ── Contexto de hashing ───────────────────────────────────────────────
# bcrypt es el algoritmo recomendado para contraseñas.
# deprecated="auto" migra automáticamente hashes viejos si cambiamos algoritmo.
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Factor de costo. Más alto = más seguro pero más lento.
                        # 12 rounds ≈ 250ms por hash en hardware moderno.
)


# ── Hash y verificación ───────────────────────────────────────────────
def hash_password(plain_password: str) -> str:
    """
    Hashea una contraseña en texto plano con bcrypt.

    NUNCA guardar contraseñas en texto plano.
    Siempre hashear antes de guardar en la BD.

    Args:
        plain_password: Contraseña en texto plano

    Returns:
        Hash bcrypt como string (incluye el salt automáticamente)

    Ejemplo:
        usuario.password_hash = hash_password(data.password)
        db.add(usuario)
        db.commit()
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña en texto plano contra su hash bcrypt.

    Args:
        plain_password:   Contraseña que el usuario ingresó
        hashed_password:  Hash guardado en la BD

    Returns:
        True si la contraseña es correcta, False si no

    Ejemplo:
        if not verify_password(data.password, usuario.password_hash):
            err("CREDENCIALES_INVALIDAS", "Email o contraseña incorrectos", 401)
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error al verificar contraseña: {e}")
        return False


def needs_rehash(hashed_password: str) -> bool:
    """
    Verifica si un hash existente necesita ser actualizado.

    Útil cuando se cambia el factor de costo de bcrypt.
    Si retorna True, hashear de nuevo y guardar el nuevo hash.

    Args:
        hashed_password: Hash guardado en la BD

    Returns:
        True si el hash necesita ser actualizado
    """
    return pwd_context.needs_update(hashed_password)


# ── Validación de fortaleza ───────────────────────────────────────────
@dataclass
class PasswordStrength:
    """
    Resultado de la validación de fortaleza de una contraseña.

    Attributes:
        is_valid:     True si cumple todos los requisitos
        score:        Puntaje de 0 a 5 (5 = más fuerte)
        errors:       Lista de requisitos que NO cumple
        suggestions:  Lista de sugerencias para mejorarla
    """
    is_valid: bool
    score: int
    errors: list[str]
    suggestions: list[str]


def validate_password_strength(password: str) -> PasswordStrength:
    """
    Valida la fortaleza de una contraseña según las políticas de KOAJ.

    Política de contraseñas:
        ✓ Mínimo 8 caracteres
        ✓ Al menos una letra mayúscula
        ✓ Al menos una letra minúscula
        ✓ Al menos un número
        ✓ Al menos un carácter especial (!@#$%^&*...)

    Args:
        password: Contraseña a validar

    Returns:
        PasswordStrength con el resultado de la validación

    Ejemplo:
        result = validate_password_strength("MiClave123!")
        if not result.is_valid:
            err("CONTRASENA_DEBIL", result.errors[0])

        # En el frontend se usa result.score para la barra de fortaleza
    """
    errors = []
    suggestions = []
    score = 0

    # Requisito 1: Longitud mínima
    if len(password) < 8:
        errors.append("Debe tener al menos 8 caracteres.")
    else:
        score += 1
        if len(password) >= 12:
            score += 1  # Bonus por contraseña larga

    # Requisito 2: Letra mayúscula
    if not re.search(r"[A-Z]", password):
        errors.append("Debe contener al menos una letra mayúscula.")
    else:
        score += 1

    # Requisito 3: Letra minúscula
    if not re.search(r"[a-z]", password):
        errors.append("Debe contener al menos una letra minúscula.")
    else:
        score += 1

    # Requisito 4: Número
    if not re.search(r"\d", password):
        errors.append("Debe contener al menos un número.")
    else:
        score += 1

    # Requisito 5: Carácter especial
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        errors.append("Debe contener al menos un carácter especial (!@#$%...).")
    else:
        score += 1

    # Sugerencias adicionales (no son errores)
    if len(password) < 12:
        suggestions.append("Usa al menos 12 caracteres para mayor seguridad.")
    if re.search(r"(.)\1{2,}", password):
        suggestions.append("Evita repetir el mismo carácter más de 2 veces seguidas.")

    # Limitar score a 5
    score = min(score, 5)

    return PasswordStrength(
        is_valid=len(errors) == 0,
        score=score,
        errors=errors,
        suggestions=suggestions,
    )


# ── Generación de contraseñas temporales ─────────────────────────────
def generate_temp_password(length: int = 12) -> str:
    """
    Genera una contraseña temporal segura y criptográficamente aleatoria.

    Garantiza que la contraseña generada cumpla con la política de KOAJ
    (tiene mayúscula, minúscula, número y especial).

    Usado cuando el admin crea un nuevo usuario o fuerza
    el cambio de contraseña (el usuario debe cambiarla en el primer login).

    Args:
        length: Longitud de la contraseña (mínimo 12)

    Returns:
        Contraseña temporal como string

    Ejemplo:
        temp_pass = generate_temp_password()
        usuario.password_hash = hash_password(temp_pass)
        usuario.primer_login = True
        # Enviar temp_pass al usuario por email (nunca guardarla en texto plano)
    """
    length = max(length, 12)  # Mínimo 12 caracteres

    # Garantizar que tenga al menos un carácter de cada tipo
    chars_upper   = secrets.choice(string.ascii_uppercase)
    chars_lower   = secrets.choice(string.ascii_lowercase)
    chars_digit   = secrets.choice(string.digits)
    chars_special = secrets.choice("!@#$%^&*")

    # Completar el resto con caracteres aleatorios del alfabeto completo
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    rest = "".join(secrets.choice(alphabet) for _ in range(length - 4))

    # Mezclar todos los caracteres
    all_chars = list(chars_upper + chars_lower + chars_digit + chars_special + rest)
    secrets.SystemRandom().shuffle(all_chars)

    return "".join(all_chars)