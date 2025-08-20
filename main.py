import logging
import translate
import colorize
import colorize_and_translate
import subtitles
import manuel_dubbing

logger = logging.getLogger(__name__) # app.py'de yapılandırılan logger'ı kullanır

def main(in_memory_files, operation, source_lang=None, target_lang=None, 
         dubbing_type=None, dubbing_lang=None, manga_text=None, dub_speed_factor=1.0):
    
    logger.info(f"Main router called for operation: '{operation}'")
    logger.debug(f"Params: SrcL={source_lang}, TrgL={target_lang}, DubT={dubbing_type}, DubL={dubbing_lang}, SpeedF={dub_speed_factor}, MangaLen={len(manga_text) if manga_text else 0}")

    results = {}

    try:
        if operation == "colorize":
            if not in_memory_files:
                logger.warning("Colorize op: no files.")
                return {"error.txt": b"Colorization requires image files."}
            results = colorize.main(in_memory_files) # colorize.py içindeki main'i çağır

        elif operation == "translate":
            if not in_memory_files:
                logger.warning("Translate op: no files.")
                return {"error.txt": b"Translation requires image files."}
            results = translate.main(in_memory_files, source_lang, target_lang)

        elif operation == "both": # colorize_and_translate
            if not in_memory_files:
                logger.warning("Colorize & Translate op: no files.")
                return {"error.txt": b"Colorize & Translate requires image files."}
            results = colorize_and_translate.main(in_memory_files, source_lang, target_lang)
            
        elif operation == "subtitle":
            if not in_memory_files:
                logger.warning("Subtitle op: no video file.")
                return {"error.txt": b"Subtitling requires a video file."}
            results = subtitles.main(in_memory_files, source_lang, target_lang)
            
        elif operation == "dubbing":
            if not in_memory_files: # En azından bir video veya srt dosyası olmalı
                logger.warning("Dubbing op: no files.")
                return {"error.txt": b"Dubbing requires video and/or SRT files."}
            if dubbing_type == "manual":
                results = manuel_dubbing.main(in_memory_files, dubbing_lang)

        else:
            logger.error(f"Unknown operation received in main.py: {operation}")
            return {"error.txt": f"Unknown operation: {operation}".encode()}

    except Exception as e:
        logger.error(f"Error during operation '{operation}' in main.py: {e}", exc_info=True)
        return {"error.txt": f"Operation '{operation}' failed: {str(e)}".encode()}

    if not results:
        logger.warning(f"Operation '{operation}' completed but produced no results in main.py.")
    return results
