/**
 * VELISIMA - Candle Inventory & Cost Control
 * Phase 3: Order Tracking, Quotes & Sales History Dashboard
 * + Delivery Scheduling & High-Volume Smart Alert Engine
 * 
 * Engineering Analogy:
 * - This file acts as the TRANSACTION CONTROLLER & REAL-TIME INTERRUPT CONTROLLER.
 * - Delivery dates allow scheduling batch production prior to deadlines.
 * - Orders with > 10 candles trigger a High-Volume Priority Interrupt (Alerta de Alto Volumen)
 *   alerting the user to check raw inventory supply.
 */

// Global references
let tablaPedidosDT = null;
let filtroEstadoActivo = 'all';     // 'all' | 'pendiente' | 'entregado' | 'cancelado'
let filtroPeriodoActivo = 'all';    // 'all' | 'semanal' | 'quincenal' | 'mensual'
let filtroFechaExacta = '';         // 'YYYY-MM-DD' or ''

let itemsNuevoPedido = [];

// ==========================================================================
// 1. INITIALIZATION ON DOM READY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.firebaseStateReady) {
        window.firebaseStateReady.then(iniciarPedidos);
    } else {
        iniciarPedidos();
    }
    
    function iniciarPedidos() {
        const state = getAppState();
        verificarAlertasAltoVolumen(state);
        renderizarTablaCotizaciones(state);
        inicializarTablaPedidos(state);
        configurarFiltrosPedidos();
        configurarFiltrosPeriodo();
        configurarFiltroFechaExacta();
        actualizarTelemetriaPeriodo(state);
        configurarConstructorPedido(state);
        configurarExportacionPedidosExcel();
    }
    
    window.addEventListener('firebaseUpdate', () => {
        const state = getAppState();
        verificarAlertasAltoVolumen(state);
        renderizarTablaCotizaciones(state);
        actualizarTelemetriaPeriodo(state);
        if ($('#tabla-pedidos').length > 0) {
            $('#tabla-pedidos').DataTable().clear().rows.add(state.orders || []).draw(false);
        }
    });
});

// ==========================================================================
// 2. TELEMETRY & PERIOD METRICS ENGINE
// ==========================================================================

function actualizarTelemetriaPeriodo(state) {
    const orders = state.orders || [];
    const quotes = state.quotes || [];
    
    let totalVentasPeriodo = 0;
    let totalGananciaPeriodo = 0;
    let pedidosFiltradosCount = 0;
    
    let pedidosPendientes = 0;
    let pedidosEntregados = 0;
    let pedidosCancelados = 0;
    
    const hoy = new Date();
    const hoyTimestamp = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
    
    orders.forEach(o => {
        const estado = (o.estado || 'pendiente').toLowerCase();
        const total = parseFloat(o.total) || 0;
        const ganancia = parseFloat(o.ganancia_total !== undefined ? o.ganancia_total : (total * 0.75)) || 0;
        
        if (estado === 'pendiente') pedidosPendientes++;
        else if (estado === 'entregado') pedidosEntregados++;
        else if (estado === 'cancelado') pedidosCancelados++;
        
        if (evaluarFiltroPeriodo(o.fecha, hoyTimestamp) && evaluarFiltroFechaExacta(o.fecha)) {
            pedidosFiltradosCount++;
            if (estado !== 'cancelado') {
                totalVentasPeriodo += total;
                totalGananciaPeriodo += ganancia;
            }
        }
    });
    
    const margenPromedio = totalVentasPeriodo > 0 ? ((totalGananciaPeriodo / totalVentasPeriodo) * 100).toFixed(1) : "0.0";
    
    document.getElementById('stat-periodo-ventas').textContent = `$${totalVentasPeriodo.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stat-periodo-ganancia').textContent = `+$${totalGananciaPeriodo.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('stat-periodo-margen').textContent = `${margenPromedio}%`;
    document.getElementById('stat-periodo-pedidos-count').textContent = `${pedidosFiltradosCount} pedidos en periodo`;
    
    const statCotizaciones = document.getElementById('stat-cotizaciones-activas');
    if (statCotizaciones) statCotizaciones.textContent = quotes.length;
    
    const badgeCotizaciones = document.getElementById('badge-total-cotizaciones');
    if (badgeCotizaciones) badgeCotizaciones.textContent = `${quotes.length} Activas`;
    
    document.getElementById('count-filtro-pedidos-all').textContent = orders.length;
    document.getElementById('count-filtro-pedidos-pend').textContent = pedidosPendientes;
    document.getElementById('count-filtro-pedidos-entr').textContent = pedidosEntregados;
    document.getElementById('count-filtro-pedidos-canc').textContent = pedidosCancelados;
}

function evaluarFiltroPeriodo(fechaStr, hoyTimestamp) {
    if (!fechaStr || filtroPeriodoActivo === 'all') return true;
    
    const fechaLimpia = fechaStr.slice(0, 10);
    const partes = fechaLimpia.split('-');
    if (partes.length < 3) return true;
    
    const fechaOrder = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2])).getTime();
    const diffDias = (hoyTimestamp - fechaOrder) / (1000 * 60 * 60 * 24);
    
    if (filtroPeriodoActivo === 'semanal') return diffDias >= 0 && diffDias <= 7;
    if (filtroPeriodoActivo === 'quincenal') return diffDias >= 0 && diffDias <= 15;
    if (filtroPeriodoActivo === 'mensual') return diffDias >= 0 && diffDias <= 30;
    
    return true;
}

function evaluarFiltroFechaExacta(fechaStr) {
    if (!filtroFechaExacta) return true;
    if (!fechaStr) return false;
    return fechaStr.slice(0, 10) === filtroFechaExacta;
}

// ==========================================================================
// 3. ACTIVE QUOTES TABLE CONTROLLER
// ==========================================================================

function renderizarTablaCotizaciones(state) {
    const tbody = document.getElementById('cotizaciones-tbody');
    if (!tbody) return;
    
    const quotes = state.quotes || [];
    
    if (quotes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4 small">
                    <i class="bi bi-folder2-open d-block fs-4 text-muted mb-1"></i>
                    No hay cotizaciones activas en este momento. Puedes crear una desde la calculadora del <a href="index.html" class="text-decoration-underline">Dashboard</a>.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    quotes.forEach(q => {
        const cleanTel = (q.telefono || '').replace(/\D/g, '');
        const cleanDate = (q.fecha || '').slice(0, 10);
        const waLink = cleanTel ? `https://wa.me/52${cleanTel}?text=Hola%20${encodeURIComponent(q.cliente || '')},%20te%20enviamos%20tu%20cotizaci%C3%B3n%20%23${encodeURIComponent(q.folio || '')}%20de%20Velisima` : '';
        
        const itemsStr = (q.items || []).map(i => `
            <span class="item-tag-pill">
                <strong>${i.cantidad}x</strong> ${i.nombre}
                <small class="text-muted ms-1">(${i.fragancia})</small>
            </span>
        `).join('');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-bold"><span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">#${q.folio || ('COT-' + q.id)}</span></td>
            <td class="small fw-semibold text-dark">${cleanDate}</td>
            <td class="fw-bold text-dark">${q.cliente}</td>
            <td>
                ${cleanTel ? `
                    <a href="${waLink}" target="_blank" class="btn btn-sm btn-whatsapp rounded-pill px-2 py-1" style="font-size: 0.78rem;">
                        <i class="bi bi-whatsapp me-1"></i> ${q.telefono}
                    </a>
                ` : '<span class="text-muted small">Sin teléfono</span>'}
            </td>
            <td>${itemsStr}</td>
            <td class="text-end fw-bold text-dark">$${parseFloat(q.total || 0).toFixed(2)}</td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary border-0 rounded-circle" onclick="verCotizacionCliente(${q.id})" title="Ver / Compartir Cotización (Vista Cliente sin márgenes)">
                        <i class="bi bi-eye-fill"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary border-0 rounded-circle" onclick="editarCotizacion(${q.id})" title="Editar Cotización">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success border-0 rounded-circle" onclick="aprobarCotizacionGlobal(${q.id})" title="Aprobar y Convertir en Pedido Oficial">
                        <i class="bi bi-check2-circle"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger border-0 rounded-circle" onclick="eliminarCotizacion(${q.id})" title="Eliminar Cotización">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.eliminarCotizacion = function(quoteId) {
    const state = getAppState();
    const quote = (state.quotes || []).find(q => q.id === quoteId);
    if (!quote) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar la cotización #${quote.folio} de "${quote.cliente}"?`)) {
        state.quotes = state.quotes.filter(q => q.id !== quoteId);
        saveAppState({ quotes: state.quotes });
        recargarVistaPedidos(state);
    }
};

// ==========================================================================
// 4. DATATABLES INITIALIZATION WITH DELIVERY DATE & HIGH-VOLUME BADGES
// ==========================================================================

function inicializarTablaPedidos(state) {
    const tableEl = $('#tabla-pedidos');
    
    $.fn.dataTable.ext.search.push((settings, data, dataIndex) => {
        if (settings.nTable.id !== 'tabla-pedidos') return true;
        
        const currentOrders = getAppState().orders || [];
        const order = currentOrders[dataIndex];
        if (!order) return true;
        
        const estado = (order.estado || 'pendiente').toLowerCase();
        
        if (filtroEstadoActivo !== 'all' && estado !== filtroEstadoActivo) return false;
        if (!evaluarFiltroFechaExacta(order.fecha)) return false;
        
        const hoy = new Date();
        const hoyTimestamp = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
        if (!evaluarFiltroPeriodo(order.fecha, hoyTimestamp)) return false;
        
        return true;
    });

    tablaPedidosDT = tableEl.DataTable({
        data: state.orders || [],
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
        language: {
            search: "_INPUT_",
            searchPlaceholder: "Buscar cliente, folio, vela...",
            lengthMenu: "Mostrar _MENU_ pedidos",
            info: "Mostrando _START_ a _END_ de _TOTAL_ pedidos",
            infoEmpty: "Mostrando 0 pedidos",
            infoFiltered: "(filtrado de _MAX_ pedidos en total)",
            zeroRecords: "No se encontraron órdenes registradas para los filtros seleccionados",
            paginate: {
                first: '<i class="bi bi-chevron-double-left"></i>',
                previous: '<i class="bi bi-chevron-left"></i>',
                next: '<i class="bi bi-chevron-right"></i>',
                last: '<i class="bi bi-chevron-double-right"></i>'
            }
        },
        columns: [
            // 0: Folio
            {
                data: 'folio',
                className: 'fw-bold text-center',
                render: (data, type, row) => `<span class="badge bg-light text-dark border">#${data || ('PED-' + row.id)}</span>`
            },
            // 1: Creation Date & Scheduled Delivery Date (Requirement 4)
            {
                data: 'fecha',
                className: 'small',
                render: (data, type, row) => {
                    const cleanFecha = (data || '').slice(0, 10);
                    const cleanEntrega = (row.fecha_entrega || '').slice(0, 10);
                    
                    return `
                        <div><strong class="text-dark">${cleanFecha}</strong></div>
                        ${cleanEntrega ? `
                            <div class="mt-1" style="font-size: 0.76rem;">
                                <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                                    <i class="bi bi-truck me-1"></i>Entrega: ${cleanEntrega}
                                </span>
                            </div>
                        ` : ''}
                    `;
                }
            },
            // 2: Customer Name
            {
                data: 'cliente',
                className: 'fw-bold text-dark',
                render: (data) => `
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-person-circle text-primary"></i>
                        <span>${data || 'Sin nombre'}</span>
                    </div>
                `
            },
            // 3: Contact / WhatsApp Button
            {
                data: 'telefono',
                render: (data, type, row) => {
                    if (!data) return `<span class="text-muted small">Sin teléfono</span>`;
                    const cleanTel = data.replace(/\D/g, '');
                    const cleanDate = (row.fecha || '').slice(0, 10);
                    const waLink = `https://wa.me/52${cleanTel}?text=Hola%20${encodeURIComponent(row.cliente || '')},%20te%20contactamos%20de%20Velisima%20respecto%20a%20tu%20pedido%20%23${encodeURIComponent(row.folio || '')}%20(${cleanDate})`;
                    return `
                        <a href="${waLink}" target="_blank" class="btn btn-sm btn-whatsapp rounded-pill px-2 py-1 small" title="Enviar WhatsApp al cliente">
                            <i class="bi bi-whatsapp me-1"></i> ${data}
                        </a>
                    `;
                }
            },
            // 4: Candles Summary List with High-Volume indicator badge
            {
                data: 'items',
                render: (data) => {
                    if (!data || data.length === 0) return `<span class="text-muted small">Sin artículos</span>`;
                    
                    const totalVelas = data.reduce((sum, item) => sum + (parseInt(item.cantidad) || 0), 0);
                    const isHighVolume = totalVelas > 10;
                    
                    const itemsHtml = data.map(item => `
                        <span class="item-tag-pill">
                            <strong>${item.cantidad}x</strong> ${item.nombre} 
                            <small class="text-muted ms-1">(${item.fragancia || 'S/A'})</small>
                        </span>
                    `).join('');
                    
                    return `
                        <div>
                            ${itemsHtml}
                            ${isHighVolume ? `
                                <div class="mt-1">
                                    <span class="badge bg-danger text-white py-1 px-2" style="font-size: 0.72rem;">
                                        <i class="bi bi-fire me-1"></i>Alto Volumen (${totalVelas} velas)
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            },
            // 5: Total Sale Price (Numeric Sortable)
            {
                data: 'total',
                type: 'num',
                className: 'text-end fw-bold text-dark',
                render: (data, type) => {
                    const val = parseFloat(data || 0);
                    if (type === 'sort' || type === 'type') return val;
                    return `<span class="fs-6">$${val.toFixed(2)}</span>`;
                }
            },
            // 6: Net Profit / Gain (Numeric Sortable)
            {
                data: 'ganancia_total',
                type: 'num',
                className: 'text-end fw-semibold text-success',
                render: (data, type, row) => {
                    const total = parseFloat(row.total || 0);
                    const val = parseFloat(data !== undefined ? data : (total * 0.75));
                    if (type === 'sort' || type === 'type') return val;
                    return `+$${val.toFixed(2)}`;
                }
            },
            // 7: Profit Margin % (Numeric Sortable)
            {
                data: 'id',
                type: 'num',
                className: 'text-end',
                render: (data, type, row) => {
                    const total = parseFloat(row.total || 0);
                    const ganancia = parseFloat(row.ganancia_total !== undefined ? row.ganancia_total : (total * 0.75));
                    const marginPct = total > 0 ? (ganancia / total) * 100 : 0;
                    
                    if (type === 'sort' || type === 'type') return marginPct;
                    
                    let badgeClass = "text-success bg-success-subtle border-success-subtle";
                    if (marginPct < 50) badgeClass = "text-danger bg-danger-subtle border-danger-subtle";
                    else if (marginPct < 70) badgeClass = "text-warning-emphasis bg-warning-subtle border-warning-subtle";
                    
                    return `<span class="badge ${badgeClass} border px-2 py-1">${marginPct.toFixed(1)}%</span>`;
                }
            },
            // 8: Status with Direct State Switcher
            {
                data: 'estado',
                className: 'text-center',
                render: (data, type, row) => {
                    const est = (data || 'pendiente').toLowerCase();
                    
                    let selectBg = 'bg-warning-subtle text-warning-emphasis border-warning-subtle';
                    if (est === 'entregado') selectBg = 'bg-success-subtle text-success border-success-subtle';
                    else if (est === 'cancelado') selectBg = 'bg-secondary-subtle text-secondary border-secondary-subtle';
                    
                    return `
                        <select class="form-select form-select-sm fw-semibold ${selectBg} py-1 px-2" style="font-size: 0.8rem; border-radius: 20px;" onchange="cambiarEstadoPedidoDirecto(${row.id}, this.value)">
                            <option value="pendiente" ${est === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                            <option value="entregado" ${est === 'entregado' ? 'selected' : ''}>✅ Entregado</option>
                            <option value="cancelado" ${est === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                        </select>
                    `;
                }
            },
            // 9: Actions
            {
                data: 'id',
                className: 'text-center',
                orderable: false,
                render: (data, type, row) => {
                    const est = (row.estado || 'pendiente').toLowerCase();
                    const btnEditar = est === 'pendiente' ? `
                        <button type="button" class="btn btn-outline-secondary border-0 rounded-circle" onclick="editarPedido(${data})" title="Editar Pedido">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    ` : '';
                    
                    return `
                    <div class="btn-group btn-group-sm">
                        ${btnEditar}
                        <button type="button" class="btn btn-outline-primary border-0 rounded-circle" onclick="verDetallePedido(${data})" title="Ver detalles del pedido">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger border-0 rounded-circle" onclick="eliminarPedido(${data})" title="Eliminar pedido">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                    `;
                }
            }
        ],
        order: [[0, 'desc']]
    });
}

// ==========================================================================
// 5. ATOMIC TRANSACTION CONTROLLER & LOGIC COUPLING
// ==========================================================================

function cambiarEstadoPedido(orderId, nuevoEstado) {
    const state = getAppState();
    const order = state.orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const estadoAnterior = (order.estado || 'pendiente').toLowerCase();
    const estadoDestino = nuevoEstado.toLowerCase();
    
    if (estadoAnterior === estadoDestino) return;
    
    if (estadoDestino === 'entregado' && !order.stock_descontado) {
        let itemsSinStock = [];
        
        (order.items || []).forEach(item => {
            const prod = state.products.find(p => p.id === item.producto_id);
            if (prod) {
                const stockActual = parseInt(prod.stock) || 0;
                if (stockActual < item.cantidad) {
                    itemsSinStock.push(`${prod.nombre} (Stock actual: ${stockActual}, Solicitado: ${item.cantidad})`);
                }
                prod.stock = Math.max(0, stockActual - item.cantidad);
            }
        });
        
        order.stock_descontado = true;
        
        if (itemsSinStock.length > 0) {
            alert(`⚠️ Aviso de Inventario: El stock era insuficiente para los siguientes artículos:\n- ${itemsSinStock.join('\n- ')}\n\nEl stock se ha ajustado a 0 unidades.`);
        }
    } else if (estadoAnterior === 'entregado' && (estadoDestino === 'pendiente' || estadoDestino === 'cancelado') && order.stock_descontado) {
        (order.items || []).forEach(item => {
            const prod = state.products.find(p => p.id === item.producto_id);
            if (prod) {
                const stockActual = parseInt(prod.stock) || 0;
                prod.stock = stockActual + item.cantidad;
            }
        });
        
        order.stock_descontado = false;
    }
    
    order.estado = estadoDestino;
    
    saveAppState({
        products: state.products,
        orders: state.orders
    });
    
    recargarVistaPedidos(state);
    verificarAlertasAltoVolumen(state);
}

window.cambiarEstadoPedidoDirecto = function(orderId, nuevoEstado) {
    cambiarEstadoPedido(orderId, nuevoEstado);
};

function recargarVistaPedidos(state = getAppState()) {
    actualizarTelemetriaPeriodo(state);
    renderizarTablaCotizaciones(state);
    verificarAlertasAltoVolumen(state);
    
    if (tablaPedidosDT) {
        tablaPedidosDT.clear();
        tablaPedidosDT.rows.add(state.orders || []);
        tablaPedidosDT.draw(false);
    }
}

// ==========================================================================
// 6. FILTER CONTROLLERS (Status, Presets & Exact Date)
// ==========================================================================

function configurarFiltrosPedidos() {
    const container = document.getElementById('filtro-pedidos-grupo');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        
        container.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        filtroEstadoActivo = btn.getAttribute('data-filter');
        if (tablaPedidosDT) {
            tablaPedidosDT.draw();
        }
        actualizarTelemetriaPeriodo(getAppState());
    });
}

function configurarFiltrosPeriodo() {
    const container = document.getElementById('filtro-periodo-grupo');
    if (!container) return;
    
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-period]');
        if (!btn) return;
        
        container.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        filtroPeriodoActivo = btn.getAttribute('data-period');
        
        const inputFecha = document.getElementById('filtro-fecha-exacta');
        if (inputFecha && filtroPeriodoActivo !== 'all') {
            inputFecha.value = '';
            filtroFechaExacta = '';
        }
        
        if (tablaPedidosDT) {
            tablaPedidosDT.draw();
        }
        actualizarTelemetriaPeriodo(getAppState());
    });
}

function configurarFiltroFechaExacta() {
    const inputFecha = document.getElementById('filtro-fecha-exacta');
    const btnLimpiar = document.getElementById('btn-limpiar-fecha');
    
    if (inputFecha) {
        inputFecha.addEventListener('change', () => {
            filtroFechaExacta = inputFecha.value;
            
            if (filtroFechaExacta) {
                const container = document.getElementById('filtro-periodo-grupo');
                if (container) {
                    container.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                    const btnAll = container.querySelector('button[data-period="all"]');
                    if (btnAll) btnAll.classList.add('active');
                    filtroPeriodoActivo = 'all';
                }
            }
            
            if (tablaPedidosDT) {
                tablaPedidosDT.draw();
            }
            actualizarTelemetriaPeriodo(getAppState());
        });
    }
    
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (inputFecha) inputFecha.value = '';
            filtroFechaExacta = '';
            if (tablaPedidosDT) {
                tablaPedidosDT.draw();
            }
            actualizarTelemetriaPeriodo(getAppState());
        });
    }
}

// ==========================================================================
// 7. ORDER BUILDER MODAL CONTROLLER (With Delivery Date Capture)
// ==========================================================================

function configurarConstructorPedido(state) {
    const selectVela = document.getElementById('pedido-item-vela');
    const selectCera = document.getElementById('pedido-item-cera');
    const selectFrag = document.getElementById('pedido-item-fragancia');
    const inputCant = document.getElementById('pedido-item-cant');
    const inputPrecio = document.getElementById('pedido-item-precio');
    const stockInfoBadge = document.getElementById('pedido-item-stock-info');
    const btnAgregarItem = document.getElementById('btn-agregar-item-pedido');
    const tbodyItems = document.getElementById('pedido-items-tbody');
    const totalDisplay = document.getElementById('pedido-total-display');
    const btnGuardarPedido = document.getElementById('btn-guardar-pedido');
    
    if (!selectVela) return;
    
    selectVela.innerHTML = '<option value="" disabled selected>Selecciona un molde...</option>';
    state.products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.nombre} (${p.gramaje}g) - $${p.precio_venta}`;
        selectVela.appendChild(opt);
    });
    
    selectFrag.innerHTML = '<option value="" disabled selected>Selecciona aroma...</option>';
    state.fragancias.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.nombre;
        opt.textContent = f.nombre;
        selectFrag.appendChild(opt);
    });
    
    // Inicializar Select2 para búsqueda dentro del modal
    if ($.fn.select2) {
        $(selectVela).select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#modalNuevoPedido')
        });
    }
    
    // Si es select2 se debe usar el evento de JQuery
    if ($.fn.select2) {
        $(selectVela).on('select2:select', function (e) {
            triggerVelaChange();
        });
    } else {
        selectVela.addEventListener('change', triggerVelaChange);
    }
    
    function triggerVelaChange() {
        const prodId = parseInt(selectVela.value);
        const prod = state.products.find(p => p.id === prodId);
        if (prod) {
            inputPrecio.value = prod.precio_venta;
            selectCera.value = prod.tipo_cera || 'malasia';
            
            const stock = parseInt(prod.stock) || 0;
            stockInfoBadge.textContent = `${stock} uds en almacén`;
            stockInfoBadge.className = stock > 0 ? 'badge bg-success-subtle text-success border' : 'badge bg-danger-subtle text-danger border';
        }
    }
    
    btnAgregarItem.addEventListener('click', () => {
        const prodId = parseInt(selectVela.value);
        const tipoCera = selectCera.value || 'malasia';
        const fraganciaNombre = selectFrag.value;
        const colorVela = document.getElementById('pedido-item-color').value || 'base';
        const cant = parseInt(inputCant.value);
        const precioUnit = parseFloat(inputPrecio.value);
        
        if (isNaN(prodId)) {
            alert("Por favor selecciona una vela/molde.");
            return;
        }
        if (!fraganciaNombre) {
            alert("Por favor selecciona una fragancia/aroma.");
            return;
        }
        if (isNaN(cant) || cant <= 0) {
            alert("Por favor ingresa una cantidad válida.");
            return;
        }
        if (isNaN(precioUnit) || precioUnit < 0) {
            alert("Por favor ingresa un precio unitario válido.");
            return;
        }
        
        const prodObj = state.products.find(p => p.id === prodId);
        const fragObj = state.fragancias.find(f => f.nombre === fraganciaNombre) || { costo_g: 0.70 };
        
        const calc = calcularValoresVela(
            prodObj.gramaje,
            precioUnit,
            { tipoCera, pctFragancia: 0.08, costoFraganciaG: fragObj.costo_g },
            state.config
        );
        
        const subtotal = precioUnit * cant;
        const costoSubtotal = calc.total_insumos * cant;
        
        itemsNuevoPedido.push({
            producto_id: prodObj.id,
            nombre: prodObj.nombre,
            gramaje: prodObj.gramaje,
            tipo_cera: tipoCera,
            fragancia: fraganciaNombre,
            color: colorVela,
            cantidad: cant,
            precio_unitario: precioUnit,
            costo_unitario: calc.total_insumos,
            subtotal: subtotal,
            costo_subtotal: costoSubtotal
        });
        
        selectVela.value = "";
        selectFrag.value = "";
        inputCant.value = "1";
        inputPrecio.value = "";
        stockInfoBadge.textContent = "0 uds disponibles";
        stockInfoBadge.className = "badge bg-light text-dark border";
        
        actualizarTablaItemsNuevoPedido();
    });
    
    document.getElementById('pedido-descuento-global').addEventListener('input', actualizarTablaItemsNuevoPedido);
    
    function actualizarTablaItemsNuevoPedido() {
        tbodyItems.innerHTML = '';
        
        if (itemsNuevoPedido.length === 0) {
            tbodyItems.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-3 small">
                        No has agregado ninguna vela a este pedido.
                    </td>
                </tr>
            `;
            document.getElementById('pedido-subtotal-display').textContent = '$0.00';
            document.getElementById('pedido-total-display').textContent = '$0.00';
            return;
        }
        
        let sumTotal = 0;
        
        itemsNuevoPedido.forEach((item, idx) => {
            sumTotal += item.subtotal;
            const ceraBadge = item.tipo_cera === 'soya' ? 'Soya' : 'Malasia';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-semibold">${item.nombre} <span class="badge bg-light border text-dark ms-1">${item.color || 'base'}</span></td>
                <td><span class="badge ${item.tipo_cera === 'soya' ? 'bg-success' : 'bg-secondary'} small">${ceraBadge}</span></td>
                <td>${item.fragancia}</td>
                <td class="text-center fw-bold">${item.cantidad}</td>
                <td class="text-end">$${item.precio_unitario.toFixed(2)}</td>
                <td class="text-end fw-bold text-dark">$${item.subtotal.toFixed(2)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-outline-danger border-0 rounded-circle py-0" onclick="quitarItemNuevoPedido(${idx})">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>
                </td>
            `;
            tbodyItems.appendChild(tr);
        });
        
        const subtotalOriginal = sumTotal;
        const descuentoGlobalPct = parseFloat(document.getElementById('pedido-descuento-global').value) || 0;
        const descuentoMonto = sumTotal * (descuentoGlobalPct / 100);
        const totalFinal = sumTotal - descuentoMonto;
        
        document.getElementById('pedido-subtotal-display').textContent = `$${subtotalOriginal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('pedido-total-display').textContent = `$${totalFinal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    window.quitarItemNuevoPedido = function(index) {
        itemsNuevoPedido.splice(index, 1);
        actualizarTablaItemsNuevoPedido();
    };
    
    window.prepararNuevoPedido = function() {
        document.getElementById('modal-edit-type').value = 'order';
        document.getElementById('modal-edit-id').value = '';
        document.getElementById('modal-title-text').textContent = 'Registrar Nuevo Pedido de Cliente';
        document.getElementById('seccion-estado-pedido').style.display = 'flex';
        
        document.getElementById('pedido-cliente-nombre').value = '';
        document.getElementById('pedido-cliente-telefono').value = '';
        document.getElementById('pedido-fecha-entrega').value = '';
        document.getElementById('pedido-cliente-notas').value = '';
        document.getElementById('pedido-descuento-global').value = 0;
        document.getElementById('pedido-estado-select').value = 'pendiente';
        
        itemsNuevoPedido = [];
        actualizarTablaItemsNuevoPedido();
        
        const modal = new bootstrap.Modal(document.getElementById('modalNuevoPedido'));
        modal.show();
    };
    
    window.editarPedido = function(id) {
        const state = getAppState();
        const order = (state.orders || []).find(o => o.id == id);
        if (!order) return;
        
        document.getElementById('modal-edit-type').value = 'order';
        document.getElementById('modal-edit-id').value = order.id;
        document.getElementById('modal-title-text').textContent = `Editar Pedido #${order.folio}`;
        document.getElementById('seccion-estado-pedido').style.display = 'flex';
        
        document.getElementById('pedido-cliente-nombre').value = order.cliente || '';
        document.getElementById('pedido-cliente-telefono').value = order.telefono || '';
        document.getElementById('pedido-fecha-entrega').value = order.fecha_entrega || '';
        document.getElementById('pedido-cliente-notas').value = order.notas || '';
        document.getElementById('pedido-descuento-global').value = order.descuento_porcentaje || 0;
        document.getElementById('pedido-estado-select').value = (order.estado || 'pendiente').toLowerCase();
        
        itemsNuevoPedido = JSON.parse(JSON.stringify(order.items || []));
        actualizarTablaItemsNuevoPedido();
        
        const modal = new bootstrap.Modal(document.getElementById('modalNuevoPedido'));
        modal.show();
    };
    
    window.editarCotizacion = function(id) {
        const state = getAppState();
        const quote = (state.quotes || []).find(q => q.id == id);
        if (!quote) return;
        
        document.getElementById('modal-edit-type').value = 'quote';
        document.getElementById('modal-edit-id').value = quote.id;
        document.getElementById('modal-title-text').textContent = `Editar Cotización #${quote.folio || 'COT-' + quote.id}`;
        document.getElementById('seccion-estado-pedido').style.display = 'none';
        
        document.getElementById('pedido-cliente-nombre').value = quote.cliente || '';
        document.getElementById('pedido-cliente-telefono').value = quote.telefono || '';
        document.getElementById('pedido-fecha-entrega').value = '';
        document.getElementById('pedido-cliente-notas').value = quote.notas || '';
        document.getElementById('pedido-descuento-global').value = quote.descuento_porcentaje || 0;
        
        itemsNuevoPedido = JSON.parse(JSON.stringify(quote.items || []));
        actualizarTablaItemsNuevoPedido();
        
        const modal = new bootstrap.Modal(document.getElementById('modalNuevoPedido'));
        modal.show();
    };

    btnGuardarPedido.addEventListener('click', () => {
        const editType = document.getElementById('modal-edit-type').value;
        const editId = document.getElementById('modal-edit-id').value;
        const clienteNombre = document.getElementById('pedido-cliente-nombre').value.trim();
        const clienteTel = document.getElementById('pedido-cliente-telefono').value.trim();
        const fechaEntrega = document.getElementById('pedido-fecha-entrega').value || '';
        const clienteNotas = document.getElementById('pedido-cliente-notas').value.trim();
        const estadoInicial = document.getElementById('pedido-estado-select').value;
        const descuentoGlobalPct = parseFloat(document.getElementById('pedido-descuento-global').value) || 0;
        
        if (!clienteNombre) {
            alert("Por favor ingresa el nombre del cliente.");
            return;
        }
        if (itemsNuevoPedido.length === 0) {
            alert("Debes agregar al menos una vela al pedido.");
            return;
        }
        
        const currentState = getAppState();
        const orders = currentState.orders || [];
        const quotes = currentState.quotes || [];
        
        let totalVenta = 0;
        let totalCosto = 0;
        let totalVelas = 0;
        
        itemsNuevoPedido.forEach(i => {
            totalVenta += i.subtotal;
            totalCosto += i.costo_subtotal;
            totalVelas += i.cantidad;
        });
        
        const descuentoMonto = totalVenta * (descuentoGlobalPct / 100);
        totalVenta = totalVenta - descuentoMonto;
        const gananciaTotal = totalVenta - totalCosto;
        
        if (editType === 'order' && editId) {
            const idx = orders.findIndex(o => o.id == editId);
            if (idx > -1) {
                orders[idx].cliente = clienteNombre;
                orders[idx].telefono = clienteTel;
                orders[idx].fecha_entrega = fechaEntrega ? fechaEntrega.slice(0, 10) : '';
                orders[idx].notas = clienteNotas;
                orders[idx].items = [...itemsNuevoPedido];
                orders[idx].total = totalVenta;
                orders[idx].costo_total = totalCosto;
                orders[idx].ganancia_total = gananciaTotal;
                orders[idx].descuento_porcentaje = descuentoGlobalPct;
                orders[idx].estado = estadoInicial;
                
                saveAppState({ orders: orders });
                recargarVistaPedidos(currentState);
            }
        } else if (editType === 'quote' && editId) {
            const idx = quotes.findIndex(q => q.id == editId);
            if (idx > -1) {
                quotes[idx].cliente = clienteNombre;
                quotes[idx].telefono = clienteTel;
                quotes[idx].notas = clienteNotas;
                quotes[idx].items = [...itemsNuevoPedido];
                quotes[idx].total = totalVenta;
                quotes[idx].descuento_porcentaje = descuentoGlobalPct;
                
                saveAppState({ quotes: quotes });
                recargarVistaPedidos(currentState);
            }
        } else {
            // New Order
            const maxId = orders.reduce((max, o) => o.id > max ? o.id : max, 0);
            const newId = maxId + 1;
            const folioStr = `PED-${String(newId).padStart(3, '0')}`;
            const fechaStr = new Date().toISOString().slice(0, 10);
            
            const nuevoPedido = {
                id: newId,
                folio: folioStr,
                fecha: fechaStr,
                fecha_entrega: fechaEntrega ? fechaEntrega.slice(0, 10) : '',
                cliente: clienteNombre,
                telefono: clienteTel,
                notas: clienteNotas,
                items: [...itemsNuevoPedido],
                total: totalVenta,
                costo_total: totalCosto,
                ganancia_total: gananciaTotal,
                descuento_porcentaje: descuentoGlobalPct,
                estado: estadoInicial,
                stock_descontado: false
            };
            
            if (estadoInicial === 'entregado') {
                nuevoPedido.items.forEach(item => {
                    const prod = currentState.products.find(p => p.id === item.producto_id);
                    if (prod) {
                        if (!prod.stock_por_color) prod.stock_por_color = { base: parseInt(prod.stock) || 0 };
                        const c = item.color || 'base';
                        prod.stock_por_color[c] = Math.max(0, (prod.stock_por_color[c] || 0) - item.cantidad);
                        prod.stock = Object.values(prod.stock_por_color).reduce((sum, qty) => sum + qty, 0);
                    }
                });
                nuevoPedido.stock_descontado = true;
            }
            
            orders.unshift(nuevoPedido);
            saveAppState({ products: currentState.products, orders: orders });
            recargarVistaPedidos(currentState);
            verificarAlertasAltoVolumen(currentState);
            
            let confirmMsg = `¡Pedido #${folioStr} registrado exitosamente para ${clienteNombre}!`;
            if (totalVelas > 10 && estadoInicial === 'pendiente') {
                confirmMsg += `\n\n⚠️ ¡ATENCIÓN! Este pedido contiene ${totalVelas} velas (> 10). Se ha activado la Alerta de Alto Volumen en el panel superior.`;
            }
            alert(confirmMsg);
        }
        
        const modalEl = document.getElementById('modalNuevoPedido');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    });
}

// ==========================================================================
// 8. ORDER DETAILS MODAL & DELETE HANDLERS
// ==========================================================================

window.verDetallePedido = function(orderId) {
    const state = getAppState();
    const order = (state.orders || []).find(o => o.id === orderId);
    if (!order) return;
    
    const body = document.getElementById('modal-detalle-body');
    const est = (order.estado || 'pendiente').toLowerCase();
    
    let estadoBadge = '<span class="badge badge-status-pending">⏳ Pendiente</span>';
    if (est === 'entregado') estadoBadge = '<span class="badge badge-status-delivered">✅ Entregado</span>';
    else if (est === 'cancelado') estadoBadge = '<span class="badge badge-status-cancelled">❌ Cancelado</span>';
    
    let itemsRows = (order.items || []).map(i => `
        <tr>
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
    
    const cleanTel = (order.telefono || '').replace(/\D/g, '');
    const cleanDate = (order.fecha || '').slice(0, 10);
    const cleanEntrega = (order.fecha_entrega || '').slice(0, 10);
    
    const waButton = cleanTel ? `
        <a href="https://wa.me/52${cleanTel}?text=Hola%20${encodeURIComponent(order.cliente || '')}" target="_blank" class="btn btn-sm btn-whatsapp rounded-pill px-3 mt-1">
            <i class="bi bi-whatsapp me-1"></i> Contactar por WhatsApp (${order.telefono})
        </a>
    ` : '';
    
    const totalVenta = parseFloat(order.total || 0);
    const ganancia = parseFloat(order.ganancia_total !== undefined ? order.ganancia_total : (totalVenta * 0.75));
    const marginPct = totalVenta > 0 ? (ganancia / totalVenta) * 100 : 0;
    
    body.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h5 class="fw-bold mb-0 text-dark">Folio: #${order.folio || ('PED-' + order.id)}</h5>
                <div class="small text-muted mt-1">
                    <i class="bi bi-calendar3 me-1"></i>Fecha Creación: <strong>${cleanDate}</strong>
                    ${cleanEntrega ? ` • <i class="bi bi-truck text-primary me-1"></i>Entrega: <strong class="text-primary">${cleanEntrega}</strong>` : ''}
                </div>
            </div>
            <div>${estadoBadge}</div>
        </div>

        <div class="p-3 bg-light rounded border mb-3">
            <div class="fw-bold text-dark"><i class="bi bi-person me-1"></i>Cliente: ${order.cliente}</div>
            ${waButton}
            ${order.notas ? `<div class="text-muted small mt-2"><strong>Notas:</strong> ${order.notas}</div>` : ''}
        </div>

        <h6 class="fw-bold small text-muted text-uppercase mb-2">Velas en la Orden:</h6>
        <div class="table-responsive mb-3">
            <table class="table table-sm table-bordered align-middle">
                <thead class="table-light small">
                    <tr>
                        <th>Vela</th>
                        <th class="text-center">Cant</th>
                        <th class="text-end">Precio</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
                <tfoot class="table-light">
                    <tr>
                        <td colspan="3" class="text-end fw-bold">TOTAL VENTA:</td>
                        <td class="text-end fw-bold text-success fs-6">$${totalVenta.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-end small text-muted">Ganancia Estimada:</td>
                        <td class="text-end small fw-semibold text-success">+$${ganancia.toFixed(2)} (${marginPct.toFixed(1)}%)</td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="p-2 rounded bg-light border small text-muted d-flex align-items-center gap-2">
            <i class="bi bi-info-circle text-primary"></i>
            <span>Estado de inventario: <strong>${order.stock_descontado ? 'Stock descontado del almacén' : 'Stock no descontado'}</strong></span>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('modalDetallePedido'));
    modal.show();
};

window.eliminarPedido = function(orderId) {
    const state = getAppState();
    const order = (state.orders || []).find(o => o.id === orderId);
    if (!order) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar el pedido #${order.folio || ('PED-' + order.id)} de ${order.cliente}?`)) {
        if (order.stock_descontado) {
            (order.items || []).forEach(item => {
                const prod = state.products.find(p => p.id === item.producto_id);
                if (prod) {
                    prod.stock = (parseInt(prod.stock) || 0) + item.cantidad;
                }
            });
        }
        
        state.orders = state.orders.filter(o => o.id !== orderId);
        
        saveAppState({
            products: state.products,
            orders: state.orders
        });
        
        recargarVistaPedidos(state);
        verificarAlertasAltoVolumen(state);
    }
};

// ==========================================================================
// 9. EXCEL EXPORT FOR ORDERS HISTORY
// ==========================================================================

function configurarExportacionPedidosExcel() {
    const btnExportar = document.getElementById('btn-exportar-pedidos-excel');
    if (!btnExportar) return;
    
    btnExportar.addEventListener('click', () => {
        try {
            const state = getAppState();
            const orders = state.orders || [];
            
            if (orders.length === 0) {
                alert("No hay pedidos registrados para exportar.");
                return;
            }
            
            let wsData = [
                ["Folio", "Fecha Creación", "Fecha Entrega", "Cliente", "Teléfono", "Velas / Artículos", "Total Venta ($)", "Ganancia Estimada ($)", "Margen %", "Estado", "Notas"]
            ];
            
            orders.forEach(o => {
                const itemsStr = (o.items || []).map(i => `${i.cantidad}x ${i.nombre} (${i.fragancia})`).join('; ');
                const total = parseFloat(o.total || 0);
                const ganancia = parseFloat(o.ganancia_total !== undefined ? o.ganancia_total : (total * 0.75));
                const marginPct = total > 0 ? `${((ganancia / total) * 100).toFixed(1)}%` : '0%';
                
                wsData.push([
                    o.folio || `PED-${o.id}`,
                    (o.fecha || '').slice(0, 10),
                    (o.fecha_entrega || '').slice(0, 10),
                    o.cliente || '',
                    o.telefono || '',
                    itemsStr,
                    total,
                    ganancia,
                    marginPct,
                    (o.estado || 'pendiente').toUpperCase(),
                    o.notas || ''
                ]);
            });
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "Historial Pedidos");
            
            const today = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `Velisima_Pedidos_${today}.xlsx`);
            
        } catch (error) {
            console.error(error);
            alert("Error al exportar pedidos a Excel: " + error.message);
        }
    });
}
