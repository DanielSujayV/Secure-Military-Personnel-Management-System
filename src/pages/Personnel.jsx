import { useEffect, useState } from "react";

function Personnel() {
  const [personnel, setPersonnel] = useState([]);
  const [units, setUnits] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [viewingPerson, setViewingPerson] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    id: null,
    serviceNumber: "",
    fullName: "",
    rank: "",
    unitId: "",
    phone: "",
    email: "",
  });

  const API_BASE_URL = "http://localhost:8080/api";

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

  const loadPersonnel = async () => {
    const response = await fetch(
      `${API_BASE_URL}/personnel`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load personnel (${response.status})`
      );
    }

    return response.json();
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

        const [personnelData, unitsData] = await Promise.all([
          loadPersonnel(),
          loadUnits(),
        ]);

        setPersonnel(personnelData);
        setUnits(unitsData);
      } catch (err) {
        console.error(err);
        setError(
          err.message || "Failed to load personnel data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPersonnel = personnel.filter((person) =>
    (person.fullName || "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    (person.serviceNumber || "")
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
    setEditingPerson(null);

    setFormData({
      id: null,
      serviceNumber: "",
      fullName: "",
      rank: "",
      unitId: "",
      phone: "",
      email: "",
    });

    setError("");
    setShowForm(true);
  };

  const openEditForm = (person) => {
    setEditingPerson(person);

    setFormData({
      id: person.id,
      serviceNumber: person.serviceNumber || "",
      fullName: person.fullName || "",
      rank: person.rank || "",
      unitId: person.unit?.id
        ? String(person.unit.id)
        : "",
      phone: person.phone || "",
      email: person.email || "",
    });

    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.unitId) {
      setError("Please select a unit.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        serviceNumber: formData.serviceNumber,
        fullName: formData.fullName,
        rank: formData.rank,
        phone: formData.phone,
        email: formData.email,
        unit: {
          id: Number(formData.unitId),
        },
      };

      let response;

      if (editingPerson) {
        payload.id = editingPerson.id;

        response = await fetch(
          `${API_BASE_URL}/personnel`,
          {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/personnel`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        let message =
          editingPerson
            ? "Failed to update personnel."
            : "Failed to create personnel.";

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

      const savedPerson = await response.json();

      if (editingPerson) {
        setPersonnel((current) =>
          current.map((person) =>
            person.id === editingPerson.id
              ? savedPerson
              : person
          )
        );
      } else {
        setPersonnel((current) => [
          ...current,
          savedPerson,
        ]);
      }

      setFormData({
        id: null,
        serviceNumber: "",
        fullName: "",
        rank: "",
        unitId: "",
        phone: "",
        email: "",
      });

      setEditingPerson(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to save personnel."
      );
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (person) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${person.fullName}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");

    const response = await fetch(
      `${API_BASE_URL}/personnel/${person.id}`,
      {
        method: "DELETE",
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      let message = "Failed to delete personnel.";

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

    setPersonnel((current) =>
      current.filter(
        (personItem) => personItem.id !== person.id
      )
    );

    if (
      viewingPerson &&
      viewingPerson.id === person.id
    ) {
      setViewingPerson(null);
    }

  } catch (err) {
    console.error(err);

    setError(
      err.message || "Failed to delete personnel."
    );
  }
};

  const getUnitName = (unit) => {
    if (!unit) {
      return "—";
    }

    return unit.unitName || "—";
  };

  return (
    <div className="personnel-page">

      {/* PAGE HEADER */}

      <div className="page-header">

        <div>
          <h1>Personnel Management</h1>

          <p>
            Manage military personnel records and assignments.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Personnel
        </button>

      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          className="login-error"
          style={{ marginBottom: "20px" }}
        >
          {error}
        </div>
      )}

      {/* ADD / EDIT FORM */}

      {showForm && (

        <div className="form-card">

          <div className="form-card-header">

            <div>
              <h2>
                {editingPerson
                  ? "Edit Personnel"
                  : "Add Personnel"}
              </h2>

              <p>
                {editingPerson
                  ? "Update personnel information."
                  : "Enter the personnel information below."}
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
                  name="serviceNumber"
                  value={formData.serviceNumber}
                  onChange={handleChange}
                  disabled={editingPerson !== null}
                  placeholder="e.g. MP004"
                  required
                />
              </div>

              <div className="input-group">
                <label>Full Name</label>

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="input-group">
                <label>Rank</label>

                <select
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Rank
                  </option>

                  <option value="Lieutenant">
                    Lieutenant
                  </option>

                  <option value="Captain">
                    Captain
                  </option>

                  <option value="Major">
                    Major
                  </option>

                  <option value="Colonel">
                    Colonel
                  </option>
                </select>
              </div>

              <div className="input-group">
                <label>Unit</label>

                <select
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Unit
                  </option>

                  {units.map((unit) => (
                    <option
                      key={unit.id}
                      value={unit.id}
                    >
                      {unit.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Contact Number</label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  required
                />
              </div>

              <div className="input-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
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
                  : editingPerson
                    ? "Save Changes"
                    : "Add Personnel"}
              </button>

            </div>

          </form>

        </div>

      )}

      {/* PERSONNEL TABLE */}

      <div className="table-card">

        <div className="table-toolbar">

          <div>
            <h2>Personnel Records</h2>

            <span>
              {personnel.length} registered personnel
            </span>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Search by name or service number..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="table-container">

          {loading ? (
            <p>Loading personnel...</p>
          ) : (

            <table>

              <thead>

                <tr>
                  <th>Service No.</th>
                  <th>Name</th>
                  <th>Rank</th>
                  <th>Unit</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {filteredPersonnel.length === 0 ? (

                  <tr>
                    <td colSpan="7">
                      No personnel records found.
                    </td>
                  </tr>

                ) : (

                  filteredPersonnel.map((person) => (

                    <tr key={person.id}>

                      <td>
                        <strong>
                          {person.serviceNumber}
                        </strong>
                      </td>

                      <td>
                        {person.fullName}
                      </td>

                      <td>
                        {person.rank || "—"}
                      </td>

                      <td>
                        {getUnitName(person.unit)}
                      </td>

                      <td>
                        {person.phone || "—"}
                      </td>

                      <td>
                        {person.email || "—"}
                      </td>

                      <td>

                        <div className="action-buttons">

  <button
    className="view-button"
    onClick={() =>
      setViewingPerson(person)
    }
  >
    View
  </button>

  <button
    className="edit-button"
    onClick={() =>
      openEditForm(person)
    }
  >
    Edit
  </button>

  <button
    className="delete-button"
    onClick={() =>
      handleDelete(person)
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

      {/* VIEW PERSONNEL MODAL */}

      {viewingPerson && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>
                <h2>Personnel Details</h2>

                <p>
                  Service Number:{" "}
                  {viewingPerson.serviceNumber}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setViewingPerson(null)
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>Full Name</span>
                <strong>
                  {viewingPerson.fullName}
                </strong>
              </div>

              <div>
                <span>Rank</span>
                <strong>
                  {viewingPerson.rank || "—"}
                </strong>
              </div>

              <div>
                <span>Unit</span>
                <strong>
                  {getUnitName(viewingPerson.unit)}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {viewingPerson.phone || "—"}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {viewingPerson.email || "—"}
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setViewingPerson(null)
                }
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  openEditForm(viewingPerson);
                  setViewingPerson(null);
                }}
              >
                Edit Personnel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Personnel;