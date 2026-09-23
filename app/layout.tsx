import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ተስፈኛ ወጣት — የኔ ድርሻ',
  description: 'የኔ ድርሻ የአማርኛ መጽሐፍ ዲጂታል ንባብ።',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = { themeColor: '#8b2d2d', userScalable: false }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="am"><body>{children}</body></html>
}
