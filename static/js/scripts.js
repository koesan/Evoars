document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");

    const processSelectionDiv = document.getElementById('processSelection');
    const dynamicFormArea = document.getElementById('dynamicFormArea');
    const resultsArea = document.getElementById('resultsArea');
    const resultContent = document.getElementById('resultContent');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitBtn = document.getElementById('submitBtn');
    const submitAgainBtn = document.getElementById('submitAgainBtn');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarHistoryContainer = document.getElementById('sidebarHistory');

    let currentOperation = '';
    let currentFormElement = null;

    // --- YENİ GEÇMİŞ YÖNETİMİ FONKSİYONLARI ---
    async function loadAndRenderHistory() {
        if (!sidebarHistoryContainer) {
            console.warn("Sidebar history container not found.");
            return;
        }
        sidebarHistoryContainer.innerHTML = ''; // Önce temizle

        try {
            const response = await fetch('/get_history');
            if (!response.ok) {
                console.error("Failed to fetch history:", response.status, await response.text());
                sidebarHistoryContainer.innerHTML = `<p class="text-sm text-red-400 text-center px-2" data-translate="history_load_error">Error loading history.</p>`;
                if (typeof window.applyTranslationsGlobally === "function") window.applyTranslationsGlobally(localStorage.getItem('preferredLanguage') || 'en');
                return;
            }
            const historyItems = await response.json();

            if (historyItems.length === 0) {
                const noHistoryMessage = document.createElement('p');
                noHistoryMessage.className = 'text-sm text-gray-400 text-center px-2';
                noHistoryMessage.setAttribute('data-translate', 'no_history_message');
                noHistoryMessage.textContent = 'No past operations yet.'; // Varsayılan metin
                sidebarHistoryContainer.appendChild(noHistoryMessage);
                if (typeof window.applyTranslationsGlobally === "function") window.applyTranslationsGlobally(localStorage.getItem('preferredLanguage') || 'en');
                return;
            }

            historyItems.forEach(item => {
                const historyItemDiv = document.createElement('div');
                let borderColorClass = 'border-gray-500 border-opacity-40';
                if (item.status === 'failed') {
                    borderColorClass = 'border-red-500 border-opacity-60';
                }
                historyItemDiv.className = `bg-customBlackHover p-3 rounded ${borderColorClass} cursor-pointer hover:bg-customBlack transition-colors duration-150 history-item-selectable`;
                historyItemDiv.dataset.operationId = item.id;
                historyItemDiv.title = `Operation: ${item.operationName}\nFile(s): ${item.fileName || 'N/A'}\nTime: ${new Date(item.timestamp).toLocaleString()}\nStatus: ${item.status}`;

                const operationNameEl = document.createElement('h4');
                operationNameEl.className = 'text-md font-semibold truncate';
                operationNameEl.textContent = item.operationName;
                if (item.status === 'failed') {
                    operationNameEl.textContent += " (Failed)";
                    operationNameEl.classList.add('text-red-400');
                } else {
                    operationNameEl.classList.add('text-primary');
                }
                historyItemDiv.appendChild(operationNameEl);

                if (item.fileName) {
                    const fileNameEl = document.createElement('p');
                    fileNameEl.className = 'text-xs text-gray-400 truncate';
                    fileNameEl.textContent = `File(s): ${item.fileName}`;
                    historyItemDiv.appendChild(fileNameEl);
                }

                const timeEl = document.createElement('p');
                timeEl.className = 'text-xs text-gray-400';
                timeEl.textContent = `Time: ${new Date(item.timestamp).toLocaleString()}`;
                historyItemDiv.appendChild(timeEl);

                if (item.status === 'failed') {
                    const statusEl = document.createElement('p');
                    statusEl.className = 'text-xs text-red-500 mt-1';
                    statusEl.textContent = 'Status: Failed';
                    historyItemDiv.appendChild(statusEl);
                }

                historyItemDiv.addEventListener('click', () => showHistoryItemDetails(item.id));
                sidebarHistoryContainer.appendChild(historyItemDiv);
            });
        } catch (error) {
            console.error("Error fetching/rendering history:", error);
            sidebarHistoryContainer.innerHTML = `<p class="text-sm text-red-400 text-center px-2" data-translate="history_load_error">Error loading history.</p>`;
        }
        if (typeof window.applyTranslationsGlobally === "function") {
            window.applyTranslationsGlobally(localStorage.getItem('preferredLanguage') || 'en');
        }
    }

    // scripts.js

// ... (önceki kodlar aynı) ...

async function showHistoryItemDetails(operationId) {
    console.log("Showing details for operation:", operationId);
    // ... (modal kapatma, ana alanları gizleme/gösterme aynı) ...
    if (modalBackdrop && (modalBackdrop.style.display === 'block' || (sidebarMenu && !sidebarMenu.classList.contains('-translate-x-full')))) {
        modalBackdrop.click();
    }

    if (processSelectionDiv) processSelectionDiv.classList.add('hidden');
    if (dynamicFormArea) dynamicFormArea.classList.add('hidden');
    if (resultsArea) resultsArea.classList.remove('hidden');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');
    if (resultContent) resultContent.innerHTML = '';


    try {
        const response = await fetch(`/get_history_item_details/${operationId}`);
        // ... (loading ve response.ok kontrolü aynı) ...
        if (loadingIndicator) loadingIndicator.classList.add('hidden');

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            let errorData;
            if (contentType && contentType.includes("application/json")) {
                errorData = await response.json();
            } else {
                const errorText = await response.text();
                console.error("Backend returned non-JSON error:", errorText.substring(0, 500));
                errorData = { error: 'Server returned an unexpected response. Check server logs.' };
            }
            resultContent.innerHTML = `<p class="text-red-400 text-center py-4">${errorData.error || 'Could not load operation details.'}</p>`;
            return;
        }
        const details = await response.json();


        // ... (başlık ve zaman damgası aynı) ...
        const historyDetailTitle = document.createElement('h2');
        historyDetailTitle.className = 'text-xl font-semibold mb-1 text-center';
        historyDetailTitle.textContent = `Details for: ${details.operation_name}`;
        resultContent.appendChild(historyDetailTitle);

        const historyDetailTime = document.createElement('p');
        historyDetailTime.className = 'text-xs text-gray-400 mb-6 text-center';
        historyDetailTime.textContent = `Processed on: ${new Date(details.timestamp).toLocaleString()} (Status: ${details.status})`;
        resultContent.appendChild(historyDetailTime);


        if (details.status === 'failed') {
            // ... (hata mesajı gösterimi aynı) ...
        }

        // --- Girdiler ve Çıktılar için Ana Kapsayıcı (Yan Yana Düzen) ---
        const ioMainContainer = document.createElement('div');
        // md:grid-cols-2 ile iki sütunlu yapar. Her sütun kendi içeriğinden sorumlu olur.
        // overflow-hidden ekleyerek, bir sütunun içeriğinin diğerine taşmasını engelleyebiliriz.
        // Ancak bu, içerdeki overflow-x-auto'nun çalışması için gerekli değil.
        ioMainContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8';
        resultContent.appendChild(ioMainContainer);


        // --- INPUTS BÖLÜMÜ ---
        const inputsSection = document.createElement('div');
        // Sütunun kendi yüksekliği içeriğine göre ayarlanacak,
        // ve içindeki container yatayda kayacak.
        // `min-w-0` veya `overflow-hidden` grid item'ının taşmasını engellemeye yardımcı olabilir.
        inputsSection.className = 'min-w-0'; // Grid item'ının içeriği sıkıştırmasını sağlar.
        ioMainContainer.appendChild(inputsSection);

        const inputsTitle = document.createElement('h3');
        inputsTitle.className = 'text-lg font-medium mb-4 text-gray-300 text-center md:text-left';
        inputsTitle.textContent = 'Inputs';
        inputsSection.appendChild(inputsTitle);

        const inputsContainer = document.createElement('div');
        // DEĞİŞİKLİK: Girdiler için YATAY düzen, kendi içinde kaydırmalı
        inputsContainer.className = 'flex overflow-x-auto space-x-4 pb-4 horizontal-scroll-custom';

        if (details.input_text_content) {
            const textItemDiv = await createFileDisplayElement(
                "Manga Text (Input)",
                details.input_text_content, null, true, 'text/plain',
                false // isVerticalCard = false (yatay kartlar için)
            );
            inputsContainer.appendChild(textItemDiv);
        }

        if (details.inputs && details.inputs.length > 0) {
            for (const file of details.inputs) {
                const fileDiv = await createFileDisplayElement(
                    file.original_filename, null, file.download_url, true, file.mimetype,
                    false // isVerticalCard = false
                );
                inputsContainer.appendChild(fileDiv);
            }
        }
        if (inputsContainer.children.length === 0) {
            inputsContainer.innerHTML = `<p class="text-sm text-gray-500 text-center">No file inputs for this operation.</p>`;
        }
        inputsSection.appendChild(inputsContainer);


        // --- OUTPUTS BÖLÜMÜ ---
        const outputsSection = document.createElement('div');
        outputsSection.className = 'min-w-0'; // Grid item'ının içeriği sıkıştırmasını sağlar.
        ioMainContainer.appendChild(outputsSection);

        const outputsTitle = document.createElement('h3');
        outputsTitle.className = 'text-lg font-medium mb-4 text-gray-300 text-center md:text-left';
        outputsTitle.textContent = 'Outputs';
        outputsSection.appendChild(outputsTitle);

        const outputsContainer = document.createElement('div');
        // DEĞİŞİKLİK: Çıktılar için de YATAY düzen, kendi içinde kaydırmalı
        outputsContainer.className = 'flex overflow-x-auto space-x-4 pb-4 horizontal-scroll-custom';

        if (details.outputs && details.outputs.length > 0) {
            for (const file of details.outputs) {
                const fileDiv = await createFileDisplayElement(
                    file.original_filename, null, file.download_url, true, file.mimetype,
                    false // isVerticalCard = false
                );
                outputsContainer.appendChild(fileDiv);
            }
        } else if (details.status === 'success') {
             outputsContainer.innerHTML = `<p class="text-sm text-gray-500 text-center">No output files were generated.</p>`;
        }
        outputsSection.appendChild(outputsContainer);


        // --- ZIP İNDİRME BUTONU ---
        if (details.overall_zip_download_url && details.status === 'success') {
            // ... (ZIP indirme butonu aynı kalabilir, ioMainContainer'ın altında) ...
             const zipDiv = document.createElement('div');
            zipDiv.className = `flex flex-col items-center mt-8 pt-6 border-t border-customBorder col-span-1 md:col-span-2`;
            const zipTitle = document.createElement('h4');
            zipTitle.className = 'text-lg font-semibold mb-3';
            zipTitle.textContent = "Download All Outputs (.zip)";
            zipDiv.appendChild(zipTitle);
            const zipLink = document.createElement('a');
            zipLink.href = details.overall_zip_download_url;
            zipLink.className = 'bg-lightGreen hover:bg-lightGreenHover text-white py-3 px-8 rounded !rounded-button font-medium flex items-center gap-2 text-base';
            zipLink.innerHTML = `<i class="ri-folder-zip-line ri-lg"></i> <span>Download ZIP</span>`;
            zipDiv.appendChild(zipLink);
            resultContent.appendChild(zipDiv);
        }

        // ... (fonksiyonun sonu aynı) ...
        if (!resultContent.hasChildNodes() || resultContent.textContent.trim() === "" || (ioMainContainer.children.length === 0 && !(details.overall_zip_download_url && details.status === 'success'))) {
            resultContent.innerHTML = `<p class="text-yellow-400 text-center py-4">No details to display for this operation.</p>`;
        }


    } catch (error) {
        // ... (hata yönetimi aynı) ...
        console.error("Error fetching/displaying history item details:", error);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        resultContent.innerHTML = `<p class="text-red-400 text-center py-4">Could not load operation details. ${error.message}</p>`;
    }
    if (typeof window.applyTranslationsGlobally === "function") {
        window.applyTranslationsGlobally(localStorage.getItem('preferredLanguage') || 'en');
    }
}

// createFileDisplayElement fonksiyonu, isVerticalCard parametresini alacak şekilde kalmalı
// ve isVerticalCard false ise yatay kart stilini uygulamalı.
async function createFileDisplayElement(filename, textContent, downloadUrl, isPreviewable, mimetype, isInputOrOutputItem = false, isVerticalCard = false) { // isVerticalCard parametresi eklendi
    const itemDiv = document.createElement('div');
    
    if (isVerticalCard) {
        // Dikey kart için (bu senaryoda KULLANILMAYACAK, ama fonksiyon genel kalsın)
        itemDiv.className = 'bg-customBlackHover p-4 rounded-lg shadow-lg flex flex-col items-center w-full';
    } else {
        // Yatay kaydırmalı düzen için (İSTENEN BU)
        itemDiv.className = 'bg-customBlackHover p-3 rounded-lg shadow-lg flex flex-col items-center flex-shrink-0 w-60 md:w-64';
    }

    const fileNameP = document.createElement('p');
    fileNameP.className = 'text-sm font-semibold text-gray-200 mb-2 truncate w-full text-center';
    fileNameP.textContent = filename;
    itemDiv.appendChild(fileNameP);

    const previewContainer = document.createElement('div');
    if (isVerticalCard) {
        previewContainer.className = 'w-full max-w-xs h-48 flex items-center justify-center mb-2 overflow-hidden bg-customBlack rounded';
    } else {
        // Yatay kart için önizleme yüksekliği
        previewContainer.className = 'w-full h-40 flex items-center justify-center mb-2 overflow-hidden bg-customBlack rounded';
    }
    itemDiv.appendChild(previewContainer);

    // ... (Önizleme mantığının geri kalanı (previewAdded vs.) aynı kalabilir) ...
    let previewAdded = false;
    if (isPreviewable) {
        if (textContent && mimetype === 'text/plain') {
            const pre = document.createElement('pre');
            pre.className = 'text-xs p-2 overflow-auto max-h-full w-full text-gray-300 whitespace-pre-wrap';
            pre.textContent = textContent;
            previewContainer.appendChild(pre);
            previewAdded = true;
        } else if (downloadUrl && mimetype) {
            if (mimetype.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = downloadUrl;
                img.alt = filename;
                img.className = 'max-h-full max-w-full rounded object-contain shadow cursor-pointer hover:opacity-80 transition-opacity';
                img.addEventListener('click', () => { if (typeof window.globalOpenZoomModal === 'function') window.globalOpenZoomModal(downloadUrl); });
                previewContainer.appendChild(img);
                previewAdded = true;
            } else if (mimetype.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = downloadUrl; video.controls = true;
                video.className = 'max-h-full max-w-full rounded shadow';
                previewContainer.appendChild(video);
                previewAdded = true;
            } else if (mimetype.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.src = downloadUrl; audio.controls = true;
                audio.className = 'w-full rounded shadow';
                previewContainer.appendChild(audio);
                previewAdded = true;
            } else if (mimetype === 'text/plain' || (filename && filename.endsWith('.srt'))) {
                try {
                    const textResponse = await fetch(downloadUrl);
                    if (textResponse.ok) {
                        const rawText = await textResponse.text();
                        const pre = document.createElement('pre');
                        pre.className = 'text-xs p-2 overflow-auto max-h-full w-full text-gray-300 whitespace-pre-wrap';
                        pre.textContent = rawText;
                        previewContainer.appendChild(pre);
                        previewAdded = true;
                    } else {
                         console.warn(`Failed to fetch text content for ${filename}: ${textResponse.status}`);
                    }
                } catch (e) { console.error("Error fetching text content for preview:", e); }
            }
        }
    }

    if (!previewAdded) {
        const p = document.createElement('p');
        p.innerHTML = `<i class="ri-file-unknow-line ri-3x text-gray-500"></i>`;
        p.className = 'text-sm text-gray-400 text-center';
        previewContainer.appendChild(p);
        const noPreviewText = document.createElement('span');
        noPreviewText.className = 'block text-xs text-gray-500 mt-1';
        noPreviewText.setAttribute('data-translate', 'preview_not_available_short');
        previewContainer.appendChild(noPreviewText);
    }


    if (downloadUrl) {
        const downloadButton = document.createElement('a');
        downloadButton.href = downloadUrl;
        downloadButton.target = "_blank";
        downloadButton.className = 'bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 text-xs rounded !rounded-button whitespace-nowrap flex items-center justify-center gap-1 w-full mt-2';
        downloadButton.innerHTML = `<i class="ri-download-2-line"></i> <span data-translate="download_btn">Download</span>`;
        itemDiv.appendChild(downloadButton);
    }
    return itemDiv;
}

    (function initializeTranslations() {
        console.log("Initializing translations...");
        window.translations = {
             en: {
                // ... (Mevcut tüm çevirileriniz buraya gelecek) ...
                logo_text: "logo", logo_text_sidebar: "logo", select_process_title: "Select Process", colorize_btn: "Colorize", translate_btn: "Translate",
                colorize_translate_btn: "Colorize & Translate", subtitle_btn: "Subtitles", dubbing_btn: "Dubbing", manga_btn: "Text to Manga",
                upload_image_prompt: "Click or drag to upload image(s)", upload_image_formats_size: "PNG, JPG or WEBP (max. 10MB)",
                remove_image_btn: "Remove All Images", remove_single_image_btn: "Remove Image", remove_video_btn: "Remove Video", remove_file_btn: "Remove File",
                source_language_label: "Source Language", target_language_label: "Target Language",
                auto_detect_option: "Auto Detect", language_tr: "Turkish", language_en: "English", language_fr: "French", language_de: "German",
                language_es: "Spanish", language_it: "Italian", language_ja: "Japanese", language_pt: "Portuguese", language_ru: "Russian", language_zh: "Chinese",
                language_pl: "Polish",
                upload_video_prompt: "Click or drag to upload video", upload_video_formats_size: "MP4, MOV or AVI (max. 100MB)",
                video_tag_not_supported: "Your browser does not support the video tag.",
                auto_dubbing_label: "Auto Dubbing", manual_dubbing_label: "Manual Dubbing", upload_srt_prompt: "Upload SRT file",
                upload_srt_formats_size: "SRT (max. 5MB)", upload_video_for_manual_dub_prompt: "Click to upload video",
                manga_text_label: "Text for Manga", manga_text_placeholder: "Enter text to create manga...", submit_btn: "Submit",
                result_title: "Process Result", new_process_btn: "New Process", register_btn_sidebar: "Sign Up", login_btn_sidebar: "Login",
                purchase_btn_sidebar: "Purchase", register_modal_title: "Sign Up", fullname_label: "Full Name", fullname_placeholder: "Your Full Name",
                email_label: "Email", email_placeholder: "example@mail.com", password_label: "Password", password_placeholder: "********",
                confirm_password_label: "Confirm Password", register_submit_btn: "Sign Up", login_modal_title: "Login",
                login_submit_btn: "Login", forgot_password_link: "Forgot Password?", purchase_modal_title: "Purchase",
                buy_credits_btn: "Buy Credits", business_package_btn: "Business Package", api_access_btn: "API Access",
                credit_purchase_modal_title: "Buy Credits", credit_100_title: "100 Credits", credit_100_desc: "Basic Package",
                credit_500_title: "500 Credits", credit_500_desc: "Standard Package", credit_1000_title: "1000 Credits",
                credit_1000_desc: "Premium Package", buy_btn: "Buy", business_package_modal_title: "Business Package",
                business_monthly_title: "Monthly Plan", business_monthly_feat1: "5000 credits/month", business_monthly_feat2: "Priority processing queue",
                business_monthly_feat3: "24/7 technical support", business_yearly_title: "Yearly Plan", business_yearly_feat1: "8000 credits/month",
                business_yearly_feat2: "Priority processing queue", business_yearly_feat3: "24/7 technical support",
                business_yearly_feat4: "Custom training & consulting", api_access_modal_title: "API Access", api_starter_title: "Starter API",
                api_starter_feat1: "1000 API calls/month", api_starter_feat2: "Basic functions", api_starter_feat3: "Email support",
                api_pro_title: "Professional API", api_pro_feat1: "10000 API calls/month", api_pro_feat2: "All functions",
                api_pro_feat3: "24/7 technical support", api_pro_feat4: "Custom integration support",
                processing_text: "Processing, please wait...", preview_title: "Preview of Processed Results", download_btn: "Download",
                download_all_zip_title: "Download All as ZIP", download_results_btn: "Download Results (.zip)", download_zip_info: "Files are packaged in a ZIP archive.",
                error_processing_file: "Error processing file: ", error_network: "Network error or server unreachable.",
                error_select_process: "Please select a process.", preview_not_supported_for: "Preview not supported for", file_type: "file type",
                no_results_to_display: "No results to display or download.",
                // Yeni çeviriler
                history_load_error: "Error loading history.",
                no_history_message: "No past operations yet.",
                preview_not_available_short: "Preview N/A"
            },
            tr: {
                // ... (Mevcut tüm Türkçe çevirileriniz buraya gelecek) ...
                logo_text: "logo", logo_text_sidebar: "logo", select_process_title: "İşlem Seçin", colorize_btn: "Renklendirme", translate_btn: "Çevirme",
                colorize_translate_btn: "Renklendirme ve Çevirme", subtitle_btn: "Altyazı Ekleme", dubbing_btn: "Dublaj", manga_btn: "Metinden Manga",
                upload_image_prompt: "Resim(ler) yüklemek için tıklayın veya sürükleyin", upload_image_formats_size: "PNG, JPG veya WEBP (max. 10MB)",
                remove_image_btn: "Tüm Resimleri Kaldır", remove_single_image_btn: "Resmi Kaldır", remove_video_btn: "Videoyu Kaldır", remove_file_btn: "Dosyayı Kaldır",
                source_language_label: "Kaynak Dil", target_language_label: "Hedef Dil",
                auto_detect_option: "Otomatik Algıla", language_tr: "Türkçe", language_en: "İngilizce", language_fr: "Fransızca", language_de: "Almanca",
                language_es: "İspanyolca", language_it: "İtalyanca", language_ja: "Japonca", language_pt: "Portekizce", language_ru: "Rusça", language_zh: "Çince",
                language_pl: "Lehçe",
                upload_video_prompt: "Video yüklemek için tıklayın veya sürükleyin", upload_video_formats_size: "MP4, MOV veya AVI (max. 100MB)",
                video_tag_not_supported: "Tarayıcınız video etiketini desteklemiyor.",
                auto_dubbing_label: "Otomatik Dublaj", manual_dubbing_label: "Manuel Dublaj", upload_srt_prompt: "SRT dosyası yükleyin",
                upload_srt_formats_size: "SRT (max. 5MB)", upload_video_for_manual_dub_prompt: "Video yüklemek için tıklayın",
                manga_text_label: "Manga İçin Metin", manga_text_placeholder: "Manga oluşturmak için metin girin...", submit_btn: "Gönder",
                result_title: "İşlem Sonucu", new_process_btn: "Yeni İşlem", register_btn_sidebar: "Kaydol", login_btn_sidebar: "Giriş Yap",
                purchase_btn_sidebar: "Satın Al", register_modal_title: "Kaydol", fullname_label: "Ad Soyad", fullname_placeholder: "Adınız Soyadınız",
                email_label: "E-posta", email_placeholder: "ornek@mail.com", password_label: "Şifre", password_placeholder: "********",
                confirm_password_label: "Şifre Tekrar", register_submit_btn: "Kaydol", login_modal_title: "Giriş Yap",
                login_submit_btn: "Giriş Yap", forgot_password_link: "Şifremi Unuttum", purchase_modal_title: "Satın Al",
                buy_credits_btn: "Kredi Satın Al", business_package_btn: "Business Paket", api_access_btn: "API Erişimi",
                credit_purchase_modal_title: "Kredi Satın Al", credit_100_title: "100 Kredi", credit_100_desc: "Temel Paket",
                credit_500_title: "500 Kredi", credit_500_desc: "Standart Paket", credit_1000_title: "1000 Kredi",
                credit_1000_desc: "Premium Paket", buy_btn: "Satın Al", business_package_modal_title: "Business Paket",
                business_monthly_title: "Aylık Plan", business_monthly_feat1: "Aylık 5000 kredi", business_monthly_feat2: "Öncelikli işlem sırası",
                business_monthly_feat3: "7/24 teknik destek", business_yearly_title: "Yıllık Plan", business_yearly_feat1: "Aylık 8000 kredi",
                business_yearly_feat2: "Öncelikli işlem sırası", business_yearly_feat3: "7/24 teknik destek",
                business_yearly_feat4: "Özel eğitim ve danışmanlık", api_access_modal_title: "API Erişimi", api_starter_title: "Starter API",
                api_starter_feat1: "1000 API çağrısı/ay", api_starter_feat2: "Temel fonksiyonlar", api_starter_feat3: "E-posta desteği",
                api_pro_title: "Professional API", api_pro_feat1: "10000 API çağrısı/ay", api_pro_feat2: "Tüm fonksiyonlar",
                api_pro_feat3: "7/24 teknik destek", api_pro_feat4: "Özel entegrasyon desteği",
                processing_text: "İşleniyor, lütfen bekleyin...", preview_title: "İşlem Sonuçları Önizlemesi", download_btn: "İndir",
                download_all_zip_title: "Tümünü ZIP Olarak İndir", download_results_btn: "Sonuçları İndir (.zip)", download_zip_info: "Dosyalar bir ZIP arşivi içinde paketlenmiştir.",
                error_processing_file: "Dosya işlenirken bir hata oluştu: ", error_network: "Ağ hatası veya sunucuya ulaşılamıyor.",
                error_select_process: "Lütfen bir işlem seçin.", preview_not_supported_for: "için önizleme desteklenmiyor", file_type: "dosya türü",
                no_results_to_display: "Görüntülenecek veya indirilecek sonuç bulunamadı.",
                // Yeni çeviriler
                history_load_error: "Geçmiş yüklenirken hata oluştu.",
                no_history_message: "Henüz geçmiş işlem yok.",
                preview_not_available_short: "Önizleme Yok"
            }
        };

        // ... (initializeTranslations fonksiyonunun geri kalanı aynı)
        const languageSwitcher = document.getElementById('languageSwitcher');
        const siteSupportedLanguages = { 'en': 'English', 'tr': 'Türkçe', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch', 'it': 'Italiano', 'pt': 'Português', 'ru': 'Русский', 'zh': '中文 (简体)', 'ja': '日本語', 'pl': 'Polish' };
        const formSupportedLanguages = { 'en': 'language_en', 'tr': 'language_tr', 'de': 'language_de', 'es': 'language_es', 'it': 'language_it', 'pl': 'language_pl', 'fr': 'language_fr', 'pt': 'language_pt' };

        function populateMainLanguageSwitcher() { if (!languageSwitcher) return; languageSwitcher.innerHTML = ''; for (const langCode in siteSupportedLanguages) { const option = document.createElement('option'); option.value = langCode; option.textContent = siteSupportedLanguages[langCode]; languageSwitcher.appendChild(option); } }

        function populateFormLanguageSelects(currentSelectedLang = 'en') {
            document.querySelectorAll('select[name="source-lang"]').forEach(select => {
                const val = select.value;
                select.innerHTML = '';
                const auto = document.createElement('option');
                auto.value = 'auto';
                auto.dataset.translate = 'auto_detect_option';
                select.appendChild(auto);
                for (const code in formSupportedLanguages) {
                    const opt = document.createElement('option');
                    opt.value = code;
                    opt.dataset.translate = formSupportedLanguages[code];
                    select.appendChild(opt);
                }
                select.value = val && select.querySelector(`option[value="${val}"]`) ? val : 'auto';
            });
            document.querySelectorAll('select[name="target-lang"], select[name="dubbing-lang"]').forEach(select => {
                const val = select.value;
                select.innerHTML = '';
                for (const code in formSupportedLanguages) {
                    const opt = document.createElement('option');
                    opt.value = code;
                    opt.dataset.translate = formSupportedLanguages[code];
                    select.appendChild(opt);
                }
                if (val && select.querySelector(`option[value="${val}"]`)) {
                    select.value = val;
                } else if (select.querySelector(`option[value="${currentSelectedLang}"]`)) {
                    select.value = currentSelectedLang;
                } else if (select.options.length > 0) {
                    select.value = select.options[0].value;
                }
            });
        }
        window.applyTranslationsGlobally = function(lang) {
            const currentTranslations = window.translations[lang] || window.translations.en;
            if (!currentTranslations) return;
            document.documentElement.lang = lang;
            populateFormLanguageSelects(lang);
            document.querySelectorAll('[data-translate], [data-translate-placeholder]').forEach(el => {
                const key = el.dataset.translate, phKey = el.dataset.translatePlaceholder;
                if (phKey && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) el.placeholder = currentTranslations[phKey] || el.placeholder;
                if (key) {
                    let txt = currentTranslations[key];
                    if (txt !== undefined) {
                        const icon = el.querySelector('i[class^="ri-"]'), span = el.querySelector('span:not(.file-name-display)');
                        if (icon && span && !el.classList.contains('file-list-item')) span.textContent = txt;
                        else if (icon && el.childNodes.length > 1 && el.childNodes[1].nodeType === Node.TEXT_NODE && !el.classList.contains('file-list-item')) el.childNodes[1].textContent = ` ${txt}`;
                        else if (el.classList.contains('upload-prompt') && el.tagName === 'P') el.textContent = txt;
                        else if (!icon && !el.classList.contains('file-name-display') && !el.classList.contains('file-list-item') && el.tagName !== 'IMG') el.textContent = txt;
                        else if (el.classList.contains('clear-all-files-btn')) el.textContent = txt;
                    }
                }
            });
            document.querySelectorAll('select.custom-select option[data-translate]').forEach(opt => { const key = opt.dataset.translate, txt = currentTranslations[key]; if (txt !== undefined) opt.textContent = txt; else opt.textContent = opt.value.toUpperCase(); });
            document.querySelectorAll('.file-upload-area').forEach(area => {
                const fileInput = area.querySelector('input[type="file"]'), clearAllBtn = area.querySelector('.clear-all-files-btn');
                if (fileInput && clearAllBtn) {
                    let transKey = fileInput.multiple ? 'remove_image_btn' : (fileInput.accept.includes("video/*") ? 'remove_video_btn' : (fileInput.accept.includes(".srt") ? 'remove_file_btn' : 'remove_single_image_btn'));
                    clearAllBtn.textContent = currentTranslations[transKey] || "Remove";
                     if (!fileInput.multiple && fileInput.files && fileInput.files.length > 0) {
                         if (fileInput.accept.includes("image/*")) clearAllBtn.textContent = currentTranslations['remove_single_image_btn'] || "Remove Image";
                         else if (fileInput.accept.includes("video/*")) clearAllBtn.textContent = currentTranslations['remove_video_btn'] || "Remove Video";
                         else clearAllBtn.textContent = currentTranslations['remove_file_btn'] || "Remove File";
                     }
                }
            });
        };
        if (languageSwitcher) { languageSwitcher.addEventListener('change', e => { localStorage.setItem('preferredLanguage', e.target.value); window.applyTranslationsGlobally(e.target.value); }); populateMainLanguageSwitcher(); }
        const savedLang = localStorage.getItem('preferredLanguage') || 'en';
        if (languageSwitcher) languageSwitcher.value = savedLang;
        window.applyTranslationsGlobally(savedLang);
        console.log("Translations initialized. Default/Saved lang:", savedLang);
    })();

    // ... (initializeMenuAndModals fonksiyonu aynı kalacak)
    (function initializeMenuAndModals() {
        const menuButton = document.getElementById('menuButton');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        window.regularModalWrappers = { register: document.getElementById('registerModalWrapper'), login: document.getElementById('loginModalWrapper'), purchase: document.getElementById('purchaseModalWrapper'), creditPurchase: document.getElementById('creditPurchaseModalWrapper'), businessPackage: document.getElementById('businessPackageModalWrapper'), apiAccess: document.getElementById('apiAccessModalWrapper') };
        const closeModalButtons = document.querySelectorAll('.closeModal');
        const zoomModalWrapper = document.getElementById('imageZoomModalWrapper');
        const zoomedImage = document.getElementById('zoomedImage');
        const closeZoomBtn = zoomModalWrapper?.querySelector('.closeZoomModal');
        let currentZoomScale = 1;

        window.hideAllModalsAndOptionalSidebar = (alsoHideSidebar = false) => { // global yapıldı
            Object.values(window.regularModalWrappers).forEach(mw => { if(mw) mw.style.display = 'none'; });
            if (zoomModalWrapper) zoomModalWrapper.style.display = 'none';
            if (alsoHideSidebar && sidebarMenu) sidebarMenu.classList.add('-translate-x-full');

            const isAnyVisible = Object.values(window.regularModalWrappers).some(mw => mw?.style.display === 'flex') ||
                                 zoomModalWrapper?.style.display === 'flex' ||
                                 (sidebarMenu && !sidebarMenu.classList.contains('-translate-x-full'));
            if (modalBackdrop && !isAnyVisible) modalBackdrop.style.display = 'none';
        };
        window.hideAllRegularModals = () => hideAllModalsAndOptionalSidebar(false);

        const showModal = (modalWrapper) => {
            hideAllModalsAndOptionalSidebar(false);
            if (modalWrapper) {
                modalWrapper.style.display = 'flex';
                modalWrapper.querySelector('.modal-content')?.classList.add('animate-fadeIn');
                if (modalBackdrop) modalBackdrop.style.display = 'block';
            }
        };
        window.globalOpenZoomModal = (imageUrl) => { if (zoomModalWrapper && zoomedImage) { hideAllModalsAndOptionalSidebar(false); zoomedImage.src = imageUrl; currentZoomScale = 1; zoomedImage.style.transform = `scale(${currentZoomScale})`; zoomedImage.style.cursor = 'zoom-in'; zoomModalWrapper.style.display = 'flex'; zoomModalWrapper.querySelector('.modal-content')?.classList.add('animate-fadeIn'); if (modalBackdrop) modalBackdrop.style.display = 'block'; } };

        if (menuButton && sidebarMenu) menuButton.addEventListener('click', () => { sidebarMenu.classList.remove('-translate-x-full'); if (modalBackdrop) modalBackdrop.style.display = 'block'; });
        if (closeSidebarBtn && sidebarMenu) closeSidebarBtn.addEventListener('click', () => { sidebarMenu.classList.add('-translate-x-full'); if(modalBackdrop && !Object.values(window.regularModalWrappers).some(m=>m?.style.display === 'flex') && zoomModalWrapper?.style.display !== 'flex') modalBackdrop.style.display = 'none';});
        closeModalButtons.forEach(btn => btn.addEventListener('click', () => hideAllModalsAndOptionalSidebar(false)));
        closeZoomBtn?.addEventListener('click', () => hideAllModalsAndOptionalSidebar(false));

        modalBackdrop?.addEventListener('click', () => {
            if (zoomModalWrapper?.style.display === 'flex') closeZoomBtn?.click();
            else if (Object.values(window.regularModalWrappers).some(m => m?.style.display === 'flex')) hideAllRegularModals();
            else if (sidebarMenu && !sidebarMenu.classList.contains('-translate-x-full')) closeSidebarBtn?.click();
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') modalBackdrop?.click(); });

        document.getElementById('registerBtnSidebar')?.addEventListener('click', () => showModal(window.regularModalWrappers.register));
        document.getElementById('loginBtnSidebar')?.addEventListener('click', () => showModal(window.regularModalWrappers.login));
        document.getElementById('purchaseBtnSidebar')?.addEventListener('click', () => showModal(window.regularModalWrappers.purchase));
        document.getElementById('creditBtn')?.addEventListener('click', () => showModal(window.regularModalWrappers.creditPurchase));
        document.getElementById('businessBtn')?.addEventListener('click', () => showModal(window.regularModalWrappers.businessPackage));
        document.getElementById('apiBtn')?.addEventListener('click', () => showModal(window.regularModalWrappers.apiAccess));
        if (zoomedImage) { zoomedImage.style.transition = 'transform 0.15s ease-out'; zoomedImage.addEventListener('wheel', e => { if (zoomModalWrapper?.style.display !== 'flex') return; e.preventDefault(); currentZoomScale = Math.max(0.3, Math.min(currentZoomScale + (e.deltaY > 0 ? -0.15 : 0.15), 5)); zoomedImage.style.transform = `scale(${currentZoomScale})`; zoomedImage.style.cursor = currentZoomScale > 1.05 ? 'zoom-out' : 'zoom-in'; }); zoomedImage.addEventListener('click', e => { if (zoomModalWrapper?.style.display !== 'flex' || e.target !== zoomedImage) return; currentZoomScale = (currentZoomScale < 1.5 && currentZoomScale < 5) ? Math.min(currentZoomScale + 0.5, 5) : 1; zoomedImage.style.transform = `scale(${currentZoomScale})`; zoomedImage.style.cursor = currentZoomScale > 1.05 ? 'zoom-out' : 'zoom-in'; }); }
    })();


    // ... (Process button ve form konfigürasyonları aynı kalacak)
    const processButtons = [ document.getElementById('colorizeBtn'), document.getElementById('translateBtn'), document.getElementById('colorizeTranslateBtn'), document.getElementById('subtitleBtn'), document.getElementById('dubbingBtn'), document.getElementById('mangaBtn') ].filter(Boolean);
    const formsConfig = { 'colorizeBtn': { element: document.getElementById('colorizeForm'), operation: 'colorize' }, 'translateBtn': { element: document.getElementById('translateForm'), operation: 'translate' }, 'colorizeTranslateBtn': { element: document.getElementById('colorizeTranslateForm'), operation: 'both' }, 'subtitleBtn': { element: document.getElementById('subtitleForm'), operation: 'subtitle' }, 'dubbingBtn': { element: document.getElementById('dubbingForm'), operation: 'dubbing' }, 'mangaBtn': { element: document.getElementById('mangaForm'), operation: 'manga' } };
    function hideAllProcessForms() { Object.values(formsConfig).forEach(formObj => formObj.element?.classList.add('hidden')); if (dynamicFormArea) dynamicFormArea.classList.add('hidden'); }
    function resetButtonStyles() { processButtons.forEach(button => { button.classList.remove('bg-primary', 'text-white'); button.classList.add('bg-customBlack', 'hover:bg-customBlackHover', 'text-white'); }); }
    processButtons.forEach(button => { button.addEventListener('click', function() { resetButtonStyles(); hideAllProcessForms(); this.classList.remove('bg-customBlack', 'hover:bg-customBlackHover'); this.classList.add('bg-primary', 'text-white'); const formObj = formsConfig[this.id]; if (formObj?.element) { formObj.element.classList.remove('hidden'); if (dynamicFormArea) dynamicFormArea.classList.remove('hidden'); currentOperation = formObj.operation; currentFormElement = formObj.element; if(resultsArea) resultsArea.classList.add('hidden'); if(resultContent) resultContent.innerHTML = ''; if(loadingIndicator) loadingIndicator.classList.add('hidden'); } }); });
    const dubbingTypeRadios = document.querySelectorAll('input[name="dubbing-type"]'); const autoDubbingOptions = document.getElementById('autoDubbingOptions'); const manualDubbingOptions = document.getElementById('manualDubbingOptions'); if (dubbingTypeRadios.length && autoDubbingOptions && manualDubbingOptions) { dubbingTypeRadios.forEach(radio => { radio.addEventListener('change', function() { autoDubbingOptions.classList.toggle('hidden', this.value !== 'auto'); manualDubbingOptions.classList.toggle('hidden', this.value !== 'manual'); }); }); const checkedDubRadio = document.querySelector('input[name="dubbing-type"]:checked'); if (checkedDubRadio) { autoDubbingOptions.classList.toggle('hidden', checkedDubRadio.value !== 'auto'); manualDubbingOptions.classList.toggle('hidden', checkedDubRadio.value !== 'manual'); } }

    // ... (updateFileUploadUI ve ilgili event listener'lar aynı kalacak)
    function updateFileUploadUI(fileInputElement) {
        const parentArea = fileInputElement.closest('.file-upload-area');
        if (!parentArea) return;
        const uploadPrompt = parentArea.querySelector('.upload-prompt');
        const fileSelectedContainer = parentArea.querySelector('.file-selected-container');
        const fileListDiv = parentArea.querySelector('.file-list');
        const clearAllBtn = parentArea.querySelector('.clear-all-files-btn');
        if (!uploadPrompt || !fileSelectedContainer || !fileListDiv || !clearAllBtn) return;

        fileListDiv.innerHTML = '';
        const currentLang = localStorage.getItem('preferredLanguage') || 'en';
        const currentTranslations = window.translations[currentLang] || window.translations.en;

        if (fileInputElement.files && fileInputElement.files.length > 0) {
            uploadPrompt.style.display = 'none';
            fileSelectedContainer.style.display = 'block';
            clearAllBtn.style.display = 'inline-block';

            Array.from(fileInputElement.files).forEach((file, index) => {
                const fileItem = document.createElement('div'); fileItem.className = 'file-list-item';
                const fileDetails = document.createElement('div'); fileDetails.className = 'file-details';
                const icon = document.createElement('i');
                if (file.type.startsWith('image/')) icon.className = 'ri-image-line text-gray-300';
                else if (file.type.startsWith('video/')) icon.className = 'ri-film-line text-gray-300';
                else if (file.name.endsWith('.srt')) icon.className = 'ri-file-list-3-line text-gray-300';
                else icon.className = 'ri-file-line text-gray-300';
                fileDetails.appendChild(icon);
                const fileNameSpan = document.createElement('span'); fileNameSpan.className = 'file-name-display'; fileNameSpan.textContent = file.name; fileDetails.appendChild(fileNameSpan);
                fileItem.appendChild(fileDetails);

                if (fileInputElement.multiple) {
                    const removeSingleBtn = document.createElement('button'); removeSingleBtn.type = 'button'; removeSingleBtn.className = 'remove-single-file-btn'; removeSingleBtn.innerHTML = '<i class="ri-delete-bin-line"></i>'; removeSingleBtn.dataset.fileIndex = index;
                    removeSingleBtn.addEventListener('click', (e) => { e.stopPropagation(); const idx = parseInt(e.currentTarget.dataset.fileIndex, 10); const dt = new DataTransfer(); Array.from(fileInputElement.files).forEach((f, i) => { if (i !== idx) dt.items.add(f); }); fileInputElement.files = dt.files; updateFileUploadUI(fileInputElement); });
                    fileItem.appendChild(removeSingleBtn);
                }
                fileListDiv.appendChild(fileItem);
            });

            let clearAllKey = 'remove_image_btn';
            if (!fileInputElement.multiple) {
                if (fileInputElement.accept.includes("video/*")) clearAllKey = 'remove_video_btn';
                else if (fileInputElement.accept.includes(".srt")) clearAllKey = 'remove_file_btn';
                else if (fileInputElement.accept.includes("image/*")) clearAllKey = 'remove_single_image_btn';
            }
            clearAllBtn.textContent = currentTranslations[clearAllKey] || "Remove";

        } else {
            uploadPrompt.style.display = 'flex';
            fileSelectedContainer.style.display = 'none';
            clearAllBtn.style.display = 'none';
        }
    }
    document.querySelectorAll('.file-upload-area').forEach(area => {
        const fileInput = area.querySelector('input[type="file"]');
        const clearAllBtn = area.querySelector('.clear-all-files-btn');
        if (!fileInput) return;
        fileInput.addEventListener('change', function() { updateFileUploadUI(this); });
        area.addEventListener('click', (event) => { if (!event.target.closest('.remove-single-file-btn') && !event.target.closest('.clear-all-files-btn')) fileInput.click(); });
        if (clearAllBtn) { clearAllBtn.addEventListener('click', (event) => { event.stopPropagation(); fileInput.value = ''; const changeEvent = new Event('change', { bubbles: true }); fileInput.dispatchEvent(changeEvent); }); }
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('border-primary'); });
        area.addEventListener('dragleave', () => { area.classList.remove('border-primary'); });
        area.addEventListener('drop', (e) => { e.preventDefault(); area.classList.remove('border-primary'); if (e.dataTransfer.files.length > 0) { fileInput.files = e.dataTransfer.files; const changeEvent = new Event('change', { bubbles: true }); fileInput.dispatchEvent(changeEvent); } });
    });


    // scripts.js

// ... (önceki kodlar aynı kalacak) ...

    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
            if (!currentOperation || !currentFormElement) {
                alert(window.translations[preferredLang]?.error_select_process || 'Please select a process.');
                return;
            }

            if (processSelectionDiv) processSelectionDiv.classList.add('hidden');
            if (dynamicFormArea) dynamicFormArea.classList.add('hidden');
            if (resultsArea) resultsArea.classList.remove('hidden');
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (resultContent) resultContent.innerHTML = '';

            const formData = new FormData();
            formData.append('operation', currentOperation);
            // ... (formData doldurma kısmı aynı) ...
            const dubbingTypeRadio = currentFormElement.querySelector('input[name="dubbing-type"]:checked');

            currentFormElement.querySelectorAll('input[type="text"], input[type="radio"]:checked, textarea, select, input[type="file"]').forEach(inputEl => {
                if (inputEl.type === 'file') {
                    let isActiveFileField = false;
                    if (currentOperation === 'dubbing' && dubbingTypeRadio) {
                        const parentDiv = inputEl.closest('#autoDubbingOptions, #manualDubbingOptions');
                        if (parentDiv) {
                            if (dubbingTypeRadio.value === 'auto' && parentDiv.id === 'autoDubbingOptions' && inputEl.name === 'video-file') {
                                isActiveFileField = true;
                            } else if (dubbingTypeRadio.value === 'manual' && parentDiv.id === 'manualDubbingOptions') {
                                if (inputEl.name === 'video-file' || inputEl.name === 'srt-file') {
                                    isActiveFileField = true;
                                }
                            }
                        }
                    } else if (currentOperation !== 'dubbing') {
                        isActiveFileField = true;
                    }
                    if (isActiveFileField && inputEl.files.length > 0 && inputEl.name) {
                        for (let i = 0; i < inputEl.files.length; i++) {
                            formData.append(inputEl.name, inputEl.files[i]);
                        }
                    }
                } else if (inputEl.tagName === 'SELECT' && inputEl.name === 'dubbing-lang') {
                    if (currentOperation === 'dubbing' && dubbingTypeRadio) {
                        const parentDiv = inputEl.closest('#autoDubbingOptions, #manualDubbingOptions');
                        if (parentDiv) {
                            if ((dubbingTypeRadio.value === 'auto' && parentDiv.id === 'autoDubbingOptions') ||
                                (dubbingTypeRadio.value === 'manual' && parentDiv.id === 'manualDubbingOptions')) {
                                formData.append('dubbing-lang', inputEl.value);
                            }
                        }
                    }
                } else if (inputEl.name && inputEl.value !== undefined) {
                    if ( (inputEl.tagName === 'SELECT' && inputEl.name !== 'dubbing-lang') ||
                         inputEl.type === 'radio' ||
                         (inputEl.value.trim() !== '' && inputEl.type !== 'select-one' && inputEl.type !== 'radio' )
                       ) {
                        if (!((inputEl.name === 'source-lang' || inputEl.name === 'target-lang') && currentOperation === 'dubbing')) {
                            formData.append(inputEl.name, inputEl.value);
                        }
                    }
                }
            });


            try {
                const response = await fetch('/process', { method: 'POST', body: formData });
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                const data = await response.json();

                if (response.ok && data.status === 'ready') {
                    resultContent.innerHTML = '';
                    const processedFileNames = new Set();
                    let previewFilesToShow = [];
                    let directDownloadFilesToShow = [];

                    // Önce hangi dosyaların hangi listede gösterileceğini belirle
                    if (data.preview_files && data.preview_files.length > 0) {
                        data.preview_files.forEach(file => {
                            if (!processedFileNames.has(file.name)) {
                                previewFilesToShow.push(file);
                                processedFileNames.add(file.name);
                            }
                        });
                    }

                    if (data.direct_download_files && data.direct_download_files.length > 0) {
                        data.direct_download_files.forEach(file => {
                            if (!processedFileNames.has(file.name)) {
                                directDownloadFilesToShow.push(file);
                                processedFileNames.add(file.name); // Bu aslında gereksiz çünkü set zaten benzersiz tutar
                                                                   // ama zararı yok, mantığı netleştirir.
                            }
                        });
                    }

                    // --- ÖNİZLEME DOSYALARI ---
                    if (previewFilesToShow.length > 0) {
                        const previewTitleEl = document.createElement('h3');
                        previewTitleEl.className = 'text-lg font-medium mb-4 text-center';
                        previewTitleEl.setAttribute('data-translate', 'preview_title');
                        resultContent.appendChild(previewTitleEl);

                        const resultsDisplayContainer = document.createElement('div');
                        const numResults = previewFilesToShow.length; // Gösterilecek gerçek sayı
                        if (numResults === 1) resultsDisplayContainer.className = 'flex justify-center items-start';
                        else if (numResults === 2) resultsDisplayContainer.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6';
                        else resultsDisplayContainer.className = 'flex overflow-x-auto space-x-4 pb-4 horizontal-scroll-custom';

                        for (const file of previewFilesToShow) {
                            const itemDiv = await createFileDisplayElement(
                                file.name,
                                (file.mimetype === 'text/plain' || (file.name && file.name.endsWith('.srt'))) && file.data_url ? atob(file.data_url.split(',')[1]) : null,
                                file.data_url,
                                true,
                                file.mimetype,
                                true // isInputOrOutputItem
                            );
                            resultsDisplayContainer.appendChild(itemDiv);
                        }
                        resultContent.appendChild(resultsDisplayContainer);
                    }

                    // --- DOĞRUDAN İNDİRİLEBİLİR DOSYALAR ---
                    if (directDownloadFilesToShow.length > 0) {
                        const directDownloadsTitle = document.createElement('h3');
                        // Eğer preview dosyaları da varsa, araya bir ayırıcı ve boşluk koy
                        const marginTopClassForDirect = previewFilesToShow.length > 0 ? 'mt-8 pt-6 border-t border-customBorder' : 'mt-6';
                        directDownloadsTitle.className = `text-lg font-medium mb-4 text-center ${marginTopClassForDirect}`;
                        directDownloadsTitle.textContent = "Downloadable Output Files"; // Çeviri anahtarı kullan
                        resultContent.appendChild(directDownloadsTitle);

                        const directDownloadsContainer = document.createElement('div');
                        const numDirect = directDownloadFilesToShow.length; // Gösterilecek gerçek sayı
                        if (numDirect === 1) directDownloadsContainer.className = 'flex justify-center items-start';
                        else if (numDirect === 2) directDownloadsContainer.className = 'grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6';
                        else directDownloadsContainer.className = 'flex overflow-x-auto space-x-4 pb-4 horizontal-scroll-custom';
                        
                        for (const file of directDownloadFilesToShow) {
                            const itemDiv = await createFileDisplayElement(
                                file.name,
                                null,
                                file.download_url,
                                true,
                                file.mimetype,
                                true // isInputOrOutputItem
                            );
                            directDownloadsContainer.appendChild(itemDiv);
                        }
                        resultContent.appendChild(directDownloadsContainer);
                    }

                    // --- ZIP İNDİRME BUTONU ---
                    if (data.zip_download_url) {
                        const zipDiv = document.createElement('div');
                        const marginTopClassForZip = (previewFilesToShow.length > 0 || directDownloadFilesToShow.length > 0)
                                               ? 'mt-8 pt-6 border-t border-customBorder' : 'mt-6';
                        zipDiv.className = `flex flex-col items-center ${marginTopClassForZip}`;
                        
                        const zipTitle = document.createElement('h4');
                        zipTitle.className = 'text-lg font-semibold mb-3';
                        zipTitle.setAttribute('data-translate', 'download_all_zip_title');
                        zipDiv.appendChild(zipTitle);

                        const zipLink = document.createElement('a');
                        zipLink.href = data.zip_download_url;
                        zipLink.className = 'bg-lightGreen hover:bg-lightGreenHover text-white py-3 px-8 rounded !rounded-button font-medium flex items-center gap-2 text-base';
                        zipLink.download = `results_${currentOperation || 'files'}.zip`;
                        zipLink.innerHTML = `<i class="ri-folder-zip-line ri-lg"></i> <span data-translate="download_results_btn"></span>`;
                        zipDiv.appendChild(zipLink);
                        resultContent.appendChild(zipDiv);
                    }

                    if (previewFilesToShow.length === 0 && directDownloadFilesToShow.length === 0 && !data.zip_download_url) {
                        resultContent.innerHTML = `<p class="text-yellow-400 text-center py-4" data-translate="no_results_to_display"></p>`;
                    }

                } else {
                    const errorMessage = data.message || (window.translations[preferredLang]?.error_processing_file || 'Error processing file: ') + ( (typeof data.detail === 'string' ? data.detail : '') || 'Unknown error');
                    resultContent.innerHTML = `<p class="text-red-400 text-center py-4">${errorMessage}</p>`;
                }
            } catch (error) {
                // ... (catch bloğu aynı)
                if (loadingIndicator) loadingIndicator.classList.add('hidden');
                console.error('Fetch Error:', error);
                const preferredLangError = localStorage.getItem('preferredLanguage') || 'en';
                resultContent.innerHTML = `<p class="text-red-400 text-center py-4">${window.translations[preferredLangError]?.error_network || 'Network error or server unreachable.'}</p>`;
            } finally {
                // ... (finally bloğu aynı)
                loadAndRenderHistory();
                 if (typeof window.applyTranslationsGlobally === "function") {
                    window.applyTranslationsGlobally(localStorage.getItem('preferredLanguage') || 'en');
                }
            }
        });
    }

    if (submitAgainBtn) {
        submitAgainBtn.addEventListener('click', function() {
            if (resultsArea) resultsArea.classList.add('hidden');
            if (processSelectionDiv) processSelectionDiv.classList.remove('hidden');
            if (dynamicFormArea) dynamicFormArea.classList.add('hidden');
            resetButtonStyles(); hideAllProcessForms();
            currentOperation = ''; currentFormElement = null;
            document.querySelectorAll('.file-upload-area input[type="file"]').forEach(input => {
                input.value = '';
                const changeEvent = new Event('change', { bubbles: true });
                input.dispatchEvent(changeEvent);
            });
            const mangaTextArea = document.querySelector('textarea[name="manga_text"]');
            if (mangaTextArea) {
                mangaTextArea.value = '';
            }
             const savedLang = localStorage.getItem('preferredLanguage') || 'en';
             if (typeof window.applyTranslationsGlobally === "function") {
                 window.applyTranslationsGlobally(savedLang);
             }
             // Burada loadAndRenderHistory() çağrısına gerek yok, geçmiş değişmedi.
        });
    }

    loadAndRenderHistory(); // Sayfa ilk yüklendiğinde geçmişi yükle

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/js/sw.js') // Manifest'teki start_url'e göre ayarla
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }

    console.log("All initializations complete.");
});