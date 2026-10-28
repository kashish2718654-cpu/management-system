import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "edumanageTheme";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);

    return ["light", "dark", "system"].includes(savedTheme)
      ? savedTheme
      : "light";
  } catch {
    return "light";
  }
}

function getActiveTheme(theme) {
  if (theme !== "system") {
    return theme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const applyTheme = () => {
      const activeTheme = getActiveTheme(theme);

      document.documentElement.setAttribute("data-theme", activeTheme);
      document.documentElement.setAttribute("data-bs-theme", activeTheme);

      document.documentElement.style.colorScheme = activeTheme;
    };

    applyTheme();

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Unable to save theme:", error);
    }

    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const activeTheme = getActiveTheme(current);
      return activeTheme === "dark" ? "light" : "dark";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// export function useTheme() {
//   const context = useContext(ThemeContext);

//   if (!context) {
//     throw new Error("useTheme must be used inside ThemeProvider");
//   }

//   return context;
// }