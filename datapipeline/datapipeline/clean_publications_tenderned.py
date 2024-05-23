import datetime
import json
import os

import psycopg2
import requests
from dotenv import load_dotenv
from google.cloud import storage
from psycopg2.extensions import AsIs, register_adapter
from psycopg2.extras import Json, execute_values

register_adapter(dict, Json)

load_dotenv()

# Get today's date
today = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

# Download the JSON file from Google Cloud Storage to the local environment
storage_client = storage.Client.from_service_account_json("gcp_serviceaccount.json")
bucket = storage_client.bucket("aitenderportaal-storage")
blob = bucket.blob(f"raw/publications/{today}/publications.json")
blob.download_to_filename(f"data_local/raw/publications/{today}/publications.json")

tenderIds = []
with open(f"data_local/raw/publications/{today}/publications.json") as f:
    # this json file is formatted as ndjson, meaning that each line is a separate json object
    data = f.readlines()
    # take all publicatieId's from the json file
    for line in data:
        tenderIds.append(json.loads(line)["publicatieId"])
    
        
# TODO amount tenderIds limited to 5 for testing purposes
tenderIds = tenderIds[:5]
print("Going to load tenderIds:", tenderIds)

# Connect to your postgres DB
conn = psycopg2.connect(os.getenv("POSTGRES_CONNECTION_STRING"))
cur = conn.cursor()

# Define the table schema
table_schema = """
CREATE TABLE IF NOT EXISTS publications (
    publicatieid BIGINT PRIMARY KEY,
    kenmerk BIGINT,
    aanbestedingnaam TEXT,
    aanbestedendedienstnaam TEXT,
    numberofdaysbeforeaanmeldeninschrijven BIGINT,
    opdrachtbeschrijving TEXT,
    publicatiedatum TIMESTAMP,
    sluitingsdatum TIMESTAMP,
    aanvangopdrachtdatum TIMESTAMP,
    voltooiingopdrachtdatum TIMESTAMP,
    typepublicatie TEXT,
    publicatiecode TEXT,
    juridischkadercodecode TEXT,
    juridischkadercodeomschrijving TEXT,
    nationaalofeuropeescodecode TEXT,
    nationaalofeuropeescodeomschrijving TEXT,
    typeopdrachtcodecode TEXT,
    typeopdrachtcodeomschrijving TEXT,
    procedurecodecode TEXT,
    procedurecodeomschrijving TEXT,
    isdigitaalinschrijvenmogelijk BOOLEAN,
    afgerondeaanbesteding BOOLEAN,
    isgeimporteerd BOOLEAN,
    urltsenderwebsite TEXT,
    urltsendernaam TEXT,
    isvroegtijdigbeeindigd BOOLEAN,
    publicatieidlaatsterectificatie BIGINT,
    publicatiepdfid BIGINT,
    onlygunningprocedure BOOLEAN,
    isgegund BOOLEAN,
    digitaalinschrijvencodecode TEXT,
    digitaalinschrijvencodeomschrijving TEXT,
    referentienummer TEXT,
    afwijkendreglement TEXT,
    aanbestedingstatus TEXT,
    aankondigingcodecode TEXT,
    aankondigingcodeomschrijving TEXT,
    linkspdfhref TEXT,
    linkspdftitle TEXT,
    linkskeepinformedhref TEXT,
    linkskeepinformedtitle TEXT,
    linksaddtotendershref TEXT,
    linksaddtotenderstitle TEXT,
    linksshareonlinkedinhref TEXT,
    linksshareonlinkedintitle TEXT,
    trefwoord1 TEXT,
    trefwoord2 TEXT,
    trefwoord3 TEXT,
    trefwoord4 TEXT,
    trefwoord5 TEXT,
    trefwoord6 TEXT,
    trefwoord7 TEXT,
    trefwoord8 TEXT,
    trefwoord9 TEXT,
    trefwoord10 TEXT
)
"""

# Execute the CREATE TABLE query
cur.execute(table_schema)

# Commit the transaction
conn.commit()

# Load the environment variables
load_dotenv()

def flatten_json(y):
    out = {}

    def flatten(x, name=''):
        if type(x) is dict:
            for a in x:
                flatten(x[a], name + a.lower())
        elif type(x) is list:
            pass  # Ignore lists
        else:
            out[name] = x

    flatten(y)
    return out

# Connect to your postgres DB
conn = psycopg2.connect(os.getenv("POSTGRES_CONNECTION_STRING"))
cur = conn.cursor()

# Get the column names from the publications table
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'publications'")
table_columns = [row[0] for row in cur.fetchall()]

for tenderId in tenderIds:
    print("Inserting", tenderId)
    # Fetch the publication details
    url = f"https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{tenderId}/"
    response = requests.get(url)
    data = response.json()

    # Flatten the JSON data
    flat_data = flatten_json(data)

    # Filter out any values that are lists
    flat_data = {k: v for k, v in flat_data.items() if not isinstance(v, list)}

    # Only keep the data for the columns that exist in the table
    flat_data = {k: v for k, v in flat_data.items() if k in table_columns}
    
     # If publicatieidlaatsterectificatie exists, skip this iteration. This means that the tender is not valid anymore
    if 'publicatieidlaatsterectificatie' in flat_data:
        continue

    # Insert the data into the database, or update the existing record if the publicatieid already exists
    columns = flat_data.keys()
    values = [flat_data[column] for column in columns]
    insert_query = f"""
    INSERT INTO publications ({', '.join(columns)}) VALUES %s
    ON CONFLICT (publicatieid) DO UPDATE SET
    {', '.join(f"{column} = EXCLUDED.{column}" for column in columns)}
    """
    execute_values(cur, insert_query, [values])

# Commit the transaction
conn.commit()
conn.close()
