export type ChatRole = "user" | "assistant" | "system";

export interface ChatSource {
  section: string;
  subsection?: string;
  relevance_score?: number;
  chunk_id?: string;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  sources?: ChatSource[];
}

export interface ChatRequestPayload {
  film_id?: string;
  filmTitle: string;
  conversation_id?: string;
  reportContext?: Record<string, unknown>;
  query: string;
  history?: ChatMessage[];
}

