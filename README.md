# Digitaldevs — Sitio web corporativo

Sitio de una página para promocionar **Digitaldevs**, empresa de desarrollo de software a la medida
(sitios web, e-commerce, aplicaciones web, MVPs y soporte).

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4** (sistema de tema dark-first con toggle a claro)
- **lucide-react** (iconos)
- Fonts: Inter + JetBrains Mono (next/font)

## Estructura

```
src/
  app/
    layout.tsx      # metadata, JSON-LD, fuentes, script de tema
    page.tsx        # landing de una página
    globals.css     # tokens de color dark/light, animaciones
    icon.png        # favicon (isotipo)
    sitemap.ts      # SEO
    robots.ts       # SEO
  components/       # Header, Hero, Terminal, TrustBar, Services, Stack,
                    # Process, Portfolio, Pricing, FAQ, Contact, CTA, Footer,
                    # ThemeToggle, Reveal
  lib/
    site.ts         # datos de contacto de la empresa
    content.ts      # servicios, stack, proceso, portafolio, modelos, FAQ
public/
  logo.png          # marca (fondo navy) para header/footer
  isotipo.png       # símbolo con transparencia
  og.png            # imagen para compartir en redes
```

## Comandos

```bash
npm install
npm run dev       # desarrollo en http://localhost:3000
npm run build     # build de producción
npm start         # sirve el build
npm run lint      # ESLint
```

## Personalización rápida

- **Contacto / datos de la empresa**: edita `src/lib/site.ts`.
- **Servicios, stack, portafolio, precios y FAQ**: edita `src/lib/content.ts`.
- **Colores y tema**: edita las variables en `src/app/globals.css`.
- **Dominio/URL canónica**: reemplaza `https://digitaldevs.co` en `layout.tsx`, `sitemap.ts` y `robots.ts`.

## Despliegue

Pensado para **Vercel** (conecta el repo y despliega). Ajusta el dominio real en las URLs canónicas
antes de publicar.