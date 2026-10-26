
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/auth/check/", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          setAuthenticated(false);
          return;
        }
        return response.json();
      })
      .then((data) => {
        if (data) setAuthenticated(data.authenticated === true);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) return <p>Checking login...</p>;

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
