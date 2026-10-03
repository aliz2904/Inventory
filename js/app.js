/**
 * VELISIMA - Candle Inventory & Cost Control
 * Main Application Logic (Core Controller & State Management)
 * Phase 4: Profit & Material Dashboard (The Analytics Console & Business Intelligence)
 * 
 * Engineering Analogy:
 * - This file acts like the MAIN DSP PROCESSOR & GRAPHICS TELEMETRY ENGINE.
 * - LocalStorage is our EEPROM non-volatile memory bank.
 * - Chart.js acts as our Real-Time Oscilloscope / Spectrum Analyzer, visualizing
 *   margins, material cost distributions, and inventory asset valuation.
 */

// ==========================================================================
// 1. DEFAULT DATA CONFIGURATION (ROM BACKUP)
// ==========================================================================

const DEFAULT_CONFIG = {
    tipo_cera_default: 'malasia', // 'malasia' or 'soya'
    costo_cera_malasia_g: Number((323.03 / 4700).toFixed(5)), // $323.03 for 4.7kg = $0.06873/g
    costo_cera_soya_g: 0.14,                                  // $0.14/g for bouquets
    costo_cera_g: Number((323.03 / 4700).toFixed(5)),         // Active default wax cost ($/g)
    costo_fragancia_g: 1.1714,                                // Average of real 13 fragrances ($292.84 / 250ml)
    pct_fragancia: 0.08,                                      // Default fragrance percentage (8%)
    pct_aditivo: 0.02,                                        // Additive percentage (2%)
    costo_pabilo: 0.50                                        // Fixed cost per wick
};

const DEFAULT_FRAGRANCIAS = [
    { id: 1, nombre: "Tentación", costo_250ml: 205.00, costo_g: 0.8200 },
    { id: 2, nombre: "Suspiro de amor", costo_250ml: 292.50, costo_g: 1.1700 },
    { id: 3, nombre: "Arena sol y mar", costo_250ml: 310.00, costo_g: 1.2400 },
    { id: 4, nombre: "Calabaza & Spicy", costo_250ml: 290.00, costo_g: 1.1600 },
    { id: 5, nombre: "Mandarina", costo_250ml: 425.00, costo_g: 1.7000 },
    { id: 6, nombre: "Sandía", costo_250ml: 282.50, costo_g: 1.1300 },
    { id: 7, nombre: "Rompope", costo_250ml: 250.00, costo_g: 1.0000 },
    { id: 8, nombre: "Mar Fresco", costo_250ml: 287.50, costo_g: 1.1500 },
    { id: 9, nombre: "Grosella", costo_250ml: 250.00, costo_g: 1.0000 },
    { id: 10, nombre: "Chocolate", costo_250ml: 320.00, costo_g: 1.2800 },
    { id: 11, nombre: "Café", costo_250ml: 217.50, costo_g: 0.8700 },
    { id: 12, nombre: "Brisa Frescura Herb", costo_250ml: 327.50, costo_g: 1.3100 },
    { id: 13, nombre: "Flor de Cempazuchitl", costo_250ml: 149.40, costo_g: 0.5976 }
];

const DEFAULT_PRODUCTS = [
    { id: 1, nombre: "Sagrada Fam", gramaje: 85, precio_venta: 110, stock: 0, tipo_cera: 'malasia' },
    { id: 2, nombre: "Flor 1", gramaje: 22, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 3, nombre: "Flor 2 (base circular)", gramaje: 22, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 4, nombre: "Tulipán", gramaje: 28, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 5, nombre: "Peonía cempasuchil blanca", gramaje: 30, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 6, nombre: "Flor 3 (cilindro)", gramaje: 20, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 7, nombre: "Rosa", gramaje: 25, precio_venta: 40, stock: 0, tipo_cera: 'malasia' },
    { id: 8, nombre: "Flor plana", gramaje: 32, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 9, nombre: "Nube grande", gramaje: 93, precio_venta: 100, stock: 0, tipo_cera: 'malasia' },
    { id: 10, nombre: "Esqueleto", gramaje: 19, precio_venta: 30, stock: 0, tipo_cera: 'malasia' },
    { id: 11, nombre: "Manos rezando", gramaje: 62, precio_venta: 80, stock: 0, tipo_cera: 'malasia' },
    { id: 12, nombre: "Bulldog", gramaje: 62, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 13, nombre: "Fantasma moño", gramaje: 79, precio_venta: 90, stock: 0, tipo_cera: 'malasia' },
    { id: 14, nombre: "Busto ojos", gramaje: 146, precio_venta: 150, stock: 0, tipo_cera: 'malasia' },
    { id: 15, nombre: "Vela fantasma", gramaje: 70, precio_venta: 95, stock: 0, tipo_cera: 'malasia' },
    { id: 16, nombre: "Gato fantasma", gramaje: 39, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 17, nombre: "Fantasma grande", gramaje: 138, precio_venta: 130, stock: 0, tipo_cera: 'malasia' },
    { id: 18, nombre: "Perro fantasma", gramaje: 46, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 19, nombre: "Busto ojo tapado", gramaje: 108, precio_venta: 150, stock: 0, tipo_cera: 'malasia' },
    { id: 20, nombre: "Huella perro", gramaje: 35, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 21, nombre: "Gato sentado", gramaje: 33, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 22, nombre: "Gato acostado", gramaje: 39, precio_venta: 45, stock: 0, tipo_cera: 'malasia' },
    { id: 23, nombre: "Virgen", gramaje: 47, precio_venta: 80, stock: 0, tipo_cera: 'malasia' },
    { id: 24, nombre: "Fantasma cabeza calabaza", gramaje: 86, precio_venta: 100, stock: 0, tipo_cera: 'malasia' },
    { id: 25, nombre: "Calabaza centro", gramaje: 44, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 26, nombre: "Calabaza grande", gramaje: 76, precio_venta: 80, stock: 0, tipo_cera: 'malasia' },
    { id: 27, nombre: "Flor cempasúchil", gramaje: 22, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 28, nombre: "Venus", gramaje: 60, precio_venta: 75, stock: 0, tipo_cera: 'malasia' },
    { id: 29, nombre: "Virgencita plis", gramaje: 72, precio_venta: 80, stock: 0, tipo_cera: 'malasia' },
    { id: 30, nombre: "Peonía Grande", gramaje: 88, precio_venta: 95, stock: 0, tipo_cera: 'malasia' },
    { id: 31, nombre: "Galleta Jengibre chico", gramaje: 42, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 32, nombre: "Vela Bola", gramaje: 203, precio_venta: 180, stock: 0, tipo_cera: 'malasia' },
    { id: 33, nombre: "Perro rosas", gramaje: 69, precio_venta: 75, stock: 0, tipo_cera: 'malasia' },
    { id: 34, nombre: "Dinosaurio", gramaje: 72, precio_venta: 80, stock: 0, tipo_cera: 'malasia' },
    { id: 35, nombre: "Piña", gramaje: 138, precio_venta: 130, stock: 0, tipo_cera: 'malasia' },
    { id: 36, nombre: "Reno 3D", gramaje: 165, precio_venta: 150, stock: 0, tipo_cera: 'malasia' },
    { id: 37, nombre: "Princess", gramaje: 62, precio_venta: 70, stock: 0, tipo_cera: 'malasia' },
    { id: 38, nombre: "Astronauta", gramaje: 67, precio_venta: 75, stock: 0, tipo_cera: 'malasia' },
    { id: 39, nombre: "Ángel pequeño", gramaje: 61, precio_venta: 70, stock: 0, tipo_cera: 'malasia' },
    { id: 40, nombre: "Perro Pudle", gramaje: 83, precio_venta: 90, stock: 0, tipo_cera: 'malasia' },
    { id: 41, nombre: "Corazón", gramaje: 95, precio_venta: 100, stock: 0, tipo_cera: 'malasia' },
    { id: 42, nombre: "Galleta Jengibre grande", gramaje: 59, precio_venta: 70, stock: 0, tipo_cera: 'malasia' },
    { id: 43, nombre: "Ángel grande", gramaje: 105, precio_venta: 110, stock: 0, tipo_cera: 'malasia' },
    { id: 44, nombre: "Margarita", gramaje: 21, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 45, nombre: "Moño", gramaje: 6, precio_venta: 15, stock: 0, tipo_cera: 'malasia' },
    { id: 46, nombre: "Noche Buena", gramaje: 13, precio_venta: 25, stock: 0, tipo_cera: 'malasia' },
    { id: 47, nombre: "Pino ancho", gramaje: 181, precio_venta: 160, stock: 0, tipo_cera: 'malasia' },
    { id: 48, nombre: "Pretzel", gramaje: 8, precio_venta: 18, stock: 0, tipo_cera: 'malasia' },
    { id: 49, nombre: "Concha Mediana", gramaje: 42, precio_venta: 50, stock: 0, tipo_cera: 'malasia' },
    { id: 50, nombre: "Oso pequeño", gramaje: 20, precio_venta: 35, stock: 0, tipo_cera: 'malasia' },
    { id: 51, nombre: "Flor Chica plana 1", gramaje: 3, precio_venta: 10, stock: 0, tipo_cera: 'malasia' },
    { id: 52, nombre: "Flor Chica plana 2", gramaje: 4, precio_venta: 12, stock: 0, tipo_cera: 'malasia' },
    { id: 53, nombre: "Flor Chica plana 3", gramaje: 6, precio_venta: 15, stock: 0, tipo_cera: 'malasia' },
    { id: 54, nombre: "Cactus brazos", gramaje: 48, precio_venta: 55, stock: 0, tipo_cera: 'malasia' },
    { id: 55, nombre: "Cactus bola", gramaje: 46, precio_venta: 55, stock: 0, tipo_cera: 'malasia' },
    { id: 56, nombre: "Cactus flor pequeña", gramaje: 17, precio_venta: 30, stock: 0, tipo_cera: 'malasia' },
    { id: 57, nombre: "Cactus cilindro", gramaje: 7, precio_venta: 18, stock: 0, tipo_cera: 'malasia' },
    { id: 58, nombre: "Cactus bolita chica", gramaje: 12, precio_venta: 25, stock: 0, tipo_cera: 'malasia' },
    { id: 59, nombre: "Cactus estrella", gramaje: 6, precio_venta: 15, stock: 0, tipo_cera: 'malasia' },
    { id: 60, nombre: "Cactus medusa", gramaje: 8, precio_venta: 18, stock: 0, tipo_cera: 'malasia' },
    { id: 61, nombre: "Cactus flor", gramaje: 4, precio_venta: 12, stock: 0, tipo_cera: 'malasia' },
    { id: 62, nombre: "Cactus media medusa", gramaje: 1, precio_venta: 8, stock: 0, tipo_cera: 'malasia' },
    { id: 63, nombre: "Nube mediana", gramaje: 46, precio_venta: 55, stock: 0, tipo_cera: 'malasia' },
    { id: 64, nombre: "Nube chica", gramaje: 16, precio_venta: 30, stock: 0, tipo_cera: 'malasia' },
    { id: 65, nombre: "Pino largo", gramaje: 124, precio_venta: 120, stock: 0, tipo_cera: 'malasia' },
    { id: 66, nombre: "Mar(conchas)", gramaje: 134, precio_venta: 130, stock: 0, tipo_cera: 'malasia' }
];

// ==========================================================================
// 2. MATHEMATICAL MODEL (FORMULA ENGINE / TRANSFER FUNCTION)
// ==========================================================================

function calcularValoresVela(gramaje, precioVenta, opciones = {}, config = getAppState().config) {
    const tipoCera = opciones.tipoCera || 'malasia';
    const pctFragancia = opciones.pctFragancia !== undefined ? opciones.pctFragancia : config.pct_fragancia;
    const pctAditivo = config.pct_aditivo;
    
    const costoCeraUnitario = tipoCera === 'soya' 
        ? (config.costo_cera_soya_g || 0.14) 
        : (config.costo_cera_malasia_g || config.costo_cera_g || 0.06873);
        
    const costoFraganciaUnitario = opciones.costoFraganciaG !== undefined 
        ? opciones.costoFraganciaG 
        : (config.costo_fragancia_g || 1.1714);

    const factorCera = Math.max(0, 1 - pctFragancia - pctAditivo);
    const ceraG = gramaje * factorCera;
    const fraganciaG = gramaje * pctFragancia;
    const aditivoG = gramaje * pctAditivo;

    const costoCera = ceraG * costoCeraUnitario;
    const costoFragancia = fraganciaG * costoFraganciaUnitario;
    const costoPabilo = config.costo_pabilo;

    const totalInsumos = costoCera + costoFragancia + costoPabilo;
    const ganancia = precioVenta - totalInsumos;
    const porcentajeMargen = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;

    return {
        gramaje_total: gramaje,
        tipo_cera: tipoCera,
        costo_cera_unitario: costoCeraUnitario,
        pct_fragancia: pctFragancia,
        cera_g: Number(ceraG.toFixed(2)),
        fragancia_g: Number(fraganciaG.toFixed(2)),
        aditivo_g: Number(aditivoG.toFixed(2)),
        costo_cera: Number(costoCera.toFixed(2)),
        costo_fragancia: Number(costoFragancia.toFixed(2)),
        costo_pabilo: Number(costoPabilo.toFixed(2)),
        total_insumos: Number(totalInsumos.toFixed(2)),
        precio_venta: precioVenta,
        ganancia: Number(ganancia.toFixed(2)),
        porcentaje_margen: Number(porcentajeMargen.toFixed(1))
    };
}

// ==========================================================================
// 3. STORAGE I/O CONTROLLER (EEPROM SIMULATION)
// ==========================================================================

function getAppState() {
    let config = null, fragancias = null, products = null, orders = null, quotes = null, insumos = null;
    
    if (window.APP_STATE) {
        config = window.APP_STATE.config ? JSON.stringify(window.APP_STATE.config) : null;
        fragancias = window.APP_STATE.fragancias ? JSON.stringify(window.APP_STATE.fragancias) : null;
        products = window.APP_STATE.products ? JSON.stringify(window.APP_STATE.products) : null;
        orders = window.APP_STATE.orders ? JSON.stringify(window.APP_STATE.orders) : null;
        quotes = window.APP_STATE.quotes ? JSON.stringify(window.APP_STATE.quotes) : null;
        insumos = window.APP_STATE.insumos ? JSON.stringify(window.APP_STATE.insumos) : null;
    } else {
        config = localStorage.getItem('velisima_config');
        fragancias = localStorage.getItem('velisima_fragancias');
        products = localStorage.getItem('velisima_products');
        orders = localStorage.getItem('velisima_orders');
        quotes = localStorage.getItem('velisima_quotes');
        insumos = localStorage.getItem('velisima_insumos');
    }

    // 1. Config register
    if (!config) {
        config = { ...DEFAULT_CONFIG };
        localStorage.setItem('velisima_config', JSON.stringify(config));
    } else {
        config = JSON.parse(config);
        let configChanged = false;
        // Upgrade legacy wax and fragrance costs to accurate values
        if (!config.costo_cera_malasia_g || config.costo_cera_malasia_g === 0.11) {
            config.costo_cera_malasia_g = DEFAULT_CONFIG.costo_cera_malasia_g;
            config.costo_cera_g = DEFAULT_CONFIG.costo_cera_g;
            configChanged = true;
        }
        if (!config.costo_fragancia_g || config.costo_fragancia_g === 0.70 || config.costo_fragancia_g === 0.08) {
            config.costo_fragancia_g = DEFAULT_CONFIG.costo_fragancia_g;
            configChanged = true;
        }
        if (!config.costo_cera_soya_g) {
            config.costo_cera_soya_g = DEFAULT_CONFIG.costo_cera_soya_g;
            configChanged = true;
        }
        if (configChanged) {
            localStorage.setItem('velisima_config', JSON.stringify(config));
        }
    }

    // 2. Fragrances register
    if (!fragancias) {
        fragancias = [...DEFAULT_FRAGRANCIAS];
        localStorage.setItem('velisima_fragancias', JSON.stringify(fragancias));
    } else {
        fragancias = JSON.parse(fragancias);
        // If still on placeholder 8 fragrances, upgrade to 13 real fragrances
        if (fragancias.length < 13 || fragancias[0].nombre === "Vainilla Francesa" && fragancias[0].costo_250ml === 175) {
            fragancias = [...DEFAULT_FRAGRANCIAS];
            localStorage.setItem('velisima_fragancias', JSON.stringify(fragancias));
        }
    }

    // 3. Products register
    if (!products) {
        products = DEFAULT_PRODUCTS.map(p => {
            const calculated = calcularValoresVela(p.gramaje, p.precio_venta, { tipoCera: p.tipo_cera || 'malasia' }, config);
            return {
                id: parseInt(p.id),
                nombre: p.nombre,
                gramaje: parseFloat(p.gramaje),
                precio_venta: parseFloat(p.precio_venta),
                stock: parseInt(p.stock) || 0,
                tipo_cera: p.tipo_cera || 'malasia',
                calculado: calculated
            };
        });
        products.sort((a, b) => a.id - b.id);
        localStorage.setItem('velisima_products', JSON.stringify(products));
    } else {
        products = JSON.parse(products);
        let needsResave = false;

        // If product catalog is less than 66, merge with full 66 products catalog
        if (products.length < 66) {
            DEFAULT_PRODUCTS.forEach(dp => {
                const existing = products.find(p => p.id === dp.id || p.nombre.toLowerCase() === dp.nombre.toLowerCase());
                if (!existing) {
                    products.push({
                        id: dp.id,
                        nombre: dp.nombre,
                        gramaje: dp.gramaje,
                        precio_venta: dp.precio_venta,
                        stock: 0,
                        tipo_cera: dp.tipo_cera || 'malasia',
                        calculado: calcularValoresVela(dp.gramaje, dp.precio_venta, { tipoCera: dp.tipo_cera || 'malasia' }, config)
                    });
                    needsResave = true;
                }
            });
        }
        
        products = products.map(p => {
            const idNum = parseInt(p.id);
            const tipoCera = p.tipo_cera || 'malasia';
            const stockNum = parseInt(p.stock) || 0;
            const gramajeNum = parseFloat(p.gramaje);
            const precioNum = parseFloat(p.precio_venta);
            
            // Recalculate accurately
            const calculado = calcularValoresVela(gramajeNum, precioNum, { tipoCera }, config);
            
            return {
                ...p,
                id: idNum,
                nombre: p.nombre,
                gramaje: gramajeNum,
                precio_venta: precioNum,
                stock: stockNum,
                tipo_cera: tipoCera,
                calculado: calculado
            };
        });
        
        products.sort((a, b) => a.id - b.id);
        
        if (needsResave || true) {
            localStorage.setItem('velisima_products', JSON.stringify(products));
        }
    }

    // 4. Orders register (sanitize dates)
    if (!orders) {
        orders = [];
        localStorage.setItem('velisima_orders', JSON.stringify(orders));
    } else {
        orders = JSON.parse(orders);
        orders.forEach(o => {
            if (o.fecha && o.fecha.length > 10) o.fecha = o.fecha.slice(0, 10);
            if (o.fecha_entrega && o.fecha_entrega.length > 10) o.fecha_entrega = o.fecha_entrega.slice(0, 10);
        });
    }

    // 5. Quotes register (sanitize dates)
    if (!quotes) {
        quotes = [];
        localStorage.setItem('velisima_quotes', JSON.stringify(quotes));
    } else {
        quotes = JSON.parse(quotes);
        quotes.forEach(q => {
            if (q.fecha && q.fecha.length > 10) q.fecha = q.fecha.slice(0, 10);
        });
    }

    // 6. Insumos & Raw Materials register
    if (!insumos) {
        insumos = {
            cera_malasia_g: 0,
            cera_soya_g: 0,
            fragancias: fragancias.map(f => ({
                id: f.id,
                nombre: f.nombre,
                botellas_250ml: 0,
                botellas_500ml: 0,
                botellas_1l: 0,
                gramos_sueltos: 0,
                total_g: 0
            })),
            gastos_fijos_mensuales: {
                aditivos_pabilos_colorantes: 350.00,
                notas: "Aditivos, pabilos y colorantes gestionados como gasto mensual fijo de taller con restock continuo."
            }
        };
        localStorage.setItem('velisima_insumos', JSON.stringify(insumos));
    } else {
        insumos = JSON.parse(insumos);
        if (!insumos.fragancias) insumos.fragancias = [];
        // Ensure all fragancias exist in insumos register
        fragancias.forEach(f => {
            let item = insumos.fragancias.find(fi => fi.id === f.id || fi.nombre.toLowerCase() === f.nombre.toLowerCase());
            if (!item) {
                insumos.fragancias.push({
                    id: f.id,
                    nombre: f.nombre,
                    botellas_250ml: 0,
                    botellas_500ml: 0,
                    botellas_1l: 0,
                    gramos_sueltos: 0,
                    total_g: 0
                });
            } else {
                // recalculate total grams: 250*b250 + 500*b500 + 1000*b1l + sueltos
                const b250 = parseInt(item.botellas_250ml) || 0;
                const b500 = parseInt(item.botellas_500ml) || 0;
                const b1l = parseInt(item.botellas_1l) || 0;
                const sueltos = parseFloat(item.gramos_sueltos) || 0;
                item.total_g = (b250 * 250) + (b500 * 500) + (b1l * 1000) + sueltos;
            }
        });
    }

    return { config, fragancias, products, orders, quotes, insumos };
}

function saveAppState(state) {
    if (window.APP_STATE) {
        if (state.config) window.APP_STATE.config = state.config;
        if (state.fragancias) window.APP_STATE.fragancias = state.fragancias;
        if (state.products) {
            state.products.sort((a, b) => a.id - b.id);
            window.APP_STATE.products = state.products;
        }
        if (state.orders) window.APP_STATE.orders = state.orders;
        if (state.quotes) window.APP_STATE.quotes = state.quotes;
        if (state.insumos) window.APP_STATE.insumos = state.insumos;
        
        if (window.db) {
            window.db.ref('velisima_data').set(window.APP_STATE);
        }
    }

    if (state.config) localStorage.setItem('velisima_config', JSON.stringify(state.config));
    if (state.fragancias) localStorage.setItem('velisima_fragancias', JSON.stringify(state.fragancias));
    if (state.products) {
        if(!window.APP_STATE) state.products.sort((a, b) => a.id - b.id);
        localStorage.setItem('velisima_products', JSON.stringify(state.products));
    }
    if (state.orders) localStorage.setItem('velisima_orders', JSON.stringify(state.orders));
    if (state.quotes) localStorage.setItem('velisima_quotes', JSON.stringify(state.quotes));
    if (state.insumos) localStorage.setItem('velisima_insumos', JSON.stringify(state.insumos));
}

function resetAppState() {
    localStorage.removeItem('velisima_config');
    localStorage.removeItem('velisima_fragancias');
    localStorage.removeItem('velisima_products');
    localStorage.removeItem('velisima_orders');
    localStorage.removeItem('velisima_quotes');
    localStorage.removeItem('velisima_insumos');
    location.reload();
}

// ==========================================================================
// 4. EXCEL IMPORT CONTROLLER (SheetJS Bus)
// ==========================================================================

function importarExcelData(file, callback) {
    const lector = new FileReader();
    
    lector.onload = function(e) {
        try {
            const datosBinarios = e.target.result;
            const wb = XLSX.read(datosBinarios, { type: 'binary' });
            
            const nombreHojaCosteo = 'Costeo Velas';
            if (!wb.SheetNames.includes(nombreHojaCosteo)) {
                alert(`Error: No se encontró la pestaña llamada "${nombreHojaCosteo}" en el archivo Excel.`);
                return;
            }
            
            const wsCosteo = wb.Sheets[nombreHojaCosteo];
            const rowsCosteo = XLSX.utils.sheet_to_json(wsCosteo, { header: "A", defval: "" });
            
            if (rowsCosteo.length < 2) {
                alert("Error: La hoja de Costeo Velas parece estar vacía.");
                return;
            }
            
            let nuevosParams = { ...getAppState().config };
            
            // 1. First parse Fragancias sheet if present
            let nuevasFragancias = [...getAppState().fragancias];
            const hojaFraganciasName = wb.SheetNames.find(name => {
                const n = name.toLowerCase();
                return n.includes("fragancia") || n === "hoja1" || n === "aromas";
            });
            
            if (hojaFraganciasName) {
                const wsFrag = wb.Sheets[hojaFraganciasName];
                const rowsFrag = XLSX.utils.sheet_to_json(wsFrag, { header: "A", defval: "" });
                
                let parsedFragancias = [];
                rowsFrag.forEach((r, idx) => {
                    let idVal = parseInt(r["A"]);
                    let nombreFrag = String(r["B"] || "").trim();
                    let costo250 = parseFloat(r["C"]);
                    
                    if (isNaN(costo250) && !isNaN(parseFloat(r["D"]))) {
                        costo250 = parseFloat(r["D"]);
                    }
                    
                    if (nombreFrag !== "" && !isNaN(costo250) && costo250 > 0 && !nombreFrag.toLowerCase().includes("nombre") && !nombreFrag.toLowerCase().includes("fragancia")) {
                        if (isNaN(idVal)) idVal = parsedFragancias.length + 1;
                        parsedFragancias.push({
                            id: idVal,
                            nombre: nombreFrag,
                            costo_250ml: costo250,
                            costo_g: Number((costo250 / 250).toFixed(4))
                        });
                    }
                });
                
                if (parsedFragancias.length > 0) {
                    nuevasFragancias = parsedFragancias;
                }
            }

            // Compute average fragrance cost from catalog
            if (nuevasFragancias.length > 0) {
                const avgFragG = nuevasFragancias.reduce((sum, f) => sum + f.costo_g, 0) / nuevasFragancias.length;
                nuevosParams.costo_fragancia_g = Number(avgFragG.toFixed(4));
            }

            // 2. Parse Costeo parameters from Column L and M
            rowsCosteo.forEach(r => {
                const paramName = String(r["L"] || "").trim().toLowerCase();
                const paramVal = parseFloat(r["M"]);
                
                if (!isNaN(paramVal)) {
                    if (paramName.includes("cera malasia")) {
                        nuevosParams.costo_cera_malasia_g = paramVal;
                        nuevosParams.costo_cera_g = paramVal;
                    } else if (paramName.includes("cera soya") || paramName.includes("soya")) {
                        nuevosParams.costo_cera_soya_g = paramVal;
                    } else if (paramName.includes("fragancia $/g")) {
                        if (paramVal > 0.15) {
                            nuevosParams.costo_fragancia_g = paramVal;
                        }
                    } else if (paramName.includes("% fragancia")) {
                        nuevosParams.pct_fragancia = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("% aditivo")) {
                        nuevosParams.pct_aditivo = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("pabilo")) {
                        nuevosParams.costo_pabilo = paramVal;
                    }
                }
            });
            
            // 3. Parse products
            let nuevosProductos = [];
            let currentProductsList = getAppState().products;
            
            rowsCosteo.forEach(r => {
                const idVal = parseInt(r["A"]);
                const nombreVela = String(r["B"] || "").trim();
                const gramajeTotal = parseFloat(r["C"]);
                let precioVenta = parseFloat(r["J"]);
                
                if (!isNaN(idVal) && nombreVela !== "" && !isNaN(gramajeTotal)) {
                    if (isNaN(precioVenta)) {
                        // Look in DEFAULT_PRODUCTS for known standard price
                        const defMatch = DEFAULT_PRODUCTS.find(dp => dp.id === idVal || dp.nombre.toLowerCase() === nombreVela.toLowerCase());
                        precioVenta = defMatch ? defMatch.precio_venta : 0;
                    }
                    
                    const existingProduct = currentProductsList.find(p => p.id === idVal || p.nombre.toLowerCase() === nombreVela.toLowerCase());
                    const stockConservado = existingProduct ? (parseInt(existingProduct.stock) || 0) : 0;
                    const tipoCera = existingProduct && existingProduct.tipo_cera ? existingProduct.tipo_cera : 'malasia';
                    
                    const calculado = calcularValoresVela(gramajeTotal, precioVenta, { tipoCera }, nuevosParams);
                    
                    nuevosProductos.push({
                        id: idVal,
                        nombre: nombreVela,
                        gramaje: gramajeTotal,
                        precio_venta: precioVenta,
                        stock: stockConservado,
                        tipo_cera: tipoCera,
                        calculado: calculado
                    });
                }
            });
            
            nuevosProductos.sort((a, b) => a.id - b.id);
            
            let nuevosInsumos = { ...getAppState().insumos };
            const hojaInsumosName = wb.SheetNames.find(name => {
                const n = name.toLowerCase();
                return n.includes("insumo") || n.includes("materia");
            });

            if (hojaInsumosName) {
                const wsInsumos = wb.Sheets[hojaInsumosName];
                const rowsInsumos = XLSX.utils.sheet_to_json(wsInsumos, { header: "A", defval: "" });
                
                rowsInsumos.forEach(r => {
                    const concepto = String(r["A"] || "").trim().toLowerCase();
                    const cantG = parseFloat(r["C"]);
                    const cantKg = parseFloat(r["D"]);
                    
                    if (concepto.includes("cera malasia")) {
                        if (!isNaN(cantG)) nuevosInsumos.cera_malasia_g = cantG;
                        else if (!isNaN(cantKg)) nuevosInsumos.cera_malasia_g = cantKg * 1000;
                    } else if (concepto.includes("cera soya") || concepto.includes("cera de soya")) {
                        if (!isNaN(cantG)) nuevosInsumos.cera_soya_g = cantG;
                        else if (!isNaN(cantKg)) nuevosInsumos.cera_soya_g = cantKg * 1000;
                    } else if (concepto.includes("fragancia") || concepto.includes("aroma")) {
                        // find matching fragrance
                        const fragMatch = nuevosInsumos.fragancias.find(f => concepto.includes(f.nombre.toLowerCase()));
                        if (fragMatch) {
                            if (!isNaN(cantG)) fragMatch.total_g = cantG;
                        }
                    }
                });
            }
            
            saveAppState({
                config: nuevosParams,
                products: nuevosProductos,
                fragancias: nuevasFragancias,
                insumos: nuevosInsumos
            });
            
            if (callback) callback(true, { 
                productosCount: nuevosProductos.length, 
                fraganciasCount: nuevasFragancias.length,
                insumosIncluded: !!hojaInsumosName
            });
            
        } catch (error) {
            console.error(error);
            alert("Error al procesar el archivo Excel: " + error.message);
            if (callback) callback(false);
        }
    };
    
    lector.readAsBinaryString(file);
}

// ==========================================================================
// 5. SMART NOTIFICATION BANNER: HIGH-VOLUME ORDERS (> 10 CANDLES)
// ==========================================================================

function verificarAlertasAltoVolumen(state = getAppState()) {
    const bannerContainer = document.getElementById('alerta-alto-volumen-banner');
    if (!bannerContainer) return;
    
    const pendingOrders = (state.orders || []).filter(o => (o.estado || 'pendiente').toLowerCase() === 'pendiente');
    
    let highVolumeOrders = [];
    
    pendingOrders.forEach(order => {
        const totalVelas = (order.items || []).reduce((sum, i) => sum + (parseInt(i.cantidad) || 0), 0);
        if (totalVelas > 10) {
            highVolumeOrders.push({
                ...order,
                total_velas: totalVelas
            });
        }
    });
    
    if (highVolumeOrders.length === 0) {
        bannerContainer.innerHTML = '';
        return;
    }
    
    const itemsListHtml = highVolumeOrders.map(o => `
        <li class="mb-1">
            <strong>Orden #${o.folio || ('PED-' + o.id)}</strong> de <strong>${o.cliente}</strong>: 
            <span class="badge bg-danger text-white fs-6 px-2 py-0 ms-1">${o.total_velas} velas requeridas</span>
            ${o.fecha_entrega ? `• Fecha de entrega programada: <strong class="text-danger text-decoration-underline">${o.fecha_entrega}</strong>` : ''}
        </li>
    `).join('');
    
    bannerContainer.innerHTML = `
        <div class="alert alert-danger shadow-sm border-danger-subtle p-3 mb-4 d-flex align-items-start gap-3" role="alert" style="background-color: #FEF2F2; border-left: 6px solid #DC2626; border-radius: 12px;">
            <div class="rounded-circle p-2 d-flex align-items-center justify-content-center bg-danger text-white flex-shrink-0" style="width: 44px; height: 44px;">
                <i class="bi bi-exclamation-triangle-fill fs-5"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="fw-bold text-danger mb-0 text-uppercase" style="letter-spacing: 0.5px;">
                        ¡Alerta Crítica de Producción: Pedido de Alto Volumen (&gt; 10 Velas)!
                    </h6>
                    <span class="badge bg-danger">${highVolumeOrders.length} Orden(es) Crítica(s)</span>
                </div>
                <p class="small text-dark mb-2">
                    Tienes órdenes pendientes con alto volumen de velas. <strong>Asegúrate de contar con suficiente stock de cera (Malasia/Soya), fragancia y pabilos</strong> en taller para cumplir con la entrega a tiempo:
                </p>
                <ul class="small mb-2 ps-3 text-dark">
                    ${itemsListHtml}
                </ul>
                <div class="d-flex gap-2 mt-2">
                    <a href="pedidos.html" class="btn btn-sm btn-danger rounded-pill px-3 py-1 fw-semibold">
                        <i class="bi bi-box-arrow-up-right me-1"></i> Ir a Gestión de Pedidos
                    </a>
                    <a href="index.html#calc-form" class="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-semibold">
                        <i class="bi bi-calculator me-1"></i> Calcular Insumos en Dashboard
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// 6. PHASE 4: PROFIT & MATERIAL DASHBOARD (CHART.JS BUSINESS INTELLIGENCE)
// ==========================================================================

// Global Chart.js Instances
let chartRentabilidadInstance = null;
let chartComposicionInstance = null;
let chartCapitalInstance = null;

/**
 * Initializes all Business Intelligence Charts & Widgets.
 */
function inicializarGraficosAnalytics(state) {
    if (typeof Chart === 'undefined') return;
    
    // 1. Chart 1: Profitability Bar Chart
    renderizarGraficoRentabilidad(state);
    
    // 2. Leaderboard: Top 5 Highest Margin Candles
    renderizarTop5Rentabilidad(state);
    
    // 3. Chart 2: Cost Structure Breakdown (Doughnut)
    renderizarGraficoComposicionInsumos(state);
    
    // 4. Chart 3: Capital Distribution in Inventory (Bar)
    renderizarGraficoCapitalInventario(state);
    
    // 5. Restock & Material Predictor for Pending Orders
    renderizarPrevisionInsumosPendientes(state);
    
    // 6. Setup Chart Interactive Controls
    configurarControlesGraficoRentabilidad();
}

/**
 * Renders Chart 1: Product Profitability & Margin Comparison.
 */
function renderizarGraficoRentabilidad(state) {
    const canvas = document.getElementById('chart-rentabilidad-productos');
    if (!canvas) return;
    
    const selectCera = document.getElementById('filtro-grafico-cera');
    const selectOrden = document.getElementById('orden-grafico-rentabilidad');
    
    const filtroCera = selectCera ? selectCera.value : 'all';
    const orden = selectOrden ? selectOrden.value : 'margen_desc';
    
    let prods = [...state.products];
    
    // Filter by wax
    if (filtroCera !== 'all') {
        prods = prods.filter(p => (p.tipo_cera || 'malasia') === filtroCera);
    }
    
    // Sort
    if (orden === 'margen_desc') {
        prods.sort((a, b) => b.calculado.porcentaje_margen - a.calculado.porcentaje_margen);
    } else if (orden === 'ganancia_desc') {
        prods.sort((a, b) => b.calculado.ganancia - a.calculado.ganancia);
    } else if (orden === 'precio_desc') {
        prods.sort((a, b) => b.precio_venta - a.precio_venta);
    } else {
        prods.sort((a, b) => a.id - b.id);
    }
    
    const labels = prods.map(p => `#${p.id} ${p.nombre}`);
    const dataCostos = prods.map(p => p.calculado.total_insumos);
    const dataGanancias = prods.map(p => p.calculado.ganancia);
    const dataMargenes = prods.map(p => p.calculado.porcentaje_margen);
    const dataPrecios = prods.map(p => p.precio_venta);
    
    if (chartRentabilidadInstance) {
        chartRentabilidadInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    chartRentabilidadInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Costo Insumos ($)',
                    data: dataCostos,
                    backgroundColor: '#D4A373',
                    borderColor: '#BC8A5A',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Ganancia Neta ($)',
                    data: dataGanancias,
                    backgroundColor: '#2E7D32',
                    borderColor: '#1B5E20',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 14,
                        font: { family: 'Plus Jakarta Sans', size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterTitle: function(context) {
                            const idx = context[0].dataIndex;
                            return `Precio Venta: $${dataPrecios[idx].toFixed(2)} | Margen: ${dataMargenes[idx]}%`;
                        },
                        label: function(context) {
                            return ` ${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => `$${value}`
                    },
                    grid: { color: '#F0ECE4' }
                }
            }
        }
    });
}

/**
 * Renders Top 5 Profit Margin Leaderboard.
 */
function renderizarTop5Rentabilidad(state) {
    const container = document.getElementById('ranking-rentabilidad-container');
    if (!container) return;
    
    let sorted = [...state.products].filter(p => p.precio_venta > 0);
    sorted.sort((a, b) => b.calculado.porcentaje_margen - a.calculado.porcentaje_margen);
    const top5 = sorted.slice(0, 5);
    
    if (top5.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4 small">Sin productos registrados</div>';
        return;
    }
    
    const rankBadges = ['rank-gold', 'rank-silver', 'rank-bronze', 'rank-default', 'rank-default'];
    
    container.innerHTML = top5.map((p, idx) => `
        <div class="bi-rank-card d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
                <span class="rank-badge ${rankBadges[idx]}">${idx + 1}</span>
                <div>
                    <strong class="text-dark d-block" style="font-size: 0.88rem;">${p.nombre}</strong>
                    <small class="text-muted">${p.gramaje}g • P. Venta: <strong>$${p.precio_venta}</strong></small>
                </div>
            </div>
            <div class="text-end">
                <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-6">
                    ${p.calculado.porcentaje_margen}%
                </span>
                <small class="text-success d-block fw-semibold mt-1">+$${p.calculado.ganancia.toFixed(2)}</small>
            </div>
        </div>
    `).join('');
}

/**
 * Renders Chart 2: Cost Structure Breakdown (Doughnut).
 */
function renderizarGraficoComposicionInsumos(state) {
    const canvas = document.getElementById('chart-composicion-insumos');
    if (!canvas) return;
    
    let sumCera = 0;
    let sumFrag = 0;
    let sumAdit = 0;
    let sumPab = 0;
    
    state.products.forEach(p => {
        sumCera += p.calculado.costo_cera;
        sumFrag += p.calculado.costo_fragancia;
        sumAdit += p.calculado.aditivo_g * (state.config.costo_cera_malasia_g || 0.11);
        sumPab += p.calculado.costo_pabilo;
    });
    
    if (chartComposicionInstance) {
        chartComposicionInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    chartComposicionInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cera (Base)', 'Fragancia', 'Aditivos (2%)', 'Pabilos'],
            datasets: [{
                data: [
                    Number(sumCera.toFixed(2)),
                    Number(sumFrag.toFixed(2)),
                    Number(sumAdit.toFixed(2)),
                    Number(sumPab.toFixed(2))
                ],
                backgroundColor: ['#8D5B4C', '#D4A373', '#E9D8A6', '#333D29'],
                borderWidth: 2,
                borderColor: '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11, family: 'Plus Jakarta Sans' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const val = context.parsed;
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${context.label}: $${val.toFixed(2)} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

/**
 * Renders Chart 3: Capital Distribution in Inventory (Bar).
 */
function renderizarGraficoCapitalInventario(state) {
    const canvas = document.getElementById('chart-capital-inventario');
    if (!canvas) return;
    
    let prodsConStock = state.products
        .map(p => ({
            nombre: p.nombre,
            stock: parseInt(p.stock) || 0,
            valor: (parseInt(p.stock) || 0) * p.precio_venta
        }))
        .filter(p => p.stock > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6);
    
    if (prodsConStock.length === 0) {
        prodsConStock = state.products.slice(0, 5).map(p => ({
            nombre: p.nombre,
            stock: 0,
            valor: 0
        }));
    }
    
    if (chartCapitalInstance) {
        chartCapitalInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    chartCapitalInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: prodsConStock.map(p => p.nombre),
            datasets: [{
                label: 'Valor en Stock ($)',
                data: prodsConStock.map(p => p.valor),
                backgroundColor: '#2B78E4',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` Capital almacenado: $${ctx.parsed.x.toFixed(2)} (${prodsConStock[ctx.dataIndex].stock} uds)`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { callback: (v) => `$${v}` },
                    grid: { color: '#F0ECE4' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

/**
 * Restock Predictor: Calculates total raw materials required to fulfill all pending orders.
 */
function renderizarPrevisionInsumosPendientes(state) {
    const container = document.getElementById('prevision-insumos-body');
    const badgeCount = document.getElementById('badge-pedidos-pendientes-count');
    if (!container) return;
    
    const pendingOrders = (state.orders || []).filter(o => (o.estado || 'pendiente').toLowerCase() === 'pendiente');
    
    if (badgeCount) badgeCount.textContent = `${pendingOrders.length} Pendiente(s)`;
    
    if (pendingOrders.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-check-circle-fill text-success fs-3 d-block mb-2"></i>
                <h6 class="fw-semibold mb-1 text-dark">¡Al día con los pedidos!</h6>
                <p class="small text-muted mb-0">No hay órdenes pendientes en cola de fabricación.</p>
            </div>
        `;
        return;
    }
    
    let totalCeraMalasiaG = 0;
    let totalCeraSoyaG = 0;
    let totalFraganciaG = 0;
    let totalAditivoG = 0;
    let totalPabilosUds = 0;
    let totalVelasUds = 0;
    
    pendingOrders.forEach(order => {
        (order.items || []).forEach(item => {
            const prod = state.products.find(p => p.id === item.producto_id);
            const gramaje = prod ? prod.gramaje : (item.gramaje || 50);
            const tipoCera = item.tipo_cera || (prod ? prod.tipo_cera : 'malasia');
            const cant = parseInt(item.cantidad) || 1;
            
            const calc = calcularValoresVela(gramaje, 100, { tipoCera }, state.config);
            
            if (tipoCera === 'soya') {
                totalCeraSoyaG += calc.cera_g * cant;
            } else {
                totalCeraMalasiaG += calc.cera_g * cant;
            }
            
            totalFraganciaG += calc.fragancia_g * cant;
            totalAditivoG += calc.aditivo_g * cant;
            totalPabilosUds += cant;
            totalVelasUds += cant;
        });
    });
    
    const botellasFragancia = (totalFraganciaG / 250).toFixed(1);
    
    container.innerHTML = `
        <div class="restock-alert-box mb-3">
            <div class="fw-bold text-dark mb-2 small text-uppercase">
                <i class="bi bi-box-seam me-1 text-warning"></i>Insumos Requeridos para ${totalVelasUds} Velas:
            </div>
            <ul class="list-unstyled small mb-0">
                <li class="d-flex justify-content-between py-1 border-bottom">
                    <span>• Cera Malasia (Moldes):</span>
                    <strong>${(totalCeraMalasiaG / 1000).toFixed(2)} kg (${totalCeraMalasiaG.toFixed(0)} g)</strong>
                </li>
                ${totalCeraSoyaG > 0 ? `
                    <li class="d-flex justify-content-between py-1 border-bottom">
                        <span>• Cera de Soya (Bouquets):</span>
                        <strong>${(totalCeraSoyaG / 1000).toFixed(2)} kg (${totalCeraSoyaG.toFixed(0)} g)</strong>
                    </li>
                ` : ''}
                <li class="d-flex justify-content-between py-1 border-bottom">
                    <span>• Fragancia Concentrada:</span>
                    <strong>${totalFraganciaG.toFixed(0)} g (~${botellasFragancia} botellas 250ml)</strong>
                </li>
                <li class="d-flex justify-content-between py-1 border-bottom">
                    <span>• Aditivo de Cera (2%):</span>
                    <strong>${totalAditivoG.toFixed(0)} g</strong>
                </li>
                <li class="d-flex justify-content-between py-1">
                    <span>• Pabilos con Base:</span>
                    <strong>${totalPabilosUds} unidades</strong>
                </li>
            </ul>
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill w-100 py-2 fw-semibold" onclick="cargarInsumosPendientesEnCalculadora()">
            <i class="bi bi-calculator me-1"></i> Cargar Lote en Calculadora de Fabricación
        </button>
    `;
}

/**
 * Loads pending orders directly into the Material Calculator.
 */
window.cargarInsumosPendientesEnCalculadora = function() {
    const state = getAppState();
    const pendingOrders = (state.orders || []).filter(o => (o.estado || 'pendiente').toLowerCase() === 'pendiente');
    
    if (pendingOrders.length === 0) {
        alert("No hay pedidos pendientes para cargar.");
        return;
    }
    
    calculadoraListaGlobal = [];
    
    pendingOrders.forEach(order => {
        (order.items || []).forEach(item => {
            const prod = state.products.find(p => p.id === item.producto_id);
            if (!prod) return;
            
            const fragObj = state.fragancias.find(f => f.nombre === item.fragancia) || state.fragancias[0];
            const tipoCera = item.tipo_cera || 'malasia';
            
            const batchCalculated = calcularValoresVela(
                prod.gramaje,
                prod.precio_venta,
                { tipoCera: tipoCera, pctFragancia: 0.08, costoFraganciaG: fragObj.costo_g },
                state.config
            );
            
            calculadoraListaGlobal.push({
                product: prod,
                tipoCera: tipoCera,
                pctFrag: 0.08,
                fragancia: fragObj,
                cantidad: parseInt(item.cantidad) || 1,
                calculado: batchCalculated
            });
        });
    });
    
    configurarCalculadoraMateriales(state.products, state.fragancias, state.config);
    
    // Scroll smoothly to the calculator
    const calcSection = document.getElementById('calc-form');
    if (calcSection) {
        calcSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    alert(`¡Se han cargado ${calculadoraListaGlobal.length} partidas de tus pedidos pendientes a la Calculadora de Insumos!`);
};

function configurarControlesGraficoRentabilidad() {
    const selectCera = document.getElementById('filtro-grafico-cera');
    const selectOrden = document.getElementById('orden-grafico-rentabilidad');
    
    if (selectCera) {
        selectCera.addEventListener('change', () => {
            renderizarGraficoRentabilidad(getAppState());
        });
    }
    if (selectOrden) {
        selectOrden.addEventListener('change', () => {
            renderizarGraficoRentabilidad(getAppState());
        });
    }
}

// ==========================================================================
// 7. INTERACTIVE DASHBOARD VIEWS (HTML DRIVERS)
// ==========================================================================

function inicializarDashboard() {
    const state = getAppState();
    
    // 1. High-Volume Notification Banner
    verificarAlertasAltoVolumen(state);
    
    // 2. Initialize Chart.js Business Intelligence Analytics
    inicializarGraficosAnalytics(state);
    
    const kpiCantProductos = document.getElementById('kpi-cant-productos');
    if (!kpiCantProductos) return;
    
    // --- Metric 1: Total Product Catalog Size ---
    kpiCantProductos.textContent = state.products.length;
    
    // --- Metric 2: Average Profit Margin ---
    let sumaMargen = 0;
    let cantVelasValidas = 0;
    state.products.forEach(p => {
        if (p.precio_venta > 0) {
            sumaMargen += p.calculado.porcentaje_margen;
            cantVelasValidas++;
        }
    });
    const avgMargen = cantVelasValidas > 0 ? (sumaMargen / cantVelasValidas).toFixed(1) : "0";
    document.getElementById('kpi-margen-promedio').textContent = `${avgMargen}%`;
    
    // --- Metric 3: Global Stock Assets ---
    let totalStock = 0;
    let valorVentaInventario = 0;
    let totalAlertas = 0;
    
    state.products.forEach(p => {
        const s = parseInt(p.stock) || 0;
        totalStock += s;
        valorVentaInventario += s * p.precio_venta;
        if (s < 5 && s > 0) totalAlertas++;
    });
    
    document.getElementById('kpi-total-inventario').textContent = `${totalStock} uds`;
    document.getElementById('kpi-valor-inventario').textContent = `$${valorVentaInventario.toLocaleString()}`;
    
    const alertaStockBanner = document.getElementById('alerta-stock-banner');
    if (alertaStockBanner) {
        if (totalAlertas > 0) {
            alertaStockBanner.innerHTML = `
                <div class="alert alert-warning d-flex align-items-center mb-4" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                    <div>
                        ¡Atención! Tienes <strong>${totalAlertas} producto(s)</strong> con nivel de stock crítico (menor a 5 unidades). 
                        <a href="inventario.html" class="alert-link text-decoration-underline ms-1">Ver Stock de Inventario</a>.
                    </div>
                </div>
            `;
        } else {
            alertaStockBanner.innerHTML = '';
        }
    }
    
    renderParametrosCard(state.config, state.fragancias);
    configurarCalculadoraMateriales(state.products, state.fragancias, state.config);
}

function renderParametrosCard(config, fragancias) {
    const ceraMalasiaVal = document.getElementById('param-costo-cera-malasia');
    const ceraSoyaVal = document.getElementById('param-costo-cera-soya');
    const cantFragVal = document.getElementById('param-cant-fragancias');
    const pctFragVal = document.getElementById('param-pct-frag');
    const pctAdiVal = document.getElementById('param-pct-adit');
    const pabiloVal = document.getElementById('param-costo-pab');
    
    if (ceraMalasiaVal) ceraMalasiaVal.textContent = `$${(config.costo_cera_malasia_g || 0.11).toFixed(2)} / g`;
    if (ceraSoyaVal) ceraSoyaVal.textContent = `$${(config.costo_cera_soya_g || 0.14).toFixed(2)} / g`;
    if (cantFragVal) cantFragVal.textContent = `${fragancias ? fragancias.length : 0} aromas disponibles`;
    if (pctFragVal) pctFragVal.textContent = `${((config.pct_fragancia || 0.08) * 100).toFixed(0)}% (rango 6%-10%)`;
    if (pctAdiVal) pctAdiVal.textContent = `${((config.pct_aditivo || 0.02) * 100).toFixed(0)}%`;
    if (pabiloVal) pabiloVal.textContent = `$${(config.costo_pabilo || 0.50).toFixed(2)} / ud`;
}

let calculadoraListaGlobal = [];

function configurarCalculadoraMateriales(products, fragancias, config) {
    const form = document.getElementById('calc-form');
    if (!form) return;
    
    const selectVela = document.getElementById('calc-vela-select');
    const selectCera = document.getElementById('calc-cera-select');
    const selectPctFrag = document.getElementById('calc-pct-frag-select');
    const selectFragancia = document.getElementById('calc-fragancia-select');
    const inputCant = document.getElementById('calc-cantidad');
    const btnAgregar = document.getElementById('btn-calc-agregar');
    const itemsList = document.getElementById('calc-items-list');
    
    const outCera = document.getElementById('out-total-cera');
    const outFrag = document.getElementById('out-total-frag');
    const outAdit = document.getElementById('out-total-adit');
    const outPab = document.getElementById('out-total-pab');
    const outCosto = document.getElementById('out-costo-total');
    
    selectVela.innerHTML = '<option value="" disabled selected>-- Selecciona un molde --</option>';
    const sortedProds = [...products].sort((a, b) => a.id - b.id);
    sortedProds.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `#${p.id} - ${p.nombre} (${p.gramaje}g)`;
        selectVela.appendChild(option);
    });
    
    selectFragancia.innerHTML = '<option value="" disabled selected>-- Selecciona una fragancia --</option>';
    fragancias.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = `${f.nombre} ($${f.costo_250ml}/250ml → $${f.costo_g.toFixed(2)}/g)`;
        selectFragancia.appendChild(option);
    });
    
    // Inicializar Select2 con tema Bootstrap 5
    if ($.fn.select2) {
        $(selectVela).select2({ theme: 'bootstrap-5' });
    }
    
    btnAgregar.addEventListener('click', () => {
        const prodId = parseInt(selectVela.value);
        const tipoCera = selectCera.value || 'malasia';
        const pctFrag = parseFloat(selectPctFrag.value);
        const fragId = parseInt(selectFragancia.value);
        const cant = parseInt(inputCant.value);
        
        if (isNaN(prodId)) {
            alert("Por favor selecciona un molde/vela.");
            return;
        }
        if (isNaN(fragId)) {
            alert("Por favor selecciona una fragancia del catálogo.");
            return;
        }
        if (isNaN(cant) || cant <= 0) {
            alert("Por favor ingresa una cantidad válida (mayor a 0).");
            return;
        }
        
        const prodObj = products.find(p => p.id === prodId);
        const fragObj = fragancias.find(f => f.id === fragId);
        
        const batchCalculated = calcularValoresVela(
            prodObj.gramaje,
            prodObj.precio_venta,
            {
                tipoCera: tipoCera,
                pctFragancia: pctFrag,
                costoFraganciaG: fragObj.costo_g
            },
            config
        );
        
        calculadoraListaGlobal.push({
            product: prodObj,
            tipoCera: tipoCera,
            pctFrag: pctFrag,
            fragancia: fragObj,
            cantidad: cant,
            calculado: batchCalculated
        });
        
        selectVela.value = "";
        selectFragancia.value = "";
        inputCant.value = "1";
        
        actualizarListaCalculator();
    });
    
    function actualizarListaCalculator() {
        itemsList.innerHTML = '';
        
        if (calculadoraListaGlobal.length === 0) {
            itemsList.innerHTML = '<li class="list-group-item text-center text-muted small py-3">Ningún molde agregado al plan</li>';
            outCera.textContent = '0 g';
            outFrag.textContent = '0 g';
            outAdit.textContent = '0 g';
            outPab.textContent = '0 uds';
            outCosto.textContent = '$0.00';
            return;
        }
        
        let sumCera = 0;
        let sumFrag = 0;
        let sumAdit = 0;
        let sumPab = 0;
        let sumCosto = 0;
        
        calculadoraListaGlobal.forEach((item, idx) => {
            const p = item.product;
            const q = item.cantidad;
            const calc = item.calculado;
            const nombreCera = item.tipoCera === 'soya' ? 'Cera Soya' : 'Cera Malasia';
            
            const itemCera = calc.cera_g * q;
            const itemFrag = calc.fragancia_g * q;
            const itemAdit = calc.aditivo_g * q;
            const itemPab = q;
            const itemCosto = calc.total_insumos * q;
            
            sumCera += itemCera;
            sumFrag += itemFrag;
            sumAdit += itemAdit;
            sumPab += itemPab;
            sumCosto += itemCosto;
            
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-light border-0 mb-2 rounded shadow-sm p-3";
            li.innerHTML = `
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <strong>${q}x ${p.nombre}</strong>
                        <span class="badge ${item.tipoCera === 'soya' ? 'bg-success' : 'bg-secondary'}" style="font-size: 0.7rem;">${nombreCera}</span>
                        <span class="badge bg-warning text-dark" style="font-size: 0.7rem;">${(item.pctFrag * 100).toFixed(0)}% Fragancia</span>
                    </div>
                    <div class="text-muted small" style="font-size: 0.8rem;">
                        <i class="bi bi-droplet-fill text-warning me-1"></i>Aroma: <strong>${item.fragancia.nombre}</strong>
                    </div>
                    <div class="text-muted mt-1" style="font-size: 0.78rem;">
                        Cera: <strong>${itemCera.toFixed(1)}g</strong> | Fragancia: <strong>${itemFrag.toFixed(1)}g</strong> | Costo Insumos: <strong>$${itemCosto.toFixed(2)}</strong> | Precio Venta: <strong>$${(p.precio_venta * q).toFixed(2)}</strong>
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger border-0 rounded-circle ms-2" onclick="eliminarItemCalculadora(${idx})" title="Eliminar del lote">
                    <i class="bi bi-trash-fill"></i>
                </button>
            `;
            itemsList.appendChild(li);
        });
        
        outCera.textContent = `${sumCera.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} g`;
        outFrag.textContent = `${sumFrag.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} g`;
        outAdit.textContent = `${sumAdit.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} g`;
        outPab.textContent = `${sumPab} uds`;
        outCosto.textContent = `$${sumCosto.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    actualizarListaCalculator();
    
    window.eliminarItemCalculadora = function(index) {
        calculadoraListaGlobal.splice(index, 1);
        actualizarListaCalculator();
    };
    
    const btnCrearCotizacionCalc = document.getElementById('btn-crear-cotizacion-calc');
    if (btnCrearCotizacionCalc) {
        btnCrearCotizacionCalc.onclick = () => {
            if (calculadoraListaGlobal.length === 0) {
                alert("Primero debes agregar al menos una vela a la calculadora de fabricación para generar la cotización.");
                return;
            }
            abrirModalCrearCotizacionDesdeCalc();
        };
    }
}

function abrirModalCrearCotizacionDesdeCalc() {
    const listContainer = document.getElementById('cotizacion-items-preview');
    const totalPreview = document.getElementById('cotizacion-total-preview');
    
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    let totalVenta = 0;
    
    calculadoraListaGlobal.forEach(item => {
        const subtotal = item.product.precio_venta * item.cantidad;
        totalVenta += subtotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.cantidad}x</strong> ${item.product.nombre}</td>
            <td>${item.tipoCera === 'soya' ? 'Cera Soya' : 'Cera Malasia'}</td>
            <td>${item.fragancia.nombre}</td>
            <td class="text-end">$${item.product.precio_venta.toFixed(2)}</td>
            <td class="text-end fw-bold text-dark">$${subtotal.toFixed(2)}</td>
        `;
        listContainer.appendChild(tr);
    });
    
    totalPreview.textContent = `$${totalVenta.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const modalEl = document.getElementById('modalCrearCotizacion');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

window.guardarCotizacionActual = function() {
    const cliente = document.getElementById('cotizacion-cliente-nombre').value.trim();
    const telefono = document.getElementById('cotizacion-cliente-tel').value.trim();
    const notas = document.getElementById('cotizacion-cliente-notas').value.trim();
    
    if (!cliente) {
        alert("Por favor ingresa el nombre del cliente para la cotización.");
        return;
    }
    if (calculadoraListaGlobal.length === 0) {
        alert("No hay artículos en la cotización.");
        return;
    }
    
    const state = getAppState();
    const quotes = state.quotes || [];
    
    const maxId = quotes.reduce((max, q) => q.id > max ? q.id : max, 0);
    const newId = maxId + 1;
    const folioStr = `COT-${String(newId).padStart(3, '0')}`;
    
    let totalVenta = 0;
    let totalCosto = 0;
    
    const quoteItems = calculadoraListaGlobal.map(item => {
        const subtotal = item.product.precio_venta * item.cantidad;
        const subtotalCosto = item.calculado.total_insumos * item.cantidad;
        totalVenta += subtotal;
        totalCosto += subtotalCosto;
        
        return {
            producto_id: item.product.id,
            nombre: item.product.nombre,
            gramaje: item.product.gramaje,
            tipo_cera: item.tipoCera,
            fragancia: item.fragancia.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.product.precio_venta,
            costo_unitario: item.calculado.total_insumos,
            subtotal: subtotal,
            costo_subtotal: subtotalCosto
        };
    });
    
    const fechaStr = new Date().toISOString().slice(0, 10);
    
    const nuevaCotizacion = {
        id: newId,
        folio: folioStr,
        fecha: fechaStr,
        cliente: cliente,
        telefono: telefono,
        notas: notas || 'Vigencia de cotización: 15 días naturales.',
        items: quoteItems,
        total: totalVenta,
        costo_total: totalCosto,
        ganancia_total: totalVenta - totalCosto
    };
    
    quotes.unshift(nuevaCotizacion);
    saveAppState({ quotes: quotes });
    
    document.getElementById('cotizacion-cliente-nombre').value = '';
    document.getElementById('cotizacion-cliente-tel').value = '';
    document.getElementById('cotizacion-cliente-notas').value = '';
    
    const modalCrearEl = document.getElementById('modalCrearCotizacion');
    const modalCrearInstance = bootstrap.Modal.getInstance(modalCrearEl);
    if (modalCrearInstance) modalCrearInstance.hide();
    
    setTimeout(() => {
        verCotizacionCliente(newId);
    }, 400);
};

window.verCotizacionCliente = function(quoteId) {
    const state = getAppState();
    const quote = (state.quotes || []).find(q => q.id === quoteId);
    if (!quote) return;
    
    const body = document.getElementById('modal-cotizacion-cliente-body');
    const footer = document.getElementById('modal-cotizacion-cliente-footer');
    if (!body) return;
    
    const fechaLimpia = (quote.fecha || '').slice(0, 10);
    
    let itemsRows = (quote.items || []).map((i, idx) => `
        <tr>
            <td class="text-center text-muted">${idx + 1}</td>
            <td>
                <strong>${i.nombre}</strong>
                <span class="badge ${i.tipo_cera === 'soya' ? 'bg-success' : 'bg-secondary'} ms-1" style="font-size: 0.7rem;">${i.tipo_cera === 'soya' ? 'Cera Soya' : 'Cera Malasia'}</span>
                <div class="text-muted small">Aroma: ${i.fragancia}</div>
            </td>
            <td class="text-center fw-bold">${i.cantidad}</td>
            <td class="text-end">$${parseFloat(i.precio_unitario).toFixed(2)}</td>
            <td class="text-end fw-bold text-dark">$${parseFloat(i.subtotal).toFixed(2)}</td>
        </tr>
    `).join('');
    
    const cleanTel = (quote.telefono || '').replace(/\D/g, '');
    
    let waMsg = `*COTIZACIÓN VELISIMA #${quote.folio}*\n`;
    waMsg += `Cliente: ${quote.cliente}\n`;
    waMsg += `Fecha: ${fechaLimpia}\n\n`;
    waMsg += `*Detalle de Productos:*\n`;
    quote.items.forEach(i => {
        waMsg += `• ${i.cantidad}x ${i.nombre} (${i.tipo_cera === 'soya' ? 'Cera Soya' : 'Cera Malasia'}, ${i.fragancia}) - $${i.precio_unitario.toFixed(2)} c/u = $${i.subtotal.toFixed(2)}\n`;
    });
    waMsg += `\n*TOTAL:* $${parseFloat(quote.total).toFixed(2)} MXN\n`;
    if (quote.notas) waMsg += `Notas: ${quote.notas}\n`;
    waMsg += `\n¡Gracias por tu preferencia! ✨`;
    
    const waLink = `https://wa.me/52${cleanTel}?text=${encodeURIComponent(waMsg)}`;
    
    body.innerHTML = `
        <div class="p-3 bg-white border rounded shadow-sm printable-quote-area">
            <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                <div>
                    <h4 class="fw-bold mb-0" style="color: var(--primary-color);">
                        <i class="bi bi-fire text-warning me-1"></i>VELISIMA
                    </h4>
                    <span class="text-muted small">Velas Artesanales & Recuerdos</span>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary-custom px-3 py-2 fs-6">COTIZACIÓN</span>
                    <div class="fw-bold text-dark mt-1">#${quote.folio}</div>
                    <small class="text-muted d-block">${fechaLimpia}</small>
                </div>
            </div>

            <div class="row g-2 mb-3 small">
                <div class="col-sm-6">
                    <div class="p-2 bg-light rounded">
                        <span class="text-muted text-uppercase d-block fw-semibold" style="font-size: 0.7rem;">Cliente:</span>
                        <strong class="fs-6 text-dark">${quote.cliente}</strong>
                    </div>
                </div>
                <div class="col-sm-6">
                    <div class="p-2 bg-light rounded">
                        <span class="text-muted text-uppercase d-block fw-semibold" style="font-size: 0.7rem;">Contacto:</span>
                        <strong class="fs-6 text-dark">${quote.telefono || 'Sin teléfono registrado'}</strong>
                    </div>
                </div>
            </div>

            <div class="table-responsive mb-3">
                <table class="table table-bordered align-middle mb-0">
                    <thead class="table-light small text-muted text-uppercase">
                        <tr>
                            <th style="width: 5%;" class="text-center">#</th>
                            <th style="width: 50%;">Descripción / Molde</th>
                            <th style="width: 12%;" class="text-center">Cant</th>
                            <th style="width: 15%;" class="text-end">Precio Unit</th>
                            <th style="width: 18%;" class="text-end">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                    <tfoot class="table-light">
                        <tr>
                            <td colspan="4" class="text-end fw-bold fs-6">TOTAL COTIZADO:</td>
                            <td class="text-end fw-bold text-dark fs-5" style="color: var(--primary-color) !important;">
                                $${parseFloat(quote.total).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="p-3 bg-light rounded border small text-muted">
                <div class="fw-bold text-dark mb-1"><i class="bi bi-card-text me-1"></i>Términos y Notas:</div>
                <div>${quote.notas || 'Vigencia de precios por 15 días naturales. Se requiere el 50% de anticipo para programar fabricación.'}</div>
            </div>
        </div>
    `;
    
    footer.innerHTML = `
        <button type="button" class="btn btn-outline-secondary rounded-pill px-3" data-bs-dismiss="modal">Cerrar</button>
        <button type="button" class="btn btn-outline-dark rounded-pill px-3" onclick="window.print()">
            <i class="bi bi-printer me-1"></i> Imprimir
        </button>
        ${cleanTel ? `
            <a href="${waLink}" target="_blank" class="btn btn-whatsapp rounded-pill px-3">
                <i class="bi bi-whatsapp me-1"></i> Enviar por WhatsApp
            </a>
        ` : ''}
        <button type="button" class="btn btn-success rounded-pill px-3" onclick="aprobarCotizacionGlobal(${quote.id})">
            <i class="bi bi-check2-circle me-1"></i> Aprobar Pedido
        </button>
    `;
    
    const modalEl = document.getElementById('modalVerCotizacionCliente');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

window.aprobarCotizacionGlobal = function(quoteId) {
    const state = getAppState();
    const quote = (state.quotes || []).find(q => q.id === quoteId);
    if (!quote) return;
    
    if (confirm(`¿Deseas aprobar la cotización #${quote.folio} de "${quote.cliente}" y convertirla en un Pedido Oficial?`)) {
        const orders = state.orders || [];
        const maxOrderId = orders.reduce((max, o) => o.id > max ? o.id : max, 0);
        const newOrderId = maxOrderId + 1;
        const orderFolioStr = `PED-${String(newOrderId).padStart(3, '0')}`;
        
        const fechaStr = new Date().toISOString().slice(0, 10);
        
        const nuevoPedido = {
            id: newOrderId,
            folio: orderFolioStr,
            fecha: fechaStr,
            fecha_entrega: '',
            cliente: quote.cliente,
            telefono: quote.telefono,
            notas: `Generado a partir de cotización #${quote.folio}. ${quote.notas || ''}`.trim(),
            items: [...quote.items],
            total: quote.total,
            costo_total: quote.costo_total,
            ganancia_total: quote.ganancia_total,
            estado: 'pendiente',
            stock_descontado: false
        };
        
        orders.unshift(nuevoPedido);
        state.quotes = state.quotes.filter(q => q.id !== quoteId);
        
        saveAppState({
            orders: orders,
            quotes: state.quotes
        });
        
        const modalEl = document.getElementById('modalVerCotizacionCliente');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        
        alert(`¡Excelente! Cotización #${quote.folio} convertida exitosamente en el Pedido Oficial #${orderFolioStr}.`);
        
        if (typeof recargarVistaPedidos === 'function') {
            recargarVistaPedidos(state);
        }
        
        verificarAlertasAltoVolumen(state);
        inicializarGraficosAnalytics(state);
    }
};

// ==========================================================================
// 8. DRAG AND DROP / FILE SELECT HANDLERS
// ==========================================================================

function configurarCargaExcel() {
    const inputExcel = document.getElementById('excel-file-input');
    const contenedorCarga = document.getElementById('excel-upload-zone');
    
    if (!contenedorCarga || !inputExcel) return;
    
    contenedorCarga.addEventListener('click', () => {
        inputExcel.click();
    });
    
    contenedorCarga.addEventListener('dragover', (e) => {
        e.preventDefault();
        contenedorCarga.style.borderColor = "var(--primary-color)";
        contenedorCarga.style.backgroundColor = "#F5EFEB";
    });
    
    contenedorCarga.addEventListener('dragleave', () => {
        contenedorCarga.style.borderColor = "var(--secondary-color)";
        contenedorCarga.style.backgroundColor = "#FCF9F3";
    });
    
    contenedorCarga.addEventListener('drop', (e) => {
        e.preventDefault();
        contenedorCarga.style.borderColor = "var(--secondary-color)";
        contenedorCarga.style.backgroundColor = "#FCF9F3";
        
        const archivos = e.dataTransfer.files;
        if (archivos.length > 0) {
            procesarArchivoSeleccionado(archivos[0]);
        }
    });
    
    inputExcel.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            procesarArchivoSeleccionado(e.target.files[0]);
        }
    });
}

function procesarArchivoSeleccionado(archivo) {
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
        alert("Archivo no admitido. Por favor carga un archivo de tipo Excel (.xlsx o .xls)");
        return;
    }
    
    importarExcelData(archivo, (exito, stats) => {
        if (exito) {
            let msg = `¡Excelente! Se han importado ${stats.productosCount} productos`;
            if (stats.fraganciasCount) {
                msg += ` y ${stats.fraganciasCount} fragancias con sus costos por 250ml.`;
            } else {
                msg += `.`;
            }
            alert(msg);
            inicializarDashboard();
        }
    });
}

// ==========================================================================
// 9. INITIALIZATION (BOOT SEQUENCE)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseStateReady) {
        window.firebaseStateReady.then(iniciarAplicacion);
    } else {
        iniciarAplicacion();
    }
    
    function iniciarAplicacion() {
        getAppState();
        inicializarDashboard();
        configurarCargaExcel();
        verificarAlertasAltoVolumen();
        
        const btnReset = document.getElementById('btn-reset-app');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm("¿Estás seguro de que deseas restablecer la aplicación? Esto borrará tus niveles de stock, órdenes y cotizaciones registradas.")) {
                    resetAppState();
                }
            });
        }
    }
    
    // Escuchar actualizaciones en tiempo real si hay
    window.addEventListener('firebaseUpdate', () => {
        getAppState();
        inicializarDashboard();
    });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
