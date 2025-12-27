from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rag import answer_question
from models import QueryRequest
from quota import check_and_update_quota

app = FastAPI()


@app.get("/")
def health_check():
    return {"status":"YT Assistant BAckend Running"}

@app.post("/ask")
def ask_question(request: QueryRequest):
    remaining = check_and_update_quota(request.client_id)
    try:
        answer = answer_question(
            request.video_id,
            request.question,
            request.client_id
        )
        return {"answer": answer,
                "remaining_queries": remaining
        }
    except  ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
       raise HTTPException(
           status_code=500,
           detail= str(e)
       )