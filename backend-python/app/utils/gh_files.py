"""
Helpers de archivos para el módulo Gestión Humana (GH).
"""

from pathlib import Path


def gh_uploads_root() -> Path:
    return Path("uploads") / "gh"


def gh_import_file_path(sede_id: int, filename: str) -> Path:
    safe_name = filename.replace("..", "_").replace("/", "_").replace("\\", "_")
    return gh_uploads_root() / "importaciones" / str(sede_id) / safe_name
