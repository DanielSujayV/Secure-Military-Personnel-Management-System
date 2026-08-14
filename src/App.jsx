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

function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route
  path="/verify-totp"
  element={<TOTPVerification />}
/>

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

    </Routes>
  );
}

export default App;