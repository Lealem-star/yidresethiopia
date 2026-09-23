import Link from 'next/link'
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react'
import { listFeedback } from '@/lib/feedback-store'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'አስተያየት — ተስፈኛ ወጣት',
  description: 'ስለ ተስፈኛ ወጣት የአንባቢዎች አስተያየት።',
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('am-ET', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function FeedbackPage() {
  const items = await listFeedback()

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#24211e]">
      <header className="border-b border-[#dedbd3] bg-[#fbfaf7] px-5 py-4 md:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-[#f4f1eb]">
            <ArrowLeft className="size-4" /> ወደ መጽሐፉ
          </Link>
          <p className="font-serif text-lg font-semibold">አስተያየት</p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <section className="rounded-2xl border border-[#e7dfd1] bg-[#fbfaf7] p-6 shadow-[0_12px_40px_rgba(55,46,35,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b938a]">ያግኙኝ</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">አስተያየትና ግንኙነት</h1>
          <div className="mt-5 flex flex-col gap-3 text-sm text-[#5f5850]">
            <a href="tel:+251934551781" className="inline-flex items-center gap-2 hover:text-[#7d2929]">
              <Phone className="size-4 text-[#8b2d2d]" /> 0934551781
            </a>
            <a href="https://t.me/thebaseoftheworld" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#7d2929]">
              <MessageCircle className="size-4 text-[#8b2d2d]" /> @thebaseoftheworld
            </a>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-serif text-xl font-semibold">የአንባቢዎች አስተያየት</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-[#777169]">ገና አስተያየት የለም። ከመጽሐፉ ገጽ ላይ የመጀመሪያውን ይጻፉ።</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-[#dedbd3] bg-[#fbfaf7] p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <p className="font-medium text-[#7d2929]">{item.name ?? 'ስም አልተሰጠም'}</p>
                    <p className="text-xs text-[#8c867e]">{formatTime(item.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-[#9b938a]">{item.ageGroup}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#5f5850]">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
