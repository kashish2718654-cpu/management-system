
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const NotificationContext = createContext(null);

const API = {
  students: "http://127.0.0.1:8000/api/students/",
  accounts: "http://127.0.0.1:8000/api/fees/accounts/",
  attendance: "http://127.0.0.1:8000/api/attendance/",
};

const getList = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : [];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isRecent = (value) => {
  const date = validDate(value);
  if (!date) return false;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  return date >= start && date <= now;
};

const formatTime = (value) => {
  const date = validDate(value);
  if (!date) return "Recently";

  if (date.toDateString() === new Date().toDateString()) {
    return `Today, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString();
};

const buildNotifications = (students, accounts, attendance) => {
  const result = [];

  students.forEach((student) => {
    const date =
      student.joining_date ||
      student.admission_date ||
      student.admissionDate;

    if (!isRecent(date)) return;

    result.push({
      id: `student-${student.id ?? student.student_id}`,
      title: "New Student Admission",
      message: `${student.name || "A student"} was recently registered.`,
      type: "student",
      time: formatTime(date),
      sortDate: validDate(date)?.getTime() || 0,
    });
  });

  accounts.forEach((account) => {
    const status = String(account.status || "").toLowerCase();
    const balance = Number(account.balance || 0);

    if (
      balance <= 0 &&
      !["pending", "partial", "partially paid"].includes(status)
    ) {
      return;
    }

    const studentName =
      account.student_name ||
      account.student_details?.name ||
      account.student?.name ||
      (typeof account.student === "string" ? account.student : null) ||
      "A student";

    result.push({
      id: `fee-${account.id}`,
      title: "Pending Fee Reminder",
      message: `${studentName} has ₹${balance.toLocaleString("en-IN")} in outstanding fees.`,
      type: "fee",
      time: "Fee account",
      sortDate: 0,
    });
  });

  attendance.forEach((record) => {
    const status = String(record.status || "").toLowerCase();
    if (!["absent", "late"].includes(status)) return;

    const student = students.find(
      (item) =>
        String(item.id) === String(record.student) ||
        String(item.student_id) === String(record.student)
    );

    const studentName =
      record.student_name ||
      record.student_details?.name ||
      student?.name ||
      (typeof record.student === "object"
        ? record.student?.name
        : null) ||
      "A student";

    result.push({
      id: `attendance-${record.id}`,
      title: status === "absent" ? "Student Absent" : "Late Attendance",
      message:
        status === "absent"
          ? `${studentName} is marked absent today.`
          : `${studentName} arrived late today.`,
      type: "attendance",
      time: formatTime(record.date || record.created_at),
      sortDate:
        validDate(record.date || record.created_at)?.getTime() || 0,
    });
  });

  return result.sort((a, b) => b.sortDate - a.sortDate);
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshNotifications = useCallback(async () => {
    try {
      const responses = await Promise.all([
         fetch(API.students, { credentials: "include" }),
         fetch(API.accounts, { credentials: "include" }),
         fetch(`${API.attendance}?date=${today()}`, {
         credentials: "include",
         }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("Unable to load notification APIs.");
      }

      const [studentsData, accountsData, attendanceData] =
        await Promise.all(responses.map((response) => response.json()));

      const generated = buildNotifications(
        getList(studentsData),
        getList(accountsData),
        getList(attendanceData)
      );

      setNotifications((previous) => {
        const previousReadState = new Map(
          previous.map((item) => [item.id, item.unread])
        );

        return generated.map((item) => ({
          ...item,
          unread: previousReadState.has(item.id)
            ? previousReadState.get(item.id)
            : true,
        }));
      });

      setError("");
    } catch (err) {
      console.error("Notification refresh failed:", err);
      setError("Could not load notifications from Django.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
     
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markRead = (id) => {
    setNotifications((items) =>
      items.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllRead = () => {
    setNotifications((items) =>
      items.map((item) => ({ ...item, unread: false }))
    );
  };

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider."
    );
  }

  return context;
}
