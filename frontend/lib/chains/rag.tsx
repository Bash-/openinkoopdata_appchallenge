
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { WeaviateStore } from "@langchain/weaviate";
import weaviate, { ApiKey } from "weaviate-ts-client";
import { Message } from "../chat/actions";
import { wrapAISDKModel } from "langsmith/wrappers/vercel";
import { openai } from "@ai-sdk/openai";

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


  console.log(uniqueDocs)

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
export const rag = async (question: string, chat_history: Message[], tenderId: string | undefined = undefined, documentIds: string[] | undefined, company_data: boolean = false) => {

  let tags: any[] = []
  if (documentIds) {
    tags = [...tags, "document", documentIds.join(",")]
  }
  if (tenderId) {
    tags = [...tags, "tender", tenderId]
  }

  const vercelModel = openai("gpt-4o-2024-08-06");
  const modelWithTracing = wrapAISDKModel(vercelModel);

  const llm = new ChatOpenAI({
    model: modelWithTracing,
    streaming: true,
  }).withConfig({
    tags: tags,
    metadata: {
      tenderId,
      documentIds,
    }
  });

  // ============ Chat History Chain ============

  const contextualizeQSystemPrompt = `
        U bent gespecialiseerd in tender aanvragen voor de nederlandse markt.
        Gegeven is een chatgeschiedenis en de laatste gebruikers prompt.
        Herschrijf de gebruikers prompt kort en bondig om de duidelijkheid en nauwkeurigheid te verbeteren
        Deze prompt wordt gebruikt om relevante documenten te vinden passend bij de gebruikers prompt.
        Herformuleer de prompt indien nodig en geef ALTIJD een prompt terug.`;

  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ["system", contextualizeQSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);
  const contextualizeQChain = contextualizeQPrompt
    .pipe(llm)
    .pipe(new StringOutputParser());

  // ============ QA Chain ============

  const qaSystemPrompt = `
      ${tenderId ? `Dit is een vraag van de gebruiker over een specifieke tender of over rijksdocumenten die gaan over aanbestedingen van het rijk, het heeft het id ${tenderId}.`
         : `U bent een QA bot voor Tender aanvragen voor de nederlandse markt. Dit is een vraag van de gebruiker over een specifieke tender of over rijksdocumenten die gaan over aanbestedingen van het rijk`}.
      Beantwoord deze vraag met de context die hieronder gegeven wordt, dit zijn teksten uit de documenten.
      
      \n\n

      Dit is relevante informatie: {context}.
      \n\n
      Als je het antwoord niet weet, vraag de gebruiker dan om de vraag te herformuleren.
      Probeer het antwoord zo uitgebreid mogelijk te geven en verwijs naar de bronbestanden met pagina nummers waar dat kan.
    `

  const qaPrompt = ChatPromptTemplate.fromMessages([
    ["system", qaSystemPrompt],
    ["human", "{contextualizedQuestion}"],
  ]);

  // ============ RAG Chain ============

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
  let filters: any = {
    where: {
      operator: 'And',
      operands: [
        {
          operator: "Or",
          operands: []
        }
      ]
    },
  }

  if (tenderId) {
    filters.where.operands[0].operands.push({
      operator: "Equal",
      path: ["tenderId"],
      valueText: tenderId,
    })
  }

  if (question && typeof question === 'string' && question.toLowerCase().includes("rijksvoorwaarden")) {
    filters.where.operands[0].operands.push({
      operator: "Equal",
      path: ["tenderId"],
      valueText: "rijksvoorwaarden",
    })
  }


  if (question && typeof question === 'string' && question.toLowerCase().includes("categorie")) {
    filters.where.operands[0].operands.push({
      operator: "Equal",
      path: ["tenderId"],
      valueText: "categorieplannen",
    })
  }

  if (documentIds && documentIds.length > 0) {
    filters = {
      where: {
        operator: 'And',
        operands: [
          {
            operator: "Equal",
            path: ["tenderId"],
            valueText: tenderId,
          },
          {
            operator: 'Or', // Use 'Or' to match any of the documentIds
            operands: documentIds.map((docId) => ({
              operator: "Equal",
              path: ["source"],
              valueText: docId,
            })),
          },
        ]
      }
    }
  }

  // TODO multiple RAG runs based on keywords

  const retriever = store.asRetriever({
    // tenderId && documentIds?.length > 0 ? documentIds?.length : 
    k: 12,
    filter: filters,
    searchKwargs: {
      lambda: 0,
    },
  })

  let contextualizedQuestionRunnable = RunnablePassthrough.assign({
    contextualizedQuestion: (input: Record<string, unknown>) => {
      if ("chat_history" in input) {
        return contextualizeQChain;
      }
      return input.question;
    }
  })

  let retrieverRunnable = RunnablePassthrough.assign({
    sourceDocuments: (input: Record<string, unknown>) => {
      return process.env.NODE_ENV === 'development' ? [] : retriever._getRelevantDocuments(input.question)
    }
  })

  let docRunnable = RunnablePassthrough.assign({
    context: (input: Record<string, unknown>) => {
      if ("sourceDocuments" in input) {
        return formatDocs(input.sourceDocuments);
      }
      return "";
    }
  })

  const answerChain = RunnableSequence.from([
    docRunnable,
    qaPrompt,
    llm
  ]).withConfig({
    tags: tags,
    metadata: {
      tenderId,
      documentIds,
    }
  })

  let ragChainWithSource = contextualizedQuestionRunnable.pipe(retrieverRunnable).assign({ answer: answerChain });

  return ragChainWithSource
}