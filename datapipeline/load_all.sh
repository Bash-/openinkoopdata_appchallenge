#!/bin/bash

# poetry run python datapipeline/extract_publications_tenderned.py
# poetry run python datapipeline/clean_publications_tenderned.py
# poetry run python datapipeline/extract_documents_tenderned.py
poetry run python datapipeline/extract_documents_categorieplannen.py
poetry run python datapipeline/extract_documents_rijksvoorwaarden.py
