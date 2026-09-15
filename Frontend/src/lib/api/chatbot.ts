import axios from "axios";
import { ChatMessage, ChatRequestPayload } from "@/types/chat";

export const chatbotApi = {
  /**
   * Sends a user query to the contextual film intelligence assistant
   */
  async askQuestion(payload: ChatRequestPayload): Promise<ChatMessage> {
    const response = await axios.post<{ message: ChatMessage }>("/api/chat", payload);
    return response.data.message;
  },
};
