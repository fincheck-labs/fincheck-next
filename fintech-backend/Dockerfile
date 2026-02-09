# ==================================================
# Base image (CPU, slim, production-safe)
# ==================================================
FROM python:3.12-slim

# ==================================================
# Environment
# ==================================================
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata \
    TORCH_HOME=/app/.torch

# ==================================================
# System dependencies (OpenCV + OCR + Torch runtime)
# ==================================================
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        build-essential \
        tesseract-ocr \
        tesseract-ocr-eng \
        libglib2.0-0 \
        libgl1 \
        libsm6 \
        libxext6 \
        libxrender1 \
        ca-certificates \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# ==================================================
# Work directory
# ==================================================
WORKDIR /app

# ==================================================
# Python dependencies (cached layer)
# ==================================================
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ==================================================
# Copy project files
# ==================================================
COPY . .

# ==================================================
# Download model weights (build-time, ONCE)
# Safe because ensure_models() is idempotent
# ==================================================
RUN python download_modes.py

# ==================================================
# Expose FastAPI port
# ==================================================
EXPOSE 8000

# ==================================================
# Start FastAPI server
# ==================================================
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
