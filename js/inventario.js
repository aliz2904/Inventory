/**
 * VELISIMA - Candle Inventory & Cost Control
 * Phase 2: Interactive Inventory Table (The Stock Register Controller)
 * + Insumos & Raw Materials Inventory Management (Ceras & Fragancias)
 * 
 * Engineering Analogy:
 * - This file acts like a MULTIPLEXED REGISTER CONTROLLER for:
 *   1. The Candle Stock Memory Bank (Finished Goods / Addressable Slots #1 to #28).
 *   2. The Raw Materials Insumos Bus (Cera Malasia, Cera Soya, Fragrance bottles & grams).
 * - Excel Export dumps Costeo Velas, Fragancias, and the new Insumos sheet.
 */

// Global DataTable reference
let tablaInventarioDT = null;
let filtroActivo = 'all';

// ==========================================================================
// 1. INITIALIZATION ON DOM READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseStateReady) {
        window.firebaseStateReady.then(iniciarInventario);
    } else {
        iniciarInventario();
    }
    
    function iniciarInventario() {
        const state = getAppState();
        verificarAlertasAltoVolumen(state);
        actualizarTelemetriaInventario(state);
        renderizarInsumosDashboard(state);
        inicializarTablaInventario(state);
        configurarFiltros();
        configurarEventosModales();
        configurarEventosInsumos(state);
        configurarExportacionExcel();
        configurarResetStockBoton();
    }
    
    window.addEventListener('firebaseUpdate', () => {
        const state = getAppState();
        actualizarTelemetriaInventario(state);
        renderizarInsumosDashboard(state);
        if (tablaInventarioDT) {
            tablaInventarioDT.clear().rows.add(state.products || []).draw(false);
        }
    });
});

// ==========================================================================
// 2. TELEMETRY & STATS REGISTERS
// ==========================================================================

function actualizarTelemetriaInventario(state) {
    let totalStock = 0;
    let valorTotal = 0;
    let alertasBajoStock = 0;
    const totalMoldes = state.products.length;

    state.products.forEach(p => {
        const stockActual = parseInt(p.stock) || 0;
        totalStock += stockActual;
        valorTotal += stockActual * p.precio_venta;

        if (stockActual < 5 && stockActual > 0) {
            alertasBajoStock++;
        }
    });

    document.getElementById('stat-total-moldes').textContent = totalMoldes;
    document.getElementById('stat-total-stock').textContent = `${totalStock} uds`;
    document.getElementById('stat-valor-stock').textContent = `$${valorTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stat-alertas-stock').textContent = alertasBajoStock;

    // Filter pill counters
    document.getElementById('count-filtro-all').textContent = totalMoldes;
    document.getElementById('count-filtro-low').textContent = state.products.filter(p => p.stock > 0 && p.stock < 5).length;
    document.getElementById('count-filtro-zero').textContent = state.products.filter(p => p.stock === 0).length;
    document.getElementById('count-filtro-malasia').textContent = state.products.filter(p => (p.tipo_cera || 'malasia') === 'malasia').length;
    document.getElementById('count-filtro-soya').textContent = state.products.filter(p => p.tipo_cera === 'soya').length;
}

// ==========================================================================
// 3. INSUMOS & RAW MATERIALS CONTROLLER
// ==========================================================================

/**
 * Renders the Insumos Console (Cera Malasia, Cera Soya, Fragancias).
 */
function renderizarInsumosDashboard(state) {
    const insumos = state.insumos || {};
    
    const ceraMalasiaG = parseFloat(insumos.cera_malasia_g) || 0;
    const ceraSoyaG = parseFloat(insumos.cera_soya_g) || 0;
    
    // 1. Cera Malasia Card
    const elMalasiaDisplay = document.getElementById('insumo-cera-malasia-display');
    const elMalasiaSub = document.getElementById('insumo-cera-malasia-sub');
    if (elMalasiaDisplay) elMalasiaDisplay.textContent = `${(ceraMalasiaG / 1000).toFixed(2)} kg`;
    if (elMalasiaSub) elMalasiaSub.textContent = `${ceraMalasiaG.toLocaleString()} gramos disponibles`;
    
    // 2. Cera de Soya Card
    const elSoyaDisplay = document.getElementById('insumo-cera-soya-display');
    const elSoyaSub = document.getElementById('insumo-cera-soya-sub');
    if (elSoyaDisplay) elSoyaDisplay.textContent = `${(ceraSoyaG / 1000).toFixed(2)} kg`;
    if (elSoyaSub) elSoyaSub.textContent = `${ceraSoyaG.toLocaleString()} gramos disponibles`;
    
    // 3. Fragancias Summary Card
    let totalBotellas = 0;
    let totalGramosFragancia = 0;
    
    (insumos.fragancias || []).forEach(f => {
        const b250 = parseInt(f.botellas_250ml) || 0;
        const b500 = parseInt(f.botellas_500ml) || 0;
        const b1l = parseInt(f.botellas_1l) || 0;
        totalBotellas += (b250 + b500 + b1l);
        totalGramosFragancia += (parseFloat(f.total_g) || ((b250 * 250) + (b500 * 500) + (b1l * 1000)));
    });
    
    const elFragDisplay = document.getElementById('insumo-fragancias-total-display');
    const elFragSub = document.getElementById('insumo-fragancias-total-sub');
    if (elFragDisplay) elFragDisplay.textContent = `${totalBotellas} botellas`;
    if (elFragSub) elFragSub.textContent = `${totalGramosFragancia.toLocaleString()} g totales en stock`;
}

/**
 * Fast atomic modifier for Wax stock (+1kg, +5kg, -1kg).
 */
window.modificarInsumoCera = function(tipo, deltaGramos) {
    const state = getAppState();
    if (!state.insumos) state.insumos = {};
    
    if (tipo === 'soya') {
        const actual = parseFloat(state.insumos.cera_soya_g) || 0;
        state.insumos.cera_soya_g = Math.max(0, actual + deltaGramos);
    } else {
        const actual = parseFloat(state.insumos.cera_malasia_g) || 0;
        state.insumos.cera_malasia_g = Math.max(0, actual + deltaGramos);
    }
    
    saveAppState({ insumos: state.insumos });
    renderizarInsumosDashboard(state);
};

/**
 * Opens modal to adjust exact wax grams/kg.
 */
window.abrirModalAjustarCera = function(tipo) {
    const state = getAppState();
    const insumos = state.insumos || {};
    
    const inputTipo = document.getElementById('ajuste-cera-tipo');
    const labelNombre = document.getElementById('ajuste-cera-nombre-label');
    const inputGramos = document.getElementById('ajuste-cera-gramos-input');
    const helperKg = document.getElementById('ajuste-cera-kg-helper');
    
    inputTipo.value = tipo;
    
    if (tipo === 'soya') {
        labelNombre.textContent = 'Cera de Soya (Bouquets) - Gramos en Stock:';
        inputGramos.value = parseFloat(insumos.cera_soya_g) || 0;
    } else {
        labelNombre.textContent = 'Cera Malasia (Moldes) - Gramos en Stock:';
        inputGramos.value = parseFloat(insumos.cera_malasia_g) || 0;
    }
    
    const kg = (parseFloat(inputGramos.value) / 1000).toFixed(2);
    helperKg.textContent = `Equivalente a: ${kg} kg`;
    
    inputGramos.oninput = () => {
        const val = parseFloat(inputGramos.value) || 0;
        helperKg.textContent = `Equivalente a: ${(val / 1000).toFixed(2)} kg`;
    };
    
    const modal = new bootstrap.Modal(document.getElementById('modalAjustarCera'));
    modal.show();
};

function configurarEventosInsumos(state) {
    // 1. Save Exact Wax Adjustment
    const btnGuardarCera = document.getElementById('btn-guardar-ajuste-cera');
    if (btnGuardarCera) {
        btnGuardarCera.addEventListener('click', () => {
            const tipo = document.getElementById('ajuste-cera-tipo').value;
            const gramos = parseFloat(document.getElementById('ajuste-cera-gramos-input').value) || 0;
            
            const currentState = getAppState();
            if (!currentState.insumos) currentState.insumos = {};
            
            if (tipo === 'soya') {
                currentState.insumos.cera_soya_g = Math.max(0, gramos);
            } else {
                currentState.insumos.cera_malasia_g = Math.max(0, gramos);
            }
            
            saveAppState({ insumos: currentState.insumos });
            renderizarInsumosDashboard(currentState);
            
            const modalEl = document.getElementById('modalAjustarCera');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        });
    }
    
    // 2. Setup Fragrance Bottles Modal
    const modalFragEl = document.getElementById('modalDetalleFraganciasInsumo');
    if (modalFragEl) {
        modalFragEl.addEventListener('show.bs.modal', () => {
            renderizarTablaModalFragancias(getAppState());
        });
    }
    
    const btnGuardarFrag = document.getElementById('btn-guardar-fragancias-insumo');
    if (btnGuardarFrag) {
        btnGuardarFrag.addEventListener('click', () => {
            guardarFraganciasInsumoDesdeModal();
        });
    }
}

/**
 * Renders the fragrance bottles table inside the modal.
 */
function renderizarTablaModalFragancias(state) {
    const tbody = document.getElementById('fragancias-insumo-tbody');
    if (!tbody) return;
    
    const fragancias = state.fragancias || [];
    const insumosFrag = (state.insumos && state.insumos.fragancias) ? state.insumos.fragancias : [];
    
    tbody.innerHTML = '';
    
    fragancias.forEach((f, idx) => {
        const item = insumosFrag.find(fi => fi.id === f.id || fi.nombre.toLowerCase() === f.nombre.toLowerCase()) || {
            botellas_250ml: 0,
            botellas_500ml: 0,
            botellas_1l: 0,
            total_g: 0
        };
        
        const b250 = parseInt(item.botellas_250ml) || 0;
        const b500 = parseInt(item.botellas_500ml) || 0;
        const b1l = parseInt(item.botellas_1l) || 0;
        const totalG = (b250 * 250) + (b500 * 500) + (b1l * 1000);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong class="text-dark d-block">${f.nombre}</strong>
                <small class="text-muted">$${f.costo_250ml}/250ml</small>
            </td>
            <td class="text-center">
                <input type="number" class="form-control form-control-sm text-center fw-bold input-frag-b250" data-idx="${idx}" data-id="${f.id}" value="${b250}" min="0" step="1">
            </td>
            <td class="text-center">
                <input type="number" class="form-control form-control-sm text-center fw-bold input-frag-b500" data-idx="${idx}" data-id="${f.id}" value="${b500}" min="0" step="1">
            </td>
            <td class="text-center">
                <input type="number" class="form-control form-control-sm text-center fw-bold input-frag-b1l" data-idx="${idx}" data-id="${f.id}" value="${b1l}" min="0" step="1">
            </td>
            <td class="text-end fw-bold text-dark total-frag-g-cell" id="total-frag-g-${idx}">
                ${totalG} g
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Live update total grams per row when inputs change
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            const idx = input.getAttribute('data-idx');
            const row = tbody.querySelectorAll('tr')[idx];
            if (row) {
                const val250 = parseInt(row.querySelector('.input-frag-b250').value) || 0;
                const val500 = parseInt(row.querySelector('.input-frag-b500').value) || 0;
                const val1l = parseInt(row.querySelector('.input-frag-b1l').value) || 0;
                const total = (val250 * 250) + (val500 * 500) + (val1l * 1000);
                document.getElementById(`total-frag-g-${idx}`).textContent = `${total} g`;
            }
        });
    });
}

function guardarFraganciasInsumoDesdeModal() {
    const tbody = document.getElementById('fragancias-insumo-tbody');
    if (!tbody) return;
    
    const currentState = getAppState();
    if (!currentState.insumos) currentState.insumos = {};
    
    const fragancias = currentState.fragancias || [];
    let updatedInsumosFrag = [];
    
    tbody.querySelectorAll('tr').forEach((row, idx) => {
        const f = fragancias[idx];
        if (!f) return;
        
        const b250 = Math.max(0, parseInt(row.querySelector('.input-frag-b250').value) || 0);
        const b500 = Math.max(0, parseInt(row.querySelector('.input-frag-b500').value) || 0);
        const b1l = Math.max(0, parseInt(row.querySelector('.input-frag-b1l').value) || 0);
        const totalG = (b250 * 250) + (b500 * 500) + (b1l * 1000);
        
        updatedInsumosFrag.push({
            id: f.id,
            nombre: f.nombre,
            botellas_250ml: b250,
            botellas_500ml: b500,
            botellas_1l: b1l,
            gramos_sueltos: 0,
            total_g: totalG
        });
    });
    
    currentState.insumos.fragancias = updatedInsumosFrag;
    saveAppState({ insumos: currentState.insumos });
    renderizarInsumosDashboard(currentState);
    
    const modalEl = document.getElementById('modalDetalleFraganciasInsumo');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
}

// ==========================================================================
// 4. DATATABLES.NET INITIALIZATION (CANDLE MOLDS)
// ==========================================================================

function inicializarTablaInventario(state) {
    const tableEl = $('#tabla-inventario');

    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
        if (settings.nTable.id !== 'tabla-inventario') return true;

        const currentProducts = getAppState().products;
        const product = currentProducts[dataIndex];
        if (!product) return true;

        const stock = parseInt(product.stock) || 0;
        const cera = (product.tipo_cera || 'malasia').toLowerCase();

        if (filtroActivo === 'all') return true;
        if (filtroActivo === 'low') return stock > 0 && stock < 5;
        if (filtroActivo === 'zero') return stock === 0;
        if (filtroActivo === 'malasia') return cera === 'malasia';
        if (filtroActivo === 'soya') return cera === 'soya';

        return true;
    });

    tablaInventarioDT = tableEl.DataTable({
        data: state.products,
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Buscar molde, cera, precio...",
            lengthMenu: "Mostrar _MENU_ productos",
            info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
            infoEmpty: "Mostrando 0 productos",
            infoFiltered: "(filtrado de _MAX_ productos en total)",
            zeroRecords: "No se encontraron moldes registrados",
            paginate: {
                first: '<i class="bi bi-chevron-double-left"></i>',
                previous: '<i class="bi bi-chevron-left"></i>',
                next: '<i class="bi bi-chevron-right"></i>',
                last: '<i class="bi bi-chevron-double-right"></i>'
            }
        },
        columns: [
            // 0: ID
            { 
                data: 'id', 
                type: 'num',
                className: 'fw-bold text-center',
                render: (data, type) => {
                    if (type === 'sort' || type === 'type') return parseInt(data);
                    return `<span class="badge bg-light text-dark border">#${data}</span>`;
                }
            },
            // 1: Name
            { 
                data: 'nombre', 
                className: 'fw-semibold text-dark',
                render: (data) => `<span class="product-name">${data}</span>`
            },
            // 1.5: Category
            {
                data: 'categoria',
                defaultContent: 'Sin Categoría / Complementaria',
                className: 'text-muted small',
                render: (data) => data || 'Sin Categoría / Complementaria'
            },
            // 2: Wax Type
            {
                data: 'tipo_cera',
                className: 'text-center',
                render: (data) => {
                    const ceraVal = (data || 'malasia').toLowerCase();
                    if (ceraVal === 'soya') {
                        return '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Cera Soya</span>';
                    }
                    return '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1">Cera Malasia</span>';
                }
            },
            // 3: Weight
            { 
                data: 'gramaje', 
                type: 'num',
                className: 'text-end',
                render: (data, type) => (type === 'sort' || type === 'type') ? parseFloat(data) : `${data} g`
            },
            // 4: Cost
            { 
                data: 'calculado.total_insumos', 
                type: 'num',
                className: 'text-end text-muted',
                render: (data, type) => (type === 'sort' || type === 'type') ? parseFloat(data) : `$${parseFloat(data).toFixed(2)}`
            },
            // 5: Sale Price
            { 
                data: 'precio_venta', 
                type: 'num',
                className: 'text-end fw-semibold',
                render: (data, type) => (type === 'sort' || type === 'type') ? parseFloat(data) : `$${parseFloat(data).toFixed(2)}`
            },
            // 6: Profit
            { 
                data: 'calculado.ganancia', 
                type: 'num',
                className: 'text-end text-success fw-semibold',
                render: (data, type) => (type === 'sort' || type === 'type') ? parseFloat(data) : `+$${parseFloat(data).toFixed(2)}`
            },
            // 7: Margin %
            { 
                data: 'calculado.porcentaje_margen', 
                type: 'num',
                className: 'text-end',
                render: (data, type) => {
                    const margin = parseFloat(data);
                    if (type === 'sort' || type === 'type') return margin;
                    
                    let badgeClass = "text-success bg-success-subtle border-success-subtle";
                    if (margin < 50) badgeClass = "text-danger bg-danger-subtle border-danger-subtle";
                    else if (margin < 70) badgeClass = "text-warning-emphasis bg-warning-subtle border-warning-subtle";

                    return `<span class="badge ${badgeClass} border px-2 py-1">${margin}%</span>`;
                }
            },
            // 8: Stock Stepper Controls
            { 
                data: 'stock', 
                type: 'num',
                className: 'text-center',
                orderable: true,
                render: (data, type, row) => {
                    const stock = parseInt(data) || 0;
                    if (type === 'sort' || type === 'type') return stock;

                    let badgeClass = "badge-optimal-stock";
                    if (stock === 0) badgeClass = "badge-out-of-stock";
                    else if (stock < 5) badgeClass = "badge-low-stock";

                    let desgloseHtml = "";
                    if (row.stock_por_color) {
                        const desgloseText = Object.entries(row.stock_por_color)
                            .filter(([c, q]) => q > 0)
                            .map(([c, q]) => `${c.charAt(0).toUpperCase() + c.slice(1)}: ${q}`)
                            .join('<br>');
                        if (desgloseText) {
                            desgloseHtml = `<div class="text-muted mt-1" style="font-size: 0.7rem; line-height: 1.1;">${desgloseText}</div>`;
                        }
                    }

                    return `
                        <div class="d-flex flex-column align-items-center justify-content-center">
                            <span class="badge ${badgeClass} px-2 py-1" style="min-width: 32px; font-size: 0.85rem;" id="stock-val-${row.id}">${stock}</span>
                            ${desgloseHtml}
                        </div>
                    `;
                }
            },
            // 9: Actions
            {
                data: 'id',
                className: 'text-center',
                orderable: false,
                render: (data) => `
                    <button type="button" class="btn btn-sm btn-outline-primary border-0 rounded-circle" onclick="abrirModalAjuste(${data})" title="Ajustar stock numérico">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                `
            }
        ],
        order: [[0, 'asc']]
    });
}

// ==========================================================================
// 5. ATOMIC ALU STOCK CONTROLLER
// ==========================================================================

window.actualizarStockRapido = function(productId, delta) {
    const state = getAppState();
    const product = state.products.find(p => p.id === productId);
    
    if (product) {
        if (!product.stock_por_color) {
            product.stock_por_color = { base: parseInt(product.stock) || 0 };
        }
        product.stock_por_color['base'] = Math.max(0, (parseInt(product.stock_por_color['base']) || 0) + delta);
        
        const nuevoStock = Object.values(product.stock_por_color).reduce((sum, qty) => sum + qty, 0);
        product.stock = nuevoStock;

        saveAppState({ products: state.products });
        actualizarTelemetriaInventario(state);

        if (tablaInventarioDT) {
            tablaInventarioDT.rows().every(function() {
                const rowData = this.data();
                if (rowData.id === productId) {
                    rowData.stock = nuevoStock;
                    this.data(rowData).draw(false);
                }
            });
        }
    }
};

window.abrirModalAjuste = function(productId) {
    const state = getAppState();
    const product = state.products.find(p => p.id === productId);
    
    if (product) {
        if (!product.stock_por_color) {
            product.stock_por_color = { base: parseInt(product.stock) || 0 };
        }
        
        document.getElementById('ajuste-prod-id').value = product.id;
        document.getElementById('ajuste-prod-nombre').textContent = `Molde: #${product.id} - ${product.nombre}`;
        
        const colorSelect = document.getElementById('ajuste-prod-color');
        colorSelect.value = 'base'; // reset modal select
        document.getElementById('ajuste-prod-stock-input').value = product.stock_por_color['base'] || 0;
        
        colorSelect.onchange = function() {
            document.getElementById('ajuste-prod-stock-input').value = product.stock_por_color[this.value] || 0;
        };

        const modal = new bootstrap.Modal(document.getElementById('modalAjustarStock'));
        modal.show();
    }
};

// ==========================================================================
// 6. FILTER CONTROLLERS
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
// 7. MODALS CONTROLLER
// ==========================================================================

function configurarEventosModales() {
    const btnGuardarAjuste = document.getElementById('btn-guardar-ajuste-stock');
    if (btnGuardarAjuste) {
        btnGuardarAjuste.addEventListener('click', () => {
            const prodId = parseInt(document.getElementById('ajuste-prod-id').value);
            const nuevoStock = parseInt(document.getElementById('ajuste-prod-stock-input').value) || 0;

            const state = getAppState();
            const product = state.products.find(p => p.id === prodId);

            if (product) {
                if (!product.stock_por_color) {
                    product.stock_por_color = { base: parseInt(product.stock) || 0 };
                }
                const color = document.getElementById('ajuste-prod-color').value;
                product.stock_por_color[color] = Math.max(0, nuevoStock);
                
                product.stock = Object.values(product.stock_por_color).reduce((sum, qty) => sum + qty, 0);
                
                saveAppState({ products: state.products });
                actualizarTelemetriaInventario(state);

                if (tablaInventarioDT) {
                    tablaInventarioDT.rows().every(function() {
                        const rowData = this.data();
                        if (rowData.id === prodId) {
                            rowData.stock = product.stock;
                            rowData.stock_por_color = product.stock_por_color;
                            this.data(rowData).draw(false);
                        }
                    });
                }

                const modalEl = document.getElementById('modalAjustarStock');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }
        });
    }

    const btnGuardarNuevo = document.getElementById('btn-guardar-nuevo-producto');
    if (btnGuardarNuevo) {
        btnGuardarNuevo.addEventListener('click', () => {
            const nombre = document.getElementById('nuevo-prod-nombre').value.trim();
            const categoria = document.getElementById('nuevo-prod-categoria').value;
            const tipoCera = document.getElementById('nuevo-prod-cera').value || 'malasia';
            const gramaje = parseFloat(document.getElementById('nuevo-prod-gramaje').value);
            const precio = parseFloat(document.getElementById('nuevo-prod-precio').value);
            const stock = parseInt(document.getElementById('nuevo-prod-stock').value) || 0;

            if (!nombre || isNaN(gramaje) || isNaN(precio)) {
                alert("Por favor completa los campos obligatorios.");
                return;
            }

            const state = getAppState();
            const maxId = state.products.reduce((max, p) => p.id > max ? p.id : max, 0);
            const newId = maxId + 1;

            const calculated = calcularValoresVela(gramaje, precio, { tipoCera }, state.config);

            const nuevoProd = {
                id: newId,
                nombre: nombre,
                categoria: categoria,
                gramaje: gramaje,
                precio_venta: precio,
                stock: Math.max(0, stock),
                stock_por_color: { base: Math.max(0, stock) },
                tipo_cera: tipoCera,
                calculado: calculated
            };

            state.products.push(nuevoProd);
            state.products.sort((a, b) => a.id - b.id);

            saveAppState({ products: state.products });

            if (tablaInventarioDT) {
                tablaInventarioDT.clear();
                tablaInventarioDT.rows.add(state.products);
                tablaInventarioDT.draw();
            }

            actualizarTelemetriaInventario(state);

            document.getElementById('form-nuevo-producto').reset();
            const modalEl = document.getElementById('modalNuevoProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            alert(`¡Molde #${newId} "${nombre}" registrado exitosamente!`);
        });
    }
}

// ==========================================================================
// 8. EXCEL SYNC CONTROLLER (3 SHEETS: COSTEO, FRAGANCIAS, INSUMOS)
// ==========================================================================

function configurarExportacionExcel() {
    const btnExportar = document.getElementById('btn-exportar-excel');
    if (!btnExportar) return;

    btnExportar.addEventListener('click', () => {
        try {
            const state = getAppState();
            const config = state.config;
            const insumos = state.insumos || {};

            // -------------------------------------------------------------
            // SHEET 1: Costeo Velas (Candles Catalog & Parameters)
            // -------------------------------------------------------------
            const ceraMalasiaCosto = Number((config.costo_cera_malasia_g || 0.06873).toFixed(5));
            const ceraSoyaCosto = Number((config.costo_cera_soya_g || 0.14).toFixed(4));
            const fraganciaCosto = Number((config.costo_fragancia_g || 1.1714).toFixed(4));

            let wsDataCosteo = [
                ["ID", "Nombre", "Gramaje Total (g)", "Cera (g)", "% Cera", "Fragancia (g)", "% Fragancia", "Aditivo (g)", "% Aditivo", "Precio Venta ($)", "Costo Insumos ($)", "Parámetro", "Valor"],
                ["", "", "", "", "", "", "", "", "", "", "", "Cera Malasia $/g", ceraMalasiaCosto],
                ["", "", "", "", "", "", "", "", "", "", "", "Cera Soya $/g", ceraSoyaCosto],
                ["", "", "", "", "", "", "", "", "", "", "", "Fragancia $/g", fraganciaCosto],
                ["", "", "", "", "", "", "", "", "", "", "", "% Fragancia", config.pct_fragancia || 0.08],
                ["", "", "", "", "", "", "", "", "", "", "", "% Aditivo", config.pct_aditivo || 0.02],
                ["", "", "", "", "", "", "", "", "", "", "", "Pabilo", config.costo_pabilo || 0.50]
            ];

            state.products.forEach((p, idx) => {
                const rowNum = idx + 2; // Row number in Excel (1-indexed, header is row 1)
                const c = p.calculado;
                const esSoya = (p.tipo_cera || 'malasia') === 'soya';
                const ceraParamCell = esSoya ? "$M$3" : "$M$2";

                const rowData = [
                    p.id,
                    p.nombre,
                    p.gramaje,
                    c.cera_g,
                    `=1-G${rowNum}-I${rowNum}`,
                    c.fragancia_g,
                    config.pct_fragancia,
                    c.aditivo_g,
                    config.pct_aditivo,
                    p.precio_venta,
                    `=(D${rowNum}*${ceraParamCell})+(F${rowNum}*$M$4)+$M$7`
                ];

                if (idx < wsDataCosteo.length - 1) {
                    for (let col = 0; col < 11; col++) {
                        wsDataCosteo[idx + 1][col] = rowData[col];
                    }
                } else {
                    wsDataCosteo.push(rowData);
                }
            });

            // -------------------------------------------------------------
            // SHEET 2: Fragancias (Fragrance Catalog & Costs)
            // -------------------------------------------------------------
            let wsDataFragancias = [
                ["ID", "Nombre Fragancia", "Costo por 250ml ($)", "Costo $/g"]
            ];
            state.fragancias.forEach(f => {
                wsDataFragancias.push([
                    f.id,
                    f.nombre,
                    f.costo_250ml,
                    f.costo_g
                ]);
            });

            // -------------------------------------------------------------
            // SHEET 3: Insumos (Raw Materials: Wax, Fragrance Bottles, Monthly Supplies)
            // -------------------------------------------------------------
            const ceraMalasiaG = parseFloat(insumos.cera_malasia_g) || 0;
            const ceraSoyaG = parseFloat(insumos.cera_soya_g) || 0;

            let wsDataInsumos = [
                ["Insumo / Concepto", "Tipo / Categoría", "Cantidad (Gramos)", "Cantidad (Kilogramos / Litros)", "Presentación / Botellas", "Notas"],
                ["Cera Malasia", "Cera para Moldes", ceraMalasiaG, Number((ceraMalasiaG / 1000).toFixed(2)), "A granel (kg)", "Cera base para todos los moldes"],
                ["Cera de Soya", "Cera para Bouquets", ceraSoyaG, Number((ceraSoyaG / 1000).toFixed(2)), "A granel (kg)", "Cera para arreglos florales"],
                ["--- FRAGANCIAS EN STOCK ---", "---", "---", "---", "---", "---"]
            ];

            (insumos.fragancias || []).forEach(f => {
                const b250 = parseInt(f.botellas_250ml) || 0;
                const b500 = parseInt(f.botellas_500ml) || 0;
                const b1l = parseInt(f.botellas_1l) || 0;
                const totalG = parseFloat(f.total_g) || 0;
                const botellasStr = `${b250}x 250ml | ${b500}x 500ml | ${b1l}x 1L`;

                wsDataInsumos.push([
                    f.nombre,
                    "Fragancia Concentrada",
                    totalG,
                    Number((totalG / 1000).toFixed(3)),
                    botellasStr,
                    "Aroma para velas"
                ]);
            });

            wsDataInsumos.push(["--- INSUMOS MENORES FIJOS ---", "---", "---", "---", "---", "---"]);
            wsDataInsumos.push([
                "Aditivos, Pabilos y Colorantes",
                "Gasto Operativo Mensual",
                "-",
                "-",
                "Restock Continuo",
                "Considerado como costo operativo mensual de taller no significativo"
            ]);

            // Build Workbook with 3 Sheets
            const wb = XLSX.utils.book_new();

            const wsCosteo = XLSX.utils.aoa_to_sheet(wsDataCosteo);
            XLSX.utils.book_append_sheet(wb, wsCosteo, "Costeo Velas");

            const wsFragancias = XLSX.utils.aoa_to_sheet(wsDataFragancias);
            XLSX.utils.book_append_sheet(wb, wsFragancias, "Fragancias");

            const wsInsumos = XLSX.utils.aoa_to_sheet(wsDataInsumos);
            XLSX.utils.book_append_sheet(wb, wsInsumos, "Insumos");

            const today = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `Costeo_Velas_Actualizado_${today}.xlsx`);

        } catch (error) {
            console.error(error);
            alert("Error al exportar archivo Excel: " + error.message);
        }
    });
}

function configurarResetStockBoton() {
    const btnZero = document.getElementById('btn-zero-stock');
    if (!btnZero) return;

    btnZero.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que deseas poner el stock de todas las velas en 0 unidades?")) {
            const state = getAppState();
            state.products.forEach(p => p.stock = 0);

            saveAppState({ products: state.products });
            actualizarTelemetriaInventario(state);

            if (tablaInventarioDT) {
                tablaInventarioDT.rows().every(function() {
                    const rowData = this.data();
                    rowData.stock = 0;
                    this.data(rowData).draw(false);
                });
            }
        }
    });
}
