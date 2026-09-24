import { useEffect, useState } from "react";
import { IoSunny, IoMoon } from "react-icons/io5";
import "./theme.css";

const Theme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      toggleTheme();
    }
  };

  return (
    <div className="theme-wrapper">
      <button
        type="button"
        className={`theme-switch ${theme}`}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        aria-label={
          theme === "dark"
            ? "Switch to light theme"
            : "Switch to dark theme"
        }
      >
        <span className="theme-labels">
          {theme === "light" ? "DAY" : "NIGHT"}
        </span>

        <span className="slider">
          {theme === "light" ? (
            <IoSunny className="slider-icon" />
          ) : (
            <IoMoon className="slider-icon" />
          )}
        </span>
      </button>
    </div>
  );
};

export default Theme;
