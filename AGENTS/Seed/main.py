import os
import re
import urllib.parse
import boto3
from pymongo import MongoClient
import dns.resolver
import dotenv

dotenv.load_dotenv()

def main():
    # Configure custom DNS resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['1.1.1.1', '8.8.8.8']

    # MongoDB configuration
    client = MongoClient(os.getenv("MONGO_URI"))
    # Database names cannot contain spaces in MongoDB, using 'S3_PDFs'
    db = client['S3_PDFs']
    collection = db['seed_pdfs']

    # S3 configuration
    # Ensure AWS configuration is set up in your environment
    s3_client = boto3.client('s3')
    bucket_name = "studzee-assets"
    s3_folder = "seed pdfs/"

    # Target directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_dir = os.path.join(script_dir, "Seed PDF")

    if not os.path.exists(target_dir):
        print(f"Directory not found: {target_dir}")
        return

    # Process folders and files
    for folder_name in sorted(os.listdir(target_dir)):
        folder_path = os.path.join(target_dir, folder_name)
        if not os.path.isdir(folder_path):
            continue

        for file_name in sorted(os.listdir(folder_path)):
            if not file_name.lower().endswith(".pdf"):
                continue

            file_path = os.path.join(folder_path, file_name)

            # Generate formatted folder name (replace spaces with underscores)
            clean_folder_name = folder_name.replace(" ", "_")
            
            # Extract chapter name and add underscore if missing (e.g., 'chapter1' -> 'chapter_1')
            chapter_name = file_name.replace(".pdf", "")
            match = re.search(r'chapter\s*(\d+)', chapter_name, re.IGNORECASE)
            if match:
                chapter_str = f"chapter_{match.group(1)}"
            else:
                chapter_str = chapter_name.replace(" ", "_")

            # Combined S3 file name (e.g., 'Ensemble_Method_in_python_chapter_1.pdf')
            new_file_name = f"{clean_folder_name}_{chapter_str}.pdf"
            s3_key = f"{s3_folder}{new_file_name}"

            # Check if it already exists in the database
            if collection.find_one({"File_Name": new_file_name}):
                print(f"Skipping '{new_file_name}', already exists in MongoDB.")
                continue

            print(f"Uploading '{new_file_name}' to S3...")
            try:
                # Upload file to S3
                s3_client.upload_file(file_path, bucket_name, s3_key)

                # Generate public URL for the newly uploaded file
                encoded_key = urllib.parse.quote(s3_key)
                url = f"https://{bucket_name}.s3.amazonaws.com/{encoded_key}"

                # Calculate the incremented index
                last_doc = collection.find_one(sort=[("idx", -1)])
                current_idx = last_doc["idx"] + 1 if last_doc and "idx" in last_doc else 1

                # Insert metadata into MongoDB
                doc = {
                    "idx": current_idx,
                    "Name": folder_name,
                    "Chapter": chapter_str,
                    "File_Name": new_file_name,
                    "Url": url,
                    "status": False,
                    "docid": None,
                    "UsedDate": ""
                }
                collection.insert_one(doc)
                print(f"Successfully saved metadata for '{new_file_name}' to MongoDB.")

            except Exception as e:
                print(f"Error processing '{new_file_name}': {e}")

if __name__ == "__main__":
    main()
