# Changelog — 2026-04-18

## fix: forecast anual recompõe 2026 e controle `Projetar:` volta a responder

### Objetivo
Corrigir a visualização anual de `/forecast` para que 2026 não apareça artificialmente em queda por causa de poucos meses consolidados no banco e fazer o seletor `Projetar:` funcionar corretamente até 5 anos.

### Diagnóstico
- O gráfico anual agregava 2026 a partir das previsões mensais futuras, mas quando o ano base era anterior a 2026 o total projetado do ano corrente acabava considerando apenas os meses previstos restantes, sem recompor o ano com os meses já fechados.
- Isso fazia 2026 parecer um ano em declínio no comparativo anual, apesar de o problema ser apenas a parcialidade do exercício em andamento.
- O frontend calculava o horizonte mensal de forecast de forma genérica e o backend aceitava no máximo 60 meses; com a opção de até 5 anos no seletor, o limite podia ser insuficiente.

### Abordagem técnica
- Ajustado `frontend/components/dashboard/ForecastSection.tsx` para:
  - buscar o histórico anual apenas até o último ano fechado;
  - buscar os KPIs mensais do ano corrente quando a visualização anual estiver ativa;
  - recompor 2026 com meses fechados reais + forecast dos meses remanescentes;
  - projetar os anos seguintes a partir do ano corrente, alinhando o gráfico com a intenção do controle `Projetar:`;
  - forçar remount controlado do gráfico ao trocar visualização, ano base e quantidade de anos projetados, evitando cache visual do Recharts.
- Ajustado `frontend/app/forecast/forecast-client.tsx` para repassar uma `key` derivada dos controles da tela para o componente de forecast.
- Corrigido o bootstrap de projeção da página `/forecast`: o estado `mostrarProjecao` era ativado com `toggle`, o que podia voltar para `false` em execução dupla de efeito no React/Next em desenvolvimento. Agora a página usa atribuição explícita (`setMostrarProjecao(true)`).
- Adicionado `setMostrarProjecao` em `frontend/stores/filtersStore.ts` para permitir ativação determinística da projeção sem depender de toggle.
- Ajustado `backend/api/routes/forecast.py` para ampliar o contrato de `horizonte` de `1-60` para `1-72`, cobrindo o cenário de projeção anual com até 5 anos.
- Atualizado `.context/PROJECT_STATE.md` para refletir a correção entregue.

### Arquivos alterados
- `frontend/components/dashboard/ForecastSection.tsx`
- `backend/api/routes/forecast.py`
- `.context/PROJECT_STATE.md`
- `.context/changelog/CHANGELOG_2026_04_18.md`

### Classificação
- Tipo: `regra_de_negocio`
- Domínio: `frontend` e `backend`

### Validação
- Frontend:
  - `cd frontend && npm run lint` ✅ (warnings legados fora do escopo)
  - `cd frontend && npm run type-check` ✅
  - `cd frontend && npm run build` ✅
- Backend:
  - `PYTHONPATH=/home/thanos/dashboard ./venv/bin/pytest backend/tests` ✅ (71 passed)
  - `ruff check backend` ⚠️ falhou por violações legadas amplas fora do escopo, principalmente em ETL e repositórios antigos
  - `PYTHONPATH=/home/thanos/dashboard mypy backend` ⚠️ falhou por erros legados de tipagem/ambiente fora do escopo (imports sem stubs e tipagem ORM antiga)
- Verificação funcional dos dados:
  - banco local contém 2026 parcial (jan-abr), com abril ainda parcial;
  - execução local do `ForecastingService` mostrou previsão de receitas para abr-dez/2026, permitindo recompor o ano corrente em vez de exibir apenas o acumulado parcial.
