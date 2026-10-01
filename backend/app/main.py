from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.chat import router as chat_router
from app.routes.documents import router as documents_router
app = FastAPI(
    title="FileMind AI",
    description="Multi-format RAG application using Ollama embeddings and Gemini LLM",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routes
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(documents_router)

@app.get("/")
def root():
    return {
        "message": "FileMind AI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }