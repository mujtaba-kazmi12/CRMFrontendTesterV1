import { Metadata } from 'next';
import PricingPage from '@/pages/PricingPage';

export const metadata: Metadata = {
  title: 'Plans Tarifaires - Handicap International',
  description: 'Choisissez le plan parfait pour vos besoins de publication d\'articles invités. Tous les plans incluent l\'accès à notre réseau de sites web allemands.',
};

export default function Pricing() {
  return <PricingPage />;
} 