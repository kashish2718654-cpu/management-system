
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";

import {
  Navbar as BootstrapNavbar,
  Container,
  Nav,
  NavDropdown,
  Badge,
  Button,
  Offcanvas,
  Dropdown,
  Spinner,
  Alert,
} from "react-bootstrap";

import {
  MortarboardFill,
  Bell,
  PersonCircle,
  PeopleFill,
  PersonWorkspace,
  CalendarCheck,
  BookFill,
  WalletFill,
  BarChartFill,
  List,
  CalendarWeek,
  CalendarEvent,
  Trophy,
  Gear,
  BoxArrowRight,
  ShieldCheck,
  CheckCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";

import "./Nav.css";

const API_URL = "http://localhost:8000/api/auth/";

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewError, setReviewError] = useState("");

  const navigate = useNavigate();

  const [adminProfile, setAdminProfile] = useState({
    name: "Admin",
    role: "Administrator",
  });

  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await fetch(`${API_URL}profile/`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Unable to load admin profile");
        }

        const data = await response.json();

        setAdminProfile({
          name: data.name || "Admin",
          role: data.role || "Administrator",
        });
      } catch (error) {
        console.error("Profile loading error:", error);
      }
    };

    fetchAdminProfile();
  }, []);

  useEffect(() => {
    const updateProfile = (event) => {
      setAdminProfile((previous) => ({
        ...previous,
        ...event.detail,
      }));
    };

    window.addEventListener("adminProfileUpdated", updateProfile);

    return () => {
      window.removeEventListener(
        "adminProfileUpdated",
        updateProfile
      );
    };
  }, []);

  const closeMenu = () => setShowMenu(false);

  // APPROVE OR REJECT ADMIN REGISTRATION
  const handleRegistrationReview = async (registrationId, action) => {
    const actionLabel = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this admin registration?`
    );

    if (!confirmed) return;

    setReviewingId(registrationId);
    setReviewError("");

    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${API_URL}csrf/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not get security token.");
      }

      const csrfData = await csrfResponse.json();

      // Send approval or rejection request
      const response = await fetch(
        `${API_URL}${action}/${registrationId}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfData.csrfToken,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Action failed.");
      }

      window.alert(data.message);

      // Refresh notifications after successful review
      await refreshNotifications();
    } catch (error) {
      console.error("Registration review error:", error);
      setReviewError(error.message || "Could not process request.");
    } finally {
      setReviewingId(null);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) return;

    try {
      const csrfResponse = await fetch(`${API_URL}csrf/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not get security token.");
      }

      const csrfData = await csrfResponse.json();

      const response = await fetch(`${API_URL}logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfData.csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      sessionStorage.removeItem("isAuthenticated");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);

      window.alert(
        error.message || "Could not connect to Django."
      );
    }
  };

  const menuItems = [
    { to: "/students", label: "Students", icon: PeopleFill },
    { to: "/faculty", label: "Faculty & Staff", icon: PersonWorkspace },
    { to: "/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/courses", label: "Courses & Batches", icon: BookFill },
    { to: "/timetable", label: "Timetable Management", icon: CalendarWeek },
    {
      to: "/examinations",
      label: "Examination Management",
      icon: CalendarEvent,
    },
    { to: "/results", label: "Marks & Results", icon: Trophy },
    { to: "/fees", label: "Fees & Payments", icon: WalletFill },
    { to: "/reports", label: "Reports", icon: BarChartFill },
    { to: "/settings", label: "Settings", icon: Gear },
  ];

  return (
    <>
      <BootstrapNavbar expand="lg" className="top-navbar" fixed="top">
        <Container fluid>
          <Button
            variant="light"
            className="menu-toggle me-2"
            onClick={() => setShowMenu(true)}
            aria-label="Open navigation menu"
          >
            <List size={24} />
          </Button>

          <BootstrapNavbar.Brand
            as={NavLink}
            to="/dashboard"
            className="d-flex align-items-center gap-2"
          >
            <span className="brand-icon">
              <MortarboardFill />
            </span>

            <span className="brand-name">EduManage</span>
          </BootstrapNavbar.Brand>

          <div className="navbar-actions ms-auto d-flex align-items-center gap-3">

            {/* NOTIFICATION DROPDOWN */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                className="notification-btn position-relative"
                id="notification-dropdown"
                aria-label={`Notifications, ${unreadCount} unread`}
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="notification-badge"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu
                className="shadow border-0 p-0"
                style={{
                  width: "360px",
                  maxWidth: "90vw",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <strong>Notifications</strong>

                  <Button
                    variant="link"
                    size="sm"
                    className="text-decoration-none p-0"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </Button>
                </div>

                {reviewError && (
                  <Alert
                    variant="danger"
                    className="m-2"
                  >
                    {reviewError}
                  </Alert>
                )}

                {error && (
                  <Alert variant="warning" className="m-2">
                    {error}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" size="sm" />
                    <div className="small text-muted mt-2">
                      Loading notifications...
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center text-muted p-4">
                    <Bell size={25} className="mb-2" />
                    <div>No notifications available.</div>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border-bottom ${
                        item.unread ? "bg-light" : ""
                      }`}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <strong className="small">
                          {item.title}
                        </strong>

                        {item.unread && (
                          <Badge bg="primary">New</Badge>
                        )}
                      </div>

                      <div className="small text-muted mt-1">
                        {item.message}
                      </div>

                      <div className="small text-secondary mt-1">
                        {item.time}
                      </div>

                      {item.type === "admin-registration" && (
                        <div className="mt-3">
                          <div className="small mb-2">
                            <div>
                              <strong>Name:</strong>{" "}
                              {item.details?.full_name}
                            </div>
                            <div>
                              <strong>Username:</strong>{" "}
                              {item.details?.username}
                            </div>
                            <div>
                              <strong>Email:</strong>{" "}
                              {item.details?.email}
                            </div>
                            <div>
                              <strong>Phone:</strong>{" "}
                              {item.details?.phone}
                            </div>
                            <div>
                              <strong>Institute:</strong>{" "}
                              {item.details?.institute_name}
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              className="flex-fill"
                              disabled={reviewingId !== null}
                              onClick={() =>
                                handleRegistrationReview(
                                  item.registrationId,
                                  "approve"
                                )
                              }
                            >
                              <CheckCircleFill className="me-1" />
                              {reviewingId === item.registrationId
                                ? "Processing..."
                                : "Approve"}
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="flex-fill"
                              disabled={reviewingId !== null}
                              onClick={() =>
                                handleRegistrationReview(
                                  item.registrationId,
                                  "reject"
                                )
                              }
                            >
                              <XCircleFill className="me-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {item.type !== "admin-registration" && (
                        <div className="text-end mt-2">
                          <Button
                            variant="link"
                            size="sm"
                            className="text-decoration-none p-0"
                            onClick={() => markRead(item.id)}
                          >
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                <Dropdown.Item
                  as="button"
                  className="text-center py-2 small"
                  onClick={() => navigate("/notifications")}
                >
                  View all notifications
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* ADMIN PROFILE DROPDOWN */}
            <NavDropdown
              align="end"
              className="admin-dropdown"
              title={
                <span className="profile-title d-flex align-items-center gap-2">
                  <PersonCircle size={27} />

                  <span className="d-flex flex-column text-start">
                    <strong>{adminProfile.name}</strong>
                    <small>{adminProfile.role}</small>
                  </span>
                </span>
              }
            >
              <NavDropdown.Header>
                <div className="d-flex align-items-center gap-2 py-1">
                  <PersonCircle size={36} />

                  <div>
                    <strong>{adminProfile.name}</strong>
                    <div className="text-muted small">
                      {adminProfile.role}
                    </div>
                  </div>
                </div>
              </NavDropdown.Header>

              <NavDropdown.Divider />

              <NavDropdown.Item as={NavLink} to="/settings">
                <Gear className="me-2" />
                Settings
              </NavDropdown.Item>

              <NavDropdown.Item as={NavLink} to="/admin">
                <ShieldCheck className="me-2" />
                Admin Panel
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item
                onClick={handleLogout}
                className="text-danger"
              >
                <BoxArrowRight className="me-2" />
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </div>
        </Container>
      </BootstrapNavbar>

      {/* SIDEBAR */}
      <Offcanvas
        show={showMenu}
        onHide={closeMenu}
        placement="start"
        className="institute-sidebar"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            <MortarboardFill className="me-2" />
            EduManage
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <p className="menu-heading">MAIN MENU</p>

          <Nav className="flex-column sidebar-links">
            {menuItems.map(({ to, label, icon: Icon }) => (
              <Nav.Link
                key={to}
                as={NavLink}
                to={to}
                onClick={closeMenu}
              >
                <Icon className="me-2" />
                {label}
              </Nav.Link>
            ))}
          </Nav>

          <hr />

          <p className="menu-heading">ACCOUNT</p>

          <Nav className="flex-column sidebar-links">
            <Nav.Link
              as={NavLink}
              to="/admin"
              onClick={closeMenu}
            >
              <PersonCircle className="me-2" />
              Admin Profile
            </Nav.Link>

            <Nav.Link
              as={NavLink}
              to="/notifications"
              onClick={closeMenu}
            >
              <Bell className="me-2" />
              Notifications

              {unreadCount > 0 && (
                <Badge bg="danger" pill className="ms-auto">
                  {unreadCount}
                </Badge>
              )}
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Navbar;
