export interface LocalIssue {
  id?: number;
  number?: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  labels?: string[];
  assignee?: string;
  created_at: string;
  updated_at: string;
  local_id?: string; // For tracking local-only issues
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ name: string }>;
  assignee: { login: string } | null;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  unchanged: number;
  errors: string[];
}