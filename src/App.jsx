
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./Components/Nav.jsx";
import Dashboard from "./Components/pages/Dash.jsx";
import Students from "./Components/pages/Students.jsx";
import Faculty from "./Components/pages/Faculty.jsx";
import Attendance from "./Components/pages/Attendance.jsx";
import Courses from "./Components/pages/Courses.jsx";
import Fees from "./Components/pages/Fees.jsx";
import Reports from "./Components/pages/Reports.jsx";
import Settings from "./Components/pages/Settings.jsx";
import Notifications from "./Components/pages/Notifications.jsx";
import Admin from "./Components/pages/Admin.jsx";
import FeePendingReports from "./Components/pages/FeePendingReports.jsx";
import Timetable from "./Components/pages/Timetable.jsx";
import Examinations from "./Components/pages/Examinations.jsx";
import Results from "./Components/pages/Results.jsx";
import Login from "./Components/pages/Login.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/feependingreports" element={<FeePendingReports />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/examinations" element={<Examinations />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
