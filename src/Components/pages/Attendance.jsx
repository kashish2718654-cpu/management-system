
import { useCallback, useEffect, useMemo, useState } from "react";
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
  CalendarCheck,
  PersonPlus,
  Save,
  FileEarmarkExcel,
  ClockHistory,
  ClipboardData,
} from "react-bootstrap-icons";

const STUDENTS_API = "http://127.0.0.1:8000/api/students/";
const ATTENDANCE_API = "http://127.0.0.1:8000/api/attendance/";
const IMPORT_EXCEL_API = "http://127.0.0.1:8000/api/import-excel/";

const today = () => {
  const now = new Date();
  const local = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 10);
};

const currentMonth = () => today().slice(0, 7);

const newStudentForm = () => ({
  name: "",
  phone: "",
  email: "",
  course: "Full Stack Development",
  joining_date: today(),
  fee_status: "Pending",
});

const defaultRecord = (student, date) => ({
  student: student.id,
  date,
  status: "Absent",
  check_in_time: null,
  remarks: "",
});

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const formatTime = (time) => {
  if (!time) return "—";

  const match = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return time;

  const [, hours, minutes] = match;
  const h = Number(hours);
  return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const getErrorMessage = (data, fallback) => {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  return (
    data.detail ||
    data.error ||
    Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
          ? value
          : JSON.stringify(value);

        return `${key}: ${message}`;
      })
      .join(" | ") ||
    fallback
  );
};

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(today());

  const [historyDate, setHistoryDate] = useState(today());
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [reportStudent, setReportStudent] = useState("");
  const [reportMonth, setReportMonth] = useState(currentMonth());
  const [reportRecords, setReportRecords] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState(newStudentForm);

  // Load students and attendance for the selected working date.
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, attendanceResponse] = await Promise.all([
        fetch(STUDENTS_API),
        fetch(
          `${ATTENDANCE_API}?date=${encodeURIComponent(attendanceDate)}`
        ),
      ]);

      if (!studentResponse.ok) {
        throw new Error("Unable to load students. Check the Students API.");
      }

      if (!attendanceResponse.ok) {
        throw new Error("Unable to load attendance. Check the Attendance API.");
      }

      const studentData = await studentResponse.json();
      const attendanceData = await attendanceResponse.json();

      const studentList = getList(studentData);
      const attendanceList = getList(attendanceData);
      const attendanceMap = {};

      studentList.forEach((student) => {
        attendanceMap[student.id] = defaultRecord(student, attendanceDate);
      });

      attendanceList.forEach((record) => {
        attendanceMap[record.student] = {
          student: record.student,
          date: record.date,
          status: record.status,
          check_in_time: record.check_in_time || null,
          remarks: record.remarks || "",
          id: record.id,
        };
      });

      setStudents(studentList);
      setRecords(attendanceMap);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to Django. Start the backend with python manage.py runserver."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, [attendanceDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Load saved history for a selected date.
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${ATTENDANCE_API}?date=${encodeURIComponent(historyDate)}`
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Could not load daily history."));
      }

      setHistoryRecords(getList(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyDate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Load one student's records for the selected month.
  const loadMonthlyReport = useCallback(async () => {
    if (!reportStudent || !reportMonth) {
      setReportRecords([]);
      return;
    }

    setReportLoading(true);
    setError("");

    try {
      const firstDay = `${reportMonth}-01`;
      const [year, month] = reportMonth.split("-").map(Number);
      const lastDayNumber = new Date(year, month, 0).getDate();
      const lastDay = `${reportMonth}-${String(lastDayNumber).padStart(2, "0")}`;

      // The current API filters by student, not date ranges.
      // Retrieve that student's saved records and filter the month here.
      const response = await fetch(
        `${ATTENDANCE_API}?student=${encodeURIComponent(reportStudent)}`
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Could not load monthly report."));
      }

      const filtered = getList(data).filter(
        (record) => record.date >= firstDay && record.date <= lastDay
      );

      setReportRecords(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  }, [reportStudent, reportMonth]);

  useEffect(() => {
    loadMonthlyReport();
  }, [loadMonthlyReport]);

  const updateRecord = (studentId, field, value) => {
    setRecords((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        [field]: value,
      },
    }));
    setMessage("");
  };

  const handleStudentField = (event) => {
    const { name, value } = event.target;

    setNewStudent((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addStudent = async (event) => {
    event.preventDefault();
    setAddingStudent(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(STUDENTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Could not add student."));
      }

      setShowAddStudent(false);
      setNewStudent(newStudentForm());

      await loadAttendance();
      setMessage("Student added successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  // Import .xlsx file using the existing Django import endpoint.
  const importStudentsExcel = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please select an Excel .xlsx file.");
      return;
    }

    setImportingExcel(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(IMPORT_EXCEL_API, {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Excel import failed. Check the import API URL.")
        );
      }

      await loadAttendance();

      const created = data.created ?? 0;
      const rowErrors = data.errors || [];

      setMessage(
        `${created} student(s) imported successfully.` +
          (rowErrors.length
            ? ` ${rowErrors.length} row(s) could not be imported.`
            : "")
      );

      if (rowErrors.length) {
        console.warn("Excel import row errors:", rowErrors);
      }
    } catch (err) {
      setError(err.message || "Could not import the Excel file.");
    } finally {
      setImportingExcel(false);
    }
  };

  // Save attendance using existing POST/PATCH endpoints.
  const saveAttendance = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      for (const student of students) {
        const record = records[student.id];
        if (!record) continue;

        const payload = {
          student: student.id,
          date: attendanceDate,
          status: record.status,
          remarks: record.remarks || "",
        };

        const response = await fetch(
          record.id
            ? `${ATTENDANCE_API}${record.id}/`
            : ATTENDANCE_API,
          {
            method: record.id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            `Could not save attendance for ${student.name || "student"}: ` +
              getErrorMessage(data, `HTTP ${response.status}`)
          );
        }
      }

      await loadAttendance();
      await loadHistory();
      await loadMonthlyReport();
      setMessage("Attendance saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(
    () =>
      students.reduce(
        (result, student) => {
          const status = records[student.id]?.status;

          if (status === "Present") result.present++;
          if (status === "Absent") result.absent++;
          if (status === "Late") result.late++;

          return result;
        },
        { present: 0, absent: 0, late: 0 }
      ),
    [students, records]
  );

  const percentage = students.length
    ? Math.round((counts.present / students.length) * 100)
    : 0;

  const reportCounts = useMemo(
    () =>
      reportRecords.reduce(
        (result, record) => {
          if (record.status === "Present") result.present++;
          if (record.status === "Absent") result.absent++;
          if (record.status === "Late") result.late++;
          result.total++;
          return result;
        },
        { present: 0, absent: 0, late: 0, total: 0 }
      ),
    [reportRecords]
  );

  // Late is counted as attended for this monthly percentage.
  const monthlyPercentage = reportCounts.total
    ? Math.round(
        ((reportCounts.present + reportCounts.late) / reportCounts.total) * 100
      )
    : 0;

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <CalendarCheck className="me-2" />
            Attendance Management
          </h2>
          <p className="text-muted mb-0">
            Faculty attendance, daily history, and monthly reports.
          </p>
        </div>

        <Button
          variant="outline-primary"
          onClick={() => {
            loadAttendance();
            loadHistory();
            loadMonthlyReport();
          }}
          disabled={loading || saving || importingExcel}
        >
          <ArrowClockwise className="me-2" />
          Refresh
        </Button>
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

      {/* Daily attendance dashboard */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col xs={12} md={4}>
              <Form.Label>Select Attendance Date</Form.Label>
              <Form.Control
                type="date"
                value={attendanceDate}
                max={today()}
                onChange={(event) => {
                  setAttendanceDate(event.target.value);
                  setMessage("");
                }}
                disabled={loading || saving || importingExcel}
              />
            </Col>

            <Col xs={12} md={8}>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="success" className="p-2">
                  Present: {counts.present}
                </Badge>
                <Badge bg="danger" className="p-2">
                  Absent: {counts.absent}
                </Badge>
                <Badge bg="warning" text="dark" className="p-2">
                  Late: {counts.late}
                </Badge>
                <Badge bg="primary" className="p-2">
                  Present: {percentage}%
                </Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Faculty marks daily attendance */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h5 className="fw-bold mb-0">Student Attendance List</h5>

            <div className="d-flex flex-wrap gap-2">
              <Form.Control
                type="file"
                accept=".xlsx"
                id="attendance-excel-input"
                className="d-none"
                onChange={importStudentsExcel}
                disabled={loading || saving || importingExcel}
              />

              <Button
                variant="success"
                onClick={() =>
                  document.getElementById("attendance-excel-input")?.click()
                }
                disabled={loading || saving || importingExcel}
              >
                {importingExcel ? (
                  <Spinner size="sm" className="me-2" />
                ) : (
                  <FileEarmarkExcel className="me-2" />
                )}
                {importingExcel ? "Importing..." : "Import Excel"}
              </Button>

              <Button
                variant="outline-primary"
                onClick={() => setShowAddStudent(true)}
                disabled={loading || addingStudent || importingExcel}
              >
                <PersonPlus className="me-2" />
                Add Student
              </Button>

              <Button
                variant="primary"
                onClick={saveAttendance}
                disabled={
                  loading ||
                  saving ||
                  importingExcel ||
                  students.length === 0
                }
              >
                {saving ? (
                  <Spinner size="sm" className="me-2" />
                ) : (
                  <Save className="me-2" />
                )}
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <Alert variant="info">
              No students found. Import an Excel file or click Add Student.
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th style={{ minWidth: 170 }}>Attendance Status</th>
                  <th style={{ minWidth: 140 }}>Check-in Time</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const record = records[student.id];

                  return (
                    <tr key={student.id}>
                      <td>{student.student_id || student.id}</td>
                      <td className="fw-semibold">{student.name || "Unnamed"}</td>
                      <td>{student.course || "—"}</td>
                      <td>
                        <Form.Select
                          value={record?.status || "Absent"}
                          onChange={(event) =>
                            updateRecord(student.id, "status", event.target.value)
                          }
                          disabled={saving}
                          aria-label={`Attendance status for ${student.name}`}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                        </Form.Select>
                      </td>
                      <td>
                        {record?.status === "Present"
                          ? formatTime(record?.check_in_time)
                          : "—"}
                      </td>
                      <td>
                        <Form.Control
                          value={record?.remarks || ""}
                          placeholder="Optional remarks"
                          onChange={(event) =>
                            updateRecord(student.id, "remarks", event.target.value)
                          }
                          disabled={saving}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Daily attendance history */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
            <h5 className="fw-bold mb-0">
              <ClockHistory className="me-2" />
              Daily Attendance History
            </h5>

            <Form.Group>
              <Form.Label>History Date</Form.Label>
              <Form.Control
                type="date"
                value={historyDate}
                max={today()}
                onChange={(event) => setHistoryDate(event.target.value)}
              />
            </Form.Group>
          </div>

          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading history...</span>
            </div>
          ) : historyRecords.length === 0 ? (
            <Alert variant="info" className="mb-0">
              No saved attendance records for {formatDate(historyDate)}.
              Select another date or save attendance first.
            </Alert>
          ) : (
            <Table responsive bordered hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Check-in Time</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.student_code || record.student}</td>
                    <td>{record.student_name || "—"}</td>
                    <td>{record.course || "—"}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <Badge
                        bg={
                          record.status === "Present"
                            ? "success"
                            : record.status === "Late"
                            ? "warning"
                            : "danger"
                        }
                        text={record.status === "Late" ? "dark" : undefined}
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td>{formatTime(record.check_in_time)}</td>
                    <td>{record.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Individual monthly report */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <h5 className="fw-bold mb-3">
            <ClipboardData className="me-2" />
            Individual Monthly Attendance Report
          </h5>

          <Row className="g-3 mb-4">
            <Col xs={12} md={6}>
              <Form.Label>Select Student</Form.Label>
              <Form.Select
                value={reportStudent}
                onChange={(event) => setReportStudent(event.target.value)}
              >
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {(student.student_id || student.id) + " - " + student.name}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md={6}>
              <Form.Label>Select Month</Form.Label>
              <Form.Control
                type="month"
                value={reportMonth}
                max={currentMonth()}
                onChange={(event) => setReportMonth(event.target.value)}
              />
            </Col>
          </Row>

          {!reportStudent ? (
            <Alert variant="info" className="mb-0">
              Select a student to view their monthly attendance report.
            </Alert>
          ) : reportLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Generating report...</span>
            </div>
          ) : (
            <>
              <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                  <Card className="h-100 bg-light border-0">
                    <Card.Body>
                      <div className="text-muted small">Present</div>
                      <h3 className="fw-bold text-success mb-0">
                        {reportCounts.present}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="h-100 bg-light border-0">
                    <Card.Body>
                      <div className="text-muted small">Absent</div>
                      <h3 className="fw-bold text-danger mb-0">
                        {reportCounts.absent}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="h-100 bg-light border-0">
                    <Card.Body>
                      <div className="text-muted small">Late</div>
                      <h3 className="fw-bold text-warning mb-0">
                        {reportCounts.late}
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="h-100 bg-light border-0">
                    <Card.Body>
                      <div className="text-muted small">Attendance Rate</div>
                      <h3 className="fw-bold text-primary mb-0">
                        {monthlyPercentage}%
                      </h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <p className="text-muted small">
                Rate = (Present + Late) / saved attendance records for the
                selected month. Dates without a saved record are not counted.
              </p>

              {reportRecords.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No saved attendance records for this student in{" "}
                  {reportMonth}.
                </Alert>
              ) : (
                <Table responsive bordered hover className="align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check-in Time</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reportRecords]
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.date)}</td>
                          <td>{record.status}</td>
                          <td>{formatTime(record.check_in_time)}</td>
                          <td>{record.remarks || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Student modal */}
      <Modal
        show={showAddStudent}
        onHide={() => !addingStudent && setShowAddStudent(false)}
        centered
      >
        <Form onSubmit={addStudent}>
          <Modal.Header closeButton>
            <Modal.Title>Add New Student</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student Name *</Form.Label>
              <Form.Control
                name="name"
                value={newStudent.name}
                onChange={handleStudentField}
                required
                placeholder="Enter full name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                name="phone"
                value={newStudent.phone}
                onChange={handleStudentField}
                required
                placeholder="Enter phone number"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newStudent.email}
                onChange={handleStudentField}
                placeholder="Enter email"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course *</Form.Label>
              <Form.Select
                name="course"
                value={newStudent.course}
                onChange={handleStudentField}
                required
              >
                <option>Full Stack Development</option>
                <option>Python Programming</option>
                <option>Data Science & ML</option>
                <option>Web Designing</option>
                <option>Digital Marketing</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Joining Date *</Form.Label>
              <Form.Control
                type="date"
                name="joining_date"
                value={newStudent.joining_date}
                onChange={handleStudentField}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Fee Status</Form.Label>
              <Form.Select
                name="fee_status"
                value={newStudent.fee_status}
                onChange={handleStudentField}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddStudent(false)}
              disabled={addingStudent}
            >
              Cancel
            </Button>

            <Button variant="primary" type="submit" disabled={addingStudent}>
              {addingStudent ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
