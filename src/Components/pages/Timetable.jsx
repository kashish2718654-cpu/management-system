
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  ArrowClockwise,
  CalendarWeek,
  PencilSquare,
  PlusCircle,
  Trash,
} from "react-bootstrap-icons";

const API_URL = "http://127.0.0.1:8000/api/timetable/";
const STUDENTS_API = "http://127.0.0.1:8000/api/students/";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EMPTY_FORM = {
  student: "",
  subject: "",
  day: "Monday",
  start_time: "",
  end_time: "",
  teacher: "",
  room: "",
};

export default function Timetable() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentsResponse, classesResponse] = await Promise.all([
        fetch(STUDENTS_API),
        fetch(API_URL),
      ]);

      if (!studentsResponse.ok || !classesResponse.ok) {
        throw new Error("Unable to load students or timetable.");
      }

      const studentsData = await studentsResponse.json();
      const classesData = await classesResponse.json();

      setStudents(
        Array.isArray(studentsData)
          ? studentsData
          : studentsData.results || []
      );

      setClasses(
        Array.isArray(classesData)
          ? classesData
          : classesData.results || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      student: String(item.student),
      subject: item.subject,
      day: item.day,
      start_time: item.start_time?.slice(0, 5) || "",
      end_time: item.end_time?.slice(0, 5) || "",
      teacher: item.teacher || "",
      room: item.room || "",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveClass = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (formData.end_time <= formData.start_time) {
        throw new Error("End time must be later than start time.");
      }

      const payload = {
        ...formData,
        student: Number(formData.student),
      };

      const response = await fetch(
        editingId ? `${API_URL}${editingId}/` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(
          details ? JSON.stringify(details) : "Unable to save class."
        );
      }

      setShowModal(false);
      setMessage(
        editingId
          ? "Timetable entry updated successfully."
          : "Class added successfully."
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.subject} for ${item.student_name}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}${item.id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete timetable entry.");
      }

      setClasses((previous) =>
        previous.filter((entry) => entry.id !== item.id)
      );
      setMessage("Timetable entry deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredClasses = classes
    .filter((item) => selectedDay === "All" || item.day === selectedDay)
    .filter((item) => {
      const text = [
        item.student_name,
        item.student_code,
        item.subject,
        item.course,
        item.teacher,
        item.room,
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const dayDifference = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDifference !== 0) return dayDifference;
      return a.start_time.localeCompare(b.start_time);
    });

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <CalendarWeek className="me-2" />
            Timetable Management
          </h2>
          <p className="text-muted mb-0">
            Create, view, edit and manage student class schedules.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={loadData}
            disabled={loading || saving}
          >
            <ArrowClockwise className="me-2" />
            Refresh
          </Button>

          <Button variant="primary" onClick={openAddModal}>
            <PlusCircle className="me-2" />
            Add Class
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Total Scheduled Classes</div>
              <h3 className="fw-bold mt-2 mb-0">{classes.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Registered Students</div>
              <h3 className="fw-bold mt-2 mb-0">{students.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Classes on {selectedDay}</div>
              <h3 className="fw-bold mt-2 mb-0">
                {selectedDay === "All"
                  ? classes.length
                  : classes.filter((item) => item.day === selectedDay).length}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3 mb-3">
            <Col xs={12} md={4}>
              <Form.Label>Filter by Day</Form.Label>
              <Form.Select
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
              >
                <option value="All">All Days</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md={8}>
              <Form.Label>Search Classes</Form.Label>
              <Form.Control
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, subject, course or teacher..."
              />
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading timetable...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <Alert variant="info">
              No timetable entries found. Click Add Class to create one.
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Teacher</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClasses.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold">
                        {item.student_name}
                      </div>
                      <small className="text-muted">
                        {item.student_code}
                      </small>
                    </td>

                    <td>{item.subject}</td>
                    <td>
                      <Badge bg="primary">{item.day}</Badge>
                    </td>
                    <td>
                      {item.start_time?.slice(0, 5)} –{" "}
                      {item.end_time?.slice(0, 5)}
                    </td>
                    <td>{item.teacher || "—"}</td>
                    <td>{item.room || "—"}</td>

                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          title="Edit class"
                          onClick={() => openEditModal(item)}
                        >
                          <PencilSquare />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          title="Delete class"
                          onClick={() => deleteClass(item)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => !saving && setShowModal(false)}
        centered
      >
        <Form onSubmit={saveClass}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {editingId ? "Edit Timetable Entry" : "Add New Class"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Student *</Form.Label>
              <Form.Select
                name="student"
                value={formData.student}
                onChange={updateField}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_id || student.id} — {student.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                name="subject"
                value={formData.subject}
                onChange={updateField}
                placeholder="e.g. Python Programming"
                required
              />
            </Form.Group>

            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Day *</Form.Label>
                  <Form.Select
                    name="day"
                    value={formData.day}
                    onChange={updateField}
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teacher</Form.Label>
                  <Form.Control
                    name="teacher"
                    value={formData.teacher}
                    onChange={updateField}
                    placeholder="Teacher name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={updateField}
                    required
                  />
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={updateField}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label>Room / Classroom</Form.Label>
              <Form.Control
                name="room"
                value={formData.room}
                onChange={updateField}
                placeholder="e.g. Lab 1"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Saving...
                </>
              ) : editingId ? (
                "Update Class"
              ) : (
                "Save Class"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
