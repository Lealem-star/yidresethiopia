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
    return [{ source: '/favicon.ico', destination: '/icon.svg' }]
  },
}

export default nextConfig
