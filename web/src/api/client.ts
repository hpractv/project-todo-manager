import type {
  Label,
  LabelInput,
  Project,
  ProjectInput,
  ProjectWithTaskCount,
  Task,
  TaskInput,
} from './types';

// Empty default uses same-origin `/api` paths so the Vite dev-server proxy
// forwards them. That avoids CORS failures when Vite is not on port 5173.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.error === 'string' ? body.error : response.statusText;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function fetchProjects(): Promise<ProjectWithTaskCount[]> {
  return request<ProjectWithTaskCount[]>('/api/projects');
}

export function fetchProject(id: number): Promise<Project> {
  return request<Project>(`/api/projects/${id}`);
}

export function createProject(data: ProjectInput): Promise<Project> {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProject(id: number, data: ProjectInput): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: number): Promise<void> {
  return request<void>(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

export function fetchTasks(projectId: number): Promise<Task[]> {
  return request<Task[]>(`/api/projects/${projectId}/tasks`);
}

export function createTask(projectId: number, data: TaskInput): Promise<Task> {
  return request<Task>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(
  id: number,
  data: Partial<TaskInput> & { completed?: boolean },
): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

export function fetchLabels(): Promise<Label[]> {
  return request<Label[]>('/api/labels');
}

export function createLabel(data: LabelInput): Promise<Label> {
  return request<Label>('/api/labels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateLabel(id: number, data: Partial<LabelInput>): Promise<Label> {
  return request<Label>(`/api/labels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteLabel(id: number): Promise<void> {
  return request<void>(`/api/labels/${id}`, {
    method: 'DELETE',
  });
}

export function setTaskLabels(taskId: number, labelIds: number[]): Promise<Task> {
  return request<Task>(`/api/tasks/${taskId}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ label_ids: labelIds }),
  });
}
