import re

def enforce_linewise_numbering(text: str) -> str:
    """
    Forces numbered items into separate lines.
    Handles outputs like:
    '1. A 2. B 3. C'
    """

    pattern = r'(\d+\.\s*.*?)(?=\s*\d+\.|$)'
    matches = re.findall(pattern, text, flags=re.DOTALL)

    cleaned = [m.strip() for m in matches]

    return "\n".join(cleaned)
