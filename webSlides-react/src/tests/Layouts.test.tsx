import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { LayoutImageOnly } from '../views/components/LayoutImageOnly';
import { LayoutTextAndImage } from '../views/components/LayoutTextAndImage';
import { LayoutTextOnly } from '../views/components/LayoutTextOnly';

const URL = 'https://example.com/foto.png';

describe('LayoutTextOnly', () => {
  it('muestra título y texto', () => {
    render(<LayoutTextOnly title="Intro" text="Hola mundo" />);
    expect(screen.getByRole('heading', { name: 'Intro' })).toBeInTheDocument();
    expect(screen.getByText('Hola mundo')).toBeInTheDocument();
  });
});

describe('LayoutImageOnly', () => {
  it('muestra el título y la imagen', () => {
    render(<LayoutImageOnly title="Diagrama" imageUrl={URL} />);
    expect(screen.getByRole('heading', { name: 'Diagrama' })).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', URL);
  });

  it('muestra un marcador si no hay imagen', () => {
    render(<LayoutImageOnly title="Diagrama" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('aplica imageTransform personalizado o el predeterminado del diseño', () => {
    const { container, rerender } = render(<LayoutImageOnly title="Diagrama" imageUrl={URL} />);
    const defaultBox = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(defaultBox.style.left).toBe('8%');
    expect(defaultBox.style.width).toBe('84%');

    rerender(
      <LayoutImageOnly
        title="Diagrama"
        imageUrl={URL}
        imageTransform={{ x: 15, y: 25, width: 60, height: 50 }}
      />,
    );
    const customBox = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(customBox.style.left).toBe('15%');
    expect(customBox.style.top).toBe('25%');
    expect(customBox.style.width).toBe('60%');
    expect(customBox.style.height).toBe('50%');
  });
});

describe('LayoutTextAndImage', () => {
  it('muestra título, texto e imagen', () => {
    render(<LayoutTextAndImage title="Mixto" text="Descripción" imageUrl={URL} />);
    expect(screen.getByRole('heading', { name: 'Mixto' })).toBeInTheDocument();
    expect(screen.getByText('Descripción')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', URL);
  });

  it('muestra un marcador si no hay imagen', () => {
    render(<LayoutTextAndImage title="Mixto" text="Descripción" />);
    expect(screen.getByText('Sin imagen')).toBeInTheDocument();
  });

  it('posiciona la imagen a la derecha por defecto sin tapar el texto', () => {
    const { container } = render(
      <LayoutTextAndImage title="Mixto" text="Descripción" imageUrl={URL} />,
    );
    const box = container.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(Number.parseFloat(box.style.left)).toBeGreaterThanOrEqual(50);
    expect(box.style.width).toBe('43%');
  });
});
