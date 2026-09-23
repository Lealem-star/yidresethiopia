'use client'

import dynamic from 'next/dynamic'

const BookReader = dynamic(() => import('@/components/book-reader'), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-screen place-items-center bg-[#f5f3ee] text-sm text-[#777169]">
      በመጫን ላይ...
    </main>
  ),
})

export default function BookReaderLoader() {
  return <BookReader />
}
