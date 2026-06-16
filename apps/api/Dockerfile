FROM python:3.12-slim

# Don't run as root
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

# Install deps first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Switch to non-root user
USER app

ENV PYTHONUNBUFFERED=1
ENV ENV=production
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
