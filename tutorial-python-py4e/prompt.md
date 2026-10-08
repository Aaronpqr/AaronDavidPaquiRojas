# Registro de Prompts utilizados con IA (Antigravity IDE)

Este documento registra los prompts empleados para la generación, estructuración y mejora visual del tutorial web interactivo de Python.

---

## Prompt 1: Generación de la estructura base y lógica
**Objetivo:** Crear los 3 archivos modulares (`index.html`, `style.css`, `script.js`) con W3.CSS, enfoque Mobile-First y el contenido de Charles Severance (PY4E).

> "Actúa como un desarrollador web frontend senior. Necesito que crees un tutorial web interactivo de Python basado en el curso 'Python for Everybody' (PY4E) del Dr. Charles Severance.
>
> Requisitos obligatorios:
> 1. Estructura modular en 3 archivos locales: index.html, style.css y script.js.
> 2. Framework CSS: Usar W3.CSS (enlace CDN oficial: https://www.w3schools.com/w3css/4/w3.css) complementado con style.css.
> 3. Enfoque estrictamente Mobile-First:
>    - Meta viewport configurado.
>    - En pantallas móviles: menú de navegación hamburguesa que se oculta/muestra, tarjetas a ancho completo y lectura cómoda.
>    - En pantallas de escritorio (@media min-width: 993px): barra lateral fija a la izquierda y contenido amplio y centrado.
> 4. Contenido educativo (Charles Severance):
>    - Hero header explicativo.
>    - 1. Introducción y primer programa.
>    - 2. Variables, tipos de datos y tabla comparativa.
>    - 3. Estructuras condicionales (if / else) con cálculo de horas extras.
>    - 4. Funciones (def y return).
>    - 5. Bucles e iteraciones (for y listas).
>    - Sección final de créditos y referencia formal a PY4E y Charles Severance.
> 5. Interactividad en script.js:
>    - Abrir y cerrar el menú lateral en dispositivos móviles.
>    - Cerrar el menú al pulsar sobre cualquier enlace.
>    - Botón funcional 'Copiar código' en cada bloque de código de Python con feedback visual ('¡Copiado!').
>
> Por favor, crea los 3 archivos en el directorio actual con todo el código completo y listo para producción."

---
