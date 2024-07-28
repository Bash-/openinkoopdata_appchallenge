# Data Pipeline

This folder contains files to perform Extract, Load, and Transform (ELT) tasks for the application. The data pipeline is responsible for extracting data from the Tenderned API and transforming it into a format suitable for further processing.

## Files

- `datapipeline/extract_publications_tenderned.py`: This file contains the code for extracting data from the Tenderned API.
- `datapipeline/clean_publications_tenderned.py`: This file contains the code for merging all raw data into a Delta table.

## How to run

1. Make sure you have access to the ai-tenderportaal GCP project.
1. Save your GCP Service Account Credentials in this folder and name it "gcp_serviceaccount.json"
1. Build the Docker file, e.g. `docker build -t aitenderportaal-datapipeline .`
1. Run the Docker file, e.g. `docker run --rm aitenderportaal-datapipeline`

## Deploy
1. `docker tag aitenderportaal-datapipeline europe-west9-docker.pkg.dev/ai-tenderportaal/aitenderportaal-registry/aitenderportaal-datapipeline:latest`
1. `docker push europe-west9-docker.pkg.dev/ai-tenderportaal/aitenderportaal-registry/aitenderportaal-datapipeline:latest`