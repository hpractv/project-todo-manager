import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createLabel, selectLabelsLoading, updateLabel } from '../../store/labelsSlice';
import type { Label } from '../../api/types';

interface LabelFormProps {
  label?: Label;
  onClose?: () => void;
}

const DEFAULT_SWATCH = '#808080';

function LabelForm({ label, onClose }: LabelFormProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLabelsLoading);
  const [name, setName] = useState(label?.name ?? '');
  const [color, setColor] = useState<string | null>(label?.color ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = label !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Name is required');
      return;
    }
    setValidationError(null);

    const data = { name: trimmedName, color };

    try {
      if (label) {
        await dispatch(updateLabel({ id: label.id, data })).unwrap();
      } else {
        await dispatch(createLabel(data)).unwrap();
        setName('');
        setColor(null);
      }
      onClose?.();
    } catch {
      // error is surfaced via the labels slice's shared error state
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="label-name">Name</label>
        <input
          id="label-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="label-color">Color</label>
        <input
          id="label-color"
          type="color"
          value={color ?? DEFAULT_SWATCH}
          onChange={(event) => setColor(event.target.value)}
        />
        {color && (
          <button type="button" onClick={() => setColor(null)}>
            Clear color
          </button>
        )}
      </div>
      {validationError && <p role="alert">{validationError}</p>}
      <button type="submit" disabled={loading}>
        {isEditMode ? 'Save' : 'Create'}
      </button>
    </form>
  );
}

export default LabelForm;
