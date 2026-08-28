import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchTasksByProject,
  selectFilteredSortedTasks,
  selectTasksError,
  selectTasksLoading,
  toggleComplete,
} from '../../store/tasksSlice';
import type { Task } from '../../api/types';
import FilterSortControls from './FilterSortControls';

interface TaskListProps {
  projectId: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskList({ projectId, onEdit, onDelete }: TaskListProps) {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectFilteredSortedTasks);
  const loading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);

  useEffect(() => {
    dispatch(fetchTasksByProject(projectId));
  }, [dispatch, projectId]);

  if (loading && tasks.length === 0) {
    return <p>Loading tasks...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  return (
    <>
      <FilterSortControls />
      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                aria-label={
                  task.completed
                    ? `Mark "${task.title}" incomplete`
                    : `Mark "${task.title}" complete`
                }
                checked={task.completed}
                onChange={() => dispatch(toggleComplete(task))}
                style={{ width: '1.1rem', height: '1.1rem', borderRadius: '50%' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.title}
                </div>
                {task.note && <div style={{ fontSize: '0.85em', color: '#666' }}>{task.note}</div>}
                {task.labels && task.labels.length > 0 && (
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}
                  >
                    {task.labels.map((label) => (
                      <span
                        key={label.id}
                        style={{
                          background: label.color ?? '#ccc',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75em',
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(task)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default TaskList;
