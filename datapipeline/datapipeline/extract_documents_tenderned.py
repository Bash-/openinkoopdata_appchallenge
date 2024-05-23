import requests
from datapipeline.insert_documents_vectordb import insert_document_metadata_to_postgres, insert_to_vectordb
import psycopg2
import datetime
import os
from dotenv import load_dotenv
from utils.gcp_helpers import upload_file_to_gcp

load_dotenv()

document_base_url = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/"

# Get yesterday's date
today = datetime.date.today() - datetime.timedelta(days=1)
print(today)

# Connect to your postgres DB
conn = psycopg2.connect(os.getenv("POSTGRES_CONNECTION_STRING"))
cur = conn.cursor()

# Get the column names from the publications table
cur.execute(f"SELECT publicatieid FROM publications WHERE date(publicatiedatum) = TO_DATE('{today}', 'YYYY-MM-DD')")
publicatie_ids = [row[0] for row in cur.fetchall()]
print(publicatie_ids)

conn.commit()
conn.close()

for publicatie_id in publicatie_ids:
    publicatie_id = str(publicatie_id)
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
    
    insert_to_vectordb(local_directory, publicatie_id)
    insert_document_metadata_to_postgres(publicatie_id)