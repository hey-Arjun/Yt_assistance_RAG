# app/main.py

import app.config  # loads .env

from fastapi import FastAPI
from app.api.ask import router as ask_router
from app.services.youtube_metadata import get_video_metadata
from app.services.youtube_comments import get_top_comments, select_top_comments
from app.services.comments_summary import summarize_comments
from app.services.youtube_chapters import extract_chapters_from_description

app = FastAPI(title="YouTube Assistant Backend")

@app.get("/")
def health_check():
    return {"status": "YT Assistant Backend Running"}

# Existing router
app.include_router(ask_router)

# ---------- YouTube APIs (DIRECT, STABLE) ----------

@app.get("/youtube/metadata/{video_id}")
def youtube_metadata(video_id: str):
    return get_video_metadata(video_id)

@app.get("/youtube/comments/{video_id}")
def youtube_comments(video_id: str):
    return get_top_comments(video_id)

@app.get("/youtube/test")
def yt_test():
    return {"youtube": "ok"}

@app.get("/youtube/comments-summary/{video_id}")
def comments_summary(video_id: str):
    comments = get_top_comments(video_id)
    top_texts = select_top_comments(comments, top_n=10)
    summary = summarize_comments(top_texts)
    return {
        "summary": summary,
        "source_comments": len(top_texts)
    }

@app.get("/youtube/chapters/{video_id}")
def youtube_chapters(video_id: str):
    meta = get_video_metadata(video_id)
    description = meta.get("description", "")

    chapters = extract_chapters_from_description(description)

    return {
        "video_id": video_id,
        "chapters": chapters,
        "count": len(chapters)
    }