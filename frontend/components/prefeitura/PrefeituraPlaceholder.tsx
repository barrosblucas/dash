interface PrefeituraPlaceholderProps {
  title?: string;
  description?: string;
}

export function PrefeituraPlaceholder({
  title = 'Informações em atualização',
  description = 'Estamos organizando os dados para esta seção. Volte em breve.',
}: PrefeituraPlaceholderProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-outline/20 bg-surface-container-lowest px-5 py-10 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">info</span>
      <p className="mt-4 font-headline text-lg font-bold text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
    </div>
  );
}
