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

vector_store = Weaviate(
    client = client,
    index_name = "Tender_documents",
    text_key = "page_content",
)


metadata_field_info = [
    AttributeInfo(
        name="tenderId",
        description="Id van een tender. Hiermee kan de tender worden opgevraagd.",
        type="string",
    ),
    AttributeInfo(
        name="source",
        description="De bron van de tender",
        type="string",
    ),
    AttributeInfo(
        name="page_number",
        description="Het paginanummer van de tender",
        type="string",
    ),
]
document_content_description = "Een tender document met informatie over de tender"

llm = OpenAI(temperature=0)
retriever = SelfQueryRetriever.from_llm(
    llm, vector_store, document_content_description, metadata_field_info = [], verbose=True
)

results = retriever.invoke("Personen voertuigen", score=True)
print(results)

print([result.metadata.get("tenderId") for result in results])
print([result.metadata.get("source") for result in results])