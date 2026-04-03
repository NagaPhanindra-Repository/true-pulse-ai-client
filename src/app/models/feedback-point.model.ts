export interface FeedbackPoint {
  id?: number;
  type: 'LIKED' | 'LEARNED' | 'LACKED' | 'LONGED_FOR';
  description: string;
  retroId: number;
  createdAt?: string;
  updatedAt?: string;
  // Polling fields
  likes?: number;
  dislikes?: number;
  userVote?: 'LIKE' | 'DISLIKE' | null;
}
