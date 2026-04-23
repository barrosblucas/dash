import { Suspense } from 'react';
import type { Metadata } from 'next';

import LoginPageClient from '@/components/auth/LoginPageClient';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Acesso à área restrita administrativa.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
