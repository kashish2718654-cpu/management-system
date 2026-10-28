
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import {
  Navbar as BootstrapNavbar,
  Container,
  Nav,
  NavDropdown,
  Badge,
  Button,
  Offcanvas,

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
} from "react-bootstrap-icons";

import "./Nav.css";

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  
  const { unreadCount } = useNotifications();

  const closeMenu = () => setShowMenu(false);

  

       const handleLogout = async () => {
       const confirmed = window.confirm("Are you sure you want to log out?");

       if (!confirmed) return;

      try {
       // Get a CSRF token from Django
       const csrfResponse = await fetch(
     "http://127.0.0.1:8000/api/auth/csrf/",
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }
     );

     if (!csrfResponse.ok) {
      throw new Error("Could not get security token.");
    }
 
     const csrfData = await csrfResponse.json();

       // End the Django session
     const response = await fetch(
      "http://127.0.0.1:8000/api/auth/logout/",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfData.csrfToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Logout failed. Please try again.");
    }

    // Django session has been ended successfully
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
            {/* Notifications */}
            <Button
              variant="light"
              className="notification-btn position-relative"
              onClick={() => navigate("/notifications")}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <Badge bg="danger" pill className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Admin profile dropdown */}
            <NavDropdown
              align="end"
              className="admin-dropdown"
              title={
                <span className="profile-title d-flex align-items-center gap-2">
                  <PersonCircle size={27} />
                  <span className="d-flex flex-column text-start">
                    <strong>Admin</strong>
                    <small>Administrator</small>
                  </span>
                </span>
              }
            >
              <NavDropdown.Header>
                <div className="d-flex align-items-center gap-2 py-1">
                  <PersonCircle size={36} />
                  <div>
                    <strong>Admin</strong>
                    <div className="text-muted small">
                      System Administrator
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

      {/* Sidebar */}
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
