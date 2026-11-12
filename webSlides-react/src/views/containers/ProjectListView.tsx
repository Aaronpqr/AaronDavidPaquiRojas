import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Project } from '../../models/Project';
import { formatDate } from '../../utils/formatDate';

interface ProjectFormValues {
    name: string;
    author: string;
    topic: string;
}

interface ProjectListViewProps {
    projects: Project[];
    loading: boolean;
    error: string | null;
    onCreate: (values: ProjectFormValues) => void;
    onOpen: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ProjectListView({
    projects,
    loading,
    error,
    onCreate,
    onOpen,
    onDelete,
}: ProjectListViewProps) {
    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [topic, setTopic] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const values = { name: name.trim(), author: author.trim(), topic: topic.trim() };
        if (!values.name || !values.author || !values.topic) return;
        onCreate(values);
    };

    const fieldClass = 'w-full rounded border border-slate-300 px-2 py-1.5';

    return (
        <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
            <div className="mx-auto max-w-3xl">
                <h1 className="mb-6 text-2xl font-bold">WebSlides</h1>

                {error && (
                    <p role="alert" className="mb-4 rounded bg-red-100 px-3 py-2 text-red-800">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded bg-white p-4 shadow">
                    <h2 className="font-semibold">Nuevo proyecto</h2>
                    <div>
                        <label htmlFor="project-name" className="mb-1 block text-sm">Nombre</label>
                        <input id="project-name" required className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="project-author" className="mb-1 block text-sm">Autor</label>
                        <input id="project-author" required className={fieldClass} value={author} onChange={(e) => setAuthor(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="project-topic" className="mb-1 block text-sm">Tópico</label>
                        <input id="project-topic" required className={fieldClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
                    </div>
                    <button type="submit" className="justify-self-start rounded bg-indigo-600 px-4 py-1.5 text-white hover:bg-indigo-700">
                        Crear proyecto
                    </button>
                </form>

                <h2 className="mb-3 font-semibold">Tus proyectos</h2>
                {loading && <p>Cargando proyectos…</p>}
                {!loading && projects.length === 0 && (
                    <p className="text-slate-500">Aún no tienes proyectos. Crea el primero.</p>
                )}
                <ul className="grid gap-2">
                    {projects.map((project) => (
                        <li key={project.id} className="flex items-center justify-between rounded bg-white p-3 shadow">
                            <div>
                                <p className="font-medium">{project.name}</p>
                                <p className="text-sm text-slate-500">
                                    {project.author} · {project.topic} · {formatDate(project.updatedAt)}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    aria-label={`Abrir ${project.name}`}
                                    onClick={() => onOpen(project.id)}
                                    className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                                >
                                    Abrir
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Eliminar ${project.name}`}
                                    onClick={() => onDelete(project.id)}
                                    className="rounded border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}