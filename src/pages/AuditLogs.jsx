import { useEffect, useState } from "react";
import { api } from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.get("/audit-logs");

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return "—";
    }

    try {
      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return timestamp;
      }

      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getStatus = (action) => {
    if (!action) {
      return "Success";
    }

    const normalizedAction = action.toUpperCase();

    if (
      normalizedAction.includes("FAILED") ||
      normalizedAction.includes("FAIL")
    ) {
      return "Failed";
    }

    return "Success";
  };

  const filteredLogs = logs.filter((log) => {
    const username = log.username || "";
    const action = log.action || "";
    const details = log.details || "";

    const matchesSearch =
      username.toLowerCase().includes(search.toLowerCase()) ||
      action.toLowerCase().includes(search.toLowerCase()) ||
      details.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === "All" ||
      action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const successfulEvents = logs.filter(
    (log) => getStatus(log.action) === "Success"
  ).length;

  const failedEvents = logs.filter(
    (log) => getStatus(log.action) === "Failed"
  ).length;

  const availableActions = [
    ...new Set(
      logs
        .map((log) => log.action)
        .filter(Boolean)
    ),
  ];

  return (
    <div className="personnel-page">

      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>
            Monitor and review important system activities.
          </p>
        </div>
      </div>

      <div className="audit-summary">

        <div className="audit-stat">
          <span>Total Events</span>
          <strong>{logs.length}</strong>
        </div>

        <div className="audit-stat">
          <span>Successful Events</span>
          <strong>{successfulEvents}</strong>
        </div>

        <div className="audit-stat">
          <span>Failed Events</span>
          <strong>{failedEvents}</strong>
        </div>

      </div>

      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2>System Activity</h2>

            <span>
              {filteredLogs.length} events displayed
            </span>
          </div>

          <div className="audit-filters">

            <input
              className="search-input"
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              className="filter-select"
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value)
              }
            >
              <option value="All">
                All Actions
              </option>

              {availableActions.map((action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action}
                </option>
              ))}
            </select>

          </div>

        </div>

        {loading && (
          <div style={{ padding: "20px" }}>
            Loading audit logs...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: "20px",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {

                    const status = getStatus(log.action);

                    return (
                      <tr key={log.id}>

                        <td>
                          <span className="timestamp">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {log.username || "—"}
                          </strong>
                        </td>

                        <td>
                          —
                        </td>

                        <td>
                          <span className="action-badge">
                            {log.action || "—"}
                          </span>
                        </td>

                        <td>
                          {log.details || "—"}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              status === "Success"
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default AuditLogs;