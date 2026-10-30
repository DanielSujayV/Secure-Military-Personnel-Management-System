import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyData = {
  personnel: [],
  units: [],
  leaves: [],
  promotions: [],
  auditLogs: [],
};

function Dashboard() {
  const { username } = useAuth();
  const [data, setData] = useState(emptyData);
  const [sourceStatus, setSourceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const sources = [
        ["personnel", "/personnel"],
        ["units", "/units"],
        ["leaves", "/leave-requests"],
        ["promotions", "/promotions"],
        ["auditLogs", "/audit-logs"],
      ];

      const results = await Promise.allSettled(
        sources.map(([, endpoint]) => api.get(endpoint))
      );

      if (cancelled) return;

      const nextData = { ...emptyData };
      const nextStatus = {};
      let failures = 0;

      results.forEach((result, index) => {
        const [key] = sources[index];
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          nextData[key] = result.value;
          nextStatus[key] = "Available";
        } else {
          nextStatus[key] = "Unavailable";
          failures += 1;
        }
      });

      setData(nextData);
      setSourceStatus(nextStatus);
      if (failures > 0) {
        setError(`${failures} dashboard data source(s) could not be loaded. Check the API and your permissions.`);
      }
      setLoading(false);
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const pendingLeaveCount = useMemo(
    () => data.leaves.filter((item) =>
      String(item.status || "").toUpperCase() === "PENDING"
    ).length,
    [data.leaves]
  );

  const recentActivity = useMemo(
    () => [...data.auditLogs]
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 6),
    [data.auditLogs]
  );

  const formatTimestamp = (value) => {
    if (!value) return "Time unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const getActivityTitle = (action) => {
    if (!action) return "System activity";
    return action.replaceAll("_", " ").toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const statCards = [
    { title: "Total Personnel", value: data.personnel.length, description: "Personnel records" },
    { title: "Registered Units", value: data.units.length, description: "Configured units" },
    { title: "Pending Leave", value: pendingLeaveCount, description: "Awaiting review" },
    { title: "Promotion Records", value: data.promotions.length, description: "Recorded promotions" },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Military Personnel Management System</p>
        </div>
        <div className="user-info">
          <strong>{username || "Administrator"}</strong>
          <span>System Administrator</span>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Welcome back, {username || "Administrator"}</h2>
        <p>Live overview from the personnel management database.</p>
      </div>

      {error && (
        <div className="login-error" role="alert" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.title}>
            <span className="stat-title">{card.title}</span>
            <strong className="stat-number">
              {loading ? "—" : card.value}
            </strong>
            <span className="stat-description">{card.description}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <span>{recentActivity.length} latest events</span>
          </div>

          <div className="activity-list">
            {loading ? (
              <p>Loading recent activity...</p>
            ) : recentActivity.length === 0 ? (
              <p>No audit activity has been recorded yet.</p>
            ) : recentActivity.map((item) => (
              <div className="activity-item" key={item.id}>
                <div>
                  <strong>{getActivityTitle(item.action)}</strong>
                  <p>{item.details || item.username || "System event"}</p>
                </div>
                <span>{formatTimestamp(item.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Data Source Status</h2>
          </div>
          <div className="status-list">
            {[
              ["Personnel API", "personnel"],
              ["Units API", "units"],
              ["Leave API", "leaves"],
              ["Promotions API", "promotions"],
              ["Audit Log API", "auditLogs"],
            ].map(([label, key]) => {
              const available = sourceStatus[key] === "Available";
              return (
                <div className="system-status" key={key}>
                  <span
                    className="status-indicator"
                    style={{
                      backgroundColor: loading ? "#9ca3af" : available ? "#16a34a" : "#dc2626",
                      opacity: 1,
                    }}
                  />
                  <div>
                    <strong>{label}</strong>
                    <p>{loading ? "Checking..." : sourceStatus[key] || "Not checked"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;