import type { Slide } from '../../models/Slide';
import { SlideRenderer } from './SlideRenderer';

interface SlideThumbnailProps {
  slide: Slide;
  author: string;
  topic: string;
  date: string;
  className?: string;
}

/** Vista reducida de un slide. Decorativa: no recibe clics ni la leen los lectores de pantalla. */
export function SlideThumbnail({ slide, author, topic, date, className = '' }: SlideThumbnailProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none aspect-video select-none overflow-hidden bg-white ${className}`}
    >
      <SlideRenderer slide={slide} author={author} topic={topic} date={date} />
    </div>
  );
}
