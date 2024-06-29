import weaviate
import weaviate.classes as wvc
from weaviate.classes.config import Property, DataType
import os
from dotenv import load_dotenv

load_dotenv()

# Set these environment variables
URL = os.getenv("WEAVIATE_HOST")
APIKEY = os.getenv("WEAVIATE_API_KEY")

# Connect to a WCS instance
client = weaviate.connect_to_wcs(
    cluster_url=URL,
    auth_credentials=weaviate.auth.AuthApiKey(APIKEY),
    headers={
        "X-OpenAI-Api-Key": os.environ[
            "OPENAI_APIKEY"
        ]  # Replace with your inference API key
    },
)

collections = [
    {
        "name": "tender_documents",
        "properties": [
            Property(
                name="tenderId",
                data_type=DataType.TEXT,
            ),
            Property(
                name="source",
                data_type=DataType.TEXT,
            ),
            Property(
                name="page_number",
                data_type=DataType.TEXT,
            ),
            Property(
                name="page_content",
                data_type=DataType.TEXT,
            ),
        ],
    },
    {
        "name": "company_documents",
        "properties": [
            Property(
                name="companyId",
                data_type=DataType.TEXT,
            ),
            Property(
                name="source",
                data_type=DataType.TEXT,
            ),
            Property(
                name="page_number",
                data_type=DataType.TEXT,
            ),
            Property(
                name="page_content",
                data_type=DataType.TEXT,
            ),
        ],
    }
]

try:
    for collection in collections:
        if not client.collections.exists(collection["name"]):
            print(f"Creating {collection['name']} collection")
            client.collections.create(
                name=collection["name"],
                vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_openai(),
                generative_config=wvc.config.Configure.Generative.openai(),
                properties=collection["properties"],
            )
        else:
            print(f"{collection['name']} collection already exists, skipping...")

    print("Collections created successfully")

except Exception as e:
    print(e)
finally:
    client.close()
