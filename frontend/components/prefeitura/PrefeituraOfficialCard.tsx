import type { OfficialRecord } from '@/types/institucional';

interface PrefeituraOfficialCardProps {
  official: OfficialRecord;
}

export function PrefeituraOfficialCard({ official }: PrefeituraOfficialCardProps) {
  const officialName = official.name ?? 'Aguardando atualização';

  return (
    <div className="flex flex-col items-center rounded-[28px] border border-outline/10 bg-surface-container-low p-6 text-center shadow-ambient sm:p-8">
      {official.photo_url ? (
        <img
          src={official.photo_url}
          alt={officialName}
          className="h-32 w-32 rounded-full object-cover ring-4 ring-primary/10 sm:h-40 sm:w-40"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/10 sm:h-40 sm:w-40">
          <span className="material-symbols-outlined text-5xl text-primary/40">person</span>
        </div>
      )}
      <p className="mt-5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {official.role}
      </p>
      <h3 className="mt-3 font-headline text-xl font-bold text-primary sm:text-2xl">{officialName}</h3>
      {official.bio ? (
        <p className="mt-3 max-w-md text-sm leading-6 text-on-surface-variant">{official.bio}</p>
      ) : null}
    </div>
  );
}
