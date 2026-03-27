import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ask import router as ask_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="YouTube Assistant RAG Backend",
    description="Production-ready RAG pipeline with ChromaDB and Whisper fallback",
    version="2.0.0"
)

# Middlleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

# 1. Health check
@app.get("/")
def health_check():
    return{
        "status": "healthy",
        "service": "YT Assistant Backend",
        "database": "ChromaDB Connected"
    }

# 2. unified AI Assistant
app.include_router(ask_router)

# 3. Direct youtube utilities
@app.get("/youtube/test", tags=["debug"])
def yt_test():
    return {"status": "ok", "message": "YouTube API Connectivity Active"}