import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Tag, Pin, FileText } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || '';

function Home() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTag = searchParams.get('tag') || '';
  const query = searchParams.get('q') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTag) params.set('tag', activeTag);
    if (query) params.set('q', query);

    fetch(`${API}/api/posts?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTag, query]);

  useEffect(() => {
    fetch(`${API}/api/tags`)
      .then(r => r.json())
      .then(setTags)
      .catch(() => {});
  }, []);

  const setTag = (t) => {
    const next = new URLSearchParams(searchParams);
    if (t === activeTag) {
      next.delete('tag');
    } else {
      next.set('tag', t);
      next.delete('q');
    }
    setSearchParams(next);
  };

  const clearFilter = () => setSearchParams({});

  const isFiltered = activeTag || query;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          {query ? `搜索："${query}"` : activeTag ? `标签：${activeTag}` : '所有文章'}
        </h1>
        <p className="page-subtitle">
          {loading ? '加载中...' : `共 ${posts.length} 篇文章`}
          {isFiltered && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilter} style={{ marginLeft: 12 }}>
              清除筛选
            </button>
          )}
        </p>
      </div>

      {tags.length > 0 && !query && (
        <div className="tag-filter">
          <span className="tag-filter-label">
            <Tag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            标签
          </span>
          {tags.map(t => (
            <button
              key={t.name}
              className={`tag ${activeTag === t.name ? 'active' : ''}`}
              onClick={() => setTag(t.name)}
            >
              {t.name}
              <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({t.count})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          正在加载文章...
        </div>
      ) : (
        <div className="posts-grid">
          {posts.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <h3>{query || activeTag ? '没有找到匹配的文章' : '还没有文章'}</h3>
              <p style={{ marginTop: 8 }}>
                {query || activeTag
                  ? '换个关键词或标签试试'
                  : '点击右上角「写文章」开始你的第一篇博客'}
              </p>
            </div>
          ) : (
            posts.map(post => (
              <Link to={`/post/${post.id}`} key={post.id} className="post-card">
                <div className="post-card-top">
                  <div className="post-card-title">{post.title}</div>
                  {post.pinned && (
                    <span className="pinned-badge">
                      <Pin size={10} />置顶
                    </span>
                  )}
                </div>

                {post.summary && (
                  <div className="post-card-summary">{post.summary}</div>
                )}

                {post.tags?.length > 0 && (
                  <div className="post-card-tags">
                    {post.tags.map(t => (
                      <span
                        key={t}
                        className="tag"
                        onClick={(e) => { e.preventDefault(); setTag(t); }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="post-card-meta">
                  <span>
                    <Calendar size={13} />
                    {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                  <span>
                    <Clock size={13} />
                    约 {post.readTime} 分钟
                  </span>
                  <span>
                    <FileText size={13} />
                    {post.wordCount} 字
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
