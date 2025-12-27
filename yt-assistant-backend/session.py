import time

SESSION_TTL = 30 * 60   # 30min
session_store = {}

def get_session_key(client_id: str, video_id: str) -> str:
    return f"{client_id}:{video_id}"

def get_cached_vector_store(client_id: str, video_id: str):
    key = get_session_key(client_id, video_id)
    record = session_store.get(key)

    if record:
        record["last_used"] = time.time()
        return record["vector_store"]
    return None

def set_cached_vector_store(client_id: str, video_id: str, vector_store):
    key = get_session_key(client_id, video_id)
    session_store[key] = {
        "vectore_store": vector_store,
        "last_used": time.time()
    }

def cleanup_sessions():
    now = time.time()
    expired_keys = [
        key for key, record in session_store.items()
        if now - record["last_used"] > SESSION_TTL
    ]
    for key in expired_keys:
        del session_store[key]