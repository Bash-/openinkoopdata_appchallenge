import os
from dotenv import load_dotenv
from langchain.chains.combine_documents.base import BaseCombineDocumentsChain

from langchain_openai import OpenAIEmbeddings
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import Chroma

_ = load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
DB_DIR = os.getenv("DB_DIR")

def create_agent_chain(model_name: str = "gpt-3.5-turbo") -> BaseCombineDocumentsChain:
    """
    Create a chain of agents
    :return:
        Chain of agents
    """
    llm = ChatOpenAI(model_name=model_name)
    chain = load_qa_chain(llm, chain_type="stuff")
    return chain


def get_llm_response(query, k=4) -> str:
    """
    Get a response from the LLM by querying the vectorstore
    :param
    query: str
        Query to the LLM

    :return:
    answer: str
        Answer from the LLM
    """
    vectordb = Chroma(persist_directory=DB_DIR, embedding_function=OpenAIEmbeddings())
    chain = create_agent_chain()
    matching_docs = vectordb.similarity_search(query, k=k)
    print(f"Related documents: {[doc.metadata for doc in matching_docs]}")

    answer = chain.run(input_documents=matching_docs, question=query)
    return answer


print(get_llm_response("Zijn er tenders waar ik leermiddelen kan leveren?"))
