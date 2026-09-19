import { ChatMessage, ChatRequestPayload } from "@/types/chat";

export const chatbotApi = {
  /**
   * Sends a user query to the contextual film intelligence assistant
   */
  async askQuestion(payload: ChatRequestPayload): Promise<ChatMessage> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(
        (errData as any)?.error || `Chat API error: ${response.status}`
      );
    }

    const data: { message: ChatMessage } = await response.json();
    return data.message;
  },
};
