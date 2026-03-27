from pydantic import BaseModel


class QueryRequest(BaseModel):
    video_id: str
    video_url: str
    question: str
    client_id: str
