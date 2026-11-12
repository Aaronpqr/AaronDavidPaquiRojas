import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ImageTransform } from '../models/Slide';
import { EditableImage } from '../views/components/EditableImage';

const DEFAULT_TRANSFORM: ImageTransform = { x: 20, y: 20, width: 40, height: 40 };

function mockContainerRect(container: HTMLElement, width = 1000, height = 500) {
  jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect);
}

function dispatchPointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
  clientY: number,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX,
    clientY,
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

describe('EditableImage', () => {
  it('en modo solo lectura respeta las dimensiones en porcentaje y no muestra tiradores ni borde', () => {
    const { container } = render(
      <div className="relative h-[500px] w-[1000px]">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive={false}
          selected={true}
        />
      </div>,
    );

    const wrapper = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    const img = screen.getByRole('img', { name: 'Diagrama' });

    expect(wrapper.style.left).toBe('20%');
    expect(wrapper.style.top).toBe('20%');
    expect(wrapper.style.width).toBe('40%');
    expect(wrapper.style.height).toBe('40%');
    expect(wrapper.className).not.toContain('ring-blue-600');
    expect(container.querySelectorAll('[data-handle]')).toHaveLength(0);
    expect(img).toHaveAttribute('draggable', 'false');
    expect(img.className).toContain('select-none');
  });

  it('muestra ring-2 ring-blue-600 y los 4 tiradores de esquina cuando está seleccionada', () => {
    const onSelect = jest.fn();
    const { container, rerender } = render(
      <div className="relative h-[500px] w-[1000px]">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive
          selected={false}
          onSelect={onSelect}
        />
      </div>,
    );

    const wrapper = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(wrapper.className).not.toContain('ring-blue-600');
    expect(container.querySelectorAll('[data-handle]')).toHaveLength(0);

    fireEvent.click(wrapper);
    expect(onSelect).toHaveBeenCalledTimes(1);

    rerender(
      <div className="relative h-[500px] w-[1000px]">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive
          selected={true}
          onSelect={onSelect}
        />
      </div>,
    );

    expect(wrapper.className).toContain('ring-2');
    expect(wrapper.className).toContain('ring-blue-600');
    expect(container.querySelector('[data-handle="nw"]')).toBeInTheDocument();
    expect(container.querySelector('[data-handle="ne"]')).toBeInTheDocument();
    expect(container.querySelector('[data-handle="sw"]')).toBeInTheDocument();
    expect(container.querySelector('[data-handle="se"]')).toBeInTheDocument();
  });

  it('permite arrastrar la imagen dentro de los límites 0–100% y guarda al soltar', () => {
    const onTransformChange = jest.fn();
    const onTransformCommit = jest.fn();

    const { container } = render(
      <div data-testid="canvas" className="relative">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive
          selected
          onTransformChange={onTransformChange}
          onTransformCommit={onTransformCommit}
        />
      </div>,
    );

    mockContainerRect(screen.getByTestId('canvas'), 1000, 500);
    const wrapper = container.querySelector('[data-editable-image="true"]') as HTMLElement;

    dispatchPointer(wrapper, 'pointerdown', 300, 200);
    // +100px en X (10% de 1000) y +50px en Y (10% de 500)
    dispatchPointer(window, 'pointermove', 400, 250);
    expect(onTransformChange).toHaveBeenLastCalledWith({
      x: 30,
      y: 30,
      width: 40,
      height: 40,
    });
    expect(onTransformCommit).not.toHaveBeenCalled();

    // Exceder el límite derecho/inferior se limita a 100 - width / 100 - height (60%)
    dispatchPointer(window, 'pointermove', 1500, 1000);
    expect(onTransformChange).toHaveBeenLastCalledWith({
      x: 60,
      y: 60,
      width: 40,
      height: 40,
    });

    dispatchPointer(window, 'pointerup', 1500, 1000);
    expect(onTransformCommit).toHaveBeenCalledWith({
      x: 60,
      y: 60,
      width: 40,
      height: 40,
    });
  });

  it('no dispara onTransformCommit al hacer solo clic sin mover el puntero', () => {
    const onTransformCommit = jest.fn();
    const { container } = render(
      <div data-testid="canvas" className="relative">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive
          selected
          onTransformCommit={onTransformCommit}
        />
      </div>,
    );

    mockContainerRect(screen.getByTestId('canvas'), 1000, 500);
    const wrapper = container.querySelector('[data-editable-image="true"]') as HTMLElement;

    dispatchPointer(wrapper, 'pointerdown', 300, 200);
    dispatchPointer(window, 'pointerup', 300, 200);

    expect(onTransformCommit).not.toHaveBeenCalled();
  });

  it('permite redimensionar desde las 4 esquinas respetando el mínimo de 5%', () => {
    const onTransformCommit = jest.fn();
    const { container } = render(
      <div data-testid="canvas" className="relative">
        <EditableImage
          src="https://example.com/a.png"
          alt="Diagrama"
          transform={DEFAULT_TRANSFORM}
          interactive
          selected
          onTransformCommit={onTransformCommit}
        />
      </div>,
    );

    mockContainerRect(screen.getByTestId('canvas'), 1000, 500);

    // SE: +10% ancho, +10% alto
    dispatchPointer(container.querySelector('[data-handle="se"]')!, 'pointerdown', 600, 300);
    dispatchPointer(window, 'pointermove', 700, 350);
    dispatchPointer(window, 'pointerup', 700, 350);
    expect(onTransformCommit).toHaveBeenLastCalledWith({ x: 20, y: 20, width: 50, height: 50 });

    // NW: -10% X, -10% Y -> x:10, y:10, width:50, height:50
    dispatchPointer(container.querySelector('[data-handle="nw"]')!, 'pointerdown', 200, 100);
    dispatchPointer(window, 'pointermove', 100, 50);
    dispatchPointer(window, 'pointerup', 100, 50);
    expect(onTransformCommit).toHaveBeenLastCalledWith({ x: 10, y: 10, width: 50, height: 50 });

    // NE: +10% ancho, +5% Y abajo (encoge arriba) -> x:20, y:25, width:50, height:35
    dispatchPointer(container.querySelector('[data-handle="ne"]')!, 'pointerdown', 600, 100);
    dispatchPointer(window, 'pointermove', 700, 125);
    dispatchPointer(window, 'pointerup', 700, 125);
    expect(onTransformCommit).toHaveBeenLastCalledWith({ x: 20, y: 25, width: 50, height: 35 });

    // SW: intentar encoger más allá del tamaño mínimo se detiene en width=5, height=5
    dispatchPointer(container.querySelector('[data-handle="sw"]')!, 'pointerdown', 200, 300);
    dispatchPointer(window, 'pointermove', 900, 0);
    dispatchPointer(window, 'pointerup', 900, 0);
    expect(onTransformCommit).toHaveBeenLastCalledWith({ x: 55, y: 20, width: 5, height: 5 });
  });
});

