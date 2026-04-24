'use client';

import { useEffect } from 'react';

import { formatDateInputValue, saudeYearOptions } from '@/lib/saude-utils';

interface SaudePeriodFilterProps {
  year: number;
  startDate: string;
  endDate: string;
  onYearChange: (year: number) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  showYear?: boolean;
}

export default function SaudePeriodFilter({
  year,
  startDate,
  endDate,
  onYearChange,
  onStartDateChange,
  onEndDateChange,
  showYear = true,
}: SaudePeriodFilterProps) {
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!showYear) {
      return;
    }

    const newStart = formatDateInputValue(new Date(year, 0, 1));
    const newEnd =
      year === currentYear
        ? formatDateInputValue(new Date())
        : formatDateInputValue(new Date(year, 11, 31));

    onStartDateChange(newStart);
    onEndDateChange(newEnd);
  }, [year, showYear, currentYear, onStartDateChange, onEndDateChange]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {showYear && (
        <select
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
        >
          {saudeYearOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      <input
        type="date"
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
        className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
      />
      <input
        type="date"
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
        className="rounded-2xl border border-outline/20 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary"
      />
    </div>
  );
}
