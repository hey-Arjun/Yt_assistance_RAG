from datetime import date
from fastapi import HTTPException

QUERY_LIMIT = 10

# client_id -> {"date": date, "count": int}
client_usage = {}


def check_and_update_quota(client_id: str) -> int:
    today = date.today()

    if client_id not in client_usage:
        client_usage[client_id] = {"date": today, "count": 0}

    record = client_usage[client_id]

    # Reset quota if day has changed
    if record["date"] != today:
        record["date"] = today
        record["count"] = 0

    # Enforce limit
    if record["count"] >= QUERY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Daily query limit exceeded"
        )

    record["count"] += 1
    return QUERY_LIMIT - record["count"]
