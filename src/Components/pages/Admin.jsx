
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
} from "react-bootstrap";

import {
  PersonCircle,
  ShieldLock,
  PeopleFill,
  ArrowRepeat,
} from "react-bootstrap-icons";

import "./Admin.css";

const BASE_URL = "http://localhost:8000";
const API_URL = `${BASE_URL}/api/auth/`;
const PROFILE_URL = `${API_URL}profile/`;
const CSRF_URL = `${API_URL}csrf/`;
const ADMINS_URL = `${API_URL}admins/`;
const ACTIVITY_URL = `${API_URL}admin-activity/`;

const emptyAdmin = {
  name: "",
  email: "",
  phone: "",
  role: "Institute Admin",
};

export default function Admin() {
  const [admin, setAdmin] = useState(emptyAdmin);
  const [admins, setAdmins] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  async function readResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        data.detail ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  const getCsrfToken = async () => {
    const response = await fetch(CSRF_URL, {
      method: "GET",
      credentials: "include",
    });

    const data = await readResponse(response);

    if (!data.csrfToken) {
      throw new Error("CSRF token missing. Please log in again.");
    }

    return data.csrfToken;
  };

  const loadProfile = useCallback(async () => {
    const response = await fetch(PROFILE_URL, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const data = await readResponse(response);
    setAdmin({ ...emptyAdmin, ...data });
  }, []);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);

    try {
      const response = await fetch(ADMINS_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await readResponse(response);
      setAdmins(data.admins || []);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load admin accounts.");
    } finally {
      setAdminsLoading(false);
    }
  }, []);

const loadActivities = useCallback(async () => {
  setActivityLoading(true);

  try {
    const response = await fetch(ACTIVITY_URL, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const data = await readResponse(response);

    setActivities(data.logs || []);
    setActivityError("");
  } catch (err) {
    setActivityError(
      err.message || "Could not load activity history."
    );
  } finally {
    setActivityLoading(false);
  }
}, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [profileResponse, adminsResponse] = await Promise.all([
          fetch(PROFILE_URL, { credentials: "include" }),
          fetch(ADMINS_URL, { credentials: "include" }),
        ]);

        const profileData = await readResponse(profileResponse);
        const adminsData = await readResponse(adminsResponse);

        if (!cancelled) {
          setAdmin({ ...emptyAdmin, ...profileData });
          setAdmins(adminsData.admins || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load admin information.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setAdminsLoading(false);
        }
      }
     try {
  const activityResponse = await fetch(ACTIVITY_URL, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const activityData = await readResponse(activityResponse);

  if (!cancelled) {
    setActivities(activityData.logs || []);
    setActivityError("");
  }
} catch (activityErr) {
  if (!cancelled) {
    setActivityError(
      activityErr.message || "Could not load activity history."
    );
  }
} finally {
  if (!cancelled) {
    setActivityLoading(false);
  }
}}

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setAdmin((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(PROFILE_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
        }),
      });

      const data = await readResponse(response);

      setAdmin((previous) => ({ ...previous, ...data }));

      window.dispatchEvent(
        new CustomEvent("adminProfileUpdated", {
          detail: {
            name: data.name,
            role: data.role,
          },
        })
      );

      setMessage("Profile saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (selectedAdmin) => {
    const newStatus = !selectedAdmin.is_active;

    const action = newStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedAdmin.username}?`
    );

    if (!confirmed) return;

    setUpdatingId(selectedAdmin.id);
    setError("");
    setMessage("");

    try {
      const csrfToken = await getCsrfToken();

      const response = await fetch(
        `${ADMINS_URL}${selectedAdmin.id}/status/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            is_active: newStatus,
          }),
        }
      );

      const data = await readResponse(response);

      setAdmins((previous) =>
        previous.map((item) =>
          item.id === selectedAdmin.id
            ? { ...item, is_active: data.is_active }
            : item
        )
      );

      setMessage(data.message || "Admin status updated.");
    } catch (err) {
      setError(err.message || "Could not update admin status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Spinner animation="border" size="sm" /> Loading admin information...
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2>
        <PersonCircle className="me-2" />
        Admin Profile
      </h2>

      <p className="text-muted">
        Manage your administrator details and admin accounts.
      </p>

      {message && (
        <div className="alert alert-success">{message}</div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Admin Profile */}
      <Card className="admin-card mt-4">
        <Card.Body>
          <div className="admin-avatar">
            <PersonCircle />
          </div>

          <h5 className="text-center">
            {admin.name || "Administrator"}
          </h5>

          <p className="text-center text-muted">{admin.role}</p>

          <hr />

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={admin.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={admin.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={admin.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control value={admin.role} readOnly />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </Form>

          <div className="admin-security-note mt-4">
            <ShieldLock className="me-2" />
            Your account security is managed through the authentication system.
          </div>
        </Card.Body>
      </Card>

      {/* Admin Management */}
      <Card className="admin-card mt-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h4 className="mb-1">
                <PeopleFill className="me-2" />
                Admin Management
              </h4>
              <p className="text-muted mb-0">
                View and manage administrator accounts.
              </p>
            </div>

            <Button
              variant="outline-primary"
              onClick={loadAdmins}
              disabled={adminsLoading}
            >
              <ArrowRepeat className="me-2" />
              Refresh
            </Button>
          </div>

          <div className="mb-3">
            <Badge bg="primary">
              Total Admins: {admins.length}
            </Badge>
            {" "}
            <Badge bg="success">
              Active: {admins.filter((item) => item.is_active).length}
            </Badge>
            {" "}
            <Badge bg="secondary">
              Inactive: {admins.filter((item) => !item.is_active).length}
            </Badge>
          </div>

          {adminsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Loading admin accounts...</span>
            </div>
          ) : admins.length === 0 ? (
            <p className="text-muted text-center py-4">
              No admin accounts found.
            </p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover responsive="md" className="align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.username}</td>
                      <td>{item.email}</td>

                      <td>
                        {item.is_superuser ? (
                          <Badge bg="warning" text="dark">
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge bg="info">
                            Institute Admin
                          </Badge>
                        )}
                      </td>

                      <td>
                        {item.is_active ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="secondary">Inactive</Badge>
                        )}
                      </td>

                      <td>
                        {item.is_superuser ? (
                          <Badge bg="warning" text="dark">
                            Protected
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant={item.is_active ? "danger" : "success"}
                            disabled={updatingId === item.id}
                            onClick={() => handleStatusChange(item)}
                          >
                            {updatingId === item.id
                              ? "Updating..."
                              : item.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      {/* Admin Activity Log */}
<Card className="admin-card mt-4">
  <Card.Body>
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div>
        <h4 className="mb-1">
          <ShieldLock className="me-2" />
          Admin Activity Log
        </h4>
        <p className="text-muted mb-0">
          View recent admin login and logout history.
        </p>
      </div>

      <Button
        variant="outline-primary"
        onClick={loadActivities}
        disabled={activityLoading}
      >
        <ArrowRepeat className="me-2" />
        Refresh
      </Button>
    </div>

    {activityLoading ? (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
        <span className="ms-2">Loading activity history...</span>
      </div>
    ) : activityError ? (
      <p className="text-muted text-center py-3">
        {activityError}
      </p>
    ) : activities.length === 0 ? (
      <p className="text-muted text-center py-4">
        No activity records found.
      </p>
    ) : (
      <div className="table-responsive">
        <Table striped bordered hover className="align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Admin Username</th>
              <th>Activity</th>
              <th>Date & Time</th>
            </tr>
          </thead>

          <tbody>
            {activities.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.username}</td>
                <td>
                  {item.action === "login" ? (
                    <Badge bg="success">Login</Badge>
                  ) : (
                    <Badge bg="secondary">Logout</Badge>
                  )}
                </td>
                <td>
                  {new Date(item.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )}
  </Card.Body>
</Card>
    </div>
  );
}
