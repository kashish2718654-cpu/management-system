
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
  CalendarEvent,
  PencilSquare,
  PlusCircle,
  Trash,
} from "react-bootstrap-icons";

const API_URL = "http://127.0.0.1:8000/api/examinations/";

const EMPTY_FORM = {
  name: "",
  subject: "",
  exam_date: "",
  start_time: "",
  end_time: "",
  total_marks: "100",
  passing_marks: "40",
  room: "",
};

export default function Examinations() {
  const [exams, setExams] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load examinations.");
      }

      const data = await response.json();
      setExams(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (exam) => {
    setEditingId(exam.id);
    setFormData({
      name: exam.name,
      subject: exam.subject,
      exam_date: exam.exam_date,
      start_time: exam.start_time.slice(0, 5),
      end_time: exam.end_time.slice(0, 5),
      total_marks: String(exam.total_marks),
      passing_marks: String(exam.passing_marks),
      room: exam.room || "",
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

  const saveExam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (formData.end_time <= formData.start_time) {
        throw new Error("End time must be later than start time.");
      }

      if (Number(formData.passing_marks) > Number(formData.total_marks)) {
        throw new Error("Passing marks cannot exceed total marks.");
      }

      const payload = {
        ...formData,
        total_marks: Number(formData.total_marks),
        passing_marks: Number(formData.passing_marks),
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
          details ? JSON.stringify(details) : "Unable to save exam."
        );
      }

      setShowModal(false);
      setMessage(
        editingId
          ? "Examination updated successfully."
          : "Examination added successfully."
      );

      await loadExams();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (exam) => {
    if (!window.confirm(`Delete "${exam.name}"?`)) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}${exam.id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete examination.");
      }

      setExams((previous) =>
        previous.filter((item) => item.id !== exam.id)
      );
      setMessage("Examination deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredExams = exams.filter((exam) =>
    [
      exam.name,
      exam.subject,
      exam.room,
      exam.exam_date,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const upcomingCount = exams.filter(
    (exam) => exam.exam_date >= new Date().toLocaleDateString("en-CA")
  ).length;

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <CalendarEvent className="me-2" />
            Examination Management
          </h2>
          <p className="text-muted mb-0">
            Schedule and manage student examinations.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={loadExams}
            disabled={loading || saving}
          >
            <ArrowClockwise className="me-2" />
            Refresh
          </Button>

          <Button variant="primary" onClick={openAddModal}>
            <PlusCircle className="me-2" />
            Schedule Exam
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Total Examinations</div>
              <h3 className="fw-bold mt-2 mb-0">{exams.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Upcoming / Today</div>
              <h3 className="fw-bold mt-2 mb-0">{upcomingCount}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Subjects Scheduled</div>
              <h3 className="fw-bold mt-2 mb-0">
                {new Set(exams.map((exam) => exam.subject)).size}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Form.Control
            className="mb-3"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search exam name, subject, date or room..."
          />

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading examinations...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <Alert variant="info">
              No examinations found. Click Schedule Exam to add one.
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Marks</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredExams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="fw-semibold">{exam.name}</td>
                    <td>{exam.subject}</td>
                    <td>{exam.exam_date}</td>
                    <td>
                      {exam.start_time.slice(0, 5)} –{" "}
                      {exam.end_time.slice(0, 5)}
                    </td>
                    <td>
                      <Badge bg="primary">
                        {exam.total_marks} total
                      </Badge>
                      <div className="small text-muted mt-1">
                        Pass: {exam.passing_marks}
                      </div>
                    </td>
                    <td>{exam.room || "—"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEditModal(exam)}
                          title="Edit exam"
                        >
                          <PencilSquare />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteExam(exam)}
                          title="Delete exam"
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
        <Form onSubmit={saveExam}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {editingId ? "Edit Examination" : "Schedule Examination"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Exam Name *</Form.Label>
              <Form.Control
                name="name"
                value={formData.name}
                onChange={updateField}
                placeholder="e.g. Python Final Exam"
                required
              />
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

            <Form.Group className="mb-3">
              <Form.Label>Exam Date *</Form.Label>
              <Form.Control
                type="date"
                name="exam_date"
                value={formData.exam_date}
                onChange={updateField}
                required
              />
            </Form.Group>

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

            <Row>
              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Marks *</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_marks"
                    min="1"
                    value={formData.total_marks}
                    onChange={updateField}
                    required
                  />
                </Form.Group>
              </Col>

              <Col sm={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Passing Marks *</Form.Label>
                  <Form.Control
                    type="number"
                    name="passing_marks"
                    min="0"
                    value={formData.passing_marks}
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
                "Update Exam"
              ) : (
                "Save Exam"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
