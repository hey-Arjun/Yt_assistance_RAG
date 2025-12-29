from typing import List, Optional
from pydantic import BaseModel

class Citation(BaseModel):
    time: str
    title: str

class QueryResponse(BaseModel):
    answer: str
    citations: Optional[List[Citation]] = None
    remaining_queries: int
