from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.chat import router as chat_router
from app.routes.documents import router as documents_router


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="FileMind AI",
    description="Multi-format RAG document assistant using Gemini embeddings, ChromaDB and Gemini LLM",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
    "http://localhost:5173",
    "https://filemind-ai-frontend.onrender.com"
],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# --------------------------------------------------
# Routes
# --------------------------------------------------

app.include_router(
    upload_router
)

app.include_router(
    chat_router
)

app.include_router(
    documents_router
)


# --------------------------------------------------
# Root
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "FileMind AI API is running"
    }


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }