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

export interface TaskWithProject extends Task {
  project_name: string;
}
