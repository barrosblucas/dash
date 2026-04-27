'use client';

import type { ReactNode } from 'react';

interface FieldShellProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FieldShell({ label, children, hint }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-2 text-sm text-on-surface-variant">
      <span className="font-label font-medium text-on-surface">{label}</span>
      {children}
      {hint ? <span className="text-xs text-on-surface-variant">{hint}</span> : null}
    </label>
  );
}

export const baseFieldClassName =
  'w-full rounded-xl border border-outline/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant/50 hover:border-outline/60 focus:border-primary focus:ring-2 focus:ring-primary/20';

interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  min,
  max,
  step,
  readOnly = false,
  onFocus,
  onBlur,
}: InputFieldProps) {
  return (
    <FieldShell label={label} hint={hint}>
      <input
        className={baseFieldClassName}
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}

export function TextareaField({ label, value, onChange, rows = 4 }: TextareaFieldProps) {
  return (
    <FieldShell label={label}>
      <textarea
        className={baseFieldClassName}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <FieldShell label={label}>
      <select
        className={baseFieldClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-none accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}
