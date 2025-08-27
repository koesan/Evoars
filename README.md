# Evoars: Multi AI Model Web Platform

| ![Evoars Web Ekran Görüntüsü](images/web.png) | ![Evoars Web Ekran Görüntüsü 2](images/web2.png) |
|:---:|:---:|

## 📎 Demo (Eski Sürüm) – Demo (Old Version)

[![Hugging Face](https://huggingface.co/front/assets/huggingface_logo-noborder.svg)](https://huggingface.co/spaces/koesan/mangaspaces)

**🇹🇷 Evoars'ın önceki sürümünü Hugging Face üzerinde test etmek için yukarıdaki simgeye tıklayabilirsiniz.**  
**🇬🇧 You can click the icon above to test an older version of Evoars on Hugging Face.**

-----

## English

### Introduction

**Evoars** is a comprehensive web application that automates manga and video processing workflows using AI-powered features. The platform offers a robust set of tools for content creators and consumers by automatically colorizing and translating manga pages, as well as adding subtitles and generating voiceovers (dubbing) for videos.

## Core Features

### Manga Processing

  - **AI-Powered Colorization**: Automatically transforms black-and-white manga pages into vibrant, natural-looking colors.
  - **Automatic Text Translation**: Instantly translates text within manga bubbles using AI translation services. The project defaults to English-Turkish translation.
  - **Combined Operation**: Allows users to perform both colorization and translation simultaneously with a single command.
  - **Intelligent Text Cleanup**: During translation, the original text is removed and replaced with the translated version, ensuring a clean and polished final image.

### Video Processing

  - **Speech-to-Text Subtitling**: Automatically analyzes the audio of uploaded videos and transcribes the speech to generate a subtitle file (.srt).
  - **AI-Powered Dubbing**: Utilizes AI voices to automatically dub videos in a selected target language, based on the provided video and subtitle files.

### User Experience

  - **Modern and Responsive Interface**: A clean, intuitive, and user-friendly interface makes all operations simple and straightforward.
  - **Microservice Architecture**: Core functionalities (`colorize.py`, `translate.py`, `subtitles.py`, `manuel_dubbing.py`) are organized into separate files, ensuring a modular and manageable project structure.
  - **Automatic Download**: All processed results (colorized manga, translated pages, subtitles, and dubbed videos) are automatically downloaded as a single ZIP file, streamlining the workflow.

## Installation and Launch Instructions

Follow these steps in sequence to ensure the project runs smoothly on your local machine.

### Step 1: Clone the Repository

Download the project files to your local machine.

```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

### Step 2: Install Required Dependencies

Install all the necessary Python libraries for the project to function correctly. You can install all dependencies at once using the following command.

```bash
pip3 install deepl==1.17.0 paddleocr==2.7.3 paddlepaddle==2.6.1 simple-lama-inpainting==0.1.0 torch==2.2.2 torchvision==0.17.2 tqdm==4.66.2 textwrap3==0.9.2 Flask==3.1.0 python-dotenv==1.0.1
```

### Step 3: Download Required AI Models

The project's manga colorization and text processing features require AI models to be downloaded.

  - Download the `generator.zip` file from [this link](https://drive.google.com/file/d/1qmxUEKADkEM4iYLp1fpPLLKnfZ6tcF-t/view).
  - Unzip the downloaded file and place its contents into the `networks` folder of your cloned repository.

### Step 4: Configure Environment Variables

Provide your API key for the translation service.

  - Create a new file named `.env` in the root directory of the project.
  - Add the following line to your `.env` file, replacing `Your_DeepL_API_Key` with your actual key.

<!-- end list -->

```env
DEEPL_AUTH_KEY="Your_DeepL_API_Key"
```

> **Note:** You can obtain your DeepL API key by visiting the official [DeepL API](https://www.deepl.com/pro-api) website.

### Step 5: Start the Application

Once all setup steps are complete, run the following command to start the server.

```bash
python app.py
```

### Step 6: Access the Platform

Open your web browser and navigate to the following address to access the application:

```
http://127.0.0.1:5000
```

You are now ready to start processing your manga and videos using the Evoars platform\!

-----

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](https://www.google.com/search?q=https://github.com/koesan/Evoars/blob/main/LICENSE) file for details.

-----

## Türkçe

## Giriş

**Evoars**, yapay zeka gücünü kullanarak medya işleme süreçlerini otomatikleştiren kapsamlı bir web uygulamasıdır. Bu platform, manga sayfalarını renklendirme ve çevirme gibi temel işlevlerin yanı sıra, videolara otomatik altyazı ekleme ve yapay zeka ile dublaj yapma gibi gelişmiş yetenekler sunarak içerik üreticileri ve tüketicileri için güçlü, hepsi bir arada bir çözüm sunar.

## Temel Özellikler

### Manga İşleme

  - **Yapay Zeka Destekli Renklendirme**: Siyah-beyaz manga sayfalarını hızlı ve doğru bir şekilde, doğal renk tonlarıyla renklendirir.
  - **Otomatik Metin Çevirisi**: Manga baloncuklarındaki metinleri yapay zeka çeviri servisleri aracılığıyla anında çevirir. Proje varsayılan olarak İngilizce-Türkçe çeviriyi destekler.
  - **Birleşik İşlem**: Kullanıcıların renklendirme ve çeviri işlemlerini tek bir komutla eş zamanlı olarak gerçekleştirmesini sağlar.
  - **Akıllı Metin Temizleme**: Çeviri işlemi sırasında orijinal metni siler ve yerine çevrilmiş metni yerleştirir, bu sayede temiz bir görüntü elde edilir.

### Video İşleme

  - **Konuşmadan Metne Altyazı**: Yüklenen videoların sesini otomatik olarak analiz eder ve konuşmaları metne dökerek altyazı dosyası (.srt) oluşturur.
  - **Yapay Zeka Destekli Dublaj**: Yüklenen video ve altyazı dosyalarını kullanarak, seçilen dilde doğal ve akıcı bir dublaj (seslendirme) yapar.

### Kullanıcı Deneyimi

  - **Modern ve Duyarlı Arayüz**: Temiz, anlaşılır ve kullanımı kolay bir arayüz ile tüm işlemler basit bir şekilde gerçekleştirilebilir.
  - **Mikroservis Mimarisi**: Çekirdek işlevler (`colorize.py`, `translate.py`, `subtitles.py`, `manuel_dubbing.py`) ayrı dosyalarda düzenlenerek projenin modüler ve kolay yönetilebilir olması sağlanmıştır.
  - **Otomatik İndirme**: İşlenen tüm sonuçlar (renklendirilmiş mangalar, çevrilmiş sayfalar, altyazılar ve dublajlı videolar) tek bir ZIP dosyası olarak otomatikman indirilir, bu da iş akışını hızlandırır.

## Kurulum ve Başlatma Talimatları

Projenin yerel makinenizde sorunsuz bir şekilde çalıştırılması için aşağıdaki adımları sırasıyla takip edin.

### Adım 1: Depoyu Klonlama

Proje dosyalarını yerel makinenize indirin.

```bash
git clone https://github.com/koesan/Evoars.git
cd Evoars
```

### Adım 2: Gerekli Bağımlılıkları Yükleme

Projenin tüm özelliklerini kullanabilmek için gerekli Python kütüphanelerini yükleyin. Aşağıdaki komutu kullanarak tüm bağımlılıkları tek seferde kurabilirsiniz.

```bash
pip3 install deepl==1.17.0 paddleocr==2.7.3 paddlepaddle==2.6.1 simple-lama-inpainting==0.1.0 torch==2.2.2 torchvision==0.17.2 tqdm==4.66.2 textwrap3==0.9.2 Flask==3.1.0 python-dotenv==1.0.1
```

### Adım 3: Gerekli Yapay Zeka Modellerini İndirme

Projenin manga renklendirme ve metin işleme kısımları için yapay zeka modellerinin indirilmesi gerekmektedir.

  - `generator.zip` dosyasını [bu bağlantıdan](https://drive.google.com/file/d/1qmxUEKADkEM4iYLp1fpPLLKnfZ6tcF-t/view) indirin.
  - İndirdiğiniz ZIP dosyasını açın ve içeriğini klonladığınız projenin `networks` klasörüne yerleştirin.

### Adım 4: Ortam Değişkenlerini Yapılandırma

Çeviri servisi için API anahtarınızı projeye tanıtın.

  - Projenin ana dizininde `.env` adında yeni bir dosya oluşturun.
  - Oluşturduğunuz `.env` dosyasının içine aşağıdaki satırı ekleyin ve `Sizin_DeepL_API_Anahtarınız` kısmını kendi anahtarınızla değiştirin.

<!-- end list -->

```env
DEEPL_AUTH_KEY="Sizin_DeepL_API_Anahtarınız"
```

> **Not:** DeepL API anahtarınızı almak için [DeepL API](https://www.deepl.com/pro-api) resmi web sitesini ziyaret edebilirsiniz.

### Adım 5: Uygulamayı Başlatma

Tüm kurulum adımları tamamlandıktan sonra, sunucuyu başlatmak için aşağıdaki komutu çalıştırın.

```bash
python app.py
```

### Adım 6: Platforma Erişim

Sunucu başlatıldığında, web tarayıcınızı açın ve aşağıdaki adrese giderek uygulamaya erişim sağlayın:

```
http://127.0.0.1:5000
```

Artık Evoars platformunu kullanarak manga ve videolarınızı işlemeye başlayabilirsiniz\!

