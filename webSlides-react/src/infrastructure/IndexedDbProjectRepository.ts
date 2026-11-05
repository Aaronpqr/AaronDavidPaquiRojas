import type { IProjectRepository } from '../models/ports/IProjectRepository';
import type { Project } from '../models/Project';

const STORE_NAME = 'projects';

export class IndexedDbProjectRepository implements IProjectRepository {
  private readonly dbName: string;
  private readonly version: number;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName = 'webslides-db', version = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  /** Abre la base (una sola vez) y crea el object store si hace falta. */
  private getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Si falla la apertura, permitir reintentar en la próxima llamada
      this.dbPromise.catch(() => {
        this.dbPromise = null;
      });
    }
    return this.dbPromise;
  }

  private static request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private static transactionDone(tx: IDBTransaction): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async getAll(): Promise<Project[]> {
    const db = await this.getDb();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const projects = await IndexedDbProjectRepository.request<Project[]>(store.getAll());
    // Más recientes primero
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Project | null> {
    const db = await this.getDb();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const project = await IndexedDbProjectRepository.request<Project | undefined>(
      store.get(id),
    );
    return project ?? null;
  }

  async save(project: Project): Promise<Project> {
    const db = await this.getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const done = IndexedDbProjectRepository.transactionDone(tx);
    tx.objectStore(STORE_NAME).put(project);
    await done;
    return project;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const done = IndexedDbProjectRepository.transactionDone(tx);
    tx.objectStore(STORE_NAME).delete(id);
    await done;
  }

  /** Cierra la conexión (útil en tests y al desmontar la app). */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise.catch(() => null);
      db?.close();
      this.dbPromise = null;
    }
  }
}