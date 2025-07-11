import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/AuthForms';
 
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
} 
