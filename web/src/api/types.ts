export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProjectWithTaskCount extends Project {
  task_count: number;
}

export interface ProjectInput {
  name: string;
  description?: string | null;
}
