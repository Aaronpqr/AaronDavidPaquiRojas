import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../views/App';
import { InMemoryProjectRepository } from './helpers/InMemoryProjectRepository';

describe('App (integración)', () => {
  it('crear con un clic, agregar y editar un slide, presentar y volver', async () => {
    const user = userEvent.setup();
    const repo = new InMemoryProjectRepository();
    render(<App repository={repo} />);

    // 1. Un clic crea la presentación y abre el editor
    await screen.findByText(/Aún no tienes proyectos/);
    await user.click(screen.getByRole('button', { name: 'Nueva presentación' }));
    await screen.findByRole('button', { name: 'Presentar' });
    expect(screen.getByLabelText('Nombre de la presentación')).toHaveValue('Presentación sin título');
    expect(
      screen.getByRole('button', { name: 'Diapositiva 1: Presentación sin título' }),
    ).toBeInTheDocument();

    // 2. Agrega una diapositiva de desarrollo y la edita
    await user.click(screen.getByRole('button', { name: /Nueva diapositiva/ }));
    await screen.findByRole('button', { name: 'Diapositiva 2: Nuevo slide' });

    const title = screen.getByLabelText('Título');
    await user.clear(title);
    await user.type(title, 'Introducción');
    await user.tab();
    await screen.findByRole('button', { name: 'Diapositiva 2: Introducción' });

    // 3. Quedó persistido
    await waitFor(async () => {
      const stored = (await repo.getAll())[0];
      expect(stored.slides[1].title).toBe('Introducción');
    });

    // 4. Presentación con teclado
    await user.click(screen.getByRole('button', { name: 'Presentar' }));
    await screen.findByText('2 / 2');
    await user.keyboard('{ArrowLeft}');
    await screen.findByText('1 / 2');

    // 5. Escape vuelve al editor
    await user.keyboard('{Escape}');
    await screen.findByRole('button', { name: 'Presentar' });
  });
});
