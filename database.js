const datosCSV = `

"nombre de producto","1234567891234","1000","1400",6,1,1

`;

function instalarBaseDeDatosOriginal() {
    let lineas = datosCSV.trim().split('\n');
    let baseNueva = {};
    let rubrosNuevos = new Set(["ALMACÉN", "BEBIDAS", "LIMPIEZA"]);

    lineas.forEach(linea => {
        let p = linea.trim();
        if (!p) return;
        
        let valores = [];
        let enComillas = false;
        let valor = "";
        
        for (let i = 0; i < p.length; i++) {
            let char = p[i];
            if (char === '"') enComillas = !enComillas;
            else if (char === ',' && !enComillas) { valores.push(valor); valor = ""; }
            else valor += char;
        }
        valores.push(valor);
        
        if (valores.length >= 4) {
            let nombre = valores[0];
            let codigo = valores[1];
            let costo = parseFloat(valores[2].replace(',', '.')); 
            let precio = parseFloat(valores[3].replace(',', '.'));
            let stock = parseInt(valores[4]) || 0;
            
            // TODOS arrancan por defecto con límite 3 como solicitaste
            let limiteStock = 3; 
            
            let rubro = "ALMACÉN";
            if (valores[7] && isNaN(valores[7])) {
                rubro = valores[7].toUpperCase();
            } else {
                if(nombre.startsWith("GALL.")) rubro = "GALLETITAS";
                else if(nombre.startsWith("LIMP.")) rubro = "LIMPIEZA";
                else if(nombre.startsWith("PERF.")) rubro = "PERFUMERIA";
                else if(nombre.startsWith("COM.")) rubro = "COMESTIBLES";
            }
            rubrosNuevos.add(rubro);
            
            let porcentaje = 0;
            if (costo > 0) porcentaje = Math.round(((precio - costo) / costo) * 100);
            
            baseNueva[codigo] = {
                nombre: nombre,
                descripcion: "",
                rubro: rubro,
                costo: costo,
                porcentaje: porcentaje,
                precioVenta: precio,
                stock: stock,
                limiteStock: limiteStock // <-- Agregado a la base de datos
            };
        }
    });
    return { db: baseNueva, rubros: Array.from(rubrosNuevos) };
}
