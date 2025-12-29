from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


def get_retriever(vector_store):
    return vector_store.as_retriever(
        search_type = "similarity",
        search_kwargs = {"k": 4}
    )

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

PROMPT_TEMPLATE = """
You are a helpful assistant answering questions based only on the provided context.

Context: {context}

Question: {question}

Instructions:
- Answer clearly  and concisely
- If the answer is not in the context, say "I don't know based on this video"
"""


def build_rag_chain(retriever):
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.2
    )

    prompt = PromptTemplate(
        template=PROMPT_TEMPLATE,
        input_variables=["context", "question"]
    )

    chain = (
        RunnableParallel(
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough(),
            }
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain
