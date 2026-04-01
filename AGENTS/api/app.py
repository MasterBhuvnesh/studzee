import os
from flask import Flask, jsonify, make_response, request
import hashlib
from dotenv import load_dotenv
from database import get_pending_seed_document
from ocr import process_pdf_from_s3

load_dotenv()

app = Flask(__name__)


@app.route("/")
def hello_from_root():
    return jsonify(message='Hello from root!')


@app.route("/hello")
def hello():
    return jsonify(message='Hello from path!')


@app.errorhandler(404)
def resource_not_found(e):
    return make_response(jsonify(error='Not found!'), 404)


@app.route("/content-generate", methods=["GET", "POST"])
def content_generate():
    password = ""
    if request.is_json:
        password = request.json.get("password", "")
    if not password:
        password = request.headers.get("Authorization", "").replace("Bearer ", "")
        
    expected_hash = os.environ.get("EXPECTED_TOKEN", "")
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest() if password else ""
    
    if password_hash == expected_hash:
        try:
            document = get_pending_seed_document()
            if document:
                url = document.get("Url")
                if url:
                    try:
                        generated_content = process_pdf_from_s3(url)
                    except TimeoutError as te:
                        return make_response(jsonify(error=str(te))), 504
                    except Exception as e:
                        return make_response(jsonify(error=f"OCR error: {str(e)}")), 500

                    return jsonify(
                        message="Content generated successfully",
                        document=document,
                        generated_content=generated_content
                    ), 200

                return make_response(jsonify(error="Pending document is missing Url"), 400)
            else:
                return jsonify(message="No pending documents found"), 404
        except ValueError as ve:
            return make_response(jsonify(error=str(ve)), 500)
        except Exception as e:
            return make_response(jsonify(error=f"Database error: {str(e)}"), 500)
    
    return make_response(jsonify(error="Unauthorized"), 401)



'''
ITS FOR TESTING
This endpoint is used to update the status of a document in the 'seed_pdfs' collection.
It takes the document ID and the new status as input.

@app.route("/content-update", methods=["GET", "POST"])
def content_update():
    password = ""
    if request.is_json:
        password = request.json.get("password", "")
    if not password:
        password = request.headers.get("Authorization", "").replace("Bearer ", "")
        
    expected_hash = os.environ.get("EXPECTED_TOKEN", "")
    
    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest() if password else ""
    
    if password_hash == expected_hash:
        try:
            doc_id = None
            new_status = None
            
            if request.is_json:
                doc_id = request.json.get("id")
                new_status = request.json.get("status")
                
            if not doc_id or new_status is None:
                return make_response(jsonify(error="Missing 'id' or 'status' in request JSON body"), 400)
                
            # Convert string booleans just in case
            if isinstance(new_status, str):
                new_status = new_status.lower() in ('true', '1', 't', 'yes')
                
            success = update_seed_document_status(doc_id, new_status)
            if success:
                return jsonify(message="Document status successfully updated"), 200
            else:
                return make_response(jsonify(error="Failed to update document or document not found"), 404)
        except ValueError as ve:
            return make_response(jsonify(error=str(ve)), 500)
        except Exception as e:
            return make_response(jsonify(error=f"Database error: {str(e)}"), 500)
    
    return make_response(jsonify(error="Unauthorized"), 401)
'''