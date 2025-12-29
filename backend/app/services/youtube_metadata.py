import requests
from app.config import YOUTUBE_API_KEY

YOUTUBE_VIDEO_API = "https://www.googleapis.com/youtube/v3/videos"

def get_video_metadata(video_id: str) -> dict:
    params = {
        "part": "snippet",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }

    r = requests.get(YOUTUBE_VIDEO_API, params=params)
    r.raise_for_status()

    items = r.json().get("items",[])
    if not items:
        return {}
    snippet = items[0]["snippet"]

    return {
        "title": snippet["title"],
        "description": snippet["description"],
        "channel": snippet["channelTitle"],
        "published_at": snippet["publishedAt"]
    }
