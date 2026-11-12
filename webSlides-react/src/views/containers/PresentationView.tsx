import { useEffect, useRef } from 'react';
import type { Slide } from '../../models/Slide';
import { SlideRenderer } from '../components/SlideRenderer';

interface PresentationViewProps {
  slide: Slide;
  index: number;
  total: number;
  author: string;
  topic: string;
  date: string;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export function PresentationView({
  slide,
  index,
  total,
  author,
  topic,
  date,
  onNext,
  onPrev,
  onExit,
}: PresentationViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onExitRef = useRef(onExit);

  useEffect(() => {
    onExitRef.current = onExit;
  });

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onExit]);

  // Pantalla completa real (Fullscreen API); en entornos sin soporte se ignora
  useEffect(() => {
    const element = rootRef.current;
    if (element && typeof element.requestFullscreen === 'function') {
      element.requestFullscreen().catch(() => {});
    }

    // El navegador consume Escape para salir de pantalla completa:
    // lo detectamos por el evento fullscreenchange.
    const handleChange = () => {
      if (!document.fullscreenElement) onExitRef.current();
    };
    document.addEventListener('fullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Modo presentación"
      className="group fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      {/* Mantiene 16:9 y cabe siempre en la pantalla */}
      <div style={{ width: 'min(100vw, calc(100vh * 16 / 9))', aspectRatio: '16 / 9' }}>
        <SlideRenderer
          slide={slide}
          author={author}
          topic={topic}
          date={date}
          slideNumber={index + 1}
        />
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded bg-black/60 px-3 py-2 text-white opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" aria-label="Slide anterior" onClick={onPrev}>‹</button>
        <span>{`${index + 1} / ${total}`}</span>
        <button type="button" aria-label="Slide siguiente" onClick={onNext}>›</button>
        <button type="button" onClick={onExit} className="ml-2 underline">Salir</button>
      </div>
    </div>
  );
}
