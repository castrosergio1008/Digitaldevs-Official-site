import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { site } from '@/lib/site'
import { faqs } from '@/lib/content'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  keywords: site.keywords,
  applicationName: site.name,
  authors: [{ name: 'Digitaldevs' }],
  creator: 'Digitaldevs',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: site.ogTitle,
    description: site.ogDescription,
    url: '/',
    siteName: site.name,
    locale: site.locale,
    type: 'website',
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: 'Digitaldevs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: site.ogTitle,
    description: site.ogDescription,
    images: [site.ogImage],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#07091f' },
    { media: '(prefers-color-scheme: light)', color: '#f7f8fc' },
  ],
  colorScheme: 'dark light',
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t:'dark';document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: site.name,
  alternateName: 'Digitaldevs Sitio Oficial',
  description:
    'Empresa de desarrollo de software a la medida: sitios web, tiendas en línea y aplicaciones web.',
  email: site.email,
  url: site.url,
  logo: {
    '@type': 'ImageObject',
    url: `${site.url}/logo.png`,
  },
  areaServed: 'LATAM',
  address: { '@type': 'PostalAddress', addressLocality: 'Aguachica', addressRegion: 'Cesar', addressCountry: 'CO' },
}

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  alternateName: 'Sitio oficial de Digitaldevs',
  url: site.url,
  inLanguage: site.locale.replace('_', '-'),
  description:
    'Desarrollo de software a la medida: sitios web corporativos, tiendas en línea, aplicaciones web y MVPs.',
  publisher: { '@id': `${site.url}/#organization` },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.language} data-theme="dark" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-fg font-sans antialiased">
        <a href="#inicio" className="skip-link">
          Saltar al contenido
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
        {children}
      </body>
    </html>
  )
}