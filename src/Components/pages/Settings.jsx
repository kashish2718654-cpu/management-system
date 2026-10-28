// import { useTheme } from "./ThemeContext.jsx";
import { useEffect, useState } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
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
} from "react-bootstrap-icons";

import "./Settings.css";
// const { theme, setTheme, toggleTheme } = useTheme();

const SETTINGS_API = "http://127.0.0.1:8000/api/settings/";
const THEME_KEY = "edumanageTheme";

const defaultSettings = {
  instituteName: "EduManage Institute",
  email: "admin@edumanage.com",
  phone: "",
  address: "Dharamshala, Himachal Pradesh",
  adminName: "Admin",
  notifications: true,
};

const themeOptions = [
  {
    value: "light",
    label: "Light Mode",
    description: "Bright background",
    Icon: Sun,
  },
  {
    value: "dark",
    label: "Dark Mode",
    description: "Dark background",
    Icon: MoonStars,
  },
  {
    value: "system",
    label: "System Default",
    description: "Follow your device",
    Icon: Laptop,
  },
];

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    return ["light", "dark", "system"].includes(savedTheme)
      ? savedTheme
      : "light";
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
  const systemPrefersDark =
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  const activeTheme =
    theme === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : theme;

  document.documentElement.setAttribute("data-theme", activeTheme);
  document.documentElement.setAttribute("data-bs-theme", activeTheme);

  return activeTheme;
}

export default function Settings() {
  const [theme, setTheme] = useState(getSavedTheme);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("edumanageSettings");

      return saved
        ? { ...defaultSettings, ...JSON.parse(saved) }
        : { ...defaultSettings };
    } catch {
      return { ...defaultSettings };
    }
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [saving, setSaving] = useState(false);
  // Apply and save the selected theme.
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Unable to save theme:", error);
    }

    applyTheme(theme);

    // Update automatically if System Default is selected.
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = () => applyTheme("system");

    media.addEventListener("change", updateSystemTheme);

    return () => {
      media.removeEventListener("change", updateSystemTheme);
    };
  }, [theme]);

  // Load institute settings from Django.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(SETTINGS_API, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to fetch settings");
        }

        const data = await response.json();

        setSettings({
          instituteName:
            data.institute_name ?? defaultSettings.instituteName,
          email: data.email ?? defaultSettings.email,
          phone: data.phone ?? defaultSettings.phone,
          address: data.address ?? defaultSettings.address,
          adminName: data.admin_name ?? defaultSettings.adminName,
          notifications:
            data.notifications ?? defaultSettings.notifications,
        });
      } catch (error) {
        console.error("Settings fetch error:", error);
        setMessage("Could not load settings from the server.");
        setMessageType("danger");
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
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
          admin_name: settings.adminName,
          notifications: settings.notifications,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(JSON.stringify(data));
      }

      const updatedSettings = {
        instituteName:
          data.institute_name ?? settings.instituteName,
        email: data.email ?? settings.email,
        phone: data.phone ?? settings.phone,
        address: data.address ?? settings.address,
        adminName: data.admin_name ?? settings.adminName,
        notifications:
          data.notifications ?? settings.notifications,
      };

      setSettings(updatedSettings);

      try {
        localStorage.setItem(
          "edumanageSettings",
          JSON.stringify(updatedSettings)
        );
      } catch (error) {
        console.error("Unable to save local settings:", error);
      }

      setMessageType("success");
      setMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Settings save error:", error);
      setMessageType("danger");
      setMessage(
        "Unable to save settings. Please check the server and console."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    setMessage("");
  };

  return (
    <Container fluid className="settings-page">
      <div className="settings-heading">
        <div>
          <h2>
            <Gear className="me-2" />
            Settings
          </h2>
          <p>Manage your institute, admin profile and appearance.</p>
        </div>
      </div>

      {message && (
        <div
          className={`alert alert-${messageType}`}
          role="status"
        >
          {message}
        </div>
      )}

      {/* Appearance and theme */}
      <Card className="settings-card mb-4">
        <Card.Body>
          <h5 className="settings-section-title">
            <Palette className="me-2" />
            Appearance
          </h5>

          <p className="settings-description">
            Choose how EduManage looks on your device.
          </p>

          <Row className="g-3">
            {themeOptions.map(({ value, label, description, Icon }) => (
              <Col xs={12} md={4} key={value}>
                <button
                  type="button"
                  className={`theme-option ${
                    theme === value ? "selected" : ""
                  }`}
                  aria-pressed={theme === value}
                  onClick={() => {
                    setTheme(value);
                    setMessage("");
                  }}
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

          <div className="theme-status mt-3">
            <span className="theme-status-dot" />
            Current appearance:{" "}
            <strong>
              {theme === "system"
                ? "System Default"
                : theme === "dark"
                  ? "Dark Mode"
                  : "Light Mode"}
            </strong>
          </div>
        </Card.Body>
      </Card>

      <Form onSubmit={handleSave}>
        {/* Institute information */}
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
                    placeholder="Enter institute name"
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
                    placeholder="Enter official email"
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
                    placeholder="Enter institute address"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Admin profile */}
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
                placeholder="Enter admin name"
                required
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Notifications */}
        <Card className="settings-card mb-4">
          <Card.Body>
            <h5 className="settings-section-title">
              <Bell className="me-2" />
              Notifications
            </h5>

            <Form.Check
              type="switch"
              id="notifications-switch"
              name="notifications"
              label="Enable notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />

            <Form.Text className="settings-description">
              Manage your notification preference.
            </Form.Text>
          </Card.Body>
        </Card>

        {/* Actions */}
        <div className="settings-actions mb-4">
          <Button
            type="submit"
            variant="primary"
            className="save-settings"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>

          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleReset}
          >
            Reset Form
          </Button>
        </div>
      </Form>
    </Container>
  );
}
