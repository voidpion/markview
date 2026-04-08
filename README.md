# MarkView

A beautiful, distraction-free Markdown editor with real-time preview.

简洁优雅的 Markdown 编辑器 —— 左侧编写，右侧实时预览。

## Features

- **Real-time Preview** — Split-pane layout with synchronized scrolling
- **Syntax Highlighting** — Code blocks powered by highlight.js (JS/TS/Python/Go/Rust/SQL/YAML and more)
- **Rich Toolbar** — One-click formatting: headings, bold, italic, code, lists, tables, links, images
- **Keyboard Shortcuts** — `Ctrl+B` bold, `Ctrl+I` italic, `Ctrl+K` link, `Ctrl+Z/Y` undo/redo
- **Dark / Light Theme** — One-click toggle, preference persisted in localStorage
- **Font Switching** — Preview supports Noto Sans SC (黑体), Noto Serif SC (宋体), LXGW WenKai (霞鹜文楷)
- **File Operations** — Open, download `.md` files; drag & drop supported
- **Export PDF** — Print-optimized styling via `window.print()`
- **Auto-save** — Content and filename auto-persisted to localStorage
- **Resizable Panes** — Drag the divider to adjust editor/preview ratio
- **Fullscreen Focus** — Expand editor or preview to full width independently
- **i18n** — Auto-detects browser language; supports English and 中文

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [marked](https://github.com/markedjs/marked) + [marked-highlight](https://github.com/markedjs/marked-highlight) — Markdown parsing
- [highlight.js](https://highlightjs.org/) — Syntax highlighting
- [Lucide React](https://lucide.dev/) — Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── layout.js          # Root layout, theme flash prevention, font preloading
├── page.js            # Server component, language detection
├── MarkViewClient.js  # Main editor component (client-side)
├── i18n.js            # Translations & default content (en/zh)
├── globals.css        # Full styling: tokens, themes, typography, print
└── icon.js            # Favicon
```

## License

MIT
