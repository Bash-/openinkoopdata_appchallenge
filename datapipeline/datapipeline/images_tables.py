import pdfplumber

def check_pdf_content_excluding_header_footer(file_path, header_threshold=100, footer_threshold=100):
    with pdfplumber.open(file_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            # Page dimensions
            page_height = page.height
            
            # Check for tables
            tables = page.extract_tables()
            if tables and any(len(row) > 0 for row in tables[0]):  # Simple check for table presence
                print(f"Page {page_number} contains a table.")
            
            # Check for images (excluding header and footer)
            non_header_footer_images = [
                img for img in page.images
                if img['y0'] > header_threshold and img['y1'] < page_height - footer_threshold
            ]
            
            if non_header_footer_images:
                print(f"Page {page_number} contains images (excluding header and footer).")

# Provide your PDF file path here
path = "/Users/martijnbeeks/Downloads/Tender_documents_CXS7YYXYTDVZJ6UT/leistungsbeschreibungen/test"
check_pdf_content_excluding_header_footer("/Users/martijnbeeks/Downloads/Tender_documents_CXS7YYXYTDVZJ6UT/leistungsbeschreibungen/Anlage 2_Leistungsbeschreibung.pdf")
