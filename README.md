# Beautiful Blog

A clean, local Markdown-based blog service with a premium dark-mode UI.

## Project Structure

```
beautiful-blog/
├── backend/          # Express API server (port 3001)
│   ├── server.js     # API routes
│   ├── posts/        # Your blog posts saved as .md files
│   └── package.json
└── frontend/         # Vite + React app (port 5173)
    ├── src/
    │   ├── pages/    # Home, Editor, Reader
    │   ├── components/
    │   └── index.css # Design system
    └── package.json
```

## How to Start (Every Time)

Open **two terminal tabs** in the `beautiful-blog` folder.

**Terminal 1 – Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3001
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Then open **http://localhost:5173** in your browser.

If you want to test from outside your machine, tunnel the frontend port:

```bash
npx localtunnel --port 5173
```

Do not tunnel `3001` for the whole site. `3001` is only the API server in this project.

## How to Use

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Shows all your posts as cards |
| Write | `/new` | Markdown editor with live preview |
| Read | `/post/:id` | Beautiful reading view |
| Edit | `/edit/:id` | Edit an existing post |

## Writing Tips

- Posts are saved as `.md` files in `backend/posts/`
- The first `# Heading` in your post becomes its display title
- The "Post URL ID" field sets the filename (e.g. `my-post` → `my-post.md`)
- You can also edit `.md` files directly in any text editor
