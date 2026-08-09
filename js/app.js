/**
 * VELISIMA - Candle Inventory & Cost Control
 * Main Application Logic (Core Controller & State Management)
 * 
 * To help an Electronic Engineer understand:
 * - This file acts like the MAIN MICROCONTROLLER program.
 * - LocalStorage is our EEPROM (Non-volatile memory where we store state between reboots/page refreshes).
 * - "State" refers to the current values of our registers (Config Parameters, Product Database, Orders).
 */

// ==========================================
// 1. DEFAULT DATA CONFIGURATION (ROM BACKUP)
// ==========================================

// Default configuration parameters (coefficients used in formulas)
const DEFAULT_CONFIG = {
    costo_cera_g: 0.11,         // Cost of wax in $/g
    costo_fragancia_g: 0.70,    // Cost of fragrance in $/g
    pct_fragancia: 0.08,        // Fragrance percentage (8%)
    pct_aditivo: 0.02,          // Additive percentage (2%)
    costo_pabilo: 0.50          // Fixed cost per wick (pabilo)
};

// Default product database (the 28 original products parsed from Costeo_Velas.xlsx)
const DEFAULT_PRODUCTS = [
    { id: 1, nombre: "Sagrada Fam", gramaje: 85, precio_venta: 110, stock: 15 },
    { id: 2, nombre: "Flor 1", gramaje: 22, precio_venta: 35, stock: 20 },
    { id: 3, nombre: "Flor 2 (base circular)", gramaje: 22, precio_venta: 35, stock: 18 },
    { id: 4, nombre: "Tulipán", gramaje: 28, precio_venta: 45, stock: 25 },
    { id: 5, nombre: "Peonía cempasuchil blanca", gramaje: 30, precio_venta: 45, stock: 12 },
    { id: 6, nombre: "Flor 3 (cilindro)", gramaje: 20, precio_venta: 35, stock: 10 },
    { id: 7, nombre: "Rosa", gramaje: 25, precio_venta: 40, stock: 30 },
    { id: 8, nombre: "Flor plana", gramaje: 32, precio_venta: 50, stock: 15 },
    { id: 9, nombre: "Nube grande", gramaje: 93, precio_venta: 100, stock: 8 },
    { id: 10, nombre: "Esqueleto", gramaje: 19, precio_venta: 30, stock: 14 },
    { id: 11, nombre: "Manos rezando", gramaje: 62, precio_venta: 80, stock: 10 },
    { id: 12, nombre: "Bulldog", gramaje: 62, precio_venta: 45, stock: 7 },
    { id: 13, nombre: "Fantasma moño", gramaje: 79, precio_venta: 90, stock: 9 },
    { id: 14, nombre: "Busto ojos", gramaje: 146, precio_venta: 150, stock: 5 },
    { id: 15, nombre: "Vela fantasma", gramaje: 70, precio_venta: 95, stock: 11 },
    { id: 16, nombre: "Gato fantasma", gramaje: 39, precio_venta: 50, stock: 16 },
    { id: 17, nombre: "Fantasma grande", gramaje: 138, precio_venta: 130, stock: 4 },
    { id: 18, nombre: "Perro fantasma", gramaje: 46, precio_venta: 50, stock: 13 },
    { id: 19, nombre: "Busto ojo tapado", gramaje: 108, precio_venta: 150, stock: 6 },
    { id: 20, nombre: "Huella perro", gramaje: 35, precio_venta: 45, stock: 22 },
    { id: 21, nombre: "Gato sentado", gramaje: 33, precio_venta: 45, stock: 19 },
    { id: 22, nombre: "Gato acostado", gramaje: 39, precio_venta: 45, stock: 17 },
    { id: 23, nombre: "Virgen", gramaje: 47, precio_venta: 80, stock: 8 },
    { id: 24, nombre: "Fantasma cabeza calabaza", gramaje: 86, precio_venta: 100, stock: 10 },
    { id: 25, nombre: "Calabaza centro", gramaje: 44, precio_venta: 50, stock: 15 },
    { id: 26, nombre: "Calabaza grande", gramaje: 76, precio_venta: 80, stock: 9 },
    { id: 27, nombre: "Flor cempasúchil", gramaje: 22, precio_venta: 35, stock: 24 },
    { id: 28, nombre: "Venus", gramaje: 50, precio_venta: 55, stock: 12 }
];

// ==========================================
// 2. MATHEMATICAL MODEL (FORMULA BLOCK)
// ==========================================

/**
 * Calculates the exact material distribution and costs for a given candle.
 * Similar to how an Analog-to-Digital Converter maps sensor values using linear formulas!
 * 
 * @param {number} gramaje - Total weight of the candle in grams.
 * @param {number} precioVenta - Target sale price in dollars/pesos.
 * @param {object} config - Configuration coefficients (wax cost, fragrance %, etc.)
 * @returns {object} Calculated material details, costs, and profits.
 */
function calcularValoresVela(gramaje, precioVenta, config = getAppState().config) {
    // 1. Calculate mass of active ingredients based on ratios
    // Wax accounts for remaining weight (e.g. 100% - 8% fragrance - 2% additive = 90% wax)
    const factorCera = 1 - config.pct_fragancia - config.pct_aditivo;
    const ceraG = gramaje * factorCera;
    const fraganciaG = gramaje * config.pct_fragancia;
    const aditivoG = gramaje * config.pct_aditivo;

    // 2. Calculate monetary costs based on unit pricing ($/g)
    const costoCera = ceraG * config.costo_cera_g;
    const costoFragancia = fraganciaG * config.costo_fragancia_g;
    const costoPabilo = config.costo_pabilo;

    // 3. Sum up to get Total Inputs Cost
    const totalInsumos = costoCera + costoFragancia + costoPabilo;

    // 4. Calculate Net Margin (Profit = Price - Costs)
    const ganancia = precioVenta - totalInsumos;

    // 5. Calculate profit margin percentage (Gain / Sale Price)
    const porcentajeMargen = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;

    return {
        gramaje_total: gramaje,
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

// ==========================================
// 3. STORAGE I/O CONTROLLER (EEPROM SIMULATION)
// ==========================================

/**
 * Loads the current global application state from LocalStorage (our RAM/EEPROM)
 */
function getAppState() {
    let config = localStorage.getItem('velisima_config');
    let products = localStorage.getItem('velisima_products');
    let orders = localStorage.getItem('velisima_orders');

    // If memory is blank (First Boot / Hard Reset), load preloaded ROM data
    if (!config) {
        config = DEFAULT_CONFIG;
        localStorage.setItem('velisima_config', JSON.stringify(config));
    } else {
        config = JSON.parse(config);
    }

    if (!products) {
        // Calculate complete formulas for default products on boot
        products = DEFAULT_PRODUCTS.map(p => {
            const calculated = calcularValoresVela(p.gramaje, p.precio_venta, config);
            return {
                id: p.id,
                nombre: p.nombre,
                gramaje: p.gramaje,
                precio_venta: p.precio_venta,
                stock: p.stock,
                calculado: calculated
            };
        });
        localStorage.setItem('velisima_products', JSON.stringify(products));
    } else {
        products = JSON.parse(products);
    }

    if (!orders) {
        orders = [];
        localStorage.setItem('velisima_orders', JSON.stringify(orders));
    } else {
        orders = JSON.parse(orders);
    }

    return { config, products, orders };
}

/**
 * Saves the current app state back to LocalStorage (EEPROM Write)
 */
function saveAppState(state) {
    if (state.config) localStorage.setItem('velisima_config', JSON.stringify(state.config));
    if (state.products) localStorage.setItem('velisima_products', JSON.stringify(state.products));
    if (state.orders) localStorage.setItem('velisima_orders', JSON.stringify(state.orders));
}

/**
 * Completely resets LocalStorage to factory defaults
 */
function resetAppState() {
    localStorage.removeItem('velisima_config');
    localStorage.removeItem('velisima_products');
    localStorage.removeItem('velisima_orders');
    location.reload();
}

// ==========================================
// 4. EXCEL IMPORT CONTROLLER (SheetJS Bus)
// ==========================================

/**
 * Parses raw file upload, extracts sheet data, processes columns, and merges into our local database.
 * 
 * @param {File} file - Excel spreadsheet file
 * @param {Function} callback - Execution callback when upload is finished
 */
function importarExcelData(file, callback) {
    const lector = new FileReader();
    
    // Set up async read complete handler (Interrupt routine)
    lector.onload = function(e) {
        try {
            const datosBinarios = e.target.result;
            // Parse workbook
            const wb = XLSX.read(datosBinarios, { type: 'binary' });
            
            // Check if our specific sheet exists
            const nombreHoja = 'Costeo Velas';
            if (!wb.SheetNames.includes(nombreHoja)) {
                alert(`Error: No se encontró la pestaña llamada "${nombreHoja}" en el archivo Excel.`);
                return;
            }
            
            const ws = wb.Sheets[nombreHoja];
            // Convert to JSON array of rows
            const rows = XLSX.utils.sheet_to_json(ws, { header: "A", defval: "" });
            
            if (rows.length < 2) {
                alert("Error: El archivo Excel parece estar vacío.");
                return;
            }
            
            // 1. EXTRACT PARAMS (Rows 2 to 6, columns L and M)
            // L: Parameter name, M: Parameter value
            let nuevosParams = { ...DEFAULT_CONFIG };
            
            // We search row-by-row for keys
            rows.forEach(r => {
                const paramName = String(r["L"] || "").trim().toLowerCase();
                const paramVal = parseFloat(r["M"]);
                
                if (!isNaN(paramVal)) {
                    if (paramName.includes("cera $/g") || paramName.includes("cera")) {
                        nuevosParams.costo_cera_g = paramVal;
                    } else if (paramName.includes("fragancia $/g") || paramName.includes("fragancia")) {
                        nuevosParams.costo_fragancia_g = paramVal;
                    } else if (paramName.includes("% fragancia")) {
                        // Support both decimal notation (0.08) and percentages (8)
                        nuevosParams.pct_fragancia = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("% aditivo")) {
                        nuevosParams.pct_aditivo = paramVal > 1 ? paramVal / 100 : paramVal;
                    } else if (paramName.includes("pabilo")) {
                        nuevosParams.costo_pabilo = paramVal;
                    }
                }
            });
            
            // 2. EXTRACT PRODUCTS (Column A has numeric IDs, Column B has name)
            let nuevosProductos = [];
            let currentProductsList = getAppState().products; // For preserving existing stock numbers!
            
            rows.forEach(r => {
                const idVal = parseInt(r["A"]);
                const nombreVela = String(r["B"] || "").trim();
                const gramajeTotal = parseFloat(r["C"]);
                let precioVenta = parseFloat(r["J"]);
                
                // Only process rows with a valid numeric ID and name
                if (!isNaN(idVal) && nombreVela !== "" && !isNaN(gramajeTotal)) {
                    if (isNaN(precioVenta)) precioVenta = 0; // Default to 0 if empty
                    
                    // Preserve stock count of existing product if IDs match
                    const existingProduct = currentProductsList.find(p => p.id === idVal || p.nombre.toLowerCase() === nombreVela.toLowerCase());
                    const stockConservado = existingProduct ? existingProduct.stock : 10; // Default 10 if brand new
                    
                    // Let our mathematical formula model do all cost allocations!
                    const calculado = calcularValoresVela(gramajeTotal, precioVenta, nuevosParams);
                    
                    nuevosProductos.push({
                        id: idVal,
                        nombre: nombreVela,
                        gramaje: gramajeTotal,
                        precio_venta: precioVenta,
                        stock: stockConservado,
                        calculado: calculado
                    });
                }
            });
            
            if (nuevosProductos.length === 0) {
                alert("Error: No se pudieron extraer productos válidos de la columna 'Molde'.");
                return;
            }
            
            // Write newly synced state to memory registers (localStorage)
            saveAppState({
                config: nuevosParams,
                products: nuevosProductos
            });
            
            if (callback) callback(true);
            
        } catch (error) {
            console.error(error);
            alert("Error al parsear el archivo Excel: " + error.message);
            if (callback) callback(false);
        }
    };
    
    lector.readAsBinaryString(file);
}

// ==========================================
// 5. INTERACTIVE DASHBOARD VIEWS (HTML DRIVERS)
// ==========================================

/**
 * Updates the dashboard UI components (metrics and tables) on the homepage.
 */
function inicializarDashboard() {
    const state = getAppState();
    
    // Check if elements exist on page (since script runs on all pages)
    const kpiCantProductos = document.getElementById('kpi-cant-productos');
    if (!kpiCantProductos) return; // Not on home page
    
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
        totalStock += p.stock;
        valorVentaInventario += p.stock * p.precio_venta;
        if (p.stock < 5) totalAlertas++;
    });
    
    document.getElementById('kpi-total-inventario').textContent = `${totalStock} uds`;
    document.getElementById('kpi-valor-inventario').textContent = `$${valorVentaInventario.toLocaleString()}`;
    
    // Show Alert Banner if products are running low on stock
    const alertaStockBanner = document.getElementById('alerta-stock-banner');
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
    
    // --- Render Parameter Summary Card ---
    renderParametrosCard(state.config);
    
    // --- Setup Quick Material Calculator ---
    configurarCalculadoraMateriales(state.products);
}

/**
 * Displays the current parameters in a clean read-only list on the sidebar.
 */
function renderParametrosCard(config) {
    const ceraVal = document.getElementById('param-costo-cera');
    const fragVal = document.getElementById('param-costo-frag');
    const pctFragVal = document.getElementById('param-pct-frag');
    const pctAdiVal = document.getElementById('param-pct-adit');
    const pabiloVal = document.getElementById('param-costo-pab');
    
    if (ceraVal) ceraVal.textContent = `$${config.costo_cera_g} / g`;
    if (fragVal) fragVal.textContent = `$${config.costo_fragancia_g} / g`;
    if (pctFragVal) pctFragVal.textContent = `${(config.pct_fragancia * 100).toFixed(0)}%`;
    if (pctAdiVal) pctAdiVal.textContent = `${(config.pct_aditivo * 100).toFixed(0)}%`;
    if (pabiloVal) pabiloVal.textContent = `$${config.costo_pabilo} / ud`;
}

/**
 * Material Calculator Controller.
 * Acts like a transfer-function block in engineering: 
 * inputs (Candle selection, Quantity) -> linear scaling formulas -> outputs (Total Wax, Fragrance, Aditive weight, cost).
 */
function configurarCalculadoraMateriales(products) {
    const form = document.getElementById('calc-form');
    if (!form) return;
    
    const selectVela = document.getElementById('calc-vela-select');
    const inputCant = document.getElementById('calc-cantidad');
    const btnAgregar = document.getElementById('btn-calc-agregar');
    const itemsList = document.getElementById('calc-items-list');
    
    const outCera = document.getElementById('out-total-cera');
    const outFrag = document.getElementById('out-total-frag');
    const outAdit = document.getElementById('out-total-adit');
    const outPab = document.getElementById('out-total-pab');
    const outCosto = document.getElementById('out-costo-total');
    
    // Populate dropdown with all available candles
    selectVela.innerHTML = '<option value="" disabled selected>-- Selecciona un molde --</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nombre} (${p.gramaje}g)`;
        selectVela.appendChild(option);
    });
    
    // Array to hold current batches in our planning bucket
    let calculadoraLista = [];
    
    // Add product to manufacturing plan
    btnAgregar.addEventListener('click', () => {
        const prodId = parseInt(selectVela.value);
        const cant = parseInt(inputCant.value);
        
        if (isNaN(prodId) || isNaN(cant) || cant <= 0) {
            alert("Por favor selecciona un molde y una cantidad válida (mayor a 0).");
            return;
        }
        
        const prodObj = products.find(p => p.id === prodId);
        
        // If product already in list, sum quantities
        const existingIdx = calculadoraLista.findIndex(item => item.product.id === prodId);
        if (existingIdx > -1) {
            calculadoraLista[existingIdx].cantidad += cant;
        } else {
            calculadoraLista.push({ product: prodObj, cantidad: cant });
        }
        
        // Reset form inputs
        selectVela.value = "";
        inputCant.value = "1";
        
        // Re-render planning bucket and sum totals
        actualizarListaCalculator();
    });
    
    function actualizarListaCalculator() {
        itemsList.innerHTML = '';
        
        if (calculadoraLista.length === 0) {
            itemsList.innerHTML = '<li class="list-group-item text-center text-muted">Ningún molde agregado al plan</li>';
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
        
        calculadoraLista.forEach((item, idx) => {
            const p = item.product;
            const q = item.cantidad;
            const calc = p.calculado;
            
            // Scale values by quantity
            const itemCera = calc.cera_g * q;
            const itemFrag = calc.fragancia_g * q;
            const itemAdit = calc.aditivo_g * q;
            const itemPab = q;
            const itemCosto = calc.total_insumos * q;
            
            // Add to grand totals
            sumCera += itemCera;
            sumFrag += itemFrag;
            sumAdit += itemAdit;
            sumPab += itemPab;
            sumCosto += itemCosto;
            
            // Append DOM row
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-light border-0 mb-2 rounded shadow-sm";
            li.innerHTML = `
                <div>
                    <strong>${q}x</strong> ${p.nombre} 
                    <span class="text-muted d-block" style="font-size: 0.8rem;">
                        Wax: ${itemCera.toFixed(0)}g | Frag: ${itemFrag.toFixed(0)}g | Cost: $${itemCosto.toFixed(1)}
                    </span>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger border-0 rounded-circle" onclick="eliminarItemCalculadora(${idx})">
                    <i class="bi bi-trash-fill"></i>
                </button>
            `;
            itemsList.appendChild(li);
        });
        
        // Output scaled system responses (displays)
        outCera.textContent = `${sumCera.toLocaleString(undefined, {maximumFractionDigits:1})} g`;
        outFrag.textContent = `${sumFrag.toLocaleString(undefined, {maximumFractionDigits:1})} g`;
        outAdit.textContent = `${sumAdit.toLocaleString(undefined, {maximumFractionDigits:1})} g`;
        outPab.textContent = `${sumPab} uds`;
        outCosto.textContent = `$${sumCosto.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    }
    
    // Bind to window context so inline onclick can reach it
    window.eliminarItemCalculadora = function(index) {
        calculadoraLista.splice(index, 1);
        actualizarListaCalculator();
    };
}

// ==========================================
// 6. DRAG AND DROP / FILE SELECT HANDLERS
// ==========================================

function configurarCargaExcel() {
    const inputExcel = document.getElementById('excel-file-input');
    const contenedorCarga = document.getElementById('excel-upload-zone');
    
    if (!contenedorCarga || !inputExcel) return;
    
    // Click on dropzone opens actual file dialer
    contenedorCarga.addEventListener('click', () => {
        inputExcel.click();
    });
    
    // Drag and drop event traps
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
    
    // File input selection event
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
    
    importarExcelData(archivo, (exito) => {
        if (exito) {
            // Show toast or bootstrap alert of success
            alert("¡Excelente! Datos de Costeo e Inventario importados con éxito.");
            inicializarDashboard();
        }
    });
}

// ==========================================
// 7. INITIALIZATION (BOOT SEQUENCE)
// ==========================================

// This triggers as soon as the DOM page registers high (loaded)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Read app memory registers (Boot state)
    getAppState();
    
    // 2. Initialize homepage dashboard views if present
    inicializarDashboard();
    
    // 3. Set up listeners for the drag-drop file parser
    configurarCargaExcel();
    
    // 4. Set up Reset button listener if present
    const btnReset = document.getElementById('btn-reset-app');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas restablecer la aplicación? Esto borrará tus niveles de stock y órdenes registradas, cargando los datos iniciales de fábrica.")) {
                resetAppState();
            }
        });
    }
});
