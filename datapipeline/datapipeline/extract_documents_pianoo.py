# the pianoo scraper is supposed to run only once in a while
# run it separately from the main pipeline, this is just to insert the links extracted to the metadata
import json
import os

from insert_documents_vectordb import (
    insert_other_documents_postgres,
    insert_to_vectordb,
)
from pianoo_scraper import PIANOO_SAVE_PATH, PianooLink

if __name__ == "__main__":
    documents = []
    for root, dirs, files in os.walk(f"{PIANOO_SAVE_PATH}/json"):
        print("Uploading files to Weaviate")
        print(files, root)
        for file in files:
            if file.endswith(".json"):
                with open(f"{PIANOO_SAVE_PATH}/json/{file}", "r") as f:
                    data: PianooLink = json.load(f)
                    print(data)
                    filename = str(file).replace(".json", "")
                    print(filename)
                    documents.append(
                        {
                            "tenderid": "pianoo",
                            "documentid": f"pianoo_{filename}",
                            "documentnaam": data["title"],
                            "typedocument": "txt",
                            "datumpublicatie": data.get("scraped_at", None),
                            "gepubliceerddoor": "Pianoo",
                            "publicatiecategorie": "CATEGORY",
                            "virusindicatie": False,
                            "grootte": -1,
                            "downloadurl": data["url"],
                        }
                    )

    print(documents[-1])
    insert_to_vectordb(f"{PIANOO_SAVE_PATH}/txt/", "pianoo")
    insert_other_documents_postgres(documents)
