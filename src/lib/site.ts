export const site = {
  name: 'Digital-devs',
  tagline: 'Tu socio de crecimiento tecnológico: software, automatización y analítica.',
  url: 'https://digitaldevs.co',
  locale: 'es_CO',
  language: 'es',
  title: 'Digital-devs | Desarrollo de software y automatización',
  description:
    'Socio de crecimiento tecnológico para pymes: desarrollo de software a la medida, automatización de procesos y analítica. Sitios web, tiendas en línea y aplicaciones.',
  keywords: [
    'desarrollo de software a la medida',
    'automatización de procesos',
    'analítica',
    'socio de crecimiento tecnológico',
    'páginas web para pymes',
    'tiendas en línea',
    'aplicaciones web',
    'consultoría tecnológica para pymes',
    'Aguachica',
    'Cesar',
    'Colombia',
    'Latinoamérica',
    'Digital-devs',
  ] as string[],
  ogImage: '/og.png',
  ogTitle: 'Digital-devs | Software, automatización y analítica',
  ogDescription:
    'Tu socio de crecimiento tecnológico: software, automatización y analítica para pymes en Colombia y LATAM.',
  email: 'digitaldevscolombia@gmail.com',
  whatsapp: '+57 311 360 9710',
  whatsappBase: 'https://wa.me/573113609710',
  whatsappLink:
    'https://wa.me/573113609710?text=Hola%20Digital-devs%21%20Me%20interesa%20informaci%C3%B3n%20sobre%20sus%20servicios.%20%C2%BFC%C3%B3mo%20me%20cuentan%20m%C3%A1s%3F',
  city: 'Aguachica, Colombia',
  year: new Date().getFullYear(),
} as const

export const nav = [
  { href: '/servicios', label: 'Servicios' },
  { href: '#stack', label: 'Stack' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#portafolio', label: 'Portafolio' },
  { href: '#precios', label: 'Inversión' },
  { href: '#faq', label: 'FAQ' },
] as const

// Builds a WhatsApp deep link whose message already mentions the service, used
// by the per-service CTA banner.
export function serviceWhatsappLink(serviceTitle: string): string {
  const text = encodeURIComponent(`Hola Digital-devs! Me interesa el servicio "${serviceTitle}". ¿Me cuentan más?`)
  return `${site.whatsappBase}?text=${text}`
}