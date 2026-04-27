'use client';

import { useRef, useCallback } from 'react';

import { FieldShell, baseFieldClassName } from '@/components/admin/forms/AdminFields';

interface CurrencyFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Formata dígitos puros como BRL (ex: "123456" → "1.234,56").
 * Retorna string formatada e valor numérico.
 */
function applyBRLMask(rawValue: string): { formatted: string; numeric: number | null } {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return { formatted: '', numeric: null };

  const padded = digits.padStart(3, '0');
  const cents = padded.slice(-2);
  const integer = padded.slice(0, -2);
  const numeric = parseInt(integer, 10) + parseInt(cents, 10) / 100;

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);

  return { formatted, numeric };
}

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calcula nova posição do cursor após a formatação.
 * Preserva a posição relativa aos dígitos digitados.
 */
function computeCursor(
  oldValue: string,
  oldCursor: number,
  newFormatted: string
): number {
  const oldDigitsBefore = oldValue.slice(0, oldCursor).replace(/\D/g, '').length;

  let digitCount = 0;
  for (let i = 0; i < newFormatted.length; i++) {
    if (/\d/.test(newFormatted[i])) {
      digitCount++;
    }
    if (digitCount > oldDigitsBefore) return i;
  }

  return newFormatted.length;
}

export default function CurrencyField({
  label,
  value,
  onChange,
  onFocus,
  onBlur,
}: CurrencyFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatBRL(value);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const cursor = event.target.selectionStart ?? raw.length;

      const { formatted, numeric } = applyBRLMask(raw);
      const nextCursor = computeCursor(raw, cursor, formatted);

      // Aplica valor formatado diretamente no DOM para evitar flicker
      event.target.value = formatted;

      onChange(numeric);

      // Restaura cursor após React processar a renderização
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      });
    },
    [onChange]
  );

  return (
    <FieldShell label={label}>
      <input
        ref={inputRef}
        className={baseFieldClassName}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}
