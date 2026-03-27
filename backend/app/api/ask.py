from fastapi import APIRouter, HTTPException
import logging

from app.schemas.request import QueryRequest
from app.schemas.response import QueryResponse

# New Unified Services
from app.services.rag_service import RAGService 
from app.services.orchestrator import Orchestrator
from app.services.youtube_service import find_relevant_chapters
from app.services.quota_service import check_and_update_quota

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
rag_service = RAGService()
orchestrator = Orchestrator()

@router.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    """
    The main RAG endpoint.
    1. Checks Quota
    2. Ensures video is processed/ingested
    3. Retrieves context and generates answer
    """
    # 1. Budget Protection: Check and Update Quota
    try:
        remaining = check_and_update_quota(request.client_id)
    except HTTPException as e:
        raise e

    try:
        # 2. Ingestion Check: 
        # Before querying, we must ensure the video content is in ChromaDB.
        # orchestrator.process_video handles caching, so this is very fast after the first time.
        video_data = await orchestrator.process_video(request.video_id, request.video_url)
        
        if not video_data or not video_data.get("text"):
            raise HTTPException(status_code=404, detail="Could not retrieve content for this video.")

        # 3. Vector Ingestion:
        # Pass the combined text into ChromaDB (it will skip if already exists).
        rag_service.ingest_video(request.video_id, video_data["text"])

        # 4. Keyword Citations (Heuristic Fallback):
        # We look for relevant chapters/timestamps to provide quick links.
        metadata = video_data.get("metadata", {})
        chapters = metadata.get("chapters", []) # Ensure your youtube_service uses this key
        cited_chapters = find_relevant_chapters(request.question, chapters)

        # 5. RAG Retrieval & Generation:
        # This uses the persistent ChromaDB and the LangChain pipeline.
        answer = rag_service.get_answer(request.video_id, request.question)

        # 6. Response
        return {
            "answer": answer,
            "citations": cited_chapters,
            "remaining_queries": remaining,
        }

    except Exception as e:
        logger.error(f"[ASK API ERROR] {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred while processing your request.")