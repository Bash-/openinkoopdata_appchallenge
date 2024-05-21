import datetime
import json
import os
from io import StringIO
import polars as pl
import pyarrow as pa
import requests
from dotenv import load_dotenv
from google.cloud import storage
from psycopg2.extensions import register_adapter, AsIs
from psycopg2.extras import Json

register_adapter(dict, Json)

load_dotenv()

# Get today's date
today = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

# Download the JSON file from Google Cloud Storage to the local environment
storage_client = storage.Client.from_service_account_json("gcp_serviceaccount.json")
bucket = storage_client.bucket("aitenderportaal-storage")
blob = bucket.blob(f"raw/publications/{today}/publications.json")
blob.download_to_filename(f"data_local/raw/publications/{today}/publications.json")

# Read the JSON file into a DataFrame with the specified schema
schema: dict = {
    "publicatieId": pl.Utf8,
    "publicatieDatum": pl.Date,
    "typePublicatie": pl.Struct({
        "code": pl.Utf8,
        "omschrijving": pl.Utf8       
    }),
    "aanbestedingNaam": pl.Utf8,
    "aanbestedendeDienstNaam": pl.Utf8,
    "opdrachtgeverNaam": pl.Utf8,
    "sluitingsDatum": pl.Datetime,
    "procedure": pl.Struct({
        "code": pl.Utf8,
        "omschrijving": pl.Utf8
    }),
    "typeOpdracht": pl.Struct({
        "code": pl.Utf8,
        "omschrijving": pl.Utf8
    }),
    "digitaal": pl.Boolean,
    "europees": pl.Boolean,
    "publicatiecode": pl.Struct({
        "code": pl.Utf8,
        "omschrijving": pl.Utf8
    }),
    "publicatiestatus": pl.Struct({
        "code": pl.Utf8,
        "omschrijving": pl.Utf8
    }),
    "isVroegtijdigeBeeindiging": pl.Boolean,
    "opdrachtBeschrijving": pl.Utf8,
    "link": pl.Struct({
        "href": pl.Utf8,
        "title": pl.Utf8
    })
}

df = pl.read_ndjson(f"data_local/raw/publications/{today}/publications.json", schema=schema)

  
# TODO TEMPORARY: limit the number of publications to 5
df = df.head(5)

tenderIds = df['publicatieId'].to_list()

    
for tenderId in tenderIds:
    """
    1. Call publications api and fetch all publications of the day
    2. Based on publicationId, fetch the publication details
    3. Insert the publication details into the database
    """

    import json
    from io import StringIO

    url = f"https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{tenderId}/"
    print(url)

    response = requests.get(url)
    data = response.json()
    data = json.dumps(data)

    df = pl.read_json(StringIO(data), schema={
        "publicatieId": pl.Int64,
        "kenmerk": pl.Int64,
        "aanbestedingNaam": pl.Utf8,
        "aanbestedendeDienstNaam": pl.Utf8,
        "numberOfDaysBeforeAanmeldenInschrijven": pl.Int64,
        "opdrachtBeschrijving": pl.Utf8,
        "publicatieDatum": pl.Datetime,
        "aanvangOpdrachtDatum": pl.Datetime,
        "voltooiingOpdrachtDatum": pl.Datetime,
        "typePublicatie": pl.Utf8,
        "publicatieCode": pl.Utf8,
        "juridischKaderCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "nationaalOfEuropeesCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "typeOpdrachtCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "procedureCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "cpvCodes": pl.List(pl.Struct([
            pl.Field("isHoofdOpdracht", pl.Boolean),
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ])),
        "nutsCodes": pl.List(pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ])),
        "isDigitaalInschrijvenMogelijk": pl.Boolean,
        "afgerondeAanbesteding": pl.Boolean,
        "isGeimporteerd": pl.Boolean,
        "isVroegtijdigBeeindigd": pl.Boolean,
        "publicatiePdfId": pl.Int64,
        "onlyGunningProcedure": pl.Boolean,
        "isGegund": pl.Boolean,
        "digitaalInschrijvenCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "referentieNummer": pl.Utf8,
        "aanbestedingStatus": pl.Utf8,
        "aankondigingCode": pl.Struct([
            pl.Field("code", pl.Utf8),
            pl.Field("omschrijving", pl.Utf8)
        ]),
        "links": pl.Struct([
            pl.Field("pdf", pl.Struct([
                pl.Field("href", pl.Utf8),
                pl.Field("title", pl.Utf8)
            ])),
            pl.Field("keepInformed", pl.Struct([
                pl.Field("href", pl.Utf8),
                pl.Field("title", pl.Utf8)
            ])),
            pl.Field("shareOnLinkedIn", pl.Struct([
                pl.Field("href", pl.Utf8),
                pl.Field("title", pl.Utf8)
            ]))
        ]),
        "trefwoord1": pl.Utf8,
        "trefwoord2": pl.Utf8,
        "trefwoord3": pl.Utf8,
        "trefwoord4": pl.Utf8,
        "trefwoord5": pl.Utf8,
        "trefwoord6": pl.Utf8,
        "trefwoord7": pl.Utf8,
        "trefwoord8": pl.Utf8,
        "trefwoord9": pl.Utf8,
        "trefwoord10": pl.Utf8,
    })
    
    # Make all column names lowercase and drop the original columns
    df = df.rename(lambda x: x.lower())
    
    # Unnest the struct field columns and give alias (Delta merge does not support struct fields it seems)
    for column in df.schema.keys():
        if isinstance(df[column].dtype, pl.Struct):
            df = (
                df.with_columns(
                    df.select(
                        pl.col(column)
                        .struct
                        .rename_fields([f'{column}{x.name}'.lower() for x in df[column].dtype.fields]))
                        .unnest(column)
                )
            )
            df = df.drop(column)
        elif isinstance(df[column].dtype, pl.List):
            df = df.drop(column)

    # Write the delta table to postgres database
    df.write_database(
        connection=os.getenv("POSTGRES_CONNECTION_STRING"),
        table_name="publications",
        if_table_exists='append'
    )