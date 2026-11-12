import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectListView } from '../views/containers/ProjectListView';
import { makeProject } from './helpers/factories';

function setup(over: Partial<React.ComponentProps<typeof ProjectListView>> = {}) {
    const props = {
        projects: [],
        loading: false,
        error: null,
        onCreate: jest.fn(),
        onOpen: jest.fn(),
        onDelete: jest.fn(),
        ...over,
    };
    render(<ProjectListView {...props} />);
    return props;
}

describe('ProjectListView', () => {
    it('muestra un estado de carga', () => {
        setup({ loading: true });
        expect(screen.getByText(/Cargando/)).toBeInTheDocument();
    });

    it('muestra un mensaje cuando no hay proyectos', () => {
        setup();
        expect(screen.getByText(/Aún no tienes proyectos/)).toBeInTheDocument();
    });

    it('lista los proyectos existentes', () => {
        setup({ projects: [makeProject({ id: 'a', name: 'Demo' }), makeProject({ id: 'b', name: 'Otro' })] });
        expect(screen.getByText('Demo')).toBeInTheDocument();
        expect(screen.getByText('Otro')).toBeInTheDocument();
    });

    it('muestra el error en un alert', () => {
        setup({ error: 'boom' });
        expect(screen.getByRole('alert')).toHaveTextContent('boom');
    });

    it('crea un proyecto con los datos del formulario', async () => {
        const user = userEvent.setup();
        const props = setup();

        await user.type(screen.getByLabelText('Nombre'), 'Mi demo');
        await user.type(screen.getByLabelText('Autor'), 'Ana');
        await user.type(screen.getByLabelText('Tópico'), 'React');
        await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));

        expect(props.onCreate).toHaveBeenCalledWith({ name: 'Mi demo', author: 'Ana', topic: 'React' });
    });

    it('no crea el proyecto si faltan campos', async () => {
        const user = userEvent.setup();
        const props = setup();

        await user.type(screen.getByLabelText('Nombre'), 'Solo nombre');
        await user.click(screen.getByRole('button', { name: 'Crear proyecto' }));

        expect(props.onCreate).not.toHaveBeenCalled();
    });

    it('abre un proyecto', async () => {
        const user = userEvent.setup();
        const props = setup({ projects: [makeProject({ id: 'a', name: 'Demo' })] });

        await user.click(screen.getByRole('button', { name: 'Abrir Demo' }));

        expect(props.onOpen).toHaveBeenCalledWith('a');
    });

    it('elimina un proyecto', async () => {
        const user = userEvent.setup();
        const props = setup({ projects: [makeProject({ id: 'a', name: 'Demo' })] });

        await user.click(screen.getByRole('button', { name: 'Eliminar Demo' }));

        expect(props.onDelete).toHaveBeenCalledWith('a');
    });
});