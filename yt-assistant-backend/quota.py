from datetime import date
from fastapi import HTTPException

QUERY_LIMIT =  10

# cliend_id -> {"date":date, "time":int}
client_usage = {}

def check_and_update_quota(client_id: str) -> int:
    today = date.today()

    if client_id not in client_usage:
        client_usage[client_id] = {"date": today, "count": 0}
    record = client_usage[client_id]

    if record["date"] != today:
        record["date"] = today
        record["count"] = 0
    
    if record["count"] >= QUERY_LIMIT:
        raise HTTPExeption(
            status_code = 429,
            detail = "Daily query limit exceeded"
        )
    record["count"] += 1
    return QUERY_LIMIT - record["count"]