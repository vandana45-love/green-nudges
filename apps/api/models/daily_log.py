from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    transport_kg: Mapped[float] = mapped_column(Float, default=0)
    energy_kg: Mapped[float] = mapped_column(Float, default=0)
    food_kg: Mapped[float] = mapped_column(Float, default=0)
    shopping_kg: Mapped[float] = mapped_column(Float, default=0)
    total_kg: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="daily_logs")  # noqa: F821
