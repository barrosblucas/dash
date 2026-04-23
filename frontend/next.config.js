/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Otimização de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Proxy reverso: all /api/v1/* calls go through the Next.js server
  // to eliminate cross-origin requests from the browser (CORS issues).
  // The browser never contacts the backend directly — the Next.js server
  // forwards the request server-side, just like /api/auth/* does for identity.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },

  // Otimizações experimentais
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'd3',
      'framer-motion',
    ],
  },

  // Variáveis de ambiente públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'Dashboard Financeiro Bandeirantes',
    NEXT_PUBLIC_MUNICIPIO: 'Bandeirantes - MS',
  },
};

module.exports = nextConfig;