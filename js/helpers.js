const Helpers = (function () {
    "use strict";

    /**
     * Rellena un número con ceros a la izquierda.
     * @param {number} numero
     * @param {number} longitud
     * @returns {string}
     */
    function pad(numero, longitud = 2) {
        return String(numero).padStart(longitud, "0");
    }

    /**
     * Generador centralizado de IDs únicos del sistema.
     * Formato: `${PREFIJO}-${AAAAMMDDHHmmssSSS}-${SUFIJO_ALEATORIO}`
     *
     * Mantiene la trazabilidad temporal (útil para depurar e identificar
     * a simple vista cuándo se generó un registro) y añade un sufijo
     * aleatorio de 4 caracteres para garantizar unicidad incluso si dos
     * registros se crean en el mismo milisegundo.
     *
     * @param {string} prefijo Ej: "TK", "FD", "PROV", "M"
     * @returns {string}
     */
    function generarId(prefijo) {
        const ahora = new Date();
        const marcaTiempo =
            `${ahora.getFullYear()}${pad(ahora.getMonth() + 1)}${pad(ahora.getDate())}` +
            `${pad(ahora.getHours())}${pad(ahora.getMinutes())}${pad(ahora.getSeconds())}${pad(ahora.getMilliseconds(), 3)}`;
        const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `${prefijo}-${marcaTiempo}-${sufijo}`;
    }

    /**
     * Convierte un valor a tipo numérico entero (descarta centavos).
     * @param {*} valor
     * @param {number} [valorPorDefecto=0]
     * @returns {number}
     */
    function aNumero(valor, valorPorDefecto = 0) {
        if (valor === null || valor === undefined) return valorPorDefecto;
        if (typeof valor === "number") return Math.round(valor);
        const n = parseFloat(String(valor).replace(/[^0-9.-]/g, ""));
        return isNaN(n) ? valorPorDefecto : Math.round(n);
    }

    /**
     * Convierte un valor a entero.
     */
    function aEntero(valor, valorPorDefecto = 0) {
        return aNumero(valor, valorPorDefecto);
    }

    /**
     * Redondea un número a 0 decimales.
     * @param {number} valor
     * @returns {number}
     */
    function redondear2(valor) {
        if (valor === null || valor === undefined) return 0;
        return Math.round(Number(valor) || 0);
    }

    /**
     * Formatea un número como moneda sin decimales (centavos).
     * @param {number|string} valor
     * @returns {string}
     */
    function formatearMoneda(valor) {
        const n = aNumero(valor);
        return n.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    /**
     * Formatea una fecha (Date) a fecha y hora legible en es-AR.
     * @param {Date} fecha
     * @returns {string}
     */
    function formatearFechaHora(fecha) {
        return `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
    }

    /**
     * Escapa caracteres especiales de HTML para insertar texto dinámico
     * de forma segura dentro de `innerHTML` (previene HTML injection
     * cuando se renderizan nombres de productos / clientes ingresados
     * por el usuario).
     * @param {*} texto
     * @returns {string}
     */
    function escaparHtml(texto) {
        if (texto === null || texto === undefined) return "";
        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /**
     * Crea una versión "debounced" de una función: solo se ejecutará
     * tras `espera` ms sin nuevas invocaciones. Útil para inputs de
     * búsqueda sobre listas grandes.
     * @param {Function} fn
     * @param {number} espera
     * @returns {Function}
     */
    function debounce(fn, espera = 250) {
        let temporizador = null;
        return function (...args) {
            clearTimeout(temporizador);
            temporizador = setTimeout(() => fn.apply(this, args), espera);
        };
    }

    /**
     * Normaliza una clave de texto para comparaciones tolerantes a
     * acentos, mayúsculas y espacios/símbolos. Se usa para reconocer
     * encabezados de columnas al importar archivos (ej: "Código",
     * "codigo", "Cod. Barras" → "codbarras").
     * @param {*} texto
     * @returns {string}
     */
    function normalizarClave(texto) {
        return String(texto === null || texto === undefined ? "" : texto)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // quita acentos/diacríticos
            .toLowerCase()
            .replace(/[^a-z0-9%]/g, ""); // deja solo letras, números y "%"
    }

    /**
     * Detecta el delimitador más probable de una línea CSV comparando
     * la cantidad de comas vs. punto y coma (planillas de Excel en
     * configuración regional es-AR suelen exportar con ";").
     * @param {string} linea
     * @returns {","|";"}
     */
    function detectarDelimitadorCsv(linea) {
        const texto = String(linea || "");
        const comas = (texto.match(/,/g) || []).length;
        const puntoYComa = (texto.match(/;/g) || []).length;
        return puntoYComa > comas ? ";" : ",";
    }

    /**
     * Parser de CSV tolerante (soporta campos entre comillas dobles,
     * comillas escapadas como "" y saltos de línea \r\n o \n). Devuelve
     * una matriz de filas, cada una como array de strings ya recortados
     * (`trim`). Las filas completamente vacías se descartan.
     * @param {string} texto
     * @param {string} [delimitador] "," o ";"
     * @returns {string[][]}
     */
    function parsearCsv(texto, delimitador) {
        const delim = delimitador || ",";
        const filas = [];
        let fila = [];
        let campo = "";
        let dentroComillas = false;
        const contenido = String(texto || "");

        for (let i = 0; i < contenido.length; i++) {
            const c = contenido[i];
            if (dentroComillas) {
                if (c === '"') {
                    if (contenido[i + 1] === '"') {
                        campo += '"';
                        i++;
                    } else {
                        dentroComillas = false;
                    }
                } else {
                    campo += c;
                }
                continue;
            }
            if (c === '"') {
                dentroComillas = true;
            } else if (c === delim) {
                fila.push(campo);
                campo = "";
            } else if (c === "\n") {
                fila.push(campo);
                filas.push(fila);
                fila = [];
                campo = "";
            } else if (c === "\r") {
                // se ignora; el salto real lo maneja "\n"
            } else {
                campo += c;
            }
        }
        if (campo !== "" || fila.length > 0) {
            fila.push(campo);
            filas.push(fila);
        }

        return filas.map((f) => f.map((c) => c.trim())).filter((f) => f.some((c) => c !== ""));
    }

    /**
     * Normaliza un valor numérico que puede venir en formato regional
     * es-AR (coma decimal, punto de miles) o con símbolos de moneda,
     * devolviéndolo como string apto para `parseFloat`/`parseInt`.
     * @param {*} valor
     * @returns {string}
     */
    function normalizarNumeroLocal(valor) {
        let limpio = String(valor === null || valor === undefined ? "" : valor).trim();
        if (limpio === "") return "0";

        limpio = limpio.replace(/[^\d.,-]/g, "");

        if (/^-?\d{1,3}(\.\d{3})+,\d+$/.test(limpio)) {
            limpio = limpio.replace(/\./g, "").replace(",", ".");
        } else if (/^-?\d{1,3}(,\d{3})+$/.test(limpio)) {
            limpio = limpio.replace(/,/g, "");
        } else if (/^-?\d{1,3}(\.\d{3})+$/.test(limpio)) {
            limpio = limpio.replace(/\./g, "");
        } else if (/^-?\d+,\d+$/.test(limpio)) {
            limpio = limpio.replace(",", ".");
        }

        return limpio || "0";
    }

    /**
     * Escapa un valor para insertarlo como campo de un archivo CSV,
     * envolviéndolo en comillas dobles y duplicando las comillas
     * internas.
     * @param {*} valor
     * @returns {string}
     */
    function escaparCsv(valor) {
        const texto = valor === null || valor === undefined ? "" : String(valor);
        return `"${texto.replace(/"/g, '""')}"`;
    }

    /**
     * Dispara la descarga de un archivo de texto generado en el
     * navegador (usado para exportaciones CSV y plantillas).
     * @param {string} contenido
     * @param {string} nombreArchivo
     * @param {string} [tipoMime]
     */
    function descargarTexto(contenido, nombreArchivo, tipoMime) {
        const blob = new Blob([contenido], { type: tipoMime || "text/plain;charset=utf-8;" });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(enlace.href);
    }

    return Object.freeze({
        pad,
        generarId,
        aNumero,
        aEntero,
        redondear2,
        formatearMoneda,
        formatearFechaHora,
        escaparHtml,
        debounce,
        normalizarClave,
        detectarDelimitadorCsv,
        parsearCsv,
        normalizarNumeroLocal,
        escaparCsv,
        descargarTexto,
    });
})();
