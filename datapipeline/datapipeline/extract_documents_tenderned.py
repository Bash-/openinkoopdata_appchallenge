import requests
import polars as pl
import datetime
import os
from dotenv import load_dotenv
from utils.gcp_helpers import upload_file_to_gcp

load_dotenv()

document_base_url = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/"

# Get yesterday's date
today = datetime.date.today() - datetime.timedelta(days=1)
print(today)

# delta_folder = f"data_local/clean/publications/"

gcp_path = "gs://aitenderportaal-storage/clean/publications/"

df = pl.read_delta(gcp_path, storage_options={"service_account": os.getenv("GOOGLE_APPLICATION_CREDENTIALS")})
df = df.filter(pl.col("publicatieDatum") == today)

# TODO TEMPORARY: limit the number of publications to 5
df = df.head(5)

for publicatie_id in df.select("publicatieId").to_series():
    print("Downloading documents for publicatie:", publicatie_id)
    document_url = f"{document_base_url}{publicatie_id}/documenten/zip"
    print(document_url)
    response = requests.get(document_url)
    
    directory = os.path.join("raw", "documents", publicatie_id)
    
    # Make folder for publicatie in raw if it doesn't exist
    local_directory = os.path.join('data_local', directory)
    os.makedirs(local_directory, exist_ok=True)
    
    # Save zip file
    with open(os.path.join(local_directory, "documents.zip"), "wb") as file:
        file.write(response.content)
        
    # Unzip file, if the extracted file already exists do not overwrite
    os.system(f'unzip -n "{local_directory}/documents.zip" -d {local_directory}')
    
    # Delete zip file
    os.remove(f"{local_directory}/documents.zip")
    
    # Unzip all zip files in the directory
    for file in os.listdir(local_directory):
        if file.endswith(".zip"):
            print(file)
            os.system(f'unzip -o "{local_directory}/{file}" -d {local_directory}')
            os.remove(f"{local_directory}/{file}")
        
    # Upload all files in the directory and subdirectories to GCP
    for root, dirs, files in os.walk(local_directory):
        print("Uploading files to GCP...", root, dirs, files)
        for file in files:
            file_path = os.path.join(root, file)
            destination_blob_name = os.path.join(directory, file)
            upload_file_to_gcp(file_path, 'aitenderportaal-storage', destination_blob_name)
            