from dotenv import load_dotenv
import os
from langchain_community.document_loaders import PyPDFLoader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

_ = load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
FOLDER_PATH = "/Users/martijnbeeks/Downloads/data_local/raw/documents/332475/"
CHROMA_PATH = "../chroma"

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

for file in os.listdir(FOLDER_PATH):
    if file.split(".")[-1] == "pdf":
        loader = PyPDFLoader(FOLDER_PATH + "/" + file)
        pages = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(pages)
        db_chroma = Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_PATH)
        print(f"Chroma for {file} has been saved to {CHROMA_PATH}")
