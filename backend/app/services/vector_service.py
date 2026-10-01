import chromadb


# --------------------------------------------------
# ChromaDB configuration
# --------------------------------------------------

CHROMA_PATH = "./chroma_db"

COLLECTION_NAME = "filemind_documents"


# --------------------------------------------------
# ChromaDB client
# --------------------------------------------------

client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


# --------------------------------------------------
# Collection
# --------------------------------------------------

collection = client.get_or_create_collection(
    name=COLLECTION_NAME
)


# --------------------------------------------------
# Check duplicate document
# --------------------------------------------------

def document_exists(
    file_hash: str
) -> bool:

    results = collection.get(
        where={
            "file_hash": file_hash
        }
    )

    return len(
        results["ids"]
    ) > 0


# --------------------------------------------------
# Add documents
# --------------------------------------------------

def add_documents(
    chunks,
    embeddings,
    file_id: str,
    filename: str,
    file_type: str,
    file_hash: str
):

    if not chunks:
        return


    ids = []

    documents = []

    metadatas = []


    for index, chunk in enumerate(
        chunks
    ):

        # ------------------------------------------
        # Structured chunk
        # ------------------------------------------

        if isinstance(
            chunk,
            dict
        ):

            text = chunk["text"]

            chunk_index = chunk.get(
                "chunk_index",
                index
            )

            page_number = chunk.get(
                "page_number"
            )

        # ------------------------------------------
        # Normal string chunk
        # ------------------------------------------

        else:

            text = chunk

            chunk_index = index

            page_number = None


        # ------------------------------------------
        # Unique Chroma ID
        # ------------------------------------------

        ids.append(
            f"{file_id}_{index}"
        )


        # ------------------------------------------
        # Document text
        # ------------------------------------------

        documents.append(
            text
        )


        # ------------------------------------------
        # Metadata
        # ------------------------------------------

        metadata = {
            "file_id": file_id,
            "filename": filename,
            "file_type": file_type,
            "file_hash": file_hash,
            "chunk_index": chunk_index
        }


        # ------------------------------------------
        # PDF page number
        # ------------------------------------------

        if page_number is not None:

            metadata["page_number"] = (
                page_number
            )


        metadatas.append(
            metadata
        )


    # ------------------------------------------
    # Store in ChromaDB
    # ------------------------------------------

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )


# --------------------------------------------------
# Search documents
# --------------------------------------------------

def search_documents(
    query_embedding: list[float],
    top_k: int = 5,
    distance_threshold: float = 0.8
):
    results = collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=top_k
    )

    if not results["distances"]:
        return results

    filtered_documents = []
    filtered_metadatas = []
    filtered_distances = []

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    for document, metadata, distance in zip(
        documents,
        metadatas,
        distances
    ):

        if distance <= distance_threshold:

            filtered_documents.append(
                document
            )

            filtered_metadatas.append(
                metadata
            )

            filtered_distances.append(
                distance
            )

    return {
        "documents": [
            filtered_documents
        ],
        "metadatas": [
            filtered_metadatas
        ],
        "distances": [
            filtered_distances
        ]
    }


# --------------------------------------------------
# List documents
# --------------------------------------------------

def list_documents():

    results = collection.get(
        include=[
            "metadatas"
        ]
    )


    documents = {}


    for metadata in results["metadatas"]:

        file_id = metadata[
            "file_id"
        ]


        if file_id not in documents:

            documents[file_id] = {
                "file_id": file_id,
                "filename": metadata[
                    "filename"
                ],
                "file_type": metadata[
                    "file_type"
                ],
                "chunks": 0
            }


        documents[file_id][
            "chunks"
        ] += 1


    return list(
        documents.values()
    )


# --------------------------------------------------
# Delete document
# --------------------------------------------------

def delete_document(
    file_id: str
):

    results = collection.get(
        where={
            "file_id": file_id
        }
    )


    ids = results[
        "ids"
    ]


    if ids:

        collection.delete(
            ids=ids
        )


    return len(ids)