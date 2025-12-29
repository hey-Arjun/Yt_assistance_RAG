from enum import Enum

class AnswerMode(str, Enum):
    TRANSCRIPT = "transcript"
    STRUCTURE = "structure"
    METADATA = "metadata"
