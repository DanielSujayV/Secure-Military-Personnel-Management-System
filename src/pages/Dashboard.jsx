function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Military Personnel Management System</p>
        </div>

        <div className="user-info">
          <strong>Administrator</strong>
          <span>System Administrator</span>
        </div>
      </div>


      <div className="welcome-section">
        <h2>Welcome back, Administrator</h2>
        <p>
          Here's an overview of the current personnel management system.
        </p>
      </div>


      <div className="stats-grid">

        <div className="stat-card">
          <span className="stat-title">Total Personnel</span>
          <strong className="stat-number">245</strong>
          <span className="stat-description">
            Registered personnel
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Active Units</span>
          <strong className="stat-number">12</strong>
          <span className="stat-description">
            Registered units
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Pending Leave</span>
          <strong className="stat-number">18</strong>
          <span className="stat-description">
            Awaiting approval
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-title">Pending Promotions</span>
          <strong className="stat-number">7</strong>
          <span className="stat-description">
            Awaiting review
          </span>
        </div>

      </div>


      <div className="dashboard-grid">

        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <span>Latest</span>
          </div>

          <div className="activity-list">

            <div className="activity-item">
              <div>
                <strong>Personnel record updated</strong>
                <p>MP001 · Arun Kumar</p>
              </div>

              <span>10:42 AM</span>
            </div>

            <div className="activity-item">
              <div>
                <strong>Leave request approved</strong>
                <p>MP014 · Casual Leave</p>
              </div>

              <span>10:18 AM</span>
            </div>

            <div className="activity-item">
              <div>
                <strong>New personnel added</strong>
                <p>MP246 · Personnel Registration</p>
              </div>

              <span>09:55 AM</span>
            </div>

            <div className="activity-item">
              <div>
                <strong>Promotion record updated</strong>
                <p>MP032 · Rank Update</p>
              </div>

              <span>09:21 AM</span>
            </div>

          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-header">
            <h2>System Status</h2>
          </div>

          <div className="status-list">

            <div className="system-status">
              <span className="status-indicator"></span>

              <div>
                <strong>Authentication</strong>
                <p>System operational</p>
              </div>
            </div>

            <div className="system-status">
              <span className="status-indicator"></span>

              <div>
                <strong>Database</strong>
                <p>System operational</p>
              </div>
            </div>

            <div className="system-status">
              <span className="status-indicator"></span>

              <div>
                <strong>Security Services</strong>
                <p>System operational</p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;