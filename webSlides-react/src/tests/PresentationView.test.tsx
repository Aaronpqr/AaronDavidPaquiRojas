import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Slide } from '../models/Slide';
import { PresentationView } from '../views/containers/PresentationView';

const slide: Slide = {
  id: 's2',
  type: 'content',
  layout: 'text-only',
  title: 'Intro',
  text: 'Contenido uno',
  order: 1,
};

function setup() {
  const handlers = { onNext: jest.fn(), onPrev: jest.fn(), onExit: jest.fn() };
  const utils = render(
    <PresentationView
      slide={slide}
      index={1}
      total={5}
      author="Ana"
      topic="React"
      date="05/11/2026"
      {...handlers}
    />,
  );
  return { ...handlers, ...utils };
}

describe('PresentationView', () => {
  it('muestra el slide y el contador', () => {
    setup();

    expect(screen.getByText('Contenido uno')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('la flecha derecha avanza', () => {
    const { onNext } = setup();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('la flecha izquierda retrocede', () => {
    const { onPrev } = setup();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('Escape sale de la presentación', () => {
    const { onExit } = setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('los botones en pantalla también navegan y salen', async () => {
    const user = userEvent.setup();
    const { onNext, onPrev, onExit } = setup();

    await user.click(screen.getByRole('button', { name: 'Slide siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Slide anterior' }));
    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('deja de escuchar el teclado al desmontarse', () => {
    const { onNext, unmount } = setup();
    unmount();

    fireEvent.keyDown(window, { key: 'ArrowRight' });

    expect(onNext).not.toHaveBeenCalled();
  });

  it('refleja imageTransform exacto en modo solo lectura sin controles de edición', () => {
    const imageSlide: Slide = {
      ...slide,
      layout: 'image-only',
      imageUrl: 'https://example.com/foto.png',
      imageTransform: { x: 12, y: 24, width: 70, height: 60 },
    };

    const { container } = render(
      <PresentationView
        slide={imageSlide}
        index={1}
        total={5}
        author="Ana"
        topic="React"
        date="05/11/2026"
        onNext={jest.fn()}
        onPrev={jest.fn()}
        onExit={jest.fn()}
      />,
    );

    const box = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(box.style.left).toBe('12%');
    expect(box.style.top).toBe('24%');
    expect(box.style.width).toBe('70%');
    expect(box.style.height).toBe('60%');
    expect(box.className).not.toContain('ring-blue-600');
    expect(container.querySelectorAll('[data-handle]')).toHaveLength(0);
  });
});
