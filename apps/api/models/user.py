from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    clerk_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(256), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    surveys: Mapped[list["Survey"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    daily_logs: Mapped[list["DailyLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
