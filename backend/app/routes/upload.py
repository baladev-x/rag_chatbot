from pathlib import Path
import uuid
import hashlib

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException
)

from app.services.file_service import extract_file

from app.services.chunk_service import (
    chunk_text,
    chunk_pdf_pages
)

from app.services.embedding_service import generate_embeddings

from app.services.vector_service import (
    add_documents,
    document_exists
)


router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)


# --------------------------------------------------
# Upload directory
# --------------------------------------------------

UPLOAD_DIR = Path("uploads")

UPLOAD_DIR.mkdir(
    exist_ok=True
)


# --------------------------------------------------
# Supported file extensions
# --------------------------------------------------

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",

    ".csv",
    ".xlsx",

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
# Calculate SHA-256 file hash
# --------------------------------------------------

def calculate_file_hash(
    content: bytes
) -> str:

    return hashlib.sha256(
        content
    ).hexdigest()


# --------------------------------------------------
# Upload endpoint
# --------------------------------------------------

@router.post("/")
async def upload_file(
    file: UploadFile = File(...)
):

    # --------------------------------------------------
    # 1. Validate filename
    # --------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    # --------------------------------------------------
    # 2. Get extension
    # --------------------------------------------------

    extension = Path(
        file.filename
    ).suffix.lower()


    # --------------------------------------------------
    # 3. Validate file type
    # --------------------------------------------------

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported file type",
                "file_type": extension,
                "supported_types": sorted(
                    ALLOWED_EXTENSIONS
                )
            }
        )


    try:

        # --------------------------------------------------
        # 4. Read uploaded file
        # --------------------------------------------------

        content = await file.read()


        # --------------------------------------------------
        # 5. Validate empty file
        # --------------------------------------------------

        if not content:

            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )


        # --------------------------------------------------
        # 6. Calculate file hash
        # --------------------------------------------------

        file_hash = calculate_file_hash(
            content
        )


        # --------------------------------------------------
        # 7. Check duplicate
        # --------------------------------------------------

        if document_exists(
            file_hash
        ):

            raise HTTPException(
                status_code=409,
                detail="This file has already been uploaded"
            )


        # --------------------------------------------------
        # 8. Generate unique file ID
        # --------------------------------------------------

        file_id = str(
            uuid.uuid4()
        )


        # --------------------------------------------------
        # 9. Create safe filename
        # --------------------------------------------------

        safe_filename = (
            f"{file_id}{extension}"
        )


        file_path = (
            UPLOAD_DIR / safe_filename
        )


        # --------------------------------------------------
        # 10. Save file
        # --------------------------------------------------

        with open(
            file_path,
            "wb"
        ) as buffer:

            buffer.write(content)


        # --------------------------------------------------
        # 11. Extract content
        # --------------------------------------------------

        extracted_data = extract_file(
            str(file_path)
        )


        # --------------------------------------------------
        # 12. Create chunks
        # --------------------------------------------------

        if extension == ".pdf":

            chunks = chunk_pdf_pages(
                extracted_data
            )

        else:

            if not extracted_data.strip():

                file_path.unlink(
                    missing_ok=True
                )

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Could not extract text "
                        "from this file"
                    )
                )


            chunks = chunk_text(
                extracted_data
            )


        # --------------------------------------------------
        # 13. Validate chunks
        # --------------------------------------------------

        if not chunks:

            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not create chunks "
                    "from this file"
                )
            )


        # --------------------------------------------------
        # 14. Generate embeddings
        # --------------------------------------------------

        embeddings = generate_embeddings(
            chunks
        )


        # --------------------------------------------------
        # 15. Validate embeddings
        # --------------------------------------------------

        if not embeddings:

            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to generate embeddings"
            )


        if len(embeddings) != len(chunks):

            file_path.unlink(
                missing_ok=True
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Number of embeddings does not "
                    "match number of chunks"
                )
            )


        # --------------------------------------------------
        # 16. Store in ChromaDB
        # --------------------------------------------------

        add_documents(
            chunks=chunks,
            embeddings=embeddings,
            file_id=file_id,
            filename=file.filename,
            file_type=extension,
            file_hash=file_hash
        )


        # --------------------------------------------------
        # 17. Success response
        # --------------------------------------------------

        return {
            "success": True,
            "message": (
                "File processed and indexed successfully"
            ),
            "file_id": file_id,
            "filename": file.filename,
            "file_type": extension,
            "file_size": len(content),
            "file_hash": file_hash,
            "chunks_created": len(chunks),
            "embeddings_created": len(embeddings)
        }


    # --------------------------------------------------
    # FastAPI errors
    # --------------------------------------------------

    except HTTPException:

        raise


    # --------------------------------------------------
    # Unexpected errors
    # --------------------------------------------------

    except Exception as e:

        if "file_path" in locals():

            file_path.unlink(
                missing_ok=True
            )

        raise HTTPException(
            status_code=500,
            detail=(
                f"File processing failed: {str(e)}"
            )
        )