from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings


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
    
import os


def store_documents_as_txt(tenderId: str) -> None:
    """
    Load pdfs from a folder, chunk them and persist them in the Weaviate Vector store
    :param
    pdf_folder_path: str
        Path to the folder with pdfs
    :return:
        None
    """
    pdf_folder_path = f"./data_local/raw/documents/{tenderId}/"
    documents = []
    for dirName, subdirList, fileList in os.walk(pdf_folder_path):
        print(f"Found directory: {dirName}")
        for fname in fileList:
            if fname.endswith('.pdf'):
                print(f" \t Save {fname} with embedding to vectorstore")
                pdf_path = os.path.join(pdf_folder_path, fname)
                loader = PyPDFLoader(pdf_path)
                documents.extend(loader.load())
    
    print(documents[0])
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    documents = text_splitter.split_documents(documents)
    
    texts = [d.page_content for d in documents]
    metadatas = [d.metadata for d in documents]
    print(texts[0])
    print(metadatas[0])
    # client.data.create(documents)
    
    
    embedding = OpenAIEmbeddings(openai_api_key=os.environ["OPENAI_APIKEY"])

    # Generate vector embeddings
    embeddings = embedding.embed_documents(texts) if embedding else None
    attributes = list(metadatas[0].keys()) if metadatas else None
    # print(embeddings[0])

    # Batch upload all of your text to Weaviate
    with client.batch.dynamic() as batch:
        # Iteratively upload each text
        for i, document in enumerate(documents):
            source = metadatas[i]["source"].split("/")[-1]
            properties = {
                "tenderId": tenderId,
                "source": source,
                "page_number": document.metadata["page"],
            }

            custom_vector =  embeddings[i]
            batch.add_object(
                properties=properties,
                collection="Tender_documents",
                vector=custom_vector
            )
    
    return documents

try:
    # print(store_documents_as_txt("331522"))
    query = f"Wie betaalt de kosten van breuk op intellectueel eigendom?"
    questions = client.collections.get("Tender_documents")
    response = questions.generate.bm25(
        query=query,
        limit=2,
        # single_prompt="Translate the following into French: {answer}"
    )

    print(response.generated)  # Generated text from grouped task
    for o in response.objects:
        print(o.generated)  # Generated text from single prompt
        print(o.properties)  # Object properties
except Exception as e:
    print(e)
finally:
    client.close()

