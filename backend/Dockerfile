FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/uploads /app/models

RUN wget -P /app/models https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth || echo "SAM weights will be downloaded on first use"

COPY . .

ENV PYTHONUNBUFFERED=1
ENV TORCH_HOME=/app/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
