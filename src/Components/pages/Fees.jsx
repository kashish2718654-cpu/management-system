
import { useEffect, useMemo, useState } from "react";
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
  CashCoin,
  PeopleFill,
  Wallet2,
  PlusCircle,
} from "react-bootstrap-icons";
import "./Fees.css";

const STUDENTS_API = "http://localhost:8000/api/students/";
const ACCOUNTS_API = "http://localhost:8000/api/fees/accounts/";
const PAYMENTS_API = "http://localhost:8000/api/fees/payments/";

const COURSE_FEES = {
  "Full Stack Development": 18000,
  "Python Programming": 12000,
  "Data Science & ML": 25000,
  "Web Designing": "",
  "Digital Marketing": 10000,
};

const emptyAccountForm = {
  student: "",
  total_fee: "",
};

const emptyPaymentForm = {
  fee_account: "",
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: "Cash",
  note: "",
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function Fees() {
  const [students, setStudents] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  // Load students, fee accounts and payment history from Django.
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, accountResponse, paymentResponse] =
  await Promise.all([
    fetch(STUDENTS_API, {
      credentials: "include",
    }),
    fetch(ACCOUNTS_API, {
      credentials: "include",
    }),
    fetch(PAYMENTS_API, {
      credentials: "include",
    }),
  ]);
      if (
        !studentResponse.ok ||
        !accountResponse.ok ||
        !paymentResponse.ok
      ) {
        throw new Error("One or more APIs returned an error.");
      }

      const [studentData, accountData, paymentData] = await Promise.all([
        studentResponse.json(),
        accountResponse.json(),
        paymentResponse.json(),
      ]);

      setStudents(getList(studentData));
      setAccounts(getList(accountData));
      setPayments(getList(paymentData));
    } catch (err) {
      console.error("Fee loading error:", err);
      setError(
        "Unable to load fee records. Check that Django is running and the fee API URLs are configured."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalFees = useMemo(
    () =>
      accounts.reduce(
        (total, account) => total + Number(account.total_fee || 0),
        0
      ),
    [accounts]
  );

  const totalCollected = useMemo(
    () =>
      accounts.reduce(
        (total, account) => total + Number(account.amount_paid || 0),
        0
      ),
    [accounts]
  );

  const totalPending = useMemo(
    () =>
      accounts.reduce(
        (total, account) =>
          total + Math.max(0, Number(account.balance || 0)),
        0
      ),
    [accounts]
  );

  // IMPORTANT: This function must stay inside the Fees component.
  // It selects the student and fills in the matching course fee.
  function handleStudentSelect(event) {
    const studentId = event.target.value;

    const selectedStudent = students.find(
      (student) => String(student.id) === String(studentId)
    );

    setAccountForm((previous) => ({
      ...previous,
      student: studentId,
      total_fee: selectedStudent
        ? COURSE_FEES[selectedStudent.course] ?? ""
        : "",
    }));
  }

  function handleAccountChange(event) {
    const { name, value } = event.target;

    setAccountForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePaymentChange(event) {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreateAccount(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(ACCOUNTS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student: Number(accountForm.student),
          total_fee: accountForm.total_fee,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Account creation error:", result);

        setError(
          result.student?.[0] ||
            result.total_fee?.[0] ||
            result.non_field_errors?.[0] ||
            "Could not create the fee account. The student may already have an account."
        );
        return;
      }

      setShowAccountModal(false);
      setAccountForm(emptyAccountForm);
      await loadData();
    } catch (err) {
      console.error("Create account error:", err);
      setError("Could not connect to the fee account API.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPayment(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(PAYMENTS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fee_account: Number(paymentForm.fee_account),
          amount: paymentForm.amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          note: paymentForm.note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
       console.error(
  "Payment creation error:",
  JSON.stringify(result, null, 2)
);
        setError(
          result.amount?.[0] ||
            result.fee_account?.[0] ||
            result.non_field_errors?.[0] ||
            "Could not save the payment. Check the payment details."
        );
        return;
      }

      setShowPaymentModal(false);
      setPaymentForm({
        ...emptyPaymentForm,
        payment_date: new Date().toISOString().slice(0, 10),
      });

      await loadData();
    } catch (err) {
      console.error("Payment error:", err);
      setError("Could not connect to the payment API.");
    } finally {
      setSaving(false);
    }
  }

async function handleDeletePayment(payment) {
  const confirmed = window.confirm(
    `Are you sure you want to delete this payment of ₹${payment.amount} for ${payment.student_name}? This action cannot be undone.`
  );

  if (!confirmed) return;

  setError("");

  try {
    const response = await fetch(
      `${PAYMENTS_API}${payment.id}/`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      setError("Could not delete the payment. Please try again.");
      return;
    }

    await loadData();
    alert("Payment deleted successfully!");
  } catch (err) {
    console.error("Payment deletion error:", err);
    setError("Could not connect to the payment API.");
  }
}

async function handleUpdatePayment(event) {
  event.preventDefault();

  if (!editingPayment) return;

  setSaving(true);
  setError("");

  try {
    const response = await fetch(
      `${PAYMENTS_API}${editingPayment.id}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fee_account: Number(paymentForm.fee_account),
          amount: paymentForm.amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          note: paymentForm.note,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Payment update error:", result);
      setError(
        result.amount?.[0] ||
          result.fee_account?.[0] ||
          result.payment_date?.[0] ||
          result.payment_method?.[0] ||
          "Could not update the payment. Check the payment details."
      );
      return;
    }

    setShowPaymentModal(false);
    setEditingPayment(null);
    setPaymentForm({
      ...emptyPaymentForm,
      payment_date: new Date().toISOString().slice(0, 10),
    });

    await loadData();
  } catch (err) {
    console.error("Payment update error:", err);
    setError("Could not connect to the payment API.");
  } finally {
    setSaving(false);
  }
}

  function openAccountModal() {
    setError("");
    setAccountForm(emptyAccountForm);
    setShowAccountModal(true);
  }

  function openPaymentModal(account = null) {
    setError("");

    setPaymentForm({
      ...emptyPaymentForm,
      fee_account: account ? String(account.id) : "",
      payment_date: new Date().toISOString().slice(0, 10),
    });

    setShowPaymentModal(true);
  }
  function openEditPaymentModal(payment) {
  setError("");
console.log("Selected payment:", payment);
  setEditingPayment(payment);

  setPaymentForm({
    fee_account: String(
      payment.fee_account?.id ?? payment.fee_account
    ),
    amount: String(payment.amount ?? ""),
    payment_date: payment.payment_date,
    payment_method: payment.payment_method || "Cash",
    note: payment.note || "",
  });

  setShowPaymentModal(true);
}

  function handlePrintReceipt(payment) {
    const account = accounts.find(
      (item) =>
        String(item.id) === String(
          payment.fee_account?.id ?? payment.fee_account
        )
    );

    const receiptNumber =
      payment.receipt_number || `REC-${payment.id}`;

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const money = (value) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value) || 0);

    const receiptWindow = window.open("", "_blank", "width=800,height=700");

    if (!receiptWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${escapeHtml(receiptNumber)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #222;
            }
            .receipt {
              max-width: 650px;
              margin: auto;
              border: 1px solid #ccc;
              padding: 30px;
              border-radius: 10px;
            }
            h1, h2, p { text-align: center; }
            h1 { margin-bottom: 5px; }
            .subtitle { color: #666; }
            .receipt-no {
              text-align: right;
              margin: 25px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #ddd;
            }
            td:first-child {
              font-weight: bold;
              width: 45%;
            }
            .amount {
              font-size: 22px;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              font-size: 13px;
              color: #666;
            }
           
@page {
  size: A4;
  margin: 12mm;
}

@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #222 !important;
    font-family: Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .receipt {
    width: 100%;
    max-width: none;
    box-sizing: border-box;
    margin: 0;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 0;
  }

  .no-print {
    display: none !important;
  }

  table {
    width: 100%;
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
  }
}

          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Education Institute</h1>
            <p class="subtitle">OFFICIAL PAYMENT RECEIPT</p>

            <div class="receipt-no">
              <strong>Receipt No:</strong> ${escapeHtml(receiptNumber)}
            </div>

            <table>
              <tr>
                <td>Student ID</td>
                <td>${escapeHtml(payment.student_code || "—")}</td>
              </tr>
              <tr>
                <td>Student Name</td>
                <td>${escapeHtml(payment.student_name || "—")}</td>
              </tr>
              <tr>
                <td>Total Course Fee</td>
                <td>${escapeHtml(money(account?.total_fee))}</td>
              </tr>
              <tr>
                <td>Amount Paid</td>
                <td class="amount">${escapeHtml(money(payment.amount))}</td>
              </tr>
              <tr>
                <td>Payment Date</td>
                <td>${escapeHtml(payment.payment_date || "—")}</td>
              </tr>
              <tr>
                <td>Payment Method</td>
                <td>${escapeHtml(payment.payment_method || "—")}</td>
              </tr>
              <tr>
                <td>Remaining Balance</td>
                <td>${escapeHtml(
                  money(
                    account?.balance ??
                    payment.balance ??
                    0
                  )
                )}</td>
              </tr>
              <tr>
                <td>Note</td>
                <td>${escapeHtml(payment.note || "—")}</td>
              </tr>
            </table>

            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>Please keep this receipt for your records.</p>
            </div>

            <p class="no-print">
              <button onclick="window.print()">Print / Save as PDF</button>
            </p>
          </div>
        </body>
      </html>
    `);

    receiptWindow.document.close();
    receiptWindow.focus();
  }

  return (
    <div className="fees-page">
      <Container fluid>
        <div className="fees-heading">
          <div>
            <p className="fees-eyebrow">FINANCE MANAGEMENT</p>
            <h2>Fee Management</h2>
            <p className="text-secondary mb-0">
              Manage student fees, payments and outstanding balances.
            </p>
          </div>

          <div className="fees-heading-actions">
            <Button
              variant="outline-primary"
              onClick={openAccountModal}
              disabled={loading || students.length === 0}
            >
              <PlusCircle className="me-2" />
              Create Fee Account
            </Button>

            <Button
              variant="primary"
              onClick={() => openPaymentModal()}
              disabled={loading || accounts.length === 0}
            >
              <CashCoin className="me-2" />
              Record Payment
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

        <Row className="g-3 mb-4">
          <Col xs={12} sm={6} xl={3}>
            <Card className="fees-stat-card h-100">
              <Card.Body>
                <div className="fees-stat-icon blue">
                  <PeopleFill />
                </div>
                <p>Total Fee Amount</p>
                <h3>{formatMoney(totalFees)}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="fees-stat-card h-100">
              <Card.Body>
                <div className="fees-stat-icon green">
                  <CashCoin />
                </div>
                <p>Total Collected</p>
                <h3>{formatMoney(totalCollected)}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="fees-stat-card h-100">
              <Card.Body>
                <div className="fees-stat-icon orange">
                  <Wallet2 />
                </div>
                <p>Outstanding Balance</p>
                <h3>{formatMoney(totalPending)}</h3>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} xl={3}>
            <Card className="fees-stat-card h-100">
              <Card.Body>
                <div className="fees-stat-icon purple">
                  <PeopleFill />
                </div>
                <p>Fee Accounts</p>
                <h3>{accounts.length}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Student Fee Accounts */}
        <Card className="fees-table-card mb-4">
          <Card.Body>
            <div className="fees-section-heading">
              <div>
                <h5>Student Fee Accounts</h5>
                <p>Course fees and remaining balances.</p>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Total Fee</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <Spinner animation="border" size="sm" /> Loading...
                      </td>
                    </tr>
                  ) : accounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        No fee accounts yet. Select Create Fee Account
                        to get started.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.student_code}</td>
                        <td>{account.student_name}</td>
                        <td>{formatMoney(account.total_fee)}</td>
                        <td>{formatMoney(account.amount_paid)}</td>
                        <td>{formatMoney(account.balance)}</td>
                        <td>
                          <Badge
                            bg={
                              account.status === "Paid"
                                ? "success"
                                : account.status === "Partial"
                                ? "info"
                                : "warning"
                            }
                            text={
                              account.status === "Pending"
                                ? "dark"
                                : "white"
                            }
                            pill
                          >
                            {account.status}
                          </Badge>
                        </td>
                        <td>
                          {Number(account.balance) > 0 && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openPaymentModal(account)}
                            >
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Payment History */}
        <Card className="fees-table-card">
          <Card.Body>
            <div className="fees-section-heading">
              <div>
                <h5>Payment History</h5>
                <p>Payments recorded in the system.</p>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Note</th>
                    <th>Receipt</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <Spinner animation="border" size="sm" /> Loading...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.payment_date}</td>
                        <td>{payment.student_code}</td>
                        <td>{payment.student_name}</td>
                        <td>{formatMoney(payment.amount)}</td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.note || "—"}</td>
                        <td>
                          <Button
                             size="sm"
                             variant="outline-primary"
                             onClick={() => handlePrintReceipt(payment)}
                          >             
                             Print Receipt
                           </Button>
                        
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="ms-2"
                            onClick={() => openEditPaymentModal(payment)}
                         >
                             Edit
                          </Button>
                       
                          <Button
                                 size="sm"
                                 variant="outline-danger"
                                 className="ms-2"
                                 onClick={() => handleDeletePayment(payment)}
                          >
                                 Delete
                            </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Create Fee Account Modal */}
      <Modal
        show={showAccountModal}
        onHide={() => !saving && setShowAccountModal(false)}
        centered
      >
        <Form onSubmit={handleCreateAccount}>
          <Modal.Header closeButton>
            <Modal.Title>Create Fee Account</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student *</Form.Label>

              <Form.Select
                name="student"
                value={accountForm.student}
                onChange={handleStudentSelect}
                required
              >
                <option value="">Select student</option>

                {students.map((student) => (
                  <option key={student.id} value={String(student.id)}>
                    {student.student_id} — {student.name}
                  </option>
                ))}
              </Form.Select>

              {students.length === 0 && (
                <Form.Text className="text-danger">
                  No students were returned by the Students API.
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group>
              <Form.Label>Total Course Fee (₹) *</Form.Label>
              <Form.Control
                type="number"
                name="total_fee"
                min="0.01"
                step="0.01"
                value={accountForm.total_fee}
                onChange={handleAccountChange}
                placeholder="Enter course fee"
                required
              />
              <Form.Text className="text-muted">
                The fee is filled from the selected student's course when a
                matching course fee is configured.
              </Form.Text>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="light"
              onClick={() => setShowAccountModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Account"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        show={showPaymentModal}
        onHide={() => !saving && setShowPaymentModal(false)}
        centered
      >
        <Form onSubmit={ editingPayment ? handleUpdatePayment : handleAddPayment }>
          <Modal.Header closeButton>
            <Modal.Title> 
              {editingPayment ? "Edit Payment" : "Record Payment"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Student Fee Account *</Form.Label>
              <Form.Select
                name="fee_account"
                value={paymentForm.fee_account}
                onChange={handlePaymentChange}
                required
              >
                <option value="">Select fee account</option>
                {accounts
                  .filter((account) => Number(account.balance) > 0)
                  .map((account) => (
                    <option key={account.id} value={String(account.id)}>
                      {account.student_code} — {account.student_name}
                      {" | Balance: "}
                      {formatMoney(account.balance)}
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Amount (₹) *</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                min="0.01"
                step="0.01"
                value={paymentForm.amount}
                onChange={handlePaymentChange}
                placeholder="Enter amount received"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Date *</Form.Label>
              <Form.Control
                type="date"
                name="payment_date"
                value={paymentForm.payment_date}
                onChange={handlePaymentChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Payment Method *</Form.Label>
              <Form.Select
                name="payment_method"
                value={paymentForm.payment_method}
                onChange={handlePaymentChange}
                required
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Note</Form.Label>
              <Form.Control
                name="note"
                value={paymentForm.note}
                onChange={handlePaymentChange}
                placeholder="Optional payment note"
                maxLength={200}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="light"
              onClick={() => setShowPaymentModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingPayment
                ? "Update Payment"
                : "Save Payment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Fees;
