import { describe, expect, it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProjectController } from '../controllers/useProjectController';
import { useSlideController } from '../controllers/useSlideController';
import type { Slide } from '../models/Slide';
import { makeProject } from './helpers/factories';
import { InMemoryProjectRepository } from './helpers/InMemoryProjectRepository';

const baseSlides: Slide[] = [
  { id: 's0', type: 'title', title: 'Portada', text: 'Sub', order: 0 },
  { id: 's1', type: 'content', layout: 'text-only', title: 'Uno', text: 'A', order: 1 },
  { id: 's2', type: 'content', layout: 'text-only', title: 'Dos', text: 'B', order: 2 },
];

async function setup() {
  const repo = new InMemoryProjectRepository([
    makeProject({ id: 'p1', slides: baseSlides }),
  ]);
  const hook = renderHook(() => {
    const projectCtl = useProjectController(repo);
    const slideCtl = useSlideController({
      project: projectCtl.currentProject,
      saveProject: projectCtl.saveProject,
    });
    return { projectCtl, slideCtl };
  });
  await waitFor(() => expect(hook.result.current.projectCtl.loading).toBe(false));
  act(() => hook.result.current.projectCtl.selectProject('p1'));
  return { repo, ...hook };
}

describe('useSlideController', () => {
  it('sin proyecto no expone slides ni slide activo', () => {
    const { result } = renderHook(() =>
      useSlideController({ project: null, saveProject: async () => null }),
    );
    expect(result.current.slides).toEqual([]);
    expect(result.current.activeSlide).toBeNull();
  });

  it('expone los slides ordenados y la portada como activa por defecto', async () => {
    const { result } = await setup();
    const { slideCtl } = result.current;

    expect(slideCtl.slides.map((s) => s.id)).toEqual(['s0', 's1', 's2']);
    expect(slideCtl.activeSlide?.id).toBe('s0');
    expect(slideCtl.activeIndex).toBe(0);
  });

  it('selectSlide cambia el slide activo', async () => {
    const { result } = await setup();

    act(() => result.current.slideCtl.selectSlide('s2'));

    expect(result.current.slideCtl.activeSlide?.id).toBe('s2');
    expect(result.current.slideCtl.activeIndex).toBe(2);
  });

  it('nextSlide y prevSlide respetan los límites', async () => {
    const { result } = await setup();
    const id = () => result.current.slideCtl.activeSlide?.id;

    act(() => result.current.slideCtl.prevSlide());
    expect(id()).toBe('s0');

    act(() => result.current.slideCtl.nextSlide());
    expect(id()).toBe('s1');
    act(() => result.current.slideCtl.nextSlide());
    expect(id()).toBe('s2');
    act(() => result.current.slideCtl.nextSlide());
    expect(id()).toBe('s2');

    act(() => result.current.slideCtl.prevSlide());
    expect(id()).toBe('s1');
  });

  it('addSlide agrega un slide de desarrollo al final, lo activa y lo persiste', async () => {
    const { result, repo } = await setup();

    let added = null as Slide | null;
    await act(async () => {
      added = await result.current.slideCtl.addSlide();
    });

    expect(added?.type).toBe('content');
    expect(added?.layout).toBe('text-only');
    expect(added?.order).toBe(3);
    expect(result.current.slideCtl.slides).toHaveLength(4);
    expect(result.current.slideCtl.activeSlide?.id).toBe(added?.id);
    expect((await repo.getById('p1'))?.slides).toHaveLength(4);
  });

  it('addSlide devuelve null si no hay proyecto seleccionado', async () => {
    const { result } = renderHook(() =>
      useSlideController({ project: null, saveProject: async () => null }),
    );

    let added = makeSlideStub() as Slide | null;
    await act(async () => {
      added = await result.current.addSlide();
    });

    expect(added).toBeNull();
  });

  it('updateSlide modifica los campos y persiste', async () => {
    const { result, repo } = await setup();

    let ok = false;
    await act(async () => {
      ok = await result.current.slideCtl.updateSlide('s1', {
        title: 'Nuevo',
        text: 'Texto nuevo',
      });
    });

    expect(ok).toBe(true);
    expect((await repo.getById('p1'))?.slides[1]).toMatchObject({
      title: 'Nuevo',
      text: 'Texto nuevo',
      layout: 'text-only',
    });
    expect(result.current.slideCtl.slides[1].title).toBe('Nuevo');
  });

  it('updateSlide ignora el layout en la portada', async () => {
    const { result, repo } = await setup();

    await act(async () => {
      await result.current.slideCtl.updateSlide('s0', {
        title: 'Otra portada',
        layout: 'image-only',
      });
    });

    const cover = (await repo.getById('p1'))?.slides[0];
    expect(cover?.title).toBe('Otra portada');
    expect(cover?.layout).toBeUndefined();
  });

  it('updateSlide devuelve false si el slide no existe', async () => {
    const { result } = await setup();

    let ok = true;
    await act(async () => {
      ok = await result.current.slideCtl.updateSlide('nope', { title: 'X' });
    });

    expect(ok).toBe(false);
  });

  it('deleteSlide elimina el slide y reindexa el orden', async () => {
    const { result, repo } = await setup();

    let ok = false;
    await act(async () => {
      ok = await result.current.slideCtl.deleteSlide('s1');
    });

    expect(ok).toBe(true);
    const stored = (await repo.getById('p1'))!.slides;
    expect(stored.map((s) => s.id)).toEqual(['s0', 's2']);
    expect(stored.map((s) => s.order)).toEqual([0, 1]);
  });

  it('deleteSlide no permite eliminar la portada', async () => {
    const { result, repo } = await setup();

    let ok = true;
    await act(async () => {
      ok = await result.current.slideCtl.deleteSlide('s0');
    });

    expect(ok).toBe(false);
    expect((await repo.getById('p1'))?.slides).toHaveLength(3);
  });

  it('al eliminar el slide activo se selecciona el anterior', async () => {
    const { result } = await setup();

    act(() => result.current.slideCtl.selectSlide('s2'));
    await act(async () => {
      await result.current.slideCtl.deleteSlide('s2');
    });

    expect(result.current.slideCtl.activeSlide?.id).toBe('s1');
  });

  it('isPresentation alterna con startPresentation y stopPresentation', async () => {
    const { result } = await setup();
    expect(result.current.slideCtl.isPresentation).toBe(false);

    act(() => result.current.slideCtl.startPresentation());
    expect(result.current.slideCtl.isPresentation).toBe(true);

    act(() => result.current.slideCtl.stopPresentation());
    expect(result.current.slideCtl.isPresentation).toBe(false);
  });
});

function makeSlideStub(): Slide {
  return { id: 'x', type: 'content', title: 'x', text: '', order: 0 };
}