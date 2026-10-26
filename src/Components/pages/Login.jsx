
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";


const API_URL = "http://localhost:8000/api/auth/";

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

function Login() {
 
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      // First, get the CSRF cookie from Django.
        const csrfResponse = await fetch(`${API_URL}csrf/`, {
         method: "GET",
         credentials: "include",
         mode: "cors",
         cache: "no-store",
     });

      if (!csrfResponse.ok) {
        throw new Error("Could not connect to the authentication service.");
      }

      const csrfData = await csrfResponse.json();
         console.log("CSRF response:", csrfData);
         console.log(
         "CSRF cookie received:",
         document.cookie.includes("csrftoken=")
      ); 
      const csrfToken = getCookie("csrftoken") || csrfData.csrfToken;

      if (!csrfToken) {
        throw new Error("CSRF token missing. Please refresh and try again.");
      }

      // Send login details to Django.
      const response = await fetch(`${API_URL}login/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      // Django has authenticated the user and created a session.
      sessionStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard", { replace: true });
    
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to Django. Check that the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center py-5">
      <Card
        className="shadow-sm border-0"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <Card.Body className="p-4">
          <h3 className="text-center mb-2">EduManage</h3>
          <p className="text-center text-muted mb-4">Admin Login</p>

          {error && <Alert variant="warning">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="adminUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="adminPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Form.Group>

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;
