'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { BookOpen, ChevronLeft, ChevronRight, Expand, Info, LockKeyhole, Menu, MessageSquare, Minus, Plus, Search, Settings2, ShieldCheck, Shrink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const chapters = [
  { number: '01', title: 'ይድረስ ለኢትዮጵያ ከተስፈኛው ወጣት', page: 8, end: 9 },
  { number: '02', title: 'ሠውና ዕምነቱ በወጣት አይን', page: 10, end: 13 },
  { number: '03', title: 'ገጠር ሂደን ሳለ', page: 14, end: 18 },
  { number: '04', title: 'ሳይንስ ፈጠራና የመጥበብ ተቃርኖ', page: 19, end: 21 },
  { number: '05', title: 'የኛ የወጣቶች ቅዥት', page: 22, end: 23 },
  { number: '06', title: 'ወጣትነት በኛ ዘመን', page: 24, end: 27 },
  { number: '07', title: 'ትርፍ ማለት ህዝብ ማደግ ነው', page: 28, end: 30 },
  { number: '08', title: 'ተስፋና ፍቅር', page: 31, end: 34 },
  { number: '09', title: 'አባትነት በወጣት አይን', page: 35, end: 38 },
  { number: '10', title: 'የወጣትነት ሀላፊነቴን ስለመቀበል', page: 39, end: 39 },
  { number: '11', title: 'ለትንሳኤ መወለድ', page: 40, end: 54 },
  { number: '12', title: 'እኔ ተስፈኛው ወጣት የማቀርበው ቻሌንጅ', page: 55, end: 71 },
  { number: '13', title: 'የኔ የተስፈኛው ወጣት የመጨረሻ ቃል', page: 72, end: 74 },
]

const frontMatter = { number: '00', title: 'መግቢያ' }

type SearchHit = { page: number; snippet: string }

function chapterForPage(page: number) {
  const match = chapters.find((chapter) => page >= chapter.page && page <= chapter.end)
  if (match) return match
  if (page < chapters[0].page) return frontMatter
  return chapters[chapters.length - 1]
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

export function BookReader() {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [cropMargins, setCropMargins] = useState(true)
  const [showContents, setShowContents] = useState(true)
  const [showAbout, setShowAbout] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pdfError, setPdfError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readerRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pageTextsRef = useRef<string[] | null>(null)
  const totalPages = pdf?.numPages ?? 74
  const totalPagesRef = useRef(totalPages)
  totalPagesRef.current = totalPages
  const chapter = useMemo(() => chapterForPage(page), [page])

  useEffect(() => {
    let active = true
    let destroy: (() => void) | undefined
    ;(async () => {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      const loading = pdfjs.getDocument({ url: '/books/yenederesha.pdf' })
      destroy = () => loading.destroy()
      try {
        const document = await loading.promise
        if (active) setPdf(document)
      } catch {
        if (active) setPdfError(true)
      }
    })()
    return () => {
      active = false
      destroy?.()
    }
  }, [])

  useEffect(() => {
    if (!pdf) return
    let active = true
    pageTextsRef.current = null
    const pages: string[] = []
    ;(async () => {
      for (let index = 1; index <= pdf.numPages; index += 1) {
        const pdfPage = await pdf.getPage(index)
        const content = await pdfPage.getTextContent()
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        pages[index] = text
        if (!active) return
      }
      if (active) pageTextsRef.current = pages
    })().catch(() => {})
    return () => { active = false }
  }, [pdf])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let active = true
    pdf.getPage(page).then(async (pdfPage) => {
      if (!active || !canvasRef.current) return
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const maxWidth = Math.min(760, window.innerWidth < 768 ? window.innerWidth - 40 : 760)
      const scale = Math.min(2, maxWidth / baseViewport.width) * (zoom / 100)
      const viewport = pdfPage.getViewport({ scale })
      const pixelRatio = window.devicePixelRatio || 1
      const renderCanvas = document.createElement('canvas')
      renderCanvas.width = viewport.width * pixelRatio
      renderCanvas.height = viewport.height * pixelRatio
      const renderContext = renderCanvas.getContext('2d')
      if (!renderContext) return
      renderContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      await pdfPage.render({ canvasContext: renderContext, viewport }).promise
      if (!active || !canvasRef.current) return

      let left = 0
      let top = 0
      let right = renderCanvas.width
      let bottom = renderCanvas.height

      if (cropMargins) {
        const pixels = renderContext.getImageData(0, 0, renderCanvas.width, renderCanvas.height).data
        left = renderCanvas.width
        top = renderCanvas.height
        right = 0
        bottom = 0
        for (let y = 0; y < renderCanvas.height; y += 2) {
          for (let x = 0; x < renderCanvas.width; x += 2) {
            const index = (y * renderCanvas.width + x) * 4
            if (pixels[index] < 242 || pixels[index + 1] < 242 || pixels[index + 2] < 242) {
              left = Math.min(left, x)
              top = Math.min(top, y)
              right = Math.max(right, x)
              bottom = Math.max(bottom, y)
            }
          }
        }
        const padding = 28 * pixelRatio
        left = Math.max(0, left - padding)
        top = Math.max(0, top - padding)
        right = Math.min(renderCanvas.width, right + padding)
        bottom = Math.min(renderCanvas.height, bottom + padding)
      }

      const cropWidth = Math.max(1, right - left)
      const cropHeight = Math.max(1, bottom - top)
      canvas.width = cropWidth
      canvas.height = cropHeight
      canvas.style.width = `${cropWidth / pixelRatio}px`
      canvas.style.height = `${cropHeight / pixelRatio}px`
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.drawImage(renderCanvas, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    }).catch(() => {
      if (active) setPdfError(true)
    })
    return () => { active = false }
  }, [pdf, page, zoom, cropMargins])

  useEffect(() => {
    const stop = (event: Event) => {
      if (isTypingTarget(event.target)) return
      event.preventDefault()
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSearch(false)
        setShowSettings(false)
        setShowAbout(false)
        return
      }
      if (isTypingTarget(event.target)) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setShowSearch(true)
        setShowSettings(false)
        setShowAbout(false)
        return
      }
      if ((event.ctrlKey || event.metaKey) && ['c', 'x', 's', 'p', 'u'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }
      if (event.key === 'ArrowLeft') setPage((value) => Math.max(1, value - 1))
      if (event.key === 'ArrowRight') setPage((value) => Math.min(totalPagesRef.current, value + 1))
    }
    document.addEventListener('contextmenu', stop)
    document.addEventListener('copy', stop)
    document.addEventListener('cut', stop)
    document.addEventListener('keydown', keydown)
    return () => {
      document.removeEventListener('contextmenu', stop)
      document.removeEventListener('copy', stop)
      document.removeEventListener('cut', stop)
      document.removeEventListener('keydown', keydown)
    }
  }, [])

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus()
  }, [showSearch])

  const runSearch = async () => {
    const needle = query.trim()
    if (!needle) {
      setHits([])
      return
    }
    setSearching(true)
    const deadline = Date.now() + 20000
    while (!pageTextsRef.current && Date.now() < deadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 120))
    }
    setSearching(false)
    if (pageTextsRef.current) setHits(collectHits(pageTextsRef.current, needle))
  }

  const toggleFullscreen = async () => {
    const node = readerRef.current
    if (!node) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await node.requestFullscreen()
  }

  const goToHit = (hitPage: number) => {
    setPage(hitPage)
    setShowSearch(false)
  }

  return (
    <main ref={readerRef} className="min-h-screen bg-[#f5f3ee] text-[#24211e] select-none" onDragStart={(event) => event.preventDefault()}>
      <header className="flex h-[72px] items-center justify-between border-b border-[#dedbd3] bg-[#fbfaf7] px-5 md:px-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Open table of contents" onClick={() => setShowContents((value) => !value)}><Menu /></Button>
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#8b2d2d] text-[#f8e9c4]"><BookOpen /></div>
            <div>
              <p className="font-serif text-lg font-semibold leading-none">ተስፈኛ ወጣት</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#8c867e]">Digital library</p>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-sm text-[#777169] md:flex"><ShieldCheck className="size-4 text-[#8b2d2d]" /> የተጠበቀ ንባብ</div>
        <div className="flex items-center gap-2">
          <Link href="/feedback" className="inline-flex h-7 items-center gap-2 rounded-lg border border-border px-2.5 text-[0.8rem] font-medium hover:bg-muted">
            <MessageSquare className="size-3.5" /> አስተያየት
          </Link>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => { setShowAbout(true); setShowSearch(false); setShowSettings(false) }}>
            <Info /> ስለ መጽሐፉ
          </Button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-72px)]">
        <aside className={`fixed inset-y-[72px] left-0 z-10 w-[290px] border-r border-[#dedbd3] bg-[#fbfaf7] p-5 transition-transform duration-200 md:static md:translate-x-0 ${showContents ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b938a]">የመጽሐፉ ዝርዝር</p>
              <h2 className="mt-1 font-serif text-xl font-semibold">ማውጫ</h2>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowContents(false)} aria-label="Close table of contents"><X /></Button>
          </div>
          <nav className="flex flex-col gap-1.5" aria-label="Chapters">
            {chapters.map((item) => {
              const active = page >= item.page && page <= item.end
              return (
                <button
                  key={item.number}
                  onClick={() => { setPage(item.page); setShowContents(false) }}
                  className={`flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${active ? 'bg-[#f1e9da] text-[#7d2929]' : 'text-[#6f6962] hover:bg-[#f4f1eb]'}`}
                >
                  <span className="font-serif text-sm font-bold">{item.number}</span>
                  <span className="text-sm leading-5">{item.title}</span>
                </button>
              )
            })}
          </nav>
          <div className="mt-8 rounded-xl border border-[#e7dfd1] bg-[#f8f1e5] p-4">
            <LockKeyhole className="size-4 text-[#8b2d2d]" />
            <p className="mt-3 text-xs leading-5 text-[#70685d]">ይህ እትም ለንባብ ብቻ የተዘጋጀ ነው። ይዘቱ መቅዳት እና ማውረድ አይቻልም።</p>
          </div>
        </aside>

        <section className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 items-center justify-between border-b border-[#e4e0d8] bg-[#f8f6f1] px-5 md:px-10">
            <div className="flex min-w-0 items-center gap-2 text-sm text-[#777169]">
              <span className="shrink-0">ምዕራፍ {chapter.number}</span>
              <span className="text-[#b6b0a7]">/</span>
              <span className="truncate">{chapter.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Search" aria-expanded={showSearch} onClick={() => { setShowSearch((value) => !value); setShowSettings(false) }}>
                <Search />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Reader settings" aria-expanded={showSettings} onClick={() => { setShowSettings((value) => !value); setShowSearch(false) }}>
                <Settings2 />
              </Button>
            </div>
          </div>

          {showSearch && (
            <div className="absolute right-5 top-16 z-20 w-[min(100%-2.5rem,360px)] rounded-xl border border-[#dedbd3] bg-[#fbfaf7] p-4 shadow-[0_16px_40px_rgba(55,46,35,0.12)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-base font-semibold">ፈልግ</p>
                <Button variant="ghost" size="icon" aria-label="Close search" onClick={() => setShowSearch(false)}><X /></Button>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  runSearch()
                }}
              >
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ቃል ወይም ሐረግ..."
                  className="h-9 flex-1 rounded-md border border-[#dedbd3] bg-white px-3 text-sm outline-none"
                />
                <Button type="submit" size="sm">ፈልግ</Button>
              </form>
              <div className="mt-3 max-h-64 overflow-auto">
                {searching && <p className="text-xs text-[#777169]">በመፈለግ ላይ...</p>}
                {!searching && hits.length === 0 && query.trim() && <p className="text-xs text-[#777169]">ውጤት አልተገኘም።</p>}
                {!searching && hits.map((hit) => (
                  <button
                    key={`${hit.page}-${hit.snippet}`}
                    onClick={() => goToHit(hit.page)}
                    className="mb-2 block w-full rounded-lg px-3 py-2 text-left text-sm text-[#5f5850] hover:bg-[#f4f1eb]"
                  >
                    <span className="font-medium text-[#7d2929]">ገጽ {hit.page}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5">{hit.snippet}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSettings && (
            <div className="absolute right-5 top-16 z-20 w-[min(100%-2.5rem,320px)] rounded-xl border border-[#dedbd3] bg-[#fbfaf7] p-4 shadow-[0_16px_40px_rgba(55,46,35,0.12)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-base font-semibold">ቅንብሮች</p>
                <Button variant="ghost" size="icon" aria-label="Close settings" onClick={() => setShowSettings(false)}><X /></Button>
              </div>
              <label className="flex items-center justify-between gap-3 text-sm text-[#5f5850]">
                <span>ጠርዝ ቁረጥ</span>
                <input type="checkbox" checked={cropMargins} onChange={(event) => setCropMargins(event.target.checked)} />
              </label>
              <div className="mt-4 flex items-center justify-between text-sm text-[#5f5850]">
                <span>ማጉላት</span>
                <span>{zoom}%</span>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full bg-transparent" onClick={() => setZoom(100)}>
                ማጉላት መልስ
              </Button>
            </div>
          )}

          <div className="flex flex-1 items-center justify-center overflow-auto bg-[#ebe8e1] p-5 md:p-10">
            <article className="relative flex w-fit max-w-full items-start justify-center overflow-auto rounded-sm bg-[#fffdfa] shadow-[0_16px_50px_rgba(55,46,35,0.12)]" aria-label={`ገጽ ${page}`}>
              {pdfError ? (
                <p className="p-10 text-sm text-[#7d2929]">የመጽሐፉ ገጽ ሊጫን አልቻለም።</p>
              ) : (
                <canvas ref={canvasRef} className="block max-w-full" aria-label={`የመጽሐፉ ገጽ ${page}`} />
              )}
            </article>
          </div>

          <footer className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-t border-[#dedbd3] bg-[#fbfaf7] px-5 py-3 md:px-10">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft />
              </Button>
              <div className="flex items-center gap-2 rounded-md border border-[#dedbd3] bg-white px-3 py-2 text-sm">
                <input
                  aria-label="Current page"
                  value={page}
                  onChange={(event) => setPage(Math.min(totalPages, Math.max(1, Number(event.target.value) || 1)))}
                  className="w-10 bg-transparent text-center outline-none"
                />
                <span className="text-[#a39c93]">/ {totalPages}</span>
              </div>
              <Button variant="outline" size="icon" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                <ChevronRight />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(75, value - 10))}><Minus /></Button>
              <span className="w-12 text-center text-xs text-[#777169]">{zoom}%</span>
              <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(125, value + 10))}><Plus /></Button>
              <Button variant="ghost" size="icon" aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
                {isFullscreen ? <Shrink /> : <Expand />}
              </Button>
            </div>
          </footer>
        </section>
      </div>

      {showAbout && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-[#24211e]/40 p-5" onClick={() => setShowAbout(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[#dedbd3] bg-[#fbfaf7] p-6 shadow-[0_20px_60px_rgba(55,46,35,0.2)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b938a]">ስለ መጽሐፉ</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold">ተስፈኛ ወጣት</h2>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close about" onClick={() => setShowAbout(false)}><X /></Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5f5850]">የይድረስ ለኢትዮጵያ ከተስፈኛው ወጣት የአማርኛ መጽሐፍ ዲጂታል ንባብ። አስራ ሦስት ምዕራፎች ያሉት ይህ እትም በመረብ ገጽ ለማንበብ ብቻ የተዘጋጀ ነው።</p>
            <p className="mt-3 text-xs leading-5 text-[#8c867e]">{totalPages} ገጾች · የተጠበቀ ንባብ</p>
          </div>
        </div>
      )}
    </main>
  )
}

function collectHits(texts: string[], needle: string): SearchHit[] {
  const results: SearchHit[] = []
  for (let pageNumber = 1; pageNumber < texts.length; pageNumber += 1) {
    const text = texts[pageNumber]
    if (!text) continue
    const index = text.indexOf(needle)
    if (index === -1) continue
    const start = Math.max(0, index - 24)
    const end = Math.min(text.length, index + needle.length + 48)
    results.push({ page: pageNumber, snippet: `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}` })
    if (results.length >= 20) break
  }
  return results
}

export default BookReader
