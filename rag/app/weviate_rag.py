import weaviate
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain.vectorstores.weaviate import Weaviate
from langchain.llms import OpenAI
from langchain.chains import ChatVectorDBChain
import os

from dotenv import load_dotenv

_ = load_dotenv()

WEAVIATE_URL = os.getenv('WCS_URL')
WEAVIATE_API_KEY = os.getenv('WCS_API_KEY')





client = weaviate.Client(
    url=WEAVIATE_URL, auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY)
)

def get_schema(client: weaviate.Client):
    # Retrieve the schema
    schema = client.schema.get()

    # Extract the classes (tables) and their properties (fields)
    classes = schema['classes']

    # Iterate over the classes and print their names and properties
    for class_item in classes:
        class_name = class_item['class']
        properties = class_item.get('properties', [])
        print(f"Class: {class_name}")
        print("Properties:")
        for property_item in properties:
            property_name = property_item['name']
            print(f" - {property_name}")

        print()  # Add a newline for readability


def get_documents(client: weaviate.Client):

    class_name = "Tender_documents"

    # Retrieve the metadata of the class
    class_metadata = client.data_object.get(class_name)

    # Extract the number of documents from the metadata
    number_of_documents = class_metadata['totalResults']

    print(f"Number of documents in '{class_name}': {number_of_documents}")


# get_documents(client)
# schema = client.schema.get()
# print(schema)
# print(client.data_object.get("Company_documents"))
# Retrieve the schema
print(client.query.aggregate("Tender_documents").with_meta_count().do())
get_schema(client)

print(client.query.get("Tender_documents", ["tenderId", "page_number"]).do())