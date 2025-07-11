import { Metadata } from 'next';
import { Suspense } from 'react';
import ThankYouPage from '@/pages/ThankYouPage';

export const metadata: Metadata = {
  title: 'Payment Successful - Thank You | Handicap Internatioanl',
  description: 'Thank you for your purchase! Your payment has been processed successfully.',
  robots: {
    index: false, // Don't index this page
    follow: false,
  },
};

export default function ThankYou() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ThankYouPage />
    </Suspense>
  );
} 
