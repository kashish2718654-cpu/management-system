import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  ButtonGroup,
  Spinner,
} from "react-bootstrap";

import {
  Bell,
  Check2All,
  PersonPlus,
  CashCoin,
  CalendarCheck,
  ArrowClockwise,
  CheckCircle,
  ExclamationCircle,
} from "react-bootstrap-icons";

import { useNotifications } from "../../context/NotificationContext.jsx";
import "./Notifications.css";

function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => item.unread);
    }

    if (filter === "all") {
      return notifications;
    }

    return notifications.filter((item) => item.type === filter);
  }, [notifications, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const iconFor = (type) => {
    if (type === "student") return <PersonPlus size={22} />;
    if (type === "fee") return <CashCoin size={22} />;
    return <CalendarCheck size={22} />;
  };

  if (loading) {
    return (
      <div className="notification-page text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notification-page">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2>
            <Bell className="me-2" />
            Notifications
          </h2>
          <p className="text-muted mb-0">
            Stay updated with admissions, fees and attendance.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <ArrowClockwise
              className={`me-2 ${refreshing ? "spin-icon" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check2All className="me-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="d-flex align-items-start gap-2">
          <ExclamationCircle className="mt-1" />
          <div>{error}</div>
        </Alert>
      )}

      <div className="notification-summary mb-4">
        <Card className="notification-stat-card">
          <Card.Body>
            <span className="notification-stat-icon">
              <Bell size={21} />
            </span>
            <div>
              <h3>{notifications.length}</h3>
              <p>Total Notifications</p>
            </div>
          </Card.Body>
        </Card>

        <Card className="notification-stat-card">
          <Card.Body>
            <span className="notification-stat-icon unread-stat-icon">
              <CheckCircle size={21} />
            </span>
            <div>
              <h3>{unreadCount}</h3>
              <p>Unread Notifications</p>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card className="notification-card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <h5 className="mb-0">Recent Notifications</h5>
            <Badge bg={unreadCount ? "primary" : "secondary"} pill>
              {unreadCount} unread
            </Badge>
          </div>

          <div className="notification-filters mb-4">
            <ButtonGroup className="flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "student", label: "Admissions" },
                { key: "fee", label: "Fees" },
                { key: "attendance", label: "Attendance" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={
                    filter === item.key ? "primary" : "outline-primary"
                  }
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="notification-empty text-center py-5">
              <CheckCircle size={42} />
              <h6 className="mt-3">You're all caught up!</h6>
              <p className="text-muted mb-0">
                No notifications found for this filter.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item ${item.unread ? "unread" : ""}`}
              >
                <div className={`notification-icon ${item.type}`}>
                  {iconFor(item.type)}
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <strong>{item.title}</strong>
                    {item.unread && (
                      <Badge bg="primary" pill>
                        New
                      </Badge>
                    )}
                  </div>

                  <p className="mb-1 mt-1">{item.message}</p>
                  <small className="text-muted">{item.time}</small>
                </div>

                {item.unread && (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => markRead(item.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Notifications;