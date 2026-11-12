import { useState } from 'react';
import type { Project, ProjectMeta } from '../../models/Project';
import type { Slide, SlideChanges, SlideLayout } from '../../models/Slide';
import { formatDate } from '../../utils/formatDate';
import { SlideRenderer } from './SlideRenderer';

const LAYOUTS: { value: SlideLayout; label: string }[] = [
  { value: 'text-only', label: 'Solo texto' },
  { value: 'image-only', label: 'Solo imagen' },
  { value: 'text-and-image', label: 'Texto e imagen' },
];

interface Draft {
  title: string;
  text: string;
  layout: SlideLayout;
  imageUrl: string;
}

interface SlideWorkspaceProps {
  project: Project;
  slide: Slide;
  index: number;
  total: number;
  onSave: (changes: SlideChanges) => void;
  onUpdateProject: (changes: ProjectMeta) => void;
  onPrev: () => void;
  onNext: () => void;
}

const fieldClass =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';
const labelClass = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500';

/**
 * Se monta con key={slide.id}: el borrador se reinicia al cambiar de slide.
 * La vista previa usa el borrador (en vivo) y se persiste al salir del campo,
 * así no se escribe en IndexedDB en cada tecla.
 */
export function SlideWorkspace({
  project,
  slide,
  index,
  total,
  onSave,
  onUpdateProject,
  onPrev,
  onNext,
}: SlideWorkspaceProps) {
  const isContent = slide.type === 'content';
  const [draft, setDraft] = useState<Draft>({
    title: slide.title,
    text: slide.text,
    layout: slide.layout ?? 'text-only',
    imageUrl: slide.imageUrl ?? '',
  });

  const showText = !isContent || draft.layout !== 'image-only';
  const showImage = isContent && draft.layout !== 'text-only';

  const toChanges = (d: Draft): SlideChanges =>
    isContent
      ? { title: d.title, text: d.text, layout: d.layout, imageUrl: d.imageUrl.trim() || undefined }
      : { title: d.title, text: d.text };

  const commit = (d: Draft) => {
    const c = toChanges(d);
    const changed =
      c.title !== slide.title ||
      c.text !== slide.text ||
      (isContent && (c.layout !== (slide.layout ?? 'text-only') || c.imageUrl !== slide.imageUrl));
    if (changed) onSave(c);
  };

  const chooseLayout = (layout: SlideLayout) => {
    const next = { ...draft, layout };
    setDraft(next);
    commit(next);
  };

  const preview: Slide = { ...slide, ...toChanges(draft) };

  return (
    <>
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6">
        <section
          aria-label="Vista previa del slide"
          style={{ width: 'min(100%, calc((100vh - 13rem) * 16 / 9))' }}
          className="aspect-video overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-slate-200"
        >
          <SlideRenderer
            slide={preview}
            author={project.author}
            topic={project.topic}
            date={formatDate(project.createdAt)}
            slideNumber={index + 1}
          />
        </section>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            aria-label="Diapositiva anterior"
            onClick={onPrev}
            disabled={index === 0}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50 disabled:opacity-40"
          >
            ‹
          </button>
          <span>{`${index + 1} / ${total}`}</span>
          <button
            type="button"
            aria-label="Diapositiva siguiente"
            onClick={onNext}
            disabled={index === total - 1}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </main>

      <aside
        aria-label="Propiedades"
        className="flex w-80 shrink-0 flex-col gap-6 overflow-y-auto border-l border-slate-200 bg-white p-4"
      >
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-slate-800">
            {isContent ? 'Diapositiva' : 'Portada'}
          </h2>

          {isContent && (
            <div>
              <span className={labelClass}>Diseño</span>
              <div className="grid grid-cols-3 gap-1.5">
                {LAYOUTS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={draft.layout === o.value}
                    onClick={() => chooseLayout(o.value)}
                    className={`rounded-md border px-1 py-2 text-xs ${
                      draft.layout === o.value
                        ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-700'
                        : 'border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="slide-title" className={labelClass}>Título</label>
            <input
              id="slide-title"
              className={fieldClass}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              onBlur={() => commit(draft)}
            />
          </div>

          {showText && (
            <div>
              <label htmlFor="slide-text" className={labelClass}>
                {isContent ? 'Texto' : 'Subtítulo'}
              </label>
              <textarea
                id="slide-text"
                rows={6}
                className={fieldClass}
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                onBlur={() => commit(draft)}
              />
            </div>
          )}

          {showImage && (
            <div>
              <label htmlFor="slide-image" className={labelClass}>URL de la imagen</label>
              <input
                id="slide-image"
                type="url"
                placeholder="https://..."
                className={fieldClass}
                value={draft.imageUrl}
                onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
                onBlur={() => commit(draft)}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <h2 className="text-sm font-semibold text-slate-800">Datos de la presentación</h2>
          <p className="text-xs text-slate-500">
            Se muestran en el encabezado y pie de las diapositivas de desarrollo.
          </p>
          <div>
            <label htmlFor="meta-author" className={labelClass}>Autor</label>
            <input
              id="meta-author"
              className={fieldClass}
              defaultValue={project.author}
              onBlur={(e) =>
                e.target.value !== project.author && onUpdateProject({ author: e.target.value })
              }
            />
          </div>
          <div>
            <label htmlFor="meta-topic" className={labelClass}>Tópico</label>
            <input
              id="meta-topic"
              className={fieldClass}
              defaultValue={project.topic}
              onBlur={(e) =>
                e.target.value !== project.topic && onUpdateProject({ topic: e.target.value })
              }
            />
          </div>
        </section>
      </aside>
    </>
  );
}
