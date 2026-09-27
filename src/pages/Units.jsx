import { useEffect, useState } from "react";

function Units() {
  const API_BASE_URL = "http://localhost:8080/api";

  const [units, setUnits] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [viewingUnit, setViewingUnit] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    unitName: "",
    description: "",
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

  const loadUnits = async () => {
    const response = await fetch(
      `${API_BASE_URL}/units`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load units (${response.status})`
      );
    }

    return response.json();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await loadUnits();

        setUnits(data);
      } catch (err) {
        console.error(err);

        setError(
          err.message || "Failed to load units."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredUnits = units.filter(
    (unit) =>
      (unit.unitName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(unit.id || "")
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
    setEditingUnit(null);

    setFormData({
      unitName: "",
      description: "",
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (unit) => {
    setEditingUnit(unit);

    setFormData({
      unitName: unit.unitName || "",
      description: unit.description || "",
    });

    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        unitName: formData.unitName,
        description: formData.description,
      };

      let response;

      if (editingUnit) {
        response = await fetch(
          `${API_BASE_URL}/units`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
              id: editingUnit.id,
              ...payload,
            }),
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/units`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        let message = editingUnit
          ? "Failed to update unit."
          : "Failed to create unit.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.error ||
            message;
        } catch {
          // Ignore non-JSON error response.
        }

        throw new Error(message);
      }

      const savedUnit = await response.json();

      if (editingUnit) {
        setUnits((current) =>
          current.map((unit) =>
            unit.id === editingUnit.id
              ? savedUnit
              : unit
          )
        );
      } else {
        setUnits((current) => [
          ...current,
          savedUnit,
        ]);
      }

      setFormData({
        unitName: "",
        description: "",
      });

      setEditingUnit(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to save unit."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${unit.unitName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/units/${unit.id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        let message = "Failed to delete unit.";

        try {
          const errorData = await response.json();

          message =
            errorData.message ||
            errorData.error ||
            message;
        } catch {
          // Ignore non-JSON error response.
        }

        throw new Error(message);
      }

      setUnits((current) =>
        current.filter(
          (unitItem) => unitItem.id !== unit.id
        )
      );

      if (
        viewingUnit &&
        viewingUnit.id === unit.id
      ) {
        setViewingUnit(null);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to delete unit."
      );
    }
  };

  return (
    <div className="personnel-page">

      <div className="page-header">

        <div>
          <h1>Unit Management</h1>

          <p>
            Manage military units and their
            administrative information.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Unit
        </button>

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
              <h2>
                {editingUnit
                  ? "Edit Unit"
                  : "Add Unit"}
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

              {editingUnit && (
                <div className="input-group">
                  <label>Unit ID</label>

                  <input
                    type="text"
                    value={editingUnit.id}
                    disabled
                  />
                </div>
              )}

              <div className="input-group">
                <label>Unit Name</label>

                <input
                  type="text"
                  name="unitName"
                  value={formData.unitName}
                  onChange={handleChange}
                  placeholder="Enter unit name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Description</label>

                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter unit description"
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
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingUnit
                    ? "Save Changes"
                    : "Add Unit"}
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
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="table-container">

          {loading ? (
            <p>Loading units...</p>
          ) : (

            <table>

              <thead>
                <tr>
                  <th>Unit ID</th>
                  <th>Unit Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredUnits.length === 0 ? (

                  <tr>
                    <td colSpan="4">
                      No unit records found.
                    </td>
                  </tr>

                ) : (

                  filteredUnits.map((unit) => (

                    <tr key={unit.id}>

                      <td>
                        <strong>
                          {unit.id}
                        </strong>
                      </td>

                      <td>
                        {unit.unitName}
                      </td>

                      <td>
                        {unit.description || "—"}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="view-button"
                            onClick={() =>
                              setViewingUnit(unit)
                            }
                          >
                            View
                          </button>

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditForm(unit)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(unit)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          )}

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
                onClick={() =>
                  setViewingUnit(null)
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>Unit Name</span>

                <strong>
                  {viewingUnit.unitName}
                </strong>
              </div>

              <div>
                <span>Description</span>

                <strong>
                  {viewingUnit.description || "—"}
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setViewingUnit(null)
                }
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