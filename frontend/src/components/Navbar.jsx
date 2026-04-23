import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, PenSquare, Search, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import SettingsPanel from './SettingsPanel';

function Navbar() {
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : '/');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon"><BookOpen size={18} /></div>
          我的博客
        </Link>

        <div className="navbar-center">
          <form className="search-bar" onSubmit={handleSearch}>
            <Search size={15} />
            <input
              type="text"
              placeholder="搜索文章、标签..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="navbar-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到白天模式' : '切换到夜晚模式'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="theme-toggle"
            onClick={() => setShowSettings(true)}
            title="外观设置"
          >
            <Settings size={16} />
          </button>

          <Link to="/new" className="btn btn-primary" id="write-post-btn">
            <PenSquare size={15} />写文章
          </Link>
        </div>
      </nav>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default Navbar;
