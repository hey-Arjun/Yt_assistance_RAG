import sqlite3
import json
import logging
import os

logger = logging.getLogger(__name__)

DB_PATH = "cache.db"

def init_db():
    """Initializes the SQLite database for caching."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_cache (
            video_id TEXT PRIMARY KEY,
            data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Run initialization on module load
init_db()

def get_cached_data(video_id: str):
    """Retrieves processed video data from the cache."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT data FROM video_cache WHERE video_id = ?", (video_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            logger.info(f"[CACHE] Hit for video_id: {video_id}")
            return json.loads(row[0])
        
        logger.info(f"[CACHE] Miss for video_id: {video_id}")
        return None
    except Exception as e:
        logger.error(f"[CACHE ERROR] Get failed: {e}")
        return None

def set_cache_data(video_id: str, result_dict: dict):
    """Stores the final processed result (transcript + metadata) into the cache."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Use REPLACE to update if the ID already exists
        cursor.execute(
            "REPLACE INTO video_cache (video_id, data) VALUES (?, ?)",
            (video_id, json.dumps(result_dict))
        )
        conn.commit()
        conn.close()
        logger.info(f"[CACHE] Data saved for video_id: {video_id}")
    except Exception as e:
        logger.error(f"[CACHE ERROR] Set failed: {e}")