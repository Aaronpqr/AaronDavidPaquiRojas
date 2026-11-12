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
});
