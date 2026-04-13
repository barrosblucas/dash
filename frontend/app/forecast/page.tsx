import type { Metadata } from 'next';

import ForecastClient from './forecast-client';

export const metadata: Metadata = {
  title: 'Previsões',
  description: 'Projeções financeiras do município de Bandeirantes MS',
};

export default function ForecastPage() {
  return <ForecastClient />;
}
