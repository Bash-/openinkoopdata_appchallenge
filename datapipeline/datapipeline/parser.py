import os

import numpy as np
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_text_splitters.base import Language

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader, TextLoader


load_dotenv(".env")

def process_file(filename: str):
    """
    Convert the given file to Markdown and split it into smaller chunks.

    Args:
        filename (str): Path to the file to be processed.

    Returns:
        list: A list of Document objects containing the chunked text.
    """
    # read file and export to markdown
    converter = DocumentConverter()
    result = converter.convert(filename)
    docling_text = result.document.export_to_markdown()

    # chunk document into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.MARKDOWN,
        chunk_size=1000,
        chunk_overlap=100,
    )

    docling_documents = text_splitter.create_documents(texts=[docling_text])

    return docling_documents


def extract_text_from_pdfs(pdf_folder):
    """
    Extract text from all PDF files in the specified folder.

    Args:
        pdf_folder (str): Path to the folder containing PDF files.

    Returns:
        dict: A dictionary where keys are PDF filenames and values are the extracted text.
    """
    pdf_texts = {}
    converter = DocumentConverter()
    for filename in os.listdir(pdf_folder):
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            pdf_path = os.path.join(pdf_folder, filename)
            result = converter.convert(pdf_path)
            text = (
                result.document.export_to_text()
            )  # Extract the full text from the PDF
            pdf_texts[filename] = text
    return pdf_texts


def parse_pypdf(folder_path, tenderId: str) -> None:
    """
    Load files from a folder, chunk them and persist them in the Weaviate Vector store
    :param
    folder_path: str
        Path to the folder with files
    :return:
        None
    """

    # Check if the tenderId already exists in Weaviate, if so delete the existing documents first
    # collection = client.collections.get("Tender_documents_german")
    # deleted = collection.data.delete_many(
    #     where=(
    #         Filter.by_property("tenderId").equal(tenderId)
    #         & Filter.by_property("source").not_equal("metadata")
    #     )
    # )
    # print("Deleted existing documents")
    # print(deleted)

    documents = []
    for dirName, subdirList, fileList in os.walk(folder_path):
        print(f"Found directory: {dirName}")
        for fname in fileList:
            print(f" \t Found file {fname}")
            file_path = os.path.join(dirName, fname)
            if fname.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
                documents.extend(loader.load())
            elif fname.endswith(".txt"):
                loader = TextLoader(file_path)
                documents.extend(loader.load())
            elif fname.endswith(".docx"):
                loader = Docx2txtLoader(file_path)
                documents.extend(loader.load())

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=10)
    documents = text_splitter.split_documents(documents)
    return documents

path = "/Users/martijnbeeks/Downloads/Tender_documents_CXS7YYXYTDVZJ6UT/leistungsbeschreibungen/test"
# result_docling = extract_text_from_pdfs(path)
# print(result_docling)


# result_pypdf = parse_pypdf(path, "CXS7YYXYTDVZJ6UT")
# print(result_pypdf)



from markitdown import MarkItDown

# md = MarkItDown()
# result = md.convert(path+"/020-24-00357_0.00_Werkvertrag_VCM_07.01.2025 .pdf")
# print(result.text_content)

from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o")
result = md.convert(path+"/Anlage 2_Organisationsplan für CM.pdf")
print(result.text_content)


