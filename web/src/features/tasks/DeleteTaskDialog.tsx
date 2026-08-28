import { useAppDispatch } from '../../store/hooks';
import { deleteTask } from '../../store/tasksSlice';
import type { Task } from '../../api/types';

interface DeleteTaskDialogProps {
  task: Task;
  onClose: () => void;
}

function DeleteTaskDialog({ task, onClose }: DeleteTaskDialogProps) {
  const dispatch = useAppDispatch();

  async function handleConfirm() {
    try {
      await dispatch(deleteTask(task.id)).unwrap();
      onClose();
    } catch {
      // error is surfaced via the tasks slice's shared error state
    }
  }

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-task-confirm-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          padding: '1rem 1.5rem',
          borderRadius: '4px',
          minWidth: '20rem',
        }}
      >
        <p id="delete-task-confirm-title">
          Are you sure you want to delete task &quot;{task.title}&quot;?
        </p>
        <button type="button" onClick={handleConfirm}>
          Confirm
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default DeleteTaskDialog;
