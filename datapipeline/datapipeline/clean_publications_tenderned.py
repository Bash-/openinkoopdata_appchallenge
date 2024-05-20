import polars as pl
import pyarrow as pa
import datetime
import os
from dotenv import load_dotenv
from io import StringIO
from google.cloud import storage


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

# Unnest the struct field columns and give alias (Delta merge does not support struct fields it seems)
for column in schema.keys():
    if isinstance(df[column].dtype, pl.Struct):
        df = (
            df.with_columns(
                df.select(
                    pl.col(column)
                    .struct
                    .rename_fields([f'{column}_{x.name}' for x in df[column].dtype.fields]))
                    .unnest(column)
            )
        )
        df = df.drop(column)
   
# TODO TEMPORARY: limit the number of publications to 5
df = df.head(5)

# Write the delta table to postgres database
df.write_database(
    connection=os.getenv("POSTGRES_CONNECTION_STRING"),
    table_name="publications",
    if_table_exists='append'
)