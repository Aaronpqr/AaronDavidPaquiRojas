// script.js

document.addEventListener("DOMContentLoaded", () => {
    // Selección de elementos del DOM
    const sidebar = document.getElementById("mySidebar");
    const openBtn = document.getElementById("openMenuBtn");
    const closeBtn = document.getElementById("closeMenuBtn");
    const menuLinks = sidebar.querySelectorAll("a");

    // 1. Abrir menú en móviles
    openBtn.addEventListener("click", () => {
        sidebar.style.display = "block";
    });

    // 2. Cerrar menú en móviles
    closeBtn.addEventListener("click", () => {
        sidebar.style.display = "none";
    });

    // 3. Cerrar el menú al pulsar sobre cualquier enlace (Solo aplica a móviles)
    menuLinks.forEach(link => {
        link.addEventListener("click", () => {
            // Si el ancho es de dispositivo móvil (<993px), ocultamos el menú tras el clic
            if (window.innerWidth < 993) {
                sidebar.style.display = "none";
            }
        });
    });

    // Precaución: Garantizar la visibilidad correcta del menú al redimensionar la ventana
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 993) {
            sidebar.style.display = "block";
        } else {
            // No ocultamos agresivamente al hacer resize pequeño si el usuario lo abrió voluntariamente,
            // pero podemos resetearlo a `none` de manera segura si queremos obligar al uso del botón hamburguesa.
            sidebar.style.display = "none"; 
        }
    });

    // 4. Botón funcional 'Copiar código'
    const copyButtons = document.querySelectorAll(".copy-btn");
    
    copyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // El elemento que contiene el texto del código está justo después del botón en el HTML
            const codeBlock = btn.nextElementSibling;
            if (!codeBlock) return;
            
            const textToCopy = codeBlock.innerText;
            
            // API del Portapapeles
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Feedback visual: Guardamos los valores originales
                const originalText = btn.innerText;
                const originalBg = btn.style.backgroundColor;
                const originalColor = btn.style.color;
                
                // Aplicamos estilo de éxito
                btn.innerText = "¡Copiado!";
                btn.style.backgroundColor = "#4CAF50"; // Verde estilo W3.CSS
                btn.style.color = "white";
                
                // Restauramos después de 2 segundos
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = originalBg;
                    btn.style.color = originalColor;
                }, 2000);
                
            }).catch(err => {
                console.error("No se pudo copiar el texto: ", err);
                btn.innerText = "Error";
                setTimeout(() => {
                    btn.innerText = "Copiar código";
                }, 2000);
            });
        });
    });
});
