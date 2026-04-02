'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  Quote, FileCode, Minus, List, ListOrdered, ListChecks,
  Link2, Image as LucideImage, Table,
  Upload, Copy, Check, Download, ArrowUpDown, Sun, Moon, FileDown,
} from 'lucide-react'
import { getT, defaultContent } from './i18n'

// ── Highlight.js setup ────────────────────────────────────────
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

// ── Marked setup ─────────────────────────────────────────────
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)
marked.use({ gfm: true, breaks: false })

// ── Component ─────────────────────────────────────────────────
export default function MarkViewClient({ lang = 'en' }) {
  const t = getT(lang)

  const [text, setText] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' && localStorage.getItem('markview-content')
      return saved ?? (defaultContent[lang] ?? defaultContent.en)
    } catch { return defaultContent[lang] ?? defaultContent.en }
  })
  const [splitPos, setSplitPos] = useState(50)
  const [copyState, setCopyState] = useState('idle')
  const [isDragOver, setIsDragOver] = useState(false)
  const [filename, setFilename] = useState(() => {
    try {
      return (typeof window !== 'undefined' && localStorage.getItem('markview-filename')) || 'untitled.md'
    } catch { return 'untitled.md' }
  })
  const [scrollSync, setScrollSync] = useState(true)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 1 })
  const [isDivDragging, setIsDivDragging] = useState(false)
  const [theme, setTheme] = useState('light')
  const [fontTheme, setFontTheme] = useState('sans')

  // Sync theme + fontTheme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('markview-theme')
    if (saved === 'dark' || saved === 'light') setTheme(saved)

    const savedFont = localStorage.getItem('markview-fontTheme')
    if (savedFont === 'sans' || savedFont === 'serif' || savedFont === 'wenkai') {
      setFontTheme(savedFont)
      if (savedFont === 'wenkai') loadWenKai()
    }
  }, [])

  const loadWenKai = () => {
    if (document.querySelector('link[data-font="wenkai"]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.setAttribute('data-font', 'wenkai')
    link.href = 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css'
    document.head.appendChild(link)
  }

  const changeFontTheme = useCallback((f) => {
    setFontTheme(f)
    localStorage.setItem('markview-fontTheme', f)
    if (f === 'wenkai') loadWenKai()
  }, [])

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('markview-theme', next)
  }, [theme])

  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)
  const syncBlockRef = useRef(false)
  const divDragActiveRef = useRef(false)
  const undoStack = useRef(null)   // null = uninitialized
  const undoIdx   = useRef(0)
  const undoTimer = useRef(null)
  const skipHistory = useRef(false)

  // Derived preview HTML
  const previewHtml = useMemo(() => {
    try { return marked.parse(text) }
    catch (e) { return `<p style="color:#ef4444">Parse error: ${e.message}</p>` }
  }, [text])

  // Stats
  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setStats({ words, chars: text.length, lines: text.split('\n').length })
  }, [text])

  // ── Persist content ──────────────────────────────────────────
  const persistTimer = useRef(null)
  useEffect(() => {
    clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      try { localStorage.setItem('markview-content', text) } catch { /* ignore */ }
    }, 500)
  }, [text])

  useEffect(() => {
    try { localStorage.setItem('markview-filename', filename) } catch { /* ignore */ }
  }, [filename])

  // ── Undo history ─────────────────────────────────────────────
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; return }
    if (undoStack.current === null) {
      undoStack.current = [text]; undoIdx.current = 0; return
    }
    clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => {
      const top = undoStack.current[undoIdx.current]
      if (top === text) return
      const next = undoStack.current.slice(0, undoIdx.current + 1)
      next.push(text)
      if (next.length > 200) next.shift()
      undoStack.current = next
      undoIdx.current = next.length - 1
    }, 400)
  }, [text])

  // ── Core op helper ──────────────────────────────────────────
  const applyOp = useCallback((transformer) => {
    const el = editorRef.current
    if (!el) return
    const value = el.value
    const selStart = el.selectionStart
    const selEnd = el.selectionEnd
    const selected = value.slice(selStart, selEnd)
    const result = transformer({ value, selStart, selEnd, selected })
    if (!result) return
    const { newValue, newSelStart, newSelEnd } = result
    setText(newValue)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(newSelStart, newSelEnd ?? newSelStart)
    })
  }, [])

  // ── Text operations ─────────────────────────────────────────
  const wrapSelection = useCallback((before, after, placeholder = 'text') => {
    applyOp(({ value, selStart, selEnd, selected }) => {
      const content = selected || placeholder
      return {
        newValue: value.slice(0, selStart) + before + content + after + value.slice(selEnd),
        newSelStart: selStart + before.length,
        newSelEnd: selStart + before.length + content.length,
      }
    })
  }, [applyOp])

  const insertAtCursor = useCallback((content) => {
    applyOp(({ value, selStart, selEnd }) => ({
      newValue: value.slice(0, selStart) + content + value.slice(selEnd),
      newSelStart: selStart + content.length,
      newSelEnd: selStart + content.length,
    }))
  }, [applyOp])

  const insertLinePrefix = useCallback((prefix) => {
    applyOp(({ value, selStart, selEnd }) => {
      const lineStart = value.lastIndexOf('\n', selStart - 1) + 1
      const afterEnd = value.indexOf('\n', selEnd)
      const blockEnd = afterEnd === -1 ? value.length : afterEnd
      const lines = value.slice(lineStart, blockEnd).split('\n')
      const allHave = lines.every(l => l.startsWith(prefix))
      const newLines = lines.map(l =>
        allHave ? l.slice(prefix.length) : l.startsWith(prefix) ? l : prefix + l
      )
      const newBlock = newLines.join('\n')
      const delta = newBlock.length - (blockEnd - lineStart)
      return {
        newValue: value.slice(0, lineStart) + newBlock + value.slice(blockEnd),
        newSelStart: lineStart,
        newSelEnd: blockEnd + delta,
      }
    })
  }, [applyOp])

  const insertHeading = useCallback((level) => {
    applyOp(({ value, selStart }) => {
      const lineStart = value.lastIndexOf('\n', selStart - 1) + 1
      const lineEnd = value.indexOf('\n', selStart)
      const end = lineEnd === -1 ? value.length : lineEnd
      const stripped = value.slice(lineStart, end).replace(/^#{1,6}\s*/, '')
      const prefix = '#'.repeat(level) + ' '
      const newLine = prefix + stripped
      const newPos = lineStart + newLine.length
      return {
        newValue: value.slice(0, lineStart) + newLine + value.slice(end),
        newSelStart: newPos, newSelEnd: newPos,
      }
    })
  }, [applyOp])

  const insertLink = useCallback(() => {
    applyOp(({ value, selStart, selEnd, selected }) => {
      const linkText = selected || 'link text'
      const template = `[${linkText}](url)`
      return {
        newValue: value.slice(0, selStart) + template + value.slice(selEnd),
        newSelStart: selStart + linkText.length + 3,
        newSelEnd: selStart + linkText.length + 6,
      }
    })
  }, [applyOp])

  const insertImage = useCallback(() => {
    insertAtCursor('![alt text](https://example.com/image.png)')
  }, [insertAtCursor])

  const insertTable = useCallback(() => {
    insertAtCursor(
      '\n| Column 1 | Column 2 | Column 3 |\n' +
      '|----------|----------|----------|\n' +
      '| Cell     | Cell     | Cell     |\n' +
      '| Cell     | Cell     | Cell     |\n\n'
    )
  }, [insertAtCursor])

  const insertCodeBlock = useCallback(() => {
    applyOp(({ value, selStart, selEnd, selected }) => {
      const code = selected || 'code here'
      const template = '```\n' + code + '\n```'
      return {
        newValue: value.slice(0, selStart) + template + value.slice(selEnd),
        newSelStart: selStart + 3,
        newSelEnd: selStart + 3,
      }
    })
  }, [applyOp])

  // ── Keyboard shortcuts ──────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      applyOp(({ value, selStart, selEnd }) => ({
        newValue: value.slice(0, selStart) + '  ' + value.slice(selEnd),
        newSelStart: selStart + 2, newSelEnd: selStart + 2,
      }))
      return
    }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); wrapSelection('**', '**', 'bold text'); break
        case 'i': e.preventDefault(); wrapSelection('*', '*', 'italic text'); break
        case 'k': e.preventDefault(); insertLink(); break
        case '`':
          e.preventDefault()
          if (e.shiftKey) insertCodeBlock()
          else wrapSelection('`', '`', 'code')
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            // Ctrl+Shift+Z — redo
            clearTimeout(undoTimer.current)
            if (undoIdx.current < (undoStack.current?.length ?? 1) - 1) {
              skipHistory.current = true
              undoIdx.current++
              setText(undoStack.current[undoIdx.current])
            }
          } else {
            // Ctrl+Z — undo: flush pending snapshot first
            clearTimeout(undoTimer.current)
            const cur = editorRef.current?.value ?? ''
            const stack = undoStack.current ?? [cur]
            if (stack[undoIdx.current] !== cur) {
              const next = stack.slice(0, undoIdx.current + 1)
              next.push(cur)
              if (next.length > 200) next.shift()
              undoStack.current = next
              undoIdx.current = next.length - 1
            }
            if (undoIdx.current > 0) {
              skipHistory.current = true
              undoIdx.current--
              setText(undoStack.current[undoIdx.current])
            }
          }
          break
        case 'y':
          e.preventDefault()
          // Ctrl+Y — redo
          clearTimeout(undoTimer.current)
          if (undoIdx.current < (undoStack.current?.length ?? 1) - 1) {
            skipHistory.current = true
            undoIdx.current++
            setText(undoStack.current[undoIdx.current])
          }
          break
      }
    }
  }, [applyOp, wrapSelection, insertLink, insertCodeBlock])

  // ── Cursor tracking ─────────────────────────────────────────
  const trackCursor = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const before = el.value.slice(0, el.selectionStart)
    const lines = before.split('\n')
    setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 })
  }, [])

  // ── Scroll sync ─────────────────────────────────────────────
  const handleEditorScroll = useCallback(() => {
    if (!scrollSync || syncBlockRef.current) return
    const el = editorRef.current
    const pr = previewRef.current
    if (!el || !pr) return
    const ratio = el.scrollTop / Math.max(el.scrollHeight - el.clientHeight, 1)
    syncBlockRef.current = true
    pr.scrollTop = ratio * Math.max(pr.scrollHeight - pr.clientHeight, 1)
    setTimeout(() => { syncBlockRef.current = false }, 80)
  }, [scrollSync])

  const handlePreviewScroll = useCallback(() => {
    if (!scrollSync || syncBlockRef.current) return
    const el = editorRef.current
    const pr = previewRef.current
    if (!el || !pr) return
    const ratio = pr.scrollTop / Math.max(pr.scrollHeight - pr.clientHeight, 1)
    syncBlockRef.current = true
    el.scrollTop = ratio * Math.max(el.scrollHeight - el.clientHeight, 1)
    setTimeout(() => { syncBlockRef.current = false }, 80)
  }, [scrollSync])

  // ── Resize divider ──────────────────────────────────────────
  const handleDividerDown = useCallback((e) => {
    e.preventDefault()
    divDragActiveRef.current = true
    setIsDivDragging(true)
    const move = (e) => {
      if (!divDragActiveRef.current || !containerRef.current) return
      const { left, width } = containerRef.current.getBoundingClientRect()
      setSplitPos(Math.min(Math.max(((e.clientX - left) / width) * 100, 20), 80))
    }
    const up = () => {
      divDragActiveRef.current = false
      setIsDivDragging(false)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }, [])

  // ── File handling ───────────────────────────────────────────
  const confirmOverwrite = useCallback((t) => {
    const cur = editorRef.current?.value ?? ''
    if (!cur) return true
    return window.confirm(t.overwriteConfirm)
  }, [])

  const loadFile = useCallback((file, inputEl, t) => {
    if (!file) return
    if (!confirmOverwrite(t)) {
      if (inputEl) inputEl.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result
      if (typeof content === 'string') {
        clearTimeout(undoTimer.current)
        clearTimeout(persistTimer.current)
        undoStack.current = [content]
        undoIdx.current = 0
        skipHistory.current = true
        try {
          localStorage.setItem('markview-content', content)
          localStorage.setItem('markview-filename', file.name)
        } catch { /* ignore */ }
        setText(content)
        setFilename(file.name)
        requestAnimationFrame(() => editorRef.current?.scrollTo(0, 0))
      }
      if (inputEl) inputEl.value = ''
    }
    reader.onerror = () => {
      console.error('Failed to read file:', file.name)
      if (inputEl) inputEl.value = ''
    }
    reader.readAsText(file, 'UTF-8')
  }, [confirmOverwrite])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    loadFile(e.dataTransfer.files?.[0], null, t)
  }, [loadFile, t])

  // ── Clipboard & download ────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState('success')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch { /* ignore */ }
  }, [text])

  const handleExportPdf = useCallback(() => {
    const el = document.querySelector('.preview-content')
    if (!el) return

    // Collect all styles from the current page (Next.js injected + Google Fonts)
    const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(l => `<link rel="stylesheet" href="${l.href}">`)
      .join('\n')
    const styleTags = Array.from(document.querySelectorAll('style'))
      .map(s => `<style>${s.textContent}</style>`)
      .join('\n')

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html>
<html lang="${document.documentElement.lang}">
<head>
  <meta charset="utf-8">
  <title>${filename}</title>
  ${linkTags}
  ${styleTags}
  <style>
    html, body {
      background: #fff !important;
      margin: 0; padding: 0;
      overflow: auto; height: auto;
      color: #18181b !important;
    }
    /* Override dark-mode tokens for print */
    :root, [data-theme="dark"] {
      --c-base: #fff;
      --c-surface: #fff;
      --c-elevated: #f0f0f6;
      --c-border: #d8d8e4;
      --c-border-faint: #e8e8f2;
      --c-text: #18181b;
      --c-text-muted: #71717a;
      --c-code-bg: #f3f3f8;
      --c-code-border: #dcdce8;
      --c-preview-heading: #111116;
      --c-preview-strong: #111116;
      --c-preview-code: #c2410c;
      --c-preview-pre-fg: #24292e;
      --c-preview-even-row: rgba(0,0,0,0.025);
    }
    .preview-content {
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 60px 60px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`)
    win.document.close()
    win.addEventListener('load', () => { win.focus(); win.print() })
  }, [filename])

  const handleDownload = useCallback(() => {
    const name = filename.match(/\.(md|mdx|markdown|txt)$/i) ? filename : filename + '.md'
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
    Object.assign(document.createElement('a'), { href: url, download: name }).click()
    URL.revokeObjectURL(url)
  }, [text, filename])

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon">M</div>
          MarkView
        </div>

        <div className="header-filename">
          <input
            id="filename-input"
            name="filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="header-actions">
          <button
            className="btn"
            onClick={toggleTheme}
            data-tip={theme === 'light' ? t.toDark : t.toLight}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            className={`btn${scrollSync ? ' active' : ''}`}
            onClick={() => setScrollSync(v => !v)}
            data-tip={scrollSync ? t.syncTipOn : t.syncTipOff}
          >
            <ArrowUpDown size={15} />
            <span>{t.sync}</span>
          </button>

          <button
            className={`btn${copyState === 'success' ? ' active' : ''}`}
            onClick={handleCopy}
            data-tip={t.copyTip}
          >
            {copyState === 'success' ? <Check size={15} /> : <Copy size={15} />}
            <span>{copyState === 'success' ? t.copied : t.copy}</span>
          </button>

          <button className="btn" onClick={handleDownload} data-tip={t.downloadTip}>
            <Download size={15} />
            <span>{t.download}</span>
          </button>

          <button
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            data-tip={t.openTip}
          >
            <Upload size={15} />
            <span>{t.open}</span>
          </button>

          <button className="btn" onClick={handleExportPdf} data-tip={t.exportPdf}>
            <FileDown size={15} />
            <span>{t.exportPdf}</span>
          </button>

          <input
            ref={fileInputRef}
            id="file-upload"
            name="file-upload"
            type="file"
            accept=".md,.mdx,.markdown,.txt"
            style={{ display: 'none' }}
            onChange={(e) => loadFile(e.target.files?.[0], e.target, t)}
          />
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="btn" onClick={() => insertHeading(1)} data-tip={t.h1}><Heading1 size={17} /></button>
        <button className="btn" onClick={() => insertHeading(2)} data-tip={t.h2}><Heading2 size={17} /></button>
        <button className="btn" onClick={() => insertHeading(3)} data-tip={t.h3}><Heading3 size={17} /></button>

        <div className="toolbar-sep" />

        <button className="btn" onClick={() => wrapSelection('**', '**', 'bold')} data-tip={t.bold}><Bold size={16} /></button>
        <button className="btn" onClick={() => wrapSelection('*', '*', 'italic')} data-tip={t.italic}><Italic size={16} /></button>
        <button className="btn" onClick={() => wrapSelection('~~', '~~', 'strikethrough')} data-tip={t.strike}><Strikethrough size={16} /></button>
        <button className="btn" onClick={() => wrapSelection('`', '`', 'code')} data-tip={t.code}><Code size={16} /></button>

        <div className="toolbar-sep" />

        <button className="btn" onClick={() => insertLinePrefix('> ')} data-tip={t.quote}><Quote size={16} /></button>
        <button className="btn" onClick={insertCodeBlock} data-tip={t.codeBlock}><FileCode size={17} /></button>
        <button className="btn" onClick={() => insertAtCursor('\n\n---\n\n')} data-tip={t.hr}><Minus size={17} /></button>

        <div className="toolbar-sep" />

        <button className="btn" onClick={() => insertLinePrefix('- ')} data-tip={t.bulletList}><List size={17} /></button>
        <button className="btn" onClick={() => insertLinePrefix('1. ')} data-tip={t.numberedList}><ListOrdered size={17} /></button>
        <button className="btn" onClick={() => insertLinePrefix('- [ ] ')} data-tip={t.taskList}><ListChecks size={17} /></button>

        <div className="toolbar-sep" />

        <button className="btn" onClick={insertLink} data-tip={t.link}><Link2 size={16} /></button>
        <button className="btn" onClick={insertImage} data-tip={t.image}><LucideImage size={16} /></button>
        <button className="btn" onClick={insertTable} data-tip={t.table}><Table size={16} /></button>
      </div>

      {/* Main split pane */}
      <main className="main" ref={containerRef}>

        {/* Editor */}
        <div className="editor-pane" style={{ width: `${splitPos}%` }}>
          <div className="editor-pane-header">
            <span>{t.editor}</span>
            <span>{t.markdown}</span>
          </div>
          <div
            style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
            onDrop={handleDrop}
          >
            <textarea
              ref={editorRef}
              id="editor-textarea"
              className="editor-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={trackCursor}
              onClick={trackCursor}
              onScroll={handleEditorScroll}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder={t.placeholder}
            />
            <div className={`drag-overlay${isDragOver ? ' visible' : ''}`}>
              <Upload size={36} style={{ opacity: 0.6 }} />
              <span>{t.dropHere}</span>
            </div>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className={`divider${isDivDragging ? ' dragging' : ''}`}
          onPointerDown={handleDividerDown}
        >
          <div className="divider-dots">
            {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
          </div>
        </div>

        {/* Preview */}
        <div className="preview-pane">
          <div className="preview-pane-header">
            <span>{t.preview}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="font-switcher">
                {[['sans','黑',t.fontSans],['serif','宋',t.fontSerif],['wenkai','楷',t.fontWenkai]].map(([key, label, tip]) => (
                  <button
                    key={key}
                    className={`btn${fontTheme === key ? ' active' : ''}`}
                    onClick={() => changeFontTheme(key)}
                    data-tip={tip}
                  >{label}</button>
                ))}
              </div>
              <span>{stats.words} {t.words} · {stats.chars} {t.chars}</span>
            </div>
          </div>
          <div
            ref={previewRef}
            className="preview-scroll"
            onScroll={handlePreviewScroll}
          >
            <div
              className={`preview-content preview-font-${fontTheme}`}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </main>

      {/* Status bar */}
      <div className="statusbar">
        <span className="status-item">Ln {cursor.line}, Col {cursor.col}</span>
        <span className="status-item">{stats.words} {t.words}</span>
        <span className="status-item">{stats.chars} {t.chars}</span>
        <span className="status-item">{stats.lines} {t.lines}</span>
        <span className="status-item" style={{ marginLeft: 'auto', borderRight: 'none' }}>
          {scrollSync ? t.syncStatus : t.noSyncStatus}
        </span>
      </div>
    </div>
  )
}
