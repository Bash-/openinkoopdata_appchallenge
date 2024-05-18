from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_openai import OpenAI
import os
import weaviate
from langchain_community.vectorstores import Weaviate

from dotenv import load_dotenv
_ = load_dotenv()

WEAVIATE_URL = os.getenv('WCS_URL')
WEAVIATE_API_KEY = os.getenv('WCS_API_KEY')
OPENAI_APIKEY = os.getenv('OPENAI_API_KEY')


# Build history aware retriever
contextualize_q_system_prompt = """Gegeven een chatgeschiedenis en de laatste vraag van de gebruiker, die mogelijk verwijst naar context in de chatgeschiedenis, formuleer een op zichzelf staande vraag die begrepen kan worden zonder de chatgeschiedenis. Beantwoord de vraag niet, formuleer deze alleen opnieuw indien nodig en anders retourneer deze zoals deze is."""
contextualize_q_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

llm = OpenAI(temperature=0.2, openai_api_key=OPENAI_APIKEY)

client = weaviate.Client(
    url=WEAVIATE_URL, auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY),
    additional_headers = {"X-OpenAI-Api-Key": OPENAI_APIKEY}
)

retriever = Weaviate(
    client = client,
    index_name = "Tender_documents",
    text_key = "page_content",
).as_retriever()

history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_q_prompt
)

# Build question answering chain
qa_system_prompt = """U bent een QA bot voor Tender aanvragen voor de Nederlandse markt. Beantwoord de vragen van de gebruiker over tenders. Als er specifieke tender-IDs worden genoemd in de vraag, dan kunt u de context gebruiken. HARDE EISEN voor het antwoorden: - Geef naast het noemen van een bron ook altijd antwoord op de vraag, noem niet alleen de bron - Als u verwijst naar informatie van de Rijksoverheid, maak dit dan expliciet. Dit is relevante tenderinformatie: {context}"""

qa_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ]
)

question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)


# Make a chatbot
chat_history = []
while True:
    query = input("")
    result = rag_chain.invoke({"input": query, "chat_history": chat_history})
    print(result)
    print(result["answer"])
    chat_history = [("human", query), (result["answer"])]

