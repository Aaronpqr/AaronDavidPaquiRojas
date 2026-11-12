import type { Project, ProjectMeta } from '../../models/Project';
import type { Slide, SlideChanges } from '../../models/Slide';
import { formatDate } from '../../utils/formatDate';
import { SlideThumbnail } from '../components/SlideThumbnail';
import { SlideWorkspace } from '../components/SlideWorkspace';

export interface EditorViewProps {
  project: Project;
  slides: Slide[];
  activeSlide: Slide;
  activeIndex: number;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onUpdateSlide: (id: string, changes: SlideChanges) => void;
  onDeleteSlide: (id: string) => void;
  onUpdateProject: (changes: ProjectMeta) => void;
  onPresent: () => void;
  onBack: () => void;
}

const toolButton =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

export function EditorView({
  project,
  slides,
  activeSlide,
  activeIndex,
  onSelectSlide,
  onAddSlide,
  onUpdateSlide,
  onDeleteSlide,
  onUpdateProject,
  onPresent,
  onBack,
}: EditorViewProps) {
  const date = formatDate(project.createdAt);

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <button
          type="button"
          aria-label="Volver a proyectos"
          onClick={onBack}
          className="rounded-md px-2 py-1 text-lg text-slate-600 hover:bg-slate-100"
        >
          ←
        </button>
        <input
          key={project.id}
          aria-label="Nombre de la presentación"
          defaultValue={project.name}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (!value) e.target.value = project.name;
            else if (value !== project.name) onUpdateProject({ name: value });
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-72 rounded-md border border-transparent px-2 py-1 text-lg font-semibold hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
        />

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onAddSlide} className={toolButton}>
            ＋ Nueva diapositiva
          </button>
          <button
            type="button"
            aria-label="Eliminar diapositiva"
            onClick={() => onDeleteSlide(activeSlide.id)}
            disabled={activeSlide.type === 'title'}
            title={activeSlide.type === 'title' ? 'La portada no se puede eliminar' : undefined}
            className={`${toolButton} text-red-700`}
          >
            🗑 Eliminar
          </button>
          <button
            type="button"
            onClick={onPresent}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Presentar
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Diapositivas"
          className="w-52 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3"
        >
          <ul className="flex flex-col gap-2">
            {slides.map((slide, index) => {
              const active = slide.id === activeSlide.id;
              return (
                <li key={slide.id}>
                  <button
                    type="button"
                    aria-label={`Diapositiva ${index + 1}: ${slide.title || 'Sin título'}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelectSlide(slide.id)}
                    className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left hover:bg-slate-100"
                  >
                    <span className="w-4 pt-1 text-xs text-slate-500">{index + 1}</span>
                    <SlideThumbnail
                      slide={slide}
                      author={project.author}
                      topic={project.topic}
                      date={date}
                      className={`flex-1 rounded border ${
                        active ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-slate-300'
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <SlideWorkspace
          key={activeSlide.id}
          project={project}
          slide={activeSlide}
          index={activeIndex}
          total={slides.length}
          onSave={(changes) => onUpdateSlide(activeSlide.id, changes)}
          onUpdateProject={onUpdateProject}
          onPrev={() => slides[activeIndex - 1] && onSelectSlide(slides[activeIndex - 1].id)}
          onNext={() => slides[activeIndex + 1] && onSelectSlide(slides[activeIndex + 1].id)}
        />
      </div>
    </div>
  );
}
