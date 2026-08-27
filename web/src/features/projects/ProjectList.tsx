import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProjects,
  selectAllProjects,
  selectProject,
  selectProjectsError,
  selectProjectsLoading,
  selectSelectedProject,
} from '../../store/projectsSlice';
import type { ProjectWithTaskCount } from '../../api/types';

interface ProjectListProps {
  onEdit: (project: ProjectWithTaskCount) => void;
  onDelete: (project: ProjectWithTaskCount) => void;
}

function ProjectList({ onEdit, onDelete }: ProjectListProps) {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectAllProjects);
  const selectedProject = useAppSelector(selectSelectedProject);
  const loading = useAppSelector(selectProjectsLoading);
  const error = useAppSelector(selectProjectsError);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  if (loading && projects.length === 0) {
    return <p>Loading projects...</p>;
  }

  if (error) {
    return <p role="alert">Error: {error}</p>;
  }

  if (projects.length === 0) {
    return <p>No projects yet.</p>;
  }

  return (
    <ul>
      {projects.map((project) => {
        const isSelected = project.id === selectedProject?.id;
        return (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => dispatch(selectProject(project.id))}
              aria-pressed={isSelected}
              style={{
                fontWeight: isSelected ? 'bold' : 'normal',
                backgroundColor: isSelected ? '#e0e7ff' : 'transparent',
              }}
            >
              {project.name} ({project.task_count})
            </button>
            <button type="button" onClick={() => onEdit(project)}>
              Edit
            </button>
            <button type="button" onClick={() => onDelete(project)}>
              Delete
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ProjectList;
