/**
 * VELISIMA - Candle Inventory & Cost Control
 * Phase 2: Interactive Inventory Table (The Stock Register Controller)
 * 
 * Engineering Analogy:
 * - This file acts like a MULTIPLEXED REGISTER CONTROLLER for the stock memory bank.
 * - Each row in the table corresponds to an addressable memory slot containing:
 *   [ID, Model Name, Wax Type, Mass (g), Input Cost ($), Sale Price ($), Stock Count].
 * - The inline [+] and [-] buttons are atomic increment/decrement ALU operations.
 * - Excel Export acts as a full EEPROM dump to an external storage bus.
 */

// Global DataTable reference
let tablaInventarioDT = null;
let filtroActivo = 'all';

// ==========================================================================
// 1. INITIALIZATION ON DOM READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verify and sanitize app state
    const state = getAppState();
    
    // 2. Render Telemetry Counters & High-Volume Alerts
    verificarAlertasAltoVolumen(state);
    actualizarTelemetriaInventario(state);
    
    // 3. Initialize DataTables.net
    inicializarTablaInventario(state);
    
    // 4. Setup Filter Buttons
    configurarFiltros();
    
    // 5. Setup Modals and Event Listeners
    configurarEventosModales();
    
    // 6. Setup Excel Export Button & Reset Stock Button
    configurarExportacionExcel();
    configurarResetStockBoton();
});

// ==========================================================================
// 2. TELEMETRY & STATS REGISTERS
// ==========================================================================

function actualizarTelemetriaInventario(state) {
    const products = state.products || [];
    
    let totalStock = 0;
    let valorInventario = 0;
    let alertasStock = 0;
    let stockCero = 0;
    let cantMalasia = 0;
    let cantSoya = 0;
    
    products.forEach(p => {
        const stock = parseInt(p.stock) || 0;
        const precio = parseFloat(p.precio_venta) || 0;
        
        totalStock += stock;
        valorInventario += (stock * precio);
        
        if (stock < 5 && stock > 0) alertasStock++;
        if (stock === 0) stockCero++;
        
        if ((p.tipo_cera || 'malasia') === 'soya') {
            cantSoya++;
        } else {
            cantMalasia++;
        }
    });
    
    // Telemetry cards
    document.getElementById('stat-total-moldes').textContent = products.length;
    document.getElementById('stat-total-stock').textContent = `${totalStock} uds`;
    document.getElementById('stat-valor-stock').textContent = `$${valorInventario.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stat-alertas-stock').textContent = alertasStock + stockCero;
    
    // Filter pill counters
    document.getElementById('count-filtro-all').textContent = products.length;
    document.getElementById('count-filtro-low').textContent = alertasStock;
    document.getElementById('count-filtro-zero').textContent = stockCero;
    document.getElementById('count-filtro-malasia').textContent = cantMalasia;
    document.getElementById('count-filtro-soya').textContent = cantSoya;
}

// ==========================================================================
// 3. DATATABLES INITIALIZATION & ROW RENDERING
// ==========================================================================

function inicializarTablaInventario(state) {
    const tableEl = $('#tabla-inventario');
    
    // Custom DataTables Filter Extension for our buttons
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
        if (settings.nTable.id !== 'tabla-inventario') return true;
        
        const currentProducts = getAppState().products;
        const product = currentProducts[dataIndex];
        if (!product) return true;
        
        const stock = parseInt(product.stock) || 0;
        const tipoCera = product.tipo_cera || 'malasia';
        
        if (filtroActivo === 'all') return true;
        if (filtroActivo === 'low') return stock < 5 && stock > 0;
        if (filtroActivo === 'zero') return stock === 0;
        if (filtroActivo === 'malasia') return tipoCera === 'malasia';
        if (filtroActivo === 'soya') return tipoCera === 'soya';
        
        return true;
    });

    tablaInventarioDT = tableEl.DataTable({
        data: state.products,
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Buscar molde o vela...",
            lengthMenu: "Mostrar _MENU_ moldes",
            info: "Mostrando _START_ a _END_ de _TOTAL_ moldes",
            infoEmpty: "Mostrando 0 moldes",
            infoFiltered: "(filtrado de _MAX_ moldes en total)",
            zeroRecords: "No se encontraron moldes que coincidan con la búsqueda",
            paginate: {
                first: '<i class="bi bi-chevron-double-left"></i>',
                previous: '<i class="bi bi-chevron-left"></i>',
                next: '<i class="bi bi-chevron-right"></i>',
                last: '<i class="bi bi-chevron-double-right"></i>'
            }
        },
        columns: [
            // 0: ID (Strict numeric sorting)
            {
                data: 'id',
                type: 'num',
                defaultContent: 0,
                className: 'text-muted fw-semibold text-center',
                render: (data, type) => {
                    const idNum = parseInt(data) || 0;
                    if (type === 'sort' || type === 'type') {
                        return idNum;
                    }
                    return `<span class="badge bg-light text-dark border">#${idNum}</span>`;
                }
            },
            // 1: Name / Mold
            {
                data: 'nombre',
                defaultContent: '',
                render: (data) => `
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-fire" style="color: var(--secondary-color);"></i>
                        <span class="fw-bold text-dark">${data || 'Sin nombre'}</span>
                    </div>
                `
            },
            // 2: Wax Type (Handles fallback safely)
            {
                data: 'tipo_cera',
                defaultContent: 'malasia',
                render: (data, type, row) => {
                    const val = data || (row && row.tipo_cera) || 'malasia';
                    const isSoya = val === 'soya';
                    if (type === 'sort' || type === 'type') {
                        return isSoya ? 'soya' : 'malasia';
                    }
                    return isSoya
                        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Cera Soya</span>`
                        : `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Cera Malasia</span>`;
                }
            },
            // 3: Gram Weight (Strict numeric sorting)
            {
                data: 'gramaje',
                type: 'num',
                defaultContent: 0,
                className: 'text-end',
                render: (data, type) => {
                    const num = parseFloat(data) || 0;
                    if (type === 'sort' || type === 'type') return num;
                    return `<strong>${num}</strong> <small class="text-muted">g</small>`;
                }
            },
            // 4: Raw Material Cost
            {
                data: 'calculado.total_insumos',
                type: 'num',
                defaultContent: 0,
                className: 'text-end',
                render: (data, type, row) => {
                    const c = (row && row.calculado) || {};
                    const total = parseFloat(data !== undefined ? data : (c.total_insumos || 0));
                    if (type === 'sort' || type === 'type') return total;
                    
                    const tooltip = `Cera: $${c.costo_cera || 0} (${c.cera_g || 0}g) | Frag: $${c.costo_fragancia || 0} (${c.fragancia_g || 0}g) | Pab: $${c.costo_pabilo || 0.50}`;
                    return `
                        <span title="${tooltip}" class="text-dark fw-semibold" style="cursor: help;">
                            $${total.toFixed(2)}
                            <i class="bi bi-info-circle-fill text-muted ms-1" style="font-size: 0.75rem;"></i>
                        </span>
                    `;
                }
            },
            // 5: Sale Price
            {
                data: 'precio_venta',
                type: 'num',
                defaultContent: 0,
                className: 'text-end',
                render: (data, type) => {
                    const val = parseFloat(data) || 0;
                    if (type === 'sort' || type === 'type') return val;
                    return `<span class="fw-bold text-dark">$${val.toFixed(2)}</span>`;
                }
            },
            // 6: Profit ($)
            {
                data: 'calculado.ganancia',
                type: 'num',
                defaultContent: 0,
                className: 'text-end',
                render: (data, type, row) => {
                    const c = (row && row.calculado) || {};
                    const val = parseFloat(data !== undefined ? data : (c.ganancia || 0));
                    if (type === 'sort' || type === 'type') return val;
                    return `<span class="fw-bold text-success">+$${val.toFixed(2)}</span>`;
                }
            },
            // 7: Margin (%)
            {
                data: 'calculado.porcentaje_margen',
                type: 'num',
                defaultContent: 0,
                className: 'text-end',
                render: (data, type, row) => {
                    const c = (row && row.calculado) || {};
                    const val = parseFloat(data !== undefined ? data : (c.porcentaje_margen || 0));
                    if (type === 'sort' || type === 'type') return val;
                    
                    let badgeClass = "text-success bg-success-subtle border-success-subtle";
                    if (val < 50) badgeClass = "text-danger bg-danger-subtle border-danger-subtle";
                    else if (val < 70) badgeClass = "text-warning-emphasis bg-warning-subtle border-warning-subtle";
                    
                    return `<span class="badge ${badgeClass} border px-2 py-1">${val.toFixed(1)}%</span>`;
                }
            },
            // 8: Stock with [+] and [-] Step Controls
            {
                data: 'stock',
                type: 'num',
                defaultContent: 0,
                className: 'text-center',
                render: (data, type, row) => {
                    const stockVal = parseInt(data) || 0;
                    if (type === 'sort' || type === 'type') return stockVal;
                    
                    let badgeClass = "badge-in-stock";
                    if (stockVal === 0) badgeClass = "badge-zero-stock";
                    else if (stockVal < 5) badgeClass = "badge-low-stock";

                    return `
                        <div class="d-inline-flex align-items-center gap-1">
                            <button type="button" class="btn btn-outline-secondary btn-stock-step" onclick="ajustarStockRapido(${row.id}, -1)" title="Restar 1 unidad">
                                -
                            </button>
                            <span class="${badgeClass} px-3 py-1" style="min-width: 45px; cursor: pointer;" onclick="abrirModalAjuste(${row.id})" title="Clic para ajuste directo">
                                ${stockVal}
                            </span>
                            <button type="button" class="btn btn-outline-secondary btn-stock-step" onclick="ajustarStockRapido(${row.id}, 1)" title="Sumar 1 unidad">
                                +
                            </button>
                        </div>
                    `;
                }
            },
            // 9: Actions
            {
                data: 'id',
                defaultContent: 0,
                className: 'text-center',
                orderable: false,
                render: (data) => `
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-primary border-0 rounded-circle" onclick="abrirModalAjuste(${data})" title="Ajustar Stock">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger border-0 rounded-circle" onclick="eliminarProducto(${data})" title="Eliminar del catálogo">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                `
            }
        ],
        order: [[0, 'asc']] // Strict numerical ordering by Column 0
    });
}

// ==========================================================================
// 4. ATOMIC STOCK ADJUSTMENTS (ALU INCREMENT / DECREMENT)
// ==========================================================================

/**
 * Rapidly adds or subtracts from a candle's stock register and commits to LocalStorage.
 * 
 * @param {number} productId - ID of the candle to adjust
 * @param {number} delta - Amount to add (+1) or subtract (-1)
 */
function ajustarStockRapido(productId, delta) {
    const state = getAppState();
    const product = state.products.find(p => p.id === productId);
    
    if (!product) return;
    
    const nuevoStock = Math.max(0, (parseInt(product.stock) || 0) + delta);
    product.stock = nuevoStock;
    
    // Commit to EEPROM (LocalStorage)
    saveAppState({ products: state.products });
    
    // Refresh table and telemetry without losing current search/page
    recargarVistaTabla(state);
}

/**
 * Re-reads state, updates telemetry cards, and redraws DataTables keeping current paging.
 */
function recargarVistaTabla(state = getAppState()) {
    actualizarTelemetriaInventario(state);
    
    if (tablaInventarioDT) {
        tablaInventarioDT.clear();
        tablaInventarioDT.rows.add(state.products);
        tablaInventarioDT.draw(false); // false = keep current page & search
    }
}

// ==========================================================================
// 5. QUICK FILTER PILLS CONTROLLER
// ==========================================================================

function configurarFiltros() {
    const container = document.getElementById('filtro-stock-grupo');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        
        container.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        filtroActivo = btn.getAttribute('data-filter');
        if (tablaInventarioDT) {
            tablaInventarioDT.draw();
        }
    });
}

// ==========================================================================
// 6. MODALS MANAGEMENT (Stock Editor & New Product Registration)
// ==========================================================================

function configurarEventosModales() {
    // 1. Direct Stock Edit Modal Save Button
    const btnGuardarStock = document.getElementById('btn-guardar-ajuste-stock');
    if (btnGuardarStock) {
        btnGuardarStock.addEventListener('click', () => {
            const prodId = parseInt(document.getElementById('modal-stock-prod-id').value);
            const cant = parseInt(document.getElementById('modal-stock-input-cantidad').value);
            
            if (isNaN(cant) || cant < 0) {
                alert("Por favor ingresa un número de stock válido (0 o mayor).");
                return;
            }
            
            const state = getAppState();
            const prod = state.products.find(p => p.id === prodId);
            if (prod) {
                prod.stock = cant;
                saveAppState({ products: state.products });
                recargarVistaTabla(state);
                
                const modalEl = document.getElementById('modalAjusteStock');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
        });
    }

    // 2. Create New Product Modal Save Button
    const btnCrearProducto = document.getElementById('btn-crear-producto');
    if (btnCrearProducto) {
        btnCrearProducto.addEventListener('click', () => {
            const nombre = document.getElementById('nuevo-prod-nombre').value.trim();
            const gramaje = parseFloat(document.getElementById('nuevo-prod-gramaje').value);
            const tipoCera = document.getElementById('nuevo-prod-cera').value;
            const precioVenta = parseFloat(document.getElementById('nuevo-prod-precio').value);
            const stockInicial = parseInt(document.getElementById('nuevo-prod-stock').value) || 0;
            
            if (!nombre) {
                alert("Por favor ingresa el nombre de la vela/molde.");
                return;
            }
            if (isNaN(gramaje) || gramaje <= 0) {
                alert("Por favor ingresa un gramaje válido (mayor a 0).");
                return;
            }
            if (isNaN(precioVenta) || precioVenta < 0) {
                alert("Por favor ingresa un precio de venta válido.");
                return;
            }
            
            const state = getAppState();
            
            const maxId = state.products.reduce((max, p) => p.id > max ? p.id : max, 0);
            const newId = maxId + 1;
            
            const calculado = calcularValoresVela(gramaje, precioVenta, { tipoCera: tipoCera }, state.config);
            
            const nuevoObj = {
                id: newId,
                nombre: nombre,
                gramaje: gramaje,
                precio_venta: precioVenta,
                stock: stockInicial,
                tipo_cera: tipoCera,
                calculado: calculado
            };
            
            state.products.push(nuevoObj);
            saveAppState({ products: state.products });
            recargarVistaTabla(state);
            
            document.getElementById('form-nuevo-producto').reset();
            const modalEl = document.getElementById('modalNuevoProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
            
            alert(`¡Molde "${nombre}" agregado con éxito al catálogo!`);
        });
    }
}

/**
 * Opens direct stock adjustment modal for a given product.
 */
window.abrirModalAjuste = function(productId) {
    const state = getAppState();
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;
    
    document.getElementById('modal-stock-prod-id').value = prod.id;
    document.getElementById('modal-stock-prod-nombre').textContent = prod.nombre;
    document.getElementById('modal-stock-prod-gramaje').textContent = `${prod.gramaje} g (${prod.tipo_cera === 'soya' ? 'Cera Soya' : 'Cera Malasia'})`;
    document.getElementById('modal-stock-input-cantidad').value = prod.stock;
    
    const modal = new bootstrap.Modal(document.getElementById('modalAjusteStock'));
    modal.show();
};

/**
 * Deletes a product from the local catalog after user confirmation.
 */
window.eliminarProducto = function(productId) {
    const state = getAppState();
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar "${prod.nombre}" del catálogo de inventario?`)) {
        state.products = state.products.filter(p => p.id !== productId);
        saveAppState({ products: state.products });
        recargarVistaTabla(state);
    }
};

// ==========================================================================
// 7. EXCEL EXPORT CONTROLLER (SheetJS Output Bus) & ZERO STOCK RESET
// ==========================================================================

function configurarExportacionExcel() {
    const btnExportar = document.getElementById('btn-exportar-excel');
    if (!btnExportar) return;
    
    btnExportar.addEventListener('click', () => {
        try {
            const state = getAppState();
            const products = state.products || [];
            const config = state.config || DEFAULT_CONFIG;
            const fragancias = state.fragancias || DEFAULT_FRAGRANCIAS;
            
            // 1. Build "Costeo Velas" Sheet Data
            let wsCosteoData = [
                [
                    "ID", "Molde", "Gramaje total (g)", "Tipo Cera", "Cera (g)", "Costo cera", 
                    "Fragancia (g)", "Costo fragancia", "Pabilo", "Total insumos", 
                    "Precio venta", "Ganancia", "Stock Actual", "Margen %", "", "Parámetros", "Valor"
                ]
            ];
            
            const paramRows = [
                ["Costo cera Malasia $/g", config.costo_cera_malasia_g || 0.11],
                ["Costo cera Soya $/g", config.costo_cera_soya_g || 0.14],
                ["Costo fragancia $/g (ref)", config.costo_fragancia_g || 0.70],
                ["% Fragancia estándar", config.pct_fragancia || 0.08],
                ["% Aditivo", config.pct_aditivo || 0.02],
                ["Costo pabilo", config.costo_pabilo || 0.50]
            ];
            
            products.forEach((p, idx) => {
                const c = p.calculado || calcularValoresVela(p.gramaje, p.precio_venta, { tipoCera: p.tipo_cera }, config);
                const paramLabel = idx < paramRows.length ? paramRows[idx][0] : "";
                const paramValue = idx < paramRows.length ? paramRows[idx][1] : "";
                
                wsCosteoData.push([
                    p.id,
                    p.nombre,
                    p.gramaje,
                    p.tipo_cera || 'malasia',
                    c.cera_g,
                    c.costo_cera,
                    c.fragancia_g,
                    c.costo_fragancia,
                    c.costo_pabilo,
                    c.total_insumos,
                    p.precio_venta,
                    c.ganancia,
                    p.stock,
                    `${c.porcentaje_margen}%`,
                    "",
                    paramLabel,
                    paramValue
                ]);
            });
            
            // 2. Build "Fragancias" Sheet Data
            let wsFraganciasData = [
                ["Número", "Nombre Fragancia", "Costo por 250ml ($)", "Costo por gramo ($/g)"]
            ];
            fragancias.forEach(f => {
                wsFraganciasData.push([
                    f.id,
                    f.nombre,
                    f.costo_250ml,
                    f.costo_g
                ]);
            });
            
            const wb = XLSX.utils.book_new();
            const wsCosteo = XLSX.utils.aoa_to_sheet(wsCosteoData);
            const wsFragancias = XLSX.utils.aoa_to_sheet(wsFraganciasData);
            
            XLSX.utils.book_append_sheet(wb, wsCosteo, "Costeo Velas");
            XLSX.utils.book_append_sheet(wb, wsFragancias, "Fragancias");
            
            const today = new Date().toISOString().slice(0, 10);
            const fileName = `Velisima_Inventario_Costeo_${today}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            
        } catch (error) {
            console.error(error);
            alert("Error al generar el archivo Excel: " + error.message);
        }
    });
}

function configurarResetStockBoton() {
    const btnZeroStock = document.getElementById('btn-zero-stock');
    if (btnZeroStock) {
        btnZeroStock.addEventListener('click', () => {
            if (confirm("¿Deseas poner el stock de todos los productos en 0 para comenzar a cargar tu inventario real?")) {
                const state = getAppState();
                state.products.forEach(p => p.stock = 0);
                saveAppState({ products: state.products });
                recargarVistaTabla(state);
            }
        });
    }
}
