# Data Pipeline

This folder contains files to perform Extract, Load, and Transform (ELT) tasks for the application. The data pipeline is responsible for extracting data from the Tenderned API and transforming it into a format suitable for further processing.

## Files

- `datapipeline/extract_publications_tenderned.py`: This file contains the code for extracting data from the Tenderned API.
- `datapipeline/clean_publications_tenderned.py`: This file contains the code for merging all raw data into a Delta table.

## How to run
To run the code using Poetry, you can follow these steps:

1. Make sure you have Poetry installed. If not, you can install it by running the following command in your terminal:
`pip install poetry`

1. Navigate to the root directory of your project where the pyproject.toml file is located.

1. Initialize Poetry by running the following command:
`poetry init`

1. Install the project dependencies by running:
`poetry install`

1. To run the extract_publications_tenderned.py script, use the following command:
`poetry run python datapipeline/extract_publications_tenderned.py`

1. To run the clean_publications_tenderned.py script, use the following command:
`poetry run python datapipeline/clean_publications_tenderned.py`

