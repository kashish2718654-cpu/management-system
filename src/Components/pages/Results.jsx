
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
  PencilSquare,
  PlusCircle,
  Trash,
  Trophy,
} from "react-bootstrap-icons";

const RESULTS_API = "http://127.0.0.1:8000/api/results/";
const STUDENTS_API = "http://127.0.0.1:8000/api/students/";
const EXAMS_API = "http://127.0.0.1:8000/api/examinations/";

const EMPTY_FORM = {
  student: "",
  examination: "",
  marks_obtained: "",
  remarks: "",
};

export default function Results() {
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedExam, setSelectedExam] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      
const [studentResponse, examResponse, resultResponse] =
  await Promise.all([
    fetch(STUDENTS_API, {
      method: "GET",
      credentials: "include",
    }),
    fetch(EXAMS_API, {
      method: "GET",
      credentials: "include",
    }),
    fetch(RESULTS_API, {
      method: "GET",
      credentials: "include",
    }),
  ]);


      if (
        !studentResponse.ok ||
        !examResponse.ok ||
        !resultResponse.ok
      ) {
        throw new Error(
          "Unable to load students, examinations, or results."
        );
      }

      const [studentData, examData, resultData] = await Promise.all([
        studentResponse.json(),
        examResponse.json(),
        resultResponse.json(),
      ]);

      setStudents(
        Array.isArray(studentData)
          ? studentData
          : studentData.results || []
      );

      setExams(
        Array.isArray(examData)
          ? examData
          : examData.results || []
      );

      setResults(
        Array.isArray(resultData)
          ? resultData
          : resultData.results || []
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

  const openEditModal = (result) => {
    setEditingId(result.id);
    setFormData({
      student: String(result.student),
      examination: String(result.examination),
      marks_obtained: String(result.marks_obtained),
      remarks: result.remarks || "",
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

  const selectedExamData = exams.find(
    (exam) => String(exam.id) === String(formData.examination)
  );

  const saveResult = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const marks = Number(formData.marks_obtained);

      if (!Number.isFinite(marks) || marks < 0) {
        throw new Error("Enter valid marks of zero or more.");
      }

      if (
        selectedExamData &&
        marks > Number(selectedExamData.total_marks)
      ) {
        throw new Error(
          `Marks cannot exceed ${selectedExamData.total_marks}.`
        );
      }

      const payload = {
        ...formData,
        student: Number(formData.student),
        examination: Number(formData.examination),
        marks_obtained: marks,
      };

      const response = await fetch(
        editingId
          ? `${RESULTS_API}${editingId}/`
          : RESULTS_API,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            credentials: "include",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const details = await response.json().catch(() => null);
        throw new Error(
          details ? JSON.stringify(details) : "Unable to save result."
        );
      }

      setShowModal(false);
      setMessage(
        editingId
          ? "Result updated successfully."
          : "Marks saved successfully."
      );

      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteResult = async (result) => {
    if (
      !window.confirm(
        `Delete the result for ${result.student_name} in ${result.examination_name}?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${RESULTS_API}${result.id}/`,
        { method: "DELETE" },
        {credentials: "include"}
      );

      if (!response.ok) {
        throw new Error("Unable to delete result.");
      }

      setResults((previous) =>
        previous.filter((item) => item.id !== result.id)
      );

      setMessage("Result deleted successfully.");
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredResults = results.filter((result) => {
    const examMatches =
      selectedExam === "All" ||
      String(result.examination) === selectedExam;

    const statusMatches =
      selectedStatus === "All" ||
      result.status === selectedStatus;

    const searchableText = [
      result.student_name,
      result.student_code,
      result.examination_name,
      result.subject,
    ]
      .join(" ")
      .toLowerCase();

    return (
      examMatches &&
      statusMatches &&
      searchableText.includes(search.toLowerCase())
    );
  });

  const passCount = filteredResults.filter(
    (result) => result.status === "Pass"
  ).length;

  const failCount = filteredResults.filter(
    (result) => result.status === "Fail"
  ).length;

  const averagePercentage = filteredResults.length
    ? (
        filteredResults.reduce(
          (sum, result) => sum + Number(result.percentage),
          0
        ) / filteredResults.length
      ).toFixed(2)
    : "0.00";

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <Trophy className="me-2" />
            Student Marks & Results
          </h2>
          <p className="text-muted mb-0">
            Enter marks and manage examination results.
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

          <Button
            variant="primary"
            onClick={openAddModal}
            disabled={exams.length === 0 || students.length === 0}
          >
            <PlusCircle className="me-2" />
            Enter Marks
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {exams.length === 0 && !loading && (
        <Alert variant="warning">
          No examinations found. Create an examination before entering marks.
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Results Found</div>
              <h3 className="fw-bold mt-2 mb-0">
                {filteredResults.length}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Passed</div>
              <h3 className="fw-bold text-success mt-2 mb-0">
                {passCount}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Failed</div>
              <h3 className="fw-bold text-danger mt-2 mb-0">
                {failCount}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-muted">Average Percentage</div>
              <h3 className="fw-bold mt-2 mb-0">
                {averagePercentage}%
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3 mb-3">
            <Col xs={12} md={5}>
              <Form.Label>Filter by Examination</Form.Label>
              <Form.Select
                value={selectedExam}
                onChange={(event) => setSelectedExam(event.target.value)}
              >
                <option value="All">All Examinations</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={String(exam.id)}>
                    {exam.name} — {exam.subject}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md={3}>
              <Form.Label>Filter by Result</Form.Label>
              <Form.Select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="All">All Results</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </Form.Select>
            </Col>

            <Col xs={12} md={4}>
              <Form.Label>Search</Form.Label>
              <Form.Control
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student or exam name..."
              />
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <Alert variant="info">
              No results found. Select Enter Marks to add the first result.
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Examination</th>
                  <th>Marks</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.id}>
                    <td>
                      <div className="fw-semibold">
                        {result.student_name}
                      </div>
                      <small className="text-muted">
                        {result.student_code}
                      </small>
                    </td>

                    <td>
                      <div className="fw-semibold">
                        {result.examination_name}
                      </div>
                      <small className="text-muted">
                        {result.subject}
                      </small>
                    </td>

                    <td>
                      {Number(result.marks_obtained)} / {result.total_marks}
                    </td>

                    <td>{Number(result.percentage).toFixed(2)}%</td>

                    <td>
                      <Badge
                        bg={result.status === "Pass" ? "success" : "danger"}
                      >
                        {result.status}
                      </Badge>
                    </td>

                    <td>{result.remarks || "—"}</td>

                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          title="Edit result"
                          onClick={() => openEditModal(result)}
                        >
                          <PencilSquare />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline-danger"
                          title="Delete result"
                          onClick={() => deleteResult(result)}
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
        <Form onSubmit={saveResult}>
          <Modal.Header closeButton={!saving}>
            <Modal.Title>
              {editingId ? "Edit Student Result" : "Enter Student Marks"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Examination *</Form.Label>
              <Form.Select
                name="examination"
                value={formData.examination}
                onChange={updateField}
                required
              >
                <option value="">Select examination</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} — {exam.subject}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

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

            {selectedExamData && (
              <Alert variant="info">
                Total marks: <strong>{selectedExamData.total_marks}</strong>
                {" | "}
                Passing marks: <strong>{selectedExamData.passing_marks}</strong>
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Marks Obtained *</Form.Label>
              <Form.Control
                type="number"
                name="marks_obtained"
                min="0"
                max={selectedExamData?.total_marks}
                step="0.01"
                value={formData.marks_obtained}
                onChange={updateField}
                required
              />
            </Form.Group>

            {selectedExamData && formData.marks_obtained !== "" && (
              <Alert
                variant={
                  Number(formData.marks_obtained) >=
                  Number(selectedExamData.passing_marks)
                    ? "success"
                    : "danger"
                }
              >
                Percentage:{" "}
                {(
                  (Number(formData.marks_obtained) /
                    Number(selectedExamData.total_marks)) *
                  100
                ).toFixed(2)}
                % —{" "}
                {Number(formData.marks_obtained) >=
                Number(selectedExamData.passing_marks)
                  ? "Pass"
                  : "Fail"}
              </Alert>
            )}

            <Form.Group>
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="remarks"
                value={formData.remarks}
                onChange={updateField}
                placeholder="Optional remarks"
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
                "Update Result"
              ) : (
                "Save Marks"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
