
import { useState } from "react";
import { Container, Form, Button, Card, Row, Col } from "react-bootstrap";
import { Gear, Building, Person, Bell } from "react-bootstrap-icons";
import "./Settings.css";

export default function Settings() {
  const [settings, setSettings] = useState({
    instituteName: "EduManage Institute",
    email: "admin@edumanage.com",
    phone: "",
    address: "Dharamshala, Himachal Pradesh",
    adminName: "Admin",
    notifications: true,
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Demo only: settings are saved in React state, not a database.
    setMessage("Settings saved for this session!");
  };

  return (
    <Container fluid className="settings-page">
      <div className="settings-heading">
        <div>
          <h2><Gear className="me-2" />Settings</h2>
          <p>Manage your institute and admin information.</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      <Form onSubmit={handleSave}>
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Building className="me-2" />
              Institute Information
            </h5>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Institute Name</Form.Label>
                  <Form.Control
                    name="instituteName"
                    value={settings.instituteName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Official Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Person className="me-2" />
              Admin Profile
            </h5>

            <Form.Group className="mb-3">
              <Form.Label>Admin Name</Form.Label>
              <Form.Control
                name="adminName"
                value={settings.adminName}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Bell className="me-2" />
              Notifications
            </h5>

            <Form.Check
              type="switch"
              name="notifications"
              label="Enable notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
          </Card.Body>
        </Card>

        <Button type="submit" variant="primary" className="save-settings">
          Save Settings
        </Button>
      </Form>
    </Container>
  );
}
