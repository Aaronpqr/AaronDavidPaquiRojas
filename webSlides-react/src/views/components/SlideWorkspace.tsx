import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import type { Project, ProjectMeta } from '../../models/Project';
import type { ImageTransform, Slide, SlideChanges, SlideLayout } from '../../models/Slide';
import { formatDate } from '../../utils/formatDate';
import { getDefaultImageTransform, transformsEqual } from '../../utils/imageTransform';
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
  imageTransform?: ImageTransform;
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

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.name)
  );
}

function getClipboardImageFile(data: DataTransfer | null): File | null {
  if (!data) return null;
  if (data.items) {
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }
  if (data.files) {
    for (const file of Array.from(data.files)) {
      if (isImageFile(file)) return file;
    }
  }
  return null;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

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
    imageTransform: slide.imageTransform,
  });
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(draft);
  const mountedRef = useRef(true);
  const readerRef = useRef<FileReader | null>(null);
  const ignoreCanvasClickRef = useRef(false);

  const showText = !isContent || draft.layout !== 'image-only';
  const showImage = isContent && draft.layout !== 'text-only';

  const toChanges = (d: Draft): SlideChanges => {
    if (!isContent) return { title: d.title, text: d.text };
    const imageUrl = d.imageUrl.trim() || undefined;
    return {
      title: d.title,
      text: d.text,
      layout: d.layout,
      imageUrl,
      imageTransform: imageUrl ? d.imageTransform : undefined,
    };
  };

  const commit = (d: Draft) => {
    const c = toChanges(d);
    const changed =
      c.title !== slide.title ||
      c.text !== slide.text ||
      (isContent &&
        (c.layout !== (slide.layout ?? 'text-only') ||
          c.imageUrl !== slide.imageUrl ||
          !transformsEqual(c.imageTransform, slide.imageTransform)));
    if (changed) onSave(c);
  };

  const updateDraft = (next: Draft) => {
    draftRef.current = next;
    setDraft(next);
  };

  const loadImageFile = (file: File) => {
    readerRef.current?.abort();
    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = () => {
      if (readerRef.current !== reader || !mountedRef.current) return;
      readerRef.current = null;
      if (typeof reader.result !== 'string') return;

      const current = draftRef.current;
      const nextLayout: SlideLayout =
        current.layout === 'text-only' ? 'text-and-image' : current.layout;
      const next: Draft = {
        ...current,
        layout: nextLayout,
        imageUrl: reader.result,
        imageTransform: getDefaultImageTransform(nextLayout),
      };
      updateDraft(next);
      commitRef.current(next);
    };

    reader.onerror = () => {
      if (readerRef.current === reader) readerRef.current = null;
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    readerRef.current?.abort();
    readerRef.current = null;
    setIsImageSelected(false);
    const next: Draft = { ...draftRef.current, imageUrl: '', imageTransform: undefined };
    updateDraft(next);
    commitRef.current(next);
  };

  const commitRef = useRef(commit);
  const loadImageFileRef = useRef(loadImageFile);
  const removeImageRef = useRef(handleRemoveImage);

  useEffect(() => {
    draftRef.current = draft;
    commitRef.current = commit;
    loadImageFileRef.current = loadImageFile;
    removeImageRef.current = handleRemoveImage;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      readerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isContent) return;
    const handlePaste = (event: ClipboardEvent) => {
      const file = getClipboardImageFile(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      loadImageFileRef.current(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isContent]);

  useEffect(() => {
    if (!isContent || !isImageSelected || !showImage || draft.imageUrl.trim() === '') {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (isEditableTarget(event.target) || isEditableTarget(document.activeElement)) return;
      event.preventDefault();
      removeImageRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContent, isImageSelected, showImage, draft.imageUrl]);

  const chooseLayout = (layout: SlideLayout) => {
    if (layout === 'text-only') setIsImageSelected(false);

    let nextTransform = draft.imageTransform;
    if (layout !== 'text-only' && draft.imageUrl.trim() !== '') {
      const oldDefault = getDefaultImageTransform(draft.layout);
      if (!nextTransform || transformsEqual(nextTransform, oldDefault)) {
        nextTransform = getDefaultImageTransform(layout);
      }
    }

    const next: Draft = { ...draft, layout, imageTransform: nextTransform };
    updateDraft(next);
    commit(next);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    loadImageFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!isContent) return;
    event.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!isContent) return;
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    if (!isContent) return;
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    const imageFile = files.find(isImageFile);
    if (imageFile) loadImageFile(imageFile);
  };

  const preview: Slide = { ...slide, ...toChanges(draft) };

  return (
    <>
      <main
        onPointerDown={() => {
          ignoreCanvasClickRef.current = false;
          setIsImageSelected(false);
        }}
        onClick={() => {
          if (ignoreCanvasClickRef.current) {
            ignoreCanvasClickRef.current = false;
            return;
          }
          setIsImageSelected(false);
        }}
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-6"
      >
        <section
          aria-label="Vista previa del slide"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ width: 'min(100%, calc((100vh - 13rem) * 16 / 9))' }}
          className={`relative aspect-video overflow-hidden rounded-lg bg-white shadow-xl ring-1 ${
            isDragOver ? 'ring-2 ring-indigo-500 ring-offset-2' : 'ring-slate-200'
          }`}
        >
          <SlideRenderer
            slide={preview}
            author={project.author}
            topic={project.topic}
            date={formatDate(project.createdAt)}
            slideNumber={index + 1}
            interactive={isContent}
            selectedImage={isImageSelected}
            onSelectImage={() => {
              ignoreCanvasClickRef.current = true;
              setIsImageSelected(true);
            }}
            onImageClick={() => {
              ignoreCanvasClickRef.current = false;
            }}
            onImageTransformChange={(imageTransform) =>
              updateDraft({ ...draftRef.current, imageTransform })
            }
            onImageTransformCommit={(imageTransform) => {
              const next = { ...draftRef.current, imageTransform };
              updateDraft(next);
              commitRef.current(next);
            }}
          />
          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-indigo-500 bg-indigo-50/80 text-sm font-medium text-indigo-700">
              Suelta la imagen aquí
            </div>
          )}
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
              onChange={(e) => updateDraft({ ...draft, title: e.target.value })}
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
                onChange={(e) => updateDraft({ ...draft, text: e.target.value })}
                onBlur={() => commit(draft)}
              />
            </div>
          )}

          {showImage && (
            <div className="flex flex-col gap-2">
              <div>
                <label htmlFor="slide-image" className={labelClass}>URL de la imagen</label>
                <input
                  id="slide-image"
                  type="url"
                  placeholder="https://..."
                  className={fieldClass}
                  value={draft.imageUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    if (!url.trim()) setIsImageSelected(false);
                    updateDraft({
                      ...draft,
                      imageUrl: url,
                      imageTransform: url.trim()
                        ? (draft.imageTransform ?? getDefaultImageTransform(draft.layout))
                        : undefined,
                    });
                  }}
                  onBlur={() => commit(draft)}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Seleccionar imagen desde el equipo"
                tabIndex={-1}
                onChange={handleFileChange}
                className="sr-only"
              />

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  Subir imagen desde el equipo
                </button>

                {draft.imageUrl.trim() !== '' && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="w-full rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                  >
                    Quitar imagen
                  </button>
                )}
              </div>
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
