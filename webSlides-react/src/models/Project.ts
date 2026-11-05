import type { Slide } from './Slide';

export interface Project {
  id: string;
  name: string;
  /** Autor y tópico se muestran en el Header/Footer de los slides de desarrollo. */
  author: string;
  topic: string;
  slides: Slide[];
  /** Fechas en formato ISO 8601 (serializable en IndexedDB y en JSON REST). */
  createdAt: string;
  updatedAt: string;
}
