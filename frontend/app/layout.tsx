import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';

import Providers from '@/components/Providers';
import 'material-symbols/outlined.css';
import 'material-symbols/rounded.css';
import './globals.css';

/* ── Typography: Editorial Voice ── */

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

/* ── Anti-FOIT theme script ── */
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

/* ── Metadata ── */
export const metadata: Metadata = {
  title: {
    default: 'Portal da Transparência | Bandeirantes MS',
    template: '%s | Bandeirantes MS',
  },
  description:
    'Portal da Transparência — Prefeitura Municipal de Bandeirantes MS. Acesse informações sobre receitas, despesas, licitações, obras e gestão pública.',
  keywords: [
    'dashboard financeiro',
    'prefeitura',
    'bandeirantes',
    'mato grosso do sul',
    'receitas',
    'despesas',
    'orcamento municipal',
    'transparencia',
  ],
  authors: [{ name: 'Prefeitura de Bandeirantes' }],
  creator: 'Prefeitura de Bandeirantes',
  publisher: 'Prefeitura de Bandeirantes',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://bandeirantes-ms.gov.br',
    siteName: 'Portal da Transparencia Bandeirantes',
    title: 'Portal da Transparencia | Bandeirantes MS',
    description:
      'Portal da Transparencia — Prefeitura Municipal de Bandeirantes MS. Acesse informacoes sobre receitas, despesas, licitacoes, obras e gestao publica.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Portal da Transparencia Bandeirantes MS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal da Transparencia | Bandeirantes MS',
    description:
      'Portal da Transparencia — Prefeitura Municipal de Bandeirantes MS. Acesse informacoes sobre receitas, despesas, licitacoes, obras e gestao publica.',
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
    { media: '(prefers-color-scheme: light)', color: '#f8f9ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
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
        className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} font-body`}
      >
        <Providers>
          <div className="min-h-screen bg-surface transition-colors duration-300">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
