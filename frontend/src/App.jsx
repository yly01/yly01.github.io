import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Reader from './pages/Reader';

// Inner component so it can access ThemeContext
function AppInner() {
  const { background, bgOpacity } = useTheme();

  // Apply background CSS variable for opacity mask
  useEffect(() => {
    const layer = document.getElementById('bg-image-layer');
    if (!layer) return;
    if (background) {
      layer.style.backgroundImage = `url(${background})`;
      layer.style.opacity = '1';
      // Adjust the ::after overlay via a CSS variable
      document.documentElement.style.setProperty('--bg-overlay', bgOpacity);
    } else {
      layer.style.backgroundImage = 'none';
      layer.style.opacity = '0';
    }
  }, [background, bgOpacity]);

  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<Editor />} />
            <Route path="/edit/:id" element={<Editor />} />
            <Route path="/post/:id" element={<Reader />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;
