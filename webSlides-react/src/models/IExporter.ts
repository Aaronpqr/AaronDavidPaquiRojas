import { Project } from '../Project';

/**
 * Puerto de exportación. Cada formato (HTML, PDF, PPTX, ODP)
 * se implementa como un adaptador de esta interfaz.
 */
export interface IExporter {
  /** Extensión del archivo generado, sin punto (ej. 'html'). */
  readonly extension: string;
  /** Tipo MIME del Blob generado. */
  readonly mimeType: string;

  /** Genera el archivo exportado a partir del proyecto. */
  export(project: Project): Promise<Blob>;
}
