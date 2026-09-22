export const site = {
  name: 'Digitaldevs',
  tagline: 'Hacemos realidad tus ideas · Software a la medida · Remoto LATAM',
  email: 'digitaldevscolombia@gmail.com',
  whatsapp: '+57 311 360 9710',
  whatsappLink: 'https://wa.me/573113609710',
  github: 'https://github.com/castrosergio1008',
  githubHandle: 'github.com/castrosergio1008',
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