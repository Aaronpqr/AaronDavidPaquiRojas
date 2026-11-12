import type { Project } from '../../models/Project';
import type { Slide, SlideChanges } from '../../models/Slide';
import { formatDate } from '../../utils/formatDate';
import { SlideEditForm } from '../components/SlideEditForm';
import { SlideRenderer } from '../components/SlideRenderer';

export interface EditorViewProps {
  project: Project;
  slides: Slide[];
  activeSlide: Slide;
  activeIndex: number;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onUpdateSlide: (id: string, changes: SlideChanges) => void;
  onDeleteSlide: (id: string) => void;
  onPresent: () => void;
  onBack: () => void;
}

export function EditorView({
  project,
  slides,
  activeSlide,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onUpdateSlide,
  onDeleteSlide,
  onPresent,
  onBack,
}: EditorViewProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ← Proyectos
          </button>
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
        <button
          type="button"
          onClick={onPresent}
          className="rounded bg-emerald-600 px-4 py-1.5 text-white hover:bg-emerald-700"
        >
          Presentar
        </button>
      </header>

      <div className="grid flex-1 grid-cols-[14rem_1fr_20rem]">
        <nav aria-label="Slides" className="flex flex-col gap-2 border-r border-slate-200 bg-white p-3">
          <ul className="flex flex-col gap-1">
            {slides.map((slide, index) => (
              <li key={slide.id}>
                <button
                  type="button"
                  onClick={() => onSelectSlide(slide.id)}
                  aria-current={slide.id === activeSlide.id ? 'true' : undefined}
                  className="w-full truncate rounded px-2 py-2 text-left text-sm hover:bg-slate-100 aria-[current=true]:bg-indigo-100 aria-[current=true]:font-semibold"
                >
                  {index + 1}. {slide.title || 'Sin título'}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onAddSlide}
            className="rounded border border-dashed border-slate-400 px-2 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            + Agregar slide
          </button>
        </nav>

        <main className="flex items-start justify-center p-6">
          <section
            aria-label="Vista previa del slide"
            className="aspect-video w-full max-w-4xl overflow-hidden rounded shadow-lg"
          >
            <SlideRenderer
              slide={activeSlide}
              author={project.author}
              topic={project.topic}
              date={formatDate(project.createdAt)}
              slideNumber={activeIndex + 1}
            />
          </section>
        </main>

        <aside aria-label="Ajustes del slide" className="border-l border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Ajustes del slide</h2>
          <SlideEditForm
            key={activeSlide.id}
            slide={activeSlide}
            onSave={(changes) => onUpdateSlide(activeSlide.id, changes)}
            onDelete={() => onDeleteSlide(activeSlide.id)}
          />
        </aside>
      </div>
    </div>
  );
}