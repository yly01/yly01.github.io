const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// ── Serve built frontend in production ───────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
if (IS_PROD && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log('📦 提供前端静态文件：', frontendDist);
}


const postsDir   = path.join(__dirname, 'posts');
const uploadsDir = path.join(__dirname, 'uploads');
const settingsFile = path.join(__dirname, 'settings.json');

[postsDir, uploadsDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

// ── Settings helpers ─────────────────────────────────────────
function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
  } catch {
    return { theme: 'dark', background: null, blogTitle: '我的博客', blogSubtitle: '' };
  }
}
function saveSettings(s) {
  fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
}

// ── Multer: image upload ──────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `background${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片文件'));
  },
});

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// ── Frontmatter parser ────────────────────────────────────────
function parsePost(id, raw) {
  let frontmatter = {};
  let body = raw;
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fmMatch) {
    body = fmMatch[2];
    fmMatch[1].split('\n').forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length) frontmatter[key.trim()] = rest.join(':').trim();
    });
  }
  if (!frontmatter.title) {
    const h1 = body.match(/^#\s+(.+)$/m);
    frontmatter.title = h1 ? h1[1].trim() : id;
  }
  if (!frontmatter.summary) {
    const plain = body.replace(/#+\s+.+/g, '').replace(/[*`\[\]>]/g, '').trim();
    frontmatter.summary = plain.slice(0, 120) + (plain.length > 120 ? '...' : '');
  }
  const tags = frontmatter.tags
    ? frontmatter.tags.split(',').map(t => t.trim()).filter(Boolean)
    : [];
  const wordCount = body.replace(/```[\s\S]*?```/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').length;
  return {
    frontmatter, body, tags, wordCount,
    readTime: Math.max(1, Math.ceil(wordCount / 400)),
    pinned: frontmatter.pinned === 'true',
    title: frontmatter.title,
    summary: frontmatter.summary,
  };
}

// ── Settings API ──────────────────────────────────────────────
app.get('/api/settings', (req, res) => res.json(loadSettings()));

app.post('/api/settings', (req, res) => {
  const current = loadSettings();
  const updated = { ...current, ...req.body };
  saveSettings(updated);
  res.json(updated);
});

// ── Upload background image ───────────────────────────────────
app.post('/api/upload/background', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '没有收到图片' });
  const url = `/uploads/${req.file.filename}`;
  const s = loadSettings();
  s.background = url;
  saveSettings(s);
  res.json({ success: true, url });
});

app.delete('/api/upload/background', (req, res) => {
  const s = loadSettings();
  if (s.background) {
    const filePath = path.join(__dirname, s.background);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    s.background = null;
    saveSettings(s);
  }
  res.json({ success: true });
});

// ── Posts API ─────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  const { tag, q } = req.query;
  fs.readdir(postsDir, (err, files) => {
    if (err) return res.status(500).json({ error: '无法读取文章目录' });
    let posts = files.filter(f => f.endsWith('.md')).map(file => {
      const id = file.replace('.md', '');
      const stats = fs.statSync(path.join(postsDir, file));
      const parsed = parsePost(id, fs.readFileSync(path.join(postsDir, file), 'utf-8'));
      return { id, title: parsed.title, summary: parsed.summary, tags: parsed.tags,
               pinned: parsed.pinned, wordCount: parsed.wordCount, readTime: parsed.readTime,
               createdAt: stats.birthtime, updatedAt: stats.mtime };
    });
    if (tag) posts = posts.filter(p => p.tags.includes(tag));
    if (q) {
      const kw = q.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.summary.toLowerCase().includes(kw) ||
        p.tags.some(t => t.toLowerCase().includes(kw)));
    }
    posts.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    res.json(posts);
  });
});

app.get('/api/tags', (req, res) => {
  fs.readdir(postsDir, (err, files) => {
    if (err) return res.status(500).json({ error: '无法读取文章目录' });
    const tagCount = {};
    files.filter(f => f.endsWith('.md')).forEach(file => {
      parsePost(file.replace('.md', ''), fs.readFileSync(path.join(postsDir, file), 'utf-8'))
        .tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
    });
    res.json(Object.entries(tagCount).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
  });
});

app.get('/api/posts/:id', (req, res) => {
  const fp = path.join(postsDir, `${req.params.id}.md`);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: '文章不存在' });
  const stats = fs.statSync(fp);
  const raw = fs.readFileSync(fp, 'utf-8');
  const p = parsePost(req.params.id, raw);
  res.json({ id: req.params.id, title: p.title, summary: p.summary, tags: p.tags,
             pinned: p.pinned, wordCount: p.wordCount, readTime: p.readTime,
             content: raw, body: p.body, createdAt: stats.birthtime, updatedAt: stats.mtime });
});

app.post('/api/posts', (req, res) => {
  const { id, content } = req.body;
  if (!id || content === undefined) return res.status(400).json({ error: 'id 和 content 为必填项' });
  const safeId = id.replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, '-').toLowerCase();
  fs.writeFile(path.join(postsDir, `${safeId}.md`), content, 'utf8', err => {
    if (err) return res.status(500).json({ error: '保存失败' });
    res.json({ success: true, id: safeId });
  });
});

app.delete('/api/posts/:id', (req, res) => {
  const fp = path.join(postsDir, `${req.params.id}.md`);
  if (!fs.existsSync(fp)) return res.status(404).json({ error: '文章不存在' });
  fs.unlink(fp, err => {
    if (err) return res.status(500).json({ error: '删除失败' });
    res.json({ success: true });
  });
});

if (IS_PROD && fs.existsSync(frontendDist)) {
  app.use((req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✅ 博客服务运行于 http://localhost:${PORT}`);
  if (IS_PROD) console.log('🌐 生产模式：前端和 API 均通过此端口提供');
});
