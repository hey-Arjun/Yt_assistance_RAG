from fastapi import APIRouter, HTTPException
import logging

from app.schemas.request import QueryRequest
from app.schemas.response import QueryResponse

# New Unified Services
from app.services.rag_service import RAGService
from app.services.orchestrator import Orchestrator
from app.services.youtube_service import find_relevant_chapters
from app.services.quota_service  import check_and_update_quota

