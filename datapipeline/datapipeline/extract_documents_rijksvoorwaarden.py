import requests
import os

from datapipeline.insert_documents_vectordb import insert_other_documents_postgres, insert_to_vectordb

urls: list = [
    {
        "name": "Besluit vaststelling Algemene Rijksvoorwaarden voor inkoop (ARBIT-2018, ARIV-2018 en ARVODI-2018)",
        "url": "https://wetten.overheid.nl/BWBR0040889/2022-09-10/0/txt"
    },
    {
        "name": "Besluit vaststelling Algemene Rijksvoorwaarden bij IT-overeenkomsten 2022 (ARBIT-2022)",
        "url": "https://wetten.overheid.nl/BWBR0047124/2022-09-10/0/txt"
    },
    {
        "name": "Besluit vaststelling Uniforme administratieve voorwaarden voor de uitvoering van werken en van technische installatiewerken 2012 (UAV 2012)",
        "url": "https://wetten.overheid.nl/BWBR0031190/2012-03-01/0/txt"
    }
]

tenderId = "rijksvoorwaarden"

documents: list = [
    {
        "tenderid": tenderId,  # Placeholder, replace with actual tender ID
        "documentid": "DOC_ID_1",  # Placeholder, replace with actual document ID
        "documentnaam": "Besluit vaststelling Algemene Rijksvoorwaarden voor inkoop (ARBIT-2018, ARIV-2018 en ARVODI-2018)",
        "typedocument": "txt",  # Placeholder, specify the document type
        "datumpublicatie": "2022-09-10",  # Assuming the date in the URL is the publication date
        "gepubliceerddoor": "PUBLISHER_NAME",  # Placeholder, replace with the publisher's name
        "publicatiecategorie": "CATEGORY",  # Placeholder, specify the publication category
        "virusindicatie": False,  # Placeholder, specify the virus status
        "grootte": -1,  # Placeholder, specify the document size
        "downloadurl": "https://wetten.overheid.nl/BWBR0040889/2022-09-10/"
    },
    {
        "tenderid": tenderId,
        "documentid": "DOC_ID_2",
        "documentnaam": "Besluit vaststelling Algemene Rijksvoorwaarden bij IT-overeenkomsten 2022 (ARBIT-2022)",
        "typedocument": "txt",
        "datumpublicatie": "2022-09-10",
        "gepubliceerddoor": "PUBLISHER_NAME",
        "publicatiecategorie": "CATEGORY",
        "virusindicatie": False,
        "grootte": -1,
        "downloadurl": "https://wetten.overheid.nl/BWBR0047124/2022-09-10/"
    },
    {
        "tenderid": tenderId,
        "documentid": "DOC_ID_3",
        "documentnaam": "Besluit vaststelling Uniforme administratieve voorwaarden voor de uitvoering van werken en van technische installatiewerken 2012 (UAV 2012)",
        "typedocument": "txt",
        "datumpublicatie": "2012-03-01",
        "gepubliceerddoor": "PUBLISHER_NAME",
        "publicatiecategorie": "CATEGORY",
        "virusindicatie": False,
        "grootte": -1,
        "downloadurl": "https://wetten.overheid.nl/BWBR0031190/2012-03-01/"
    }
]

def extract_documents_voorwaarden():
    # Make directory if it does not exist
    if not os.path.exists("data_local/raw/rijksvoorwaarden"):
        os.makedirs("data_local/raw/rijksvoorwaarden")
    
    for url in urls:
        filename = url["name"].replace(" ", "_").replace("&", "en") + ".txt"
        
        # Check if Rijksvoorwaarde document already exists
        if not os.path.exists(f"data_local/raw/rijksvoorwaarden/{filename}"):
            response = requests.get(url["url"])
            
            # Replace spaces with underscores and replace & with 'en'
            with open(f"data_local/raw/rijksvoorwaarden/{filename}", "w") as f:
                f.write(response.text)
                print(f"Extracted {url['name']} to data_local/raw/rijksvoorwaarden/{filename}")
        else:
            print(f"File for Rijksvoorwaarde {url['name']} already exists")
    
    insert_to_vectordb('data_local/raw/rijksvoorwaarden', 'rijksvoorwaarden')
    insert_other_documents_postgres(documents)

extract_documents_voorwaarden()