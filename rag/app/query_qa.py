import os, openai, weaviate, logging
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Weaviate
from langchain_openai import OpenAI
from langchain.chains import ChatVectorDBChain

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


MyOpenAI = OpenAI(temperature=0.2,
    openai_api_key=OPENAI_APIKEY)

qa = ChatVectorDBChain.from_llm(MyOpenAI, vector_store)

chat_history = []

while True:
    query = input("")
    result = qa({"question": query, "chat_history": chat_history})
    print(result)
    print(result["answer"])
    chat_history = [(query, result["answer"])]