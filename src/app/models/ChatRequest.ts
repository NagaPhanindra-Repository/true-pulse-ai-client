import { ChatMessage } from './ChatMessage';

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}
