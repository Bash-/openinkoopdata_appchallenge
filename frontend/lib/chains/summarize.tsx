import { PromptTemplate } from "@langchain/core/prompts";
import { loadSummarizationChain } from "langchain/chains";
import { TokenTextSplitter } from "langchain/text_splitter";

import { Document } from "@langchain/core/documents";
import { OpenAI } from "@langchain/openai";


const summaryTemplate = `
Je bent een expert in het samenvatten van aanbestedingen van Tendernet.
{text}
Het transcript van de aanbestedingsdocumenten zal ook worden gebruikt als basis voor een vraag- en antwoordbot.
Geef enkele mogelijke veelgestelde vragen en antwoorden die gesteld kunnen worden over de aanbesteding. Maak deze vragen zeer specifiek.

Het totale resultaat zal een samenvatting van de aanbesteding zijn en een lijst met voorbeeldvragen die gebruikers kunnen stellen over de aanbestedingen.

SAMENVATTING EN VRAGEN:
`;

const SUMMARY_PROMPT = PromptTemplate.fromTemplate(summaryTemplate);

const summaryRefineTemplate = `
Je bent een expert in het samenvatten van aanbestedingen.
Je doel is om een samenvatting van een aanbesteding te maken uit vele documenten die opgeleverd zijn.
We hebben een bestaande samenvatting gegeven tot een bepaald punt: {existing_answer}

Hieronder vind je het transcript van de aanbestedingen:
{text}
Gegeven de nieuwe context, verfijn de samenvatting en voorbeeldvragen.
Het transcript van de aanbesteding zal ook worden gebruikt als basis voor een vraag- en antwoordbot.
Geef enkele voorbeeldvragen en antwoorden die gesteld kunnen worden over de aanbesteding. Maak
deze vragen zeer specifiek.
Als de context niet nuttig is, geef dan de oorspronkelijke samenvatting en vragen terug.
Het totale resultaat zal een samenvatting van de aanbesteding zijn en een lijst met voorbeeldvragen die de gebruiker over de aanbesteding kan stellen.

SAMENVATTING EN VRAGEN:
`;

const SUMMARY_REFINE_PROMPT = PromptTemplate.fromTemplate(
  summaryRefineTemplate
);

export const summarize = async (docs: Document[]) => {
  const model = new OpenAI({
    model: "gpt-3.5-turbo-instruct",
    temperature: 0.9,
  });

  const splitter = new TokenTextSplitter({
    chunkSize: 10000,
    chunkOverlap: 250,
  });

  const docsSummary = await splitter.splitDocuments(docs);
  const summarizeChain = loadSummarizationChain(model, {
    type: "refine",
    verbose: true,
    questionPrompt: SUMMARY_PROMPT,
    refinePrompt: SUMMARY_REFINE_PROMPT,
  });

  const summary = await summarizeChain.invoke({
    input_documents: docsSummary,
    metadata: {
      refinePrompt: SUMMARY_REFINE_PROMPT,
      questionPrompt: SUMMARY_PROMPT,
      docs: docs.map((d) => d.metadata?.id),
    }
  });

  return summary["output_text"]

}

