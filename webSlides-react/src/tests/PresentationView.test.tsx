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
});
