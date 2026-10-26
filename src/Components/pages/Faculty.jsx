
import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Badge,
  Modal,
  Spinner,
} from "react-bootstrap";

import {
  PersonPlusFill,
  Search,
  PencilSquare,
  Trash,
} from "react-bootstrap-icons";

import "./Faculty.css";

const API_URL = "http://127.0.0.1:8000/api/faculty/";

const INITIAL_FORM = {
  name: "",
  employee_id: "",
  email: "",
  phone: "",
  role: "Faculty",
  department: "",
  qualification: "",
  joining_date: "",
  salary: "",
  is_active: true,
};

function Faculty() {
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Fetch faculty and staff from Django API
  const fetchFaculty = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load faculty and staff.");
      }

      const data = await response.json();

      setFaculty(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message || "Could not connect to the Django server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  // Search faculty by name, role, department, or email
  const filteredFaculty = faculty.filter((member) => {
    const query = search.toLowerCase();

    return (
      (member.name || "").toLowerCase().includes(query) ||
      (member.role || "").toLowerCase().includes(query) ||
      (member.department || "").toLowerCase().includes(query) ||
      (member.email || "").toLowerCase().includes(query) ||
      (member.employee_id || "").toLowerCase().includes(query)
    );
  });

  // Update form fields
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Add new faculty member to Django database
  const handleSaveFaculty = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
     
        const url = editMode ? `${API_URL}${editingId}/` : API_URL;

        const response = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        ...formData,
        salary: Number(formData.salary || 0),
        }),
        });


      const data = await response.json();

      if (!response.ok) {
        const messages = Object.entries(data)
          .map(([field, errors]) => {
            const details = Array.isArray(errors)
              ? errors.join(", ")
              : String(errors);

            return `${field}: ${details}`;
          })
          .join("\n");

        throw new Error(messages || "Failed to save faculty member.");
      }

       
         if (editMode) {             
          setFaculty((previous) =>
          previous.map((member) =>
         member.id === editingId ? data : member
        )
        );
       } else {
        setFaculty((previous) => [...previous, data]);
       }

setFormData({ ...INITIAL_FORM });
setShowForm(false);
setEditingId(null);
setEditMode(false);

    } catch (err) {
      setError(err.message || "Unable to save faculty member.");
    } finally {
      setSaving(false);
    }
  };

     const handleEditFaculty = (member) => {
       setEditingId(member.id);
       setEditMode(true);

       setFormData({
       name: member.name || "",
        employee_id: member.employee_id || "",
       email: member.email || "",
       phone: member.phone || "",
       role: member.role || "Faculty",
       qualification: member.qualification || "",
       joining_date: member.joining_date || "",
       salary: member.salary ?? "",
       is_active: member.is_active ?? true,
     });

       setError("");
       setShowForm(true);
     };

  // Delete faculty member from Django database
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this faculty member?"
    );

    if (!confirmed) return;

    setError("");
    setDeletingId(id);

    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete faculty member.");
      }

      setFaculty((previous) =>
        previous.filter((member) => member.id !== id)
      );
    } catch (err) {
      setError(err.message || "Unable to delete faculty member.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalFaculty = faculty.length;
  const activeFaculty = faculty.filter((member) => member.is_active).length;
  const inactiveFaculty = totalFaculty - activeFaculty;

  return (
    <Container fluid className="faculty-page py-4">
      {/* Page Header */}
      <Row className="align-items-center mb-4">
        <Col>
          <h2 className="fw-bold mb-1">Faculty &amp; Staff</h2>
          <p className="text-muted mb-0">
            Manage your institute's faculty and staff members.
          </p>
        </Col>

        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
          >
            <PersonPlusFill className="me-2" />
            Add Faculty
          </Button>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={4}>
          <Card className="faculty-stat-card h-100">
            <Card.Body>
              <p className="text-muted mb-2">Total Faculty &amp; Staff</p>
              <h3 className="fw-bold mb-0">{totalFaculty}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={4}>
          <Card className="faculty-stat-card h-100">
            <Card.Body>
              <p className="text-muted mb-2">Active Members</p>
              <h3 className="fw-bold text-success mb-0">{activeFaculty}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={4}>
          <Card className="faculty-stat-card h-100">
            <Card.Body>
              <p className="text-muted mb-2">Inactive Members</p>
              <h3 className="fw-bold text-danger mb-0">{inactiveFaculty}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Error Message */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
          style={{ whiteSpace: "pre-line" }}
        >
          {error}
        </div>
      )}

      {/* Faculty Table */}
      <Card className="faculty-table-card">
        <Card.Body>
          <Row className="align-items-center mb-3 g-3">
            <Col>
              <h5 className="fw-bold mb-0">Faculty Directory</h5>
            </Col>

            <Col xs={12} md={5} lg={4}>
              <div className="d-flex align-items-center border rounded px-3">
                <Search className="text-muted me-2" />

                <Form.Control
                  type="search"
                  placeholder="Search faculty..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="border-0 shadow-none"
                />
              </div>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover align="middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading faculty...
                    </td>
                  </tr>
                ) : filteredFaculty.length > 0 ? (
                  filteredFaculty.map((member) => (
                    <tr key={member.id}>
                      <td className="fw-semibold">{member.name}</td>
                      <td>{member.employee_id}</td>
                      <td>{member.role}</td>
                      <td>{member.department || "—"}</td>
                      <td>{member.phone}</td>
                      <td>{member.email}</td>
                      <td>
                        <Badge
                          bg={member.is_active ? "success" : "secondary"}
                        >
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td>
                        
                       <Button
                       variant="outline-primary"
                       size="sm"
                       className="me-2"
                       title="Edit faculty member"
                       onClick={() => handleEditFaculty(member)}
                      >
                      <PencilSquare />
                      </Button>


                        <Button
                          variant="outline-danger"
                          size="sm"
                          title="Delete faculty member"
                          disabled={deletingId === member.id}
                          onClick={() => handleDelete(member.id)}
                        >
                          {deletingId === member.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <Trash />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      {search
                        ? "No faculty members match your search."
                        : "No faculty members found. Click Add Faculty to create one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Add Faculty Modal */}
      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
         <Modal.Title>
        {editMode ? "Edit Faculty & Staff" : "Add Faculty & Staff"}
       </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSaveFaculty}>
          <Modal.Body>
            {error && (
              <div
                className="alert alert-danger"
                role="alert"
                style={{ whiteSpace: "pre-line" }}
              >
                {error}
              </div>
            )}

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Employee ID *</Form.Label>
                  <Form.Control
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    placeholder="e.g. EMP001"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="Faculty">Faculty</option>
                    <option value="Admin Staff">Admin Staff</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. MCA, B.Tech"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Joining Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="Enter salary"
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>

              <Col md={6} className="d-flex align-items-end">
                <Form.Check
                  type="switch"
                  name="is_active"
                  label="Active Employee"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Faculty"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Faculty;
