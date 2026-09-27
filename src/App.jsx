import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Personnel from "./pages/Personnel";
import Units from "./pages/Units";
import LeaveManagement from "./pages/LeaveManagement";
import Promotions from "./pages/Promotions";
import AuditLogs from "./pages/AuditLogs";

import Layout from "./components/Layout";
import TOTPVerification from "./pages/TOTPVerification";
import TPMVerification from "./pages/TPMVerification";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>

      {/* Public routes */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      {/* TPM 2.0 hardware verification */}
      <Route
        path="/verify-tpm"
        element={<TPMVerification />}
      />

      {/* TOTP verification */}
      <Route
        path="/verify-totp"
        element={<TOTPVerification />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        <Route
          path="/personnel"
          element={
            <Layout>
              <Personnel />
            </Layout>
          }
        />

        <Route
          path="/units"
          element={
            <Layout>
              <Units />
            </Layout>
          }
        />

        <Route
          path="/leave"
          element={
            <Layout>
              <LeaveManagement />
            </Layout>
          }
        />

        <Route
          path="/promotions"
          element={
            <Layout>
              <Promotions />
            </Layout>
          }
        />

        <Route
          path="/audit"
          element={
            <Layout>
              <AuditLogs />
            </Layout>
          }
        />

      </Route>

    </Routes>
  );
}

export default App;