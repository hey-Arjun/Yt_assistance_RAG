from pydantic import BaseModel

class QueryRequest(BaseModel):
    video_id: str
    question: str
    client_id: str