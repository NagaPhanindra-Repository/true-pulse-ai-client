export interface AiChatRequest {
  questionId: number;
  message: string;
}

export interface AiChatResponse {
  questionId: number;
  questionDetails: string;
  analysis: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  createdAt?: number;
}
