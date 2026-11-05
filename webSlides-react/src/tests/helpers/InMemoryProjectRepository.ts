import type { IProjectRepository } from '../../models/ports/IProjectRepository';
import type { Project } from '../../models/Project';

export class InMemoryProjectRepository implements IProjectRepository {
  private store = new Map<string, Project>();

  constructor(initial: Project[] = []) {
    initial.forEach((p) => this.store.set(p.id, structuredClone(p)));
  }

  async getAll(): Promise<Project[]> {
    return Array.from(this.store.values()).map((p) => structuredClone(p));
  }

  async getById(id: string): Promise<Project | null> {
    const found = this.store.get(id);
    return found ? structuredClone(found) : null;
  }

  async save(project: Project): Promise<Project> {
    this.store.set(project.id, structuredClone(project));
    return structuredClone(project);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}