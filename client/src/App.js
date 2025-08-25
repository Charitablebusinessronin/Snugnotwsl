import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'styled-components';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import GlobalStyles from './styles/GlobalStyles';
import theme from './styles/theme';

// Pages
import LoginPage from './pages/Login/LoginPage';
import EmployeeDashboard from './pages/Employee/Dashboard/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import ContractorDashboard from './pages/Contractor/Dashboard/Dashboard';
import ClientDashboard from './pages/Client/Dashboard/Dashboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="/employee/*" element={
                    <ProtectedRoute allowedRoles={['employee']}>
                      <EmployeeDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/contractor/*" element={
                    <ProtectedRoute allowedRoles={['contractor']}>
                      <ContractorDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/client/*" element={
                    <ProtectedRoute allowedRoles={['client']}>
                      <ClientDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
                
                {/* Global Toast Notifications */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      style: {
                        background: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;