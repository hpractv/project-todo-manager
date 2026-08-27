import { useState } from 'react';
import { DeleteConfirmDialog, ProjectForm, ProjectList } from './features/projects';
import type { ProjectWithTaskCount } from './api/types';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithTaskCount | null>(null);

  function handleCloseForm() {
    setShowForm(false);
    setEditingProject(null);
  }

  return (
    <div>
      <h1>Project Todo Manager</h1>
      <button type="button" onClick={() => setShowForm(true)}>
        New Project
      </button>
      {(showForm || editingProject) && (
        <ProjectForm
          key={editingProject?.id ?? 'new'}
          project={editingProject ?? undefined}
          onClose={handleCloseForm}
        />
      )}
      <ProjectList onEdit={setEditingProject} onDelete={setDeletingProject} />
      {deletingProject && (
        <DeleteConfirmDialog project={deletingProject} onClose={() => setDeletingProject(null)} />
      )}
    </div>
  );
}

export default App;
