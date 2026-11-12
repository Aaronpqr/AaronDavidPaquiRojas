import { useProjectController } from '../controllers/useProjectController';
import { useSlideController } from '../controllers/useSlideController';
import { IndexedDbProjectRepository } from '../infrastructure/IndexedDbProjectRepository';
import type { IProjectRepository } from '../models/ports/IProjectRepository';
import { formatDate } from '../utils/formatDate';
import { EditorView } from './containers/EditorView';
import { PresentationView } from './containers/PresentationView';
import { ProjectListView } from './containers/ProjectListView';

// Raíz de composición: único lugar que conoce la implementación concreta.
// Para migrar a microservicios REST, basta cambiar esta línea por
// new HttpMicroserviceRepository(...). El constructor no abre la BD (es perezoso).
const defaultRepository: IProjectRepository = new IndexedDbProjectRepository();

interface AppProps {
  repository?: IProjectRepository;
}

export default function App({ repository = defaultRepository }: AppProps) {
  const projectCtl = useProjectController(repository);
  const { currentProject } = projectCtl;
  const slideCtl = useSlideController({
    project: currentProject,
    saveProject: projectCtl.saveProject,
  });
  const { activeSlide } = slideCtl;

  if (currentProject && activeSlide && slideCtl.isPresentation) {
    return (
      <PresentationView
        slide={activeSlide}
        index={slideCtl.activeIndex}
        total={slideCtl.slides.length}
        author={currentProject.author}
        topic={currentProject.topic}
        date={formatDate(currentProject.createdAt)}
        onNext={slideCtl.nextSlide}
        onPrev={slideCtl.prevSlide}
        onExit={slideCtl.stopPresentation}
      />
    );
  }

  if (currentProject && activeSlide) {
    return (
      <EditorView
        project={currentProject}
        slides={slideCtl.slides}
        activeSlide={activeSlide}
        activeIndex={slideCtl.activeIndex}
        onSelectSlide={slideCtl.selectSlide}
        onAddSlide={slideCtl.addSlide}
        onUpdateSlide={slideCtl.updateSlide}
        onDeleteSlide={slideCtl.deleteSlide}
        onUpdateProject={(changes) => projectCtl.saveProject({ ...currentProject, ...changes })}
        onPresent={slideCtl.startPresentation}
        onBack={() => projectCtl.selectProject(null)}
      />
    );
  }

  return (
    <ProjectListView
      projects={projectCtl.projects}
      loading={projectCtl.loading}
      error={projectCtl.error}
      onCreate={() => projectCtl.createProject()}
      onOpen={projectCtl.selectProject}
      onDelete={projectCtl.deleteProject}
    />
  );
}
