import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Personnel from "./pages/Personnel";
import Units from "./pages/Units";
import LeaveManagement from "./pages/LeaveManagement";
import Promotions from "./pages/Promotions";
import AuditLogs from "./pages/AuditLogs";
import Unauthorized from "./pages/Unauthorized";

import Layout from "./components/Layout";
import TOTPVerification from "./pages/TOTPVerification";
import TPMVerification from "./pages/TPMVerification";
import ProtectedRoute from "./components/ProtectedRoute";

const ALL_ROLES = ["ADMIN", "COMMANDER", "OFFICER", "PERSONNEL"];
const MANAGEMENT_ROLES = ["ADMIN", "COMMANDER"];

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-tpm" element={<TPMVerification />} />
            <Route path="/verify-totp" element={<TOTPVerification />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/audit" element={<Layout><AuditLogs /></Layout>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
                <Route path="/personnel" element={<Layout><Personnel /></Layout>} />
                <Route path="/leave" element={<Layout><LeaveManagement /></Layout>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={MANAGEMENT_ROLES} />}>
                <Route path="/units" element={<Layout><Units /></Layout>} />
                <Route path="/promotions" element={<Layout><Promotions /></Layout>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;