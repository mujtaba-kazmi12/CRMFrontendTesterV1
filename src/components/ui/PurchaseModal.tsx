'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './dialog';
import { Button } from './button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import { api } from '../../lib/api';

interface Service {
  network: string;
  currency: string;
  is_available: boolean;
  limit: {
    min_amount: string;
    max_amount: string;
  };
  commission: {
    fee_amount: string;
    percent: string;
  };
}

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageInfo?: {
    title: string;
    description: string;
    price: number;
    credits: number;
    subscriptionType?: string;
  };
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onOpenChange, packageInfo }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [coin, setCoin] = useState<string | undefined>(undefined);
  const [network, setNetwork] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('https://ggp-production-5e27.up.railway.app/v1/payscrap/services')
        .then((res) => res.json())
        .then((data) => {
          setServices(data.filter((s: Service) => s.is_available));
          setLoading(false);
        });
    }
  }, [open]);

  useEffect(() => {
    setError(null);
  }, [coin, network]);

  // Unique coins
  const coins = Array.from(new Set(services.map((s) => s.currency)));
  // Networks for selected coin
  const networks = coin
    ? Array.from(new Set(services.filter((s) => s.currency === coin).map((s) => s.network)))
    : [];

  const handleConfirm = async () => {
    setError(null);
    if (!coin || !network || !packageInfo) {
      setError('Veuillez sélectionner une cryptomonnaie et un réseau.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('crm_token') || undefined;
      
      // Store current balance before redirect
      const user = await api.get('/auth/me', token);
      if (user && typeof user.balance === 'number') {
        localStorage.setItem('previousBalance', user.balance.toString());
      }
      
      // Determine subscription type based on package info
      const subscriptionType = packageInfo.subscriptionType || 'basic';
      
      
      
      const payload = {
        subscriptionType: subscriptionType,
        network: network,
        currency: coin,
      };
      
      console.log('PAYMENT PAYLOAD:', payload); // Debug log
      console.log('Package Info:', packageInfo); // Debug log
      console.log('Selected Coin:', coin); // Debug log
      console.log('Selected Network:', network); // Debug log
      
      const res = await api.post('/payments/create', payload, token);
      if (res && res.payment_url) {
        window.location.href = res.payment_url;
      } else {
        setError('Échec de la création du paiement.');
      }
    } catch (err: any) {
      setError(err.message || 'Échec de la création du paiement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acheter un Plan</DialogTitle>
          <DialogDescription>
            {packageInfo ? (
              <>
                <div className="font-semibold text-lg">{packageInfo.title}</div>
                <div className="text-muted-foreground text-sm mb-2">{packageInfo.description}</div>
                <div className="text-lg font-bold text-green-600 mb-2">
                  €{packageInfo.price}/mois
                </div>
              </>
            ) : (
              'Sélectionnez votre cryptomonnaie et réseau pour continuer.'
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Cryptomonnaie</label>
              <Select value={coin} onValueChange={setCoin}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une cryptomonnaie" />
                </SelectTrigger>
                <SelectContent>
                  {coins.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Réseau</label>
              <Select value={network} onValueChange={setNetwork} disabled={!coin}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un réseau" />
                </SelectTrigger>
                <SelectContent>
                  {networks.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        )}
        <DialogFooter>
          <Button
            disabled={!coin || !network || submitting}
            onClick={handleConfirm}
            className="w-full"
          >
            {submitting ? 'Traitement...' : 'Confirmer et Payer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 