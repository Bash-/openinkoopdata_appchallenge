from google.cloud import storage
from dotenv import load_dotenv
import os


def upload_file_to_gcp(file_name, bucket_name, destination_blob_name):
    # Upload the extracted data to Google Cloud Storage
    
    load_dotenv()

    try:
        # Authenticate with Google Cloud Storage using credentials from .env file
        storage_client = storage.Client.from_service_account_json("gcp_serviceaccount.json")
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(file_name)
        print(f"File {file_name} uploaded to {bucket_name}/{destination_blob_name}")
    except Exception as e:
        raise Exception(f"Failed to upload file to Google Cloud Storage: {e}")
