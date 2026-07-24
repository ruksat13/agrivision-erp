import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import SalesReturn from './pages/SalesReturn';
import CancelSales from './pages/CancelSales';
import Damage from './pages/Damage';
import Accounts from './pages/Accounts';
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
                      <Route path="/supplier-purchase" element={<Accounts type="Supplier Purchase" />} />
                      <Route path="/cash-collection" element={<Accounts type="Cash Collection" />} />
                      <Route path="/supplier-payment" element={<Accounts type="Supplier Payment" />} />
                      <Route path="/customer-ledger" element={<Accounts type="Customer Ledger" />} />
                      <Route path="/customer-opening-balance" element={<Accounts type="Customer Opening Balance" />} />
                      <Route path="/supplier-ledger" element={<Accounts type="Supplier Ledger" />} />
                      <Route path="/supplier-opening-balance" element={<Accounts type="Supplier Opening Balance" />} />
                      <Route path="/customer-commission" element={<Accounts type="Customer Commission" />} />
                      <Route path="/supplier-commission" element={<Accounts type="Supplier Commission" />} />
                      <Route path="/expense" element={<Accounts type="Expense" />} />
                      <Route path="/employee-account" element={<Accounts type="Employee Account" />} />
                      <Route path="/expense-head" element={<Accounts type="Expense Head" />} />
                      <Route path="/bank-account" element={<Accounts type="Bank Account" />} />
                      <Route path="/purchase" element={<Inventory type="Purchase" />} />
                      <Route path="/batch" element={<Inventory type="Batch" />} />
                      <Route path="/repacking" element={<Inventory type="Repacking" />} />
                      <Route path="/product-demand" element={<Inventory type="Product Demand" />} />
                      <Route path="/reports-sales" element={<Reports type="Sales Report" />} />
                      <Route path="/reports-product-sales" element={<Reports type="Product Sales" />} />
                      <Route path="/officer-wise-sales" element={<Reports type="Officer Wise Sales" />} />
                      <Route path="/customer-wise-sales" element={<Reports type="Customer Wise Sales" />} />
                      <Route path="/territory-wise-sales" element={<Reports type="Territory Wise Sales" />} />
                      <Route path="/area-wise-sales" element={<Reports type="Area Wise Sales" />} />
                      <Route path="/reports-collection" element={<Reports type="Collection" />} />
                      <Route path="/officer-wise-collection" element={<Reports type="Officer Wise Collection" />} />
                      <Route path="/customer-wise-collection" element={<Reports type="Customer Wise Collection" />} />
                      <Route path="/territory-wise-collection" element={<Reports type="Territory Wise Collection" />} />
                      <Route path="/area-wise-collection" element={<Reports type="Area Wise Collection" />} />
                      <Route path="/reports-due" element={<Reports type="Due Report" />} />
                      <Route path="/reports-expense" element={<Reports type="Expense Report" />} />
                      <Route path="/reports-sales-return" element={<Reports type="Sales Return Report" />} />
                      <Route path="/top-customers" element={<Reports type="Top Customers" />} />
                      <Route path="/date-wise-invoices" element={<Reports type="Date Wise Invoices" />} />
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