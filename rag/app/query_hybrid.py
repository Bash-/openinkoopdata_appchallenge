import os, openai, weaviate, logging
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Weaviate
from langchain_openai import OpenAI
from langchain.chains import ChatVectorDBChain
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import AttributeInfo
from langchain.retrievers.self_query.weaviate import WeaviateTranslator
from langchain_community.retrievers import (
    WeaviateHybridSearchRetriever,
)

from dotenv import load_dotenv

_ = load_dotenv()

WEAVIATE_URL = os.getenv('WCS_URL')
WEAVIATE_API_KEY = os.getenv('WCS_API_KEY')
OPENAI_APIKEY = os.getenv('OPENAI_API_KEY')
openai.api_key = os.environ['OPENAI_API_KEY']

embeddings = OpenAIEmbeddings()

client = weaviate.Client(
    url=WEAVIATE_URL, auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY),
    additional_headers = {
        "X-OpenAI-Api-Key": openai.api_key
    }
)

retriever = WeaviateHybridSearchRetriever(
    client=client,
    index_name="Tender_documents",
    text_key="page_content",
    attributes=["tenderId", "source", "page_number"],
    create_schema_if_missing=True,
)

results = retriever.invoke("Welke tenders zijn er voor het leveren van personenvoertuigen?", score=True)
print(results)
print([result.metadata.get("tenderId") for result in results])
print([result.metadata.get("source") for result in results])