# Data Pipeline

This folder contains files to perform Extract, Load, and Transform (ELT) tasks for the application. The data pipeline is responsible for extracting data from the Tenderned API and transforming it into a format suitable for further processing.

## Files

- `datapipeline/extract_publications_tenderned.py`: This file contains the code for extracting data from the Tenderned API.
- `datapipeline/clean_publications_tenderned.py`: This file contains the code for merging all raw data into a Delta table.