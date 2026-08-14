import { useState } from "react";

function Personnel() {
  const [personnel, setPersonnel] = useState([
    {
      id: "MP001",
      name: "Arun Kumar",
      rank: "Major",
      unit: "Unit A1",
      joiningDate: "2019-06-12",
      contact: "9876543210",
      status: "Active",
    },
    {
      id: "MP002",
      name: "Ravi Sharma",
      rank: "Captain",
      unit: "Unit B2",
      joiningDate: "2021-03-18",
      contact: "9876543211",
      status: "Active",
    },
    {
      id: "MP003",
      name: "Vikram Singh",
      rank: "Lieutenant",
      unit: "Unit A1",
      joiningDate: "2022-09-05",
      contact: "9876543212",
      status: "On Leave",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [viewingPerson, setViewingPerson] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    rank: "",
    unit: "",
    joiningDate: "",
    contact: "",
    status: "Active",
  });

  const filteredPersonnel = personnel.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase()) ||
    person.id.toLowerCase().includes(search.toLowerCase())
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
      id: "",
      name: "",
      rank: "",
      unit: "",
      joiningDate: "",
      contact: "",
      status: "Active",
    });

    setShowForm(true);
  };

  const openEditForm = (person) => {
    setEditingPerson(person);
    setFormData(person);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingPerson) {
      setPersonnel(
        personnel.map((person) =>
          person.id === editingPerson.id ? formData : person
        )
      );
    } else {
      setPersonnel([...personnel, formData]);
    }

    setFormData({
      id: "",
      name: "",
      rank: "",
      unit: "",
      joiningDate: "",
      contact: "",
      status: "Active",
    });

    setEditingPerson(null);
    setShowForm(false);
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
                  name="id"
                  value={formData.id}
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
                  name="name"
                  value={formData.name}
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
                  <option value="">Select Rank</option>
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
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="Unit A1">
                    Unit A1
                  </option>
                  <option value="Unit B2">
                    Unit B2
                  </option>
                  <option value="Unit C3">
                    Unit C3
                  </option>
                </select>
              </div>


              <div className="input-group">
                <label>Date of Joining</label>

                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  required
                />
              </div>


              <div className="input-group">
                <label>Contact Number</label>

                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter contact number"
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
                  <option value="Active">
                    Active
                  </option>

                  <option value="On Leave">
                    On Leave
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>
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
                {editingPerson
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
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>


        <div className="table-container">

          <table>

            <thead>

              <tr>
                <th>Service No.</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Unit</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>


            <tbody>

              {filteredPersonnel.map((person) => (

                <tr key={person.id}>

                  <td>
                    <strong>
                      {person.id}
                    </strong>
                  </td>

                  <td>{person.name}</td>

                  <td>{person.rank}</td>

                  <td>{person.unit}</td>

                  <td>{person.joiningDate}</td>

                  <td>

                    <span
                      className={`status-badge ${
                        person.status === "Active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {person.status}
                    </span>

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

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

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
                  Service Number: {viewingPerson.id}
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
                  {viewingPerson.name}
                </strong>
              </div>

              <div>
                <span>Rank</span>
                <strong>
                  {viewingPerson.rank}
                </strong>
              </div>

              <div>
                <span>Unit</span>
                <strong>
                  {viewingPerson.unit}
                </strong>
              </div>

              <div>
                <span>Date of Joining</span>
                <strong>
                  {viewingPerson.joiningDate}
                </strong>
              </div>

              <div>
                <span>Contact</span>
                <strong>
                  {viewingPerson.contact}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {viewingPerson.status}
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