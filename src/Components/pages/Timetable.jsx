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
const API_BASE = "http://localhost:8000/api";
const API_URL = `${API_BASE}/timetable/`;
const STUDENTS_API = `${API_BASE}/students/`;
const CSRF_URL = `${API_BASE}/auth/csrf/`;

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

function getCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
}

async function ensureCsrfToken() {
  // The backend should expose this endpoint and set Django's csrftoken cookie.
  const response = await fetch(CSRF_URL, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      "Could not obtain a CSRF token. Check the Django CSRF endpoint and CORS settings."
    );
  }

  // Some APIs return the token in JSON; otherwise Django sets the csrftoken cookie.
  const data = await response.json().catch(() => null);
  return data?.csrfToken || data?.csrf_token || getCookie("csrftoken");
}

async function apiRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let detail = "Request failed.";
    if (typeof data === "string") {
      detail = data;
    } else if (data && typeof data === "object") {
      detail = Object.entries(data)
        .map(([key, value]) => {
          const readable =
            Array.isArray(value) ? value.join(", ") :
            typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : String(value);
          return `${key}: ${readable}`;
        })
        .join(" | ");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Access denied (${response.status}). Please sign in as an authorized admin. If already signed in, check Django session, CSRF and CORS settings. ${detail}`
      );
    }

    throw new Error(`${detail} (HTTP ${response.status})`);
  }

  return data;
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

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
      const [studentsData, classesData] = await Promise.all([
        apiRequest(STUDENTS_API),
        apiRequest(API_URL),
      ]);

      setStudents(asList(studentsData));
      setClasses(asList(classesData));
    } catch (err) {
      console.error("Timetable load error:", err);
      setError(err.message || "Unable to load students or timetable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      student: String(item.student ?? item.student_id ?? ""),
      subject: item.subject || "",
      day: item.day || "Monday",
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
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const saveClass = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!formData.student) {
        throw new Error("Please select a student.");
      }
      if (!formData.subject.trim()) {
        throw new Error("Please enter a subject.");
      }
      if (!formData.start_time || !formData.end_time) {
        throw new Error("Please select start and end times.");
      }
      if (formData.end_time <= formData.start_time) {
        throw new Error("End time must be later than start time.");
      }

      const payload = {
        ...formData,
        student: Number(formData.student),
        subject: formData.subject.trim(),
        teacher: formData.teacher.trim(),
        room: formData.room.trim(),
      };

      await apiRequest(editingId ? `${API_URL}${editingId}/` : API_URL, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      setMessage(
        editingId
          ? "Timetable entry updated successfully."
          : "Class added successfully."
      );
      await loadData();
    } catch (err) {
      console.error("Save timetable entry error:", err);
      setError(err.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.subject || "this class"} for ${
        item.student_name || "this student"
      }?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await apiRequest(`${API_URL}${item.id}/`, { method: "DELETE" });
      setClasses((previous) => previous.filter((entry) => entry.id !== item.id));
      setMessage("Timetable entry deleted successfully.");
    } catch (err) {
      console.error("Delete timetable entry error:", err);
      setError(err.message || "Unable to delete timetable entry.");
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

      return text.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => {
      const dayDifference = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDifference !== 0) return dayDifference;
      return (a.start_time || "").localeCompare(b.start_time || "");
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

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert variant="success" dismissible onClose={() => setMessage("")}>
          {message}
        </Alert>
      )}

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
                        {item.student_name || item.student_full_name || "Student"}
                      </div>
                      <small className="text-muted">
                        {item.student_code || ""}
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
              type="button"
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
