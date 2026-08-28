import { useAppDispatch } from '../../store/hooks';
import { deleteLabel } from '../../store/labelsSlice';
import type { Label } from '../../api/types';

interface DeleteLabelDialogProps {
  label: Label;
  onClose: () => void;
}

function DeleteLabelDialog({ label, onClose }: DeleteLabelDialogProps) {
  const dispatch = useAppDispatch();

  async function handleConfirm() {
    try {
      await dispatch(deleteLabel(label.id)).unwrap();
      onClose();
    } catch {
      // error is surfaced via the labels slice's shared error state
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
        aria-labelledby="delete-label-confirm-title"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          padding: '1rem 1.5rem',
          borderRadius: '4px',
          minWidth: '20rem',
        }}
      >
        <p id="delete-label-confirm-title">
          Are you sure you want to delete label &quot;{label.name}&quot;?
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

export default DeleteLabelDialog;
