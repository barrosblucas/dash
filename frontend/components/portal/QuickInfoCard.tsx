'use client';

import Link from 'next/link';

/**
 * Card clicável de Informações Rápidas (rota interna Next.js).
 */
export function QuickInfoCard({
  icon,
  title,
  description,
  border,
  iconColor,
  href,
  loading = false,
}: {
  icon: string;
  title: string;
  description: string;
  border: string;
  iconColor: string;
  href?: string | null;
  loading?: boolean;
}) {
  const content = (
    <div
      className={`
        bg-surface-container-lowest rounded-xl p-6 shadow-sm
        hover:shadow-md transition-shadow border-l-4 ${border}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`material-symbols-outlined ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <h4 className="font-headline font-bold text-lg text-primary">{title}</h4>
      </div>
      {loading ? (
        <p className="font-body text-sm text-on-surface-variant animate-pulse">
          Carregando...
        </p>
      ) : (
        <p className="font-body text-sm text-on-surface-variant">{description}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

/**
 * Card clicável de Informações Rápidas (link externo).
 */
export function QuickInfoExternalLink({
  icon,
  title,
  description,
  border,
  iconColor,
  externalHref,
  loading = false,
}: {
  icon: string;
  title: string;
  description: string;
  border: string;
  iconColor: string;
  externalHref?: string | null;
  loading?: boolean;
}) {
  const content = (
    <div
      className={`
        bg-surface-container-lowest rounded-xl p-6 shadow-sm
        hover:shadow-md transition-shadow border-l-4 ${border}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`material-symbols-outlined ${iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <h4 className="font-headline font-bold text-lg text-primary">{title}</h4>
      </div>
      {loading ? (
        <p className="font-body text-sm text-on-surface-variant animate-pulse">
          Carregando...
        </p>
      ) : (
        <p className="font-body text-sm text-on-surface-variant">{description}</p>
      )}
    </div>
  );

  if (externalHref) {
    return (
      <a href={externalHref} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}
