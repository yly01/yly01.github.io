import { createContext, useContext, useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_BASE_URL || '';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [background, setBackground] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.6);

  // Load saved settings on mount
  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then(r => r.json())
      .then(s => {
        const t = s.theme || 'dark';
        setTheme(t);
        document.documentElement.setAttribute('data-theme', t);
        if (s.background) setBackground(`${API}${s.background}`);
        if (s.bgOpacity !== undefined) setBgOpacity(s.bgOpacity);
      })
      .catch(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    fetch(`${API}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  };

  const applyBackground = (url) => {
    setBackground(url);
  };

  const clearBackground = () => {
    setBackground(null);
    fetch(`${API}/api/upload/background`, { method: 'DELETE' }).catch(() => {});
  };

  const updateBgOpacity = (val) => {
    setBgOpacity(val);
    fetch(`${API}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bgOpacity: val }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, background, applyBackground, clearBackground, bgOpacity, updateBgOpacity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
