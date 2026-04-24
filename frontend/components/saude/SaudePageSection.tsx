'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SaudePageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badgeValue?: ReactNode;
  actions?: ReactNode;
}

interface SaudePanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

interface SaudeMetricCardProps {
  label: string;
  value: string;
  supportingText?: string;
  tone?: 'default' | 'success' | 'warning' | 'info';
  icon?: string;
}

interface SaudeUnavailablePanelProps {
  title: string;
  description: string;
}

interface SaudeFeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

const metricToneClass = {
  default: 'text-primary',
  success: 'text-secondary',
  warning: 'text-red-300',
  info: 'text-tertiary',
} as const;

export function SaudePageHeader({
  eyebrow,
  title,
  description,
  badgeValue,
  actions,
}: SaudePageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-outline/10 bg-surface-container-low px-6 py-7 shadow-ambient sm:px-8">
      <div className="absolute inset-y-0 right-0 hidden w-56 bg-[radial-gradient(circle_at_top,rgba(15,76,129,0.18),transparent_70%)] lg:block" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold text-primary">{title}</h1>
          <p className="mt-3 text-base leading-7 text-on-surface-variant">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {badgeValue ? <span>{badgeValue}</span> : null}
          {actions}
        </div>
      </div>
    </div>
  );
}

export function SaudePanel({ title, description, action, children }: SaudePanelProps) {
  return (
    <section className="rounded-[28px] border border-outline/10 bg-surface-container-low p-6 shadow-ambient">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-primary">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SaudeMetricCard({
  label,
  value,
  supportingText,
  tone = 'default',
  icon,
}: SaudeMetricCardProps) {
  return (
    <div className="rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">{label}</p>
        {icon ? (
          <span className="material-symbols-outlined text-xl text-primary/60" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn('mt-3 font-headline text-3xl font-bold', metricToneClass[tone])}>{value}</p>
      {supportingText ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">{supportingText}</p> : null}
    </div>
  );
}

export function SaudeUnavailablePanel({ title, description }: SaudeUnavailablePanelProps) {
  return (
    <div className="rounded-[24px] border border-dashed border-outline/20 bg-surface-container-lowest px-5 py-8 text-center">
      <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">inventory_2</span>
      <p className="mt-4 font-headline text-lg font-bold text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
    </div>
  );
}

export function SaudeFeatureCard({ href, title, description, icon, badge }: SaudeFeatureCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-outline/10 bg-surface-container-low p-5 shadow-ambient transition duration-200 hover:-translate-y-1 hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {badge ? (
          <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="mt-5 font-headline text-xl font-bold text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Abrir painel
        <span className="material-symbols-outlined text-base transition group-hover:translate-x-1">arrow_forward</span>
      </div>
    </Link>
  );
}
