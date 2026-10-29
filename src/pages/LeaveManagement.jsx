import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function LeaveManagement() {
  const { role } = useAuth();
  const canReviewLeave = role === "COMMANDER";
  const canApplyLeave = role === "OFFICER" || role === "PERSONNEL";
  const API_BASE_URL = "http://localhost:8080/api";

  const [leaves, setLeaves] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [viewingLeave, setViewingLeave] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    personnelId: "",
    type: "",
    from: "",
    to: "",
    reason: "",
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [leaveResponse, personnelResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/leave-requests`, {
            method: "GET",
            headers: getHeaders(),
          }),

          fetch(`${API_BASE_URL}/personnel`, {
            method: "GET",
            headers: getHeaders(),
          }),
        ]);

      if (!leaveResponse.ok) {
        throw new Error(
          `Failed to load leave requests (${leaveResponse.status})`
        );
      }

      if (!personnelResponse.ok) {
        throw new Error(
          `Failed to load personnel (${personnelResponse.status})`
        );
      }

      const leaveData = await leaveResponse.json();
      const personnelData = await personnelResponse.json();

      setLeaves(leaveData);
      setPersonnelList(personnelData);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to load leave data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * Because the backend currently has no separate leaveType field,
   * new requests store the type together with the reason.
   *
   * Example:
   * "Casual Leave | Personal reasons"
   */
  const buildReason = () => {
    if (!formData.type) {
      return formData.reason;
    }

    return `${formData.type} | ${formData.reason}`;
  };

  const parseReason = (reason) => {
    if (!reason) {
      return {
        type: "Not specified",
        reason: "",
      };
    }

    const separator = " | ";
    const separatorIndex = reason.indexOf(separator);

    if (separatorIndex !== -1) {
      return {
        type: reason.slice(0, separatorIndex).trim(),
        reason: reason.slice(separatorIndex + separator.length).trim(),
      };
    }

    // Older requests may not have a separate leave type.
    const knownTypes = [
      "Casual Leave",
      "Annual Leave",
      "Medical Leave",
    ];

    const matchedType = knownTypes.find(
      (type) => reason.trim().toLowerCase() === type.toLowerCase()
    );

    return {
      type: matchedType || "Not specified",
      reason: matchedType ? "" : reason,
    };
  };

  const formatLeave = (leave) => {
    const parsed = parseReason(leave.reason);

    return {
      ...leave,
      type: parsed.type,
      displayReason: parsed.reason,
      personnelName:
        leave.personnel?.fullName || "Unknown",
      serviceNo:
        leave.personnel?.serviceNumber || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â",
    };
  };

  const formattedLeaves = leaves.map(formatLeave);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setFormData({
      personnelId: "",
      type: "",
      from: "",
      to: "",
      reason: "",
    });

    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.personnelId) {
      setError("Please select personnel.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const selectedPersonnel = personnelList.find(
        (person) =>
          String(person.id) ===
          String(formData.personnelId)
      );

      if (!selectedPersonnel) {
        throw new Error(
          "Selected personnel could not be found."
        );
      }

      const payload = {
        personnel: {
          id: selectedPersonnel.id,
        },
        startDate: formData.from,
        endDate: formData.to,
        reason: buildReason(),
      };

      const response = await fetch(
        `${API_BASE_URL}/leave-requests`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let message =
          "Failed to submit leave application.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.error ||
            message;
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      const createdLeave =
        await response.json();

      setLeaves((current) => [
        ...current,
        createdLeave,
      ]);

      setFormData({
        personnelId: "",
        type: "",
        from: "",
        to: "",
        reason: "",
      });

      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to submit leave application."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError("");

      const endpoint =
        status === "APPROVED"
          ? "approve"
          : "reject";

      const response = await fetch(
        `${API_BASE_URL}/leave-requests/${id}/${endpoint}`,
        {
          method: "PUT",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let message =
          status === "APPROVED"
            ? "Failed to approve leave request."
            : "Failed to reject leave request.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.error ||
            message;
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      const updatedLeave =
        await response.json();

      setLeaves((current) =>
        current.map((leave) =>
          leave.id === updatedLeave.id
            ? updatedLeave
            : leave
        )
      );

      setViewingLeave(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to update leave request."
      );
    }
  };

  const handleDelete = async (leave) => {
    const confirmed = window.confirm(
      `Delete leave request #${leave.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/leave-requests/${leave.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let message =
          "Failed to delete leave request.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.error ||
            message;
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      setLeaves((current) =>
        current.filter(
          (item) => item.id !== leave.id
        )
      );

      setViewingLeave(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to delete leave request."
      );
    }
  };

  return (
    <div className="personnel-page">

      <div className="page-header">

        <div>
          <h1>Leave Management</h1>

          <p>
            Manage personnel leave applications
            and approvals.
          </p>
        </div>

        {canApplyLeave && (<button
          className="primary-button"
          onClick={openAddForm}
        >
          + Apply for Leave
        </button>)}

      </div>

      {error && (
        <div
          className="login-error"
          style={{ marginBottom: "20px" }}
        >
          {error}
        </div>
      )}

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
              ÃƒÆ’Ã¢â‚¬â€
            </button>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="input-group">
                <label>Personnel Name</label>

                <select
                  name="personnelId"
                  value={formData.personnelId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Personnel
                  </option>

                  {personnelList.map(
                    (person) => (
                      <option
                        key={person.id}
                        value={person.id}
                      >
                        {person.fullName} (
                        {person.serviceNumber})
                      </option>
                    )
                  )}
                </select>
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
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Submitting..."
                  : "Submit Application"}
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

          {loading ? (
            <p>Loading leave applications...</p>
          ) : (

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

                {formattedLeaves.length === 0 ? (

                  <tr>
                    <td colSpan="7">
                      No leave applications found.
                    </td>
                  </tr>

                ) : (

                  formattedLeaves.map(
                    (leave) => (

                      <tr key={leave.id}>

                        <td>
                          <strong>
                            {leave.id}
                          </strong>
                        </td>

                        <td>
                          {leave.personnelName}
                          <br />
                          <small>
                            {leave.serviceNo}
                          </small>
                        </td>

                        <td>
                          {leave.type}
                        </td>

                        <td>
                          {leave.startDate}
                        </td>

                        <td>
                          {leave.endDate}
                        </td>

                        <td>

                          <span
                            className={`status-badge ${
                              leave.status ===
                              "APPROVED"
                                ? "active"
                                : leave.status ===
                                  "PENDING"
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
                              setViewingLeave(
                                leave
                              )
                            }
                          >
                            Review
                          </button>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {viewingLeave && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>
                <h2>Leave Request</h2>

                <p>
                  Request ID:{" "}
                  {viewingLeave.id}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setViewingLeave(null)
                }
              >
                ÃƒÆ’Ã¢â‚¬â€
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>Personnel</span>

                <strong>
                  {viewingLeave.personnelName}
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
                  {viewingLeave.startDate}
                </strong>
              </div>

              <div>
                <span>To</span>

                <strong>
                  {viewingLeave.endDate}
                </strong>
              </div>

              <div>
                <span>Reason</span>

                <strong>
                  {viewingLeave.displayReason}
                </strong>
              </div>

              <div>
                <span>Current Status</span>

                <strong>
                  {viewingLeave.status}
                </strong>
              </div>

            </div>

            {canReviewLeave && viewingLeave.status ===
              "PENDING" && (

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateStatus(
                      viewingLeave.id,
                      "REJECTED"
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
                      "APPROVED"
                    )
                  }
                >
                  Approve
                </button>

              </div>

            )}

            <div className="modal-actions">

              {canReviewLeave && viewingLeave.status === "PENDING" && (<button
                className="secondary-button"
                onClick={() =>
                  handleDelete(viewingLeave)
                }
              >
                Delete
              </button>)}

              <button
                className="secondary-button"
                onClick={() =>
                  setViewingLeave(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default LeaveManagement;

