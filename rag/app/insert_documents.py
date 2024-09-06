import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb

_ = load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_DIR = os.getenv("DB_DIR")


def load_chunk_persist_pdf(pdf_folder_path) -> Chroma:
    """
    Load pdfs from a folder, chunk them and persist them in a vectorstore
    :param
    pdf_folder_path: str
        Path to the folder with pdfs
    :return:
        Chroma client
    """
    documents = []
    for dirName, subdirList, fileList in os.walk(pdf_folder_path):
        print(f"Found directory: {dirName}")
        for fname in fileList:
            if fname.endswith(".pdf"):
                print(f" \t Save {fname} with embedding to vectorstore")
                pdf_path = os.path.join(pdf_folder_path, fname)
                loader = PyPDFLoader(pdf_path)
                documents.extend(loader.load())
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=10)
    chunked_documents = text_splitter.split_documents(documents)

    # Create collection of not existing.
    client = chromadb.Client()
    if client.list_collections():
        consent_collection = client.create_collection("consent_collection")
    vectordb = Chroma.from_documents(
        documents=chunked_documents,
        embedding=OpenAIEmbeddings(),
        persist_directory="./rag/data_local/chroma/",
    )
    vectordb.persist()
    return None


load_chunk_persist_pdf("./datapipeline/data_local/raw/documents/332427/")
