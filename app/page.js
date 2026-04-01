import { headers } from 'next/headers'
import MarkViewClient from './MarkViewClient'

export default async function Page() {
  const h = await headers()
  const acceptLang = h.get('accept-language') || ''
  const lang = /zh/i.test(acceptLang) ? 'zh' : 'en'
  return <MarkViewClient lang={lang} />
}
