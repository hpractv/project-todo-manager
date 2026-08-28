import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLabels, selectLabels } from '../../store/labelsSlice';

interface LabelPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

function LabelPicker({ selectedIds, onChange }: LabelPickerProps) {
  const dispatch = useAppDispatch();
  const labels = useAppSelector(selectLabels);

  useEffect(() => {
    dispatch(fetchLabels());
  }, [dispatch]);

  function toggleLabel(labelId: number) {
    if (selectedIds.includes(labelId)) {
      onChange(selectedIds.filter((id) => id !== labelId));
    } else {
      onChange([...selectedIds, labelId]);
    }
  }

  if (labels.length === 0) {
    return null;
  }

  return (
    <fieldset>
      <legend>Labels</legend>
      {labels.map((label) => (
        <label key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={selectedIds.includes(label.id)}
            onChange={() => toggleLabel(label.id)}
          />
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.7rem',
              height: '0.7rem',
              borderRadius: '50%',
              backgroundColor: label.color ?? '#ccc',
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
          />
          {label.name}
        </label>
      ))}
    </fieldset>
  );
}

export default LabelPicker;
