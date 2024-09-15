from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
import os
import weaviate
from langchain_community.vectorstores import Weaviate
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv


def get_rag_chain():
    """
    Create a RAG pipeline for a specific tenderId and query
    :param tenderId:
    :param query:
    :return:


    Use like this:
    chat_history = []
    result = rag_chain.invoke({"input": query, "chat_history": chat_history, "tenderId": tenderId})
    """
    load_dotenv()

    WEAVIATE_URL = os.getenv("WEAVIATE_HOST")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
    OPENAI_APIKEY = os.getenv("OPENAI_API_KEY")

    # Build history aware retriever
    contextualize_q_system_prompt = """
    U bent gespecialiseerd in tender aanvragen voor de nederlandse markt.
    Gegeven is een chatgeschiedenis en de laatste gebruikers prompt.
    Herschrijf de gebruikers prompt kort en bondig om de duidelijkheid en nauwkeurigheid te verbeteren
    Deze prompt wordt gebruikt om relevante documenten te vinden passend bij de gebruikers prompt.
    Herformuleer de prompt indien nodig en geef ALTIJD een prompt terug.
    """

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    llm = ChatOpenAI(
        temperature=0.2, openai_api_key=OPENAI_APIKEY, model="gpt-4o-2024-08-06"
    )

    client = weaviate.Client(
        url=WEAVIATE_URL,
        auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY),
        additional_headers={"X-OpenAI-Api-Key": OPENAI_APIKEY},
    )

    where_filter = {"path": ["tenderId"], "operator": "Equal", "valueText": "pianoo"}

    retriever = Weaviate(
        client=client,
        index_name="Tender_documents",
        text_key="page_content",
    ).as_retriever(filter=where_filter)

    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    # Build question answering chain
    qa_system_prompt = """
    
    Dit is een vraag van de gebruiker over een specifieke tender of over rijksdocumenten die gaan over aanbestedingen van het rijk, het heeft het id ${tenderId}. 
    U bent een QA bot voor Tender aanvragen voor de nederlandse markt. Dit is een vraag van de gebruiker over een specifieke tender of over rijksdocumenten die gaan over aanbestedingen van het rijk.
    Beantwoord deze vraag met de context die hieronder gegeven wordt, dit zijn teksten uit de documenten.
    
    \n\n
    
    Dit is relevante informatie: {context}.
    \n\n
    Als je het antwoord niet weet, vraag de gebruiker dan om de vraag te herformuleren.
    Probeer het antwoord zo uitgebreid mogelijk te geven en verwijs naar de bronbestanden met pagina nummers waar dat kan.
    Geef geen antwoord als het niet binnen de context past.
    
    """

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    return rag_chain
