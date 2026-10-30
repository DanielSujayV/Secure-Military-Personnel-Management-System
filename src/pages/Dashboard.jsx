import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

const REFRESH_INTERVAL_MS = 30_000;

function formatTimestamp(value) {
  if (!value) return "Time unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function Dashboard() {
  const { username } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const result = await api.get("/admin/dashboard");
      setDashboard(result);
      setLastUpdated(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);

    const intervalId = window.setInterval(() => {
      loadDashboard(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Admin Dashboard</h1>
        <p>Loading live dashboard data...</p>
      </div>
    );
  }

  if (!dashboard && error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Live overview of personnel management</p>
          </div>
          <button type="button" onClick={() => loadDashboard(true)}>
            Retry
          </button>
        </div>
        <p role="alert">{error}</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Personnel",
      value: dashboard?.totalPersonnel ?? 0,
      description: "Personnel records in the database",
    },
    {
      title: "Registered Units",
      value: dashboard?.registeredUnits ?? 0,
      description: "Units registered in the database",
    },
    {
      title: "Pending Leave",
      value: dashboard?.pendingLeaveRequests ?? 0,
      description: "Requests awaiting a decision",
    },
    {
      title: "Promotion Records",
      value: dashboard?.recordedPromotions ?? 0,
      description: "Promotion records in the database",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Live overview of the Military Personnel Management System</p>
        </div>

        <div className="user-info">
          <strong>{username || "Administrator"}</strong>
          <span>System Administrator</span>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Welcome back{username ? `, ${username}` : ", Administrator"}</h2>
        <p>Figures below are read from the application database.</p>
      </div>

      <div className="dashboard-header">
        <p aria-live="polite">
          {lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
            : "Waiting for dashboard data"}
        </p>
        <button
          type="button"
          onClick={() => loadDashboard(false)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      {error && <p role="alert">{error} Showing the last successfully loaded data.</p>}

      <div className="stats-grid">
        {metrics.map((metric) => (
          <div className="stat-card" key={metric.title}>
            <span className="stat-title">{metric.title}</span>
            <strong className="stat-number">
              {Number(metric.value).toLocaleString()}
            </strong>
            <span className="stat-description">{metric.description}</span>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <span>Latest audit events</span>
          </div>

          <div className="activity-list">
            {dashboard?.recentActivities?.length ? (
              dashboard.recentActivities.map((activity, index) => (
                <div
                  className="activity-item"
                  key={`${activity.timestamp}-${activity.action}-${index}`}
                >
                  <div>
                    <strong>{activity.action || "Activity recorded"}</strong>
                    <p>
                      {activity.username || "Unknown user"}
                      {activity.details ? ` · ${activity.details}` : ""}
                    </p>
                  </div>
                  <span>{formatTimestamp(activity.timestamp)}</span>
                </div>
              ))
            ) : (
              <p>No audit activity has been recorded yet.</p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Data freshness</h2>
          </div>
          <div className="status-list">
            <div className="system-status">
              <span className="status-indicator"></span>
              <div>
                <strong>Dashboard data</strong>
                <p>
                  Automatically refreshed every 30 seconds while this page is open.
                </p>
              </div>
            </div>
            <div className="system-status">
              <span className="status-indicator"></span>
              <div>
                <strong>Database-backed metrics</strong>
                <p>
                  Counts are calculated by the backend for each dashboard request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
