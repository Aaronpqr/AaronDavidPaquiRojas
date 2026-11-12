import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../views/App';
import { InMemoryProjectRepository } from './helpers/InMemoryProjectRepository';

describe('App (integración)', () => {
    it('crear proyecto, agregar y editar un slide, presentar y volver', async () => {
        const user = userEvent.setup();
        const repo = new InMemoryProjectRepository();
        render(<App repository={repo} />);

        // 1. Lista vacía y creación del proyecto
        await screen.findByText(/Aún no tienes proyectos/);
        await user.type(screen.getByLabelText('Nombre'), 'Demo');
        await user.type(screen.getByLabelText('Autor'), 'Ana');
        await user.type(screen.getByLabelText('Tópico'), 'React');
        await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));

        // 2. Entra al editor con la portada como primer slide
        await screen.findByRole('button', { name: 'Presentar' });
        expect(screen.getByRole('button', { name: /1\. Demo/ })).toBeInTheDocument();

        // 3. Agrega un slide de desarrollo y lo edita
        await user.click(screen.getByRole('button', { name: /Agregar slide/ }));
        await screen.findByRole('button', { name: /2\. Nuevo slide/ });

        const title = screen.getByLabelText('Título');
        await user.clear(title);
        await user.type(title, 'Introducción');
        await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await screen.findByRole('button', { name: /2\. Introducción/ });

        // 4. Quedó persistido
        await waitFor(async () => {
            const stored = (await repo.getAll())[0];
            expect(stored.slides[1].title).toBe('Introducción');
        });

        // 5. Modo presentación con navegación por teclado
        await user.click(screen.getByRole('button', { name: 'Presentar' }));
        await screen.findByText('2 / 2');
        await user.keyboard('{ArrowLeft}');
        await screen.findByText('1 / 2');

        // 6. Escape vuelve al editor
        await user.keyboard('{Escape}');
        await screen.findByRole('button', { name: 'Presentar' });
    });
});