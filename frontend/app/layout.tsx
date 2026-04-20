import type { Metadata, Viewport } from 'next';
import { Inter, Sora, JetBrains_Mono } from 'next/font/google';

import Providers from '@/components/Providers';
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

/** Script inline para prevenir flash de tema incorreto na primeira carga */
const themeScript = `
(function() {
  try {
    var stored = JSON.parse(localStorage.getItem('bandeirantes-theme') || '{}');
    var theme = stored.state && stored.state.theme ? stored.state.theme : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

// Metadados
export const metadata: Metadata = {
  title: {
    default: 'Portal da Transparência | Bandeirantes MS',
    template: '%s | Bandeirantes MS',
  },
  description:
    'Portal da Transparência - Prefeitura Municipal de Bandeirantes MS. Acesse informações sobre receitas, despesas, licitações, obras e gestão pública.',
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
    url: 'https://bandeirantes-ms.gov.br',
    siteName: 'Portal da Transparência Bandeirantes',
    title: 'Portal da Transparência | Bandeirantes MS',
    description:
      'Portal da Transparência - Prefeitura Municipal de Bandeirantes MS. Acesse informações sobre receitas, despesas, licitações, obras e gestão pública.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Portal da Transparência Bandeirantes MS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal da Transparência | Bandeirantes MS',
    description:
      'Portal da Transparência - Prefeitura Municipal de Bandeirantes MS. Acesse informações sobre receitas, despesas, licitações, obras e gestão pública.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <Providers>
          <div className="min-h-screen bg-dark-950">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}