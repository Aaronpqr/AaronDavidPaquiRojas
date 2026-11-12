import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Slide, SlideChanges, SlideLayout } from '../../models/Slide';

const LAYOUT_OPTIONS: { value: SlideLayout; label: string }[] = [
  { value: 'text-only', label: 'Solo texto' },
  { value: 'image-only', label: 'Solo imagen' },
  { value: 'text-and-image', label: 'Texto e imagen' },
];

interface SlideEditFormProps {
  slide: Slide;
  onSave: (changes: SlideChanges) => void;
  onDelete: () => void;
}

/**
 * Formulario de ajustes. Mantiene un borrador local y solo guarda al enviar,
 * para no escribir en IndexedDB en cada tecla. El padre usa key={slide.id}
 * para reiniciar el borrador al cambiar de slide.
 */
export function SlideEditForm({ slide, onSave, onDelete }: SlideEditFormProps) {
  const isContent = slide.type === 'content';
  const [title, setTitle] = useState(slide.title);
  const [text, setText] = useState(slide.text);
  const [layout, setLayout] = useState<SlideLayout>(slide.layout ?? 'text-only');
  const [imageUrl, setImageUrl] = useState(slide.imageUrl ?? '');

  const showText = !isContent || layout !== 'image-only';
  const showImage = isContent && layout !== 'text-only';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isContent) {
      onSave({ title, text, layout, imageUrl: imageUrl.trim() || undefined });
    } else {
      onSave({ title, text });
    }
  };

  const fieldClass =
    'w-full rounded border border-slate-300 px-2 py-1.5 focus:border-indigo-500 focus:outline-none';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="slide-title" className={labelClass}>Título</label>
        <input
          id="slide-title"
          className={fieldClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {isContent && (
        <div>
          <label htmlFor="slide-layout" className={labelClass}>Layout</label>
          <select
            id="slide-layout"
            className={fieldClass}
            value={layout}
            onChange={(e) => setLayout(e.target.value as SlideLayout)}
          >
            {LAYOUT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {showText && (
        <div>
          <label htmlFor="slide-text" className={labelClass}>
            {isContent ? 'Texto' : 'Subtítulo'}
          </label>
          <textarea
            id="slide-text"
            rows={6}
            className={fieldClass}
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!isContent}
          title={isContent ? undefined : 'La portada no se puede eliminar'}
          className="rounded border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Eliminar slide
        </button>
      </div>
    </form>
  );
}