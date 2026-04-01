import os
import urllib.parse
import boto3
import time
import json
from llm import format_text_with_llm, generate_blog_brief_with_llm

def extract_bucket_and_key(s3_url: str):
    """
    Given an S3 URL like https://bucket.s3.amazonaws.com/key, returns the (bucket, key).
    """
    parsed = urllib.parse.urlparse(s3_url)
    
    if "s3.amazonaws.com" in parsed.netloc:
        if parsed.netloc == "s3.amazonaws.com":
            # format: https://s3.amazonaws.com/bucket/key
            parts = parsed.path.lstrip('/').split('/', 1)
            bucket = parts[0]
            key = parts[1]
        else:
            # format: https://bucket.s3.amazonaws.com/key
            bucket = parsed.netloc.split('.s3')[0]
            key = parsed.path.lstrip('/')
    else:
        # fallback for s3://bucket/key URL types
        if parsed.scheme == "s3":
            bucket = parsed.netloc
            key = parsed.path.lstrip('/')
        else:
            raise ValueError(f"Unrecognized S3 URL format: {s3_url}")
            
    key = urllib.parse.unquote(key)
    return bucket, key

def process_pdf_from_s3(s3_url: str):
    """
    Extracts bucket and key from the s3_url, triggers a Textract asynchronous job,
    polls for the result until completion, and returns generated blog JSON.
    """
    bucket, key = extract_bucket_and_key(s3_url)
    client = boto3.client('textract')
    
    print(f"Starting Textract for bucket: {bucket}, key: {key}")
    
    response = client.start_document_text_detection(
        DocumentLocation={
            'S3Object': {
                'Bucket': bucket,
                'Name': key
            }
        }
    )
    
    job_id = response['JobId']
    print(f"Started Textract Job: {job_id}")
    
    # Poll for completion without a timeout.
    status = 'IN_PROGRESS'
    while status == 'IN_PROGRESS':
        time.sleep(2)
        response = client.get_document_text_detection(JobId=job_id)
        status = response['JobStatus']
        
        if status == 'FAILED':
            raise Exception("Textract job failed to process the PDF.")
        elif status == 'SUCCEEDED':
            break

    # Job is complete, fetch and paginate the extracted text
    pages = [response]
    next_token = response.get('NextToken')
    
    while next_token:
        response = client.get_document_text_detection(JobId=job_id, NextToken=next_token)
        pages.append(response)
        next_token = response.get('NextToken')
        
    extracted_text = []
    
    for page in pages:
        for block in page.get('Blocks', []):
            # We only want the lines of text
            if block['BlockType'] == 'LINE':
                extracted_text.append(block['Text'])
                
    raw_text = "\n".join(extracted_text)
    
    # Process text through LLM formatting
    print("Formatting extracted text with AWS Bedrock LLM...")
    formatted_text = format_text_with_llm(raw_text)
    
    # Process cleaned text through LLM blog brief generator
    print("Generating blog brief with AWS Bedrock LLM...")
    generated_output = generate_blog_brief_with_llm(formatted_text)
    
    # Write to local file. 
    # Use /tmp/output.txt if running in AWS Lambda, else use current dir for local testing.
    is_lambda = os.environ.get('AWS_EXECUTION_ENV') is not None
    output_path = '/tmp/output.txt' if is_lambda else 'output.txt'
    
    if isinstance(generated_output, (dict, list)):
        output_text = json.dumps(generated_output, ensure_ascii=False, indent=2)
    else:
        output_text = str(generated_output)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(output_text)
        
    print(f"Blog Brief successfully saved to {output_path}.")
    return generated_output
