import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Save, Eye, Code, ArrowLeft, Bold, Italic, Quote, List, Link2, Image, Table, Minus } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || '';

const SHORTCUTS = [
  { label: 'B', title: '加粗', prefix: '**', suffix: '**', placeholder: '加粗文字' },
  { label: 'I', title: '斜体', prefix: '*', suffix: '*', placeholder: '斜体文字' },
  { label: 'H1', title: '一级标题', prefix: '# ', suffix: '', placeholder: '标题' },
  { label: 'H2', title: '二级标题', prefix: '## ', suffix: '', placeholder: '标题' },
  { label: 'H3', title: '三级标题', prefix: '### ', suffix: '', placeholder: '标题' },
  { label: '> ', title: '引用', prefix: '> ', suffix: '', placeholder: '引用内容' },
  { label: '- ', title: '无序列表', prefix: '- ', suffix: '', placeholder: '列表项' },
  { label: '```', title: '代码块', prefix: '```\n', suffix: '\n```', placeholder: '代码' },
  { label: '---', title: '分割线', prefix: '\n---\n', suffix: '', placeholder: '' },
  { label: '链接', title: '插入链接', prefix: '[', suffix: '](url)', placeholder: '链接文字' },
];

const FRONTMATTER_TEMPLATE = `---
title: 
tags: 
summary: 
pinned: false
---

# `;

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('split');

  const wordCount = content.replace(/```[\s\S]*?```/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').length;

  useEffect(() => {
    if (id) {
      fetch(`${API}/api/posts/${id}`)
        .then(r => r.json())
        .then(data => {
          setSlug(data.id);
          setContent(data.content || '');
        })
        .catch(console.error);
    } else {
      setContent(FRONTMATTER_TEMPLATE);
    }
  }, [id]);

  const insertMarkdown = (shortcut) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || shortcut.placeholder;
    const before = content.slice(0, start);
    const after = content.slice(end);

    const inserted = shortcut.prefix + selected + shortcut.suffix;
    const newContent = before + inserted + after;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + shortcut.prefix.length + selected.length + shortcut.suffix.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    let finalSlug = slug;
    if (!finalSlug) {
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const h1Match = content.match(/^#\s+(.+)$/m);
      const raw = (titleMatch?.[1] || h1Match?.[1] || 'untitled').trim();
      finalSlug = raw.replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, '').toLowerCase() || 'untitled';
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: finalSlug, content }),
      });
      const data = await res.json();
      if (data.success) navigate(`/post/${data.id}`);
    } catch (e) {
      console.error(e);
      alert('保存失败，请检查后端服务是否运行');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = textareaRef.current.selectionStart;
      const newContent = content.slice(0, s) + '  ' + content.slice(s);
      setContent(newContent);
      setTimeout(() => textareaRef.current.setSelectionRange(s + 2, s + 2), 0);
    }
  };

  const showEditor = activeTab === 'write' || activeTab === 'split';
  const showPreview = activeTab === 'preview' || activeTab === 'split';

  return (
    <div className="editor-page fade-in">
      <div className="editor-toolbar">
        <button className="btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />返回
        </button>

        <div className="editor-meta-row">
          <input
            className="input-field"
            placeholder="文章 URL ID（如 my-first-post，留空则自动生成）"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 3 }}>
          {[
            { key: 'write', label: '编辑', icon: <Code size={13} /> },
            { key: 'split', label: '分屏', icon: <Eye size={13} /> },
            { key: 'preview', label: '预览', icon: <Eye size={13} /> },
          ].map(tab => (
            <button
              key={tab.key}
              className="btn btn-sm"
              style={{
                border: 'none',
                background: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--text-2)',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="publish-btn">
          <Save size={15} />
          {saving ? '保存中...' : id ? '更新文章' : '发布文章'}
        </button>
      </div>

      <div className="editor-body">
        {showEditor && (
          <div className="editor-pane">
            <div className="pane-header">
              <span>✏️ Markdown 编辑器</span>
              <span className="word-count">{wordCount} 字</span>
            </div>
            <div className="markdown-shortcuts">
              {SHORTCUTS.map(s => (
                <button key={s.label} className="shortcut-btn" title={s.title} onClick={() => insertMarkdown(s)}>
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="editor-textarea"
              placeholder={FRONTMATTER_TEMPLATE}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          </div>
        )}

        {showPreview && (
          <div className="preview-pane">
            <div className="pane-header">
              <span>👁️ 实时预览</span>
            </div>
            <div className="preview-scroll">
              {content.trim() ? (
                <div className="md-body">
                  <ReactMarkdown>
                    {content.replace(/^---\n[\s\S]*?\n---\n?/, '')}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={{ color: 'var(--text-3)', fontStyle: 'italic', padding: '20px 0' }}>
                  预览将在此处显示...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Editor;
