import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Slide } from '../models/Slide';
import { EditorView, type EditorViewProps } from '../views/containers/EditorView';
import { makeProject } from './helpers/factories';

const titleSlide: Slide = { id: 's1', type: 'title', title: 'Portada', text: 'Sub', order: 0 };
const contentSlide: Slide = {
  id: 's2',
  type: 'content',
  layout: 'text-only',
  title: 'Intro',
  text: 'Contenido uno',
  order: 1,
};
const project = makeProject({
  id: 'p1',
  name: 'Mi presentación',
  author: 'Ana',
  topic: 'React',
  slides: [titleSlide, contentSlide],
});

function renderEditor(overrides: Partial<EditorViewProps> = {}) {
  const props: EditorViewProps = {
    project,
    slides: project.slides,
    activeSlide: contentSlide,
    activeIndex: 1,
    onSelectSlide: jest.fn(),
    onAddSlide: jest.fn(),
    onUpdateSlide: jest.fn(),
    onDeleteSlide: jest.fn(),
    onPresent: jest.fn(),
    onBack: jest.fn(),
    ...overrides,
  };
  render(<EditorView {...props} />);
  return props;
}

describe('EditorView', () => {
  it('muestra el nombre del proyecto y la lista de slides', () => {
    renderEditor();

    expect(screen.getByRole('heading', { level: 1, name: 'Mi presentación' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /1\. Portada/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\. Intro/ })).toBeInTheDocument();
  });

  it('marca el slide activo con aria-current', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: /2\. Intro/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /1\. Portada/ })).not.toHaveAttribute('aria-current');
  });

  it('muestra la vista previa del slide activo', () => {
    renderEditor();

    const preview = screen.getByRole('region', { name: 'Vista previa del slide' });
    expect(within(preview).getByText('Contenido uno')).toBeInTheDocument();
    expect(within(preview).getByText('Ana')).toBeInTheDocument();
  });

  it('seleccionar un slide llama a onSelectSlide con su id', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: /1\. Portada/ }));

    expect(props.onSelectSlide).toHaveBeenCalledWith('s1');
  });

  it('"Agregar slide" llama a onAddSlide', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: /Agregar slide/ }));

    expect(props.onAddSlide).toHaveBeenCalledTimes(1);
  });

  it('"Presentar" llama a onPresent', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Presentar' }));

    expect(props.onPresent).toHaveBeenCalledTimes(1);
  });

  it('"Proyectos" llama a onBack', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: /Proyectos/ }));

    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('guardar cambios envía los datos editados', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    const input = screen.getByLabelText('Título');
    await user.clear(input);
    await user.type(input, 'Nuevo título');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(props.onUpdateSlide).toHaveBeenCalledWith(
      's2',
      expect.objectContaining({ title: 'Nuevo título', layout: 'text-only' }),
    );
  });

  it('el campo de URL de imagen solo aparece con layouts que usan imagen', async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(screen.queryByLabelText('URL de la imagen')).toBeNull();

    await user.selectOptions(screen.getByLabelText('Layout'), 'text-and-image');

    expect(screen.getByLabelText('URL de la imagen')).toBeInTheDocument();
  });

  it('no permite eliminar la portada', () => {
    renderEditor({ activeSlide: titleSlide, activeIndex: 0 });

    expect(screen.getByRole('button', { name: 'Eliminar slide' })).toBeDisabled();
    expect(screen.queryByLabelText('Layout')).toBeNull();
  });

  it('eliminar un slide de desarrollo llama a onDeleteSlide', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Eliminar slide' }));

    expect(props.onDeleteSlide).toHaveBeenCalledWith('s2');
  });
});