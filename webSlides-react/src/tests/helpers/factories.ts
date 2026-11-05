import type { Project } from '../../models/Project';

export function makeProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: 'p-1',
    name: 'Proyecto de prueba',
    author: 'Autor',
    topic: 'Tópico',
    slides: [
      { id: 's-1', type: 'title', title: 'Portada', text: 'Subtítulo', order: 0 },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}