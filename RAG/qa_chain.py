"""
Grounded Question-Answering Engine with Groq LLM and Conversational Memory.
"""
from typing import Dict, Any, List, Optional, Tuple
import os
import time

from RAG.config import GROQ_API_KEY, GROQ_RAG_MODEL, GROQ_FALLBACK_MODEL
from RAG.retriever import FilmRetriever
from RAG.prompt_templates import SYSTEM_PROMPT_FILM_ASSISTANT, USER_PROMPT_TEMPLATE
from RAG.schemas.query_schema import RAGQueryResponse, SourceCitation


class FilmQAEngine:
    """
    Executes grounded film analysis Q&A using Groq LLM and film-isolated retrieval.
    """
    def __init__(
        self,
        retriever: Optional[FilmRetriever] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ):
        self.retriever = retriever or FilmRetriever()
        self.api_key = api_key or GROQ_API_KEY
        self.model_name = model_name or GROQ_RAG_MODEL
        self._groq_client = None
        
        # Memory storage: {(conversation_id, film_id): List[{"role": str, "content": str}]}
        self._conversations: Dict[Tuple[str, str], List[Dict[str, str]]] = {}

    def _get_groq_client(self):
        if self._groq_client is None and self.api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"[FilmQAEngine] Error initializing Groq client: {e}")
        return self._groq_client

    def _format_conversation_history(self, conv_key: Tuple[str, str], max_turns: int = 4) -> str:
        """Formats recent conversational turns into text."""
        history = self._conversations.get(conv_key, [])
        if not history:
            return "None (First turn in this conversation)"

        recent = history[-max_turns:]
        lines = []
        for msg in recent:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content']}")
        return "\n".join(lines)

    def _record_message(self, conv_key: Tuple[str, str], role: str, content: str):
        """Records a user or assistant message in conversational memory."""
        if conv_key not in self._conversations:
            self._conversations[conv_key] = []
        self._conversations[conv_key].append({"role": role, "content": content})
        # Keep maximum 10 recent messages
        if len(self._conversations[conv_key]) > 10:
            self._conversations[conv_key] = self._conversations[conv_key][-10:]

    def ask(
        self,
        film_id: str,
        question: str,
        conversation_id: Optional[str] = None,
        film_name: Optional[str] = None,
        top_k: int = 5
    ) -> RAGQueryResponse:
        """
        Executes grounded QA flow:
        1. Query film-specific vector index
        2. Format retrieved context
        3. Assemble conversation history
        4. Send prompt to Groq LLM
        5. Return grounded answer + sources
        """
        film_id_str = str(film_id).strip()
        conv_id_str = str(conversation_id or f"conv_{film_id_str}").strip()
        conv_key = (conv_id_str, film_id_str)

        # Check if film is indexed
        if not self.retriever.vector_store.is_indexed(film_id_str):
            return RAGQueryResponse(
                success=False,
                film_id=film_id_str,
                conversation_id=conv_id_str,
                question=question,
                answer=(
                    f"No analysis knowledge base found for film ID '{film_id_str}'. "
                    "Please run the FilmyAI report pipeline first to index this film."
                ),
                sources=[],
                error="FILM_NOT_INDEXED"
            )

        # 1. Retrieve film-specific chunks
        retrieved_chunks = self.retriever.retrieve(
            film_id=film_id_str,
            query=question,
            top_k=top_k
        )

        sources = self.retriever.format_sources(retrieved_chunks)
        context_str = self.retriever.assemble_context(retrieved_chunks)
        history_str = self._format_conversation_history(conv_key)

        # Determine film title from retrieved chunks if not provided
        effective_film_name = film_name
        if not effective_film_name and retrieved_chunks:
            effective_film_name = retrieved_chunks[0][0].film_name
        effective_film_name = effective_film_name or "Film Under Analysis"

        # 2. Build Groq User Prompt
        user_prompt = USER_PROMPT_TEMPLATE.format(
            film_name=effective_film_name,
            context=context_str,
            conversation_history=history_str,
            question=question
        )

        # 3. Call Groq API
        client = self._get_groq_client()
        answer = ""

        if client:
            # Try primary model, fallback if needed
            for model_candidate in [self.model_name, GROQ_FALLBACK_MODEL, "openai/gpt-oss-20b", "groq/compound-mini"]:
                try:
                    chat_completion = client.chat.completions.create(
                        model=model_candidate,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT_FILM_ASSISTANT},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.2,
                        max_tokens=800
                    )
                    content = chat_completion.choices[0].message.content
                    if content and content.strip():
                        answer = content.strip()
                        break
                except Exception as e:
                    print(f"[FilmQAEngine] Groq model '{model_candidate}' failed: {e}")
                    continue

        # 4. Fallback if Groq call failed or no API key
        if not answer:
            if not retrieved_chunks:
                answer = "The generated FilmyAI analysis does not contain enough information to answer this question."
            else:
                # Direct synthesis from top retrieved chunk
                top_chunk, score = retrieved_chunks[0]
                answer = (
                    f"According to the FilmyAI {top_chunk.section} ({top_chunk.subsection or 'Overview'}):\n\n"
                    f"{top_chunk.content}"
                )

        # 5. Record conversational turn
        self._record_message(conv_key, "user", question)
        self._record_message(conv_key, "assistant", answer)

        return RAGQueryResponse(
            success=True,
            film_id=film_id_str,
            conversation_id=conv_id_str,
            question=question,
            answer=answer,
            sources=sources
        )
