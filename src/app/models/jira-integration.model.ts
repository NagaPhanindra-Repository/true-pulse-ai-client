export interface JiraIntegration {
  id: string;
  userId: string;
  name?: string;
  jiraUrl: string;
  baseUrl?: string;
  jiraEmail: string;
  projectKeys: string[];
  projects?: JiraProject[];
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface JiraIntegrationRequest {
  name?: string;
  jiraUrl: string;
  jiraEmail: string;
  apiToken: string;
}

export interface ConnectionTestResult {
  success: boolean;
  availableProjects: JiraProject[];
  error?: string;
}

export interface JiraProject {
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraStory {
  id: string;
  key: string;
  summary: string;
  description?: string;
  type?: string;
  issueType?: string;
  status: string;
  project?: string;
  assignee?: string;
  url?: string;
  labels?: string[];
  created: Date;
  updated: Date;
}
