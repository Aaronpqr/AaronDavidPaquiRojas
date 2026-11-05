GUÍA DE TRABAJO PRÁCTICO EN CLASE
Desarrollar   una  aplicación   web   cliente   para   la   creación,   edición,   gestión   y   presentación   de   diapositivas   (slides),   inspirada   en
plataformas como Google Slides y Microsoft PowerPoint.
La solución funcionará de manera totalmente autónoma dentro del navegador del usuario, haciendo uso de React para la interfaz  e
IndexedDB para  la  persistencia  local  . La  arquitectura  usará  el  patrón Modelo-Vista-Controlador  (MVC)  mediante  Inversión de
Dependencias   (uso   de   interfaces),   lo   que   permitirá   reemplazar   de   forma   transparente   la   capa   de   almacenamiento   local   por   una
arquitectura basada en Microservicios REST en versiones futuras.
Requerimientos No Funcionales (RNF)
 RNF-01: La aplicación debe ejecutarse enteramente en el navegador del cliente sin requerir un servidor web o backend activo en

esta fase.

 RNF-02: Los datos de los proyectos y sus slides deben almacenarse y recuperarse de forma persistente mediante IndexedDB.
 RNF-03: Desarrollo obligatorio en React 18+ (componentes funcionales y Hooks) estilizado mediante Tailwind CSS o W3.CSS

para IU en Tablet o PC.

 RNF-04:  El código debe ser guiado por pruebas unitarias e integración escritas previamente con Jest y React Testing Library.

Uso de TDD

 RNF-05:  Separación estricta entre Modelos, Vistas y Controladores usando interfaces. Esto permite desacoplar la interfaz de

usuario del mecanismo de almacenamiento local.

Historias de Usuario
HU-01: Gestión y Persistencia de Proyectos y Slides

Como usuario de la aplicación, quiero crear, listar y eliminar proyectos con sus respectivos slides en el almacenamiento local del
navegador, para conservar mis presentaciones sin depender de una conexión a internet ni de un servidor backend.

Tareas de Implementación:


Tarea 1.1 (TDD - Test): Crear la prueba tests/IndexedDbRepository.test.ts para verificar la inicialización, guardado y lectura de
proyectos en IndexedDB.
Tarea 1.2 (Implementación Repositorio): Crear IndexedDbProjectRepository implementando IProjectRepository para hacer
pasar los tests de la Tarea 1.1.
Tarea 1.3 (TDD/Controller): Crear la prueba y el custom hook useProjectController para abstraer la lógica de negocio de la
vista.

HU-02: Renderizado de Slides por Tipos y Layouts

Como creador de contenido, quiero que el primer slide sea de tipo Portada y los siguientes de tipo Desarrollo (con formatos de
Solo Texto, Solo Imagen o Texto e Imagen), para organizar visualmente mi presentación con estructura estándar.

Tareas de Implementación:


Tarea 2.1 (Componente Header/Footer): Crear el componente HeaderFooter que reciba y muestre autor, tópico, número de
slide y fecha (exclusivo para slides de desarrollo).
Tarea 2.2 (Layouts Presentacionales): Crear los componentes presentacionales: LayoutTextOnly, LayoutImageOnly y
LayoutTextAndImage.
Tarea 2.3 (SlideRenderer): Crear el componente principal SlideRenderer que evalúe si el slide es de tipo title o content y
renderice el layout correspondiente.

HU-03: Modos de Visualización (Edición vs. Presentación)

Como ponente, quiero alternar entre un modo de edición (formulario de ajustes) y un modo de presentación (pantalla completa), para
modificar el contenido cómodamente o proyectarlo ante una audiencia.

Tareas de Implementación:



Tarea 3.1 (Estado de Modos): Agregar el estado isPresentation en la vista principal o controlador.
Tarea 3.2 (Modo Edición): Implementar el panel de edición con entradas de texto, selección de layout y carga de URL de
imagen.
Tarea 3.3 (Modo Presentación): Implementar la vista en pantalla completa con navegación por teclado (flechas
izquierda/derecha).

HU-04: Duplicación y Reorganización de Slides entre Proyectos

Como usuario, quiero copiar o mover slides entre diferentes proyectos existentes, para reutilizar diapositivas en múltiples
presentaciones sin rehacerlas.

Tareas de Implementación:



Tarea 4.1 (Extensión de Controller): Agregar los métodos copySlideToProject y moveSlideToProject en useSlideController.
Tarea 4.2 (UI de Traslado): Agregar un menú desplegable en el slide activo para elegir el proyecto destino y ejecutar la copia o
traslado.

HU-05: Exportación de Presentaciones

Como usuario, quiero descargar mi presentación en formatos HTML estático y PDF, para distribuirla localmente o imprimirla.

Tareas de Implementación:















Tarea 5.1 (Exportar HTML): Implementar la función de generación de Blob en formato .html autónomo.
Tarea 5.2 (Exportar PDF): Configurar hojas de estilo para impresión (@media print) y disparar window.print().
Tarea 5.3 (Stubs PowerPoint / LibreOffice): Dejar definidas las interfaces e implementar los adaptadores simulados (stubs)
PptxExporterAdapter y OdpExporterAdapter.

Esqueleto de Arquitectura y Código Base

src/
├── models/                         # Contratos de Datos e Interfaces (Capa Model)
│   ├── Slide.ts
│   ├── Project.ts
│   └── ports/
│       ├── IProjectRepository.ts   # Interfaz del Repositorio (Inversión de Dependencias)
│       └── IExporter.ts                 # Interfaz para adaptadores de exportación
│
├── infrastructure/                                  # Implementaciones Concretas / Adaptadores
│   ├── IndexedDbProjectRepository.ts # Almacenamiento local actual (IndexedDB)
│   └── HttpMicroserviceRepository.ts  # Stub preparado para futura integración
│
├── controllers/                    # Hooks y Lógica de Negocio (Capa Controller)
│   ├── useProjectController.ts
│   └── useSlideController.ts
│
├── views/                          # Componentes Presentacionales (Capa View)
│   ├── components/
│   │   ├── SlideRenderer.tsx
│   │   ├── HeaderFooter.tsx
│   │   ├── LayoutTextOnly.tsx
│   │   ├── LayoutImageOnly.tsx
│   │   └── LayoutTextAndImage.tsx
│   ├── containers/
│   │   ├── EditorView.tsx
│   │   └── PresentationView.tsx
│   └── App.tsx
│
└── tests/                          # Tests Unitarios e Integración (TDD)
    ├── IndexedDbRepository.test.ts
    └── useSlideController.test.ts

Trabajo

Fase

Entregable

Fase 1: Setup y Modelos

Configurar el proyecto (React, TS, Tailwind/W3.CSS) e
implementar tipos e interfaz IProjectRepository.

Fase 2: TDD + IndexedDB + Controllers

Escribir pruebas de repositorio y controlador; implementar
IndexedDbProjectRepository y useProjectController.

Fase 3: Componentes UI y Layouts

Construir SlideRenderer, HeaderFooter, los 3 layouts de
contenido y los modos de Edición y Presentación.

Fase 4: Exportación y Git Push

Implementar exportación HTML/PDF, ejecutar suite de tests
(`npm test`) y hacer push al repositorio GitHub.

