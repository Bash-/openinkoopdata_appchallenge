
import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma
import chromadb

_ = load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


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
    for file in os.listdir(pdf_folder_path):
        if file.endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder_path, file)
            loader = PyPDFLoader(pdf_path)
            documents.extend(loader.load())
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=10)
    chunked_documents = text_splitter.split_documents(documents)
    client = chromadb.Client()
    if client.list_collections():
        consent_collection = client.create_collection("consent_collection")
    vectordb = Chroma.from_documents(
        documents=chunked_documents,
        embedding=OpenAIEmbeddings(),
        persist_directory="./rag/data_local/chroma/"
    )
    vectordb.persist()
    return vectordb

def create_agent_chain(model_name: str = "gpt-3.5-turbo"):
    """
    Create a chain of agents
    :return:
        Chain of agents
    """
    llm = ChatOpenAI(model_name=model_name)
    chain = load_qa_chain(llm, chain_type="stuff")
    return chain


def get_llm_response(query):
    """
    Get a response from the LLM by querying the vectorstore
    :param
    query: str
        Query to the LLM

    :return:
    answer: str
        Answer from the LLM
    """
    vectordb = Chroma(persist_directory=os.environ.get("DB_DIR"), embedding_function=OpenAIEmbeddings())
    chain = create_agent_chain()
    matching_docs = vectordb.similarity_search(query)
    print([doc.metadata for doc in matching_docs])

    answer = chain.run(input_documents=matching_docs, question=query)
    return answer


print(get_llm_response("Zijn er tenders waar ik leermiddelen kan leveren?"))
