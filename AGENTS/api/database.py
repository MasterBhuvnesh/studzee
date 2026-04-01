import os
import pymongo
import dns.resolver
from bson.objectid import ObjectId

# Configure custom DNS resolver to prevent SRV lookup failures in Lambda
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['1.1.1.1', '8.8.8.8']

# Initialize client globally to reuse connection in warm Lambda executions
client = None

def get_db_client():
    global client
    if client is None:
        mongo_uri = os.environ.get("MONGO_URI")
        if not mongo_uri:
            raise ValueError("Database configuration error: MONGO_URI is missing")
        client = pymongo.MongoClient(mongo_uri)
    return client

def get_pending_seed_document():
    """
    Fetches the first document in the 'seed_pdfs' collection
    that has a 'status' of False.
    Returns the document Dict with stringified '_id' if found, else None.
    Raises ValueError if MONGO_URI is not set.
    """
    db_client = get_db_client()
    db = db_client['S3_PDFs']
    collection = db['seed_pdfs']
    
    document = collection.find_one({"status": False})
    
    if document:
        # Convert ObjectId to string for JSON serialization
        document["_id"] = str(document["_id"])
        
    return document

def update_seed_document_status(doc_id_str: str, new_status: bool) -> bool:
    """
    Updates the 'status' field of a document in 'seed_pdfs' given its string ID.
    Returns True if a document was successfully modified, False otherwise.
    """
    db_client = get_db_client()
    db = db_client['S3_PDFs']
    collection = db['seed_pdfs']
    
    try:
        object_id = ObjectId(doc_id_str)
        result = collection.update_one(
            {"_id": object_id},
            {"$set": {"status": new_status}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Failed to update document {doc_id_str}: {e}")
        return False
