export const translations = {
  en: {
    sync: 'Sync',
    syncTipOn: 'Scroll sync on',
    syncTipOff: 'Scroll sync off',
    copy: 'Copy',
    copied: 'Copied!',
    copyTip: 'Copy markdown',
    download: 'Download',
    downloadTip: 'Download .md',
    open: 'Open',
    openTip: 'Open .md file',
    editor: 'Editor',
    markdown: 'Markdown',
    preview: 'Preview',
    words: 'words',
    chars: 'chars',
    lines: 'lines',
    dropHere: 'Drop .md file here',
    placeholder: 'Start writing markdown…',
    syncStatus: '⇅ Sync',
    noSyncStatus: '— No sync',
    // Toolbar
    h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3',
    bold: 'Bold · Ctrl+B',
    italic: 'Italic · Ctrl+I',
    strike: 'Strikethrough',
    code: 'Inline code · Ctrl+`',
    quote: 'Blockquote',
    codeBlock: 'Code block · Ctrl+Shift+`',
    hr: 'Horizontal rule',
    bulletList: 'Bullet list',
    numberedList: 'Numbered list',
    taskList: 'Task list',
    link: 'Link · Ctrl+K',
    image: 'Image',
    table: 'Table',
    toDark: 'Dark mode',
    toLight: 'Light mode',
    exportPdf: 'Export PDF',
    fontSans: 'Noto Sans SC (Gothic)',
    fontSerif: 'Noto Serif SC (Sung)',
    fontWenkai: 'LXGW WenKai (Kai)',
    overwriteConfirm: 'Current content will be replaced. Continue?',
    focusEditor: 'Focus editor',
    focusPreview: 'Focus preview',
    exitFocus: 'Exit focus',
  },

  zh: {
    sync: '同步',
    syncTipOn: '滚动同步：开',
    syncTipOff: '滚动同步：关',
    copy: '复制',
    copied: '已复制',
    copyTip: '复制 Markdown',
    download: '下载',
    downloadTip: '下载 .md 文件',
    open: '打开',
    openTip: '打开 .md 文件',
    editor: '编辑器',
    markdown: 'Markdown',
    preview: '预览',
    words: '字',
    chars: '字符',
    lines: '行',
    dropHere: '拖放 .md 文件到此处',
    placeholder: '在此输入 Markdown…',
    syncStatus: '⇅ 同步中',
    noSyncStatus: '— 未同步',
    // Toolbar
    h1: '一级标题', h2: '二级标题', h3: '三级标题',
    bold: '加粗 · Ctrl+B',
    italic: '斜体 · Ctrl+I',
    strike: '删除线',
    code: '行内代码 · Ctrl+`',
    quote: '引用块',
    codeBlock: '代码块 · Ctrl+Shift+`',
    hr: '分割线',
    bulletList: '无序列表',
    numberedList: '有序列表',
    taskList: '任务列表',
    link: '链接 · Ctrl+K',
    image: '图片',
    table: '表格',
    toDark: '深色模式',
    toLight: '浅色模式',
    exportPdf: '导出 PDF',
    fontSans: '思源黑体',
    fontSerif: '思源宋体',
    fontWenkai: '霞鹜文楷',
    overwriteConfirm: '当前内容将被覆盖，确认继续？',
    focusEditor: '编辑区全屏',
    focusPreview: '预览区全屏',
    exitFocus: '退出全屏',
  },
}

export function getT(lang) {
  return translations[lang] || translations.en
}

export const defaultContent = {
  en: `# Welcome to MarkView

> A **beautiful**, *distraction-free* Markdown editor — write on the left, see the result on the right.

## Getting Started

- **Toolbar** — use the buttons above for common formatting
- **Keyboard shortcuts** — \`Ctrl+B\` bold, \`Ctrl+I\` italic, \`Ctrl+K\` link
- **Upload** — drag & drop a \`.md\` file onto the editor, or click **Open**
- **Scroll sync** — both panes scroll together; toggle with the **Sync** button

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | \`Ctrl+B\` |
| Italic | \`Ctrl+I\` |
| Link | \`Ctrl+K\` |
| Inline code | \`Ctrl+\`\` |
| Tab indent | \`Tab\` |

## Code Example

\`\`\`typescript
interface Editor {
  content: string
  preview: string
  syncScroll: boolean
}

const render = (editor: Editor): string =>
  marked.parse(editor.content)
\`\`\`

## Task List

- [x] Real-time preview
- [x] Syntax highlighting
- [x] File upload & drag-and-drop
- [x] Resizable split pane
- [x] Scroll sync
- [ ] Export to HTML

> "The best tools disappear into the work."

---

*Start writing your own content here…*
`,

  zh: `# 欢迎使用 MarkView

> 一个**简洁优雅**的 Markdown 编辑器 —— 左侧编写，右侧实时预览。

## 快速上手

- **工具栏** — 点击上方按钮插入常用格式
- **快捷键** — \`Ctrl+B\` 加粗、\`Ctrl+I\` 斜体、\`Ctrl+K\` 链接
- **上传文件** — 将 \`.md\` 文件拖拽到编辑区，或点击右上角**打开**按钮
- **滚动同步** — 两侧联动滚动，点击**同步**按钮切换开关

## 键盘快捷键

| 操作 | 快捷键 |
|------|--------|
| 加粗 | \`Ctrl+B\` |
| 斜体 | \`Ctrl+I\` |
| 链接 | \`Ctrl+K\` |
| 行内代码 | \`Ctrl+\`\` |
| 缩进 | \`Tab\` |

## 代码示例

\`\`\`typescript
interface Editor {
  content: string
  preview: string
  syncScroll: boolean
}

const render = (editor: Editor): string =>
  marked.parse(editor.content)
\`\`\`

## 任务清单

- [x] 实时预览
- [x] 语法高亮
- [x] 文件上传与拖拽
- [x] 可调节分栏
- [x] 滚动同步
- [ ] 导出为 HTML

> "最好的工具，会悄然隐于工作之中。"

---

*在此开始你的写作…*
`,
}
