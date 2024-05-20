from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import weaviate
import os
from dotenv import load_dotenv

load_dotenv()
  
# Set these environment variables
URL = os.getenv("WCS_URL")
APIKEY = os.getenv("WCS_API_KEY")
  
# Connect to a WCS instance
client = weaviate.connect_to_wcs(
    cluster_url=URL,
    auth_credentials=weaviate.auth.AuthApiKey(APIKEY),
    headers={
        "X-OpenAI-Api-Key": os.environ["OPENAI_APIKEY"]  # Replace with your inference API key
    }
)

def insert_to_vectordb(pdf_folder_path, tenderId: str) -> None:
    """
    Load pdfs from a folder, chunk them and persist them in the Weaviate Vector store
    :param
    pdf_folder_path: str
        Path to the folder with pdfs
    :return:
        None
    """
    print(f"Inserting documents to Weaviate for tenderId: {tenderId}")
    
    documents = []
    for dirName, subdirList, fileList in os.walk(pdf_folder_path):
        print(f"Found directory: {dirName}")
        for fname in fileList:
            if fname.endswith('.pdf'):
                print(f" \t Found file {fname}")
                pdf_path = os.path.join(pdf_folder_path, fname)
                loader = PyPDFLoader(pdf_path)
                documents.extend(loader.load())
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=10)
    documents = text_splitter.split_documents(documents)
    
    collection = client.collections.get("Tender_documents")

    # Batch upload all documents to Weaviate
    with collection.batch.dynamic() as batch:
        for document in documents:
            if batch.number_errors > 0:
                print("Batch failed")
                break
            
            source = document.metadata["source"].split("/")[-1]
            properties = {
                "tenderId": tenderId,
                "source": source,
                "page_number": str(document.metadata["page"]),
                "page_content": document.page_content,
            }

            batch.add_object(
                properties=properties
            )
    if len(collection.batch.failed_objects) > 0:
        print("Batch failed")
        print(collection.batch.failed_objects[0].message)
    else:
        print("Batch uploaded successfully")