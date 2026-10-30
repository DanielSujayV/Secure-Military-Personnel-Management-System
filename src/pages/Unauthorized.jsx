import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Unauthorized() {
    const { role, logout } = useAuth();

    return (
        <main className="unauthorized-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
            <section className="totp-card" style={{ maxWidth: "520px", textAlign: "center" }}>
                <div className="totp-logo">403</div>
                <h1>Access Denied</h1>
                <p className="totp-description">
                    Your account{role ? ` (${role})` : ""} does not have permission to access this page.
                </p>
                <p>Please use an authorized module or sign in with an account that has the required permissions.</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "24px" }}>
                    <Link className="primary-button" to="/personnel">Go to Personnel</Link>
                    <button className="secondary-button" onClick={logout}>Logout</button>
                </div>
            </section>
        </main>
    );
}

export default Unauthorized;