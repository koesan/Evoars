from tqdm import tqdm
import numpy as np
import cv2
from colorizator import MangaColorizator

def main(in_memory_files):
    results = {}

    for resim_adı, resim_verisi in tqdm(in_memory_files.items(), desc="İşleniyor", unit="resim"):
        # Resmi bellekte işle
        file_bytes = np.frombuffer(resim_verisi, np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_UNCHANGED)

        # Orijinal dosya uzantısını belirle
        file_extension = resim_adı.split('.')[-1].lower()

        colorizator = MangaColorizator("cpu", 'networks/generator.zip', 'networks/extractor.pth')

        if img.shape[1] % 32 != 0:
            width = 32 * (img.shape[1] // 32)
        else:
            width = img.shape[1]
        colorizator.set_image(img, width, True, 25)
        img = colorizator.colorize()
        img *= 255
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        _, encoded_img = cv2.imencode(f'.{file_extension}', img)
        results[resim_adı] = encoded_img.tobytes()

    return results
