import re

TIMESTAMP_REGEX = re.compile(
    r'(?P<time>(?:\d{1,2}:)?\d{1,2}:\d{2})\s*-?\s*(?P<title>.+)'
)

def extract_chapters_from_description(description: str):
    chapters = []

    for line in description.splitlines():
        line = line.strip()
        if not line:
            continue

        match = TIMESTAMP_REGEX.search(line)
        if match:
            chapters.append({
                "time": match.group("time"),
                "title": match.group("title").lstrip(")-. ").strip()
            })

    return chapters
