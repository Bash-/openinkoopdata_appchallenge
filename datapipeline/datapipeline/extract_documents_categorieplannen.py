import requests
import os

urls: list = [
    {
        "categorie": "Bedrijfskleding",
        "url": "https://open.overheid.nl/documenten/ronl-330708dd89d1cf51b05ba16e18f956e2ee766a11/pdf"
    },
    {
        "categorie": "Beveiliging & Bedrijfshulpverlening",
        "url": "https://open.overheid.nl/repository/ronl-3b1054dd3da274d78591a1d06eb29277b5e0d6b8/1/pdf/Categorieplan Beveiliging en Bedrijfshulpverlening.pdf"
    },
    {
        "categorie": "Connectiviteit",
        "url": "https://open.overheid.nl/documenten/847827b2-291c-40ba-81f1-8e5faa611046/file"
    },
    {
        "categorie": "Consumptieve Dienstverlening",
        "url": "https://www.rijksoverheid.nl/onderwerpen/zakendoen-met-het-rijk/documenten/rapporten/2022/06/30/strategisch-categorieplan-consumptieve-dienstverlening"
    },
    {
        "categorie": "Duurzame Inzetbaarheid",
        "url": "https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/rapporten/2022/05/31/categorieplan-duurzame-inzetbaarheid-rijk---hrm-inkopen-met-sociale-impact/2022-06-13+73947+-+BZK+-+Opmaak+Categorieplan+Duurzame+Inzetbaarheid_v2_TG.pdf"
    },
    {
        "categorie": "ICT Werkomgeving Rijk",
        "url": "https://open.overheid.nl/repository/ronl-02277cd4c13dc4b8e7aeb2a7de94eed4a32a0940/1/pdf/Categorieplan ICT Werkomgeving Rijk.pdf"
    },
    {
        "categorie": "Laboratorium",
        "url": "https://open.overheid.nl/repository/ronl-8492916631d428cd9e814ef6d8eb9e0c646d2501/1/pdf/categorieplan-laboratorium-2022-2024.pdf"
    },
    {
        "categorie": "Logistiek",
        "url": "https://www.rijksoverheid.nl/binaries/rijksoverheid/documenten/publicaties/2023/06/21/categorieplan-logistiek-2023---2026/categorieplan-logistiek.pdf"
    },
    {
        "categorie": "Vervoer en Verblijf",
        "url": "https://open.overheid.nl/documenten/1e01a249-d053-4ec1-8e43-6a214a50c5cd/file"
    },
    {
        "categorie": "Werkplekomgeving",
        "url": "https://open.overheid.nl/documenten/993d48c7-97ec-437f-9a17-f9202dfda0e4/file"
    }
]


def extract_documents_categorieplannen():
    # Make directory if it does not exist
    if not os.path.exists("data_local/raw/categorieplannen"):
        os.makedirs("data_local/raw/categorieplannen")
    
    for url in urls:
        response = requests.get(url["url"])
        # Check if contents of response is a pdf
        if response.headers["Content-Type"] != "application/pdf":
            print(f"Could not extract pdf for Categorieplan {url['categorie']} from {url['url']}")
            continue
        
        # Replace spaces with underscores and replace & with 'en'
        filename = url["categorie"].replace(" ", "_").replace("&", "en") + ".pdf"
        
        with open(f"data_local/raw/categorieplannen/{filename}", "wb") as f:
            f.write(response.content)
            
extract_documents_categorieplannen()