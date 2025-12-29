from fastapi import APIRouter, HTTPException

from app.schemas.request import QueryRequest
from app.schemas.response import QueryResponse

from app.services.context_builder import (
    build_context,
    build_metadata_context,
    detect_answer_mode,
)
from app.services.chapter_matcher import find_relevant_chapters
from app.services.metadata_answer import answer_from_metadata_with_citations

from app.services.quota_service import check_and_update_quota
from app.services.session_service import (
    get_cached_vector_store,
    set_cached_vector_store,
    cleanup_sessions,
)

from app.core.modes import AnswerMode
from app.core.formatters import enforce_linewise_numbering

# RAG imports
from app.rag.chunking import split_transcript
from app.rag.vector_store import build_vector_store
from app.rag.retriever import get_retriever, build_rag_chain

router = APIRouter()


# -----------------------------
# Helper: detect list intent
# -----------------------------
def is_list_question(question: str) -> bool:
    keywords = [
        "generate", "list", "questions",
        "points", "steps", "give me"
    ]
    return any(k in question.lower() for k in keywords)


@router.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    remaining = check_and_update_quota(request.client_id)
    cited_chapters = None

    try:
        # 1️⃣ Build unified context
        context = build_context(request.video_id)

        # 2️⃣ Decide answer mode (FIXED)
        transcript_data = context.get("transcript") or {}
        has_transcript = bool(transcript_data.get("text"))

        mode = detect_answer_mode(has_transcript)

        # =============================
        # TRANSCRIPT MODE (RAG)
        # =============================
        if mode == AnswerMode.TRANSCRIPT:
            cleanup_sessions()

            vector_store = get_cached_vector_store(
                request.client_id,
                request.video_id
            )

            if vector_store is None:
                transcript_data = context["transcript"]
                transcript_text = transcript_data["text"]

                chunks = split_transcript(transcript_text)
                vector_store = build_vector_store(chunks)

                set_cached_vector_store(
                    request.client_id,
                    request.video_id,
                    vector_store
                )

            retriever = get_retriever(vector_store)
            rag_chain = build_rag_chain(retriever)

            answer = rag_chain.invoke(request.question)

        # =============================
        # METADATA MODE
        # =============================
        elif mode == AnswerMode.METADATA:
            metadata_context = build_metadata_context(
                title=context.get("title"),
                description=context.get("description"),
                chapters=context.get("timestamps"),
                comments_summary=context.get("comments"),
            )

            citations = find_relevant_chapters(
                request.question,
                context.get("timestamps") or []
            )

            result = answer_from_metadata_with_citations(
                metadata_context,
                request.question,
                citations
            )

            answer = result["answer"]
            cited_chapters = result["citations"]

        else:
            raise HTTPException(
                status_code=400,
                detail="Unable to determine answer mode"
            )

        # =============================
        # FORMAT ENFORCEMENT (CRITICAL)
        # =============================
        if is_list_question(request.question):
            answer = enforce_linewise_numbering(answer)

        return {
            "answer": answer,
            "citations": cited_chapters,
            "remaining_queries": remaining,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
