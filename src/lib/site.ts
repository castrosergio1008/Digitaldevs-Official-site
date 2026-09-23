export const site = {
  name: 'Digitaldevs',
  tagline: 'Hacemos realidad tus ideas · Software a la medida · Remoto LATAM',
  url: 'https://digitaldevs.co',
  locale: 'es_CO',
  language: 'es',
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
  ] as string[],
  ogImage: '/og.png',
  ogTitle: 'Digitaldevs | Sitio oficial',
  ogDescription:
    'Sitios web, tiendas en línea y aplicaciones a la medida. Del diseño al despliegue en producción, remoto en toda LATAM.',
  email: 'digitaldevscolombia@gmail.com',
  whatsapp: '+57 311 360 9710',
  whatsappBase: 'https://wa.me/573113609710',
  whatsappLink:
    'https://wa.me/573113609710?text=Hola%21%20Los%20contact%C3%A9%20desde%20Google%20Maps.%20Me%20interesa%20informaci%C3%B3n%20sobre%20sus%20servicios%20de%20desarrollo%20web.',
  city: 'Aguachica, Colombia',
  year: new Date().getFullYear(),
} as const

export const nav = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#stack', label: 'Stack' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#portafolio', label: 'Portafolio' },
  { href: '#precios', label: 'Inversión' },
  { href: '#faq', label: 'FAQ' },
] as const