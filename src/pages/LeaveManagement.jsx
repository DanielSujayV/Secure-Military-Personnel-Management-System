import { useState } from "react";

function LeaveManagement() {
  const [leaves, setLeaves] = useState([
    {
      id: "L001",
      personnel: "Arun Kumar",
      serviceNo: "MP001",
      type: "Casual Leave",
      from: "2026-08-20",
      to: "2026-08-22",
      reason: "Personal reasons",
      status: "Pending",
    },
    {
      id: "L002",
      personnel: "Ravi Sharma",
      serviceNo: "MP002",
      type: "Annual Leave",
      from: "2026-09-01",
      to: "2026-09-07",
      reason: "Family visit",
      status: "Approved",
    },
    {
      id: "L003",
      personnel: "Vikram Singh",
      serviceNo: "MP003",
      type: "Medical Leave",
      from: "2026-08-15",
      to: "2026-08-18",
      reason: "Medical treatment",
      status: "Rejected",
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [viewingLeave, setViewingLeave] = useState(null);

  const [formData, setFormData] = useState({
    personnel: "",
    serviceNo: "",
    type: "",
    from: "",
    to: "",
    reason: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newLeave = {
      id: `L${String(leaves.length + 1).padStart(3, "0")}`,
      ...formData,
      status: "Pending",
    };

    setLeaves([...leaves, newLeave]);

    setFormData({
      personnel: "",
      serviceNo: "",
      type: "",
      from: "",
      to: "",
      reason: "",
    });

    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    setLeaves(
      leaves.map((leave) =>
        leave.id === id
          ? { ...leave, status }
          : leave
      )
    );

    setViewingLeave(null);
  };

  return (
    <div className="personnel-page">

      <div className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p>
            Manage personnel leave applications and approvals.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          + Apply for Leave
        </button>
      </div>


      {showForm && (
        <div className="form-card">

          <div className="form-card-header">
            <div>
              <h2>Apply for Leave</h2>
              <p>
                Enter the leave application details.
              </p>
            </div>

            <button
              className="close-button"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
          </div>


          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="input-group">
                <label>Personnel Name</label>

                <input
                  type="text"
                  name="personnel"
                  value={formData.personnel}
                  onChange={handleChange}
                  placeholder="Enter personnel name"
                  required
                />
              </div>


              <div className="input-group">
                <label>Service Number</label>

                <input
                  type="text"
                  name="serviceNo"
                  value={formData.serviceNo}
                  onChange={handleChange}
                  placeholder="e.g. MP004"
                  required
                />
              </div>


              <div className="input-group">
                <label>Leave Type</label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Leave Type
                  </option>

                  <option value="Casual Leave">
                    Casual Leave
                  </option>

                  <option value="Annual Leave">
                    Annual Leave
                  </option>

                  <option value="Medical Leave">
                    Medical Leave
                  </option>
                </select>
              </div>


              <div className="input-group">
                <label>From</label>

                <input
                  type="date"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="input-group">
                <label>To</label>

                <input
                  type="date"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="input-group">
                <label>Reason</label>

                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Enter reason"
                  required
                />
              </div>

            </div>


            <div className="form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                Submit Application
              </button>

            </div>

          </form>

        </div>
      )}


      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2>Leave Applications</h2>

            <span>
              {leaves.length} applications
            </span>
          </div>

        </div>


        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Request ID</th>
                <th>Personnel</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>


            <tbody>

              {leaves.map((leave) => (

                <tr key={leave.id}>

                  <td>
                    <strong>{leave.id}</strong>
                  </td>

                  <td>
                    {leave.personnel}
                    <br />
                    <small>{leave.serviceNo}</small>
                  </td>

                  <td>{leave.type}</td>

                  <td>{leave.from}</td>

                  <td>{leave.to}</td>

                  <td>
                    <span
                      className={`status-badge ${
                        leave.status === "Approved"
                          ? "active"
                          : leave.status === "Pending"
                          ? "pending"
                          : "inactive"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  <td>

                    <button
                      className="view-button"
                      onClick={() =>
                        setViewingLeave(leave)
                      }
                    >
                      Review
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>


      {viewingLeave && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>
                <h2>Leave Request</h2>

                <p>
                  Request ID: {viewingLeave.id}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setViewingLeave(null)
                }
              >
                ×
              </button>

            </div>


            <div className="details-grid">

              <div>
                <span>Personnel</span>
                <strong>
                  {viewingLeave.personnel}
                </strong>
              </div>

              <div>
                <span>Service Number</span>
                <strong>
                  {viewingLeave.serviceNo}
                </strong>
              </div>

              <div>
                <span>Leave Type</span>
                <strong>
                  {viewingLeave.type}
                </strong>
              </div>

              <div>
                <span>From</span>
                <strong>
                  {viewingLeave.from}
                </strong>
              </div>

              <div>
                <span>To</span>
                <strong>
                  {viewingLeave.to}
                </strong>
              </div>

              <div>
                <span>Reason</span>
                <strong>
                  {viewingLeave.reason}
                </strong>
              </div>

              <div>
                <span>Current Status</span>
                <strong>
                  {viewingLeave.status}
                </strong>
              </div>

            </div>


            {viewingLeave.status === "Pending" && (

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateStatus(
                      viewingLeave.id,
                      "Rejected"
                    )
                  }
                >
                  Reject
                </button>

                <button
                  className="primary-button"
                  onClick={() =>
                    updateStatus(
                      viewingLeave.id,
                      "Approved"
                    )
                  }
                >
                  Approve
                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default LeaveManagement;