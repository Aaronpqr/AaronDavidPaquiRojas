import { useCallback, useState } from 'react';
import type { ExportFormat, IExporter } from '../models/ports/IExporter';
import type { Project } from '../models/Project';
import { buildStandaloneHtml } from '../utils/buildStandaloneHtml';
import { slugify } from '../utils/slugify';

/** Dependencias inyectadas (los adaptadores concretos los elige App.tsx). */
export interface ExportDeps {
  exporters: Record<'html' | 'pptx' | 'odp', IExporter>;
  download: (blob: Blob, filename: string) => void;
  print: (html: string) => void;
}

export function useExportController(project: Project | null, deps: ExportDeps) {
  const [error, setError] = useState<string | null>(null);

  const exportAs = useCallback(
    async (format: ExportFormat): Promise<boolean> => {
      if (!project) return false;
      try {
        if (format === 'pdf') {
          deps.print(buildStandaloneHtml(project));
        } else {
          const exporter = deps.exporters[format];
          const blob = await exporter.export(project);
          deps.download(blob, `${slugify(project.name)}.${exporter.extension}`);
        }
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo exportar.');
        return false;
      }
    },
    [project, deps],
  );

  const clearError = useCallback(() => setError(null), []);

  return { exportAs, error, clearError };
}
