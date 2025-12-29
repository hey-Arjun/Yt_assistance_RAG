def find_relevant_chapters(question: str, chapters: list, top_k: int = 3):
    if not chapters:
        return []

    q = question.lower()
    scored = []

    for c in chapters:
        title = c.get("title", "").lower()
        score = sum(1 for w in q.split() if w in title)
        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:top_k]]
