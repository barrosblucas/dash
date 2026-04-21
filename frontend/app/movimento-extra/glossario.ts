import { GLOSSARIO_FUNDOS } from '@/types/movimento-extra';

export function getGlossaryKey(descricao: string): string {
  const upper = descricao.toUpperCase();
  if (upper.includes('FUNDEB')) return 'FUNDEB';
  if (upper.includes('FMAS') || upper.includes('ASSISTÊNCIA SOCIAL')) return 'FMAS';
  if (upper.includes('FMIS') || upper.includes('SAÚDE')) return 'FMIS';
  if (upper.includes('FMDCA') || upper.includes('CRIANÇA') || upper.includes('ADOLESCENTE')) return 'FMDCA';
  if (upper.includes('FUNCESP') || upper.includes('PREVIDÊNCIA') || upper.includes('APOSENTADOR')) return 'FUNCESP';
  return 'OUTROS';
}

export function getGlossary(key: string) {
  return GLOSSARIO_FUNDOS[key] ?? GLOSSARIO_FUNDOS.OUTROS;
}
