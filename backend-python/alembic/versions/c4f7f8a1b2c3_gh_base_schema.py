"""gh_base_schema

Revision ID: c4f7f8a1b2c3
Revises: a568a1dd6ba1
Create Date: 2026-04-15 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4f7f8a1b2c3"
down_revision: Union[str, Sequence[str], None] = "a568a1dd6ba1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Nota: scaffold inicial.
    La creación de tablas GH se completará en el siguiente paso.
    """
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
