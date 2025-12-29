from app.llm.client import llm

SUMMARY_PROMPT = """You are given top YouTube comments.
Summarize into:
- Overall sentiment (one word)
- 3–5 key audience insights (bullets)
Keep it concise.

Comments:
{comments}
"""

def summarize_comments(comment_texts: list[str]) -> str:
    prompt = SUMMARY_PROMPT.format(
        comments="\n".join(f"- {c}" for c in comment_texts)
    )

    res = llm.invoke(prompt)
    return res.content if hasattr(res, "content") else res
