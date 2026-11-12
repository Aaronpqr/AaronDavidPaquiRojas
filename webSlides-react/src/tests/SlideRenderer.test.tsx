import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { Slide } from '../models/Slide';
import { SlideRenderer } from '../views/components/SlideRenderer';

const meta = { author: 'Ana', topic: 'React', date: '05/11/2026' };

const cover: Slide = { id: 's0', type: 'title', title: 'Mi presentación', text: 'Subtítulo', order: 0 };
const content = (over: Partial<Slide> = {}): Slide => ({
  id: 's1',
  type: 'content',
  layout: 'text-only',
  title: 'Desarrollo',
  text: 'Cuerpo del slide',
  order: 2,
  ...over,
});

describe('SlideRenderer', () => {
  it('renderiza la portada sin cabecera ni pie', () => {
    const { container } = render(<SlideRenderer slide={cover} {...meta} />);

    expect(container.querySelector('[data-slide-type="title"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Mi presentación' })).toBeInTheDocument();
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).toBeNull();
    expect(screen.queryByText('05/11/2026')).toBeNull();
  });

  it('renderiza un slide de desarrollo con cabecera y pie', () => {
    render(<SlideRenderer slide={content()} {...meta} />);

    expect(screen.getByText('Cuerpo del slide')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('05/11/2026')).toBeInTheDocument();
    // número = order + 1
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('usa el layout solo imagen', () => {
    const { container } = render(
      <SlideRenderer
        slide={content({ layout: 'image-only', imageUrl: 'https://x.com/a.png' })}
        {...meta}
      />,
    );

    expect(container.querySelector('[data-layout="image-only"]')).not.toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x.com/a.png');
  });

  it('usa el layout texto e imagen', () => {
    const { container } = render(
      <SlideRenderer
        slide={content({ layout: 'text-and-image', imageUrl: 'https://x.com/a.png' })}
        {...meta}
      />,
    );

    expect(container.querySelector('[data-layout="text-and-image"]')).not.toBeNull();
    expect(screen.getByText('Cuerpo del slide')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('usa solo texto si el slide no define layout', () => {
    const { container } = render(
      <SlideRenderer slide={content({ layout: undefined })} {...meta} />,
    );

    expect(container.querySelector('[data-layout="text-only"]')).not.toBeNull();
  });

  it('slideNumber explícito reemplaza al calculado', () => {
    render(<SlideRenderer slide={content()} {...meta} slideNumber={9} />);

    expect(screen.getByText('9')).toBeInTheDocument();
  });
});