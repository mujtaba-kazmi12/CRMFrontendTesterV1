'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

import { CheckCircle, ArrowRight, Home, User } from 'lucide-react';
import { useAuth } from '../lib/auth';


export default function ThankYouPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get payment details from URL parameters (if provided by Cryptomus)
  const transactionId = searchParams?.get('transaction_id') || searchParams?.get('txn_id');
  const amount = searchParams?.get('amount');
  const currency = searchParams?.get('currency');
  const status = searchParams?.get('status');

  useEffect(() => {
    setMounted(true);
    
    // Optionally verify payment with backend
    const verifyPayment = async () => {
      if (transactionId) {
        try {
          const token = localStorage.getItem('crm_token');
          // You can call your backend to verify the payment
          // const verification = await api.get(`/payments/verify/${transactionId}`, token);
          // setPaymentDetails(verification);
        } catch (error) {
          console.error('Payment verification failed:', error);
        }
      }
      setLoading(false);
    };

    verifyPayment();
  }, [transactionId]);

  const handleContinue = () => {
    if (user) {
      // Redirect to dashboard if user is logged in
      router.push('/dashboard');
    } else {
      // Redirect to home if not logged in
      router.push('/');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="text-center shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Paiement Réussi !
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
              Merci pour votre achat. Votre abonnement a été activé.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Details */}
            {(transactionId || amount || currency) && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Détails du Paiement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ID de Transaction :</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100 break-all">
                        {transactionId || 'Non disponible'}
                      </span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Montant :</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {amount ? `${amount} ${currency || 'EUR'}` : 'Non disponible'}
                      </span>
                    </div>
                  )}
                  {status && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Statut :</span>
                      <span className="font-semibold text-green-600">
                        {status || 'Réussi'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date :</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Que se passe-t-il ensuite ?
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                  <li>• Votre abonnement est maintenant actif</li>
                  <li>• Vous pouvez commencer à utiliser les fonctionnalités de votre plan immédiatement</li>
                  <li>• Un email de confirmation a été envoyé à votre adresse email enregistrée</li>
                  <li>• Vous pouvez accéder à votre tableau de bord pour gérer votre compte</li>
                </ul>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3 justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-800 dark:text-blue-200">
                    Welcome back, <strong>{user.name}</strong>!
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleContinue}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {user ? (
                  <>
                    Aller au Tableau de bord
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
                className="flex-1"
                size="lg"
              >
                <Home className="mr-2 w-4 h-4" />
                Retour à l'Accueil
              </Button>
            </div>

            {/* Support Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Besoin d'aide ? Contactez notre équipe de support à{' '}
                <a 
                  href="mailto:support@handicap-internatioanl.fr" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@handicap-internatioanl.fr
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cette page vous redirigera automatiquement dans 30 secondes...
          </p>
        </div>
      </div>
    </div>
  );
}

// Auto-redirect after 30 seconds
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/thankyou') {
      // Check if user is logged in
      const user = localStorage.getItem('crm_user');
      if (user) {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/';
      }
    }
  }, 30000); // 30 seconds
} 