// Load environment variables
require('dotenv').config();
const { OpenAI } = require('langchain');
const { Client, ApiKeyAuth } = require('weaviate-client');
const { ChatPromptTemplate, MessagesPlaceholder, createHistoryAwareRetriever, createRetrievalChain, createStuffDocumentsChain } = require('langchain');

// Environment variables
const WEAVIATE_URL = process.env.WCS_URL;
const WEAVIATE_API_KEY = process.env.WCS_API_KEY;
const OPENAI_APIKEY = process.env.OPENAI_API_KEY;

// Build history aware retriever
const contextualizeQSystemPrompt = `Gegeven een chatgeschiedenis en de laatste vraag van de gebruiker, die mogelijk verwijst naar context in de chatgeschiedenis, formuleer een op zichzelf staande vraag die begrepen kan worden zonder de chatgeschiedenis. Beantwoord de vraag niet, formuleer deze alleen opnieuw indien nodig en anders retourneer deze zoals deze is.`;
const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  { role: 'system', content: contextualizeQSystemPrompt },
  new MessagesPlaceholder('chat_history'),
  { role: 'human', content: '{input}' }
]);

const llm = new OpenAI({
  temperature: 0.2,
  apiKey: OPENAI_APIKEY
});

const client = new Client({
  scheme: 'https',
  host: WEAVIATE_URL.replace('https://', ''),
  headers: {
    'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
    'X-OpenAI-Api-Key': OPENAI_APIKEY
  }
});

const retriever = new Weaviate({
  client,
  indexName: 'Tender_documents',
  textKey: 'page_content'
}).asRetriever();

const historyAwareRetriever = createHistoryAwareRetriever(llm, retriever, contextualizeQPrompt);

// Build question answering chain
const qaSystemPrompt = `U bent een QA bot voor Tender aanvragen voor de Nederlandse markt. Beantwoord de vragen van de gebruiker over tenders. Als er specifieke tender-IDs worden genoemd in de vraag, dan kunt u de context gebruiken. HARDE EISEN voor het antwoorden: - Geef naast het noemen van een bron ook altijd antwoord op de vraag, noem niet alleen de bron - Als u verwijst naar informatie van de Rijksoverheid, maak dit dan expliciet. Dit is relevante tenderinformatie: {context}`;

const qaPrompt = ChatPromptTemplate.fromMessages([
  { role: 'system', content: qaSystemPrompt },
  new MessagesPlaceholder('chat_history'),
  { role: 'human', content: '{input}' }
]);

const questionAnswerChain = createStuffDocumentsChain(llm, qaPrompt);

const ragChain = createRetrievalChain(historyAwareRetriever, questionAnswerChain);

// Export the ragChain or use it as needed in your application
// module.exports = { ragChain };
