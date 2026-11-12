/**
 * Tipo de slide:
 * - 'title':   Portada (siempre el primer slide del proyecto)
 * - 'content': Desarrollo (del segundo slide en adelante)
 */
export type SlideType = 'title' | 'content';

/**
 * Formato de un slide de desarrollo.
 */
export type SlideLayout = 'text-only' | 'image-only' | 'text-and-image';

/**
 * Posición y tamaño de la imagen en porcentajes (0–100) respecto al contenedor del slide.
 */
export interface ImageTransform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Slide {
  id: string;
  type: SlideType;
  /** Solo aplica a slides de tipo 'content'. */
  layout?: SlideLayout;
  title: string;
  /** Texto del slide (subtítulo en la portada, cuerpo en desarrollo). */
  text: string;
  /** URL de la imagen (layouts 'image-only' y 'text-and-image'). */
  imageUrl?: string;
  /** Transformación espacial opcional de la imagen en porcentajes (0–100). */
  imageTransform?: ImageTransform;
  /** Posición del slide dentro del proyecto (base 0). */
  order: number;
}

/** Campos de un slide que el usuario puede editar. */
export type SlideChanges = Partial<
  Pick<Slide, 'title' | 'text' | 'layout' | 'imageUrl' | 'imageTransform'>
>;
