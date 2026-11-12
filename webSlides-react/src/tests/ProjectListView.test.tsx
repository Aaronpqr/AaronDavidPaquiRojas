import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from '../models/Project';
import { ProjectListView } from '../views/containers/ProjectListView';
import { makeProject } from './helpers/factories';

interface Overrides {
  projects?: Project[];
  loading?: boolean;
  error?: string | null;
}

function setup(over: Overrides = {}) {
  const props = {
    projects: [] as Project[],
    loading: false,
    error: null as string | null,
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

  it('crear una presentación no pide ningún dato', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('button', { name: 'Nueva presentación' }));

    expect(props.onCreate).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Autor')).toBeNull();
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
