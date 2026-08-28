import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabels, selectLabels } from '../../store/labelsSlice';
import { selectProject } from '../../store/projectsSlice';
import {
  fetchAllTasks,
  fetchCompletedTasks,
  fetchTasksByLabel,
  selectCurrentSmartList,
} from '../../store/tasksSlice';

function SmartListsSidebar() {
  const dispatch = useAppDispatch();
  const labels = useAppSelector(selectLabels);
  const currentSmartList = useAppSelector(selectCurrentSmartList);

  useEffect(() => {
    dispatch(fetchLabels());
  }, [dispatch]);

  function handleSelectAll() {
    dispatch(selectProject(null));
    dispatch(fetchAllTasks());
  }

  function handleSelectCompleted() {
    dispatch(selectProject(null));
    dispatch(fetchCompletedTasks());
  }

  function handleSelectLabel(labelId: number) {
    dispatch(selectProject(null));
    dispatch(fetchTasksByLabel(labelId));
  }

  return (
    <ul>
      <li>
        <button type="button" onClick={handleSelectAll} aria-pressed={currentSmartList === 'all'}>
          All
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={handleSelectCompleted}
          aria-pressed={currentSmartList === 'completed'}
        >
          Completed
        </button>
      </li>
      {labels.map((label) => (
        <li key={label.id}>
          <button
            type="button"
            onClick={() => handleSelectLabel(label.id)}
            aria-pressed={currentSmartList === label.id}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '0.7rem',
                height: '0.7rem',
                borderRadius: '50%',
                backgroundColor: label.color ?? '#ccc',
                border: '1px solid rgba(0, 0, 0, 0.2)',
                marginRight: '0.4rem',
              }}
            />
            {label.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default SmartListsSidebar;
