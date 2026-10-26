
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Dropdown,
} from "react-bootstrap";

import {
  PeopleFill,
  CashCoin,
  Wallet2,
  ArrowClockwise,
  CalendarCheckFill,
  BellFill,
} from "react-bootstrap-icons";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = {
  students: "http://127.0.0.1:8000/api/students/",
  accounts: "http://127.0.0.1:8000/api/fees/accounts/",
  payments: "http://127.0.0.1:8000/api/fees/payments/",
  attendance: "http://127.0.0.1:8000/api/attendance/",
};

const CHART_COLORS = [
  "#4285F4",
  "#34A853",
  "#FBBC05",
  "#EA4335",
  "#8E63CE",
  "#18A2A5",
  "#F47B42",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div>
          <div className="text-muted mb-2">{title}</div>
          <h3 className="fw-bold mb-1">{value}</h3>
          <small className="text-muted">{subtitle}</small>
        </div>

        <div
          className="rounded-3 p-3"
          style={{
            backgroundColor: `${color}18`,
            color,
          }}
        >
          {icon}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch live data from Django.
  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const responses = await Promise.all(
        [
          API.students,
          API.accounts,
          API.payments,
          API.attendance,
        ].map((url) => fetch(url))
      );

      const failedResponse = responses.find(
        (response) => !response.ok
      );

      if (failedResponse) {
        throw new Error(
          `API request failed with status ${failedResponse.status}.`
        );
      }

      const [
        studentData,
        accountData,
        paymentData,
        attendanceData,
      ] = await Promise.all(
        responses.map((response) => response.json())
      );

      setStudents(normalizeList(studentData));
      setAccounts(normalizeList(accountData));
      setPayments(normalizeList(paymentData));
      setAttendance(normalizeList(attendanceData));
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        `${err.message} Check that Django is running and the API URLs are correct.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and automatic refresh every 30 seconds.
  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Student and fee statistics.
  const stats = useMemo(() => {
    const totalFee = accounts.reduce(
      (sum, account) =>
        sum + Number(account.total_fee || 0),
      0
    );

    const collected = accounts.reduce(
      (sum, account) =>
        sum + Number(account.amount_paid || 0),
      0
    );

    const outstanding = accounts.reduce(
      (sum, account) =>
        sum + Math.max(0, Number(account.balance || 0)),
      0
    );

    const pendingCount = accounts.filter(
      (account) => account.status === "Pending"
    ).length;

    const partialCount = accounts.filter(
      (account) => account.status === "Partial"
    ).length;

    const paidCount = accounts.filter(
      (account) => account.status === "Paid"
    ).length;

    return {
      studentCount: students.length,
      totalFee,
      collected,
      outstanding,
      pendingCount,
      partialCount,
      paidCount,
    };
  }, [students, accounts]);

  // Attendance statistics for the current local date.
  const todayAttendance = useMemo(() => {
    const today = getLocalDate();

    const records = attendance.filter(
      (record) =>
        String(record.date || "").slice(0, 10) === today
    );

    const present = records.filter(
      (record) =>
        String(record.status || "").toLowerCase() === "present"
    ).length;

    const absent = records.filter(
      (record) =>
        String(record.status || "").toLowerCase() === "absent"
    ).length;

    const late = records.filter(
      (record) =>
        String(record.status || "").toLowerCase() === "late"
    ).length;

    const marked = records.length;

    return {
      present,
      absent,
      late,
      marked,
      rate:
        marked > 0
          ? Math.round(((present + late) / marked) * 100)
          : 0,
      date: today,
    };
  }, [attendance]);

  // Create notifications from existing API records.
  const notifications = useMemo(() => {
    const items = [];
    const today = getLocalDate();

    // New admissions from the last 7 days.
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    students.forEach((student) => {
      const admissionDate =
        student.joining_date ||
        student.admission_date ||
        student.admissionDate;

      if (!admissionDate) return;

      const parsedDate = new Date(admissionDate);

      if (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate >= new Date(
          sevenDaysAgo.getFullYear(),
          sevenDaysAgo.getMonth(),
          sevenDaysAgo.getDate()
        ) &&
        parsedDate <= now
      ) {
        items.push({
          id: `admission-${student.id || student.student_id}`,
          type: "admission",
          title: "New admission",
          message: `${student.name || "A student"} was recently admitted.`,
          date: admissionDate,
          color: "primary",
        });
      }
    });

    // Pending and partial fees.
    accounts.forEach((account) => {
      const status = String(account.status || "").toLowerCase();

      if (status === "pending" || status === "partial") {
        items.push({
          id: `fee-${account.id}`,
          type: "fee",
          title: status === "pending" ? "Pending fees" : "Partial fee payment",
          message: `${account.student_name || "A student"} has ${money(
            account.balance
          )} outstanding.`,
          date: "",
          color: "warning",
        });
      }
    });

    // Students marked absent or late today.
    attendance.forEach((record) => {
      const recordDate = String(record.date || "").slice(0, 10);
      const status = String(record.status || "").toLowerCase();

      if (
        recordDate === today &&
        (status === "absent" || status === "late")
      ) {
        const student = students.find(
          (item) =>
            String(item.id) === String(record.student) ||
            String(item.student_id) === String(record.student)
        );

        const studentName =
          record.student_name ||
          student?.name ||
          "A student";

        items.push({
          id: `attendance-${record.id}`,
          type: "attendance",
          title: status === "absent" ? "Absence alert" : "Late arrival",
          message: `${studentName} was marked ${status} today.`,
          date: recordDate,
          color: status === "absent" ? "danger" : "warning",
        });
      }
    });

    return items;
  }, [students, accounts, attendance]);

  // Fee chart data.
  const feeChartData = [
    { name: "Collected", amount: stats.collected },
    { name: "Outstanding", amount: stats.outstanding },
  ];

  // Student distribution by course.
  const courseChartData = useMemo(() => {
    const counts = {};

    students.forEach((student) => {
      const course = student.course || "Not specified";
      counts[course] = (counts[course] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      students: count,
    }));
  }, [students]);

  // Fee payment status chart.
  const paymentStatusData = [
    { name: "Pending", value: stats.pendingCount },
    { name: "Partial", value: stats.partialCount },
    { name: "Paid", value: stats.paidCount },
  ].filter((item) => item.value > 0);

  // Most recent payments.
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) =>
        String(b.payment_date || "").localeCompare(
          String(a.payment_date || "")
        )
      )
      .slice(0, 5);
  }, [payments]);

  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading dashboard data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Dashboard heading and notifications */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome to your Education Institute Management System.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Dropdown
            show={showNotifications}
            onToggle={(isOpen) => setShowNotifications(isOpen)}
            align="end"
          >
            <Dropdown.Toggle
              variant="light"
              className="border position-relative"
              id="notification-dropdown"
            >
              <BellFill size={18} />

              {notifications.length > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {notifications.length > 99
                    ? "99+"
                    : notifications.length}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="p-2"
              style={{
                width: "min(360px, 90vw)",
                maxHeight: 420,
                overflowY: "auto",
              }}
            >
              <Dropdown.Header className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Notifications</span>
                <Badge bg="secondary">{notifications.length}</Badge>
              </Dropdown.Header>

              {notifications.length === 0 ? (
                <Dropdown.ItemText className="text-muted py-3">
                  No new alerts. Everything looks clear!
                </Dropdown.ItemText>
              ) : (
                notifications.slice(0, 20).map((item) => (
                  <Dropdown.ItemText
                    key={item.id}
                    className="border-bottom py-2"
                  >
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className={`bg-${item.color}`}
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />

                      <div>
                        <div className="fw-semibold">
                          {item.title}
                        </div>
                        <small className="text-muted">
                          {item.message}
                        </small>
                        {item.date && (
                          <div>
                            <small className="text-muted">
                              {item.date}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </Dropdown.ItemText>
                ))
              )}

              {notifications.length > 20 && (
                <Dropdown.ItemText className="text-muted small">
                  Showing 20 of {notifications.length} notifications.
                </Dropdown.ItemText>
              )}
            </Dropdown.Menu>
          </Dropdown>

          <Button
            variant="outline-primary"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Spinner size="sm" className="me-2" />
            ) : (
              <ArrowClockwise className="me-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* API errors */}
      {error && (
        <Alert variant="danger">
          <strong>Unable to refresh dashboard.</strong>
          <div>{error}</div>
          <Button
            className="mt-2"
            variant="outline-danger"
            size="sm"
            onClick={() => loadDashboard(true)}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {lastUpdated && (
        <p className="text-muted small mb-3">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {/* Student and fee statistics */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Total Students"
            value={stats.studentCount}
            subtitle="Students in the API response"
            color="#4285F4"
            icon={<PeopleFill size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Total Fees"
            value={money(stats.totalFee)}
            subtitle="Total fees in existing accounts"
            color="#8E63CE"
            icon={<Wallet2 size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Fees Collected"
            value={money(stats.collected)}
            subtitle="Payments recorded in fee accounts"
            color="#34A853"
            icon={<CashCoin size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Outstanding"
            value={money(stats.outstanding)}
            subtitle="Remaining fees in accounts"
            color="#EA4335"
            icon={<Wallet2 size={28} />}
          />
        </Col>
      </Row>

      {/* Attendance statistics */}
      <div className="mb-3">
        <h5 className="fw-bold mb-1">Today's Attendance</h5>
        <p className="text-muted small mb-0">
          Date: {todayAttendance.date}
        </p>
      </div>

      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Present Today"
            value={todayAttendance.present}
            subtitle={`${todayAttendance.marked} attendance records today`}
            color="#34A853"
            icon={<CalendarCheckFill size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Absent Today"
            value={todayAttendance.absent}
            subtitle="Marked absent"
            color="#EA4335"
            icon={<PeopleFill size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Late Today"
            value={todayAttendance.late}
            subtitle="Marked late"
            color="#FBBC05"
            icon={<CalendarCheckFill size={28} />}
          />
        </Col>

        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Attendance Rate"
            value={`${todayAttendance.rate}%`}
            subtitle={
              todayAttendance.marked > 0
                ? `Based on ${todayAttendance.marked} marked records`
                : "No attendance marked today"
            }
            color="#4285F4"
            icon={<CalendarCheckFill size={28} />}
          />
        </Col>
      </Row>

      {/* Fee and course charts */}
      <Row className="g-3 mb-4">
        <Col xs={12} lg={7}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-1">Fee Overview</h5>
              <p className="text-muted small">
                Collected amount versus remaining balance
              </p>

              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={feeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${value}`} />
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      name="Amount"
                      fill="#4285F4"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-1">Students by Course</h5>
              <p className="text-muted small">
                Enrolment distribution
              </p>

              {courseChartData.length === 0 ? (
                <div className="text-muted py-5 text-center">
                  No student data available.
                </div>
              ) : (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={courseChartData}
                        dataKey="students"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {courseChartData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={
                              CHART_COLORS[
                                index % CHART_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Fee status and recent payments */}
      <Row className="g-3">
        <Col xs={12} lg={5}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">
                Fee Payment Status
              </h5>

              <div className="d-flex justify-content-between py-2 border-bottom">
                <span>Pending</span>
                <Badge bg="warning" text="dark">
                  {stats.pendingCount}
                </Badge>
              </div>

              <div className="d-flex justify-content-between py-2 border-bottom">
                <span>Partial</span>
                <Badge bg="info">{stats.partialCount}</Badge>
              </div>

              <div className="d-flex justify-content-between py-2">
                <span>Paid</span>
                <Badge bg="success">{stats.paidCount}</Badge>
              </div>

              {paymentStatusData.length > 0 && (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        label
                      >
                        {paymentStatusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              {
                                Pending: "#FBBC05",
                                Partial: "#4285F4",
                                Paid: "#34A853",
                              }[entry.name]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={7}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Recent Payments</h5>

              {recentPayments.length === 0 ? (
                <p className="text-muted py-4 text-center">
                  No payment records available.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            <div className="fw-semibold">
                              {payment.student_name || "Unknown"}
                            </div>
                            <small className="text-muted">
                              {payment.student_code || ""}
                            </small>
                          </td>
                          <td>{payment.payment_date || "—"}</td>
                          <td>{payment.payment_method || "—"}</td>
                          <td className="text-end fw-semibold">
                            {money(payment.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
