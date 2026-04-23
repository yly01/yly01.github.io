import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Edit2, Trash2, Calendar, Clock, FileText, Tag, Pin } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || '';

function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/posts/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('文章不存在');
        return r.json();
      })
      .then(data => { setPost(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除《${post.title}》吗？此操作不可恢复。`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) navigate('/');
    } catch (e) {
      alert('删除失败');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      正在加载文章...
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
      <h3 style={{ color: 'var(--text-1)', marginBottom: 12 }}>出错了</h3>
      <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>{error}</p>
      <Link to="/" className="btn">返回首页</Link>
    </div>
  );

  return (
    <div className="reader-wrap fade-in">
      <div className="reader-nav">
        <Link to="/" className="btn">
          <ArrowLeft size={15} />返回列表
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/edit/${id}`} className="btn">
            <Edit2 size={15} />编辑
          </Link>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={15} />
            {deleting ? '删除中...' : '删除'}
          </button>
        </div>
      </div>

      <div className="reader-header">
        <h1 className="reader-title">{post.title}</h1>

        <div className="reader-meta">
          <span>
            <Calendar size={14} />
            {new Date(post.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
          <span>
            <Clock size={14} />
            约 {post.readTime} 分钟阅读
          </span>
          <span>
            <FileText size={14} />
            {post.wordCount} 字
          </span>
          {post.pinned && (
            <span style={{ color: 'var(--amber)' }}>
              <Pin size={14} />已置顶
            </span>
          )}
        </div>

        {post.tags?.length > 0 && (
          <div className="reader-tags">
            {post.tags.map(t => (
              <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">
                <Tag size={11} />{t}
              </Link>
            ))}
          </div>
        )}

        <div className="reader-divider" />
      </div>

      <div className="md-body">
        <ReactMarkdown>{post.body || ''}</ReactMarkdown>
      </div>

      <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/" className="btn">
          <ArrowLeft size={15} />返回列表
        </Link>
        <Link to={`/edit/${id}`} className="btn btn-primary">
          <Edit2 size={15} />编辑文章
        </Link>
      </div>
    </div>
  );
}

export default Reader;
