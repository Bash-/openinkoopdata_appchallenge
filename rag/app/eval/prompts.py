eval_prompt = """
U bent gespecialiseerd in tenders voor de nederlandse markt. 
Een instructie (kan een invoer bevatten), een te evalueren antwoord, een referentieantwoord dat een score van 5 krijgt, en een beoordelingscriteria zijn gegeven.
1. Schrijf gedetailleerde feedback die de kwaliteit van het antwoord beoordeelt, strikt gebaseerd op het gegeven beoordelingscriteria, zonder het algemeen te evalueren.
2. Na het schrijven van de feedback, geef een score die een geheel getal tussen 1 en 5 is. Je moet verwijzen naar het beoordelingscriteria.
3. Het uitvoerformaat moet er als volgt uitzien: \"Feedback: {{schrijf een feedback voor het criterium}} [RESULTAAT] {{een geheel getal tussen 1 en 5}}\"
4. Genereer alsjeblieft geen andere opening, afsluiting, of uitleg. Zorg ervoor dat [RESULTAAT] in je uitvoer staat.

###De te evalueren instructie:
{instruction}

###Te evalueren antwoord:
{response}

###Referentieantwoord (Score 5):
{reference_answer}

###Beoordelingscriteria:
[Is het antwoord correct, accuraat, en feitelijk gebaseerd op het referentieantwoord?]
Score 1: Het antwoord is volledig incorrect, onnauwkeurig en/of niet feitelijk.
Score 2: Het antwoord is grotendeels incorrect, onnauwkeurig en/of niet feitelijk.
Score 3: Het antwoord is enigszins correct, nauwkeurig en/of feitelijk.
Score 4: Het antwoord is grotendeels correct, nauwkeurig en feitelijk.
Score 5: Het antwoord is volledig correct, nauwkeurig en feitelijk.

###Feedback:

"""

contextualize_q_system_prompt = """
        U bent gespecialiseerd in tenders voor de nederlandse markt. 
        Je taak is om een feitelijke vraag te schrijven en een antwoord te geven op basis van een context van de tender. 
        Je feitelijke vraag moet beantwoord kunnen worden met een specifiek, beknopt stuk feitelijke informatie uit de context. 
        Je feitelijke vraag moet relevant zijn voor de context van een tender en zou gesteld kunnen worden door een gebruiker die informatie zoekt over een tender.
        Dit betekent dat je feitelijke vraag NIET iets mag vermelden zoals "volgens de passage" of "context".
        Geef je antwoord als volgt:

        Output::: 
        Feitelijke vraag: (je feitelijke vraag) 
        Antwoord: (je antwoord op de feitelijke vraag)
        
        Dit is de context: {context}
        """

question_groundedness_critique_prompt = """ 
        U bent gespecialiseerd in tenders voor de nederlandse markt. 
        Je krijgt een context en een vraag. 
        Jouw taak is om een 'totale beoordeling' te geven over hoe goed men de gegeven vraag ondubbelzinnig kan beantwoorden met de gegeven context. 
        Geef je antwoord op een schaal van 1 tot 5, waarbij 1 betekent dat de vraag helemaal niet beantwoordbaar is gegeven de context, en 5 betekent dat de vraag duidelijk en ondubbelzinnig beantwoord kan worden met de context.

        Geef je antwoord als volgt:

        Antwoord::: 
        Evaluatie: (jouw motivatie voor de beoordeling, als tekst) 
        Totale beoordeling: (jouw beoordeling, als een getal tussen 1 en 5)

        Je MOET waarden opgeven voor 'Evaluatie:' en 'Totale beoordeling:' in je antwoord.

        Hier zijn de vraag en de context.

        Vraag: {question}
        Context: {context}
        Antwoord::: 
        """

question_relevance_critique_prompt = """ 
U bent gespecialiseerd in tenders voor de nederlandse markt. 
Je krijgt een vraag. Jouw taak is om een 'totale beoordeling' te geven die weergeeft hoe nuttig deze vraag kan zijn voor partijen die informatie willen opvragen over tenders. Geef je antwoord op een schaal van 1 tot 5, waarbij 1 betekent dat de vraag helemaal niet nuttig is, en 5 betekent dat de vraag uiterst nuttig is.

Geef je antwoord als volgt:

Antwoord::: 
Evaluatie: (jouw motivatie voor de beoordeling, als tekst) 
Totale beoordeling: (jouw beoordeling, als een getal tussen 1 en 5)

Je MOET waarden opgeven voor 'Evaluatie:' en 'Totale beoordeling:' in je antwoord.

Hier is de vraag.

Vraag: {question}
Antwoord::: 
"""


question_standalone_critique_prompt = """ 
U bent gespecialiseerd in tenders voor de nederlandse markt. 
Je krijgt een vraag. Jouw taak is om een 'totale beoordeling' te geven die weergeeft hoe context-onafhankelijk deze vraag is. 
Geef je antwoord op een schaal van 1 tot 5, waarbij 1 betekent dat de vraag afhankelijk is van aanvullende informatie om begrepen te worden, en 5 betekent dat de vraag op zichzelf logisch is. 
Bijvoorbeeld, als de vraag verwijst naar een specifieke setting, zoals 'in de context' of 'in het document', moet de beoordeling 1 zijn.

Bijvoorbeeld, "Wie is de contact persoon van deze tender gegeven in bijlage van de aankondiging?" zou een 1 moeten krijgen, omdat er een impliciete verwijzing is naar een context, waardoor de vraag niet onafhankelijk van de context is.

Geef je antwoord als volgt:

Antwoord::: 
Evaluatie: (jouw motivatie voor de beoordeling, als tekst) 
Totale beoordeling: (jouw beoordeling, als een getal tussen 1 en 5)

Je MOET waarden opgeven voor 'Evaluatie:' en 'Totale beoordeling:' in je antwoord.

Hier is de vraag.

Vraag: {question}
Antwoord::: 
"""

qa_eval_prompt = """
        U bent gespecialiseerd in tender aanvragen voor de nederlandse markt. 
        Gegeven zijn een vraag, het echte antwoord en een gegenereerd antwoord. Scoor het gegenereerde antwoord op basis van de echte antwoord.
        Geef een score van 1 tot 5, waarbij 1 slecht is en 5 goed. Geef dus alleen een enkel getal terug.
        """