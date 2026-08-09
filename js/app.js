/**
 * VELISIMA - Candle Inventory & Cost Control
 * Main Application Logic (Core Controller & State Management)
 * 
 * To help an Electronic Engineer understand:
 * - This file acts like the MAIN MICROCONTROLLER program.
 * - LocalStorage is our EEPROM (Non-volatile memory where we store state between reboots/page refreshes).
 * - "State" refers to the current values of our registers:
 *   [Config Parameters, Wax Types, Fragrance Catalog, Products, Orders, Quotes].
 */

// ==========================================================================
// 1. DEFAULT DATA CONFIGURATION (ROM BACKUP)
// ==========================================================================

const DEFAULT_CONFIG = {
    tipo_cera_default: 'malasia', // 'malasia' or 'soya'
    costo_cera_malasia_g: 0.11,    // Cost of Malasia wax ($/g) - Used in all current molds
    costo_cera_soya_g: 0.14,       // Cost of Soy wax ($/g) - For upcoming bouquet arrangements
    costo_cera_g: 0.11,            // Active default wax cost ($/g)
    costo_fragancia_g: 0.70,       // Default fragrance $/g ($175 / 250ml)
    pct_fragancia: 0.08,           // Default fragrance percentage (8%)
    pct_aditivo: 0.02,             // Additive percentage (2%)
    costo_pabilo: 0.50             // Fixed cost per wick (pabilo)
};

const DEFAULT_FRAGRANCIAS = [
    { id: 1, nombre: "Vainilla Francesa", costo_250ml: 175.00, costo_g: 0.70 },
    { id: 2, nombre: "Lavanda Silvestre", costo_250ml: 185.00, costo_g: 0.74 },
    { id: 3, nombre: "Canela & Manzana", costo_250ml: 165.00, costo_g: 0.66 },
    { id: 4, nombre: "Café Espresso", costo_250ml: 190.00, costo_g: 0.76 },
    { id: 5, nombre: "Coco & Vainilla", costo_250ml: 170.00, costo_g: 0.68 },
    { id: 6, nombre: "Sándalo & Ámbar", costo_250ml: 210.00, costo_g: 0.84 },
    { id: 7, nombre: "Eucalipto & Menta", costo_250ml: 175.00, costo_g: 0.70 },
    { id: 8, nombre: "Cítricos & Bergamota", costo_250ml: 180.00, costo_g: 0.72 }
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
    { id: 28, nombre: "Venus", gramaje: 50, precio_venta: 55, stock: 0, tipo_cera: 'malasia' }
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
        : (config.costo_cera_malasia_g || config.costo_cera_g || 0.11);
        
    const costoFraganciaUnitario = opciones.costoFraganciaG !== undefined 
        ? opciones.costoFraganciaG 
        : config.costo_fragancia_g;

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
    let config = localStorage.getItem('velisima_config');
    let fragancias = localStorage.getItem('velisima_fragancias');
    let products = localStorage.getItem('velisima_products');
    let orders = localStorage.getItem('velisima_orders');
    let quotes = localStorage.getItem('velisima_quotes');

    // 1. Config register
    if (!config) {
        config = { ...DEFAULT_CONFIG };
        localStorage.setItem('velisima_config', JSON.stringify(config));
    } else {
        config = JSON.parse(config);
        if (!config.costo_cera_malasia_g) config.costo_cera_malasia_g = DEFAULT_CONFIG.costo_cera_malasia_g;
        if (!config.costo_cera_soya_g) config.costo_cera_soya_g = DEFAULT_CONFIG.costo_cera_soya_g;
    }

    // 2. Fragrances register
    if (!fragancias) {
        fragancias = [...DEFAULT_FRAGRANCIAS];
        localStorage.setItem('velisima_fragancias', JSON.stringify(fragancias));
    } else {
        fragancias = JSON.parse(fragancias);
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
        
        products = products.map(p => {
            const idNum = parseInt(p.id);
            const tipoCera = p.tipo_cera || 'malasia';
            const stockNum = parseInt(p.stock) || 0;
            const gramajeNum = parseFloat(p.gramaje);
            const precioNum = parseFloat(p.precio_venta);
            
            if (!p.tipo_cera || p.id !== idNum) {
                needsResave = true;
            }
            
            const calculado = p.calculado || calcularValoresVela(gramajeNum, precioNum, { tipoCera }, config);
            
            return {
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
        
        if (needsResave) {
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

    return { config, fragancias, products, orders, quotes };
}

function saveAppState(state) {
    if (state.config) localStorage.setItem('velisima_config', JSON.stringify(state.config));
    if (state.fragancias) localStorage.setItem('velisima_fragancias', JSON.stringify(state.fragancias));
    if (state.products) {
        state.products.sort((a, b) => a.id - b.id);
        localStorage.setItem('velisima_products', JSON.stringify(state.products));
    }
    if (state.orders) localStorage.setItem('velisima_orders', JSON.stringify(state.orders));
    if (state.quotes) localStorage.setItem('velisima_quotes', JSON.stringify(state.quotes));
}

function resetAppState() {
    localStorage.removeItem('velisima_config');
    localStorage.removeItem('velisima_fragancias');
    localStorage.removeItem('velisima_products');
    localStorage.removeItem('velisima_orders');
    localStorage.removeItem('velisima_quotes');
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
            
            rowsCosteo.forEach(r => {
                const paramName = String(r["L"] || "").trim().toLowerCase();
                const paramVal = parseFloat(r["M"]);
                
                if (!isNaN(paramVal)) {
                    if (paramName.includes("cera malasia")) {
                        nuevosParams.costo_cera_malasia_g = paramVal;
                        nuevosParams.costo_cera_g = paramVal;
                    } else if (paramName.includes("cera soya") || paramName.includes("soya")) {
                        nuevosParams.costo_cera_soya_g = paramVal;
                    } else if (paramName.includes("cera $/g") || paramName.includes("cera")) {
                        nuevosParams.costo_cera_malasia_g = paramVal;
                        nuevosParams.costo_cera_g = paramVal;
                    } else if (paramName.includes("fragancia $/g") || paramName.includes("fragancia")) {
                        nuevosParams.costo_fragancia_g = paramVal;
                    } else if (paramName.includes("% fragancia")) {
                        nuevosParams.pct_fragancia = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("% aditivo")) {
                        nuevosParams.pct_aditivo = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("pabilo")) {
                        nuevosParams.costo_pabilo = paramVal;
                    }
                }
            });
            
            let nuevosProductos = [];
            let currentProductsList = getAppState().products;
            
            rowsCosteo.forEach(r => {
                const idVal = parseInt(r["A"]);
                const nombreVela = String(r["B"] || "").trim();
                const gramajeTotal = parseFloat(r["C"]);
                let precioVenta = parseFloat(r["J"]);
                
                if (!isNaN(idVal) && nombreVela !== "" && !isNaN(gramajeTotal)) {
                    if (isNaN(precioVenta)) precioVenta = 0;
                    
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
            
            saveAppState({
                config: nuevosParams,
                products: nuevosProductos,
                fragancias: nuevasFragancias
            });
            
            if (callback) callback(true, { productosCount: nuevosProductos.length, fraganciasCount: nuevasFragancias.length });
            
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

/**
 * Checks all pending orders for high-volume batches (> 10 candles total).
 * Displays a prominent alert banner at the top of the interface.
 */
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
// 6. INTERACTIVE DASHBOARD VIEWS (HTML DRIVERS)
// ==========================================================================

function inicializarDashboard() {
    const state = getAppState();
    
    // Check High-Volume Notification Banner on all pages
    verificarAlertasAltoVolumen(state);
    
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
    
    calculadoraListaGlobal = [];
    
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
    
    window.eliminarItemCalculadora = function(index) {
        calculadoraListaGlobal.splice(index, 1);
        actualizarListaCalculator();
    };
    
    const btnCrearCotizacionCalc = document.getElementById('btn-crear-cotizacion-calc');
    if (btnCrearCotizacionCalc) {
        btnCrearCotizacionCalc.addEventListener('click', () => {
            if (calculadoraListaGlobal.length === 0) {
                alert("Primero debes agregar al menos una vela a la calculadora de fabricación para generar la cotización.");
                return;
            }
            abrirModalCrearCotizacionDesdeCalc();
        });
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
            fecha_entrega: '', // Can be scheduled
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
    }
};

// ==========================================================================
// 7. DRAG AND DROP / FILE SELECT HANDLERS
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
// 8. INITIALIZATION (BOOT SEQUENCE)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
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
});
