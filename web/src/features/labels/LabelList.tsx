import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabels, selectLabels, selectLabelsError, selectLabelsLoading } from '../../store/labelsSlice';
import type { Label } from '../../api/types';

interface LabelListProps {
  onEdit: (label: Label) => void;
  onDelete: (label: Label) => void;
}

function LabelList({ onEdit, onDelete }: LabelListProps) {
  const dispatch = useAppDispatch();
  const labels = useAppSelector(selectLabels);
  const loading = useAppSelector(selectLabelsLoading);
  const error = useAppSelector(selectLabelsError);

  useEffect(() => {
    dispatch(fetchLabels());
  }, [dispatch]);

  if (loading && labels.length === 0) {
    return <p>Loading labels...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  if (labels.length === 0) {
    return <p>No labels yet.</p>;
  }

  return (
    <ul>
      {labels.map((label) => (
        <li key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.85rem',
              height: '0.85rem',
              borderRadius: '50%',
              backgroundColor: label.color ?? '#ccc',
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
          />
          <span style={{ flex: 1 }}>{label.name}</span>
          <button type="button" onClick={() => onEdit(label)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(label)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export default LabelList;
