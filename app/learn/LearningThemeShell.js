"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const LearningThemeContext = createContext(null);
const THEME_KEY = "watts-my-bill-learning-theme";

export default function LearningThemeShell({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const restoreFrame = window.requestAnimationFrame(() => {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark") setDark(true);
    });
    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  const toggleTheme = () => {
    setDark((current) => {
      const next = !current;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  };

  return (
    <LearningThemeContext.Provider value={{ dark, toggleTheme }}>
      <div className={`learning-shell ${dark ? "is-dark" : "is-light"}`}>
        {children}
      </div>
    </LearningThemeContext.Provider>
  );
}

export function LearningThemeToggle() {
  const theme = useContext(LearningThemeContext);
  if (!theme) return null;

  return (
    <button
      type="button"
      onClick={theme.toggleTheme}
      className="learning-theme-toggle grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-emerald-950/10 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
      aria-label={theme.dark ? "Switch Learning Hub to light mode" : "Switch Learning Hub to dark mode"}
      title={theme.dark ? "Light mode" : "Dark mode"}
    >
      {theme.dark ? <Sun size={16} strokeWidth={2.3} /> : <Moon size={16} strokeWidth={2.3} />}
    </button>
  );
}
