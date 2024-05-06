FROM python:3.11-slim

WORKDIR /app
ENV PYTHONPATH /app

COPY datapipeline datapipeline
COPY utils utils
COPY load_daily.sh load_daily.sh
COPY pyproject.toml pyproject.toml
COPY poetry.lock poetry.lock
COPY gcp_serviceaccount.json gcp_serviceaccount.json

RUN chmod +x load_daily.sh

RUN pip install poetry
RUN poetry install
RUN apt-get update && apt-get install -y unzip


CMD ["./load_daily.sh"]

