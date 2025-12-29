import requests
from app.config import YOUTUBE_API_KEY

COMMENTS_API = "https://www.googleapis.com/youtube/v3/commentThreads"

def get_top_comments(video_id: str, max_results: int = 30):
    params = {
        "part": "snippet",
        "videoId": video_id,
        "maxResults": max_results,
        "order": "relevance",
        "textFormat": "plainText",
        "key": YOUTUBE_API_KEY,
    }

    r = requests.get(COMMENTS_API, params=params)
    r.raise_for_status()

    items = r.json().get("items",[])
    comments = []

    for item in items:
        top = item["snippet"]["topLevelComment"]["snippet"]
        comments.append({
            "text": top["textDisplay"],
            "likes": top["likeCount"],
        })
    
    return comments

def select_top_comments(comments, top_n=10):
    comments = sorted(comments, key=lambda x: x["likes"], reverse=True)
    return [c["text"] for c in comments[:top_n]]