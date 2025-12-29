from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS


def build_vector_store(chunks):
    embeddings = OpenAIEmbeddings(
        model = "text-embedding-3-small"
    )
    vector_store = FAISS.from_texts(chunks, embedding = embeddings)
    return vector_store
