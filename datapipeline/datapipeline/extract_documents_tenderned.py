import requests
import polars as pl
import datetime
import os

document_base_url = "https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/"

# Get yesterday's date
today = datetime.date.today() - datetime.timedelta(days=1)
print(today)

delta_folder = f"data_local/clean/publications/"

df = pl.read_delta(delta_folder)
df = df.filter(pl.col("publicatieDatum") == today)

for publicatie_id in df.select("publicatieId").to_series():
    document_url = f"{document_base_url}{publicatie_id}/documenten/zip"
    print(document_url)
    response = requests.get(document_url)
    
    # Make folder for publicatie in raw if it doesn't exist
    directory = os.path.join('data_local', "raw", "documents", publicatie_id)
    os.makedirs(directory, exist_ok=True)
    
    # Save zip file
    with open(os.path.join(directory, "documents.zip"), "wb") as file:
        file.write(response.content)
        
    # Unzip file, if the extracted file already exists do not overwrite
    os.system(f'unzip -n "{directory}/documents.zip" -d {directory}')
    
    # Delete zip file
    os.remove(f"{directory}/documents.zip")
    
    # Unzip all zip files in the directory
    for file in os.listdir(directory):
        if file.endswith(".zip"):
            print(file)
            os.system(f'unzip "{directory}/{file}" -d {directory}')
            os.remove(f"{directory}/{file}")