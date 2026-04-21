/**
 * Cálculo de feriados nacionais e estaduais (MS)
 * Algoritmo de Meeus/Jones/Butcher para Páscoa
 */

/** Retorna Map<yyyy-MM-dd, nomeFeriado> para o ano dado */
export function getFeriados(ano: number): Map<string, string> {
  const map = new Map<string, string>();
  const fixos: [number, number, string][] = [
    [1, 1, 'Confraternização Universal'],
    [4, 21, 'Tiradentes'],
    [5, 1, 'Dia do Trabalho'],
    [9, 7, 'Independência do Brasil'],
    [10, 11, 'Aniversário de MS'],
    [10, 12, 'Nossa Senhora Aparecida'],
    [11, 2, 'Finados'],
    [11, 15, 'Proclamação da República'],
    [12, 25, 'Natal'],
  ];
  for (const [mes, dia, nome] of fixos) {
    const key = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    map.set(key, nome);
  }

  // Algoritmo de Meeus/Jones/Butcher para Páscoa
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31);
  const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;

  const dataPascoa = new Date(ano, mesPascoa - 1, diaPascoa);
  const sextaSanta = new Date(dataPascoa);
  sextaSanta.setDate(dataPascoa.getDate() - 2);
  const corpusChristi = new Date(dataPascoa);
  corpusChristi.setDate(dataPascoa.getDate() + 60);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  map.set(fmt(sextaSanta), 'Sexta-feira Santa');
  map.set(fmt(dataPascoa), 'Páscoa');
  map.set(fmt(corpusChristi), 'Corpus Christi');

  return map;
}
