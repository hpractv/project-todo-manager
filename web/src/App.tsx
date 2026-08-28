import { useEffect, useState } from 'react';
import { DeleteConfirmDialog, ProjectForm, ProjectList } from './features/projects';
import { DeleteTaskDialog, TaskForm, TaskList } from './features/tasks';
import { DeleteLabelDialog, LabelForm, LabelList } from './features/labels';
import { SmartListsSidebar } from './features/smartlists';
import { useAppSelector } from './store/hooks';
import { selectLabels } from './store/labelsSlice';
import { selectSelectedProject } from './store/projectsSlice';
import { selectCurrentSmartList } from './store/tasksSlice';
import type { Label, ProjectWithTaskCount, Task } from './api/types';

function smartListTitle(
  currentSmartList: ReturnType<typeof selectCurrentSmartList>,
  labels: ReturnType<typeof selectLabels>,
): string {
  if (currentSmartList === 'all') return 'All';
  if (currentSmartList === 'completed') return 'Completed';
  if (typeof currentSmartList === 'number') {
    return labels.find((label) => label.id === currentSmartList)?.name ?? 'Label';
  }
  return '';
}

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithTaskCount | null>(null);

  const selectedProject = useAppSelector(selectSelectedProject);
  const currentSmartList = useAppSelector(selectCurrentSmartList);
  const labels = useAppSelector(selectLabels);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);

  useEffect(() => {
    setShowTaskForm(false);
    setEditingTask(null);
    setDeletingTask(null);
  }, [selectedProject?.id, currentSmartList]);

  function handleCloseForm() {
    setShowForm(false);
    setEditingProject(null);
  }

  function handleCloseTaskForm() {
    setShowTaskForm(false);
    setEditingTask(null);
  }

  function handleCloseLabelForm() {
    setShowLabelForm(false);
    setEditingLabel(null);
  }

  return (
    <div>
      <h1>Project Todo Manager</h1>
      <div>
        <button type="button" onClick={() => setShowLabelManager((current) => !current)}>
          {showLabelManager ? 'Hide Labels' : 'Manage Labels'}
        </button>
        {showLabelManager && (
          <div>
            <button type="button" onClick={() => setShowLabelForm(true)}>
              New Label
            </button>
            {(showLabelForm || editingLabel) && (
              <LabelForm
                key={editingLabel?.id ?? 'new'}
                label={editingLabel ?? undefined}
                onClose={handleCloseLabelForm}
              />
            )}
            <LabelList onEdit={setEditingLabel} onDelete={setDeletingLabel} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div>
          <SmartListsSidebar />
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
        {!selectedProject && currentSmartList !== null && (
          <div>
            <h2>{smartListTitle(currentSmartList, labels)}</h2>
            {editingTask && (
              <TaskForm
                key={`smart-task-${editingTask.id}`}
                projectId={editingTask.project_id}
                task={editingTask}
                onClose={handleCloseTaskForm}
              />
            )}
            <TaskList
              key={`smart-${currentSmartList}`}
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
      {deletingLabel && (
        <DeleteLabelDialog label={deletingLabel} onClose={() => setDeletingLabel(null)} />
      )}
    </div>
  );
}

export default App;
