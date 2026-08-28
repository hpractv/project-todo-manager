import { useEffect, useState } from 'react';
import { DeleteLabelDialog, LabelForm, LabelList } from './features/labels';
import { MainPane, Sidebar } from './features/layout';
import type { Label } from './api/types';
import './styles/theme.css';
import './styles/layout.css';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<Label | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function handleCloseLabelForm() {
    setShowLabelForm(false);
    setEditingLabel(null);
  }

  function toggleTheme() {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Project Todo Manager</h1>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
      </header>
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
