import { useState, useCallback } from 'react';

type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';

interface ExportOptions {
  format: ExportFormat;
  filename?: string;
}

export default function useExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async <T extends Record<string, unknown>>(
    data: T[],
    options: ExportOptions
  ) => {
    setIsExporting(true);

    try {
      switch (options.format) {
        case 'json':
          await exportJSON(data, options.filename);
          break;
        case 'csv':
          await exportCSV(data, options.filename);
          break;
        // TODO: Implementar PDF e XLSX
        default:
          throw new Error(`Formato ${options.format} não implementado`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportData,
  };
}

async function exportJSON<T extends Record<string, unknown>>(
  data: T[],
  filename?: string
) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const name = filename || `export-${Date.now()}.json`;
  downloadBlob(blob, name);
}

async function exportCSV<T extends Record<string, unknown>>(
  data: T[],
  filename?: string
) {
  if (data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h];
        // Escapar aspas e vírgulas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const name = filename || `export-${Date.now()}.csv`;
  downloadBlob(blob, name);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}