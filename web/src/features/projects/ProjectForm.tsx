import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createProject, selectProjectsLoading, updateProject } from '../../store/projectsSlice';
import type { Project } from '../../api/types';

interface ProjectFormProps {
  project?: Project;
  onClose?: () => void;
}

function ProjectForm({ project, onClose }: ProjectFormProps) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectProjectsLoading);
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = project !== undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Name is required');
      return;
    }
    setValidationError(null);

    const data = { name: trimmedName, description: description.trim() || null };

    try {
      if (project) {
        await dispatch(updateProject({ id: project.id, data })).unwrap();
      } else {
        await dispatch(createProject(data)).unwrap();
        setName('');
        setDescription('');
      }
      onClose?.();
    } catch {
      // error is surfaced via the projects slice's shared error state
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="project-name">Name</label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          value={description ?? ''}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      {validationError && <p role="alert">{validationError}</p>}
      <button type="submit" disabled={loading}>
        {isEditMode ? 'Save' : 'Create'}
      </button>
    </form>
  );
}

export default ProjectForm;
