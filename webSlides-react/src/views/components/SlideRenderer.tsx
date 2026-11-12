import type { CSSProperties } from 'react';
import type { Slide } from '../../models/Slide';
import { HeaderFooter } from './HeaderFooter';
import { LayoutImageOnly } from './LayoutImageOnly';
import { LayoutTextAndImage } from './LayoutTextAndImage';
import { LayoutTextOnly } from './LayoutTextOnly';

interface SlideRendererProps {
  slide: Slide;
  author: string;
  topic: string;
  /** Fecha ya formateada para mostrar. */
  date: string;
  /** Si se omite, se usa slide.order + 1. */
  slideNumber?: number;
}

const containerStyle = { containerType: 'inline-size' } as CSSProperties;

function renderLayout(slide: Slide) {
  switch (slide.layout ?? 'text-only') {
    case 'image-only':
      return <LayoutImageOnly title={slide.title} imageUrl={slide.imageUrl} />;
    case 'text-and-image':
      return (
        <LayoutTextAndImage title={slide.title} text={slide.text} imageUrl={slide.imageUrl} />
      );
    default:
      return <LayoutTextOnly title={slide.title} text={slide.text} />;
  }
}

/**
 * Decide qué pintar según el tipo de slide. El contenedor define un "container
 * query" (cqw) para que todo escale con el ancho del slide, tanto en la vista
 * previa del editor como en miniaturas y en pantalla completa.
 */
export function SlideRenderer({ slide, author, topic, date, slideNumber }: SlideRendererProps) {
  if (slide.type === 'title') {
    return (
      <div
        data-slide-type="title"
        style={containerStyle}
        className="h-full w-full overflow-hidden"
      >
        <div className="flex h-full flex-col items-center justify-center gap-[2cqw] bg-indigo-700 p-[6cqw] text-center text-white">
          <h2 className="text-[6cqw] font-bold leading-tight">{slide.title}</h2>
          <p className="whitespace-pre-wrap text-[3cqw] text-indigo-100">{slide.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-slide-type="content"
      style={containerStyle}
      className="h-full w-full overflow-hidden bg-white text-slate-900"
    >
      <HeaderFooter
        author={author}
        topic={topic}
        date={date}
        slideNumber={slideNumber ?? slide.order + 1}
      >
        {renderLayout(slide)}
      </HeaderFooter>
    </div>
  );
}
