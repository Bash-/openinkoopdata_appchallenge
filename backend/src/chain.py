import os
from operator import itemgetter
from typing import List

from langchain.callbacks import AsyncIteratorCallbackHandler
from langchain.chains.question_answering import load_qa_chain
from langchain.output_parsers.openai_tools import JsonOutputKeyToolsParser
from langchain_community.chat_models import ChatOpenAI
from langchain_community.retrievers import WikipediaRetriever
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import (RunnableLambda, RunnableParallel,
                                      RunnablePassthrough)
from langchain_openai import ChatOpenAI


def get_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You're a helpful AI assistant Given a user question and some Wikipedia article snippets, answer the user question. If none of the articles answer the question, just say you don't know.\n\nHere are the Wikipedia articles:{context}. "
            ),
            ("human", "{question}"),
        ]
    )


def format_docs(docs: List[Document]) -> str:
    """Convert Documents to a single string.:"""
    formatted = [
        f"Article Title: {doc.metadata['title']}\nArticle Snippet: {doc.page_content}"
        for doc in docs
    ]
    return "\n\n" + "\n\n".join(formatted)


def get_chain(model_callback, model_name="gpt-3.5-turbo") -> RunnableParallel:
    """Enable a chain with a AsyncCallback for streaming support

    Currently based on https://python.langchain.com/docs/use_cases/question_answering/citations/

    Args:
        model_callback (Callback): use
        model_name (str, optional): Langchain model to use. Defaults to "gpt-3.5-turbo".

    Returns:
        RunnableParallel: A chain we can run
    """
    # https://python.langchain.com/docs/use_cases/question_answering/citations/
    # To enable streaming, we pass in `streaming=True` to the ChatModel constructor
    llm = ChatOpenAI(
        model_name=model_name,
        streaming=True,
        verbose=True,
        callbacks=[model_callback],
    )

    prompt = get_prompt()

    format = itemgetter("docs") | RunnableLambda(format_docs)

    answer = prompt | llm | StrOutputParser()
    chain = (
        RunnableParallel(question=RunnablePassthrough(), docs=lambda x: [])
        .assign(context=format)
        .assign(answer=answer)
        .pick(["answer", "docs"])
    )

    return chain
