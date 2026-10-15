/**
 * ============================================================================
 * WebSlides - Lógica Principal de la Aplicación
 * ============================================================================
 * Este archivo controla el ciclo de vida de la presentación:
 * 1. Inicialización y carga de datos desde IndexedDB.
 * 2. Renderizado del lienzo de edición (head, body, foot, numeración).
 * 3. Gestión de la diapositiva 0 (Slide 0) frente a las diapositivas N > 0.
 * 4. Configuración del estilo por defecto (wide/standard, colores, alineaciones).
 * 5. Modo de presentación en pantalla completa.
 */

// Estado inicial por defecto de la aplicación
const DEFAULT_PRESENTATION = {
    config: {
        aspectRatio: 'wide',       // 'wide' (16:9) o 'standard' (4:3)
        defaultBgColor: '#ffffff', // Fondo por defecto para todas las diapositivas
        headAlignment: 'left',     // Alineación de encabezado (left, center, right)
        footAlignment: 'left',     // Alineación de pie de página (left, center, right)
        showNumbering: true,       // Mostrar numeración de forma global
        numberingAlignment: 'right'// Alineación de numeración (left, center, right)
    },
    currentSlideIndex: 0,
    slides: [
        {
            id: 'slide-0',
            isSlide0: true,         // Identificador especial para Diapositiva 0 (Portada)
            customBg: null,         // null hereda el fondo por defecto
            headText: '',
            titleText: 'Mi Presentación en Web Slides',
            contentText: 'Subtítulo o descripción de la presentación\nAutor: Tu Nombre',
            footText: '',
            showHead: false,        // En la portada (Slide 0) se suele ocultar el head
            showFoot: false,        // En la portada (Slide 0) se suele ocultar el foot
            showNumbering: false    // En la portada (Slide 0) no se numera
        },
        {
            id: 'slide-1',
            isSlide0: false,        // Diapositiva de contenido (Slide N > 0)
            customBg: null,
            headText: 'Encabezado de Sección',
            titleText: 'Primera Diapositiva de Contenido',
            contentText: '• Puedes editar este texto directamente en pantalla.\n• El encabezado (head) y pie (foot) son personalizables.\n• Todo se guarda automáticamente en IndexedDB.',
            footText: 'Web Slides | Confidencial',
            showHead: true,
            showFoot: true,
            showNumbering: true
        }
    ]
};

// Variable reactiva que mantiene el estado en memoria
let appState = JSON.parse(JSON.stringify(DEFAULT_PRESENTATION));
let autoSaveTimeout = null;

// ============================================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ============================================================================
const dom = {
    // Lienzo
    slideFrame: document.getElementById('slideFrame'),
    slideHead: document.getElementById('slideHead'),
    slideTitle: document.getElementById('slideTitle'),
    slideContent: document.getElementById('slideContent'),
    slideFoot: document.getElementById('slideFoot'),
    slideNumbering: document.getElementById('slideNumbering'),
    slideFooterWrapper: document.getElementById('slideFooterWrapper'),
    slideIndicator: document.getElementById('slideIndicator'),
    slideCountBadge: document.getElementById('slideCountBadge'),
    slidesThumbnailsList: document.getElementById('slidesThumbnailsList'),
    saveStatus: document.getElementById('saveStatus'),

    // Botones de acción
    btnAddSlide: document.getElementById('btnAddSlide'),
    btnDuplicateSlide: document.getElementById('btnDuplicateSlide'),
    btnDeleteSlide: document.getElementById('btnDeleteSlide'),
    btnPrevSlide: document.getElementById('btnPrevSlide'),
    btnNextSlide: document.getElementById('btnNextSlide'),
    btnPresent: document.getElementById('btnPresent'),
    btnResetAll: document.getElementById('btnResetAll'),

    // Controles de Configuración (Estilo por defecto)
    radioWide: document.getElementById('radioWide'),
    radioStandard: document.getElementById('radioStandard'),
    defaultBgPicker: document.getElementById('defaultBgPicker'),
    defaultBgText: document.getElementById('defaultBgText'),
    headAlignSelect: document.getElementById('headAlignSelect'),
    footAlignSelect: document.getElementById('footAlignSelect'),
    chkShowNumbering: document.getElementById('chkShowNumbering'),
    numberingAlignSelect: document.getElementById('numberingAlignSelect'),
    defaultColorSwatches: document.getElementById('defaultColorSwatches'),

    // Controles para Diapositiva Actual (Slide 0 vs Slide N > 0)
    currentSlideTypeBadge: document.getElementById('currentSlideTypeBadge'),
    slide0Notice: document.getElementById('slide0Notice'),
    slideCustomBgPicker: document.getElementById('slideCustomBgPicker'),
    btnResetSlideBg: document.getElementById('btnResetSlideBg'),
    chkSlideShowHead: document.getElementById('chkSlideShowHead'),
    chkSlideShowFoot: document.getElementById('chkSlideShowFoot'),
    chkSlideShowNumbering: document.getElementById('chkSlideShowNumbering'),

    // Modo Presentación
    presentationOverlay: document.getElementById('presentationOverlay'),
    presentationSlideFrame: document.getElementById('presentationSlideFrame'),
    presHead: document.getElementById('presHead'),
    presTitle: document.getElementById('presTitle'),
    presContent: document.getElementById('presContent'),
    presFoot: document.getElementById('presFoot'),
    presNumbering: document.getElementById('presNumbering'),
    presSlideIndicator: document.getElementById('presSlideIndicator'),
    btnPresPrev: document.getElementById('btnPresPrev'),
    btnPresNext: document.getElementById('btnPresNext'),
    btnExitPres: document.getElementById('btnExitPres')
};

// ============================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar datos previos desde IndexedDB si existen
    await loadInitialData();

    // 2. Registrar eventos de interacción y edición
    registerEventListeners();

    // 3. Renderizar la interfaz completa
    renderFullUI();
});

/**
 * Carga los datos almacenados en IndexedDB.
 * Si el usuario ya tenía diapositivas guardadas en su navegador, las restaura.
 */
async function loadInitialData() {
    try {
        const savedData = await loadPresentationFromDB();
        if (savedData && savedData.slides && savedData.slides.length > 0) {
            appState = savedData;
            // Aseguramos que el índice actual sea válido
            if (appState.currentSlideIndex >= appState.slides.length) {
                appState.currentSlideIndex = 0;
            }
            showSaveStatus('✓ Restaurado desde IndexedDB');
        } else {
            // Guardamos el estado inicial en IndexedDB
            await savePresentationToDB(appState);
            showSaveStatus('✓ Inicializado en IndexedDB');
        }
    } catch (e) {
        console.warn('No se pudo leer de IndexedDB, usando valores por defecto:', e);
    }
}

/**
 * Muestra el estado del guardado en la barra superior.
 */
function showSaveStatus(text, isSaving = false) {
    if (!dom.saveStatus) return;
    dom.saveStatus.textContent = text;
    if (isSaving) {
        dom.saveStatus.className = 'w3-tag w3-round w3-amber w3-text-black';
    } else {
        dom.saveStatus.className = 'w3-tag w3-round w3-white w3-text-blue';
    }
}

/**
 * Programa el autoguardado en IndexedDB usando 'debounce' para evitar escrituras excesivas.
 */
function scheduleAutoSave() {
    showSaveStatus('Guardando...', true);
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    autoSaveTimeout = setTimeout(async () => {
        try {
            await savePresentationToDB(appState);
            showSaveStatus('✓ Guardado en IndexedDB');
        } catch (err) {
            showSaveStatus('⚠️ Error al guardar');
        }
    }, 600);
}

// ============================================================================
// RENDERIZADO DEL LIENZO Y DIAPOSITIVAS
// ============================================================================

/**
 * Renderiza todos los componentes de la interfaz.
 */
function renderFullUI() {
    renderConfigInputs();
    renderCurrentSlide();
    renderThumbnails();
}

/**
 * Aplica los valores de configuración en los controles del panel derecho.
 */
function renderConfigInputs() {
    const config = appState.config;

    // Proporción (Wide 16:9 / Standard 4:3)
    if (config.aspectRatio === 'standard') {
        dom.radioStandard.checked = true;
    } else {
        dom.radioWide.checked = true;
    }

    // Color de fondo por defecto
    dom.defaultBgPicker.value = config.defaultBgColor;
    dom.defaultBgText.value = config.defaultBgColor;

    // Alineación de head y foot
    dom.headAlignSelect.value = config.headAlignment;
    dom.footAlignSelect.value = config.footAlignment;

    // Numeración
    dom.chkShowNumbering.checked = config.showNumbering;
    dom.numberingAlignSelect.value = config.numberingAlignment;

    // Actualizar swatch activo
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        if (swatch.dataset.color.toLowerCase() === config.defaultBgColor.toLowerCase()) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
}

/**
 * Renderiza la diapositiva activa en el marco central (Slide Canvas).
 * Aquí se implementa la diferencia entre Slide 0 y Slide N > 0.
 */
function renderCurrentSlide() {
    const slide = appState.slides[appState.currentSlideIndex];
    if (!slide) return;

    const isSlide0 = (appState.currentSlideIndex === 0);
    const config = appState.config;

    // 1. Proporción del marco (wide o standard)
    dom.slideFrame.className = `slide-frame format-${config.aspectRatio}` + (isSlide0 ? ' is-slide-0' : '');

    // 2. Color de fondo: si tiene customBg usa ese, si no, hereda defaultBgColor
    const effectiveBg = slide.customBg || config.defaultBgColor;
    dom.slideFrame.style.backgroundColor = effectiveBg;

    // Detectamos si el fondo es oscuro para contrastar texto automáticamente
    const isDark = isColorDark(effectiveBg);
    dom.slideFrame.style.color = isDark ? '#f8f9fa' : '#222222';

    // 3. Encabezado (head)
    dom.slideHead.innerHTML = slide.headText || '';
    dom.slideHead.style.textAlign = config.headAlignment;
    dom.slideHead.style.display = slide.showHead ? 'block' : 'none';

    // 4. Cuerpo (Título y Contenido central)
    dom.slideTitle.innerHTML = slide.titleText || '';
    dom.slideContent.innerHTML = slide.contentText || '';

    // 5. Pie de página (foot)
    dom.slideFoot.innerHTML = slide.footText || '';
    dom.slideFoot.style.textAlign = config.footAlignment;
    dom.slideFoot.style.display = slide.showFoot ? 'block' : 'none';

    // 6. Numeración de diapositiva
    // Formato: Diapositiva N de Total (o número ordinal como en la pizarra)
    const totalSlides = appState.slides.length;
    dom.slideNumbering.textContent = isSlide0 ? '0' : `${appState.currentSlideIndex}`;
    
    // Alineación y visibilidad de numeración
    if (config.showNumbering && slide.showNumbering) {
        dom.slideNumbering.style.display = 'block';
    } else {
        dom.slideNumbering.style.display = 'none';
    }

    // Configurar distribución del footer según la alineación de numeración
    adjustFooterLayout(config.numberingAlignment);

    // 7. Actualizar indicadores y badge
    dom.slideIndicator.textContent = `Diapositiva ${appState.currentSlideIndex} de ${totalSlides - 1}`;
    dom.slideCountBadge.textContent = totalSlides;

    // 8. Actualizar sección de Diapositiva Actual en el panel de configuración
    updateCurrentSlideConfigPanel(slide, isSlide0);

    // Deshabilitar botón de eliminar si solo hay una diapositiva
    dom.btnDeleteSlide.disabled = (totalSlides <= 1);
    dom.btnPrevSlide.disabled = (appState.currentSlideIndex <= 0);
    dom.btnNextSlide.disabled = (appState.currentSlideIndex >= totalSlides - 1);
}

/**
 * Ajusta el diseño del pie de página según la alineación de la numeración.
 */
function adjustFooterLayout(numAlignment) {
    if (numAlignment === 'left') {
        dom.slideFooterWrapper.style.flexDirection = 'row-reverse';
    } else {
        dom.slideFooterWrapper.style.flexDirection = 'row';
    }
}

/**
 * Actualiza los controles del panel derecho correspondientes a la diapositiva seleccionada.
 */
function updateCurrentSlideConfigPanel(slide, isSlide0) {
    if (isSlide0) {
        dom.currentSlideTypeBadge.textContent = 'Slide 0 (Portada)';
        dom.currentSlideTypeBadge.className = 'w3-tag w3-round w3-indigo w3-tiny';
        dom.slide0Notice.style.display = 'block';
    } else {
        dom.currentSlideTypeBadge.textContent = `Slide ${appState.currentSlideIndex} (Contenido)`;
        dom.currentSlideTypeBadge.className = 'w3-tag w3-round w3-blue w3-tiny';
        dom.slide0Notice.style.display = 'none';
    }

    // Color personalizado
    dom.slideCustomBgPicker.value = slide.customBg || appState.config.defaultBgColor;

    // Checkboxes de visibilidad
    dom.chkSlideShowHead.checked = slide.showHead;
    dom.chkSlideShowFoot.checked = slide.showFoot;
    dom.chkSlideShowNumbering.checked = slide.showNumbering;
}

/**
 * Renderiza la lista de miniaturas en la barra lateral izquierda (0, 1, 2...).
 * Replica el dibujo de la pizarra con las cajas numeradas a la izquierda.
 */
function renderThumbnails() {
    dom.slidesThumbnailsList.innerHTML = '';

    appState.slides.forEach((slide, index) => {
        const card = document.createElement('div');
        card.className = `slide-thumbnail-card ${index === appState.currentSlideIndex ? 'active' : ''}`;
        card.title = `Ir a diapositiva ${index}`;

        // Header de la miniatura
        const header = document.createElement('div');
        header.className = 'slide-thumbnail-header';
        
        const label = document.createElement('span');
        label.textContent = index === 0 ? '0 (Portada)' : `${index}`;

        header.appendChild(label);

        // Previsualización simplificada
        const preview = document.createElement('div');
        preview.className = `slide-thumbnail-preview ${appState.config.aspectRatio === 'standard' ? 'standard' : ''}`;
        
        const effectiveBg = slide.customBg || appState.config.defaultBgColor;
        preview.style.backgroundColor = effectiveBg;
        preview.style.color = isColorDark(effectiveBg) ? '#fff' : '#333';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'thumbnail-title';
        titleDiv.textContent = stripHtml(slide.titleText) || (index === 0 ? 'Portada' : `Slide ${index}`);

        const snippetDiv = document.createElement('div');
        snippetDiv.className = 'thumbnail-snippet';
        snippetDiv.textContent = stripHtml(slide.contentText) || '';

        preview.appendChild(titleDiv);
        preview.appendChild(snippetDiv);

        card.appendChild(header);
        card.appendChild(preview);

        // Evento para cambiar a esta diapositiva al hacer clic
        card.addEventListener('click', () => {
            selectSlide(index);
        });

        dom.slidesThumbnailsList.appendChild(card);
    });
}

// ============================================================================
// GESTIÓN DE ACCIONES Y EVENTOS
// ============================================================================

/**
 * Cambia la diapositiva activa.
 */
function selectSlide(index) {
    if (index >= 0 && index < appState.slides.length) {
        appState.currentSlideIndex = index;
        renderCurrentSlide();
        renderThumbnails();
        scheduleAutoSave();
    }
}

/**
 * Registra todos los escuchadores de eventos para la interacción.
 */
function registerEventListeners() {
    // ------------------------------------------------------------------------
    // 1. Edición de texto directa en el lienzo (contenteditable)
    // ------------------------------------------------------------------------
    const saveCurrentSlideContent = () => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (!slide) return;

        slide.headText = dom.slideHead.innerHTML;
        slide.titleText = dom.slideTitle.innerHTML;
        slide.contentText = dom.slideContent.innerHTML;
        slide.footText = dom.slideFoot.innerHTML;

        renderThumbnails();
        scheduleAutoSave();
    };

    dom.slideHead.addEventListener('input', saveCurrentSlideContent);
    dom.slideTitle.addEventListener('input', saveCurrentSlideContent);
    dom.slideContent.addEventListener('input', saveCurrentSlideContent);
    dom.slideFoot.addEventListener('input', saveCurrentSlideContent);

    // ------------------------------------------------------------------------
    // 2. Botones de acción principales (+ Nueva, Duplicar, Eliminar, Navegación)
    // ------------------------------------------------------------------------
    dom.btnAddSlide.addEventListener('click', addNewSlide);
    dom.btnDuplicateSlide.addEventListener('click', duplicateCurrentSlide);
    dom.btnDeleteSlide.addEventListener('click', deleteCurrentSlide);

    dom.btnPrevSlide.addEventListener('click', () => selectSlide(appState.currentSlideIndex - 1));
    dom.btnNextSlide.addEventListener('click', () => selectSlide(appState.currentSlideIndex + 1));

    // Reiniciar presentación
    dom.btnResetAll.addEventListener('click', async () => {
        if (confirm('¿Deseas reiniciar la presentación al estado por defecto?')) {
            await clearPresentationFromDB();
            appState = JSON.parse(JSON.stringify(DEFAULT_PRESENTATION));
            await savePresentationToDB(appState);
            renderFullUI();
            showSaveStatus('✓ Presentación reiniciada');
        }
    });

    // ------------------------------------------------------------------------
    // 3. Estilo por defecto (Wide / Standard)
    // ------------------------------------------------------------------------
    dom.radioWide.addEventListener('change', () => {
        appState.config.aspectRatio = 'wide';
        renderCurrentSlide();
        renderThumbnails();
        scheduleAutoSave();
    });

    dom.radioStandard.addEventListener('change', () => {
        appState.config.aspectRatio = 'standard';
        renderCurrentSlide();
        renderThumbnails();
        scheduleAutoSave();
    });

    // ------------------------------------------------------------------------
    // 4. Color de fondo por defecto (background -> colores)
    // ------------------------------------------------------------------------
    const applyDefaultColor = (color) => {
        appState.config.defaultBgColor = color;
        dom.defaultBgPicker.value = color;
        dom.defaultBgText.value = color;
        renderCurrentSlide();
        renderThumbnails();
        renderConfigInputs();
        scheduleAutoSave();
    };

    dom.defaultBgPicker.addEventListener('input', (e) => applyDefaultColor(e.target.value));
    dom.defaultBgText.addEventListener('change', (e) => applyDefaultColor(e.target.value));

    // Clic en la paleta rápida de colores
    dom.defaultColorSwatches.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (swatch) {
            applyDefaultColor(swatch.dataset.color);
        }
    });

    // ------------------------------------------------------------------------
    // 5. Alineaciones (head / foot / numeración)
    // ------------------------------------------------------------------------
    dom.headAlignSelect.addEventListener('change', (e) => {
        appState.config.headAlignment = e.target.value;
        renderCurrentSlide();
        scheduleAutoSave();
    });

    dom.footAlignSelect.addEventListener('change', (e) => {
        appState.config.footAlignment = e.target.value;
        renderCurrentSlide();
        scheduleAutoSave();
    });

    dom.chkShowNumbering.addEventListener('change', (e) => {
        appState.config.showNumbering = e.target.checked;
        renderCurrentSlide();
        scheduleAutoSave();
    });

    dom.numberingAlignSelect.addEventListener('change', (e) => {
        appState.config.numberingAlignment = e.target.value;
        renderCurrentSlide();
        scheduleAutoSave();
    });

    // ------------------------------------------------------------------------
    // 6. Opciones de la Diapositiva Actual (Slide 0 vs Slide N > 0)
    // ------------------------------------------------------------------------
    // Fondo personalizado para la diapositiva activa
    dom.slideCustomBgPicker.addEventListener('input', (e) => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (slide) {
            slide.customBg = e.target.value;
            renderCurrentSlide();
            renderThumbnails();
            scheduleAutoSave();
        }
    });

    // Botón para restaurar al fondo por defecto
    dom.btnResetSlideBg.addEventListener('click', () => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (slide) {
            slide.customBg = null;
            renderCurrentSlide();
            renderThumbnails();
            scheduleAutoSave();
        }
    });

    // Toggles de visibilidad individuales
    dom.chkSlideShowHead.addEventListener('change', (e) => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (slide) {
            slide.showHead = e.target.checked;
            renderCurrentSlide();
            scheduleAutoSave();
        }
    });

    dom.chkSlideShowFoot.addEventListener('change', (e) => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (slide) {
            slide.showFoot = e.target.checked;
            renderCurrentSlide();
            scheduleAutoSave();
        }
    });

    dom.chkSlideShowNumbering.addEventListener('change', (e) => {
        const slide = appState.slides[appState.currentSlideIndex];
        if (slide) {
            slide.showNumbering = e.target.checked;
            renderCurrentSlide();
            scheduleAutoSave();
        }
    });

    // ------------------------------------------------------------------------
    // 7. Modo Presentación (Pantalla Completa) y Teclado
    // ------------------------------------------------------------------------
    dom.btnPresent.addEventListener('click', enterPresentationMode);
    dom.btnExitPres.addEventListener('click', () => exitPresentationMode(true));
    dom.btnPresPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevPresSlide();
    });
    dom.btnPresNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextPresSlide();
    });

    // Al hacer clic en cualquier parte de la diapositiva en presentación, avanzar a la siguiente
    dom.presentationOverlay.addEventListener('click', (e) => {
        // Solo avanzar si no se hizo clic en los controles flotantes
        if (!e.target.closest('.presentation-controls')) {
            nextPresSlide();
        }
    });

    // Detectar cuando el usuario sale de pantalla completa mediante la tecla ESC nativa del navegador
    const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = Boolean(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement
        );
        if (!isCurrentlyFullscreen && dom.presentationOverlay.classList.contains('active')) {
            exitPresentationMode(false);
        }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Navegación por teclado
    document.addEventListener('keydown', (e) => {
        // En modo presentación
        if (dom.presentationOverlay.classList.contains('active')) {
            if (e.key === 'Escape') {
                exitPresentationMode(true);
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
                e.preventDefault();
                nextPresSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                prevPresSlide();
            }
        } else {
            // Tecla F5 para iniciar presentación
            if (e.key === 'F5') {
                e.preventDefault();
                enterPresentationMode();
            }
        }
    });
}

// ============================================================================
// FUNCIONES DE MANIPULACIÓN DE DIAPOSITIVAS
// ============================================================================

/**
 * Añade una nueva diapositiva (Slide N > 0) con los estilos y textos por defecto.
 */
function addNewSlide() {
    const newIndex = appState.slides.length;
    const newSlide = {
        id: `slide-${Date.now()}`,
        isSlide0: false,
        customBg: null,
        headText: `Encabezado de Diapositiva ${newIndex}`,
        titleText: `Nueva Diapositiva ${newIndex}`,
        contentText: '• Escribe aquí tus ideas principales\n• Añade puntos clave o explicaciones',
        footText: 'Web Slides',
        showHead: true,
        showFoot: true,
        showNumbering: true
    };

    appState.slides.push(newSlide);
    appState.currentSlideIndex = newIndex;

    renderFullUI();
    scheduleAutoSave();
}

/**
 * Duplica la diapositiva actual.
 */
function duplicateCurrentSlide() {
    const current = appState.slides[appState.currentSlideIndex];
    if (!current) return;

    const duplicated = JSON.parse(JSON.stringify(current));
    duplicated.id = `slide-${Date.now()}`;
    duplicated.isSlide0 = false; // Solo la primera es la portada original

    const insertIndex = appState.currentSlideIndex + 1;
    appState.slides.splice(insertIndex, 0, duplicated);
    appState.currentSlideIndex = insertIndex;

    renderFullUI();
    scheduleAutoSave();
}

/**
 * Elimina la diapositiva actual.
 */
function deleteCurrentSlide() {
    if (appState.slides.length <= 1) {
        alert('No puedes eliminar la única diapositiva existente.');
        return;
    }

    if (confirm(`¿Eliminar la diapositiva ${appState.currentSlideIndex}?`)) {
        appState.slides.splice(appState.currentSlideIndex, 1);
        
        // Ajustar índice actual
        if (appState.currentSlideIndex >= appState.slides.length) {
            appState.currentSlideIndex = appState.slides.length - 1;
        }

        renderFullUI();
        scheduleAutoSave();
    }
}

// ============================================================================
// MODO PRESENTACIÓN (PANTALLA COMPLETA)
// ============================================================================

let presCurrentIndex = 0;

/**
 * Inicia el modo de presentación en pantalla completa nativa.
 * Solicita al navegador activar Fullscreen API sobre el contenedor de presentación.
 */
function enterPresentationMode() {
    presCurrentIndex = appState.currentSlideIndex;
    dom.presentationOverlay.classList.add('active');
    renderPresentationSlide();

    // Solicitar pantalla completa nativa al navegador en el overlay
    const elem = dom.presentationOverlay;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari y Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) { /* IE / Edge */
        elem.msRequestFullscreen();
    }
}

/**
 * Cierra el modo de presentación y restaura la pantalla.
 * @param {boolean} requestExit - Si es true, solicita salir de fullscreen nativo.
 */
function exitPresentationMode(requestExit = true) {
    dom.presentationOverlay.classList.remove('active');
    
    // Si aún está activo el modo fullscreen del navegador, salir
    if (requestExit) {
        const isFullscreen = Boolean(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement
        );
        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // Sincronizar diapositiva activa en el editor con la última vista
    selectSlide(presCurrentIndex);
}

function renderPresentationSlide() {
    const slide = appState.slides[presCurrentIndex];
    if (!slide) return;

    const isSlide0 = (presCurrentIndex === 0);
    const config = appState.config;

    // Proporción
    dom.presentationSlideFrame.className = `slide-frame format-${config.aspectRatio}` + (isSlide0 ? ' is-slide-0' : '');

    // Fondo y contraste
    const effectiveBg = slide.customBg || config.defaultBgColor;
    dom.presentationSlideFrame.style.backgroundColor = effectiveBg;
    const isDark = isColorDark(effectiveBg);
    dom.presentationSlideFrame.style.color = isDark ? '#f8f9fa' : '#222222';

    // Textos
    dom.presHead.innerHTML = slide.headText || '';
    dom.presHead.style.textAlign = config.headAlignment;
    dom.presHead.style.display = slide.showHead ? 'block' : 'none';

    dom.presTitle.innerHTML = slide.titleText || '';
    dom.presContent.innerHTML = slide.contentText || '';

    dom.presFoot.innerHTML = slide.footText || '';
    dom.presFoot.style.textAlign = config.footAlignment;
    dom.presFoot.style.display = slide.showFoot ? 'block' : 'none';

    // Numeración
    dom.presNumbering.textContent = isSlide0 ? '0' : `${presCurrentIndex}`;
    dom.presNumbering.style.display = (config.showNumbering && slide.showNumbering) ? 'block' : 'none';

    // Layout de numeración en footer
    if (config.numberingAlignment === 'left') {
        dom.presentationSlideFrame.querySelector('.slide-footer-wrapper').style.flexDirection = 'row-reverse';
    } else {
        dom.presentationSlideFrame.querySelector('.slide-footer-wrapper').style.flexDirection = 'row';
    }

    // Indicador en controles flotantes
    dom.presSlideIndicator.textContent = `${presCurrentIndex} / ${appState.slides.length - 1}`;
}

function nextPresSlide() {
    if (presCurrentIndex < appState.slides.length - 1) {
        presCurrentIndex++;
        renderPresentationSlide();
    }
}

function prevPresSlide() {
    if (presCurrentIndex > 0) {
        presCurrentIndex--;
        renderPresentationSlide();
    }
}

// ============================================================================
// UTILIDADES AUXILIARES
// ============================================================================

/**
 * Elimina etiquetas HTML para crear resúmenes de texto limpios.
 */
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Determina si un color hexadecimal es oscuro para aplicar texto claro.
 */
function isColorDark(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return false;
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    // Fórmula de luminosidad relativa estándar (YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
}
