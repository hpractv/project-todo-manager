import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchTasksByProject,
  selectCurrentSmartList,
  selectFilteredSortedTasks,
  selectTasksError,
  selectTasksLoading,
  toggleComplete,
} from '../../store/tasksSlice';
import type { Task, TaskWithProject } from '../../api/types';
import FilterSortControls from './FilterSortControls';
import '../../styles/task-row.css';

interface TaskListProps {
  projectId?: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

// Must outlast the CSS enter animation (150ms in task-row.css) plus the
// follow-up setTaskLabels dispatch that TaskForm always fires after
// createTask, which replaces the same task object and re-renders the row
// mid-animation. Marking an id "seen" is time-based, not render-based, so
// that intervening re-render can't strip the enter class before it's visible.
const ENTER_ANIMATION_SETTLE_MS = 200;

function TaskList({ projectId, onEdit, onDelete }: TaskListProps) {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectFilteredSortedTasks);
  const loading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const currentSmartList = useAppSelector(selectCurrentSmartList);
  const [seenTaskIds, setSeenTaskIds] = useState<Set<number>>(new Set());
  const scheduledTaskIdsRef = useRef<Set<number>>(new Set());
  const pendingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (projectId !== undefined) {
      dispatch(fetchTasksByProject(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    for (const task of tasks) {
      if (scheduledTaskIdsRef.current.has(task.id)) {
        continue;
      }
      scheduledTaskIdsRef.current.add(task.id);
      const timer = setTimeout(() => {
        pendingTimersRef.current.delete(timer);
        setSeenTaskIds((prev) => {
          if (prev.has(task.id)) {
            return prev;
          }
          const next = new Set(prev);
          next.add(task.id);
          return next;
        });
      }, ENTER_ANIMATION_SETTLE_MS);
      pendingTimersRef.current.add(timer);
    }
  }, [tasks]);

  useEffect(() => {
    return () => {
      for (const timer of pendingTimersRef.current) {
        clearTimeout(timer);
      }
    };
  }, []);

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
        <ul className="task-list">
          {tasks.map((task) => {
            const isNew = !seenTaskIds.has(task.id);
            return (
              <li
                key={task.id}
                className={isNew ? 'task-row task-row--enter' : 'task-row'}
              >
                <input
                  type="checkbox"
                  className="task-checkbox"
                  aria-label={
                    task.completed
                      ? `Mark "${task.title}" incomplete`
                      : `Mark "${task.title}" complete`
                  }
                  checked={task.completed}
                  onChange={() => dispatch(toggleComplete(task))}
                />
                <div className="task-content">
                  <div className={task.completed ? 'task-title task-title--completed' : 'task-title'}>
                    {task.title}
                  </div>
                  {currentSmartList !== null && (
                    <div className="task-project-name">{(task as TaskWithProject).project_name}</div>
                  )}
                  {task.note && <div className="task-note">{task.note}</div>}
                  {task.labels && task.labels.length > 0 && (
                    <div className="task-labels">
                      {task.labels.map((label) => (
                        <span
                          key={label.id}
                          className="task-label-chip"
                          style={{ backgroundColor: label.color ?? '#ccc' }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="task-actions">
                  <button type="button" onClick={() => onEdit(task)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDelete(task)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default TaskList;
