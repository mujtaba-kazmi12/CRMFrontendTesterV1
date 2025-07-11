'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { toast } from '../hooks/use-toast';

export default function PaymentSuccess() {
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkBalance = async () => {
      setProcessing(true);
      try {
        const token = localStorage.getItem('crm_token') || undefined;
        const user = await api.get('/auth/me', token);
        const newBalance = user.balance ?? 0;
        const prev = localStorage.getItem('previousBalance');
        const previousBalance = prev ? parseFloat(prev) : 0;
        if (newBalance > previousBalance) {
          setSuccess(true);
          toast({
            title: 'Paiement réussi !',
            description: 'Votre solde a été mis à jour.',
          });
          // Clean up previousBalance
          localStorage.removeItem('previousBalance');
          setTimeout(() => {
            router.push('/dashboard/balance');
          }, 2000);
        } else {
          setSuccess(false);
          toast({
            title: 'Paiement non terminé',
            description: 'Vous n\'avez pas pu terminer le paiement. Veuillez réessayer ou contacter le support.',
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check payment status.');
      } finally {
        setProcessing(false);
      }
    };
    checkBalance();
    // eslint-disable-next-line
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-3xl font-bold">
        {processing ? 'Vérification du statut de paiement...' : success === true ? 'Paiement réussi !' : 'Paiement non terminé'}
      </h1>
      <p className="text-lg text-muted-foreground">
        {processing
          ? 'Veuillez patienter pendant que nous vérifions votre paiement.'
          : success === true
            ? 'Votre solde a été mis à jour. Redirection...'
            : 'Vous n\'avez pas pu terminer le paiement. Veuillez réessayer ou contacter le support.'}
      </p>
      {error && <div className="text-red-500">{error}</div>}
      <Button onClick={() => router.push('/dashboard/balance')}>Aller au Solde</Button>
    </div>
  );
} 
