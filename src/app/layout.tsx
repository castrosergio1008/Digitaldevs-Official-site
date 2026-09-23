import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { site } from '@/lib/site'
import { faqs } from '@/lib/content'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://digitaldevs.co'),
  title: 'Digitaldevs | Sitio oficial — Software a la medida en LATAM',
  description:
    'Sitios web corporativos, tiendas en línea y aplicaciones a la medida. Del diseño al despliegue en producción. Desarrollo web full stack remoto desde Colombia.',
  keywords: [
    'desarrollo web',
    'software a la medida',
    'desarrollador full stack',
    'páginas web',
    'tiendas en línea',
    'e-commerce',
    'aplicaciones web',
    'Colombia',
    'Latinoamérica',
    'Digitaldevs',
  ],
  applicationName: site.name,
  authors: [{ name: 'Digitaldevs' }],
  creator: 'Digitaldevs',
  openGraph: {
    title: 'Digitaldevs | Sitio oficial',
    description:
      'Sitios web, tiendas en línea y aplicaciones a la medida. Del diseño al despliegue en producción, remoto en toda LATAM.',
    url: '/',
    siteName: site.name,
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Digitaldevs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digitaldevs | Sitio oficial',
    description:
      'Sitios web, tiendas en línea y aplicaciones a la medida. Del diseño al despliegue en producción.',
    images: ['/og.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t:'dark';document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://digitaldevs.co/#organization',
  name: site.name,
  alternateName: 'Digitaldevs Sitio Oficial',
  description:
    'Empresa de desarrollo de software a la medida: sitios web, tiendas en línea y aplicaciones web.',
  email: site.email,
  url: 'https://digitaldevs.co',
  logo: {
    '@type': 'ImageObject',
    url: 'https://digitaldevs.co/logo.png',
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
  url: 'https://digitaldevs.co',
  inLanguage: 'es-CO',
  description:
    'Desarrollo de software a la medida: sitios web corporativos, tiendas en línea, aplicaciones web y MVPs.',
  publisher: { '@id': 'https://digitaldevs.co/#organization' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-fg font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
        {children}
      </body>
    </html>
  )
}