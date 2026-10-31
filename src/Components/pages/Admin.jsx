
import { useEffect, useState } from "react";
import { Card, Form, Button, Row, Col } from "react-bootstrap";
import { PersonCircle, ShieldLock } from "react-bootstrap-icons";
import "./Admin.css";

// Use the same backend host for every request
const BASE_URL = "http://localhost:8000";
const API_URL = `${BASE_URL}/api/auth/profile/`;
const CSRF_URL = `${BASE_URL}/api/auth/csrf/`;

const emptyAdmin = {
  name: "",
  email: "",
  phone: "",
  role: "Institute Admin",
};

export default function Admin() {
  const [admin, setAdmin] = useState(emptyAdmin);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const data = await readResponse(response);

        if (!cancelled) {
          setAdmin({ ...emptyAdmin, ...data });
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load admin profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

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
      // Obtain CSRF token before updating the profile
      const csrfResponse = await fetch(CSRF_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const csrfData = await readResponse(csrfResponse);

      if (!csrfData.csrfToken) {
        throw new Error("CSRF token missing. Please log in again.");
      }

      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRFToken": csrfData.csrfToken,
        },
        body: JSON.stringify({
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
        }),
      });

      const data = await readResponse(response);

      setAdmin((previous) => ({ ...previous, ...data }));
      setMessage("Profile saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-page">Loading admin profile...</div>;
  }

  return (
    <div className="admin-page">
      <h2>
        <PersonCircle className="me-2" />
        Admin Profile
      </h2>

      <p className="text-muted">
        Manage your administrator details.
      </p>

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

            {message && (
              <div className="alert alert-success">{message}</div>
            )}

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </Form>

          <div className="admin-security-note mt-4">
            <ShieldLock className="me-2" />
            Password and account security should be managed through
            a secure authentication system.
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
