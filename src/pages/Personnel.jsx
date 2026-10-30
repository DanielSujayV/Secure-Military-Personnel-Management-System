
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

const emptyForm = {
    id: null,
    serviceNumber: "",
    fullName: "",
    rank: "",
    unitId: "",
    phone: "",
    email: "",
};

function Personnel() {
    const { role } = useAuth();

    const [personnel, setPersonnel] = useState([]);
    const [units, setUnits] = useState([]);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [viewingPerson, setViewingPerson] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [unitsError, setUnitsError] = useState("");

    // Only Admins and Commanders see personnel management controls.
    const canManagePersonnel =
        role === "ADMIN" || role === "COMMANDER";

    const getHeaders = useCallback(() => {
        const token = localStorage.getItem("token");

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }, []);

    const loadPersonnel = useCallback(async () => {
        const response = await fetch(`${API_BASE_URL}/personnel`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to load personnel (${response.status})`
            );
        }

        return response.json();
    }, [getHeaders]);

    const loadUnits = useCallback(async () => {
        const response = await fetch(`${API_BASE_URL}/units`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to load units (${response.status})`);
        }

        return response.json();
    }, [getHeaders]);

    useEffect(() => {
        let cancelled = false;

        const fetchPersonnel = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await loadPersonnel();

                if (!cancelled) {
                    setPersonnel(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "Failed to load personnel data."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchPersonnel();

        return () => {
            cancelled = true;
        };
    }, [loadPersonnel]);

    useEffect(() => {
        let cancelled = false;

        // Units are needed for the management form, not for viewing records.
        if (!canManagePersonnel) {
            setUnits([]);
            setUnitsError("");
            return () => {
                cancelled = true;
            };
        }

        const fetchUnits = async () => {
            try {
                const data = await loadUnits();

                if (!cancelled) {
                    setUnits(data);
                    setUnitsError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setUnits([]);
                    setUnitsError(
                        err.message || "Failed to load units."
                    );
                }
            }
        };

        fetchUnits();

        return () => {
            cancelled = true;
        };
    }, [canManagePersonnel, loadUnits]);

    const filteredPersonnel = personnel.filter((person) => {
        const query = search.toLowerCase();

        return (
            (person.fullName || "").toLowerCase().includes(query) ||
            (person.serviceNumber || "").toLowerCase().includes(query)
        );
    });

    const handleChange = (event) => {
        setFormData((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const [formData, setFormData] = useState(emptyForm);

    const openAddForm = () => {
        if (!canManagePersonnel) return;

        setEditingPerson(null);
        setFormData({ ...emptyForm });
        setError("");
        setShowForm(true);
    };

    const openEditForm = (person) => {
        if (!canManagePersonnel) return;

        setEditingPerson(person);

        setFormData({
            id: person.id,
            serviceNumber: person.serviceNumber || "",
            fullName: person.fullName || "",
            rank: person.rank || "",
            unitId: person.unit?.id ? String(person.unit.id) : "",
            phone: person.phone || "",
            email: person.email || "",
        });

        setError("");
        setShowForm(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!canManagePersonnel) return;

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

            if (editingPerson) {
                payload.id = editingPerson.id;
            }

            const response = await fetch(`${API_BASE_URL}/personnel`, {
                method: editingPerson ? "PUT" : "POST",
                headers: getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let message = editingPerson
                    ? "Failed to update personnel."
                    : "Failed to create personnel.";

                try {
                    const errorData = await response.json();
                    message =
                        errorData.message ||
                        errorData.error ||
                        message;
                } catch {
                    // The server may return a non-JSON error response.
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
                setPersonnel((current) => [...current, savedPerson]);
            }

            setFormData({ ...emptyForm });
            setEditingPerson(null);
            setShowForm(false);
        } catch (err) {
            setError(err.message || "Failed to save personnel.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (person) => {
        if (!canManagePersonnel) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete ${person.fullName}?`
        );

        if (!confirmed) return;

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
                    // The server may return a non-JSON error response.
                }

                throw new Error(message);
            }

            setPersonnel((current) =>
                current.filter((item) => item.id !== person.id)
            );

            if (viewingPerson?.id === person.id) {
                setViewingPerson(null);
            }
        } catch (err) {
            setError(err.message || "Failed to delete personnel.");
        }
    };

    const getUnitName = (unit) => unit?.unitName || "—";

    return (
        <div className="personnel-page">
            <div className="page-header">
                <div>
                    <h1>Personnel Management</h1>
                    <p>
                        View military personnel records and assignments.
                    </p>
                </div>

                {canManagePersonnel && (
                    <button
                        type="button"
                        className="primary-button"
                        onClick={openAddForm}
                    >
                        + Add Personnel
                    </button>
                )}
            </div>

            {error && (
                <div
                    className="login-error"
                    style={{ marginBottom: "20px" }}
                >
                    {error}
                </div>
            )}

            {showForm && canManagePersonnel && (
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
                            type="button"
                            className="close-button"
                            onClick={() => setShowForm(false)}
                            aria-label="Close form"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label htmlFor="serviceNumber">
                                    Service Number
                                </label>
                                <input
                                    id="serviceNumber"
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
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="rank">Rank</label>
                                <select
                                    id="rank"
                                    name="rank"
                                    value={formData.rank}
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
                                <label htmlFor="unitId">Unit</label>
                                <select
                                    id="unitId"
                                    name="unitId"
                                    value={formData.unitId}
                                    onChange={handleChange}
                                    required
                                    disabled={units.length === 0}
                                >
                                    <option value="">Select Unit</option>
                                    {units.map((unit) => (
                                        <option
                                            key={unit.id}
                                            value={unit.id}
                                        >
                                            {unit.unitName}
                                        </option>
                                    ))}
                                </select>

                                {unitsError && (
                                    <p className="login-error">
                                        {unitsError}. You cannot save this form
                                        until unit data is available.
                                    </p>
                                )}
                            </div>

                            <div className="input-group">
                                <label htmlFor="phone">Contact Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter contact number"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
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
                                disabled={saving || units.length === 0}
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
                        onChange={(event) => setSearch(event.target.value)}
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
                                            {error
                                                ? "Unable to load personnel records."
                                                : "No personnel records found."}
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
                                            <td>{person.fullName}</td>
                                            <td>{person.rank || "—"}</td>
                                            <td>{getUnitName(person.unit)}</td>
                                            <td>{person.phone || "—"}</td>
                                            <td>{person.email || "—"}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        type="button"
                                                        className="view-button"
                                                        onClick={() =>
                                                            setViewingPerson(person)
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    {canManagePersonnel && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="edit-button"
                                                                onClick={() =>
                                                                    openEditForm(person)
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    handleDelete(person)
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
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
                                type="button"
                                className="close-button"
                                onClick={() => setViewingPerson(null)}
                                aria-label="Close personnel details"
                            >
                                ×
                            </button>
                        </div>

                        <div className="details-grid">
                            <div>
                                <span>Full Name</span>
                                <strong>{viewingPerson.fullName}</strong>
                            </div>
                            <div>
                                <span>Rank</span>
                                <strong>{viewingPerson.rank || "—"}</strong>
                            </div>
                            <div>
                                <span>Unit</span>
                                <strong>
                                    {getUnitName(viewingPerson.unit)}
                                </strong>
                            </div>
                            <div>
                                <span>Phone</span>
                                <strong>{viewingPerson.phone || "—"}</strong>
                            </div>
                            <div>
                                <span>Email</span>
                                <strong>{viewingPerson.email || "—"}</strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setViewingPerson(null)}
                            >
                                Close
                            </button>

                            {canManagePersonnel && (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => {
                                        openEditForm(viewingPerson);
                                        setViewingPerson(null);
                                    }}
                                >
                                    Edit Personnel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Personnel;
