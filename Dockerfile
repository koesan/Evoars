FROM nvidia/cuda:12.1.1-cudnn8-devel-ubuntu20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    wget \
    curl \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    libsndfile1 \
    build-essential \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y python3.10 python3.10-dev python3.10-distutils && \
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN python3.10 -m pip install --upgrade pip

# Non-root kullanıcı oluştur
RUN useradd -m -u 1000 -s /bin/bash user

# Çalışma dizinini user'ın evi olarak ayarla
WORKDIR /home/user/app

# Ortam değişkenlerini ayarla
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    MPLCONFIGDIR=/home/user/app/cache/matplotlib \
    PADDLE_HOME=/home/user/app/.paddleocr \
    PADDLEOCR_HOME=/home/user/app/.paddleocr \
    TORCH_HOME=/home/user/app/cache/torch \
    NUMBA_CACHE_DIR=/home/user/app/cache/numba \
    XDG_CACHE_HOME=/home/user/.cache \
    XDG_CONFIG_HOME=/home/user/.config \
    TTS_MODEL_PATH=/home/user/app/models \
    PYTHONPATH=/home/user/app

# Gerekli ana dizinleri oluştur ve user'a sahipliğini ver (root iken)
RUN mkdir -p \
    /home/user/app/uploads \
    /home/user/app/history_files \
    /home/user/app/cache/matplotlib \
    /home/user/app/.paddleocr \
    /home/user/app/cache/torch \
    /home/user/app/cache/numba \
    /home/user/app/models \
    /home/user/.cache \
    /home/user/.config \
    /home/user/.local/share/tts/tts_models--multilingual--multi-dataset--xtts_v2 && \
    chown -R user:user /home/user

# requirements.txt dosyasını kopyala
COPY requirements.txt .

# Bağımlılıkları kur
RUN python3.10 -m pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY --chown=user:user . /home/user/app/

# Son kullanıcıyı ayarla
USER user

EXPOSE 7860

CMD ["python3.10", "app.py"]