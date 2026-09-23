export type ServiceKey = 'web' | 'ecommerce' | 'apps' | 'mvp' | 'pwa' | 'support'

export type Service = {
  key: ServiceKey
  title: string
  description: string
  points: string[]
}

export const services: Service[] = [
  {
    key: 'web',
    title: 'Sitios web corporativos y landing pages',
    description: 'Páginas rápidas, modernas y orientadas a convertir visitantes en clientes. Diseño mobile-first y optimizadas para buscadores.',
    points: ['Landing pages de alta conversión', 'Sitios institucionales para empresas y organizaciones', 'SEO técnico y metas optimizadas'],
  },
  {
    key: 'ecommerce',
    title: 'Tiendas en línea y e-commerce',
    description: 'Catálogos y pasarelas de pago integradas para vender 24/7 con una experiencia compra ágil y segura.',
    points: ['Catálogo de productos y carrito', 'Pagos con Mercado Pago, PayU y más', 'Panel de administración de pedidos'],
  },
  {
    key: 'apps',
    title: 'Aplicaciones web a medida',
    description: 'Sistemas web desarrollados sobre tu proceso de negocio: paneles, CRMs, inventarios, control de gestión y más.',
    points: ['Paneles de administración y dashboards', 'Módulos de gestión a la medida', 'Base de datos, API y autenticación segura'],
  },
  {
    key: 'mvp',
    title: 'MVPs para startups y SaaS',
    description: 'De la idea a una primera versión funcional en semanas, para validar tu producto con usuarios reales antes de escalar.',
    points: ['Prototipo y arquitectura definidos al inicio', 'Iteraciones rápidas y costo eficiente', 'Listo para crecer con tu negocio'],
  },
  {
    key: 'pwa',
    title: 'Progressive Web Apps (PWA)',
    description: 'Tu aplicación como una app móvil: instalable, con notificaciones y funcionando sin conexión, sin pasar por las tiendas.',
    points: ['Instalable en móvil y escritorio', 'Modo offline y carga instantánea', 'Notificaciones push'],
  },
  {
    key: 'support',
    title: 'Soporte, mantenimiento y evolución',
    description: 'Tu web siempre al día: mejoras continuas, corrección de errores, seguridad, respaldos y acompañamiento cercano.',
    points: ['Mantenimiento preventivo y correctivo', 'Mejoras y nuevas funcionalidades', 'Monitoreo, respaldo y seguridad'],
  },
]

export type StackIconKey = 'code' | 'server' | 'database' | 'rocket'

export type StackGroup = { name: string; icon: StackIconKey; items: string[] }

export const stack: StackGroup[] = [
  { name: 'Frontend', icon: 'code', items: ['React', 'Next.js', 'Tailwind CSS', 'Vite', 'TypeScript', 'HTML5', 'CSS3'] },
  { name: 'Backend', icon: 'server', items: ['Node.js', 'Express', 'Python', 'PHP', 'REST APIs'] },
  { name: 'Datos', icon: 'database', items: ['MongoDB', 'Mongoose', 'SQLite', 'SQL'] },
  { name: 'Infra y calidad', icon: 'rocket', items: ['Git', 'GitHub', 'Docker', 'Vercel', 'JWT', 'Swagger'] },
]

export type ProcessStep = { step: string; title: string; description: string }

export const process: ProcessStep[] = [
  { step: '01', title: 'Diagnóstico y alcance', description: 'Entendemos tu objetivo, definimos el alcance, el presupuesto y un plan claro con fechas reales.' },
  { step: '02', title: 'Diseño UI/UX', description: 'Diseñamos la experiencia y la interfaz con foco en tu usuario final y en la conversión.' },
  { step: '03', title: 'Desarrollo e integraciones', description: 'Construimos con tecnologías modernas, APIs, bases de datos y pruebas de calidad.' },
  { step: '04', title: 'Despliegue y soporte', description: 'Publicamos en producción, configuramos dominio y seguridad, y te acompañamos en el día a día.' },
]

export type ProjectKey = 'saasify' | 'taskmanager' | 'dashboard' | 'portfolio'

export type Project = {
  key: ProjectKey
  title: string
  tag: string
  type: string
  url: string
  description: string
  tech: string[]
}

export const projects: Project[] = [
  {
    key: 'saasify',
    title: 'SaaSify',
    tag: 'Landing',
    type: 'Landing page',
    url: 'https://saasify-landing-mu.vercel.app/',
    description: 'Landing page responsiva optimizada para conversión con hero, features, pricing y testimonios.',
    tech: ['React', 'Tailwind CSS', 'Vite'],
  },
  {
    key: 'taskmanager',
    title: 'Task Manager API',
    tag: 'Backend',
    type: 'REST API',
    url: 'https://task-manager-api-tau-roan.vercel.app/',
    description: 'API completa de gestión de tareas con autenticación JWT, CRUD, paginación y documentación Swagger.',
    tech: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Swagger'],
  },
  {
    key: 'dashboard',
    title: 'Admin Dashboard',
    tag: 'Dashboard',
    type: 'Panel de administración',
    url: 'https://dashboard-admin-mu-beige.vercel.app/',
    description: 'Panel con gráficos interactivos de rendimiento, gestión de tareas y diseño completamente responsivo.',
    tech: ['React', 'Recharts', 'Context API'],
  },
  {
    key: 'portfolio',
    title: 'Portfolio Personal',
    tag: 'Portfolio',
    type: 'Sitio personal',
    url: 'https://portafolio-ten-zeta-22.vercel.app/',
    description: 'Sitio portfolio en tema oscuro con skills, sección de proyectos y formulario de contacto. 100% responsive.',
    tech: ['React', 'Tailwind CSS', 'Vite'],
  },
]

export type PricingModel = { name: string; ideal: string; items: string[]; badge?: string }

export const pricing: PricingModel[] = [
  {
    name: 'Proyecto cerrado',
    ideal: 'Ideal para sitios web y desarrollos con alcance definido: precio fijo por fases.',
    items: ['Alcance y entregables definidos', 'Pago por hitos', 'Entrega en fechas comprometidas'],
    badge: 'Más popular',
  },
  {
    name: 'Por hora',
    ideal: 'Ideal para tareas puntuales, correcciones o desarrollo continuo sin alcance fijo.',
    items: ['Flexibilidad total', 'Tarifa transparente', 'Ideal para ajustes y features puntuales'],
  },
  {
    name: 'Retainer mensual',
    ideal: 'Ideal para el mantenimiento y la evolución constante de tu producto.',
    items: ['Soporte prioritario', 'Mejoras y nuevas funciones cada mes', 'Monitoreo, respaldo y seguridad'],
  },
]

export type Faq = { q: string; a: string }

export const faqs: Faq[] = [
  {
    q: '¿Cuánto cuesta un sitio web o una aplicación a la medida?',
    a: 'Depende del alcance. Un sitio corporativo o una landing parte de niveles accesibles para Pymes; una tienda en línea o una aplicación a medida se cotizan según módulos. Al contactarnos recibes una propuesta cerrada con fechas y precios por fases.',
  },
  {
    q: '¿Cuánto tiempo tarda un desarrollo?',
    a: 'Una landing o sitio corporativo puede estar listo en 1 a 3 semanas. Las tiendas en línea y aplicaciones a medida van de 4 a 10 semanas según los módulos. Siempre definimos un cronograma con fechas reales desde el inicio.',
  },
  {
    q: '¿Qué pasa con el mantenimiento después de lanzar?',
    a: 'Incluimos un periodo de acompañamiento y también ofrecemos planes de retainer mensual con soporte prioritario, mejoras continuas, respaldos y monitoreo para que tu web nunca se quede atrás.',
  },
  {
    q: '¿Puedo adaptar mi idea a cualquier tecnología?',
    a: 'Sí. Nos adaptamos a la tecnología que mejor le convenga a tu negocio y también podemos migrar proyectos con stack existente sin partir de cero.',
  },
  {
    q: '¿Trabajas de forma remota?',
    a: 'Sí, el desarrollo es 100% remoto desde Colombia hacia toda Latinoamérica: reportes constantes, comunicación directa por WhatsApp o email y entregas verificables en cada fase.',
  },
  {
    q: '¿Qué información necesitas para cotizar mi proyecto?',
    a: 'Con que nos cuentes tu idea, los objetivos y una referencia de tiempo o presupuesto basta. Con eso preparamos una propuesta detallada con alcance, entregables e inversión.',
  },
]