'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { PurchaseModal } from '../components/ui/PurchaseModal';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    title: string;
    description: string;
    price: number;
    credits: number;
    subscriptionType: string;
  } | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePlanSelection = (planName: string, price: number) => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login with return URL to pricing page
      router.push('/login?returnUrl=/pricing');
      return;
    }

    // Check if user has USER role (only USER role can buy)
    if (user.role !== 'USER') {
      alert('Seuls les utilisateurs avec le rôle USER peuvent acheter des plans. Veuillez contacter le support si vous devez changer votre rôle.');
      return;
    }

    // User is logged in and has USER role, proceed with purchase
    handlePurchase(planName, price);
  };

  const handlePurchase = (planName: string, price: number) => {
    // Create package info for the modal
    const packageInfo = {
      title: `Plan ${planName}`,
      description: `Abonnement mensuel pour le plan ${planName}`,
      price: price,
      credits: price, // Using price as credits for now, you can adjust this logic
      subscriptionType: planName.toLowerCase(), // Add subscription type for API call
    };

    setSelectedPackage(packageInfo);
    setModalOpen(true);
  };

  const plans = [
    {
      name: 'Basique',
      icon: '🔥',
      description: 'Parfait pour les particuliers et les petites entreprises qui débutent.',
      monthlyPrice: 99,
      annualPrice: 89,
      features: [
        { name: '1 Article', included: true },
        { name: 'Sites web basiques (DA 20-30)', included: true },
        { name: 'Révision du contenu', included: true },
        { name: 'Support par email', included: true },
        { name: 'Optimisation du contenu', included: false },
        { name: 'Placement prioritaire', included: false },
        { name: 'Gestionnaire de compte dédié', included: false },
      ],
      buttonText: 'Commencer',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Standard',
      icon: '⭐',
      description: 'Notre plan le plus populaire pour les entreprises en croissance et les marketeurs.',
      monthlyPrice: 190,
      annualPrice: 224,
      features: [
        { name: '3 Articles', included: true },
        { name: 'Révision et édition du contenu', included: true },
        { name: 'Analyses avancées', included: true },
        { name: 'Support email prioritaire', included: true },
        { name: 'Optimisation du contenu', included: true },
        { name: 'Placement prioritaire', included: false },
        { name: 'Gestionnaire de compte dédié', included: false },
      ],
      buttonText: 'Commencer',
      buttonVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'Premium',
      icon: '⚡',
      description: 'Pour les entreprises recherchant un impact maximal et des placements premium.',
      monthlyPrice: 499,
      annualPrice: 449,
      features: [
        { name: '10 Articles', included: true },
        { name: 'Création de contenu professionnel', included: true },
        { name: 'Analyses complètes', included: true },
        { name: 'Support prioritaire 24/7', included: true },
        { name: 'Optimisation du contenu', included: true },
        { name: 'Placement prioritaire', included: true },
        { name: 'Gestionnaire de compte dédié', included: true },
      ],
      buttonText: 'Commencer',
      buttonVariant: 'outline' as const,
    },
  ];

  const enterpriseFeatures = [
    'Nombre personnalisé d\'articles invités',
    'Accès à des sites web exclusifs de haute autorité',
    'Gestionnaire de compte dédié et équipe de contenu',
    'Rapports et analyses personnalisés',
  ];

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-900">
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-2 md:px-0">
          {/* Header */}
          <header className="mb-4 border-b pb-4 text-center relative">
            {/* Login/User Info - Top Right */}
            <div className="absolute top-2 right-1">
              {user ? (
                <div className="flex items-center gap-4">
                 
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                  >
                    Tableau de bord
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => router.push('/login')}
                  className="bg-black hover:bg-gray-50 text-gray-700 font-bold border-gray-300 text-white"
                >
                  Se connecter
                </Button>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
            <Link href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
                Handicap International
              </Link>
            </h1>
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              {mounted ? new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : ''}
            </div>
          </header>

          {/* User Role Notice */}
          {user && user.role !== 'USER' && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-center">
                <strong>Note :</strong> Seuls les utilisateurs avec le rôle USER peuvent acheter des plans. 
                Votre rôle actuel est <strong>{user.role}</strong>. 
                Veuillez contacter le support si vous devez changer votre rôle.
              </p>
            </div>
          )}

          {/* Pricing Content */}
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
                Choisissez le plan parfait pour vos besoins de publication d'articles invités. Tous les plans incluent l'accès 
                à notre réseau de sites web allemands.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className={`text-sm ${billingCycle === 'monthly' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  Mensuel
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'annually' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${billingCycle === 'annually' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  Annuel
                </span>
                {billingCycle === 'annually' && (
                  <Badge variant="secondary" className="ml-2">
                    Économisez 10%
                  </Badge>
                )}
              </div>
            </div>
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    plan.popular
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-red-500 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{plan.icon}</div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
                      {plan.description}
                    </p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                        €{billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 ml-2">
                        per month
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-zinc-700 dark:text-zinc-300' 
                            : 'text-zinc-400 line-through'
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                        : ''
                    } ${
                      user && user.role !== 'USER' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                    size="lg"
                    onClick={() => handlePlanSelection(
                      plan.name, 
                      billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                    )}
                    disabled={!!(user && user.role !== 'USER')}
                  >
                    {!user ? 'Sign In to Purchase' : plan.buttonText}
                  </Button>
                </div>
              ))}
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-2xl p-8 border border-red-200 dark:border-red-800">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
                      Enterprise Plan
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                      Need a custom solution? Our enterprise plan is tailored to your specific requirements.
                    </p>
                    <ul className="space-y-2">
                      {enterpriseFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-center">
                    <Button 
                      size="lg"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        // Enterprise plan doesn't require USER role restriction
                        if (!user) {
                          router.push('/login?returnUrl=/pricing');
                        } else {
                          // TODO: Implement contact sales logic
                          alert('Redirecting to contact sales...');
                        }
                      }}
                    >
                      {!user ? 'Sign In to Contact Sales' : 'Contact Sales →'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Purchase Modal */}
      <PurchaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        packageInfo={selectedPackage || undefined}
      />
    </div>
  );
} 