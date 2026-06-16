from datetime import datetime
from sqlalchemy import Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db import Base


class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    home_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    lifestyle_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    vehicle_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    baseline_kg: Mapped[float] = mapped_column(Float, nullable=False)
    transport_kg: Mapped[float] = mapped_column(Float, default=0)
    energy_kg: Mapped[float] = mapped_column(Float, default=0)
    food_kg: Mapped[float] = mapped_column(Float, default=0)
    shopping_kg: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="surveys")  # noqa: F821
