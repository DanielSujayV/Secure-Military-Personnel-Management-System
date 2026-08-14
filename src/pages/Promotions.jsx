import { useState } from "react";

function Promotions() {
  const [promotions, setPromotions] = useState([
    {
      id: "PR001",
      serviceNo: "MP001",
      personnel: "Arun Kumar",
      previousRank: "Captain",
      newRank: "Major",
      date: "2026-07-15",
      status: "Approved",
    },
    {
      id: "PR002",
      serviceNo: "MP002",
      personnel: "Ravi Sharma",
      previousRank: "Lieutenant",
      newRank: "Captain",
      date: "2026-08-01",
      status: "Pending",
    },
    {
      id: "PR003",
      serviceNo: "MP003",
      personnel: "Vikram Singh",
      previousRank: "Lieutenant",
      newRank: "Captain",
      date: "2026-06-20",
      status: "Approved",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [viewingPromotion, setViewingPromotion] = useState(null);

  const [formData, setFormData] = useState({
    serviceNo: "",
    personnel: "",
    previousRank: "",
    newRank: "",
    date: "",
    status: "Pending",
  });

  const filteredPromotions = promotions.filter(
    (promotion) =>
      promotion.personnel
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      promotion.serviceNo
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingPromotion(null);

    setFormData({
      serviceNo: "",
      personnel: "",
      previousRank: "",
      newRank: "",
      date: "",
      status: "Pending",
    });

    setShowForm(true);
  };

  const openEditForm = (promotion) => {
    setEditingPromotion(promotion);

    setFormData({
      serviceNo: promotion.serviceNo,
      personnel: promotion.personnel,
      previousRank: promotion.previousRank,
      newRank: promotion.newRank,
      date: promotion.date,
      status: promotion.status,
    });

    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingPromotion) {
      setPromotions(
        promotions.map((promotion) =>
          promotion.id === editingPromotion.id
            ? {
                ...promotion,
                ...formData,
              }
            : promotion
        )
      );
    } else {
      const newPromotion = {
        id: `PR${String(promotions.length + 1).padStart(3, "0")}`,
        ...formData,
      };

      setPromotions([...promotions, newPromotion]);
    }

    setFormData({
      serviceNo: "",
      personnel: "",
      previousRank: "",
      newRank: "",
      date: "",
      status: "Pending",
    });

    setEditingPromotion(null);
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    setPromotions(
      promotions.map((promotion) =>
        promotion.id === id
          ? { ...promotion, status }
          : promotion
      )
    );

    setViewingPromotion(null);
  };

  return (
    <div className="personnel-page">

      <div className="page-header">
        <div>
          <h1>Promotion Management</h1>
          <p>
            Manage personnel promotions and rank history.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Promotion
        </button>
      </div>

      {showForm && (
        <div className="form-card">

          <div className="form-card-header">

            <div>
              <h2>
                {editingPromotion
                  ? "Edit Promotion"
                  : "Add Promotion"}
              </h2>

              <p>
                Enter the promotion details below.
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
                <label>Previous Rank</label>

                <select
                  name="previousRank"
                  value={formData.previousRank}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Rank</option>
                  <option value="Lieutenant">Lieutenant</option>
                  <option value="Captain">Captain</option>
                  <option value="Major">Major</option>
                  <option value="Colonel">Colonel</option>
                </select>
              </div>

              <div className="input-group">
                <label>New Rank</label>

                <select
                  name="newRank"
                  value={formData.newRank}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Rank</option>
                  <option value="Captain">Captain</option>
                  <option value="Major">Major</option>
                  <option value="Colonel">Colonel</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="input-group">
                <label>Promotion Date</label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
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
                {editingPromotion
                  ? "Save Changes"
                  : "Add Promotion"}
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2>Promotion Records</h2>

            <span>
              {promotions.length} promotion records
            </span>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Search by name or service number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Record ID</th>
                <th>Personnel</th>
                <th>Previous Rank</th>
                <th>New Rank</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredPromotions.map((promotion) => (

                <tr key={promotion.id}>

                  <td>
                    <strong>{promotion.id}</strong>
                  </td>

                  <td>
                    {promotion.personnel}
                    <br />
                    <small>{promotion.serviceNo}</small>
                  </td>

                  <td>{promotion.previousRank}</td>

                  <td>{promotion.newRank}</td>

                  <td>{promotion.date}</td>

                  <td>
                    <span
                      className={`status-badge ${
                        promotion.status === "Approved"
                          ? "active"
                          : promotion.status === "Pending"
                          ? "pending"
                          : "inactive"
                      }`}
                    >
                      {promotion.status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">

                      <button
                        className="view-button"
                        onClick={() =>
                          setViewingPromotion(promotion)
                        }
                      >
                        View
                      </button>

                      <button
                        className="edit-button"
                        onClick={() =>
                          openEditForm(promotion)
                        }
                      >
                        Edit
                      </button>

                    </div>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {viewingPromotion && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>
                <h2>Promotion Details</h2>

                <p>
                  Record ID: {viewingPromotion.id}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setViewingPromotion(null)
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>Personnel</span>
                <strong>
                  {viewingPromotion.personnel}
                </strong>
              </div>

              <div>
                <span>Service Number</span>
                <strong>
                  {viewingPromotion.serviceNo}
                </strong>
              </div>

              <div>
                <span>Previous Rank</span>
                <strong>
                  {viewingPromotion.previousRank}
                </strong>
              </div>

              <div>
                <span>New Rank</span>
                <strong>
                  {viewingPromotion.newRank}
                </strong>
              </div>

              <div>
                <span>Promotion Date</span>
                <strong>
                  {viewingPromotion.date}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {viewingPromotion.status}
                </strong>
              </div>

            </div>

            {viewingPromotion.status === "Pending" && (

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateStatus(
                      viewingPromotion.id,
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
                      viewingPromotion.id,
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

export default Promotions;