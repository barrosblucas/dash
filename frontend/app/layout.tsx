import type { Metadata } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Fontes
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

// Metadados
export const metadata: Metadata = {
  title: {
    default: 'Dashboard Financeiro | Bandeirantes MS',
    template: '%s | Bandeirantes MS',
  },
  description:
    'Dashboard Financeiro Municipal - Prefeitura de Bandeirantes MS. Visualize receitas, despesas e previsões orçamentárias de 2016 a 2026.',
  keywords: [
    'dashboard financeiro',
    'prefeitura',
    'bandeirantes',
    'mato grosso do sul',
    'receitas',
    'despesas',
    'orçamento municipal',
    'transparência',
  ],
  authors: [{ name: 'Prefeitura de Bandeirantes' }],
  creator: 'Prefeitura de Bandeirantes',
  publisher: 'Prefeitura de Bandeirantes',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://bandeirantes-ms.gov.br/dashboard',
    siteName: 'Dashboard Financeiro Bandeirantes',
    title: 'Dashboard Financeiro | Bandeirantes MS',
    description:
      'Visualize receitas, despesas e previsões orçamentárias do município de Bandeirantes MS.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dashboard Financeiro Bandeirantes MS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard Financeiro | Bandeirantes MS',
    description:
      'Visualize receitas, despesas e previsões orçamentárias do município de Bandeirantes MS.',
    images: ['/og-image.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <div className="min-h-screen bg-dark-950">
          {children}
        </div>
      </body>
    </html>
  );
}