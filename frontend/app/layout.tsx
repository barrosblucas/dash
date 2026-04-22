import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

import Providers from '@/components/Providers';
import 'material-symbols/outlined.css';
import 'material-symbols/rounded.css';
import './globals.css';

/* ── Typography: Modern, Serene, Highly Legible ── */

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
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
    var theme = stored.state && stored.state.theme ? stored.state.theme : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch(e) {
    document.documentElement.classList.remove('dark');
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
    'Portal da Transparência — Prefeitura Municipal de Bandeirantes MS. Uma nova experiência de transparência pública, intuitiva e inovadora.',
  keywords: [
    'dashboard financeiro',
    'prefeitura',
    'bandeirantes',
    'mato grosso do sul',
    'receitas',
    'despesas',
    'orcamento municipal',
    'transparencia',
    'inovacao',
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
      'Uma nova experiência de transparência pública. Acesse informações detalhadas sobre a gestão da Prefeitura de Bandeirantes de forma simples e intuitiva.',
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
      'Uma nova experiência de transparência pública. Acesse informações detalhadas sobre a gestão da Prefeitura de Bandeirantes.',
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
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
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
        className={`${outfit.variable} ${jakarta.variable} ${jetbrainsMono.variable} font-body bg-surface text-on-surface antialiased transition-colors duration-500`}
      >
        <Providers>
          <div className="min-h-screen relative overflow-x-hidden selection:bg-secondary/20">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
