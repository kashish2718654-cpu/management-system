
import { useCallback, useEffect, useState } from "react";
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
  Alert,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";

import {
  BookFill,
  PlusCircle,
  Search,
  Trash,
  Calendar3,
  ArrowClockwise,
} from "react-bootstrap-icons";

import "./Courses.css";

const API = "http://127.0.0.1:8000/api";

const emptyCourse = {
  name: "",
  duration: "",
  fee: "",
  description: "",
  status: "Active",
};

const emptyBatch = {
  course: "",
  name: "",
  faculty: "",
  shift: "Morning",
  start_time: "09:00",
  end_time: "11:00",
  start_date: "",
  end_date: "",
  status: "Upcoming",
  students: [],
};

function Courses() {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("courses");

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [batchForm, setBatchForm] = useState(emptyBatch);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? Object.entries(data)
            .map(([key, value]) => {
              const text = Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value);

              return `${key}: ${text}`;
            })
            .join(" | ")
        : "The request failed.";

    throw new Error(message || "The request failed.");
  }

  return data;
};
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [courseData, batchData, studentData, facultyData] =
        await Promise.all([
          request(`${API}/courses/list/`),
          request(`${API}/courses/batches/`),
          request(`${API}/students/`),
          request(`${API}/faculty/`),
        ]);

      setCourses(Array.isArray(courseData) ? courseData : courseData.results || []);
      setBatches(Array.isArray(batchData) ? batchData : batchData.results || []);
      setStudents(
        Array.isArray(studentData) ? studentData : studentData.results || []
      );
      setFaculty(
        Array.isArray(facultyData) ? facultyData : facultyData.results || []
      );
    } catch (err) {
      setError(
        `Could not load the page data. Check that Django is running and the API URLs are correct. ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCourseChange = (event) => {
    const { name, value } = event.target;
    setCourseForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleBatchChange = (event) => {
    const { name, value } = event.target;
    setBatchForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAddCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request(`${API}/courses/list/`, {
        method: "POST",
        body: JSON.stringify({
          ...courseForm,
          fee: Number(courseForm.fee),
        }),
      });

      setCourseForm(emptyCourse);
      setShowCourseModal(false);
      setSuccess("Course saved to the database.");
      await loadData();
    } catch (err) {
      setError(`Could not save course. ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBatch = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await request(`${API}/courses/batches/`, {
        method: "POST",
        body: JSON.stringify({
          ...batchForm,
          course: Number(batchForm.course),
          faculty: batchForm.faculty
            ? Number(batchForm.faculty)
            : null,
          students: batchForm.students.map(Number),
        }),
      });

      setBatchForm(emptyBatch);
      setShowBatchModal(false);
      setSuccess("Batch saved to the database.");
      await loadData();
    } catch (err) {
      setError(`Could not save batch. ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;

    setError("");
    setSuccess("");

    try {
      await request(`${API}/courses/list/${id}/`, {
        method: "DELETE",
      });

      setSuccess("Course deleted.");
      await loadData();
    } catch (err) {
      setError(
        `Could not delete course. It may have batches linked to it. ${err.message}`
      );
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm("Delete this batch?")) return;

    setError("");
    setSuccess("");

    try {
      await request(`${API}/courses/batches/${id}/`, {
        method: "DELETE",
      });

      setSuccess("Batch deleted.");
      await loadData();
    } catch (err) {
      setError(`Could not delete batch. ${err.message}`);
    }
  };

  const filteredCourses = courses.filter((course) =>
    `${course.name} ${course.duration} ${course.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter((batch) =>
    `${batch.name} ${batch.course_name || ""} ${
      batch.faculty_name || ""
    } ${batch.shift} ${batch.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalEnrollments = batches.reduce(
    (total, batch) => total + Number(batch.student_count || 0),
    0
  );

  const formatFee = (fee) =>
    Number(fee || 0).toLocaleString("en-IN");

  return (
    <Container fluid className="courses-page">
      <div className="courses-header">
        <div>
          <h2>Courses &amp; Batches</h2>
          <p>Manage courses, fees, batch schedules, faculty and students.</p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="outline-primary" onClick={loadData}>
            <ArrowClockwise className="me-2" />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setError("");
              setCourseForm(emptyCourse);
              setShowCourseModal(true);
            }}
          >
            <PlusCircle className="me-2" />
            Add Course
          </Button>

          <Button
            variant="success"
            onClick={() => {
              setError("");
              setBatchForm(emptyBatch);
              setShowBatchModal(true);
            }}
          >
            <Calendar3 className="me-2" />
            Add Batch
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="course-stat-card h-100">
            <Card.Body>
              <p>Total Courses</p>
              <h3>{courses.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="course-stat-card h-100">
            <Card.Body>
              <p>Total Batches</p>
              <h3>{batches.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="course-stat-card h-100">
            <Card.Body>
              <p>Batch Enrollments</p>
              <h3>{totalEnrollments}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="courses-table-card">
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key || "courses")}
            className="mb-3"
          >
            <Tab
              eventKey="courses"
              title={
                <>
                  <BookFill className="me-2" />
                  Courses ({courses.length})
                </>
              }
            >
              <div className="courses-toolbar">
                <h5>Course Directory</h5>

                <div className="courses-search">
                  <Search />
                  <Form.Control
                    placeholder="Search courses..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading courses...</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Course Name</th>
                      <th>Duration</th>
                      <th>Fee</th>
                      <th>Batches</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <strong>{course.name}</strong>
                          {course.description && (
                            <div className="text-muted small">
                              {course.description}
                            </div>
                          )}
                        </td>
                        <td>{course.duration}</td>
                        <td>₹{formatFee(course.fee)}</td>
                        <td>{course.batch_count ?? 0}</td>
                        <td>
                          <Badge
                            bg={
                              course.status === "Active"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {course.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete course"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredCourses.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          No courses found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Tab>

            <Tab
              eventKey="batches"
              title={
                <>
                  <Calendar3 className="me-2" />
                  Batches ({batches.length})
                </>
              }
            >
              <div className="courses-toolbar">
                <h5>Batch Directory</h5>

                <div className="courses-search">
                  <Search />
                  <Form.Control
                    placeholder="Search batches..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading batches...</p>
                </div>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Batch Name</th>
                      <th>Course</th>
                      <th>Faculty</th>
                      <th>Shift</th>
                      <th>Schedule</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBatches.map((batch) => (
                      <tr key={batch.id}>
                        <td>{batch.name}</td>
                        <td>{batch.course_name}</td>
                        <td>{batch.faculty_name || "Not assigned"}</td>
                        <td>{batch.shift}</td>
                        <td>
                          {batch.start_time}–{batch.end_time}
                          <div className="text-muted small">
                            {batch.start_date} to {batch.end_date}
                          </div>
                        </td>
                        <td>{batch.student_count ?? 0}</td>
                        <td>
                          <Badge
                            bg={
                              batch.status === "Active"
                                ? "success"
                                : batch.status === "Cancelled"
                                  ? "danger"
                                  : "secondary"
                            }
                          >
                            {batch.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            title="Delete batch"
                            onClick={() => handleDeleteBatch(batch.id)}
                          >
                            <Trash />
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredBatches.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          No batches found. Add a batch to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Add Course Modal */}
      <Modal
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        centered
      >
        <Form onSubmit={handleAddCourse}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Course</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Course Name</Form.Label>
              <Form.Control
                name="name"
                value={courseForm.name}
                onChange={handleCourseChange}
                placeholder="Example: Python Programming"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                name="duration"
                value={courseForm.duration}
                onChange={handleCourseChange}
                placeholder="Example: 4 Months"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course Fee (₹)</Form.Label>
              <Form.Control
                type="number"
                name="fee"
                min="0"
                step="0.01"
                value={courseForm.fee}
                onChange={handleCourseChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={courseForm.description}
                onChange={handleCourseChange}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={courseForm.status}
                onChange={handleCourseChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowCourseModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Course"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Batch Modal */}
      <Modal
        show={showBatchModal}
        onHide={() => setShowBatchModal(false)}
        centered
        size="lg"
      >
        <Form onSubmit={handleAddBatch}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Batch</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {courses.length === 0 ? (
              <Alert variant="warning">
                Create a course before adding a batch.
              </Alert>
            ) : (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course</Form.Label>
                      <Form.Select
                        name="course"
                        value={batchForm.course}
                        onChange={handleBatchChange}
                        required
                      >
                        <option value="">Select course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Batch Name</Form.Label>
                      <Form.Control
                        name="name"
                        value={batchForm.name}
                        onChange={handleBatchChange}
                        placeholder="Example: Python Morning A"
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Faculty</Form.Label>
                      <Form.Select
                        name="faculty"
                        value={batchForm.faculty}
                        onChange={handleBatchChange}
                      >
                        <option value="">Not assigned</option>
                        {faculty
                          .filter(
                            (person) =>
                              person.is_active !== false &&
                              (!person.role || person.role === "Faculty")
                          )
                          .map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Shift</Form.Label>
                      <Form.Select
                        name="shift"
                        value={batchForm.shift}
                        onChange={handleBatchChange}
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="start_time"
                        value={batchForm.start_time}
                        onChange={handleBatchChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        name="end_time"
                        value={batchForm.end_time}
                        onChange={handleBatchChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="start_date"
                        value={batchForm.start_date}
                        onChange={handleBatchChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="end_date"
                        value={batchForm.end_date}
                        onChange={handleBatchChange}
                        min={batchForm.start_date || undefined}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={batchForm.status}
                        onChange={handleBatchChange}
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Enrol Existing Students</Form.Label>
                      <Form.Select
                        multiple
                        value={batchForm.students}
                        onChange={(event) => {
                          const selected = Array.from(
                            event.target.selectedOptions,
                            (option) => option.value
                          );
                          setBatchForm((previous) => ({
                            ...previous,
                            students: selected,
                          }));
                        }}
                      >
                        {students.map((student) => (
                          <option
                            key={student.id}
                            value={student.id}
                          >
                            {student.name} ({student.student_id || student.id})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text>
                        Hold Ctrl (Windows) while clicking to select multiple
                        students.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowBatchModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || courses.length === 0}
            >
              {saving ? "Saving..." : "Save Batch"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Courses;
