import { useState, useRef } from 'react';
import { X, Upload, Trash2, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function SettingsPanel({ onClose }) {
  const { theme, toggleTheme, background, applyBackground, clearBackground, bgOpacity, updateBgOpacity } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await fetch(`${API}/api/upload/background`, { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        applyBackground(`${API}${data.url}?t=${Date.now()}`);
      } else {
        setError(data.error || '上传失败');
      }
    } catch {
      setError('网络错误，请检查后端服务');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="settings-title" style={{ margin: 0 }}>⚙️ 外观设置</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="settings-section">
          <span className="settings-label">🎨 主题模式</span>
          <div className="theme-options">
            <div
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              <span className="theme-icon">☀️</span>
              白天模式
            </div>
            <div
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              <span className="theme-icon">🌙</span>
              夜晚模式
            </div>
          </div>
        </div>

        <div className="settings-section">
          <span className="settings-label">🖼️ 博客背景图片</span>

          {background && (
            <img src={background} alt="当前背景" className="bg-preview" />
          )}

          <div className="bg-upload-area">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Upload size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
              {uploading ? '上传中...' : '点击或拖拽图片到此处'}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: 4 }}>支持 JPG、PNG、WebP，最大 10MB</div>
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 8 }}>{error}</div>}

          {background && (
            <>
              <div style={{ marginTop: 16 }}>
                <span className="settings-label">背景透明度遮罩</span>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={bgOpacity}
                  onChange={(e) => updateBgOpacity(parseFloat(e.target.value))}
                  className="opacity-slider"
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 4 }}>
                  当前：{Math.round(bgOpacity * 100)}%（值越高遮罩越深，内容越清晰）
                </div>
              </div>
              <button
                className="btn btn-danger btn-sm"
                style={{ marginTop: 12 }}
                onClick={clearBackground}
              >
                <Trash2 size={14} />移除背景图片
              </button>
            </>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn btn-primary" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  );
}
