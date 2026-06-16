"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-16
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("clerk_id", sa.String(128), nullable=False, unique=True),
        sa.Column("email", sa.String(256), nullable=False, unique=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"])

    op.create_table(
        "surveys",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("home_data", JSONB, nullable=False),
        sa.Column("lifestyle_data", JSONB, nullable=False),
        sa.Column("vehicle_data", JSONB, nullable=False),
        sa.Column("baseline_kg", sa.Float, nullable=False),
        sa.Column("transport_kg", sa.Float, default=0),
        sa.Column("energy_kg", sa.Float, default=0),
        sa.Column("food_kg", sa.Float, default=0),
        sa.Column("shopping_kg", sa.Float, default=0),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_index("ix_surveys_user_id", "surveys", ["user_id"])

    op.create_table(
        "daily_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("log_date", sa.Date, nullable=False),
        sa.Column("transport_kg", sa.Float, default=0),
        sa.Column("energy_kg", sa.Float, default=0),
        sa.Column("food_kg", sa.Float, default=0),
        sa.Column("shopping_kg", sa.Float, default=0),
        sa.Column("total_kg", sa.Float, default=0),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.UniqueConstraint("user_id", "log_date"),
    )
    op.create_index("ix_daily_logs_user_id", "daily_logs", ["user_id"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("category", sa.String(32)),
        sa.Column("message", sa.String(512)),
        sa.Column("savings_kg", sa.Float, default=0),
        sa.Column("is_read", sa.Boolean, default=False),
        sa.Column(
            "generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])


def downgrade():
    op.drop_table("recommendations")
    op.drop_table("daily_logs")
    op.drop_table("surveys")
    op.drop_table("users")
