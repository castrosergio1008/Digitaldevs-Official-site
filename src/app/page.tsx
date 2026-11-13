import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import Stack from '@/components/Stack'
import Process from '@/components/Process'
import Portfolio from '@/components/Portfolio'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'
import CtaBanner from '@/components/CtaBanner'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main">
        <Hero />
        <Services />
        <Stack />
        <Process id="proceso" />
        <Portfolio />
        <Pricing id="precios" />
        <FAQ id="faq" />
        <Contact />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}