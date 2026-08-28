import { useAppDispatch } from '../../store/hooks';
import { deleteProject } from '../../store/projectsSlice';
import type { Project } from '../../api/types';

interface DeleteConfirmDialogProps {
  project: Project;
  onClose: () => void;
}

function DeleteConfirmDialog({ project, onClose }: DeleteConfirmDialogProps) {
  const dispatch = useAppDispatch();

  async function handleConfirm() {
    try {
      await dispatch(deleteProject(project.id)).unwrap();
      onClose();
    } catch {
      // error is surfaced via the projects slice's shared error state
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
        aria-labelledby="delete-confirm-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          padding: '1rem 1.5rem',
          borderRadius: '4px',
          minWidth: '20rem',
        }}
      >
        <p id="delete-confirm-title">
          Are you sure you want to delete project &quot;{project.name}&quot;?
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

export default DeleteConfirmDialog;
