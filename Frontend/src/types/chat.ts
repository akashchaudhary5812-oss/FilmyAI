export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ChatRequestPayload {
  filmTitle: string;
  reportContext?: Record<string, unknown>;
  query: string;
  history?: ChatMessage[];
}
