'use client';

// Placeholder para componente de previsão
// TODO: Implementar com Recharts e visualização de bandas de confiança

export default function ForecastSection() {
  return (
    <div className="chart-container">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-100">Previsão</h3>
        <p className="text-sm text-dark-400">Projeção com intervalo de confiança</p>
      </div>
      
      <div className="h-64 flex items-center justify-center bg-dark-800/30 rounded-lg border border-dark-700 border-dashed">
        <p className="text-dark-500">
          Componente de previsão será implementado com bandas de confiança
        </p>
      </div>
    </div>
  );
}