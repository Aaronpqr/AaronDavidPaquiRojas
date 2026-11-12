import type { ImageTransform, SlideLayout } from '../models/Slide';

/**
 * Posición y tamaño inicial (%) de una imagen según el diseño del slide.
 * - 'image-only': centrada y amplia debajo del título.
 * - 'text-and-image': ubicada en el área derecha sin cubrir el título ni el texto.
 */
export const DEFAULT_IMAGE_TRANSFORMS: Record<'image-only' | 'text-and-image', ImageTransform> = {
  'image-only': { x: 8, y: 20, width: 84, height: 74 },
  'text-and-image': { x: 52, y: 20, width: 43, height: 74 },
};

export function getDefaultImageTransform(layout?: SlideLayout): ImageTransform {
  if (layout === 'text-and-image') {
    return { ...DEFAULT_IMAGE_TRANSFORMS['text-and-image'] };
  }
  return { ...DEFAULT_IMAGE_TRANSFORMS['image-only'] };
}

export function transformsEqual(a?: ImageTransform, b?: ImageTransform): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

