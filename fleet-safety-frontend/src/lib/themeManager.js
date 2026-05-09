const THEME_KEY = "vigilant_theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

export function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? DARK_THEME : LIGHT_THEME);
  
  applyTheme(theme);
  return theme;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  
  if (theme === DARK_THEME) {
    root.setAttribute("data-theme", DARK_THEME);
    localStorage.setItem(THEME_KEY, DARK_THEME);
  } else {
    root.setAttribute("data-theme", LIGHT_THEME);
    localStorage.setItem(THEME_KEY, LIGHT_THEME);
  }
}

export function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || LIGHT_THEME;
}

export function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
  applyTheme(newTheme);
  return newTheme;
}
