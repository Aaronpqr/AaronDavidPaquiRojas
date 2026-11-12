import type { Project } from '../../models/Project';
import { formatDate } from '../../utils/formatDate';
import { SlideThumbnail } from '../components/SlideThumbnail';

interface ProjectListViewProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectListView({
  projects,
  loading,
  error,
  onCreate,
  onOpen,
  onDelete,
}: ProjectListViewProps) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-indigo-700">WebSlides</h1>
      </header>

      <main className="mx-auto max-w-6xl p-8">
        {error && (
          <p role="alert" className="mb-6 rounded-md bg-red-100 px-3 py-2 text-red-800">
            {error}
          </p>
        )}

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Empezar</h2>
          <button
            type="button"
            onClick={onCreate}
            className="flex aspect-video w-56 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-indigo-500 hover:text-indigo-700"
          >
            <span aria-hidden="true" className="text-4xl leading-none">＋</span>
            <span className="text-sm font-medium">Nueva presentación</span>
          </button>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-600">Recientes</h2>
          {loading && <p className="text-slate-500">Cargando proyectos…</p>}
          {!loading && projects.length === 0 && (
            <p className="text-slate-500">
              Aún no tienes proyectos. Crea el primero con «Nueva presentación».
            </p>
          )}

          <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {projects.map((project) => (
              <li key={project.id} className="group relative">
                <button
                  type="button"
                  aria-label={`Abrir ${project.name}`}
                  onClick={() => onOpen(project.id)}
                  className="block w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:shadow-md"
                >
                  {project.slides[0] && (
                    <SlideThumbnail
                      slide={project.slides[0]}
                      author={project.author}
                      topic={project.topic}
                      date={formatDate(project.createdAt)}
                      className="border-b border-slate-200"
                    />
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(project.updatedAt)}</p>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${project.name}`}
                  onClick={() => onDelete(project.id)}
                  className="absolute right-2 top-2 rounded-md bg-white/95 px-2 py-1 text-xs text-red-700 opacity-0 shadow transition hover:bg-red-50 focus:opacity-100 group-hover:opacity-100"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
