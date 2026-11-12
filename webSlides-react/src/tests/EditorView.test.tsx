import '@testing-library/jest-dom/jest-globals';
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('subir una imagen local la convierte a Base64, actualiza la vista previa y guarda al instante', async () => {
    const user = userEvent.setup();
    const imageSlide: Slide = {
      ...contentSlide,
      layout: 'image-only',
    };
    const props = renderEditor({ activeSlide: imageSlide });

    expect(screen.queryByRole('button', { name: 'Quitar imagen' })).toBeNull();

    const fileInput = screen.getByLabelText('Seleccionar imagen desde el equipo') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/*');

    const clickSpy = jest.spyOn(fileInput, 'click');
    await user.click(screen.getByRole('button', { name: 'Subir imagen desde el equipo' }));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();

    const file = new File(['contenido-png'], 'foto.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(props.onUpdateSlide).toHaveBeenCalledWith(
        's2',
        expect.objectContaining({
          layout: 'image-only',
          imageUrl: expect.stringMatching(/^data:image\/png;base64,/),
          imageTransform: { x: 8, y: 20, width: 84, height: 74 },
        }),
      );
    });

    const img = within(preview()).getByRole('img');
    expect(img.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(screen.getByRole('button', { name: 'Quitar imagen' })).toBeInTheDocument();
  });

  it('al pulsar "Quitar imagen" limpia la imagen de la vista previa y guarda el cambio', async () => {
    const user = userEvent.setup();
    const imageSlide: Slide = {
      ...contentSlide,
      layout: 'text-and-image',
      imageUrl: 'https://example.com/foto.png',
      imageTransform: { x: 52, y: 20, width: 43, height: 74 },
    };
    const props = renderEditor({ activeSlide: imageSlide });

    expect(within(preview()).getByRole('img')).toHaveAttribute('src', 'https://example.com/foto.png');
    expect(screen.getByLabelText('URL de la imagen')).toHaveValue('https://example.com/foto.png');

    await user.click(screen.getByRole('button', { name: 'Quitar imagen' }));

    expect(props.onUpdateSlide).toHaveBeenCalledWith(
      's2',
      expect.objectContaining({
        layout: 'text-and-image',
        imageUrl: undefined,
        imageTransform: undefined,
      }),
    );
    expect(screen.getByLabelText('URL de la imagen')).toHaveValue('');
    expect(within(preview()).queryByRole('img')).toBeNull();
    expect(within(preview()).getByText('Sin imagen')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar imagen' })).toBeNull();
  });

  it('al hacer clic selecciona la imagen con borde y tiradores, y clic fuera la deselecciona', async () => {
    const user = userEvent.setup();
    const imageSlide: Slide = {
      ...contentSlide,
      layout: 'text-and-image',
      imageUrl: 'https://example.com/foto.png',
    };
    renderEditor({ activeSlide: imageSlide });

    const editable = preview().querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(editable.className).not.toContain('ring-blue-600');
    expect(preview().querySelectorAll('[data-handle]')).toHaveLength(0);

    await user.click(within(preview()).getByRole('img'));
    expect(editable.className).toContain('ring-2');
    expect(editable.className).toContain('ring-blue-600');
    expect(preview().querySelectorAll('[data-handle]')).toHaveLength(4);

    // Clic fuera de la imagen (sobre el título del slide en el lienzo vacío)
    await user.click(within(preview()).getByRole('heading', { name: 'Intro' }));
    expect(editable.className).not.toContain('ring-blue-600');
    expect(preview().querySelectorAll('[data-handle]')).toHaveLength(0);
  });

  it('Delete o Backspace borra la imagen seleccionada, salvo cuando el foco está en un input', async () => {
    const user = userEvent.setup();
    const imageSlide: Slide = {
      ...contentSlide,
      layout: 'image-only',
      imageUrl: 'https://example.com/foto.png',
      imageTransform: { x: 8, y: 20, width: 84, height: 74 },
    };
    const props = renderEditor({ activeSlide: imageSlide });

    await user.click(within(preview()).getByRole('img'));

    // Si el foco está dentro de un input, Backspace no debe eliminar la imagen
    const titleInput = screen.getByLabelText('Título');
    titleInput.focus();
    fireEvent.keyDown(titleInput, { key: 'Backspace' });
    expect(props.onUpdateSlide).not.toHaveBeenCalled();

    // Con foco fuera de inputs y la imagen seleccionada, Delete la elimina
    (preview().querySelector('[data-editable-image="true"]') as HTMLElement).focus();
    await user.keyboard('{Delete}');

    expect(props.onUpdateSlide).toHaveBeenCalledWith(
      's2',
      expect.objectContaining({
        imageUrl: undefined,
        imageTransform: undefined,
      }),
    );
    expect(within(preview()).queryByRole('img')).toBeNull();
  });

  it('pegar una imagen del portapapeles en "Solo texto" cambia a "Texto e imagen" y la carga', async () => {
    const props = renderEditor({ activeSlide: contentSlide });
    const file = new File(['clip-bytes'], 'captura.png', { type: 'image/png' });

    const pasteEvent = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
        files: [file],
      },
    });
    window.dispatchEvent(pasteEvent);

    await waitFor(() => {
      expect(props.onUpdateSlide).toHaveBeenCalledWith(
        's2',
        expect.objectContaining({
          layout: 'text-and-image',
          imageUrl: expect.stringMatching(/^data:image\/png;base64,/),
          imageTransform: { x: 52, y: 20, width: 43, height: 74 },
        }),
      );
    });
    expect(within(preview()).getByRole('img')).toBeInTheDocument();
  });

  it('arrastrar y soltar un archivo sobre el lienzo carga la imagen y ajusta el diseño si estaba en "Solo texto"', async () => {
    const props = renderEditor({ activeSlide: contentSlide });
    const file = new File(['drop-bytes'], 'foto.jpg', { type: 'image/jpeg' });

    fireEvent.dragOver(preview(), { dataTransfer: { types: ['Files'], files: [file] } });
    expect(screen.getByText('Suelta la imagen aquí')).toBeInTheDocument();

    fireEvent.drop(preview(), { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(props.onUpdateSlide).toHaveBeenCalledWith(
        's2',
        expect.objectContaining({
          layout: 'text-and-image',
          imageUrl: expect.stringMatching(/^data:image\/jpeg;base64,/),
          imageTransform: { x: 52, y: 20, width: 43, height: 74 },
        }),
      );
    });
    expect(screen.queryByText('Suelta la imagen aquí')).toBeNull();
  });

  it('las miniaturas del panel izquierdo reflejan imageTransform en modo solo lectura sin borde azul', () => {
    const slideWithTransform: Slide = {
      ...contentSlide,
      layout: 'text-and-image',
      imageUrl: 'https://example.com/foto.png',
      imageTransform: { x: 55, y: 25, width: 38, height: 60 },
    };
    renderEditor({
      project: makeProject({
        id: 'p1',
        name: 'Mi presentación',
        slides: [titleSlide, slideWithTransform],
      }),
      slides: [titleSlide, slideWithTransform],
      activeSlide: slideWithTransform,
    });

    const nav = screen.getByRole('navigation', { name: 'Diapositivas' });
    const thumbImgBox = nav.querySelector('[data-editable-image="true"]') as HTMLElement;
    expect(thumbImgBox.style.left).toBe('55%');
    expect(thumbImgBox.style.top).toBe('25%');
    expect(thumbImgBox.style.width).toBe('38%');
    expect(thumbImgBox.style.height).toBe('60%');
    expect(thumbImgBox.className).not.toContain('ring-blue-600');
    expect(nav.querySelectorAll('[data-handle]')).toHaveLength(0);
  });
});
