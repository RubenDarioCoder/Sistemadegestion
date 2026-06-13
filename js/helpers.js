/**
 * =====================================================================
 *  Helpers
 * ---------------------------------------------------------------------
 *  Funciones de utilidad transversales, sin estado y sin dependencias
 *  del DOM. Se exponen mediante un único objeto global de solo lectura
 *  (`window.Helpers`) siguiendo el patrón de Módulo (IIFE) para evitar
 *  ensuciar el scope global con funciones sueltas.
 *
 *  Responsabilidades:
 *   - Generación centralizada de IDs únicos (evita formatos mixtos
 *     como "TK-", "FD-", "M-", "PROV-" construidos a mano en cada lugar).
 *   - Conversión segura de valores numéricos (evita "NaN" / "undefined").
 *   - Formateo de moneda y fechas.
 *   - Escape de HTML para evitar inyección al renderizar texto dinámico.
 *   - "debounce" para inputs de búsqueda.
 * =====================================================================
 */
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
     * Convierte cualquier valor a número finito, devolviendo un valor
     * por defecto seguro si la conversión falla (reemplaza el patrón
     * repetido `parseFloat(x) || 0`, que falla con valores negativos
     * legítimos igual a 0 pero es aceptable para montos).
     * @param {*} valor
     * @param {number} porDefecto
     * @returns {number}
     */
    function aNumero(valor, porDefecto = 0) {
        const n = typeof valor === "number" ? valor : parseFloat(valor);
        return Number.isFinite(n) ? n : porDefecto;
    }

    /**
     * Convierte cualquier valor a entero seguro.
     * @param {*} valor
     * @param {number} porDefecto
     * @returns {number}
     */
    function aEntero(valor, porDefecto = 0) {
        const n = typeof valor === "number" ? Math.trunc(valor) : parseInt(valor, 10);
        return Number.isFinite(n) ? n : porDefecto;
    }

    /**
     * Redondea un número a 2 decimales evitando errores de coma
     * flotante (ej: 0.1 + 0.2 = 0.30000000000000004).
     * @param {number} valor
     * @returns {number}
     */
    function redondear2(valor) {
        return Math.round((aNumero(valor) + Number.EPSILON) * 100) / 100;
    }

    /**
     * Formatea un número como moneda ($ con 2 decimales).
     * @param {number} valor
     * @returns {string}
     */
    function formatearMoneda(valor) {
        return `$${aNumero(valor).toFixed(2)}`;
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
    });
})();
