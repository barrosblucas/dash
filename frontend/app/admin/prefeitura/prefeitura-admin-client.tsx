'use client'

import { useState } from 'react'

import PrefeituraProfileTab from '@/components/admin/prefeitura/PrefeituraProfileTab'
import PrefeituraDepartmentsTab from '@/components/admin/prefeitura/PrefeituraDepartmentsTab'
import PrefeituraOfficesTab from '@/components/admin/prefeitura/PrefeituraOfficesTab'

type Tab = 'perfil' | 'secretarias' | 'reparticoes'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'perfil', label: 'Perfil da Prefeitura', icon: 'location_city' },
  { key: 'secretarias', label: 'Secretarias', icon: 'account_balance' },
  { key: 'reparticoes', label: 'Repartições', icon: 'domain' },
]

export default function PrefeituraAdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>('perfil')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-2xl font-bold text-primary">Prefeitura</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Gerencie os dados institucionais da Prefeitura, secretarias e repartições.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'perfil' && <PrefeituraProfileTab />}
      {activeTab === 'secretarias' && <PrefeituraDepartmentsTab />}
      {activeTab === 'reparticoes' && <PrefeituraOfficesTab />}
    </div>
  )
}
