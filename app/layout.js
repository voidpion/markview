import { headers } from 'next/headers'
import './globals.css'

export async function generateMetadata() {
  const h = await headers()
  const lang = /zh/i.test(h.get('accept-language') || '') ? 'zh' : 'en'
  return {
    title: lang === 'zh' ? 'MarkView — Markdown 预览' : 'MarkView — Markdown Preview',
    description: lang === 'zh'
      ? '简洁优雅的 Markdown 编辑器，左侧编写，右侧实时预览'
      : 'A beautiful, distraction-free Markdown editor with real-time preview',
  }
}

export default async function RootLayout({ children }) {
  const h = await headers()
  const lang = /zh/i.test(h.get('accept-language') || '') ? 'zh' : 'en'

  return (
    <html lang={lang}>
      <head>
        {/* Prevent flash of wrong theme — runs before any paint */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('markview-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
