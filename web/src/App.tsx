import { useEffect, useState } from 'react';
import { DeleteConfirmDialog, ProjectForm, ProjectList } from './features/projects';
import { DeleteTaskDialog, TaskForm, TaskList } from './features/tasks';
import { useAppSelector } from './store/hooks';
import { selectSelectedProject } from './store/projectsSlice';
import type { ProjectWithTaskCount, Task } from './api/types';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithTaskCount | null>(null);

  const selectedProject = useAppSelector(selectSelectedProject);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    setShowTaskForm(false);
    setEditingTask(null);
    setDeletingTask(null);
  }, [selectedProject?.id]);

  function handleCloseForm() {
    setShowForm(false);
    setEditingProject(null);
  }

  function handleCloseTaskForm() {
    setShowTaskForm(false);
    setEditingTask(null);
  }

  return (
    <div>
      <h1>Project Todo Manager</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <button type="button" onClick={() => setShowForm(true)}>
            New Project
          </button>
          {(showForm || editingProject) && (
            <ProjectForm
              key={editingProject?.id ?? 'new'}
              project={editingProject ?? undefined}
              onClose={handleCloseForm}
            />
          )}
          <ProjectList onEdit={setEditingProject} onDelete={setDeletingProject} />
        </div>
        {selectedProject && (
          <div>
            <h2>{selectedProject.name}</h2>
            <button type="button" onClick={() => setShowTaskForm(true)}>
              New Task
            </button>
            {(showTaskForm || editingTask) && (
              <TaskForm
                key={editingTask?.id ?? 'new'}
                projectId={selectedProject.id}
                task={editingTask ?? undefined}
                onClose={handleCloseTaskForm}
              />
            )}
            <TaskList
              key={selectedProject.id}
              projectId={selectedProject.id}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
            />
          </div>
        )}
      </div>
      {deletingProject && (
        <DeleteConfirmDialog project={deletingProject} onClose={() => setDeletingProject(null)} />
      )}
      {deletingTask && (
        <DeleteTaskDialog task={deletingTask} onClose={() => setDeletingTask(null)} />
      )}
    </div>
  );
}

export default App;
