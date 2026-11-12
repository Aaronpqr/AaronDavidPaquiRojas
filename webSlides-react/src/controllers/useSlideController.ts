import { useCallback, useMemo, useState } from 'react';
import type { Project } from '../models/Project';
import type { Slide, SlideChanges } from '../models/Slide';
import { generateId } from '../utils/generateId';

interface UseSlideControllerOptions {
  /** Proyecto actualmente abierto (null si no hay ninguno). */
  project: Project | null;
  /** Persistencia delegada al controlador de proyectos. */
  saveProject: (project: Project) => Promise<Project | null>;
}

/** Mantiene order = posición en el arreglo (0, 1, 2…). */
function reindex(slides: Slide[]): Slide[] {
  return slides.map((slide, index) => ({ ...slide, order: index }));
}

export function useSlideController({ project, saveProject }: UseSlideControllerOptions) {
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isPresentation, setIsPresentation] = useState(false);

  const slides = useMemo(
    () => [...(project?.slides ?? [])].sort((a, b) => a.order - b.order),
    [project],
  );

  // Estado derivado: si el id guardado no existe (otro proyecto), cae al primero.
  const activeIndex = useMemo(() => {
    const index = slides.findIndex((s) => s.id === activeSlideId);
    return index === -1 ? 0 : index;
  }, [slides, activeSlideId]);

  const activeSlide: Slide | null = slides[activeIndex] ?? null;

  const persist = useCallback(
    async (next: Slide[]): Promise<Project | null> => {
      if (!project) return null;
      return saveProject({ ...project, slides: reindex(next) });
    },
    [project, saveProject],
  );

  const selectSlide = useCallback((id: string) => setActiveSlideId(id), []);

  const nextSlide = useCallback(() => {
    const next = slides[activeIndex + 1];
    if (next) setActiveSlideId(next.id);
  }, [slides, activeIndex]);

  const prevSlide = useCallback(() => {
    const prev = slides[activeIndex - 1];
    if (prev) setActiveSlideId(prev.id);
  }, [slides, activeIndex]);

  const addSlide = useCallback(async (): Promise<Slide | null> => {
    // Regla HU-02: el primer slide es Portada, los siguientes son Desarrollo
    const newSlide: Slide =
      slides.length === 0
        ? { id: generateId(), type: 'title', title: 'Portada', text: '', order: 0 }
        : {
            id: generateId(),
            type: 'content',
            layout: 'text-only',
            title: 'Nuevo slide',
            text: '',
            order: slides.length,
          };

    const saved = await persist([...slides, newSlide]);
    if (!saved) return null;
    setActiveSlideId(newSlide.id);
    return newSlide;
  }, [slides, persist]);

  const updateSlide = useCallback(
    async (id: string, changes: SlideChanges): Promise<boolean> => {
      const target = slides.find((s) => s.id === id);
      if (!target) return false;

      const safe: SlideChanges = { ...changes };
      // La portada no tiene layout
      if (target.type === 'title') delete safe.layout;

      const saved = await persist(
        slides.map((s) => (s.id === id ? { ...s, ...safe } : s)),
      );
      return saved !== null;
    },
    [slides, persist],
  );

  const deleteSlide = useCallback(
    async (id: string): Promise<boolean> => {
      const index = slides.findIndex((s) => s.id === id);
      const target = slides[index];
      // La portada no se puede eliminar
      if (!target || target.type === 'title') return false;

      const remaining = slides.filter((s) => s.id !== id);
      const saved = await persist(remaining);
      if (!saved) return false;

      if (activeSlide?.id === id) {
        const fallback = remaining[Math.max(0, index - 1)];
        if (fallback) setActiveSlideId(fallback.id);
      }
      return true;
    },
    [slides, activeSlide, persist],
  );

  const startPresentation = useCallback(() => setIsPresentation(true), []);
  const stopPresentation = useCallback(() => setIsPresentation(false), []);

  return {
    slides,
    activeSlide,
    activeIndex,
    isPresentation,
    selectSlide,
    nextSlide,
    prevSlide,
    addSlide,
    updateSlide,
    deleteSlide,
    startPresentation,
    stopPresentation,
  };
}
