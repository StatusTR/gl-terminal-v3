import { Metadata } from 'next';
import LandingClient from './landing-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'German Lion S.A. - Ihr strategischer Partner in der Welt der Hochfinanz',
  description: 'German Lion S.A. ist eine Elite-Luxemburger Finanzstruktur (SPV), die einzigartige Möglichkeiten für Kapitalisierung und Vermögensverwaltung bietet.',
};

export default function HomePage() {
  return <LandingClient />;
}
