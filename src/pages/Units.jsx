import { useState } from "react";

function Units() {
  const [units, setUnits] = useState([
    {
      id: "U001",
      name: "Alpha Unit",
      location: "Headquarters",
      personnelCount: 42,
      status: "Active",
    },
    {
      id: "U002",
      name: "Bravo Unit",
      location: "Northern Sector",
      personnelCount: 36,
      status: "Active",
    },
    {
      id: "U003",
      name: "Charlie Unit",
      location: "Training Centre",
      personnelCount: 28,
      status: "Active",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [viewingUnit, setViewingUnit] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    location: "",
    personnelCount: 0,
    status: "Active",
  });

  const filteredUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(search.toLowerCase()) ||
      unit.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingUnit(null);

    setFormData({
      id: "",
      name: "",
      location: "",
      personnelCount: 0,
      status: "Active",
    });

    setShowForm(true);
  };

  const openEditForm = (unit) => {
    setEditingUnit(unit);
    setFormData(unit);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedUnit = {
      ...formData,
      personnelCount: Number(formData.personnelCount),
    };

    if (editingUnit) {
      setUnits(
        units.map((unit) =>
          unit.id === editingUnit.id ? updatedUnit : unit
        )
      );
    } else {
      setUnits([...units, updatedUnit]);
    }

    setFormData({
      id: "",
      name: "",
      location: "",
      personnelCount: 0,
      status: "Active",
    });

    setEditingUnit(null);
    setShowForm(false);
  };

  return (
    <div className="personnel-page">

      <div className="page-header">
        <div>
          <h1>Unit Management</h1>
          <p>Manage military units and their administrative information.</p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Unit
        </button>
      </div>

      {showForm && (
        <div className="form-card">

          <div className="form-card-header">
            <div>
              <h2>
                {editingUnit ? "Edit Unit" : "Add Unit"}
              </h2>

              <p>
                {editingUnit
                  ? "Update unit information."
                  : "Enter the unit information below."}
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
                <label>Unit ID</label>

                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  disabled={editingUnit !== null}
                  placeholder="e.g. U004"
                  required
                />
              </div>

              <div className="input-group">
                <label>Unit Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter unit name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Location</label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter administrative location"
                  required
                />
              </div>

              <div className="input-group">
                <label>Personnel Count</label>

                <input
                  type="number"
                  name="personnelCount"
                  value={formData.personnelCount}
                  onChange={handleChange}
                  min="0"
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                {editingUnit ? "Save Changes" : "Add Unit"}
              </button>

            </div>

          </form>
        </div>
      )}

      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2>Unit Records</h2>

            <span>
              {units.length} registered units
            </span>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Search by unit name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Unit Name</th>
                <th>Location</th>
                <th>Personnel</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredUnits.map((unit) => (

                <tr key={unit.id}>

                  <td>
                    <strong>{unit.id}</strong>
                  </td>

                  <td>{unit.name}</td>

                  <td>{unit.location}</td>

                  <td>{unit.personnelCount}</td>

                  <td>
                    <span
                      className={`status-badge ${
                        unit.status === "Active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {unit.status}
                    </span>
                  </td>

                  <td>

                    <div className="action-buttons">

                      <button
                        className="view-button"
                        onClick={() => setViewingUnit(unit)}
                      >
                        View
                      </button>

                      <button
                        className="edit-button"
                        onClick={() => openEditForm(unit)}
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

      {viewingUnit && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>
                <h2>Unit Details</h2>

                <p>
                  Unit ID: {viewingUnit.id}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setViewingUnit(null)}
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>Unit Name</span>
                <strong>{viewingUnit.name}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{viewingUnit.location}</strong>
              </div>

              <div>
                <span>Personnel Count</span>
                <strong>{viewingUnit.personnelCount}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{viewingUnit.status}</strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() => setViewingUnit(null)}
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  openEditForm(viewingUnit);
                  setViewingUnit(null);
                }}
              >
                Edit Unit
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Units;