import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { HeaderFooter } from '../views/components/HeaderFooter';

describe('HeaderFooter', () => {
  it('muestra autor, tópico, número de slide y fecha', () => {
    render(
      <HeaderFooter author="Ana" topic="React" slideNumber={3} date="05 de noviembre de 2026">
        <p>Cuerpo</p>
      </HeaderFooter>,
    );

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('05 de noviembre de 2026')).toBeInTheDocument();
  });

  it('renderiza el contenido hijo entre cabecera y pie', () => {
    render(
      <HeaderFooter author="A" topic="T" slideNumber={1} date="hoy">
        <p>Contenido central</p>
      </HeaderFooter>,
    );

    expect(screen.getByText('Contenido central')).toBeInTheDocument();
  });
});
