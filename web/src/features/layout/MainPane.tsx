import { useEffect, useState } from 'react';
import { DeleteTaskDialog, TaskForm, TaskList } from '../tasks';
import { useAppSelector } from '../../store/hooks';
import { selectLabels } from '../../store/labelsSlice';
import { selectSelectedProject } from '../../store/projectsSlice';
import { selectCurrentSmartList } from '../../store/tasksSlice';
import type { Task } from '../../api/types';

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

function MainPane() {
  const selectedProject = useAppSelector(selectSelectedProject);
  const currentSmartList = useAppSelector(selectCurrentSmartList);
  const labels = useAppSelector(selectLabels);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  useEffect(() => {
    setShowTaskForm(false);
    setEditingTask(null);
    setDeletingTask(null);
  }, [selectedProject?.id, currentSmartList]);

  function handleCloseTaskForm() {
    setShowTaskForm(false);
    setEditingTask(null);
  }

  return (
    <main className="main-pane">
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
      {!selectedProject && currentSmartList === null && (
        <p className="main-pane-empty">Select a project or smart list to see its tasks.</p>
      )}
      {deletingTask && (
        <DeleteTaskDialog task={deletingTask} onClose={() => setDeletingTask(null)} />
      )}
    </main>
  );
}

export default MainPane;
