'use client';

import { saudeYearOptions } from '@/lib/saude-utils';

interface SaudePeriodFilterProps {
  year: number;
  startDate: string;
  endDate: string;
  onYearChange: (year: number) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  showYear?: boolean;
  minStartDate?: string;
}

export default function SaudePeriodFilter({
  year,
  startDate,
  endDate,
  onYearChange,
  onStartDateChange,
  onEndDateChange,
  showYear = true,
  minStartDate,
}: SaudePeriodFilterProps) {
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
        min={minStartDate}
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
