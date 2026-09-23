/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pdfjs-dist'],
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/yidres_leethiopia_book_cover.png' }]
  },
}

export default nextConfig
