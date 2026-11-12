import { describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProjectController } from '../controllers/useProjectController';
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository';
import type { Project } from '../models/Project';
import { makeProject } from './helpers/factories';
import { InMemoryProjectRepository } from './helpers/InMemoryProjectRepository';

async function setup(initial: Project[] = []) {
  const repo = new InMemoryProjectRepository(initial);
  const hook = renderHook(() => useProjectController(repo));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return { repo, ...hook };
}

describe('useProjectController', () => {
  it('carga los proyectos existentes al montarse', async () => {
    const { result } = await setup([
      makeProject({ id: 'a' }),
      makeProject({ id: 'b' }),
    ]);

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('createProject crea el proyecto con un slide de portada y lo selecciona', async () => {
    const { result, repo } = await setup();

    let created: Project | null = null;
    await act(async () => {
      created = await result.current.createProject({
        name: 'Mi presentación',
        author: 'Ana',
        topic: 'React',
      });
    });

    expect(created).not.toBeNull();
    expect(result.current.projects).toHaveLength(1);
    expect(result.current.currentProject?.id).toBe(created!.id);

    const project = result.current.projects[0];
    expect(project.name).toBe('Mi presentación');
    expect(project.author).toBe('Ana');
    expect(project.topic).toBe('React');
    expect(project.slides).toHaveLength(1);
    expect(project.slides[0].type).toBe('title');
    expect(project.slides[0].order).toBe(0);

    // y quedó persistido en el repositorio
    expect(await repo.getById(project.id)).not.toBeNull();
  });

  it('createProject sin datos crea una presentación sin título', async () => {
    const { result } = await setup();

    await act(async () => {
      await result.current.createProject();
    });

    const project = result.current.projects[0];
    expect(project.name).toBe('Presentación sin título');
    expect(project.author).toBe('');
    expect(project.topic).toBe('');
    expect(project.slides[0].type).toBe('title');
    expect(project.slides[0].title).toBe('Presentación sin título');
  });

  it('deleteProject elimina el proyecto del estado y del repositorio', async () => {
    const { result, repo } = await setup([makeProject({ id: 'x' })]);

    await act(async () => {
      await result.current.deleteProject('x');
    });

    expect(result.current.projects).toHaveLength(0);
    expect(await repo.getById('x')).toBeNull();
  });

  it('eliminar el proyecto actual limpia la selección', async () => {
    const { result } = await setup([makeProject({ id: 'x' })]);

    act(() => result.current.selectProject('x'));
    expect(result.current.currentProject?.id).toBe('x');

    await act(async () => {
      await result.current.deleteProject('x');
    });

    expect(result.current.currentProject).toBeNull();
  });

  it('selectProject establece el proyecto actual', async () => {
    const { result } = await setup([
      makeProject({ id: 'a' }),
      makeProject({ id: 'b', name: 'Segundo' }),
    ]);

    act(() => result.current.selectProject('b'));

    expect(result.current.currentProject?.name).toBe('Segundo');
  });

  it('saveProject actualiza updatedAt y reemplaza el proyecto en el estado', async () => {
    const original = makeProject({ id: 'a', updatedAt: '2020-01-01T00:00:00.000Z' });
    const { result, repo } = await setup([original]);

    await act(async () => {
      await result.current.saveProject({ ...original, name: 'Renombrado' });
    });

    const updated = result.current.projects.find((p) => p.id === 'a')!;
    expect(updated.name).toBe('Renombrado');
    expect(updated.updatedAt > original.updatedAt).toBe(true);
    expect((await repo.getById('a'))?.name).toBe('Renombrado');
  });

  it('expone el error si falla la carga inicial', async () => {
    const repo = new InMemoryProjectRepository();
    jest.spyOn(repo, 'getAll').mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useProjectController(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
    expect(result.current.projects).toEqual([]);
  });

  it('expone el error si falla createProject y devuelve null', async () => {
    const { result, repo } = await setup();
    jest.spyOn(repo, 'save').mockRejectedValueOnce(new Error('sin espacio'));

    let created: Project | null = makeProject();
    await act(async () => {
      created = await result.current.createProject({ name: 'X', author: 'Y', topic: 'Z' });
    });

    expect(created).toBeNull();
    expect(result.current.error).toBe('sin espacio');
    expect(result.current.projects).toHaveLength(0);
  });

  it('integración: funciona con IndexedDbProjectRepository real', async () => {
    const repo = new IndexedDbProjectRepository(`webslides-int-${Date.now()}`);
    const { result } = renderHook(() => useProjectController(repo));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createProject({ name: 'Real', author: 'A', topic: 'T' });
    });
    const id = result.current.projects[0].id;
    expect((await repo.getById(id))?.name).toBe('Real');

    await act(async () => {
      await result.current.deleteProject(id);
    });
    expect(await repo.getAll()).toEqual([]);

    await repo.close();
  });
});
