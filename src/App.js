import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import SalesReturn from './pages/SalesReturn';
import CancelSales from './pages/CancelSales';
import Damage from './pages/Damage';
import SupplierPurchase from './pages/SupplierPurchase';
import CashCollection from './pages/CashCollection';
import SupplierPayment from './pages/SupplierPayment';
import CustomerLedger from './pages/CustomerLedger';
import CustomerOpeningBalance from './pages/CustomerOpeningBalance';
import SupplierLedger from './pages/SupplierLedger';
import SupplierOpeningBalance from './pages/SupplierOpeningBalance';
import CustomerCommission from './pages/CustomerCommission';
import SupplierCommission from './pages/SupplierCommission';
import Expense from './pages/Expense';
import EmployeeAccount from './pages/EmployeeAccount';
import ExpenseHead from './pages/ExpenseHead';
import BankAccount from './pages/BankAccount';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import License from './pages/License';
import Product from './pages/Product';
import HR from './pages/HR';
import Customer from './pages/Customer';
import Supplier from './pages/Supplier';
import Admin from './pages/Admin';
import Employee from './pages/Employee';
import Mapping from './pages/Mapping';
import SMS from './pages/SMS';
import Categories from './pages/Categories';
import Delivery from './pages/Delivery';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div style={{ display: 'flex' }}>

                {/* Sidebar */}
                <div style={{
                  width: sidebarOpen ? '250px' : '0px',
                  minWidth: sidebarOpen ? '250px' : '0px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  height: '100vh',
                  zIndex: 99,
                }}>
                  <Sidebar />
                </div>

                {/* Main Content */}
                <div style={{
                  flex: 1,
                  marginLeft: sidebarOpen ? '250px' : '0px',
                  transition: 'margin-left 0.3s ease',
                  minHeight: '100vh',
                  background: '#f0f2f5',
                }}>
                  <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                  <div style={{ padding: '24px' }}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/sales" element={<Sales type="Sales" />} />
                      <Route path="/sales-return" element={<SalesReturn />} />
                      <Route path="/cancel-sales" element={<CancelSales />} />
                      <Route path="/damage" element={<Damage />} />
                      <Route path="/supplier-purchase" element={<SupplierPurchase />} />
                      <Route path="/cash-collection" element={<CashCollection />} />
                      <Route path="/supplier-payment" element={<SupplierPayment />} />
                      <Route path="/customer-ledger" element={<CustomerLedger />} />
                      <Route path="/customer-opening-balance" element={<CustomerOpeningBalance />} />
                      <Route path="/supplier-ledger" element={<SupplierLedger />} />
                      <Route path="/supplier-opening-balance" element={<SupplierOpeningBalance />} />
                      <Route path="/customer-commission" element={<CustomerCommission />} />
                      <Route path="/supplier-commission" element={<SupplierCommission />} />
                      <Route path="/expense" element={<Expense />} />
                      <Route path="/employee-account" element={<EmployeeAccount />} />
                      <Route path="/expense-head" element={<ExpenseHead />} />
                      <Route path="/bank-account" element={<BankAccount />} />
                      <Route path="/purchase" element={<Inventory type="Purchase" />} />
                      <Route path="/purchase-return" element={<Inventory type="Purchase Return" />} />
                      <Route path="/stock-report" element={<Inventory type="Stock Report" />} />
                      <Route path="/central-stock-report" element={<Inventory type="Central Stock Report" />} />
                      <Route path="/offers" element={<Inventory type="Offers" />} />
                      <Route path="/batch" element={<Inventory type="Batch" />} />
                      <Route path="/repacking" element={<Inventory type="Repacking" />} />
                      <Route path="/product-demand" element={<Inventory type="Product Demand" />} />
                      <Route path="/sales-report" element={<Reports type="Sales" />} />
                      <Route path="/products-sales-report" element={<Reports type="Products Sales" />} />
                      <Route path="/pending-products-sales-report" element={<Reports type="Pending Products Sales" />} />
                      <Route path="/officer-wise-sales" element={<Reports type="Officer Wise Sales" />} />
                      <Route path="/officer-wise-product-sales" element={<Reports type="Officer Wise Product Sales" />} />
                      <Route path="/customer-wise-sales" element={<Reports type="Customer Wise Sales" />} />
                      <Route path="/customer-wise-product-sales" element={<Reports type="Customer Wise Product Sales" />} />
                      <Route path="/territory-wise-sales" element={<Reports type="Territory Wise Sales" />} />
                      <Route path="/territory-wise-product-sales" element={<Reports type="Territory Wise Product Sales" />} />
                      <Route path="/territory-sales-summary" element={<Reports type="Territory Sales Summary" />} />
                      <Route path="/area-wise-sales" element={<Reports type="Area Wise Sales" />} />
                      <Route path="/area-wise-product-sales" element={<Reports type="Area Wise Product Sales" />} />
                      <Route path="/area-sales-summary" element={<Reports type="Area Sales Summary" />} />
                      <Route path="/collection-report" element={<Reports type="Collection" />} />
                      <Route path="/officer-wise-collection-report" element={<Reports type="Officer Wise Collection" />} />
                      <Route path="/customer-wise-collection-report" element={<Reports type="Customer Wise Collection" />} />
                      <Route path="/territory-wise-collection-report" element={<Reports type="Territory Wise Collection" />} />
                      <Route path="/area-wise-collection-report" element={<Reports type="Area Wise Collection" />} />
                      <Route path="/due-report" element={<Reports type="Due" />} />
                      <Route path="/area-wise-due-report" element={<Reports type="Area Wise Due" />} />
                      <Route path="/territory-wise-due-report" element={<Reports type="Territory Wise Due" />} />
                      <Route path="/due-invoices" element={<Reports type="Due Invoices" />} />
                      <Route path="/accounts-report" element={<Reports type="Accounts" />} />
                      <Route path="/accounts-statement" element={<Reports type="Accounts Statement" />} />
                      <Route path="/expense-report" element={<Reports type="Expense" />} />
                      <Route path="/head-wise-expense-report" element={<Reports type="Head Wise Expense" />} />
                      <Route path="/sales-return-report" element={<Reports type="Sales Return" />} />
                      <Route path="/territory-wise-sales-return-report" element={<Reports type="Territory Wise Sales Return" />} />
                      <Route path="/top-report" element={<Reports type="Top Reports" />} />
                      <Route path="/top-customers" element={<Reports type="Top Customers" />} />
                      <Route path="/date-wise-invoice" element={<Reports type="Date Wise Invoices" />} />
                      <Route path="/product-statement" element={<Reports type="Product Statement" />} />
                      <Route path="/session-wise-target" element={<Reports type="Session Wise Target" />} />
                      <Route path="/invoice-return-filter" element={<Reports type="Invoice Return Filter" />} />
                      <Route path="/territory-performance" element={<Reports type="Territory Performance" />} />
                      <Route path="/territory-target-and-achievement" element={<Reports type="Territory Target & Achievement" />} />
                      <Route path="/area-target-and-achievement" element={<Reports type="Area Target & Achievement" />} />
                      <Route path="/office-target-and-achievement" element={<Reports type="Office Target & Achievement" />} />
                      <Route path="/purchase-report" element={<Reports type="Purchase" />} />
                      <Route path="/product-demand-report" element={<Reports type="Product Demand" />} />
                      <Route path="/license" element={<License type="License" />} />
                      <Route path="/license-category" element={<License type="Category" />} />
                      <Route path="/product" element={<Product />} />
                      <Route path="/daily-visit" element={<HR type="Daily Visit" />} />
                      <Route path="/attendance" element={<HR type="Attendance" />} />
                      <Route path="/daily-meter" element={<HR type="Daily Meter" />} />
                      <Route path="/payroll" element={<HR type="Payroll" />} />
                      <Route path="/customer" element={<Customer />} />
                      <Route path="/supplier" element={<Supplier />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/employee" element={<Employee />} />
                      <Route path="/employee-target" element={<Employee type="Target" />} />
                      <Route path="/office-mapping" element={<Mapping type="Office Mapping" />} />
                      <Route path="/region-mapping" element={<Mapping type="Region Mapping" />} />
                      <Route path="/area-mapping" element={<Mapping type="Area Mapping" />} />
                      <Route path="/sms-campaign" element={<SMS type="Campaign" />} />
                      <Route path="/sms" element={<SMS type="SMS" />} />
                      <Route path="/sms-log" element={<SMS type="SMS Log" />} />
                      <Route path="/categories" element={<Categories type="Categories" />} />
                      <Route path="/brand" element={<Categories type="Brand" />} />
                      <Route path="/unit" element={<Categories type="Unit" />} />
                      <Route path="/product-type" element={<Categories type="Product Type" />} />
                      <Route path="/origin" element={<Categories type="Origin" />} />
                      <Route path="/delivery" element={<Delivery />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/change-password" element={<ChangePassword />} />
                      <Route path="/vat" element={<Settings type="Vat" />} />
                      <Route path="/company-profile" element={<Settings type="Company Profile" />} />
                      <Route path="/configuration" element={<Settings type="Configuration" />} />
                    </Routes>
                  </div>
                </div>

              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;