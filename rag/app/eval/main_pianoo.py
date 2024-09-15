import os

import weaviate
from langchain_openai import ChatOpenAI

from rag import get_rag_chain
from evaluator import RAGEvaluator

import json


def write_dict_to_json_file(dictionary, file_path):
    with open(file_path, "w") as json_file:
        json.dump(dictionary, json_file)


## Initialize general functions
rag_chain = get_rag_chain()
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

### Evaluate Pianoo RAG functionality
qa_pairs = [
    {
        "vraag": "Wat is de maximale duur van een raamovereenkomst?",
        "antwoord": "De maximale duur van een raamovereenkomst is doorgaans 4 jaar. In bijzondere omstandigheden, waarbij dit goed gemotiveerd wordt, kan de looptijd langer zijn. Voor speciale sectoropdrachten kan de looptijd maximaal 8 jaar zijn, met uitzondering van goed gemotiveerde gevallen. Gedurende de hele looptijd van de raamovereenkomst kunnen opdrachten worden verstrekt.",
    },
    {
        "vraag": "Wat is de rechtsbescherming bij raamovereenkomsten?",
        "antwoord": "Bij raamovereenkomsten zijn er twee momenten van 'gunnen': eerst bij de aanbesteding van de raamovereenkomst zelf, en daarna bij het gunnen van nadere opdrachten onder die raamovereenkomst. Alleen bij de initiële aanbesteding van de raamovereenkomst moet rekening worden gehouden met de regels voor rechtsbescherming volgens de Aanbestedingswet 2012, waarbij inschrijvers 20 dagen de tijd krijgen om een juridische procedure te starten tegen het gunningsvoornemen. Bij nadere opdrachten onder de raamovereenkomst geldt deze verplichting niet, hoewel een partij alsnog bezwaar kan maken als de aanbestedende dienst in strijd handelt met het aanbestedingsrecht.",
    },
    {
        "vraag": "Hoe plaats ik een opdracht binnen een raamovereenkomst?",
        "antwoord": "Bij het plaatsen van opdrachten binnen een raamovereenkomst worden aparte overeenkomsten, de zogenaamde nadere overeenkomsten, afgesloten. Bij raamovereenkomsten met meerdere ondernemers en onvolledige voorwaarden wordt een minicompetitie georganiseerd om deze nadere opdrachten te gunnen. Hierbij worden de ondernemers uitgenodigd om een offerte in te dienen, en er moet voldoende tijd worden geboden om een reële inschrijving te doen. De gunningscriteria die in de oorspronkelijke raamovereenkomst zijn vastgelegd, moeten worden toegepast zonder wijzigingen bij de beoordeling van deze offertes.",
    },
    {
        "vraag": "Wanneer kies ik voor een raamovereenkomst?",
        "antwoord": "Een raamovereenkomst dekt een specifieke categorie producten, diensten of werken en stelt aanbestedende diensten in staat om snel opdrachten te gunnen zonder telkens een volledige Europese aanbesteding te doorlopen. Dit is mogelijk omdat tijdens de initiële aanbesteding al veel voorwaarden, zoals prijs en levering, zijn vastgelegd. Als er regelmatig gelijksoortige opdrachten worden verwacht, is het aan te raden een raamovereenkomst Europees aan te besteden, zodat daarna alleen nog individuele opdrachten binnen die overeenkomst hoeven te worden gegund.",
    },
    {
        "vraag": "Hoe werkt een raming binnen raamovereenkomsten?",
        "antwoord": "Bij het plaatsen van overheidsopdrachten op basis van een raamovereenkomst moet de aanbestedende dienst de geraamde totale waarde van alle opdrachten voor de duur van de overeenkomst in acht nemen. Volgens een uitspraak van het Hof van Justitie van de Europese Unie (C-216/17) bepaalt deze raming ook de geldigheidsduur van de raamovereenkomst. Als de waarde van de opdrachten de raming overschrijdt, verliest de raamovereenkomst zijn geldigheid, zelfs als de looptijd nog niet is verstreken, en worden verdere opdrachten als onrechtmatig beschouwd.",
    },
    {
        "vraag": "Bestaat er een afnameplicht binnen een raamovereenkomst?",
        "antwoord": "Een raamovereenkomst biedt geen afnamegarantie; u bent niet verplicht iets af te nemen. Het is verstandig om in de aanbestedingsdocumenten te vermelden dat u het recht behoudt geen opdrachten te verstrekken. Als u wel een opdracht plaatst, moet dit bij de partijen van de raamovereenkomst gebeuren, tenzij er uitzonderlijke omstandigheden zijn die uitwijken naar andere marktpartijen rechtvaardigen. Als raamcontractpartijen niet kunnen of willen leveren, is het belangrijk om de vraagstelling en selectiecriteria te herzien. Goede contractvoorwaarden kunnen voorkomen dat partijen weigeren te offreren of te leveren.",
    },
    {
        "vraag": "Wat moet ik doen bij afhakende partijen binnen een raamovereenkomst?",
        "antwoord": "Bij het opstellen van contractuele bepalingen is het belangrijk om rekening te houden met scenario's waarin partijen kunnen afhaken, zoals bij faillissement. Dit risico kan worden beperkt door strikte selectiecriteria en een boetebeding voor vroegtijdig vertrek. Gedurende de looptijd van een raamovereenkomst mogen geen nieuwe partijen worden toegelaten als anderen afhaken, dus het is verstandig om niet te weinig contractpartijen te kiezen. Bij een overgang van onderneming kan de raamovereenkomst worden overgedragen aan de nieuwe eigenaar, maar de overeengekomen afspraken blijven ongewijzigd.",
    },
    {
        "vraag": "Kan ik inkopen buiten de raamovereenkomst om?",
        "antwoord": "Als u een opdracht hebt die binnen de scope van een raamovereenkomst valt, moet u deze eerst aan de raamcontractanten aanbieden voor een offerte. U kunt bepaalde opdrachten buiten de raamovereenkomst houden door dit duidelijk in het aanbestedingsdocument vast te leggen, bijvoorbeeld voor opdrachten onder of boven een bepaalde waarde. Dit betekent echter niet dat deze opdrachten buiten de aanbestedingsregelgeving vallen.",
    },
    {
        "vraag": "Wat is het verschil tussen een raamovereenkomst en een raamcontract?",
        "antwoord": "In het Nederlandse taalgebied worden de termen (raam)overeenkomst en (raam)contract als synoniemen gebruikt, maar het kan verwarrend zijn om ze door elkaar te gebruiken. In het Engels is er een subtiel verschil tussen een contract en een agreement: een contract is juridisch bindend en afdwingbaar, terwijl een agreement minder formeel is en minder concreet de afspraken tussen partijen vastlegt.",
    },
]


tender_id = "pianoo"
evaluator = RAGEvaluator(rag_chain, llm, tender_id)
file_path = "./results/"

# Evaluate Pianoo
results, qa_pairs = evaluator.evaluate(qa_pairs)
write_dict_to_json_file(qa_pairs, f"{file_path}qa_pairs_pianoo.json")
write_dict_to_json_file(results, f"{file_path}result_pianoo.json")
