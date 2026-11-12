import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository';
import { makeProject } from './helpers/factories';

let dbName: string;
let repo: IndexedDbProjectRepository;
let counter = 0;

function deleteDb(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

beforeEach(() => {
  counter += 1;
  dbName = `webslides-test-${counter}-${Date.now()}`;
  repo = new IndexedDbProjectRepository(dbName);
});

afterEach(async () => {
  await repo.close();
  await deleteDb(dbName);
});

describe('IndexedDbProjectRepository', () => {
  describe('inicialización', () => {
    it('crea la base de datos con el object store "projects"', async () => {
      await repo.getAll(); // fuerza la apertura

      const names = await new Promise<string[]>((resolve, reject) => {
        const req = indexedDB.open(dbName);
        req.onsuccess = () => {
          const db = req.result;
          const stores = Array.from(db.objectStoreNames);
          db.close();
          resolve(stores);
        };
        req.onerror = () => reject(req.error);
      });

      expect(names).toContain('projects');
    });

    it('getAll devuelve un arreglo vacío si no hay proyectos', async () => {
      expect(await repo.getAll()).toEqual([]);
    });
  });

  describe('guardado y lectura', () => {
    it('guarda un proyecto y lo recupera por id', async () => {
      const project = makeProject({ id: 'abc' });

      const saved = await repo.save(project);
      const found = await repo.getById('abc');

      expect(saved).toEqual(project);
      expect(found).toEqual(project);
    });

    it('getById devuelve null si el proyecto no existe', async () => {
      expect(await repo.getById('no-existe')).toBeNull();
    });

    it('save hace upsert: actualiza si el id ya existe', async () => {
      await repo.save(makeProject({ id: 'p1', name: 'Original' }));
      await repo.save(makeProject({ id: 'p1', name: 'Editado' }));

      const all = await repo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('Editado');
    });

    it('guarda y conserva los slides del proyecto', async () => {
      const project = makeProject({
        id: 'p2',
        slides: [
          { id: 's1', type: 'title', title: 'Portada', text: 'Hola', order: 0 },
          {
            id: 's2',
            type: 'content',
            layout: 'text-and-image',
            title: 'Slide 2',
            text: 'Cuerpo',
            imageUrl: 'https://example.com/img.png',
            imageTransform: { x: 52, y: 20, width: 43, height: 74 },
            order: 1,
          },
          {
            id: 's3',
            type: 'content',
            layout: 'image-only',
            title: 'Slide 3 legado',
            text: '',
            imageUrl: 'https://example.com/legacy.png',
            order: 2,
          },
        ],
      });

      await repo.save(project);
      const found = await repo.getById('p2');

      expect(found?.slides).toHaveLength(3);
      expect(found?.slides[1].layout).toBe('text-and-image');
      expect(found?.slides[1].imageTransform).toEqual({ x: 52, y: 20, width: 43, height: 74 });
      expect(found?.slides[2].imageTransform).toBeUndefined();
    });

    it('getAll devuelve todos los proyectos, el más reciente primero', async () => {
      await repo.save(makeProject({ id: 'a', updatedAt: '2025-01-01T00:00:00.000Z' }));
      await repo.save(makeProject({ id: 'b', updatedAt: '2025-03-01T00:00:00.000Z' }));
      await repo.save(makeProject({ id: 'c', updatedAt: '2025-02-01T00:00:00.000Z' }));

      const ids = (await repo.getAll()).map((p) => p.id);
      expect(ids).toEqual(['b', 'c', 'a']);
    });
  });

  describe('eliminación', () => {
    it('elimina un proyecto existente', async () => {
      await repo.save(makeProject({ id: 'del' }));
      await repo.delete('del');

      expect(await repo.getById('del')).toBeNull();
      expect(await repo.getAll()).toEqual([]);
    });

    it('eliminar un id inexistente no lanza error', async () => {
      await expect(repo.delete('fantasma')).resolves.toBeUndefined();
    });
  });

  describe('persistencia', () => {
    it('los datos sobreviven a una nueva instancia del repositorio', async () => {
      await repo.save(makeProject({ id: 'persist', name: 'Persistente' }));
      await repo.close();

      const second = new IndexedDbProjectRepository(dbName);
      const found = await second.getById('persist');
      await second.close();

      expect(found?.name).toBe('Persistente');
    });
  });
});