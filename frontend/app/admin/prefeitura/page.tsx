import type { Metadata } from 'next'

import PrefeituraAdminClient from './prefeitura-admin-client'

export const metadata: Metadata = {
  title: 'Admin | Prefeitura',
  description: 'Gerenciamento dos dados institucionais da Prefeitura.',
}

export default function PrefeituraAdminPage() {
  return <PrefeituraAdminClient />
}
