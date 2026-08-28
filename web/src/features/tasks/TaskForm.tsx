import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTask, selectTasksLoading, setTaskLabels, updateTask } from '../../store/tasksSlice';
import type { Task } from '../../api/types';
import LabelPicker from './LabelPicker';

interface TaskFormProps {
  projectId: number;
  task?: Task;
  onClose?: () => void;
}

function TaskForm({ projectId, task, onClose }: TaskFormProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectTasksLoading);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    task?.labels?.map((label) => label.id) ?? [],
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = task !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Title is required');
      return;
    }
    setValidationError(null);

    const data = { title: trimmedTitle, note: note.trim() || null };

    try {
      if (task) {
        await dispatch(updateTask({ id: task.id, data })).unwrap();
        await dispatch(setTaskLabels({ taskId: task.id, labelIds: selectedLabelIds })).unwrap();
      } else {
        const created = await dispatch(createTask({ projectId, data })).unwrap();
        await dispatch(
          setTaskLabels({ taskId: created.id, labelIds: selectedLabelIds }),
        ).unwrap();
        setTitle('');
        setNote('');
        setSelectedLabelIds([]);
      }
      onClose?.();
    } catch {
      // error is surfaced via the tasks slice's shared error state
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="task-note">Note</label>
        <textarea
          id="task-note"
          value={note ?? ''}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <LabelPicker selectedIds={selectedLabelIds} onChange={setSelectedLabelIds} />
      {validationError && <p role="alert">{validationError}</p>}
      <button type="submit" disabled={loading}>
        {isEditMode ? 'Save' : 'Create'}
      </button>
    </form>
  );
}

export default TaskForm;
