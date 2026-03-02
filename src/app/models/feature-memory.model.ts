export interface FeatureMemory {
  id: string;
  userId: string;
  jiraIntegrationId: string;
  jiraStoryKey: string;
  jiraStoryTitle: string;
  jiraStoryDescription?: string;
  initialDescription: string;
  status: MemoryStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  discussionCount?: number;
}

export type MemoryStatus = 'active' | 'completed' | 'archived';

export interface FeatureMemoryDetail extends FeatureMemory {
  jiraStoryType: string;
  jiraAssignee?: string;
  jiraStatus: string;
  discussions: MemoryDiscussion[];
  branches: GitBranch[];
}

export interface CreateMemoryRequest {
  title: string;
  description: string;
  jiraIntegrationId?: string;
  jiraStoryKey: string;
  jiraStoryUrl?: string;
  project?: string;
  assignee?: string;
  linkedBranch?: string;
  branchName?: string;
  status?: MemoryStatus;
}

export interface UpdateMemoryRequest {
  initialDescription?: string;
  status?: MemoryStatus;
}

export interface MemoryFilter {
  status?: MemoryStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface MemoryDiscussion {
  id: string;
  featureMemoryId: string;
  userId: string;
  discussionText: string;
  decisionType: DecisionType;
  tags: string[];
  meetingDate?: Date;
  recordedAt: Date;
  updatedAt: Date;
  authorName?: string;
  attachments?: MemoryAttachment[];
}

export type DecisionType = 
  | 'requirement' 
  | 'edge-case' 
  | 'change' 
  | 'conflict' 
  | 'clarification';

export interface AddDiscussionRequest {
  discussionText: string;
  decisionType: DecisionType;
  tags: string[];
  meetingDate?: Date;
}

export interface MemoryAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: Date;
}

export interface GitBranch {
  id: string;
  branchName: string;
  repositoryUrl?: string;
  createdAt: Date;
}

export const DecisionTypeLabels: Record<DecisionType, string> = {
  'requirement': 'Requirement',
  'edge-case': 'Edge Case',
  'change': 'Change',
  'conflict': 'Conflict',
  'clarification': 'Clarification'
};

export const DecisionTypeColors: Record<DecisionType, string> = {
  'requirement': '#3b82f6',
  'edge-case': '#f59e0b',
  'change': '#8b5cf6',
  'conflict': '#ef4444',
  'clarification': '#10b981'
};
