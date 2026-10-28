import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./Components/pages/ThemeContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
   <StrictMode>
    <NotificationProvider>
      <ThemeProvider>
      <App />
      </ThemeProvider>
    </NotificationProvider>
  </StrictMode>
);