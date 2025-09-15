# Evoars: Advanced AI Media Processing Platform
**Professional AI-powered platform for manga colorization, translation, and video processing**  
**Manga renklendirme, çeviri ve video işleme için profesyonel AI destekli platform**

<div align="center">

![Evoars](https://img.shields.io/badge/Evoars-AI%20Processing-FF6B6B?style=for-the-badge&logo=artificial-intelligence&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0-4ECDC4?style=for-the-badge)
![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge)

<div align="center">

**⭐ If you find this project useful, give it a star! / ⭐ Bu projeyi yararlı buluyorsanız yıldızlayın! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/koesan/Evoars?style=social)](https://github.com/koesan/Evoars)
[![GitHub forks](https://img.shields.io/github/forks/koesan/Evoars?style=social)](https://github.com/koesan/Evoars/fork)

</div>

| ![Evoars Interface](images/web.png) | ![Evoars Processing](images/web2.png) |
|:---:|:---:|

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.0-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2.2-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Docker](https://img.shields.io/badge/Docker-CUDA%2012.1-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 📎 Live Demo - Canlı Demo

[![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-Demo-yellow?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co/spaces/koesan/mangaspaces)

**🇬🇧 Try the previous version of Evoars on Hugging Face (CPU-based, processing may be slower)**  
**🇹🇷 Evoars'ın önceki sürümünü Hugging Face'te test edin (CPU tabanlı, işlem daha yavaş olabilir)**

[🇺🇸 English](#english) | [🇹🇷 Türkçe](#turkce)

</div>

---

## 🇺🇸 English

### 📖 Overview

**Evoars** is a comprehensive web-based platform that combines advanced artificial intelligence technologies to automate manga and video processing workflows. The application provides content creators with professional-grade tools through an intuitive web interface.

### ✨ Core Features & How They Work

#### 🎨 1. Manga Colorization
**Process**: Transforms black-and-white manga pages into vibrant colored artwork using deep learning neural networks.

**Technical Implementation**:
- Loads pre-trained AI colorization models (`generator.zip`)
- Processes images through PyTorch-based neural networks
- Maintains original image quality and details
- Optimizes output for natural color distribution

#### 🌐 2. Manga Translation
**Process**: Automatically detects, extracts, and translates all text elements on manga pages.

**Technical Implementation**:
1. **Text Detection**: Uses PaddleOCR to identify all text regions on the page
2. **Text Grouping**: Custom algorithm groups nearby text elements into sentences using coordinate proximity
3. **Text Processing**: Handles hyphenated words and text formatting issues
4. **Translation**: DeepL API translates processed text to target language
5. **Text Removal**: LAMA inpainting AI intelligently removes original text
6. **Text Placement**: Positions translated text naturally within original speech bubbles

#### 🔄 3. Combined Processing (Colorization + Translation)
**Process**: Performs both colorization and translation in a single optimized workflow.

**Technical Implementation**:
- First applies the complete translation process
- Then processes the translated image through colorization
- Ensures text legibility on colored backgrounds
- Maintains visual consistency throughout the process

#### 🎬 4. Video Subtitling
**Process**: Generates subtitle files from video audio using advanced speech recognition.

**Technical Implementation**:
1. **Audio Extraction**: MoviePy extracts audio track from video
2. **Speech Recognition**: OpenAI Whisper transcribes audio to text with timestamps
3. **Translation**: DeepL API translates transcript to target language
4. **SRT Generation**: Creates properly formatted subtitle files with time codes

#### 🎙️ 5. AI Dubbing
**Process**: Creates natural-sounding voiceovers in multiple languages with voice cloning.

**Technical Implementation**:
1. **Audio Analysis**: Extracts original speaker voices from video
2. **Voice Cloning**: TTS model learns speaker characteristics
3. **Text Processing**: Uses translated subtitles as dubbing script
4. **Voice Synthesis**: Generates new audio using cloned voices
5. **Audio Synchronization**: Matches timing with original video
6. **Video Integration**: Replaces original audio with dubbed version

### 🛠️ Technology Stack

**Core**: Python 3.10, Flask 3.1.0, SQLite  
**AI/ML**: PyTorch 2.2.2, PaddleOCR, OpenAI Whisper, TTS, LAMA Inpainting  
**Media**: OpenCV, FFmpeg, MoviePy, Pydub  
**UI**: HTML5, TailwindCSS, JavaScript  
**Deployment**: Docker with NVIDIA CUDA 12.1 support

### 🚀 Installation & Setup

#### Prerequisites
- **Docker** (recommended for easy setup)
- **Python 3.10+** (for manual installation)
- **NVIDIA GPU** (optional, for faster processing)
- **DeepL API Key** (free tier available)

#### Option 1: Docker Installation (Recommended)

1. **Clone Repository**
```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

2. **Download AI Models**
   
   Download the required AI models for manga colorization:
   - Get `generator.zip` from [Google Drive](https://drive.google.com/file/d/1qmxUEKADkEM4iYLp1fpPLLKnfZ6tcF-t/view)
   - Extract the contents to the `networks/` folder in your project directory

3. **Configure Translation API**
   
   You need to update the DeepL API key in **two files**:
   
   **File 1: `translate.py` (line 128)**
   ```python
   translator = deepl.Translator("YOUR_DEEPL_API_KEY_HERE")
   ```
   
   **File 2: `colorize_and_translate.py` (line 129)**
   ```python
   translator = deepl.Translator("YOUR_DEEPL_API_KEY_HERE")
   ```
   
   📝 **Get your DeepL API key**: Visit [DeepL API](https://www.deepl.com/pro-api) to obtain your free API key (500,000 characters/month free)

4. **Build and Run**
```bash
# Build Docker image
docker build -t evoars .

# Run container (with GPU support)
docker run -p 7860:7860 --gpus all evoars

# Run container (CPU only)
docker run -p 7860:7860 evoars
```

5. **Access Application**
   
   Open your browser and navigate to: **http://localhost:7860**

#### Option 2: Manual Installation

1. **Clone and Setup**
```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```

3. **Download AI Models**
   
   Download and extract `generator.zip` to the `networks/` folder as described above.

4. **Configure API Keys**
   
   Edit both `translate.py` and `colorize_and_translate.py` files to replace the DeepL API keys as shown in the Docker installation section.

5. **Run Application**
```bash
python app.py
```

6. **Access Platform**
   
   Visit: **http://localhost:7860**

### 💡 Usage Guide

#### Manga Colorization
Choose **Colorize** → Upload black-and-white manga → Submit 

#### Manga Translation
Choose **Translate** → Upload manga with text → Select source & target languages → Submit  

#### Combined (Color + Translate)
Choose **Both** → Upload manga → Set languages → Submit 

#### Video Subtitling
Choose **Subtitle** → Upload video (MP4, MOV, AVI…) → Select source language → Submit 

#### AI Dubbing
Choose **Dubbing** → Upload video + SRT file → Choose target language & voice style → Submit  

### 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

---

## 🇹🇷 Turkce

### 📖 Genel Bakış

**Evoars**, manga ve video işleme iş akışlarını otomatikleştirmek için gelişmiş yapay zeka teknolojilerini birleştiren kapsamlı bir web tabanlı platformdur. Uygulama, içerik üreticilerine sezgisel bir web arayüzü aracılığıyla profesyonel düzeyde araçlar sunar.

### ✨ Temel Özellikler ve Nasıl Çalışır

#### 🎨 1. Manga Renklendirme
**İşlem**: Derin öğrenme sinir ağları kullanarak siyah-beyaz manga sayfalarını canlı renkli sanat eserlerine dönüştürür.

**Teknik Uygulama**:
- Önceden eğitilmiş AI renklendirme modellerini yükler (`generator.zip`)
- Görüntüleri PyTorch tabanlı sinir ağları aracılığıyla işler
- Orijinal görüntü kalitesini ve detayları korur
- Doğal renk dağılımı için çıktıyı optimize eder

#### 🌐 2. Manga Çevirisi
**İşlem**: Manga sayfalarındaki tüm metin öğelerini otomatik olarak algılar, çıkarır ve çevirir.

**Teknik Uygulama**:
1. **Metin Algılama**: PaddleOCR kullanarak sayfadaki tüm metin bölgelerini tanımlar
2. **Metin Gruplama**: Özel algoritma koordinat yakınlığını kullanarak yakın metin öğelerini cümlelere gruplar
3. **Metin İşleme**: Tire ile bölünmüş kelimeler ve metin biçimlendirme sorunlarını ele alır
4. **Çeviri**: DeepL API işlenmiş metni hedef dile çevirir
5. **Metin Kaldırma**: LAMA inpainting AI orijinal metni akıllıca kaldırır
6. **Metin Yerleştirme**: Çevrilmiş metni orijinal konuşma balonları içinde doğal olarak konumlandırır

#### 🔄 3. Birleşik İşleme (Renklendirme + Çeviri)
**İşlem**: Tek bir optimize edilmiş iş akışında hem renklendirme hem de çeviri gerçekleştirir.

**Teknik Uygulama**:
- Önce tüm çeviri sürecini uygular
- Sonra çevrilmiş görüntüyü renklendirme işleminden geçirir
- Renkli arka planlarda metin okunabilirliğini sağlar
- Süreç boyunca görsel tutarlılığı korur

#### 🎬 4. Video Altyazılama
**İşlem**: Gelişmiş konuşma tanıma kullanarak video sesinden altyazı dosyaları oluşturur.

**Teknik Uygulama**:
1. **Ses Çıkarma**: MoviePy video dosyasından ses parçasını çıkarır
2. **Konuşma Tanıma**: OpenAI Whisper sesi zaman damgalarıyla birlikte metne dönüştürür
3. **Çeviri**: DeepL API transkripti hedef dile çevirir
4. **SRT Oluşturma**: Zaman kodlarıyla düzgün biçimlendirilmiş altyazı dosyaları oluşturur

#### 🎙️ 5. AI Dublajı
**İşlem**: Ses klonlama ile birden fazla dilde doğal sesli seslendirmeler oluşturur.

**Teknik Uygulama**:
1. **Ses Analizi**: Videodan orijinal konuşmacı seslerini çıkarır
2. **Ses Klonlama**: TTS modeli konuşmacı özelliklerini öğrenir
3. **Metin İşleme**: Çevrilmiş altyazıları dublaj metni olarak kullanır
4. **Ses Sentezi**: Klonlanmış sesleri kullanarak yeni ses oluşturur
5. **Ses Senkronizasyonu**: Orijinal video ile zamanlamayı eşleştirir
6. **Video Entegrasyonu**: Orijinal sesi dublajlı sürümle değiştirir

### 🛠️ Teknoloji Yığını

**Temel**: Python 3.10, Flask 3.1.0, SQLite  
**AI/ML**: PyTorch 2.2.2, PaddleOCR, OpenAI Whisper, TTS, LAMA Inpainting  
**Medya**: OpenCV, FFmpeg, MoviePy, Pydub  
**UI**: HTML5, TailwindCSS, JavaScript  
**Dağıtım**: NVIDIA CUDA 12.1 destekli Docker

### 🚀 Kurulum ve Yapılandırma

#### Gereksinimler
- **Docker** (kolay kurulum için önerilir)
- **Python 3.10+** (manuel kurulum için)
- **NVIDIA GPU** (isteğe bağlı, daha hızlı işleme için)
- **DeepL API Key** (ücretsiz katman mevcut)

#### Seçenek 1: Docker Kurulumu (Önerilen)

1. **Depoyu Klonlayın**
```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

2. **AI Modellerini İndirin**
   
   Manga renklendirme için gerekli AI modellerini indirin:
   - `generator.zip` dosyasını [Google Drive](https://drive.google.com/file/d/1qmxUEKADkEM4iYLp1fpPLLKnfZ6tcF-t/view) üzerinden indirin
   - İçeriği proje dizininizdeki `networks/` klasörüne çıkarın

3. **Çeviri API'sini Yapılandırın**
   
   DeepL API anahtarını **iki dosyada** güncellemeniz gerekiyor:
   
   **Dosya 1: `translate.py` (128. satır)**
   ```python
   translator = deepl.Translator("DEEPL_API_ANAHTARINIZ")
   ```
   
   **Dosya 2: `colorize_and_translate.py` (129. satır)**
   ```python
   translator = deepl.Translator("DEEPL_API_ANAHTARINIZ")
   ```
   
   📝 **DeepL API anahtarınızı alın**: Ücretsiz API anahtarınız için [DeepL API](https://www.deepl.com/pro-api) sitesini ziyaret edin (ayda 500.000 karakter ücretsiz)

4. **Oluşturun ve Çalıştırın**
```bash
# Docker imajını oluşturun
docker build -t evoars .

# Container'ı çalıştırın (GPU desteği ile)
docker run -p 7860:7860 --gpus all evoars

# Container'ı çalıştırın (sadece CPU)
docker run -p 7860:7860 evoars
```

5. **Uygulamaya Erişin**
   
   Tarayıcınızı açın ve şu adrese gidin: **http://localhost:7860**

#### Seçenek 2: Manuel Kurulum

1. **Klonlayın ve Kurun**
```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

2. **Bağımlılıkları Yükleyin**
```bash
pip install -r requirements.txt
```

3. **AI Modellerini İndirin**
   
   Yukarıda açıklandığı gibi `generator.zip` dosyasını indirin ve `networks/` klasörüne çıkarın.

4. **API Anahtarlarını Yapılandırın**
   
   Hem `translate.py` hem de `colorize_and_translate.py` dosyalarını düzenleyin ve DeepL API anahtarlarını Docker kurulum bölümünde gösterildiği gibi değiştirin.

5. **Uygulamayı Çalıştırın**
```bash
python app.py
```

6. **Platforma Erişin**
   
   Şu adresi ziyaret edin: **http://localhost:7860**

### 💡 Kullanım Kılavuzu

#### Manga Renklendirme
**Colorize** seçin → Siyah-beyaz resmi yükleyin → Submit  

#### Manga Çevirisi
**Translate** seçin → Manga resmini yükleyin → Kaynak & hedef dili seçin → Submit  

#### Birleşik (Renk + Çeviri)
**Both** seçin → Manga resmini yükleyin → Dil ayarını yapın → Submit  

#### Video Altyazılama
**Subtitle** seçin → Videoyu yükleyin → Kaynak dili seçin → Submit  

#### AI Dublaj
**Dubbing** seçin → Video + SRT dosyasını yükleyin → Dil & ses stilini seçin → Submit  

### 🤝 Katkıda Bulunma

1. Depoyu fork edin
2. Özellik dalı oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişiklikleri commit edin (`git commit -m 'Yeni özellik ekle'`)
4. Dala push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

---

### 📄 License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
