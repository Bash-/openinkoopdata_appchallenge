import os
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import weaviate
from langchain_openai import ChatOpenAI

from rag import get_rag_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from generator import QuestionGenerator
from prompts import qa_eval_prompt

class RAGEvaluator:
    def __init__(self, rag_chain: Any, llm, tender_id: str):
        self.rag_chain = rag_chain
        self.llm = llm
        self.tender_id = tender_id
        self.eval_chain = self.setup_eval_chain()

    def setup_eval_chain(self):
        """
        Create an evaluation model for the LLM
        :return:

        Use like this
        prompt_value = eval_model.invoke(
        {
            "vraag": "What is your name?",
            "echt_antwoord": "Bob",
            "gegenereerd_antwoord": "Bart",
        })

        """

        prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", qa_eval_prompt),
                ("human", "De originele vraag is: {vraag}"),
                ("human", "Het echte antwoord is: {echt_antwoord}"),
                ("human", "Het gegenereerde antwoord is: {gegenereerd_antwoord}"),
            ]
        )

        # Use runnablesequence instead of LLMChain
        chain = prompt_template | self.llm | StrOutputParser()

        return chain

    def llm_eval(self, question: str, pred: str, truth: str) -> float:
        """
        Evaluate the LLM model.
        :param pred: str - The generated answer.
        :param truth: str - The correct answer.
        :return: float - The average score (0 if parsing fails).
        """
        # Attempt to get a valid score
        score = None
        for attempt in range(6):  # Try the initial attempt + 5 retries
            if attempt > 0:
                score = self.eval_chain.invoke(
                    {
                        "vraag": question,
                        "echt_antwoord": truth,
                        "gegenereerd_antwoord": pred,
                    }
                )

            try:
                score_int = int(score)
                return score_int / 5  # Return the score as a float divided by 5
            except (ValueError, TypeError):
                score = None  # Reset score in case of failure

        # If all attempts fail, return 0
        return 0.0



    def f1(self, pred: str, truth: str):
        """
        Calculate the F1 score
        :param pred: str
        :param truth: str
        :return: float score
        """
        pred_tokens = pred.split()
        truth_tokens = truth.split()
        common_tokens = set(pred_tokens) & set(truth_tokens)
        if len(common_tokens) == 0:
            return 0.0
        prec = len(common_tokens) / len(pred_tokens)
        rec = len(common_tokens) / len(truth_tokens)
        return 2 * (prec * rec) / (prec + rec)

    def cosine_similarity(self, pred: str, truth: str):
        """
        Calculate the cosine similarity
        :param pred: str
        :param truth: str
        :return: float score
        """
        vectorizer = TfidfVectorizer().fit([pred, truth])
        vectors = vectorizer.transform([pred, truth]).toarray()
        return cosine_similarity(vectors)[0, 1]

    def evaluate(self, qa_pairs):
        """
        Evaluate rag chain
        :param qa_pairs:
        :return: score dictionary
        """
        results = {"f1_score": [], "cosine_similarity": [], "llm_eval": []}

        for qa in qa_pairs:
            question, truth_answer = qa["vraag"], qa["antwoord"]

            generated_response = self.rag_chain.invoke({"input": question, "chat_history": [], "tenderId": self.tender_id})
            generated_answer = generated_response.get("answer")

            # Scoring
            f1 = self.f1(generated_answer, truth_answer)
            cosine_sim = self.cosine_similarity(generated_answer, truth_answer)
            llm_score = self.llm_eval(question, generated_answer, truth_answer)

            # Collect results
            results["f1_score"].append(f1)
            results["cosine_similarity"].append(cosine_sim)
            results["llm_eval"].append(llm_score)

        # Aggregate results
        avg_f1 = np.mean(results["f1_score"])
        avg_cosine = np.mean(results["cosine_similarity"])
        avg_llm = np.mean(results["llm_eval"])
        print(results)

        return {
            "avg_f1_score": avg_f1,
            "avg_cosine_similarity": avg_cosine,
            "avg_llm_eval": avg_llm,
        }


# Example usage
qa_pairs = [
    {"vraag": "Wat is de maximale duur van een raamovereenkomst?", "antwoord": "De maximale duur van een raamovereenkomst is doorgaans 4 jaar. In bijzondere omstandigheden, waarbij dit goed gemotiveerd wordt, kan de looptijd langer zijn. Voor speciale sectoropdrachten kan de looptijd maximaal 8 jaar zijn, met uitzondering van goed gemotiveerde gevallen. Gedurende de hele looptijd van de raamovereenkomst kunnen opdrachten worden verstrekt."},
    # {"vraag": "Wat is de rechtsbescherming bij raamovereenkomsten?", "antwoord": "Bij raamovereenkomsten zijn er twee momenten van 'gunnen': eerst bij de aanbesteding van de raamovereenkomst zelf, en daarna bij het gunnen van nadere opdrachten onder die raamovereenkomst. Alleen bij de initiële aanbesteding van de raamovereenkomst moet rekening worden gehouden met de regels voor rechtsbescherming volgens de Aanbestedingswet 2012, waarbij inschrijvers 20 dagen de tijd krijgen om een juridische procedure te starten tegen het gunningsvoornemen. Bij nadere opdrachten onder de raamovereenkomst geldt deze verplichting niet, hoewel een partij alsnog bezwaar kan maken als de aanbestedende dienst in strijd handelt met het aanbestedingsrecht."},
    # {"vraag": "Hoe plaats ik een opdracht binnen een raamovereenkomst?", "antwoord": "Bij het plaatsen van opdrachten binnen een raamovereenkomst worden aparte overeenkomsten, de zogenaamde nadere overeenkomsten, afgesloten. Bij raamovereenkomsten met meerdere ondernemers en onvolledige voorwaarden wordt een minicompetitie georganiseerd om deze nadere opdrachten te gunnen. Hierbij worden de ondernemers uitgenodigd om een offerte in te dienen, en er moet voldoende tijd worden geboden om een reële inschrijving te doen. De gunningscriteria die in de oorspronkelijke raamovereenkomst zijn vastgelegd, moeten worden toegepast zonder wijzigingen bij de beoordeling van deze offertes."},
    # {"vraag": "Wanneer kies ik voor een raamovereenkomst?", "antwoord": "Een raamovereenkomst dekt een specifieke categorie producten, diensten of werken en stelt aanbestedende diensten in staat om snel opdrachten te gunnen zonder telkens een volledige Europese aanbesteding te doorlopen. Dit is mogelijk omdat tijdens de initiële aanbesteding al veel voorwaarden, zoals prijs en levering, zijn vastgelegd. Als er regelmatig gelijksoortige opdrachten worden verwacht, is het aan te raden een raamovereenkomst Europees aan te besteden, zodat daarna alleen nog individuele opdrachten binnen die overeenkomst hoeven te worden gegund."},
    # {"vraag": "Hoe werkt een raming binnen raamovereenkomsten?", "antwoord": "Bij het plaatsen van overheidsopdrachten op basis van een raamovereenkomst moet de aanbestedende dienst de geraamde totale waarde van alle opdrachten voor de duur van de overeenkomst in acht nemen. Volgens een uitspraak van het Hof van Justitie van de Europese Unie (C-216/17) bepaalt deze raming ook de geldigheidsduur van de raamovereenkomst. Als de waarde van de opdrachten de raming overschrijdt, verliest de raamovereenkomst zijn geldigheid, zelfs als de looptijd nog niet is verstreken, en worden verdere opdrachten als onrechtmatig beschouwd."},
    # {"vraag": "Bestaat er een afnameplicht binnen een raamovereenkomst?", "antwoord": "Een raamovereenkomst biedt geen afnamegarantie; u bent niet verplicht iets af te nemen. Het is verstandig om in de aanbestedingsdocumenten te vermelden dat u het recht behoudt geen opdrachten te verstrekken. Als u wel een opdracht plaatst, moet dit bij de partijen van de raamovereenkomst gebeuren, tenzij er uitzonderlijke omstandigheden zijn die uitwijken naar andere marktpartijen rechtvaardigen. Als raamcontractpartijen niet kunnen of willen leveren, is het belangrijk om de vraagstelling en selectiecriteria te herzien. Goede contractvoorwaarden kunnen voorkomen dat partijen weigeren te offreren of te leveren."},
    # {"vraag": "Wat moet ik doen bij afhakende partijen binnen een raamovereenkomst?", "antwoord": "Bij het opstellen van contractuele bepalingen is het belangrijk om rekening te houden met scenario's waarin partijen kunnen afhaken, zoals bij faillissement. Dit risico kan worden beperkt door strikte selectiecriteria en een boetebeding voor vroegtijdig vertrek. Gedurende de looptijd van een raamovereenkomst mogen geen nieuwe partijen worden toegelaten als anderen afhaken, dus het is verstandig om niet te weinig contractpartijen te kiezen. Bij een overgang van onderneming kan de raamovereenkomst worden overgedragen aan de nieuwe eigenaar, maar de overeengekomen afspraken blijven ongewijzigd."},
    # {"vraag": "Kan ik inkopen buiten de raamovereenkomst om?", "antwoord": "Als u een opdracht hebt die binnen de scope van een raamovereenkomst valt, moet u deze eerst aan de raamcontractanten aanbieden voor een offerte. U kunt bepaalde opdrachten buiten de raamovereenkomst houden door dit duidelijk in het aanbestedingsdocument vast te leggen, bijvoorbeeld voor opdrachten onder of boven een bepaalde waarde. Dit betekent echter niet dat deze opdrachten buiten de aanbestedingsregelgeving vallen."},
    # {"vraag": "Wat is het verschil tussen een raamovereenkomst en een raamcontract?", "antwoord": "In het Nederlandse taalgebied worden de termen (raam)overeenkomst en (raam)contract als synoniemen gebruikt, maar het kan verwarrend zijn om ze door elkaar te gebruiken. In het Engels is er een subtiel verschil tussen een contract en een agreement: een contract is juridisch bindend en afdwingbaar, terwijl een agreement minder formeel is en minder concreet de afspraken tussen partijen vastlegt."},
]

rag_chain = get_rag_chain()
tender_id = "345519"

# Generate questions pairs
WEAVIATE_URL = os.getenv("WEAVIATE_HOST")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
OPENAI_APIKEY = os.getenv("OPENAI_API_KEY")

weaviate_client = weaviate.Client(
    url=WEAVIATE_URL,
    auth_client_secret=weaviate.AuthApiKey(WEAVIATE_API_KEY),
    additional_headers={"X-OpenAI-Api-Key": OPENAI_APIKEY},
)

llm = ChatOpenAI(
    temperature=0.2, openai_api_key=OPENAI_APIKEY, model="gpt-4o-2024-08-06"
)
qa_pairs = QuestionGenerator(weaviate_client, llm).generate_questions(tender_id)

# # Evaluate
evaluator = RAGEvaluator(rag_chain, llm, tender_id)
results = evaluator.evaluate(qa_pairs)
print(results)
