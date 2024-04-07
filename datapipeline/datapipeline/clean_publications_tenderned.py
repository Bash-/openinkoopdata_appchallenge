import polars as pl
import pyarrow as pa
import datetime
import os

# Get today's date
today = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

# Path to the JSON file
json_file = f"data_local/raw/publications/{today}/publications.json"

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

df = pl.read_ndjson(json_file, schema=schema)

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
   

# Path to the Delta table folder
delta_folder = "data_local/clean/publications/"

# Create folder if it does not exist
if not os.path.exists(delta_folder):
    os.makedirs(delta_folder)

# Create delta table if it does not exist
if not os.path.exists(delta_folder + "_delta_log"):
    df.write_delta(delta_folder)

# Upsert into the Delta table based on the publicatieId field
(
    df.write_delta(
        delta_folder,
        mode="merge",
        delta_merge_options={
                "predicate": "s.publicatieId = t.publicatieId",
                "source_alias": "s",
                "target_alias": "t"
        },
    )
    .when_matched_update_all()
    .when_not_matched_insert_all()
    .execute()
)