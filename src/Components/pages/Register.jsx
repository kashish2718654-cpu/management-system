
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";

const API_URL = "http://localhost:8000/api/auth/";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    institute_name: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

   try {
  // First, get CSRF cookie
  await fetch(`${API_URL}csrf/`, {
    method: "GET",
    credentials: "include",
  });

  // Read CSRF token from cookie
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];

  if (!csrfToken) {
    throw new Error("CSRF token not found. Please refresh the page.");
  }

  const response = await fetch(`${API_URL}register/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed.");
  }

  setMessage(data.message);

  setFormData({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    institute_name: "",
    password: "",
  });
} catch (err) {
  setError(err.message || "Something went wrong.");
}
  };

  return (
    <Container className="py-5" style={{ maxWidth: "600px" }}>
      <Card className="shadow border-0">
        <Card.Body className="p-4">
          <h3 className="text-center mb-2">Admin Registration</h3>
          <p className="text-muted text-center mb-4">
            Create your institute admin registration request.
          </p>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            {[
              ["full_name", "Full Name", "text"],
              ["username", "Username", "text"],
              ["email", "Email", "email"],
              ["phone", "Phone Number", "tel"],
              ["institute_name", "Institute Name", "text"],
              ["password", "Password", "password"],
            ].map(([name, label, type]) => (
              <Form.Group className="mb-3" key={name}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  required
                  minLength={name === "password" ? 8 : undefined}
                  autoComplete={
                    name === "password" ? "new-password" : "on"
                  }
                />
              </Form.Group>
            ))}

            <Button
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </Form>

          <div className="text-center mt-3">
            Already registered? <Link to="/login">Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;
