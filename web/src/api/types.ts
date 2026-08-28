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

export interface Task {
  id: number;
  project_id: number;
  title: string;
  note: string | null;
  completed: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  note?: string | null;
}
