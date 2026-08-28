import { useState } from 'react';
import { DeleteLabelDialog, LabelForm, LabelList } from './features/labels';
import { MainPane, Sidebar } from './features/layout';
import type { Label } from './api/types';
import './styles/layout.css';

function App() {
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);

  function handleCloseLabelForm() {
    setShowLabelForm(false);
    setEditingLabel(null);
  }

  return (
    <div className="app-shell">
      <h1>Project Todo Manager</h1>
      <div>
        <button type="button" onClick={() => setShowLabelManager((current) => !current)}>
          {showLabelManager ? 'Hide Labels' : 'Manage Labels'}
        </button>
        {showLabelManager && (
          <div>
            <button type="button" onClick={() => setShowLabelForm(true)}>
              New Label
            </button>
            {(showLabelForm || editingLabel) && (
              <LabelForm
                key={editingLabel?.id ?? 'new'}
                label={editingLabel ?? undefined}
                onClose={handleCloseLabelForm}
              />
            )}
            <LabelList onEdit={setEditingLabel} onDelete={setDeletingLabel} />
          </div>
        )}
      </div>
      <div className="app-layout">
        <Sidebar />
        <MainPane />
      </div>
      {deletingLabel && (
        <DeleteLabelDialog label={deletingLabel} onClose={() => setDeletingLabel(null)} />
      )}
    </div>
  );
}

export default App;
