
## I suggest we deliver the project in 4 modular phases. We will complete each phase, run it locally, and wait for your green light
before proceeding.

## Phase 1: Base Structure & Excel Loader (The Input/Output Bus)
* Goal: Build the shared responsive Navigation Bar and create the logic to read/import the Excel spreadsheet.
* Files modified: index.html, js/app.js, css/styles.css.
* Features:
    * A modern navigation system to jump between Dashboard (index.html), Stock (inventario.html), and Orders (pedidos.html).
    * A clean "Upload Excel" zone that parses Costeo_Velas.xlsx using SheetJS and saves it into browser memory (localStorage).
    * Automatic fallback to preloaded Excel data if no file is uploaded.

## Phase 2: Interactive Inventory Table (The Stock Register)
* Goal: Visualize, search, and update stock counts.
* Files modified: inventario.html, js/inventario.js.
* Features:
    * Configure DataTables.net with Bootstrap styling to present all 28 products.
    * Display key details: Weight, Raw Materials Cost, Sale Price, Profit Margin, and Stock.
    * Add stock adjustment controls (e.g., [+] / [-] buttons and a direct input modal).
    * Visual "Low Stock" alerts (badge changes to red when stock < 5).
    * Sync back to Excel: A download button to export the current stock state back into a new .xlsx file.

## Phase 3: Order Tracking & Logic Coupling (The Transaction Controller)
* Goal: Record sales and connect order fulfillment to stock levels.
* Files modified: pedidos.html, js/pedidos.js.
* Features:
    * A form to record orders (Customer Name, Phone, Candle Selected, Quantity, Order Status: Pending / Delivered / Cancelled).
    * An Orders DataTable to list and filter previous sales.
    * Logic Link: When an order state shifts to Delivered, subtract the purchased quantity from the inventory register
        automatically.

## Phase 4: Profit & Material Dashboard (The Analytics Console)
* Goal: Real-time business intelligence and material forecasts on the home page.
* Files modified: index.html, js/app.js.
* Features:
    * KPI Scorecards (Total Stock Value, Estimated Profit, Total Sales, Average Margin).
    * An Interactive Material Calculator: Tell the app "I have to manufacture 10 Sagrada Fam and 5 Tulipán", and it will display
        exactly how many grams of Wax, Fragrance, Aditives, and Pabilos you need to purchase/use based on Excel formulas!
    * A visual profit margin chart per product (using Chart.js).