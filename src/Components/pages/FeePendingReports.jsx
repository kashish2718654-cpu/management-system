
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  Download,
  Search,
  Wallet,
  PeopleFill,
  CurrencyRupee,
} from "react-bootstrap-icons";

const API_URL = "http://localhost:8000/api/fees/pending-report/";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export default function FeePendingReports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load fee reports.");
        }
        return response.json();
      })
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setError("");
      })
      .catch(() => {
        setError(
          "Could not load fee reports. Please check that Django is running."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((student) => {
      const matchesSearch =
        String(student.student_name || "").toLowerCase().includes(query) ||
        String(student.student_code || "").toLowerCase().includes(query);

      const matchesStatus =
        status === "All" || student.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [reports, search, status]);

  const totalOutstanding = filteredReports.reduce(
    (sum, student) => sum + Number(student.balance || 0),
    0
  );

  const pendingStudents = filteredReports.filter(
    (student) => student.status === "Pending"
  ).length;

  const exportCSV = () => {
    const headers = [
      "Student ID",
      "Student Name",
      "Course",
      "Total Fee",
      "Amount Paid",
      "Balance",
      "Status",
    ];

    const rows = filteredReports.map((student) => [
      student.student_code,
      student.student_name,
      student.course,
      student.total_fee,
      student.amount_paid,
      student.balance,
      student.status,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "fee-pending-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Fee Pending Reports</h2>
          <p className="text-muted mb-0">
            Track student fee payments and outstanding balances.
          </p>
        </div>

        <Button
          variant="success"
          onClick={exportCSV}
          disabled={loading || !!error || filteredReports.length === 0}
        >
          <Download className="me-2" />
          Export CSV
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2">Students with Pending Fees</p>
                  <h3 className="fw-bold mb-0">
                    {loading ? "—" : pendingStudents}
                  </h3>
                </div>
                <PeopleFill size={30} className="text-warning" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2">Students with Outstanding Fees</p>
                  <h3 className="fw-bold mb-0">
                    {loading ? "—" : filteredReports.length}
                  </h3>
                </div>
                <Wallet size={30} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2">Total Outstanding</p>
                  <h3 className="fw-bold mb-0">
                    {loading ? "—" : formatCurrency(totalOutstanding)}
                  </h3>
                </div>
                <CurrencyRupee size={30} className="text-danger" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Body>
          <Row className="g-3 mb-3">
            <Col xs={12} md={8}>
              <Form.Label>Search Student</Form.Label>
              <div className="position-relative">
                <Search
                  className="position-absolute text-muted"
                  style={{ left: 12, top: 12 }}
                />
                <Form.Control
                  className="ps-5"
                  placeholder="Search by student name or ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Col>

            <Col xs={12} md={4}>
              <Form.Label>Payment Status</Form.Label>
              <Form.Select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="All">All Outstanding</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </Form.Select>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2 mb-0">Loading fee reports...</p>
            </div>
          ) : (
            <Table responsive hover bordered className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Total Fee</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((student) => (
                  <tr key={student.account_id}>
                    <td>{student.student_code}</td>
                    <td>{student.student_name}</td>
                    <td>{student.course}</td>
                    <td>{formatCurrency(student.total_fee)}</td>
                    <td>{formatCurrency(student.amount_paid)}</td>
                    <td className="fw-semibold text-danger">
                      {formatCurrency(student.balance)}
                    </td>
                    <td>
                      <Badge
                        bg={student.status === "Pending" ? "warning" : "info"}
                        text={student.status === "Pending" ? "dark" : undefined}
                      >
                        {student.status}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      {reports.length === 0
                        ? "No outstanding fees found."
                        : "No students match your search or filter."}
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
