from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import weaviate
import os
from dotenv import load_dotenv
import psycopg2
import requests
from weaviate.classes.query import Filter
import json

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


def insert_to_vectordb(folder_path, tenderId: str) -> None:
    """
    Load files from a folder, chunk them and persist them in the Weaviate Vector store
    :param
    folder_path: str
        Path to the folder with files
    :return:
        None
    """
    print(f"Inserting documents to Weaviate for tenderId: {tenderId}")

    # Check if the tenderId already exists in Weaviate, if so delete the existing documents first
    collection = client.collections.get("Tender_documents")
    deleted = collection.data.delete_many(
        where=(Filter.by_property("tenderId").equal(tenderId) & Filter.by_property("source").not_equal("metadata"))
    )
    print("Deleted existing documents")
    print(deleted)

    documents = []
    for dirName, subdirList, fileList in os.walk(folder_path):
        print(f"Found directory: {dirName}")
        for fname in fileList:
            print(f" \t Found file {fname}")
            file_path = os.path.join(folder_path, fname)
            if fname.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
                documents.extend(loader.load())
            elif fname.endswith(".txt"):
                loader = TextLoader(file_path)
                documents.extend(loader.load())
            elif fname.endswith(".docx"):
                loader = Docx2txtLoader(file_path)
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
                "page_content": document.page_content,
            }

            if document.metadata.get("page"):
                properties["page_number"] = str(document.metadata.get("page"))

            batch.add_object(properties=properties)
    if len(collection.batch.failed_objects) > 0:
        print("Batch failed")
        print(collection.batch.failed_objects[0].message)
    else:
        print("Batch uploaded successfully")


def insert_document_metadata_to_postgres(tenderId: str) -> None:
    """
    Insert the document ids to the Postgres database
    :param
    tenderId: str
        Tender ID
    document_ids: list
        List of document ids
    :return:
        None
    """
    print(f"Inserting document ids to Postgres for tenderId: {tenderId}")

    document_info = requests.get(
        f"https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/{tenderId}/documenten"
    )
    document_info = document_info.json()

    try:
        conn = psycopg2.connect(os.getenv("POSTGRES_CONNECTION_STRING"))
        create_table_query = """
        CREATE TABLE IF NOT EXISTS tenderdocuments
            (
                tenderid TEXT,
                documentid TEXT,
                documentnaam TEXT,
                typedocument TEXT,
                datumpublicatie TEXT,
                gepubliceerddoor TEXT,
                publicatiecategorie TEXT,
                virusindicatie BOOLEAN,
                grootte INT,
                downloadurl TEXT,
                PRIMARY KEY (tenderid, documentid)
            );
        """
        cursor = conn.cursor()
        cursor.execute(create_table_query)

        for document in document_info["documenten"]:
            cursor.execute(
                f"""
                INSERT INTO tenderdocuments (tenderid, documentid, documentnaam, typedocument, datumpublicatie, gepubliceerddoor, publicatiecategorie, virusindicatie, grootte, downloadurl) 
                VALUES ('{tenderId}', '{document['documentId']}', '{document['documentNaam']}', '{document['typeDocument']['omschrijving']}', '{document['datumPublicatie']}', '{document['gepubliceerdDoor']}', '{document['publicatieCategorie']['omschrijving']}', {document['virusIndicatie']}, {document['grootte']}, '{document['links']['download']['href']}')
                ON CONFLICT (tenderid, documentid) DO UPDATE SET
                documentnaam = EXCLUDED.documentnaam,
                typedocument = EXCLUDED.typedocument,
                datumpublicatie = EXCLUDED.datumpublicatie,
                gepubliceerddoor = EXCLUDED.gepubliceerddoor,
                publicatiecategorie = EXCLUDED.publicatiecategorie,
                virusindicatie = EXCLUDED.virusindicatie,
                grootte = EXCLUDED.grootte,
                downloadurl = EXCLUDED.downloadurl
                """
            )

        conn.commit()
    except:
        print("I am unable to connect to the database")
    finally:
        conn.close()

    print("Document ids inserted to Postgres")


def insert_tender_metadata_to_vectordb(tenderId: str, metadata: dict) -> None:
    print(f"Inserting tender metadata to Weaviate for tenderId: {tenderId}")

    collection = client.collections.get("Tender_documents")
    deleted = collection.data.delete_many(
        where=(Filter.by_property("tenderId").equal(tenderId) & Filter.by_property("source").equal("metadata"))
    )
    print("Deleted existing metadata")
    print(deleted)

    # Upload document to Weaviate
    with collection.batch.dynamic() as batch:
        properties = {
            "tenderId": tenderId,
            "source": "metadata",
            "page_content": json.dumps(metadata),
        }
        batch.add_object(properties=properties)
    
    if len(collection.batch.failed_objects) > 0:
        print("Batch failed")
        print(collection.batch.failed_objects[0].message)
    else:
        print("Tender metadata uploaded to Weaviate for tenderId:", tenderId)

