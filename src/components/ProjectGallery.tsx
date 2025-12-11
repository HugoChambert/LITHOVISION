import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProjects, deleteProject, type UserProject } from '../lib/projectManager';
import { showToast } from './ToastContainer';
import './ProjectGallery.css';

interface ProjectGalleryProps {
  onSelectProject?: (project: UserProject) => void;
  onClose: () => void;
}

function ProjectGallery({ onSelectProject, onClose }: ProjectGalleryProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'draft'>('all');

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserProjects(user.id);
      setProjects(data);
    } catch (error) {
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      showToast('Project deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete project', 'error');
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === 'all') return true;
    return project.processing_status === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="project-gallery-overlay" onClick={onClose}>
      <div className="project-gallery-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <h2>My Projects</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="gallery-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({projects.length})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({projects.filter((p) => p.processing_status === 'completed').length})
          </button>
          <button
            className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Draft ({projects.filter((p) => p.processing_status === 'draft').length})
          </button>
        </div>

        <div className="gallery-content">
          {loading ? (
            <div className="gallery-loading">
              <div className="spinner"></div>
              <p>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="gallery-empty">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <h3>No projects yet</h3>
              <p>Start creating your first design to see it here</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => onSelectProject?.(project)}
                >
                  <div className="project-thumbnail">
                    <img
                      src={project.result_image_url || project.original_image_url}
                      alt={project.name}
                    />
                    <div className={`project-status status-${project.processing_status}`}>
                      {project.processing_status}
                    </div>
                  </div>
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p className="project-date">{formatDate(project.created_at)}</p>
                    {project.stone_material && (
                      <p className="project-material">
                        {(project.stone_material as any).name}
                      </p>
                    )}
                  </div>
                  <div className="project-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => handleDelete(project.id, e)}
                      title="Delete project"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectGallery;
