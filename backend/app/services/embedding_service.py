import os

from dotenv import load_dotenv
from google import genai


# --------------------------------------------------
# Environment
# --------------------------------------------------

load_dotenv()


GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)


if not GEMINI_API_KEY:

    raise ValueError(
        "GEMINI_API_KEY is not configured"
    )


# --------------------------------------------------
# Gemini client
# --------------------------------------------------

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# --------------------------------------------------
# Embedding model
# --------------------------------------------------

EMBEDDING_MODEL = "gemini-embedding-001"


# --------------------------------------------------
# Generate single embedding
# --------------------------------------------------

def generate_embedding(
    text: str
) -> list[float]:

    response = client.models.embed_content(

        model=EMBEDDING_MODEL,

        contents=text
    )


    return response.embeddings[0].values


# --------------------------------------------------
# Generate multiple embeddings
# --------------------------------------------------

def generate_embeddings(
    chunks
) -> list[list[float]]:

    if not chunks:

        return []


    # --------------------------------------------------
    # Extract text
    # --------------------------------------------------

    if isinstance(
        chunks[0],
        dict
    ):

        texts = [
            chunk["text"]
            for chunk in chunks
        ]

    else:

        texts = chunks


    # --------------------------------------------------
    # Generate embeddings
    # --------------------------------------------------

    response = client.models.embed_content(

        model=EMBEDDING_MODEL,

        contents=texts
    )


    return [

        embedding.values

        for embedding
        in response.embeddings

    ]