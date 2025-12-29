from app.llm.client import llm
from app.services.metadata_prompt import METADATA_PROMPT


def answer_from_metadata_with_citations(
    context: str,
    question: str,
    citations: list
) -> dict:
    cited_text = ""

    if citations:
        cited_text = "\n\nRELEVANT TIMESTAMPS:\n" + "\n".join(
            f"- {c['title']} at {c['time']}" for c in citations
        )

    prompt = METADATA_PROMPT.format(
        context=context + cited_text,
        question=question
    )

    res = llm.invoke(prompt)
    answer = res.content if hasattr(res, "content") else res

    return {
        "answer": answer,
        "citations": citations
    }
