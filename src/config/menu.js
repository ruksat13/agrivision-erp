// Shared menu tree — used by Sidebar (navigation) and Admin (permission editor)
export const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    {
        name: 'Sales', icon: '🛒', children: [
            { name: 'New Sales Order', path: '/sales-entry' },
            { name: 'Sales', path: '/sales' },
            { name: 'Sales Return', path: '/sales-return' },
            { name: 'Cancel Sales', path: '/cancel-sales' },
            { name: 'Damage', path: '/damage' },
        ]
    },
    {
        name: 'Accounts', icon: '💰', children: [
            { name: 'Supplier Purchase', path: '/supplier-purchase' },
            { name: 'Cash Collection', path: '/cash-collection' },
            { name: 'Supplier Payment', path: '/supplier-payment' },
            { name: 'Customer Ledger', path: '/customer-ledger' },
            { name: 'Customer Opening Balance', path: '/customer-opening-balance' },
            { name: 'Supplier Ledger', path: '/supplier-ledger' },
            { name: 'Supplier Opening Balance', path: '/supplier-opening-balance' },
            { name: 'Customer Commission', path: '/customer-commission' },
            { name: 'Supplier Commission', path: '/supplier-commission' },
            { name: 'Expense', path: '/expense' },
            { name: 'Employee Account', path: '/employee-account' },
            { name: 'Expense Head', path: '/expense-head' },
            { name: 'Bank Account', path: '/bank-account' },
        ]
    },
    {
        name: 'Inventory', icon: '📦', children: [
            { name: 'Purchase', path: '/purchase' },
            { name: 'Purchase Return', path: '/purchase-return' },
            { name: 'Stock Report', path: '/stock-report' },
            { name: 'Central Stock Report', path: '/central-stock-report' },
            { name: 'Offers', path: '/offers' },
            { name: 'Batch', path: '/batch' },
            { name: 'Repacking', path: '/repacking' },
            { name: 'Product Demand', path: '/product-demand' },
        ]
    },
    {
        name: 'Reports', icon: '📈', children: [
            { name: 'Sales', path: '/sales-report' },
            { name: 'Products Sales', path: '/products-sales-report' },
            { name: 'Pending Products Sales', path: '/pending-products-sales-report' },
            { name: 'Officer Wise Sales', path: '/officer-wise-sales' },
            { name: 'Officer Wise Product Sales', path: '/officer-wise-product-sales' },
            { name: 'Customer Wise Sales', path: '/customer-wise-sales' },
            { name: 'Customer Wise Product Sales', path: '/customer-wise-product-sales' },
            { name: 'Territory Wise Sales', path: '/territory-wise-sales' },
            { name: 'Territory Wise Product Sales', path: '/territory-wise-product-sales' },
            { name: 'Territory Sales Summary', path: '/territory-sales-summary' },
            { name: 'Area Wise Sales', path: '/area-wise-sales' },
            { name: 'Area Wise Product Sales', path: '/area-wise-product-sales' },
            { name: 'Area Sales Summary', path: '/area-sales-summary' },
            { name: 'Collection', path: '/collection-report' },
            { name: 'Officer Wise Collection', path: '/officer-wise-collection-report' },
            { name: 'Customer Wise Collection', path: '/customer-wise-collection-report' },
            { name: 'Territory Wise Collection', path: '/territory-wise-collection-report' },
            { name: 'Area Wise Collection', path: '/area-wise-collection-report' },
            { name: 'Due', path: '/due-report' },
            { name: 'Area Wise Due', path: '/area-wise-due-report' },
            { name: 'Territory Wise Due', path: '/territory-wise-due-report' },
            { name: 'Due Invoices', path: '/due-invoices' },
            { name: 'Accounts', path: '/accounts-report' },
            { name: 'Accounts Statement', path: '/accounts-statement' },
            { name: 'Expense', path: '/expense-report' },
            { name: 'Head Wise Expense Report', path: '/head-wise-expense-report' },
            { name: 'Sales Return', path: '/sales-return-report' },
            { name: 'Territory Wise Sales Return', path: '/territory-wise-sales-return-report' },
            { name: 'Top Reports', path: '/top-report' },
            { name: 'Top Customers', path: '/top-customers' },
            { name: 'Date Wise Invoices', path: '/date-wise-invoice' },
            { name: 'Product Statement', path: '/product-statement' },
            { name: 'Session Wise Target', path: '/session-wise-target' },
            { name: 'Invoice Return Filter', path: '/invoice-return-filter' },
            { name: 'Territory Performance', path: '/territory-performance' },
            { name: 'Territory Target & Achievement', path: '/territory-target-and-achievement' },
            { name: 'Area Target & Achievement', path: '/area-target-and-achievement' },
            { name: 'Office Target & Achievement', path: '/office-target-and-achievement' },
            { name: 'Purchase', path: '/purchase-report' },
            { name: 'Product Demand', path: '/product-demand-report' },
        ]
    },
    {
        name: 'License', icon: '🪪', children: [
            { name: 'License', path: '/license' },
            { name: 'Category', path: '/license-category' },
        ]
    },
    { name: 'Product', path: '/product', icon: '🌿' },
    {
        name: 'HR Management', icon: '👥', children: [
            { name: 'Daily Visit', path: '/daily-visit' },
            { name: 'Attendance', path: '/attendance' },
            { name: 'Daily Meter', path: '/daily-meter' },
            { name: 'Payroll', path: '/payroll' },
        ]
    },
    { name: 'Customer', path: '/customer', icon: '🤝' },
    { name: 'Supplier', path: '/supplier', icon: '🏭' },
    { name: 'Admin', path: '/admin', icon: '🔑' },
    { name: 'Employee', path: '/employee', icon: '👤' },
    { name: 'Employee Target', path: '/employee-target', icon: '🎯' },
    {
        name: 'Mapping', icon: '🗺️', children: [
            { name: 'Office Mapping', path: '/office-mapping' },
            { name: 'Region Mapping', path: '/region-mapping' },
            { name: 'Area Mapping', path: '/area-mapping' },
        ]
    },
    {
        name: 'SMS', icon: '💬', children: [
            { name: 'Campaign', path: '/sms-campaign' },
            { name: 'SMS', path: '/sms' },
            { name: 'SMS Log', path: '/sms-log' },
        ]
    },
    {
        name: 'Categories', icon: '🏷️', children: [
            { name: 'Categories', path: '/categories' },
            { name: 'Brand', path: '/brand' },
            { name: 'Unit', path: '/unit' },
            { name: 'Product Type', path: '/product-type' },
            { name: 'Origin', path: '/origin' },
        ]
    },
    { name: 'Delivery', path: '/delivery', icon: '🚚' },
    {
        name: 'Settings', icon: '⚙️', children: [
            { name: 'Vat', path: '/vat' },
            { name: 'Company Profile', path: '/company-profile' },
            { name: 'Configuration', path: '/configuration' },
        ]
    },
];

// Flatten: every accessible leaf path in the app
export const allPaths = menuItems.flatMap(item =>
    item.children ? item.children.map(c => c.path) : [item.path]
);
