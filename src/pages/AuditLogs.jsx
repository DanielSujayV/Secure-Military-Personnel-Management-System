import { useState } from "react";

function AuditLogs() {
  const [logs] = useState([
    {
      id: "LOG001",
      timestamp: "2026-08-14 10:42:15",
      user: "admin",
      role: "Administrator",
      action: "PERSONNEL_CREATED",
      description: "Added personnel record MP004",
      status: "Success",
    },
    {
      id: "LOG002",
      timestamp: "2026-08-14 10:18:32",
      user: "commander01",
      role: "Commander",
      action: "LEAVE_APPROVED",
      description: "Approved leave request L002",
      status: "Success",
    },
    {
      id: "LOG003",
      timestamp: "2026-08-14 09:55:21",
      user: "admin",
      role: "Administrator",
      action: "UNIT_UPDATED",
      description: "Updated unit information U002",
      status: "Success",
    },
    {
      id: "LOG004",
      timestamp: "2026-08-14 09:31:08",
      user: "officer02",
      role: "Officer",
      action: "LOGIN",
      description: "User successfully authenticated",
      status: "Success",
    },
    {
      id: "LOG005",
      timestamp: "2026-08-14 09:12:44",
      user: "unknown",
      role: "Unknown",
      action: "LOGIN_FAILED",
      description: "Failed authentication attempt",
      status: "Failed",
    },
    {
      id: "LOG006",
      timestamp: "2026-08-14 08:48:19",
      user: "admin",
      role: "Administrator",
      action: "PROMOTION_UPDATED",
      description: "Updated promotion record PR002",
      status: "Success",
    },
  ]);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === "All" ||
      log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

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
          <strong>
            {logs.filter(
              (log) => log.status === "Success"
            ).length}
          </strong>
        </div>

        <div className="audit-stat">
          <span>Failed Events</span>
          <strong>
            {logs.filter(
              (log) => log.status === "Failed"
            ).length}
          </strong>
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

              <option value="LOGIN">
                Login
              </option>

              <option value="LOGIN_FAILED">
                Failed Login
              </option>

              <option value="PERSONNEL_CREATED">
                Personnel Created
              </option>

              <option value="UNIT_UPDATED">
                Unit Updated
              </option>

              <option value="LEAVE_APPROVED">
                Leave Approved
              </option>

              <option value="PROMOTION_UPDATED">
                Promotion Updated
              </option>
            </select>

          </div>

        </div>


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

              {filteredLogs.map((log) => (

                <tr key={log.id}>

                  <td>
                    <span className="timestamp">
                      {log.timestamp}
                    </span>
                  </td>

                  <td>
                    <strong>{log.user}</strong>
                  </td>

                  <td>{log.role}</td>

                  <td>
                    <span className="action-badge">
                      {log.action}
                    </span>
                  </td>

                  <td>{log.description}</td>

                  <td>

                    <span
                      className={`status-badge ${
                        log.status === "Success"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {log.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default AuditLogs;