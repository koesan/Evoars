import os
import zipfile
import logging
import base64
import mimetypes
import re # Regular expression modülünü import edin
from flask import Flask, render_template, request, send_file, jsonify, url_for, g
from werkzeug.utils import secure_filename
import shutil
import sqlite3
import uuid
import json
from datetime import datetime

try:
    from main import main
except ImportError:
    logging.error("main.py could not be imported. Ensure it's in the correct path and has a 'main' function.")
    def main(in_memory_files, operation, source_lang, target_lang, dubbing_type, dubbing_lang, manga_text=None):
        logging.warning("Using DUMMY main function. Please fix the import for main.py.")
        results = {}
        for name, data_bytes in in_memory_files.items():
            results[f"processed_{name}"] = b"dummy content for " + name.encode()
        if manga_text:
            results["manga_output.png"] = b"dummy_manga_image_bytes"
        if not results and not manga_text:
             return {"error.txt": b"No input provided to dummy main."}
        return results

app = Flask(__name__)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
HISTORY_FILES_BASE = os.path.join(BASE_DIR, 'history_files')
DATABASE = os.path.join(BASE_DIR, 'history.db')
MAX_HISTORY_ITEMS_DB = 10

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(HISTORY_FILES_BASE):
    os.makedirs(HISTORY_FILES_BASE)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s')

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operations (
                id TEXT PRIMARY KEY,
                operation_name TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL,
                input_details TEXT,
                output_zip_filename TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS operation_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                operation_id TEXT NOT NULL,
                file_type TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                stored_filename TEXT NOT NULL,
                mimetype TEXT,
                FOREIGN KEY (operation_id) REFERENCES operations (id) ON DELETE CASCADE
            )
        ''')
        db.commit()
        logging.info("Database initialized.")

init_db()

def is_safe_path_component(component_string):
    if not isinstance(component_string, str): # Ekstra güvenlik: Sadece stringleri işle
        return False
    if ".." in component_string: # Path traversal engelleme
        return False

    return bool(component_string and re.match(r'^[a-zA-Z0-9_.-]+$', component_string))

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_files():
    logging.info("Process endpoint called")
    operation_id = str(uuid.uuid4())
    operation_timestamp = datetime.utcnow()

    operation = request.form.get('operation')
    source_lang = request.form.get('source-lang')
    target_lang = request.form.get('target-lang')
    dubbing_type = request.form.get('dubbing-type')
    dubbing_lang = request.form.get('dubbing-lang')
    manga_text = request.form.get('manga_text')

    logging.debug(f"Form Data: Op: {operation}, SrcLang: {source_lang}, TrgLang: {target_lang}, DubType: {dubbing_type}, DubLang: {dubbing_lang}, MangaTxtLen: {len(manga_text) if manga_text else 0}")

    current_op_history_path = os.path.join(HISTORY_FILES_BASE, operation_id)
    current_op_inputs_path = os.path.join(current_op_history_path, "inputs")
    current_op_outputs_path = os.path.join(current_op_history_path, "outputs")
    os.makedirs(current_op_inputs_path, exist_ok=True)
    os.makedirs(current_op_outputs_path, exist_ok=True)

    db = get_db()
    cursor = db.cursor()

    in_memory_files = {}
    input_details_for_db = {}
    if manga_text:
        input_details_for_db["manga_text"] = manga_text

    file_input_names = ['images', 'video_file_subtitle', 'video-file', 'srt-file']
    for name_attr in file_input_names:
        if name_attr in request.files:
            uploaded_list = request.files.getlist(name_attr)
            for file_storage in uploaded_list:
                if file_storage and file_storage.filename:
                    original_filename = secure_filename(file_storage.filename)
                    if not original_filename: # secure_filename boş string dönebilir
                        logging.warning(f"Skipping file with potentially unsafe original name from attribute {name_attr}")
                        continue
                    file_bytes = file_storage.read()
                    in_memory_files[original_filename] = file_bytes
                    file_storage.seek(0)

                    stored_input_filename_history = f"input_{uuid.uuid4()}_{original_filename}"
                    stored_input_path_history = os.path.join(current_op_inputs_path, stored_input_filename_history)
                    with open(stored_input_path_history, 'wb') as f_hist_in:
                        f_hist_in.write(file_bytes)

                    mimetype_in, _ = mimetypes.guess_type(original_filename)
                    cursor.execute('''
                        INSERT INTO operation_files (operation_id, file_type, original_filename, stored_filename, mimetype)
                        VALUES (?, 'input', ?, ?, ?)
                    ''', (operation_id, original_filename, stored_input_filename_history, mimetype_in or 'application/octet-stream'))
                    logging.debug(f"Saved input '{original_filename}' to history as '{stored_input_filename_history}'")
    
    try:
        logging.info(f"Calling main processing function for operation: {operation}")
        results_dict = main(
            in_memory_files=in_memory_files, operation=operation, source_lang=source_lang,
            target_lang=target_lang, dubbing_type=dubbing_type, dubbing_lang=dubbing_lang,
            manga_text=manga_text
        )
        logging.info(f"Main function returned {len(results_dict if results_dict else [])} items in results_dict.")
        process_status = "success"
    except Exception as e:
        logging.error(f"Error during 'main' processing: {str(e)}", exc_info=True)
        process_status = "failed"
        results_dict = {"error_message.txt": f"Processing error: {str(e)}".encode()}

    if not results_dict or not isinstance(results_dict, dict):
        logging.warning(f"Processing returned no results or unexpected format for operation '{operation}'.")
        if process_status != "failed": # Eğer zaten hata yüzünden failed değilse
            process_status = "failed"
            results_dict = {"error_message.txt": b"Processing returned empty or invalid result."}

    operation_name_map_py = {
        'colorize': 'Colorize', 'translate': 'Translate', 'both': 'Colorize & Translate',
        'subtitle': 'Subtitles', 'dubbing': 'Dubbing', 'manga': 'Text to Manga'
    }
    display_operation_name = operation_name_map_py.get(operation, str(operation).capitalize() if operation else "Unknown")
    
    preview_files_data = []
    direct_download_files = []
    valid_results_for_zip = {}
    zip_output_filename_for_db = None

    for filename_out, content_or_path in (results_dict.items() if results_dict else []):
        output_file_bytes = None
        original_output_filename = secure_filename(filename_out)
        if not original_output_filename:
            logging.warning(f"Skipping output file with potentially unsafe original name: {filename_out}")
            continue

        if isinstance(content_or_path, bytes):
            output_file_bytes = content_or_path
        elif isinstance(content_or_path, str) and os.path.exists(content_or_path):
            try:
                with open(content_or_path, 'rb') as f_path_read:
                    output_file_bytes = f_path_read.read()
                
                # UPLOAD_FOLDER'a kopyalama (direct download için)
                destination_path_in_uploads = os.path.join(UPLOAD_FOLDER, original_output_filename)
                shutil.copy(content_or_path, destination_path_in_uploads)
                download_url = url_for('download_processed_file', filename=original_output_filename, _external=True)
                mimetype_for_direct, _ = mimetypes.guess_type(original_output_filename)
                direct_download_files.append({
                    "name": original_output_filename, "download_url": download_url,
                    "mimetype": mimetype_for_direct or 'application/octet-stream'
                })
            except Exception as e_read_path:
                logging.error(f"Error reading/copying output file from path {content_or_path} for {original_output_filename}: {e_read_path}")
                continue
        else:
            logging.warning(f"Unsupported output type for {original_output_filename}: {type(content_or_path)}, value: {str(content_or_path)[:100]}")
            continue

        if output_file_bytes:
            valid_results_for_zip[original_output_filename] = output_file_bytes
            stored_output_filename_history = f"output_{uuid.uuid4()}_{original_output_filename}"
            stored_output_path_history = os.path.join(current_op_outputs_path, stored_output_filename_history)
            with open(stored_output_path_history, 'wb') as f_hist_out:
                f_hist_out.write(output_file_bytes)

            mimetype_out, _ = mimetypes.guess_type(original_output_filename)
            if process_status == "success":
                cursor.execute('''
                    INSERT INTO operation_files (operation_id, file_type, original_filename, stored_filename, mimetype)
                    VALUES (?, 'output', ?, ?, ?)
                ''', (operation_id, original_output_filename, stored_output_filename_history, mimetype_out or 'application/octet-stream'))
                logging.debug(f"Saved output '{original_output_filename}' to history as '{stored_output_filename_history}'")

            mimetype_preview = mimetype_out or 'application/octet-stream'
            if mimetype_preview.startswith(('image/', 'video/', 'audio/')) or mimetype_preview == 'text/plain' or original_output_filename.endswith(('.srt', '.txt', '.json')):
                try:
                    base64_content = base64.b64encode(output_file_bytes).decode('utf-8')
                    preview_files_data.append({
                        "name": original_output_filename, "mimetype": mimetype_preview,
                        "data_url": f"data:{mimetype_preview};base64,{base64_content}"
                    })
                except Exception as e_b64: logging.error(f"Error base64 encoding for preview '{original_output_filename}': {e_b64}")
            else:
                preview_files_data.append({
                    "name": original_output_filename, "mimetype": mimetype_preview,
                    "data_url": None, "content_length": len(output_file_bytes)
                })
    
    zip_download_url = None
    if valid_results_for_zip and process_status == "success":
        op_name_for_zip = str(operation).replace(" ", "_") if operation else "general"
        zip_filename_short = f'results_{operation_id.split("-")[0]}_{op_name_for_zip}.zip'
        zip_filepath_uploads = os.path.join(UPLOAD_FOLDER, zip_filename_short)
        try:
            with zipfile.ZipFile(zip_filepath_uploads, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
                for fn_zip, content_bytes_zip in valid_results_for_zip.items():
                    zipf.writestr(secure_filename(fn_zip), content_bytes_zip) # ZIP içine de secure_filename ile
            zip_download_url = url_for('download_file', filename=zip_filename_short, _external=True)
            zip_output_filename_for_db = zip_filename_short
            logging.info(f"Generated ZIP download URL: {zip_download_url}")
        except Exception as e_zip:
            logging.error(f"Error zipping files: {e_zip}", exc_info=True)

    cursor.execute('''
        INSERT INTO operations (id, operation_name, timestamp, status, input_details, output_zip_filename)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (operation_id, display_operation_name, operation_timestamp, process_status,
          json.dumps(input_details_for_db) if input_details_for_db else None,
          zip_output_filename_for_db if process_status == "success" else None))

    cursor.execute("SELECT id FROM operations ORDER BY timestamp DESC")
    all_ops_ids_ordered = [row['id'] for row in cursor.fetchall()]
    
    if len(all_ops_ids_ordered) > MAX_HISTORY_ITEMS_DB:
        ids_to_delete = all_ops_ids_ordered[MAX_HISTORY_ITEMS_DB:]
        for old_op_id in ids_to_delete:
            logging.info(f"Deleting old history operation: {old_op_id}")
            cursor.execute("DELETE FROM operations WHERE id = ?", (old_op_id,))
            old_op_folder_to_delete = os.path.join(HISTORY_FILES_BASE, old_op_id)
            if os.path.exists(old_op_folder_to_delete):
                try:
                    shutil.rmtree(old_op_folder_to_delete)
                    logging.info(f"Deleted history files folder: {old_op_folder_to_delete}")
                except Exception as e_rm_hist:
                    logging.error(f"Error deleting history files folder {old_op_folder_to_delete}: {e_rm_hist}")
    db.commit()

    if process_status == "failed":
        error_msg_to_show = "An error occurred during processing."
        if results_dict and "error_message.txt" in results_dict:
             error_msg_to_show = results_dict["error_message.txt"].decode(errors='ignore')
        return jsonify({
            'status': 'error', 'message': error_msg_to_show,
            'preview_files': preview_files_data
        }), 500

    return jsonify({
        'status': 'ready', 'preview_files': preview_files_data,
        'zip_download_url': zip_download_url, 'direct_download_files': direct_download_files
    })

@app.route('/download/<filename>')
def download_file(filename):
    logging.info(f"Download (general zip) endpoint called for file: {filename}")
    safe_filename = secure_filename(filename)
    if not safe_filename or safe_filename != filename : # Ekstra güvenlik
        logging.warning(f"Attempt to download potentially unsafe filename (zip): {filename}")
        return jsonify({'status': 'error', 'message': 'Invalid filename.'}), 400
    
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    if not safe_filename.endswith(".zip"):
        return jsonify({'status': 'error', 'message': 'Only ZIP files.'}), 400
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        logging.error(f"ZIP File not found for download: {file_path}")
        return jsonify({'status': 'error', 'message': 'ZIP File not found.'}), 404
    return send_file(file_path, as_attachment=True)

@app.route('/download_processed/<filename>')
def download_processed_file(filename):
    logging.info(f"Download (processed single) endpoint called for file: {filename}")
    safe_filename = secure_filename(filename)
    if not safe_filename or safe_filename != filename: # Ekstra güvenlik
        logging.warning(f"Attempt to download potentially unsafe filename (processed): {filename}")
        return jsonify({'status': 'error', 'message': 'Invalid filename.'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        logging.error(f"Processed file not found for download: {file_path}")
        return jsonify({'status': 'error', 'message': 'File not found.'}), 404
    return send_file(file_path, as_attachment=True, download_name=filename)

@app.route('/get_history', methods=['GET'])
def get_history_endpoint():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            SELECT o.id, o.operation_name, o.timestamp, o.status, o.input_details
            FROM operations o
            ORDER BY o.timestamp DESC
            LIMIT ?
        ''', (MAX_HISTORY_ITEMS_DB,))
        history_items_raw = cursor.fetchall()
        history_list_for_frontend = []
        for item_raw in history_items_raw:
            cursor.execute("SELECT original_filename FROM operation_files WHERE operation_id = ? AND file_type = 'input'", (item_raw['id'],))
            input_files_for_item = [row['original_filename'] for row in cursor.fetchall()]
            file_name_display = ", ".join(input_files_for_item) if input_files_for_item else "N/A"
            
            input_details_text = None
            if item_raw['input_details']:
                try:
                    input_details_json = json.loads(item_raw['input_details'])
                    input_details_text = input_details_json.get('manga_text')
                except (json.JSONDecodeError, TypeError):
                    pass # Hata olursa sessizce geç, file_name_display'e eklenmeyecek
            
            if input_details_text:
                manga_summary = f"Manga: {input_details_text[:20]}..."
                if file_name_display == "N/A":
                    file_name_display = manga_summary
                else:
                    file_name_display += f"; {manga_summary}"

            history_list_for_frontend.append({
                'id': item_raw['id'], 'operationName': item_raw['operation_name'],
                'timestamp': item_raw['timestamp'], 'status': item_raw['status'],
                'fileName': file_name_display
            })
        return jsonify(history_list_for_frontend)
    except Exception as e:
        logging.error(f"Error in get_history_endpoint: {e}", exc_info=True)
        return jsonify({"error": "Could not retrieve history"}), 500

@app.route('/serve_history_file/<operation_id>/<file_type_plural>/<stored_filename>')
def serve_history_file(operation_id, file_type_plural, stored_filename):
    if not (
        is_safe_path_component(operation_id) and
        is_safe_path_component(stored_filename) and
        file_type_plural in ['inputs', 'outputs']
    ):
        logging.warning(f"Invalid component in history file request: op_id='{operation_id}', type='{file_type_plural}', name='{stored_filename}'")
        return "Invalid path component or file type", 400

    file_path = os.path.join(HISTORY_FILES_BASE, operation_id, file_type_plural, stored_filename)
    
    if not os.path.abspath(file_path).startswith(os.path.abspath(HISTORY_FILES_BASE)):
        logging.error(f"Potential path traversal attempt: Resolved path '{os.path.abspath(file_path)}' is outside base '{os.path.abspath(HISTORY_FILES_BASE)}'")
        return "Access denied", 403


    logging.debug(f"Attempting to serve history file: {file_path}")

    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        logging.error(f"History file not found: {file_path}")
        return "File not found", 404
    
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT original_filename, mimetype FROM operation_files WHERE operation_id = ? AND stored_filename = ?",
                       (operation_id, stored_filename))
        row = cursor.fetchone()
        
        if not row:
            logging.error(f"File metadata not found in DB for op_id='{operation_id}', stored_filename='{stored_filename}'")
            return "File metadata not found", 404

        download_name_original = row['original_filename']
        mimetype_original = row['mimetype'] if row['mimetype'] else 'application/octet-stream' # Varsayılan mimetype

        return send_file(file_path, as_attachment=True, download_name=download_name_original, mimetype=mimetype_original)
    except Exception as e:
        logging.error(f"Error serving history file (op_id='{operation_id}', name='{stored_filename}'): {e}", exc_info=True)
        return "Error serving file", 500

@app.route('/get_history_item_details/<operation_id>', methods=['GET'])
def get_history_item_details(operation_id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM operations WHERE id = ?", (operation_id,))
        operation_details = cursor.fetchone()

        if not operation_details:
            logging.warning(f"Operation not found in DB for ID: {operation_id}")
            return jsonify({'error': 'Operation not found', 'status_code': 404}), 404

        cursor.execute("SELECT * FROM operation_files WHERE operation_id = ?", (operation_id,))
        files_raw = cursor.fetchall()

        input_files_list = []
        output_files_list = []

        for f_row in files_raw:
            file_data_for_frontend = {
                'original_filename': f_row['original_filename'],
                'mimetype': f_row['mimetype'],
                'download_url': url_for('serve_history_file',
                                        operation_id=operation_id,
                                        file_type_plural=f_row['file_type'] + 's',
                                        stored_filename=f_row['stored_filename'],
                                        _external=True)
            }
            if f_row['file_type'] == 'input':
                input_files_list.append(file_data_for_frontend)
            else:
                output_files_list.append(file_data_for_frontend)
        
        input_details_text_content = None
        if operation_details['input_details']:
            try:
                details_json = json.loads(operation_details['input_details'])
                input_details_text_content = details_json.get('manga_text')
            except (json.JSONDecodeError, TypeError) as e_json:
                logging.warning(f"Could not parse input_details JSON for op_id {operation_id}: {e_json}")
                input_details_text_content = None

        overall_zip_url = None
        if operation_details['output_zip_filename']:
            overall_zip_url = url_for('download_file', filename=operation_details['output_zip_filename'], _external=True)

        return jsonify({
            'operation_id': operation_details['id'],
            'operation_name': operation_details['operation_name'],
            'timestamp': operation_details['timestamp'],
            'status': operation_details['status'],
            'input_text_content': input_details_text_content,
            'inputs': input_files_list,
            'outputs': output_files_list,
            'overall_zip_download_url': overall_zip_url
        })
    except sqlite3.Error as e_sql:
        logging.error(f"SQLite error in get_history_item_details for ID {operation_id}: {e_sql}", exc_info=True)
        return jsonify({'error': 'Database error while fetching details.', 'details': str(e_sql), 'status_code': 500}), 500
    except Exception as e:
        logging.error(f"Unexpected error in get_history_item_details for ID {operation_id}: {e}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred.', 'details': str(e), 'status_code': 500}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860, debug=True, use_reloader=False)