/**
 * ============================================================================
 * WebSlides - Módulo de Persistencia con IndexedDB
 * ============================================================================
 * Este archivo gestiona todo el almacenamiento local en el navegador utilizando
 * IndexedDB (la base de datos integrada en navegadores modernos).
 * Permite guardar las diapositivas, estilos por defecto, textos y configuraciones
 * para que no se pierdan al recargar la página.
 */

const DB_NAME = 'WebSlidesDB';
const DB_VERSION = 1;
const STORE_NAME = 'presentationStore';
const PRESENTATION_KEY = 'current_presentation';

/**
 * Abre o crea la base de datos IndexedDB.
 * En la primera apertura o actualización de versión, se ejecuta 'onupgradeneeded'
 * donde creamos el ObjectStore (almacén de objetos).
 */
function openDB() {
    return new Promise((resolve, reject) => {
        // Solicitamos abrir la base de datos con el nombre y versión especificados
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Se ejecuta si la base de datos aún no existe o cambia de versión
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Verificamos si el almacén ya existe; si no, lo creamos
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Creamos el almacén con clave explícita para guardar la presentación
                db.createObjectStore(STORE_NAME);
            }
        };

        // Si la base de datos se abre correctamente
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        // Si ocurre algún error al abrir la base de datos
        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Guarda el estado completo de la presentación en IndexedDB.
 * Guarda diapositivas, estilos por defecto (wide/standard, colores, alineaciones, head/foot).
 * @param {Object} data - Objeto con la configuración y lista de diapositivas
 */
async function savePresentationToDB(data) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            // Iniciamos una transacción de lectura/escritura en el almacén
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Guardamos el objeto completo bajo la clave 'current_presentation'
            const request = store.put(data, PRESENTATION_KEY);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('Error al guardar en IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Excepción al guardar en IndexedDB:', error);
        return false;
    }
}

/**
 * Carga el estado guardado de la presentación desde IndexedDB.
 * Si no existe ningún dato guardado previamente, retorna null.
 * @returns {Promise<Object|null>}
 */
async function loadPresentationFromDB() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            // Iniciamos una transacción de solo lectura
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            // Consultamos por la clave de la presentación actual
            const request = store.get(PRESENTATION_KEY);

            request.onsuccess = (event) => {
                const data = event.target.result || null;
                resolve(data);
            };

            request.onerror = (event) => {
                console.error('Error al cargar de IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('Excepción al cargar de IndexedDB:', error);
        return null;
    }
}

/**
 * Restablece o borra la presentación almacenada en IndexedDB.
 */
async function clearPresentationFromDB() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(PRESENTATION_KEY);

            request.onsuccess = () => resolve(true);
            request.onerror = (event) => reject(event.target.error);
        });
    } catch (error) {
        console.error('Error al limpiar IndexedDB:', error);
        return false;
    }
}
