import json
import os

import psycopg2
import requests
import weaviate
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader
from weaviate.classes.query import Filter

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






from weaviate.classes.query import Filter

collection = client.collections.get("Tender_documents_german")
response = collection.query.fetch_objects(
    filters=Filter.by_property("tenderId").equal("CXS7YYXYTDVZJ6UT"),
    limit=1000
)

# collection.data.delete_many(
#     where=Filter.by_property("tenderId").like("CXPSYYFDSTQ")
# )
result = []
for o in response.objects:
    result.append(o.properties.get("source"))
    print(o.properties.get("source"))
    
print(f"Unique sources: {set(result)}")