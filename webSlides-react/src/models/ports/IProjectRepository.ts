import type { Project } from '../Project';

/**
 * Puerto de persistencia (Inversión de Dependencias).
 *
 * Los controladores dependen de esta interfaz, nunca de una implementación
 * concreta. Todos los métodos son asíncronos para que la versión actual
 * (IndexedDB) pueda sustituirse por una basada en microservicios REST
 * sin cambiar el resto de la aplicación.
 */
export interface IProjectRepository {
  /** Devuelve todos los proyectos almacenados. */
  getAll(): Promise<Project[]>;

  /** Devuelve un proyecto por su id, o null si no existe. */
  getById(id: string): Promise<Project | null>;

  /** Crea o actualiza un proyecto (upsert) y devuelve el proyecto guardado. */
  save(project: Project): Promise<Project>;

  /** Elimina un proyecto y sus slides. */
  delete(id: string): Promise<void>;
}
