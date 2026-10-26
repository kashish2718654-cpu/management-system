
import { useEffect, useMemo, useState } from "react";

import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Modal,
  Pagination,
  Alert,
  Spinner,
} from "react-bootstrap";

import {
  Search,
  PersonPlusFill,
  PencilSquare,
  Trash,
  Eye,
  PeopleFill,
} from "react-bootstrap-icons";

import "./Students.css";

const API_URL = "http://localhost:8000/api/students/";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  course: "",
  batch: "Morning",
  admissionDate: new Date().toISOString().slice(0, 10),
  feeStatus: "Pending",
};

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [feeFilter, setFeeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Load students from Django
  async function fetchStudents() {
    try {
      setApiError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load students.");
      }

      const data = await response.json();

      const formattedStudents = data.map((student) => ({
        databaseId: student.id,
        id: student.student_id,
        name: student.name,
        phone: student.phone,
        email: student.email,
        course: student.course,
        batch: student.batch || "Morning",
        admissionDate: student.joining_date,
        feeStatus: student.fee_status,
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Fetch error:", error);
      setApiError(
        "Could not connect to Django. Make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  // Search and fee filter
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query = search.trim().toLowerCase();

      const matchesSearch = [
        student.id,
        student.name,
        student.phone,
        student.email,
        student.course,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesFee =
        feeFilter === "All" || student.feeStatus === feeFilter;

      return matchesSearch && matchesFee;
    });
  }, [students, search, feeFilter]);

  const paidCount = students.filter(
    (student) => student.feeStatus === "Paid"
  ).length;

  const pendingCount = students.filter(
    (student) =>
      student.feeStatus === "Pending" ||
      student.feeStatus === "Partial"
  ).length;

  // Open add form
  function openAddModal() {
    setEditingStudent(null);
    setFormData({
      ...emptyForm,
      admissionDate: new Date().toISOString().slice(0, 10),
    });
    setShowModal(true);
  }

  // Open edit form
  function openEditModal(student) {
    setEditingStudent(student);

    setFormData({
      name: student.name,
      phone: student.phone,
      email: student.email || "",
      course: student.course,
      batch: student.batch || "Morning",
      admissionDate: student.admissionDate,
      feeStatus: student.feeStatus,
    });

    setShowModal(true);
  }

  // Handle form inputs
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Add or update student
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setApiError("");

    try {
      const studentData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        course: formData.course,
        batch: formData.batch,
        joining_date: formData.admissionDate,
        fee_status: formData.feeStatus,
      };

      const isEditing = Boolean(editingStudent);

      const url = isEditing
        ? `${API_URL}${editingStudent.databaseId}/`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Django validation error:", result);
        alert(
          "Could not save student. Check the browser console for details."
        );
        return;
      }

      // Reload the real database records
      await fetchStudents();

      setShowModal(false);
      setEditingStudent(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error("Save error:", error);
      alert(
        "Could not connect to Django. Make sure the backend server is running."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete student from database
  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}${student.databaseId}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete student.");
      }

      setStudents((previous) =>
        previous.filter(
          (item) => item.databaseId !== student.databaseId
        )
      );

      if (viewingStudent?.databaseId === student.databaseId) {
        setViewingStudent(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete student. Check the Django server.");
    }
  }

  return (
    <div className="students-page">
      <Container fluid>
        {/* Page heading */}
        <div className="students-heading">
          <div>
            <p className="students-eyebrow">STUDENT MANAGEMENT</p>
            <h2>Students</h2>
            <p className="text-secondary mb-0">
              Manage student records, courses and fee status.
            </p>
          </div>

          <Button
            variant="primary"
            className="add-student-button"
            onClick={openAddModal}
          >
            <PersonPlusFill className="me-2" />
            Add Student
          </Button>
        </div>

        {apiError && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setApiError("")}
          >
            {apiError}
          </Alert>
        )}

        {/* Statistics */}
        <Row className="g-3 mb-4">
          <Col xs={12} sm={4}>
            <Card className="student-stat-card">
              <Card.Body>
                <div className="student-stat-icon blue">
                  <PeopleFill />
                </div>
                <p>Total Students</p>
                <h3>{students.length}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
            <Card className="student-stat-card">
              <Card.Body>
                <div className="student-stat-icon green">₹</div>
                <p>Fees Paid</p>
                <h3>{paidCount}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={4}>
            <Card className="student-stat-card">
              <Card.Body>
                <div className="student-stat-icon orange">!</div>
                <p>Fees Pending</p>
                <h3>{pendingCount}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Students table */}
        <Card className="students-table-card">
          <Card.Body>
            <div className="students-toolbar">
              <div>
                <h5>All Students</h5>
                <p>Search and manage institute students.</p>
              </div>

              <div className="students-filters">
                <InputGroup className="student-search">
                  <InputGroup.Text>
                    <Search />
                  </InputGroup.Text>

                  <Form.Control
                    type="search"
                    placeholder="Search students..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    aria-label="Search students"
                  />
                </InputGroup>

                <Form.Select
                  value={feeFilter}
                  onChange={(event) =>
                    setFeeFilter(event.target.value)
                  }
                  aria-label="Filter by fee status"
                  className="fee-filter"
                >
                  <option value="All">All Fees</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </Form.Select>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="students-table align-middle">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Course</th>
                    <th>Batch</th>
                    <th>Admission Date</th>
                    <th>Fee Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <Spinner animation="border" size="sm" />{" "}
                        Loading students...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        No students found. Try another search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.databaseId}>
                        <td>
                          <div className="student-name-cell">
                            <div className="student-avatar">
                              {student.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div className="student-full-name">
                                {student.name}
                              </div>
                              <small>{student.id}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>{student.phone}</div>
                          <small className="text-secondary">
                            {student.email}
                          </small>
                        </td>

                        <td>{student.course}</td>
                        <td>{student.batch}</td>
                        <td>{student.admissionDate}</td>

                        <td>
                          <Badge
                            bg={
                              student.feeStatus === "Paid"
                                ? "success"
                                : student.feeStatus === "Partial"
                                ? "info"
                                : "warning"
                            }
                            text={
                              student.feeStatus === "Pending"
                                ? "dark"
                                : "white"
                            }
                            pill
                          >
                            {student.feeStatus}
                          </Badge>
                        </td>

                        <td>
                          <div className="student-actions">
                            <Button
                              variant="light"
                              size="sm"
                              title="View student"
                              aria-label={`View ${student.name}`}
                              onClick={() =>
                                setViewingStudent(student)
                              }
                            >
                              <Eye />
                            </Button>

                            <Button
                              variant="light"
                              size="sm"
                              title="Edit student"
                              aria-label={`Edit ${student.name}`}
                              onClick={() => openEditModal(student)}
                            >
                              <PencilSquare />
                            </Button>

                            <Button
                              variant="light"
                              size="sm"
                              className="delete-student-button"
                              title="Delete student"
                              aria-label={`Delete ${student.name}`}
                              onClick={() => handleDelete(student)}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            <div className="students-table-footer">
              <span>
                Showing {filteredStudents.length} of {students.length} students
              </span>

              <Pagination className="mb-0">
                <Pagination.Prev disabled />
                <Pagination.Item active>1</Pagination.Item>
                <Pagination.Next disabled />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Add / Edit Student Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          if (!saving) setShowModal(false);
        }}
        centered
        size="lg"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingStudent ? "Edit Student" : "Add New Student"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                  maxLength={100}
                />
              </Col>

              <Col md={6}>
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  pattern="[0-9]{10}"
                  title="Enter a 10-digit phone number"
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Course *</Form.Label>
                <Form.Select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select course</option>
                  <option>Full Stack Development</option>
                  <option>Python Programming</option>
                  <option>Data Science & ML</option>
                  <option>Web Designing</option>
                  <option>Digital Marketing</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label>Batch *</Form.Label>
                <Form.Select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label>Admission Date *</Form.Label>
                <Form.Control
                  name="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={handleChange}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Fee Status *</Form.Label>
                <Form.Select
                  name="feeStatus"
                  value={formData.feeStatus}
                  onChange={handleChange}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="light"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingStudent
                ? "Save Changes"
                : "Add Student"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Student Modal */}
      <Modal
        show={Boolean(viewingStudent)}
        onHide={() => setViewingStudent(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Student Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewingStudent && (
            <div className="student-details">
              <div className="student-avatar large">
                {viewingStudent.name.charAt(0).toUpperCase()}
              </div>

              <h5>{viewingStudent.name}</h5>
              <p className="text-secondary">{viewingStudent.id}</p>

              <hr />

              <p>
                <strong>Phone:</strong> {viewingStudent.phone}
              </p>
              <p>
                <strong>Email:</strong> {viewingStudent.email}
              </p>
              <p>
                <strong>Course:</strong> {viewingStudent.course}
              </p>
              <p>
                <strong>Batch:</strong> {viewingStudent.batch}
              </p>
              <p>
                <strong>Admission Date:</strong>{" "}
                {viewingStudent.admissionDate}
              </p>
              <p>
                <strong>Fee Status:</strong>{" "}
                {viewingStudent.feeStatus}
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Students;
