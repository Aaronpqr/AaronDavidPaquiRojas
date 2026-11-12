import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IProjectRepository } from '../models/ports/IProjectRepository';
import type { Project } from '../models/Project';
import { generateId } from '../utils/generateId';

export interface NewProjectInput {
  name?: string;
  author?: string;
  topic?: string;
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Error desconocido';
}

/**
 * Controlador de proyectos. Depende de la interfaz IProjectRepository,
 * no de IndexedDB: se puede sustituir por HttpMicroserviceRepository sin cambios.
 */
export function useProjectController(repository: IProjectRepository) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    repository
      .getAll()
      .then((all) => {
        if (!cancelled) setProjects(all);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await repository.getAll());
      setError(null);
    } catch (err) {
      setError(toMessage(err));
    }
  }, [repository]);

  const createProject = useCallback(
    async (input: NewProjectInput = {}): Promise<Project | null> => {
      const name = input.name?.trim() || 'Presentación sin título';
      const author = input.author?.trim() ?? '';
      const topic = input.topic?.trim() ?? '';
      const now = new Date().toISOString();
      const project: Project = {
        id: generateId(),
        name,
        author,
        topic,
        // El primer slide siempre es la Portada
        slides: [{ id: generateId(), type: 'title', title: name, text: topic, order: 0 }],
        createdAt: now,
        updatedAt: now,
      };

      try {
        const saved = await repository.save(project);
        setProjects((prev) => [saved, ...prev]);
        setCurrentProjectId(saved.id);
        setError(null);
        return saved;
      } catch (err) {
        setError(toMessage(err));
        return null;
      }
    },
    [repository],
  );

  const saveProject = useCallback(
    async (project: Project): Promise<Project | null> => {
      try {
        const saved = await repository.save({
          ...project,
          updatedAt: new Date().toISOString(),
        });
        setProjects((prev) =>
          prev.some((p) => p.id === saved.id)
            ? prev.map((p) => (p.id === saved.id ? saved : p))
            : [saved, ...prev],
        );
        setError(null);
        return saved;
      } catch (err) {
        setError(toMessage(err));
        return null;
      }
    },
    [repository],
  );

  const deleteProject = useCallback(
    async (id: string): Promise<void> => {
      try {
        await repository.delete(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setCurrentProjectId((current) => (current === id ? null : current));
        setError(null);
      } catch (err) {
        setError(toMessage(err));
      }
    },
    [repository],
  );

  const selectProject = useCallback((id: string | null) => {
    setCurrentProjectId(id);
  }, []);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId],
  );

  return {
    projects,
    currentProject,
    loading,
    error,
    loadProjects,
    createProject,
    saveProject,
    deleteProject,
    selectProject,
  };
}
