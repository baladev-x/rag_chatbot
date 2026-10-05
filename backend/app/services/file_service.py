from pathlib import Path
from importlib import import_module

from pypdf import PdfReader
import pandas as pd


# --------------------------------------------------
# Text extensions
# --------------------------------------------------

TEXT_EXTENSIONS = {

    ".txt",
    ".md",

    ".py",
    ".js",
    ".jsx",

    ".ts",
    ".tsx",

    ".java",

    ".c",
    ".cpp",
    ".h",
    ".hpp",

    ".html",
    ".css",

    ".json",
    ".xml",

    ".sql",
    ".log"
}


# --------------------------------------------------
# PDF
# --------------------------------------------------

def extract_pdf(
    file_path: str
):

    reader = PdfReader(
        file_path
    )


    pages = []


    for page_number, page in enumerate(
        reader.pages,
        start=1
    ):

        page_text = page.extract_text()


        if page_text and page_text.strip():

            pages.append({

                "text": page_text.strip(),

                "page_number": page_number
            })


    return pages


# --------------------------------------------------
# DOCX
# --------------------------------------------------

def extract_docx(
    file_path: str
) -> str:

    Document = import_module(
        "docx"
    ).Document


    document = Document(
        file_path
    )


    text = []


    for paragraph in document.paragraphs:

        paragraph_text = (
            paragraph.text.strip()
        )


        if paragraph_text:

            text.append(
                paragraph_text
            )


    return "\n".join(
        text
    )


# --------------------------------------------------
# Text files
# --------------------------------------------------

def extract_text_file(
    file_path: str
) -> str:

    path = Path(
        file_path
    )


    return path.read_text(

        encoding="utf-8",

        errors="ignore"
    )


# --------------------------------------------------
# CSV
# --------------------------------------------------

def extract_csv(
    file_path: str
) -> str:

    dataframe = pd.read_csv(
        file_path
    )


    return dataframe.to_string(
        index=False
    )


# --------------------------------------------------
# XLSX
# --------------------------------------------------

def extract_xlsx(
    file_path: str
) -> str:

    sheets = pd.read_excel(

        file_path,

        sheet_name=None
    )


    text = []


    for sheet_name, dataframe in sheets.items():

        text.append(
            f"Sheet: {sheet_name}"
        )


        text.append(
            dataframe.to_string(
                index=False
            )
        )


    return "\n\n".join(
        text
    )


# --------------------------------------------------
# Main extractor
# --------------------------------------------------

def extract_file(
    file_path: str
):

    extension = Path(
        file_path
    ).suffix.lower()


    if extension == ".pdf":

        return extract_pdf(
            file_path
        )


    elif extension == ".docx":

        return extract_docx(
            file_path
        )


    elif extension in TEXT_EXTENSIONS:

        return extract_text_file(
            file_path
        )


    elif extension == ".csv":

        return extract_csv(
            file_path
        )


    elif extension == ".xlsx":

        return extract_xlsx(
            file_path
        )


    else:

        raise ValueError(
            f"Unsupported file type: {extension}"
        )