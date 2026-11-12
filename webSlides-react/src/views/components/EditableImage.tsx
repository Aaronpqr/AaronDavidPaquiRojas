import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { ImageTransform } from '../../models/Slide';
import { transformsEqual } from '../../utils/imageTransform';

export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

export interface SlideImageInteractionProps {
  interactive?: boolean;
  selectedImage?: boolean;
  onSelectImage?: () => void;
  onImageClick?: () => void;
  onImageTransformChange?: (transform: ImageTransform) => void;
  onImageTransformCommit?: (transform: ImageTransform) => void;
}

interface EditableImageProps {
  src: string;
  alt: string;
  transform: ImageTransform;
  interactive?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onImageClick?: () => void;
  onTransformChange?: (transform: ImageTransform) => void;
  onTransformCommit?: (transform: ImageTransform) => void;
}

const MIN_SIZE = 5;

const CORNERS: { corner: ResizeCorner; label: string; className: string }[] = [
  {
    corner: 'nw',
    label: 'esquina superior izquierda',
    className: '-left-1.5 -top-1.5 cursor-nwse-resize',
  },
  {
    corner: 'ne',
    label: 'esquina superior derecha',
    className: '-right-1.5 -top-1.5 cursor-nesw-resize',
  },
  {
    corner: 'sw',
    label: 'esquina inferior izquierda',
    className: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
  },
  {
    corner: 'se',
    label: 'esquina inferior derecha',
    className: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeNextTransform(
  mode: 'move' | ResizeCorner,
  start: ImageTransform,
  dxPct: number,
  dyPct: number,
): ImageTransform {
  if (mode === 'move') {
    const x = clamp(start.x + dxPct, 0, Math.max(0, 100 - start.width));
    const y = clamp(start.y + dyPct, 0, Math.max(0, 100 - start.height));
    return {
      x: round2(x),
      y: round2(y),
      width: round2(start.width),
      height: round2(start.height),
    };
  }

  const right = start.x + start.width;
  const bottom = start.y + start.height;

  let x = start.x;
  let y = start.y;
  let width: number;
  let height: number;

  if (mode === 'nw' || mode === 'sw') {
    x = clamp(start.x + dxPct, 0, right - MIN_SIZE);
    width = right - x;
  } else {
    width = clamp(start.width + dxPct, MIN_SIZE, 100 - start.x);
  }

  if (mode === 'nw' || mode === 'ne') {
    y = clamp(start.y + dyPct, 0, bottom - MIN_SIZE);
    height = bottom - y;
  } else {
    height = clamp(start.height + dyPct, MIN_SIZE, 100 - start.y);
  }

  return {
    x: round2(x),
    y: round2(y),
    width: round2(width),
    height: round2(height),
  };
}

/**
 * Imagen posicionada en porcentajes (0-100) respecto al contenedor de la diapositiva.
 * En modo interactivo permite seleccionar, arrastrar libremente y redimensionar desde las 4 esquinas.
 * En modo solo lectura (miniaturas y presentación) se renderiza sin controles ni eventos.
 */
export function EditableImage({
  src,
  alt,
  transform,
  interactive = false,
  selected = false,
  onSelect,
  onImageClick,
  onTransformChange,
  onTransformCommit,
}: EditableImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const callbacksRef = useRef({ onTransformChange, onTransformCommit });

  useEffect(() => {
    callbacksRef.current = { onTransformChange, onTransformCommit };
  });

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const startGesture = (e: ReactPointerEvent<HTMLElement>, mode: 'move' | ResizeCorner) => {
    if (!interactive) return;
    if (e.button > 0) return;

    e.stopPropagation();
    onSelect?.();
    wrapperRef.current?.focus({ preventScroll: true });

    const container = wrapperRef.current?.parentElement;
    const rect = container?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    cleanupRef.current?.();

    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startTransform = { ...transform };
    let latestTransform = startTransform;
    let moved = false;

    const handleMove = (moveEvent: PointerEvent) => {
      const dxPct = ((moveEvent.clientX - startClientX) / rect.width) * 100;
      const dyPct = ((moveEvent.clientY - startClientY) / rect.height) * 100;
      const next = computeNextTransform(mode, startTransform, dxPct, dyPct);
      latestTransform = next;
      if (!transformsEqual(next, startTransform)) {
        moved = true;
      }
      callbacksRef.current.onTransformChange?.(next);
    };

    const finish = () => {
      cleanup();
      if (moved) {
        callbacksRef.current.onTransformCommit?.(latestTransform);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (target.hasPointerCapture?.(e.pointerId)) {
        target.releasePointerCapture?.(e.pointerId);
      }
      if (cleanupRef.current === cleanup) {
        cleanupRef.current = null;
      }
    };

    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  };

  return (
    <div
      ref={wrapperRef}
      role={interactive ? 'group' : undefined}
      aria-label={interactive ? `Imagen: ${alt}` : undefined}
      tabIndex={interactive ? 0 : undefined}
      draggable={false}
      data-editable-image="true"
      data-selected={interactive && selected ? 'true' : 'false'}
      style={{
        left: `${transform.x}%`,
        top: `${transform.y}%`,
        width: `${transform.width}%`,
        height: `${transform.height}%`,
      }}
      onPointerDown={interactive ? (e) => startGesture(e, 'move') : undefined}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onSelect?.();
              onImageClick?.();
            }
          : undefined
      }
      onDragStart={(e) => e.preventDefault()}
      className={`absolute select-none ${
        interactive ? 'z-10 cursor-move touch-none focus:outline-none' : 'pointer-events-none'
      } ${interactive && selected ? 'ring-2 ring-blue-600' : ''}`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className="h-full w-full select-none object-contain"
      />

      {interactive &&
        selected &&
        CORNERS.map(({ corner, label, className }) => (
          <div
            key={corner}
            role="button"
            tabIndex={-1}
            aria-label={`Redimensionar imagen (${label})`}
            data-handle={corner}
            onPointerDown={(e) => startGesture(e, corner)}
            onClick={(e) => e.stopPropagation()}
            className={`absolute h-3 w-3 touch-none rounded-sm border-2 border-blue-600 bg-white shadow-sm ${className}`}
          />
        ))}
    </div>
  );
}
