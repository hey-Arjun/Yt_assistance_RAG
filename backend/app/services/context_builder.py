from app.core.modes import AnswerMode

from app.services.youtube_metadata import get_video_metadata
from app.services.youtube_comments import get_top_comments, select_top_comments
from app.services.youtube_chapters import extract_chapters_from_description
from app.services.comments_summary import summarize_comments
from app.services.transcript_service import get_video_transcript


def build_context(video_id: str) -> dict:
    """
    Build all available context for a video.
    Some fields may be None.
    """

    context = {
        "title": None,
        "description": None,
        "channel": None,
        "comments_summary": None,
        "timestamps": None,
        "transcript": None,
    }

    # --------------------
    # Metadata
    # --------------------
    try:
        meta = get_video_metadata(video_id)
        context["title"] = meta.get("title")
        context["description"] = meta.get("description")
        context["channel"] = meta.get("channel")
    except Exception:
        pass

    # --------------------
    # Chapters (FIXED)
    # --------------------
    try:
        if context["description"]:
            context["timestamps"] = extract_chapters_from_description(
                context["description"]
            )
    except Exception:
        pass

    # --------------------
    # Comments → Summary
    # --------------------
    try:
        comments = get_top_comments(video_id)
        top_texts = select_top_comments(comments, top_n=10)
        context["comments_summary"] = summarize_comments(top_texts)
    except Exception:
        pass

    # --------------------
    # Transcript
    # --------------------
    try:
        context["transcript"] = get_video_transcript(video_id)
    except Exception:
        context["transcript"] = None

    return context


def build_metadata_context(
    title: str,
    description: str,
    chapters: list,
    comments_summary: str
) -> str:
    parts = []

    if title:
        parts.append(f"TITLE:\n{title}")

    if description:
        parts.append(f"DESCRIPTION:\n{description[:1500]}")

    if chapters:
        ch = "\n".join(f"- {c['title']} ({c['time']})" for c in chapters)
        parts.append(
            "TOPICS COVERED IN THE VIDEO (from chapters):\n" + ch
        )

    if comments_summary:
        parts.append(f"COMMENTS INSIGHTS:\n{comments_summary}")

    return "\n\n".join(parts)


def detect_answer_mode(has_transcript: bool) -> AnswerMode:
    return AnswerMode.TRANSCRIPT if has_transcript else AnswerMode.METADATA
