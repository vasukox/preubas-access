"""
Utilidades de archivos para KOAJ Access.
"""

from __future__ import annotations

import re
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import settings


ALLOWED_PDF_CONTENT_TYPES = {
    "application/pdf",
    "application/x-pdf",
}


def _sanitize_name(name: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_\-]", "_", name).strip("_")
    return value or "archivo"


async def save_pdf_upload(
    *,
    file: UploadFile,
    folder: str,
    filename_prefix: str,
) -> tuple[str, int]:
    """
    Guarda un PDF en disco y retorna:
      - ruta relativa dentro de UPLOAD_DIR
      - tamaño en bytes
    """
    filename = file.filename or "archivo.pdf"
    if not filename.lower().endswith(".pdf"):
        raise ValueError("Solo se permiten archivos PDF (.pdf).")

    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_PDF_CONTENT_TYPES:
        raise ValueError("El archivo debe tener content-type application/pdf.")

    content = await file.read()
    size = len(content)

    if size == 0:
        raise ValueError("El archivo está vacío.")

    if size > settings.max_upload_size_bytes:
        raise ValueError(
            f"El archivo excede el máximo permitido de {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    base_dir = Path(settings.UPLOAD_DIR)
    target_dir = base_dir / folder
    target_dir.mkdir(parents=True, exist_ok=True)

    safe_prefix = _sanitize_name(filename_prefix)
    final_name = f"{safe_prefix}_{uuid4().hex}.pdf"
    output_path = target_dir / final_name
    output_path.write_bytes(content)

    relative_path = output_path.relative_to(base_dir).as_posix()
    return relative_path, size
