
import { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";

import {
  Gear,
  Building,
  Person,
  Bell,
  Sun,
  MoonStars,
  Laptop,
  Palette,
  Save,
  ArrowClockwise,
} from "react-bootstrap-icons";

import "./Settings.css";

const SETTINGS_API = "http://localhost:8000/api/settings/";
const PROFILE_API = "http://localhost:8000/api/auth/profile/";

const THEME_KEY = "edumanageTheme";

const defaultSettings = {
  instituteName: "EduManage Institute",
  email: "admin@edumanage.com",
  phone: "",
  address: "Dharamshala, Himachal Pradesh",
  website: "",
  registrationNumber: "",
  notifications: true,
  studentNotifications: true,
  feeNotifications: true,
  attendanceNotifications: true,
  examinationNotifications: true,
  resultNotifications: true,
};

const defaultProfile = {
  name: "",
  email: "",
  phone: "",
  role: "Institute Admin",
};

const themeOptions = [
  { value: "light", label: "Light Mode", description: "Bright background", Icon: Sun },
  { value: "dark", label: "Dark Mode", description: "Dark background", Icon: MoonStars },
  { value: "system", label: "System Default", description: "Follow your device", Icon: Laptop },
];

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return ["light", "dark", "system"].includes(saved) ? saved : "light";
  } catch {
    return "light";
  }
}

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

function applyTheme(theme) {
  const systemDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  ).matches;

  const activeTheme =
    theme === "system"
      ? systemDark ? "dark" : "light"
      : theme;

  document.documentElement.setAttribute("data-theme", activeTheme);
  document.documentElement.setAttribute("data-bs-theme", activeTheme);

  return activeTheme;
}

function mapSettings(data) {
  return {
    instituteName: data.institute_name ?? defaultSettings.instituteName,
    email: data.email ?? defaultSettings.email,
    phone: data.phone ?? "",
    address: data.address ?? defaultSettings.address,
    website: data.website ?? "",
    registrationNumber: data.registration_number ?? "",
    notifications: data.notifications ?? true,
    studentNotifications: data.student_notifications ?? true,
    feeNotifications: data.fee_notifications ?? true,
    attendanceNotifications: data.attendance_notifications ?? true,
    examinationNotifications: data.examination_notifications ?? true,
    resultNotifications: data.result_notifications ?? true,
  };
}

function mapProfile(data) {
  return {
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    role: data.role ?? "Institute Admin",
  };
}

export default function Settings() {
  const [theme, setTheme] = useState(getSavedTheme);

  const [settings, setSettings] = useState(defaultSettings);
  const [profile, setProfile] = useState(defaultProfile);

  const [loading, setLoading] = useState(true);
  const [savingInstitute, setSavingInstitute] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Theme management
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error(error);
    }

    applyTheme(theme);

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => applyTheme("system");

    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [theme]);

  // Load institute and admin information
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const [settingsResponse, profileResponse] = await Promise.all([
          fetch(SETTINGS_API, {
            credentials: "include",
          }),
          fetch(PROFILE_API, {
            credentials: "include",
          }),
        ]);

        if (!settingsResponse.ok) {
          throw new Error("Unable to load institute settings.");
        }

        if (!profileResponse.ok) {
          throw new Error("Unable to load admin profile. Please log in again.");
        }

        const settingsData = await settingsResponse.json();
        const profileData = await profileResponse.json();

        setSettings(mapSettings(settingsData));
        setProfile(mapProfile(profileData));

      } catch (error) {
        console.error("Settings loading error:", error);
        showMessage(error.message, "danger");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Form input handling
  const handleInstituteChange = (event) => {
    const { name, value, checked, type } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  // Save institute and notification preferences
  const handleInstituteSave = async (event) => {
    event.preventDefault();
    setSavingInstitute(true);
    setMessage("");

    try {
      const csrfToken = getCookie("csrftoken");

      const response = await fetch(SETTINGS_API, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify({
          institute_name: settings.instituteName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          website: settings.website,
          registration_number: settings.registrationNumber,
          notifications: settings.notifications,
          student_notifications: settings.studentNotifications,
          fee_notifications: settings.feeNotifications,
          attendance_notifications: settings.attendanceNotifications,
          examination_notifications: settings.examinationNotifications,
          result_notifications: settings.resultNotifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await response.json();
      setSettings(mapSettings(data));

      showMessage("Institute information and notifications saved successfully!");
    } catch (error) {
      console.error("Institute save error:", error);
      showMessage("Unable to save institute settings: " + error.message, "danger");
    } finally {
      setSavingInstitute(false);
    }
  };

  // Save actual Django admin account
  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");

    try {
      const csrfToken = getCookie("csrftoken");

      const response = await fetch(PROFILE_API, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update admin profile.");
      }

      setProfile(mapProfile(data));
      showMessage("Admin profile updated successfully!");

    } catch (error) {
      console.error("Profile save error:", error);
      showMessage(error.message, "danger");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    showMessage("Form reset. Save to apply these values.", "info");
  };

  if (loading) {
    return (
      <Container className="settings-page text-center py-5">
        <Spinner animation="border" />
        <p className="mt-3">Loading settings...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="settings-page">

      <div className="settings-heading">
        <div>
          <h2><Gear className="me-2" />Settings</h2>
          <p>Manage your institute, admin account and preferences.</p>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`} role="status">
          {message}
        </div>
      )}

      {/* APPEARANCE */}
      <Card className="settings-card mb-4">
        <Card.Body>
          <h5 className="settings-section-title">
            <Palette className="me-2" />Appearance
          </h5>

          <p className="settings-description">
            Customize the appearance of your EduManage dashboard.
          </p>

          <Row className="g-3">
            {themeOptions.map(({ value, label, description, Icon }) => (
              <Col xs={12} md={4} key={value}>
                <button
                  type="button"
                  className={`theme-option ${theme === value ? "selected" : ""}`}
                  aria-pressed={theme === value}
                  onClick={() => setTheme(value)}
                >
                  <span className="theme-option-icon">
                    <Icon size={24} />
                  </span>

                  <span className="theme-option-text">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>

                  <span className="theme-radio">
                    {theme === value ? "✓" : ""}
                  </span>
                </button>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* INSTITUTE INFORMATION */}
      <Form onSubmit={handleInstituteSave}>
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Building className="me-2" />Institute Information
            </h5>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Institute Name</Form.Label>
                  <Form.Control
                    name="instituteName"
                    value={settings.instituteName}
                    onChange={handleInstituteChange}
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
                    onChange={handleInstituteChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contact Number</Form.Label>
                  <Form.Control
                    name="phone"
                    value={settings.phone}
                    onChange={handleInstituteChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={settings.website}
                    onChange={handleInstituteChange}
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Registration Number</Form.Label>
                  <Form.Control
                    name="registrationNumber"
                    value={settings.registrationNumber}
                    onChange={handleInstituteChange}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Institute Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={settings.address}
                    onChange={handleInstituteChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" disabled={savingInstitute}>
              <Save className="me-2" />
              {savingInstitute ? "Saving..." : "Save Institute Information"}
            </Button>
          </Card.Body>
        </Card>
      </Form>

      {/* ADMIN PROFILE */}
      <Form onSubmit={handleProfileSave}>
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Person className="me-2" />Admin Profile
            </h5>

            <div className="admin-profile-header mb-4">
              <div className="admin-avatar">
                {profile.name?.charAt(0)?.toUpperCase() || "A"}
              </div>

              <div>
                <h5>{profile.name || "Admin"}</h5>
                <span>{profile.role}</span>
              </div>
            </div>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Admin Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Admin Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Admin Role</Form.Label>
                  <Form.Control value={profile.role} disabled />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" disabled={savingProfile}>
              <Save className="me-2" />
              {savingProfile ? "Updating..." : "Update Admin Profile"}
            </Button>
          </Card.Body>
        </Card>
      </Form>

      {/* NOTIFICATIONS */}
      <Form onSubmit={handleInstituteSave}>
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Bell className="me-2" />Notification Preferences
            </h5>

            <Form.Check
              type="switch"
              id="all-notifications"
              name="notifications"
              label="Enable all notifications"
              checked={settings.notifications}
              onChange={handleInstituteChange}
              className="notification-main-switch mb-3"
            />

            <hr />

            {[
              ["studentNotifications", "Student Admissions", "New student admission alerts"],
              ["feeNotifications", "Fee Management", "Pending fees and payment alerts"],
              ["attendanceNotifications", "Attendance", "Student attendance updates"],
              ["examinationNotifications", "Examinations", "Examination schedule alerts"],
              ["resultNotifications", "Results", "Result publication alerts"],
            ].map(([name, label, description]) => (
              <div className="notification-item" key={name}>
                <div>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </div>

                <Form.Check
                  type="switch"
                  id={name}
                  name={name}
                  checked={settings.notifications && settings[name]}
                  disabled={!settings.notifications}
                  onChange={handleInstituteChange}
                />
              </div>
            ))}

            <Button type="submit" className="mt-4" disabled={savingInstitute}>
              <Save className="me-2" />
              {savingInstitute ? "Saving..." : "Save Notification Preferences"}
            </Button>
          </Card.Body>
        </Card>
      </Form>

      {/* RESET */}
      <div className="settings-actions mb-4">
        <Button variant="outline-secondary" onClick={handleReset}>
          <ArrowClockwise className="me-2" />
          Reset Institute Form
        </Button>
      </div>

    </Container>
  );
}
