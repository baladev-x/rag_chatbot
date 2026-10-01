from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.embedding_service import generate_embedding
from app.services.vector_service import search_documents
from app.services.gemini_service import generate_answer


router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5


@router.post("/")
def chat(request: ChatRequest):

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    try:

        # --------------------------------------------------
        # 1. Generate query embedding
        # --------------------------------------------------

        query_embedding = generate_embedding(
            question
        )


        # --------------------------------------------------
        # 2. Search ChromaDB with similarity threshold
        # --------------------------------------------------

        results = search_documents(
            query_embedding=query_embedding,
            top_k=request.top_k,
            distance_threshold=0.8
        )


        # --------------------------------------------------
        # 3. Get search results
        # --------------------------------------------------

        documents = results.get(
            "documents",
            [[]]
        )[0]

        metadatas = results.get(
            "metadatas",
            [[]]
        )[0]

        distances = results.get(
            "distances",
            [[]]
        )[0]


        # --------------------------------------------------
        # 4. Check if relevant results exist
        # --------------------------------------------------

        if not documents:

            return {
                "success": False,
                "message": (
                    "No relevant information found "
                    "in uploaded documents."
                ),
                "sources": []
            }


        # --------------------------------------------------
        # 5. Build context for Gemini
        # --------------------------------------------------

        context_parts = []


        for index, document in enumerate(
            documents
        ):

            metadata = metadatas[index]

            filename = metadata.get(
                "filename",
                "Unknown file"
            )

            chunk_index = metadata.get(
                "chunk_index",
                index
            )

            page_number = metadata.get(
                "page_number"
            )


            # ----------------------------------------------
            # Source information
            # ----------------------------------------------

            if page_number is not None:

                source = (
                    f"Source: {filename}\n"
                    f"Page: {page_number}\n"
                    f"Chunk: {chunk_index}"
                )

            else:

                source = (
                    f"Source: {filename}\n"
                    f"Chunk: {chunk_index}"
                )


            context_parts.append(
                f"""
{source}

{document}
"""
            )


        context = "\n\n".join(
            context_parts
        )


        # --------------------------------------------------
        # 6. Generate Gemini answer
        # --------------------------------------------------

        answer = generate_answer(
            question=question,
            context=context
        )


        # --------------------------------------------------
        # 7. Build sources
        # --------------------------------------------------

        sources = []


        for index, metadata in enumerate(
            metadatas
        ):

            source = {
                "filename": metadata.get(
                    "filename",
                    "Unknown file"
                ),
                "file_type": metadata.get(
                    "file_type",
                    "Unknown"
                ),
                "chunk_index": metadata.get(
                    "chunk_index",
                    index
                ),
                "distance": distances[index]
            }


            # ----------------------------------------------
            # Add PDF page number if available
            # ----------------------------------------------

            if "page_number" in metadata:

                source["page_number"] = metadata[
                    "page_number"
                ]


            sources.append(
                source
            )


        # --------------------------------------------------
        # 8. Return response
        # --------------------------------------------------

        return {
            "success": True,
            "question": question,
            "answer": answer,
            "sources": sources
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Chat failed: {str(e)}"
        )