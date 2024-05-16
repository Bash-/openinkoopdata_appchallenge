
import { Document } from "@langchain/core/documents";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { WeaviateStore } from "@langchain/weaviate";
import weaviate, { ApiKey } from "weaviate-ts-client";
import { Message } from "../chat/actions";

const weaviateClient = (weaviate as any).client({
  scheme: process.env.WEAVIATE_SCHEME || "https",
  host: process.env.WEAVIATE_HOST || "localhost",
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY || "default"),
  headers: {
    'X-Openai-Api-Key': process.env.OPENAI_API_KEY
  }
});

/**
 * Format the documents into a readable string.
 */
const formatDocs = (docs: Document[]): string => {

  const uniqueDocs = [...new Map(docs.map(d =>
    [`${d.metadata.page_number}-${d.metadata.tenderId}-${d.metadata.source}`, d])).values()];

  return (
    "\n\n" +
    uniqueDocs
      .map(
        (doc: Document) =>
          `Tender titel: ${doc.metadata.tenderId}, bron: ${doc.metadata.source}, pagina: ${doc.metadata.page_number}\nTender Snippet:\n ${doc.pageContent}`
      )
      .join("\n\n")
  );
}


// TODO: implement citations https://js.langchain.com/docs/use_cases/question_answering/citations
// TODO: chat history https://langchain.com/docs/use_cases/question_answering/chat_history/
export const rag = async (chat_history: Message[], tenderId: string | undefined = undefined, documentId: string | undefined, company_data: boolean = false) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `U bent een QA bot voor Tender aanvragen voor de nederlandse markt.
      Beantwoord de vragen van de gebruiker over tenders, als er specifieke tender ids worden genoemd in de vraag, dan kunt u de context gebruiken.
      HARDE EISEN voor het antwoorden:
      - Geef naast het noemen van een bron ook altijd antwoord op de vraag, noem niet alleen de bron
      - Als u verwijst naar informatie van de Rijksoverheid, maak dit dan expliciet.
      \n\n
      Dit is relevante tender informatie: {context}
      `
    ],
    // new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  const history_mapped_to_langchain = chat_history.map((m) => {
    if (m.role == "user") return new HumanMessage(m.content)
    if (m.role == "assistant" || m.role == "system") return new AIMessage(m.content)
    return new AIMessage(m.content)
  })

  // better modelling: https://forum.weaviate.io/t/return-unique-file-when-search-large-documents/163/2
  // const response = await weaviateClient.graphql
  //   .get()
  //   .withClassName('Tender_documents')
  //   .withFields('page_content tenderId _additional { score }')
  //   .withHybrid({ query: '335932', targetVectors: ['tenderId', 'page_content',] })
  //   .withLimit(2)
  //   .do();

  // console.log(JSON.stringify(response, null, 2)); -> map to docs interface

  const store = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
    client: weaviateClient,
    indexName: "Tender_documents",
    textKey: "page_content tenderId",
    metadataKeys: ["source", "tenderId", "page_number",],
  });


  // // only do rag for docs with this tender
  // // https://weaviate.io/developers/weaviate/api/graphql/filters
  let filters = undefined
  if (tenderId) {
    filters = {
      where: {
        operator: "Equal",
        path: ["tenderId"],
        valueText: tenderId,
      },
    }
  }
  if (documentId) {
    filters = {
      operator: 'And',
      operands: [
        {
          operator: "Equal",
          path: ["tenderId"],
          valueText: tenderId,
        },
        {
          operator: "Equal",
          path: ["source"],
          valueText: documentId
        }
      ]
    }
  }


  const retriever = store.asRetriever({
    k: documentId ? 1 : tenderId ? 5 : 10,
    searchType: "mmr",
    filter: filters,
    verbose: true,
    searchKwargs: {
      lambda: 0.1,
      fetchK: documentId ? 1 : tenderId ? 100 : 10,
    },
  })

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    streaming: true,
  });


  const chain = RunnableSequence.from([
    { context: retriever.pipe(formatDocs), question: new RunnablePassthrough() },
    prompt,
    llm,
    new StringOutputParser()
  ]).pick([
    "answer", "docs"
  ]);

  return chain

}