import { useEffect, useState } from "react";
import { api } from "../services/api";

function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [personnelList, setPersonnelList] = useState([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [viewingPromotion, setViewingPromotion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    personnelId: "",
    previousRank: "",
    newRank: "",
    promotionDate: "",
    remarks: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [promotionData, personnelData] =
        await Promise.all([
          api.get("/promotions"),
          api.get("/personnel"),
        ]);

      setPromotions(promotionData);
      setPersonnelList(personnelData);

    } catch (err) {
      console.error(
        "Failed to load promotions:",
        err
      );

      setError(
        err.message ||
          "Failed to load promotion records."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions =
    promotions.filter((promotion) => {
      const personnel = promotion.personnel;

      const person =
        personnelList.find(
          (item) =>
            Number(item.id) ===
            Number(personnel?.id)
        ) || personnel;

      const name =
        person?.fullName || "";

      const serviceNumber =
        person?.serviceNumber || "";

      const searchText =
        search.toLowerCase();

      return (
        name
          .toLowerCase()
          .includes(searchText) ||
        serviceNumber
          .toLowerCase()
          .includes(searchText)
      );
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingPromotion(null);

    setFormData({
      personnelId: "",
      previousRank: "",
      newRank: "",
      promotionDate: "",
      remarks: "",
    });

    setShowForm(true);
    setError("");
  };

  const openEditForm = (promotion) => {
    setEditingPromotion(promotion);

    setFormData({
      personnelId:
        promotion.personnel?.id || "",
      previousRank:
        promotion.previousRank || "",
      newRank:
        promotion.newRank || "",
      promotionDate:
        promotion.promotionDate || "",
      remarks:
        promotion.remarks || "",
    });

    setShowForm(true);
    setError("");
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

      const promotionData = {
        personnel: {
          id: Number(
            formData.personnelId
          ),
        },

        previousRank:
          formData.previousRank,

        newRank:
          formData.newRank,

        promotionDate:
          formData.promotionDate,

        remarks:
          formData.remarks,
      };

      if (editingPromotion) {
        const updatedPromotion =
          await api.put(
            "/promotions",
            {
              id:
                editingPromotion.id,
              ...promotionData,
            }
          );

        setPromotions(
          promotions.map(
            (promotion) =>
              promotion.id ===
              editingPromotion.id
                ? updatedPromotion
                : promotion
          )
        );

      } else {
        const newPromotion =
          await api.post(
            "/promotions",
            promotionData
          );

        setPromotions([
          ...promotions,
          newPromotion,
        ]);
      }

      setFormData({
        personnelId: "",
        previousRank: "",
        newRank: "",
        promotionDate: "",
        remarks: "",
      });

      setEditingPromotion(null);
      setShowForm(false);

    } catch (err) {
      console.error(
        "Failed to save promotion:",
        err
      );

      setError(
        err.message ||
          "Failed to save promotion."
      );

    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this promotion record?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/promotions/${id}`
      );

      setPromotions(
        (currentPromotions) =>
          currentPromotions.filter(
            (promotion) =>
              promotion.id !== id
          )
      );

      if (
        viewingPromotion?.id === id
      ) {
        setViewingPromotion(null);
      }

    } catch (err) {
      console.error(
        "Failed to delete promotion:",
        err
      );

      setError(
        err.message ||
          "Failed to delete promotion."
      );
    }
  };

  const getPersonnel = (personnel) => {
    if (!personnel) {
      return null;
    }

    return (
      personnelList.find(
        (item) =>
          Number(item.id) ===
          Number(personnel.id)
      ) || personnel
    );
  };

  const getPersonnelName = (
    personnel
  ) => {
    const person =
      getPersonnel(personnel);

    return (
      person?.fullName ||
      "Unknown"
    );
  };

  const getServiceNumber = (
    personnel
  ) => {
    const person =
      getPersonnel(personnel);

    return (
      person?.serviceNumber ||
      "—"
    );
  };

  return (
    <div className="personnel-page">

      <div className="page-header">

        <div>
          <h1>
            Promotion Management
          </h1>

          <p>
            Manage personnel promotions
            and rank history.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddForm}
        >
          + Add Promotion
        </button>

      </div>

      {error && (
        <div className="login-error">
          {error}
        </div>
      )}

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
                Enter the promotion
                details below.
              </p>
            </div>

            <button
              className="close-button"
              onClick={() =>
                setShowForm(false)
              }
            >
              ×
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
          >

            <div className="form-grid">

              <div className="input-group">

                <label>
                  Personnel
                </label>

                <select
                  name="personnelId"
                  value={
                    formData.personnelId
                  }
                  onChange={
                    handleChange
                  }
                  required
                >

                  <option value="">
                    Select Personnel
                  </option>

                  {personnelList.map(
                    (personnel) => (

                      <option
                        key={
                          personnel.id
                        }
                        value={
                          personnel.id
                        }
                      >
                        {
                          personnel.serviceNumber
                        }{" "}
                        -{" "}
                        {
                          personnel.fullName
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="input-group">

                <label>
                  Previous Rank
                </label>

                <select
                  name="previousRank"
                  value={
                    formData.previousRank
                  }
                  onChange={
                    handleChange
                  }
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

                  <option value="General">
                    General
                  </option>

                </select>

              </div>

              <div className="input-group">

                <label>
                  New Rank
                </label>

                <select
                  name="newRank"
                  value={
                    formData.newRank
                  }
                  onChange={
                    handleChange
                  }
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

                  <option value="General">
                    General
                  </option>

                </select>

              </div>

              <div className="input-group">

                <label>
                  Promotion Date
                </label>

                <input
                  type="date"
                  name="promotionDate"
                  value={
                    formData.promotionDate
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

              </div>

              <div className="input-group">

                <label>
                  Remarks
                </label>

                <input
                  type="text"
                  name="remarks"
                  value={
                    formData.remarks
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter remarks"
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
                  ? "Saving..."
                  : editingPromotion
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
            <h2>
              Promotion Records
            </h2>

            <span>
              {promotions.length}{" "}
              promotion records
            </span>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Search by name or service number..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>
                  Record ID
                </th>

                <th>
                  Personnel
                </th>

                <th>
                  Previous Rank
                </th>

                <th>
                  New Rank
                </th>

                <th>
                  Date
                </th>

                <th>
                  Remarks
                </th>

                <th>
                  Action
                </th>
              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td colSpan="7">
                    Loading promotion
                    records...
                  </td>
                </tr>

              ) : filteredPromotions.length === 0 ? (

                <tr>
                  <td colSpan="7">
                    No promotion
                    records found.
                  </td>
                </tr>

              ) : (

                filteredPromotions.map(
                  (promotion) => (

                    <tr
                      key={
                        promotion.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            promotion.id
                          }
                        </strong>
                      </td>

                      <td>

                        {
                          getPersonnelName(
                            promotion.personnel
                          )
                        }

                        <br />

                        <small>
                          {
                            getServiceNumber(
                              promotion.personnel
                            )
                          }
                        </small>

                      </td>

                      <td>
                        {
                          promotion.previousRank
                        }
                      </td>

                      <td>
                        {
                          promotion.newRank
                        }
                      </td>

                      <td>
                        {
                          promotion.promotionDate
                        }
                      </td>

                      <td>
                        {
                          promotion.remarks ||
                          "—"
                        }
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="view-button"
                            onClick={() =>
                              setViewingPromotion(
                                promotion
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditForm(
                                promotion
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                promotion.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {viewingPromotion && (

        <div className="modal-overlay">

          <div className="details-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Promotion Details
                </h2>

                <p>
                  Record ID:{" "}
                  {
                    viewingPromotion.id
                  }
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setViewingPromotion(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="details-grid">

              <div>
                <span>
                  Personnel
                </span>

                <strong>
                  {
                    getPersonnelName(
                      viewingPromotion.personnel
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Service Number
                </span>

                <strong>
                  {
                    getServiceNumber(
                      viewingPromotion.personnel
                    )
                  }
                </strong>
              </div>

              <div>
                <span>
                  Previous Rank
                </span>

                <strong>
                  {
                    viewingPromotion.previousRank
                  }
                </strong>
              </div>

              <div>
                <span>
                  New Rank
                </span>

                <strong>
                  {
                    viewingPromotion.newRank
                  }
                </strong>
              </div>

              <div>
                <span>
                  Promotion Date
                </span>

                <strong>
                  {
                    viewingPromotion.promotionDate
                  }
                </strong>
              </div>

              <div>
                <span>
                  Remarks
                </span>

                <strong>
                  {
                    viewingPromotion.remarks ||
                    "—"
                  }
                </strong>
              </div>

            </div>

            <div className="modal-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setViewingPromotion(
                    null
                  )
                }
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  openEditForm(
                    viewingPromotion
                  );

                  setViewingPromotion(
                    null
                  );
                }}
              >
                Edit Promotion
              </button>

              <button
                className="delete-button"
                onClick={() =>
                  handleDelete(
                    viewingPromotion.id
                  )
                }
              >
                Delete Promotion
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Promotions;