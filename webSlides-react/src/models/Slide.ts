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
  /** Posición del slide dentro del proyecto (base 0). */
  order: number;
}
