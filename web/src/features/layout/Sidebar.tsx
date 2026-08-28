import { useState } from 'react';
import { DeleteConfirmDialog, ProjectForm, ProjectList } from '../projects';
import { SmartListsSidebar } from '../smartlists';
import type { ProjectWithTaskCount } from '../../api/types';

function Sidebar() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithTaskCount | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithTaskCount | null>(null);

  function handleCloseForm() {
    setShowForm(false);
    setEditingProject(null);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h2 className="sidebar-heading">Smart Lists</h2>
        <SmartListsSidebar />
      </div>
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h2 className="sidebar-heading">Projects</h2>
          <button type="button" onClick={() => setShowForm(true)}>
            New Project
          </button>
        </div>
        {(showForm || editingProject) && (
          <ProjectForm
            key={editingProject?.id ?? 'new'}
            project={editingProject ?? undefined}
            onClose={handleCloseForm}
          />
        )}
        <ProjectList onEdit={setEditingProject} onDelete={setDeletingProject} />
      </div>
      {deletingProject && (
        <DeleteConfirmDialog project={deletingProject} onClose={() => setDeletingProject(null)} />
      )}
    </aside>
  );
}

export default Sidebar;
