'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  TrendingUp,
  Globe,
  Building2,
  LineChart,
  Wallet,
  Users,
  Lock,
  ArrowRight,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

export default function LandingClient() {
  const { data: session } = useSession() || {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header - BlackRock Style */}
      <header className="bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
              <Image
                src="/logo.png"
                alt="German Lion S.A."
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-white text-base sm:text-xl font-semibold tracking-tight">German Lion S.A.</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#services" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Dienstleistungen
            </Link>
            <Link href="#about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Über uns
            </Link>
            <Link href="#contact" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Kontakt
            </Link>
            <Link href={session ? "/dashboard" : "/login"}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6">
                Anmelden
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-t border-zinc-800">
            <div className="px-4 py-4 space-y-3">
              <Link href="#services" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-2">
                Dienstleistungen
              </Link>
              <Link href="#about" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-2">
                Über uns
              </Link>
              <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white text-sm font-medium py-2">
                Kontakt
              </Link>
              <Link href={session ? "/dashboard" : "/login"} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold mt-2">
                  Anmelden
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Professional Financial Style */}
      <section className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="max-w-4xl">
            <p className="text-amber-500 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3 sm:mb-4">
              Luxembourg Financial Structure
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-8 leading-tight tracking-tight">
              Ihr strategischer Partner in der Welt der Hochfinanz
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg leading-relaxed mb-6 sm:mb-8">
              German Lion S.A. ist eine Elite-Luxemburger Finanzstruktur (SPV), die den tadellosen Ruf eines europäischen Finanzzentrums mit der Stärke des deutschen Marktes verbindet und einzigartige Möglichkeiten für Kapitalisierung und Vermögensverwaltung schafft.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href={session ? '/dashboard' : '/signup'} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base">
                  Anmelden
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="#services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white border-white text-black hover:bg-gray-100 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base">
                  Mehr erfahren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - White Background */}
      <section className="py-10 sm:py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">2021</div>
              <div className="text-gray-600 text-xs sm:text-sm uppercase tracking-wider">Gegründet</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">EU</div>
              <div className="text-gray-600 text-xs sm:text-sm uppercase tracking-wider">Reguliert</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">24/7</div>
              <div className="text-gray-600 text-xs sm:text-sm uppercase tracking-wider">Trading</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-black mb-1 sm:mb-2">100%</div>
              <div className="text-gray-600 text-xs sm:text-sm uppercase tracking-wider">Sicherheit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - White Background */}
      <section id="about" className="py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 sm:mb-12">
            <p className="text-amber-600 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-2 sm:mb-3">Warum uns wählen</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-3 sm:mb-4">
              Der Name &quot;German Lion&quot; ist ein Symbol für Stabilität
            </h2>
            <p className="text-gray-600 max-w-2xl text-sm sm:text-base">
              Heraldische Stärke in der Finanzwelt, kombiniert mit deutscher Präzision und luxemburgischer Expertise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="border-l-2 border-amber-500 pl-4 sm:pl-6">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Fundamentale Zuverlässigkeit</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Unser Schlüsselpartner und Asset-Initiator ist ING-DiBa AG, was höchste Portfolioqualität und Transparenz bei jedem Vorgang garantiert.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 sm:pl-6">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Vollständiges Anlage-Spektrum</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Zugang zu Vermögenswerten, die zuvor nur großen institutionellen Akteuren zur Verfügung standen: Wertpapiere, Aktien, Kryptoassets.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 sm:pl-6">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Trading Terminal</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Unsere Kunden erhalten Zugang zu einem eigenen Trading Terminal für Schnelligkeit, Präzision und Unabhängigkeit.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 sm:pl-6">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Flexible Lösungen</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Individuelle Bedingungen: Festgeld für garantierte Rendite oder variable Einlagen für aktive Investoren.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-4 sm:pl-6">
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2 sm:mb-3">Globales Netzwerk</h3>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Dank eines breiten Netzwerks von Bankpartnern zeigen wir außergewöhnliche Flexibilität und Anpassungsfähigkeit.
              </p>
            </div>

            <div className="border-l-2 border-amber-500 pl-6">
              <h3 className="text-lg font-semibold text-black mb-3">Luxemburger Sicherheit</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Maximaler Schutz der Kundeninteressen nach höchsten europäischen Standards (RCS B255534).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Black Background */}
      <section id="services" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-3">Dienstleistungen</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Unsere Anlageprodukte
            </h2>
            <p className="text-gray-400 max-w-2xl">
              Wir transformieren komplexe Marktmechanismen in verständliche und profitable Lösungen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 p-6 rounded-sm">
              <TrendingUp className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Wertpapiere & Aktien</h3>
              <p className="text-gray-400 text-sm">Direkter Zugang zu den weltweiten Aktienmärkten mit professioneller Analyse.</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-sm">
              <Globe className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Kryptoassets</h3>
              <p className="text-gray-400 text-sm">Moderne Lösungen zur Portfolio-Diversifizierung in der digitalen Wirtschaft.</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-sm">
              <Shield className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Verbriefung (ABS/RMBS)</h3>
              <p className="text-gray-400 text-sm">Investieren in forderungsbesicherte Anleihen mit hohem Schutz.</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-sm">
              <Wallet className="h-8 w-8 text-amber-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Festgeld & Einlagen</h3>
              <p className="text-gray-400 text-sm">Flexible Lösungen für garantierte oder variable Renditen.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info Section - White Background */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Registry Data */}
            <div>
              <p className="text-amber-600 text-sm font-semibold uppercase tracking-wider mb-3">Unternehmensdaten</p>
              <h2 className="text-3xl font-bold text-black mb-8">Handelsregister</h2>
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-500 text-sm mb-1">Firmenname</p>
                  <p className="text-black font-medium">German Lion S.A.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-500 text-sm mb-1">RCS (Registre de Commerce et des Sociétés)</p>
                  <p className="text-black font-medium">B255534</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-gray-500 text-sm mb-1">LEI (Legal Entity Identifier)</p>
                  <p className="text-black font-medium">549300OKUMPRCLI67188</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">EUID</p>
                  <p className="text-black font-medium">LURCSL.B255534</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <p className="text-amber-600 text-sm font-semibold uppercase tracking-wider mb-3">Kontakt</p>
              <h2 className="text-3xl font-bold text-black mb-8">Erreichen Sie uns</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Adresse</p>
                    <p className="text-black">22-24, Boulevard Royal</p>
                    <p className="text-black">L-2449 Luxembourg</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-sm mb-1">E-Mail</p>
                    <p className="text-black">official@german-lion-sa.eu</p>
                    <p className="text-black">support@german-lion-sa.eu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Black Background */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-amber-500 text-sm font-semibold uppercase tracking-wider mb-4">Bereit zu starten?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ihr Erfolg beginnt hier
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              German Lion S.A. ist nicht nur ein Unternehmen, sondern ein Instrument zur Gestaltung Ihrer finanziellen Zukunft. Schließen Sie sich dem Kreis ausgewählter Investoren an.
            </p>
            <Link href={session ? '/dashboard' : '/signup'}>
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 h-12">
                Anmelden
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
// Mobile responsive update Fri Feb  6 17:58:48 UTC 2026
