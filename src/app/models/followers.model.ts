export interface FollowerUser {
  username: string;
  firstName: string;
  lastName: string;
}

export interface LoggedInUserAnswerDto {
  answerId: number;
  answerContent: string;
  answerCreatedAt: string;
  answerUpdatedAt: string;
}

export interface FollowedUserQuestion {
  questionId: number;
  questionTitle: string;
  questionDescription: string;
  questionCreatorUsername: string;
  questionCreatorFirstName: string;
  questionCreatorLastName: string;
  questionCreatedAt: string;
  loggedInUserAnswer: LoggedInUserAnswerDto | null;
  totalAnswersCount: number;
}

export interface CreateAnswerRequest {
  userId: number;   
  content: string;
  questionId: number;
  username: string;
}

export interface CreateAnswerResponse {
  id: number;
  content: string;
  questionId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  username: string;
}
