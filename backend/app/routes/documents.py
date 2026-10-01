from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.vector_service import (
    list_documents,
    delete_document
)


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


UPLOAD_DIR = Path("uploads")


@router.get("/")
def get_documents():

    try:
        documents = list_documents()

        return {
            "success": True,
            "documents": documents,
            "total": len(documents)
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.delete("/{file_id}")
def remove_document(file_id: str):

    try:

        deleted_chunks = delete_document(
            file_id
        )

        if deleted_chunks == 0:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        # Find uploaded file using file_id
        deleted_files = []

        for file_path in UPLOAD_DIR.iterdir():

            if file_path.name.startswith(file_id):

                file_path.unlink(
                    missing_ok=True
                )

                deleted_files.append(
                    file_path.name
                )

        return {
            "success": True,
            "message": "Document deleted successfully",
            "file_id": file_id,
            "deleted_chunks": deleted_chunks,
            "deleted_files": deleted_files
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )