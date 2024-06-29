
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableMap, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { WeaviateStore } from "@langchain/weaviate";
import weaviate, { ApiKey } from "weaviate-ts-client";
import { Message } from "../chat/actions";
import { formatDocumentsAsString } from "langchain/util/document";

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

  // console.log(docs)
  const uniqueDocs = [...new Map(docs.map(d =>
    [`${d.metadata.page_number}-${d.metadata.tenderId}-${d.metadata.source}`, d])).values()];

  const context =
    "\n\n" +
    uniqueDocs
      .map(
        (doc: Document) =>
          `Tender titel: ${doc.metadata.tenderId}, bron: ${doc.metadata.source}, pagina: ${doc.metadata.page_number}\nTender tekst:\n ${doc.metadata.page_content}`
      )
      .join("\n\n")

  return context
}

// TODO: implement citations https://js.langchain.com/docs/use_cases/question_answering/citations
// TODO: chat history https://langchain.com/docs/use_cases/question_answering/chat_history/
export const rag = async (chat_history: Message[], tenderId: string | undefined = undefined, documentId: string | undefined, company_data: boolean = false) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `${tenderId ? `Dit is een vraag over een specifieke tender van de gebruiker met id ${tenderId}. Beantwoord deze vraag met de context die hieronder gegeven wordt, dit zijn documenten die geüpload zijn bij deze tender` : `U bent een QA bot voor Tender aanvragen voor de nederlandse markt`}.
      \n\n
      Dit is relevante tender informatie: {context}.
      \n\n
      Als je informatie opsomt, gebruik dan bullets points. Als je het antwoord niet weet, vraag de gebruiker dan om de vraag te herformuleren.
      `
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  console.error(tenderId, documentId)

  // const history_mapped_to_langchain = chat_history.map((m) => {
  //   if (m.role == "user") return new HumanMessage({ content: m.content })
  //   if (m.role == "assistant" || m.role == "system") return new AIMessage({ content: m.content })
  //   return new AIMessage({ content: m.content })
  // })

  // console.log(history_mapped_to_langchain)


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
    k: documentId ? 1 : tenderId ? 12 : 12,
    filter: filters,
    verbose: true,
    // verbose: true,
    // searchKwargs: {
    //   lambda: 1,
    //   fetchK: documentId ? 1 : tenderId ? 10 : 10,
    // },
  })

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    streaming: true,
  });

  const contextualizeQSystemPrompt = `Given a chat history and the latest user question
    which might reference context in the chat history, formulate a standalone question
    which can be understood without the chat history. Do NOT answer the question,
    just reformulate it if needed and otherwise return it as is.`;

  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);
  const contextualizeQChain = contextualizeQPrompt
    .pipe(llm)
    .pipe(new StringOutputParser());

  const contextualizedQuestion = (input: Record<string, unknown>) => {
    if ("chat_history" in input) {
      return contextualizeQChain;
    }
    return input.question;
  };

  const chain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => {
        let res = ""
        if ("chat_history" in input) {
          const hchain = contextualizedQuestion(input);
          res += hchain.pipe(retriever).pipe(formatDocumentsAsString);
        }

        res = "\n\n" + formatDocs(input.context)

        return res
      }
    }),
    prompt,
    llm,
    new StringOutputParser()
  ])

  let ragChainWithSource = new RunnableMap({
    steps: { context: retriever, question: new RunnablePassthrough() },
  });
  ragChainWithSource = ragChainWithSource.assign({ answer: chain });

  return ragChainWithSource

}