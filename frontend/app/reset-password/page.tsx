import { Suspense } from 'react';
import type { Metadata } from 'next';

import ResetPasswordPageClient from '@/components/auth/ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Redefinir senha',
  description: 'Atualize sua senha de acesso à área restrita.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
