
import { Document } from "@langchain/core/documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableMap, RunnablePassthrough } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import weaviate, { ApiKey } from "weaviate-ts-client";


const weaviateClient = (weaviate as any).client({
  scheme: process.env.WEAVIATE_SCHEME || "https",
  host: process.env.WEAVIATE_HOST || "localhost",
  apiKey: new ApiKey(process.env.WEAVIATE_API_KEY || "default"),
});

/**
 * Format the documents into a readable string.
 */
const formatDocs = (input: Record<string, any>): string => {
  const { docs } = input;
  return (
    "\n\n" +
    docs
      .map(
        (doc: Document) =>
          `Tender title: ${doc.metadata.title}\nTender Snippet: ${doc.pageContent}`
      )
      .join("\n\n")
  );
}

// TODO: implement citations https://js.langchain.com/docs/use_cases/question_answering/citations

export const rag = async (publicatie_id: string | undefined = undefined, company_data: boolean = false) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "U bent een QA bot voor Tender aanvragen. Beantwoord de vragen van de gebruiker over tenders, als u het niet weet dan kunt u antwoorden dat u het niet weet.\n\n Dit is relevante tender informatie:{context}."
    ],
    ["human", "{question}"],
  ]);

  //  # generate prompt based on documents and refactored_question
  // prompt = gen_prompt(docs, query=query)

  // const store = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
  //   client: weaviateClient,
  //   indexName: "Test",
  //   metadataKeys: ["foo"],
  // });

  // // only do rag for docs with this tender
  // // https://weaviate.io/developers/weaviate/api/graphql/filters
  // let filters = undefined
  // if (publicatie_id) {
  //   filters = {
  //     where: {
  //       operator: "Equal",
  //       path: ["foo"],
  //       valueText: "baz",
  //     },
  //   }
  //   // or use operator
  // }

  // const retriever = store.asRetriever({
  //   k: 5,
  //   filter: filters,
  // })

  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    streaming: true,
  });


  const docs = [
    new Document({
      pageContent: `Historische park- en tuinaanleg Berkenbosch, Duinbeek en Westhove Het verrichten van hovenierswerkzaamheden (ook wel groenbeheer en cultuurtechnische werkzaamheden genoemd) op de landgoederen Berkenbosch, Duinbeek en Westhove. De werkzaamheden bestaan voornamelijk uit: • Laanonderhoud; • Snoeiwerk; • Herstel paden; • Onderhoud waterpartijen. Voor de te verrichten hovenierswerkzaamheden zijn per landgoed maatregelen opgesteld. 1. Historische park- en tuinaanleg Berkenbosch: ca. 22 ha 2. Historische park- en tuin aanleg Duinbeek: ca. 9 ha 3. Historische park- en tuinaanleg Westhove: ca. 23 ha`,
      metadata: {
        title: 'Tender1'
      }
    })
  ]

  // subchain for generating an answer once we've done retrieval
  const answerChain = prompt.pipe(llm).pipe(new StringOutputParser());


  const map = RunnableMap.from({
    question: new RunnablePassthrough(),
    docs: () => docs // TODO: retriever,
  });
  // complete chain that calls the retriever -> formats docs to string -> runs answer subchain -> returns just the answer and retrieved docs.
  const chain = map
    .assign({ context: formatDocs })
    .assign({ answer: answerChain })
    .pick(["answer", "docs"]);

  return chain

}