
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Container, Row, Col, Card, Table, Form, Badge,
  Button, Alert, Spinner,
} from "react-bootstrap";
import {
  PeopleFill, WalletFill, CalendarCheck, BookFill,
  Download, ArrowClockwise,
} from "react-bootstrap-icons";
import "./Reports.css";

const API = "http://localhost:8000/api";

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const money = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

function Reports() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [feeAccounts, setFeeAccounts] = useState([]);
  const [payments, setPayments] = useState([]);

  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        `${API}/students/`,
        `${API}/attendance/`,
        `${API}/courses/list/`,
        `${API}/fees/accounts/`,
        `${API}/fees/payments/`,
      ];
const responses = await Promise.all(
  endpoints.map((url) =>
    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
  )
);
      const failed = responses.find((response) => !response.ok);

      if (failed) {
        throw new Error(`API request failed: ${failed.status}`);
      }

      const data = await Promise.all(
        responses.map((response) => response.json())
      );

      setStudents(getList(data[0]));
      setAttendance(getList(data[1]));
      setCourses(getList(data[2]));
      setFeeAccounts(getList(data[3]));
      setPayments(getList(data[4]));
    } catch (err) {
      setError(
        `Unable to load reports. Check that Django is running and all API URLs are correct. ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Build fee totals using real FeeAccount and Payment records.
  const feeByStudent = useMemo(() => {
    const result = {};

    feeAccounts.forEach((account) => {
      const key = String(account.student);
      result[key] = {
        accountId: account.id,
        totalFee: Number(account.total_fee || 0),
        amountPaid: Number(account.amount_paid || 0),
        balance: Number(account.balance || 0),
        status: account.status || "Unknown",
      };
    });

    return result;
  }, [feeAccounts]);

  // Payments are used to calculate collection totals and date-filtered collections.
  const paymentTotals = useMemo(() => {
    const filtered = payments.filter((payment) => {
      const date = String(payment.payment_date || "").slice(0, 10);
      if (startDate && (!date || date < startDate)) return false;
      if (endDate && (!date || date > endDate)) return false;
      return true;
    });

    return {
      amount: filtered.reduce(
        (sum, payment) => sum + Number(payment.amount || 0), 0
      ),
      count: filtered.length,
    };
  }, [payments, startDate, endDate]);

  const attendanceByStudent = useMemo(() => {
    const result = {};

    attendance.forEach((record) => {
      if (record.student == null) return;
      const key = String(record.student);
      if (!result[key]) result[key] = [];
      result[key].push(record);
    });

    return result;
  }, [attendance]);

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((record) => {
        const date = String(record.date || "").slice(0, 10);
        if (startDate && (!date || date < startDate)) return false;
        if (endDate && (!date || date > endDate)) return false;
        return true;
      }),
    [attendance, startDate, endDate]
  );

  const reports = useMemo(
    () =>
      students.map((student) => {
        const records = (
          attendanceByStudent[String(student.id)] || []
        ).filter((record) => {
          const date = String(record.date || "").slice(0, 10);
          if (startDate && (!date || date < startDate)) return false;
          if (endDate && (!date || date > endDate)) return false;
          return true;
        });

        const attended = records.filter((record) =>
          ["Present", "Late"].includes(record.status)
        ).length;

        const course = courses.find(
          (item) =>
            String(item.name || "").toLowerCase() ===
            String(student.course || "").toLowerCase()
        );

        const fee = feeByStudent[String(student.id)];

        return {
          id: student.id,
          studentId: student.student_id || student.id,
          name: student.name || "Unnamed student",
          course: student.course || "Not assigned",
          attendance: records.length
            ? Math.round((attended / records.length) * 100)
            : null,
          attendanceCount: records.length,
          courseFee: course ? Number(course.fee) : null,
          totalFee: fee?.totalFee ?? null,
          amountPaid: fee?.amountPaid ?? null,
          balance: fee?.balance ?? null,
          feeStatus: fee?.status || "No fee account",
        };
      }),
    [
      students, courses, attendanceByStudent,
      feeByStudent, startDate, endDate,
    ]
  );

  const filteredStudents = reports.filter((student) => {
    const matchesSearch =
      `${student.name} ${student.studentId} ${student.course}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType =
      reportType === "all" ||
      (reportType === "attendance" &&
        student.attendance !== null &&
        student.attendance < 75) ||
      (reportType === "pending" && student.balance > 0);

    return matchesSearch && matchesType;
  });

  const averageAttendance = filteredAttendance.length
    ? Math.round(
        (filteredAttendance.filter((record) =>
          ["Present", "Late"].includes(record.status)
        ).length / filteredAttendance.length) * 100
      )
    : 0;

  const totalFees = feeAccounts.reduce(
    (sum, account) => sum + Number(account.total_fee || 0), 0
  );

  const totalPaid = feeAccounts.reduce(
    (sum, account) => sum + Number(account.amount_paid || 0), 0
  );

  const totalBalance = feeAccounts.reduce(
    (sum, account) => sum + Number(account.balance || 0), 0
  );

  const paidStudents = feeAccounts.filter(
    (account) => account.status === "Paid"
  ).length;

  const pendingStudents = feeAccounts.filter(
    (account) => Number(account.balance || 0) > 0
  ).length;

  const exportCSV = () => {
    const headers = [
      "Student ID", "Student Name", "Course", "Attendance %",
      "Attendance Records", "Total Fee", "Amount Paid",
      "Balance", "Fee Status",
    ];

    const rows = filteredStudents.map((student) => [
      student.studentId,
      student.name,
      student.course,
      student.attendance === null ? "No records" : student.attendance,
      student.attendanceCount,
      student.totalFee ?? "No fee account",
      student.amountPaid ?? "No fee account",
      student.balance ?? "No fee account",
      student.feeStatus,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const content = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edumanage-report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="reports-page">
      <div className="reports-header">
        <div>
          <h2>Reports &amp; Analytics</h2>
          <p>Student, attendance, course and actual fee reports.</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-primary" onClick={loadReports}>
            <ArrowClockwise className="me-2" />
            Refresh
          </Button>
          <Button
            onClick={exportCSV}
            disabled={loading || filteredStudents.length === 0}
          >
            <Download className="me-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Card className="reports-table-card mb-4">
        <Card.Body>
          <h5 className="mb-3">Report Date Range</h5>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear Dates
              </Button>
            </Col>
          </Row>
          <small className="text-muted d-block mt-2">
            Dates filter attendance and payment collections. Total fees,
            paid totals and outstanding balances show all current fee accounts.
          </small>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        {[
          { label: "Total Students", value: students.length, icon: <PeopleFill className="report-icon text-primary" /> },
          { label: "Attendance Rate", value: `${averageAttendance}%`, icon: <CalendarCheck className="report-icon text-success" /> },
          { label: "Total Courses", value: courses.length, icon: <BookFill className="report-icon text-info" /> },
          { label: "Students With Outstanding Fees", value: pendingStudents, icon: <WalletFill className="report-icon text-warning" /> },
        ].map((item) => (
          <Col sm={6} xl={3} key={item.label}>
            <Card className="report-stat-card h-100">
              <Card.Body>
                {item.icon}
                <p>{item.label}</p>
                <h3>{loading ? "—" : item.value}</h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        {[
          { label: "Total Fees Assigned", value: totalFees },
          { label: "Total Collected", value: totalPaid },
          { label: "Outstanding Balance", value: totalBalance },
          { label: "Collected In Date Range", value: paymentTotals.amount },
        ].map((item) => (
          <Col sm={6} xl={3} key={item.label}>
            <Card className="report-stat-card h-100">
              <Card.Body>
                <p>{item.label}</p>
                <h3>₹{loading ? "—" : money(item.value)}</h3>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="reports-table-card mb-4">
        <Card.Body>
          <h5>Fee Summary</h5>
          <p className="text-muted">
            {paidStudents} students have fully paid their fee.
            {" "}{pendingStudents} have an outstanding balance.
            {" "}{paymentTotals.count} payment records fall within the selected dates.
          </p>
          <small className="text-muted">
            These totals come from existing fee accounts and payment records.
            Students without a fee account are not included in fee totals.
          </small>
        </Card.Body>
      </Card>

      <Card className="reports-table-card">
        <Card.Body>
          <div className="reports-toolbar">
            <h5>Student Report</h5>
            <div className="reports-filters">
              <Form.Control
                placeholder="Search student, ID or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Form.Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="attendance">Attendance Below 75%</option>
                <option value="pending">Outstanding Fees</option>
              </Form.Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading reports...</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Attendance</th>
                  <th>Records</th>
                  <th>Total Fee</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Fee Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>{student.course}</td>
                    <td>
                      {student.attendance === null ? (
                        <Badge bg="secondary">No records</Badge>
                      ) : (
                        <Badge bg={student.attendance < 75 ? "danger" : "success"}>
                          {student.attendance}%
                        </Badge>
                      )}
                    </td>
                    <td>{student.attendanceCount}</td>
                    <td>{student.totalFee === null ? "—" : `₹${money(student.totalFee)}`}</td>
                    <td>{student.amountPaid === null ? "—" : `₹${money(student.amountPaid)}`}</td>
                    <td>{student.balance === null ? "—" : `₹${money(student.balance)}`}</td>
                    <td>
                      <Badge
                        bg={
                          student.feeStatus === "Paid"
                            ? "success"
                            : student.balance > 0
                              ? "warning"
                              : "secondary"
                        }
                        text={student.balance > 0 ? "dark" : undefined}
                      >
                        {student.feeStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No matching reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Reports;
