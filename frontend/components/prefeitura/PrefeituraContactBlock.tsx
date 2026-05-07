import type { CityHallContact } from '@/types/institucional';

interface PrefeituraContactBlockProps {
  contact: CityHallContact;
}

export function PrefeituraContactBlock({ contact }: PrefeituraContactBlockProps) {
  const items = [
    { icon: 'location_on', label: 'Endereço', value: contact.address },
    { icon: 'call', label: 'Telefone', value: contact.phone },
    { icon: 'mail', label: 'E-mail', value: contact.email },
    { icon: 'schedule', label: 'Horário', value: contact.office_hours },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) =>
        item.value ? (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl bg-surface-container p-4">
            <span className="material-symbols-outlined mt-0.5 text-primary/70">{item.icon}</span>
            <div>
              <p className="text-label-sm font-medium text-on-surface-variant">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-on-surface">{item.value}</p>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
