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
    onUpdateProject: jest.fn(),
    onPresent: jest.fn(),
    onBack: jest.fn(),
    ...overrides,
  };
  render(<EditorView {...props} />);
  return props;
}

const preview = () => screen.getByRole('region', { name: 'Vista previa del slide' });

describe('EditorView', () => {
  it('muestra el nombre del proyecto y una miniatura por slide', () => {
    renderEditor();

    expect(screen.getByLabelText('Nombre de la presentación')).toHaveValue('Mi presentación');
    expect(screen.getByRole('button', { name: 'Diapositiva 1: Portada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diapositiva 2: Intro' })).toBeInTheDocument();
  });

  it('marca el slide activo con aria-current', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: 'Diapositiva 2: Intro' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Diapositiva 1: Portada' })).not.toHaveAttribute('aria-current');
  });

  it('muestra la vista previa del slide activo', () => {
    renderEditor();

    expect(within(preview()).getByText('Contenido uno')).toBeInTheDocument();
    expect(within(preview()).getByText('Ana')).toBeInTheDocument();
  });

  it('seleccionar una miniatura llama a onSelectSlide', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Diapositiva 1: Portada' }));

    expect(props.onSelectSlide).toHaveBeenCalledWith('s1');
  });

  it('los botones anterior y siguiente cambian de slide', async () => {
    const user = userEvent.setup();
    const props = renderEditor({ activeSlide: titleSlide, activeIndex: 0 });

    expect(screen.getByRole('button', { name: 'Diapositiva anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Diapositiva siguiente' }));

    expect(props.onSelectSlide).toHaveBeenCalledWith('s2');
  });

  it('"Nueva diapositiva", "Presentar" y volver llaman a sus callbacks', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: /Nueva diapositiva/ }));
    await user.click(screen.getByRole('button', { name: 'Presentar' }));
    await user.click(screen.getByRole('button', { name: 'Volver a proyectos' }));

    expect(props.onAddSlide).toHaveBeenCalledTimes(1);
    expect(props.onPresent).toHaveBeenCalledTimes(1);
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it('al escribir actualiza la vista previa en vivo y guarda al salir del campo', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    const input = screen.getByLabelText('Título');
    await user.clear(input);
    await user.type(input, 'Nuevo título');

    expect(within(preview()).getByRole('heading', { name: 'Nuevo título' })).toBeInTheDocument();
    expect(props.onUpdateSlide).not.toHaveBeenCalled();

    await user.tab();

    expect(props.onUpdateSlide).toHaveBeenCalledWith(
      's2',
      expect.objectContaining({ title: 'Nuevo título', layout: 'text-only' }),
    );
  });

  it('no guarda si no hubo cambios', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByLabelText('Título'));
    await user.tab();

    expect(props.onUpdateSlide).not.toHaveBeenCalled();
  });

  it('cambiar el diseño guarda al instante y muestra el campo de imagen si corresponde', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    expect(screen.queryByLabelText('URL de la imagen')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Texto e imagen' }));

    expect(screen.getByLabelText('URL de la imagen')).toBeInTheDocument();
    expect(props.onUpdateSlide).toHaveBeenCalledWith(
      's2',
      expect.objectContaining({ layout: 'text-and-image' }),
    );
  });

  it('la portada no tiene selector de diseño y no se puede eliminar', () => {
    renderEditor({ activeSlide: titleSlide, activeIndex: 0 });

    expect(screen.queryByRole('button', { name: 'Solo imagen' })).toBeNull();
    expect(screen.getByLabelText('Subtítulo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar diapositiva' })).toBeDisabled();
  });

  it('eliminar una diapositiva de desarrollo llama a onDeleteSlide', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    await user.click(screen.getByRole('button', { name: 'Eliminar diapositiva' }));

    expect(props.onDeleteSlide).toHaveBeenCalledWith('s2');
  });

  it('editar el autor llama a onUpdateProject', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    const author = screen.getByLabelText('Autor');
    await user.clear(author);
    await user.type(author, 'Luis');
    await user.tab();

    expect(props.onUpdateProject).toHaveBeenCalledWith({ author: 'Luis' });
  });

  it('renombrar la presentación llama a onUpdateProject', async () => {
    const user = userEvent.setup();
    const props = renderEditor();

    const name = screen.getByLabelText('Nombre de la presentación');
    await user.clear(name);
    await user.type(name, 'Otro nombre{Enter}');

    expect(props.onUpdateProject).toHaveBeenCalledWith({ name: 'Otro nombre' });
  });
});
