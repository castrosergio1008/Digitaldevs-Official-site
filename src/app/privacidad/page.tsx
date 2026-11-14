import type { Metadata } from 'next'
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Digital-devs',
  description:
    'Política de tratamiento de datos personales de Digital-devs, conforme a la Ley 1581 de 2012 (habeas data). Qué datos recogemos, para qué los usamos y cómo ejercer tus derechos.',
  alternates: { canonical: '/privacidad' },
  openGraph: {
    title: 'Política de Privacidad | Digital-devs',
    description:
      'Conoce cómo Digital-devs recoge, usa y protege tus datos personales, y cómo ejercer tus derechos de acceso, rectificación, supresión y oposición.',
    url: '/privacidad',
    type: 'website',
  },
}

const LAST_UPDATED = '14 de noviembre de 2026'

/**
 * Privacy policy page. The copy reflects the current data practices of
 * Digital-devs; periodic legal review is recommended.
 */
export default function PrivacidadPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main">
        <section className="relative overflow-hidden border-b border-edge bg-soft/40">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
            <Breadcrumb
              items={[{ label: 'Inicio', href: '/' }, { label: 'Política de privacidad' }]}
            />
            <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Política de Privacidad y Tratamiento de Datos Personales
            </h1>
            <p className="mt-4 max-w-2xl text-muted">
              Conforme a la Ley 1581 de 2012 (habeas data) y sus decretos reglamentarios, esta
              política describe cómo Digital-devs recoge, usa y protege la información personal de
              los visitantes de este sitio web.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold text-fg">1. Responsable del tratamiento</h2>
              <p className="mt-3 leading-relaxed text-muted">
                <strong className="font-semibold text-fg">Digital-devs</strong> es el responsable
                del tratamiento de los datos personales recogidos a través de este sitio web.
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  Aguachica, Cesar, Colombia.
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a
                    href={`mailto:${site.email}`}
                    className="underline underline-offset-2 transition-colors hover:text-fg"
                  >
                    {site.email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <a
                    href={site.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 transition-colors hover:text-fg"
                  >
                    {site.whatsapp}
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">2. Datos personales que se recogen</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>Nombre.</li>
                <li>Número de WhatsApp o correo electrónico.</li>
                <li>Contenido de la conversación mantenida con el asistente virtual.</li>
                <li>
                  Datos técnicos (dirección IP, navegador y dispositivo) de forma temporal para el
                  funcionamiento y la seguridad del sitio.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                El sitio no utiliza cookies de seguimiento ni crea perfiles de usuario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">3. Finalidad del tratamiento</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  Atender las consultas y solicitudes enviadas por el chat o el formulario de
                  contacto.
                </li>
                <li>
                  Contactar al titular con fines comerciales cuando él mismo lo solicita, por
                  ejemplo al agendar una llamada o dejar sus datos en el chat.
                </li>
                <li>Mejorar el servicio y la calidad de las respuestas del asistente virtual.</li>
                <li>Cumplir las obligaciones legales y de seguridad aplicables.</li>
              </ul>
              <p className="mt-3 text-muted">
                Los datos personales no se utilizan con fines de publicidad automatizada ni se
                venden a terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">4. Base legal y autorización</h2>
              <p className="mt-3 leading-relaxed text-muted">
                El tratamiento se fundamenta en el consentimiento del titular al enviar sus datos a
                través del chat, del formulario de contacto o de WhatsApp; en el interés legítimo de
                Digital-devs para garantizar la seguridad del sitio; y en las obligaciones legales
                aplicables.
              </p>
              <p className="mt-3 text-muted">
                El titular puede retirar su consentimiento en cualquier momento escribiendo a{' '}
                <a
                  href={`mailto:${site.email}`}
                  className="underline underline-offset-2 transition-colors hover:text-fg"
                >
                  {site.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">5. Transferencia internacional de datos</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Para poder prestar el servicio, Digital-devs utiliza los siguientes proveedores, que
                pueden operar fuera de Colombia:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong className="font-semibold text-fg">OpenCode Go</strong>, para el
                  procesamiento de la conversación con el asistente virtual (inteligencia artificial).
                  Los datos de contacto escritos en el chat se redactan antes de llegar a este
                  proveedor.
                </li>
                <li>
                  <strong className="font-semibold text-fg">WhatsApp / Meta</strong>, para el
                  contacto comercial con el titular.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Vercel</strong>, para el alojamiento del
                  sitio web y el procesamiento de las solicitudes.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Supabase</strong>, para el almacenamiento
                  de los leads (nombre y contacto) y los eventos anónimos del chat.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Gmail / Google</strong>, para el envío de
                  las notificaciones de nuevos leads al equipo.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                Estos proveedores cuentan con sus propias políticas de privacidad. No se realizan
                transferencias adicionales sin una base legal que lo permita.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">
                6. Derechos del titular (AARCO) y canales para ejercerlos
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                Como titular de los datos personales, tienes derecho a:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>
                  <strong className="font-semibold text-fg">Acceso:</strong> conocer los datos
                  personales que son objeto de tratamiento.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Rectificación:</strong> solicitar la
                  corrección de datos inexactos o incompletos.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Supresión:</strong> solicitar la
                  eliminación de tus datos cuando no sean necesarios.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Oposición:</strong> oponerte al
                  tratamiento en las condiciones previstas en la ley.
                </li>
                <li>
                  <strong className="font-semibold text-fg">Revocación:</strong> retirar el
                  consentimiento otorgado en cualquier momento.
                </li>
              </ul>
              <p className="mt-3 leading-relaxed text-muted">
                Para ejercer estos derechos, envía una solicitud con tu nombre y el derecho que
                deseas ejercer a{' '}
                <a
                  href={`mailto:${site.email}`}
                  className="underline underline-offset-2 transition-colors hover:text-fg"
                >
                  {site.email}
                </a>{' '}
                o al WhatsApp{' '}
                <a
                  href={site.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-fg"
                >
                  {site.whatsapp}
                </a>
                . Las peticiones se atenderán en los términos previstos en la Ley 1581 de 2012 y el
                Decreto 1377 de 2013.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">7. Retención de los datos</h2>
              <p className="mt-3 leading-relaxed text-muted">
                El historial de la conversación se guarda únicamente en el navegador del visitante
                (localStorage) y no en servidores de Digital-devs. Puedes eliminarlo en cualquier
                momento con la función «Borrar conversación» del chat o borrando los datos del
                navegador.
              </p>
              <p className="mt-3 text-muted">
                El nombre y el contacto se utilizan para contactar al titular y se almacenan en
                nuestra base de datos (<strong className="font-semibold text-fg">Supabase</strong>,
                PostgreSQL) para gestionar la solicitud. Se conservan durante{' '}
                <strong className="font-semibold text-fg">12 meses</strong> desde su captura, o
                hasta que el titular solicite su eliminación. Los eventos anónimos del chat (sin
                datos personales) se conservan durante 90 días. Puedes ejercer tus derechos AARCO
                (acceso, rectificación, supresión y oposición) escribiendo a{' '}
                <a
                  href={`mailto:${site.email}`}
                  className="underline underline-offset-2 transition-colors hover:text-fg"
                >
                  {site.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">8. Medidas de seguridad</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                <li>Transmisión cifrada mediante HTTPS.</li>
                <li>Acceso restringido a la información por parte del responsable.</li>
                <li>Minimización de datos: solo se recoge lo indispensable.</li>
                <li>Redacción de los datos de contacto antes de enviar la conversación al proveedor de IA.</li>
                <li>Sin registro de datos personales en los logs del chat.</li>
              </ul>
              <p className="mt-3 text-muted">
                Aunque ninguna medida es infalible, Digital-devs aplica controles razonables para
                proteger la información personal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-fg">9. Fecha de última actualización</h2>
              <p className="mt-3 text-muted">{LAST_UPDATED}.</p>
              <p className="mt-3 text-muted">
                Digital-devs puede actualizar esta política para reflejar cambios en el servicio o
                en la normativa aplicable. La versión vigente estará siempre disponible en esta
                página.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
