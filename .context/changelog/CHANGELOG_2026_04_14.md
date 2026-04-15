# Changelog — 2026-04-14

## fix: Caddy apontando para os containers da rede Docker

### Objetivo
Corrigir o 520 no domínio público fazendo o Caddy proxyar diretamente para os containers do dashboard na rede `caddy-proxy`, em vez de usar o host externo antigo `192.168.1.11`.

### Abordagem técnica
- Atualizado o host `dashboard.bandeirantesms.app.br` no Caddyfile para usar `bandeirantes-backend:8000` em `/api/*`
- Atualizado o host `dashboard.bandeirantesms.app.br` no Caddyfile para usar `bandeirantes-frontend:3000` no fallback da UI
- Mantida a rede Docker compartilhada `caddy-proxy`, que já conecta Caddy, backend e frontend

### Arquivos alterados
- `Caddyfile`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `mudanca_mecanica`
- Domínio: `infraestrutura`

### Validação
- Pendente: recarregar o Caddy e testar `https://dashboard.bandeirantesms.app.br`

## fix: fallback de despesas para PDF quando API Quality falha

### Objetivo
Evitar retorno vazio de despesas em 2026 quando os endpoints `BuscaDadosAnual` e `NaturezaDespesa` da Quality retornarem erro 500 ou payload inconsistente.

### Abordagem técnica
- Atualizado o pipeline de `scrape_despesas` para acionar fallback automático em PDF sempre que o merge da API resultar em lista vazia
- Implementado carregamento de despesas via `PDFExtractor` com logs explícitos de sucesso, aviso e falha do fallback
- Adicionados testes de serviço cobrindo: API vazia aciona fallback, API com dados não aciona fallback, sucesso e exceção no carregamento do PDF

### Arquivos alterados
- `backend/services/scraping_service.py`
- `backend/tests/test_etl/test_scraping_service.py`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `borda_externa`
- Domínio: `backend` e `etl`

### Validação
- `ruff check services/scraping_service.py tests/test_etl/test_scraping_service.py` (ok)
- `ruff format --check services/scraping_service.py tests/test_etl/test_scraping_service.py` (ok)
- `pytest tests/test_etl/test_scraping_service.py` (4 passed)

## feat: sincronização automática do PDF de despesas a cada 30 minutos

### Objetivo
Implementar atualização periódica do arquivo `despesas/2026.pdf` via endpoint `RelatorioPdf` para manter despesas atualizadas mesmo com falha 500 nos endpoints JSON de despesas.

### Abordagem técnica
- Criado serviço dedicado de sincronização (`ExpensePDFSyncService`) para baixar, validar e substituir de forma atômica o PDF anual de despesas
- Integrado o sincronismo no scheduler antes de cada execução de scraping automático e também em trigger manual para `despesas` e `all`
- Alterado intervalo do scheduler para 30 minutos, alinhando a atualização recorrente de receitas e despesas no mesmo ciclo
- Adicionados testes unitários para validação de sucesso/falha do download e para integração do scheduler com status de sincronização

### Arquivos alterados
- `backend/services/expense_pdf_sync_service.py`
- `backend/services/scraping_scheduler.py`
- `backend/tests/test_etl/test_expense_pdf_sync_service.py`
- `backend/tests/test_etl/test_scraping_scheduler.py`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `borda_externa`
- Domínio: `backend` e `etl`

### Validação
- `ruff check services/expense_pdf_sync_service.py services/scraping_scheduler.py tests/test_etl/test_expense_pdf_sync_service.py tests/test_etl/test_scraping_scheduler.py` (ok)
- `ruff format --check services/expense_pdf_sync_service.py services/scraping_scheduler.py tests/test_etl/test_expense_pdf_sync_service.py tests/test_etl/test_scraping_scheduler.py` (ok)
- `pytest tests/test_etl/test_expense_pdf_sync_service.py tests/test_etl/test_scraping_scheduler.py` (7 passed)
- Verificação real do endpoint `RelatorioPdf` para 2026: retornou `200 text/html` (sem PDF válido), mantendo o arquivo local sem substituição por segurança

## fix: bootstrap histórico automático no startup para preencher anos ausentes no Docker

### Objetivo
Garantir que o ambiente Docker não fique restrito ao ano de 2026 quando o volume do SQLite for inicializado vazio (ou parcialmente preenchido), carregando automaticamente os anos históricos disponíveis nos PDFs locais.

### Abordagem técnica
- Criado `HistoricalDataBootstrapService` para detectar lacunas de anos por tabela (`receitas`, `despesas`, `receita_detalhamento`) comparando banco vs. PDFs disponíveis
- Implementado bootstrap idempotente que extrai apenas anos faltantes e persiste via upsert/replace reutilizando a lógica de persistência já existente no `ScrapingService`
- Integrado o bootstrap no `lifespan` da API, executando após `init_database()` e antes do scheduler periódico
- Adicionados testes unitários para cenário sem lacunas, cenário com lacunas, cálculo de anos faltantes e filtragem de nomes inválidos de PDF

### Arquivos alterados
- `backend/services/historical_data_bootstrap_service.py`
- `backend/api/main.py`
- `backend/tests/test_etl/test_historical_data_bootstrap_service.py`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `borda_externa`
- Domínio: `backend` e `etl`

### Validação
- Diagnóstico em produção: PDFs 2013–2026 presentes no container, mas banco com apenas registros de 2026
- `docker compose run --rm -v $PWD/backend:/app/backend backend sh -lc 'cd /app/backend && ruff check api/main.py services/historical_data_bootstrap_service.py tests/test_etl/test_historical_data_bootstrap_service.py && mypy --follow-imports=silent api/main.py services/historical_data_bootstrap_service.py && PYTHONPATH=/app pytest tests/test_etl/test_historical_data_bootstrap_service.py -q'` (ok)
- Gate global `cd backend && ruff check . && mypy . && pytest`: permanece com falhas legadas fora do escopo desta entrega

## fix: sincronização em tempo real do ano 2026 priorizando API da Quality

### Objetivo
Eliminar divergência dos valores de 2026 entre dashboard e portal Quality, garantindo que o banco espelhe a fonte da API no ano corrente e atualize em ciclo curto.

### Abordagem técnica
- `ScrapingService` passou a usar estratégia de `replace` para o ano 2026 em receitas e despesas (remove dados antigos do ano e reaplica snapshot atual da fonte)
- Em receitas, o parser mensal deixou de descartar meses com `valorArrecadado=0`, evitando preservação indevida de valores antigos no banco
- O scheduler foi ajustado para intervalo de 1 minuto com primeira execução imediata no startup (`next_run_time=datetime.now()`)
- O bootstrap histórico foi ajustado para não carregar 2026 a partir de PDF (2026 fica reservado à sincronização via API)
- Adicionados testes cobrindo: replace de 2026 em receitas/despesas, parser de receitas com zero e exclusão de 2026 no bootstrap histórico

### Arquivos alterados
- `backend/services/scraping_service.py`
- `backend/etl/scrapers/receita_scraper.py`
- `backend/services/scraping_scheduler.py`
- `backend/services/historical_data_bootstrap_service.py`
- `backend/tests/test_etl/test_scraping_service.py`
- `backend/tests/test_etl/test_scraping_scheduler.py`
- `backend/tests/test_etl/test_historical_data_bootstrap_service.py`
- `backend/tests/test_etl/test_receita_scraper.py`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `borda_externa`
- Domínio: `backend` e `etl`

### Validação
- `docker compose run --rm -v $PWD/backend:/app/backend backend sh -lc 'cd /app/backend && ruff check etl/scrapers/receita_scraper.py services/scraping_service.py services/scraping_scheduler.py services/historical_data_bootstrap_service.py tests/test_etl/test_receita_scraper.py tests/test_etl/test_scraping_service.py tests/test_etl/test_scraping_scheduler.py tests/test_etl/test_historical_data_bootstrap_service.py && PYTHONPATH=/app pytest tests/test_etl/test_receita_scraper.py tests/test_etl/test_scraping_service.py tests/test_etl/test_scraping_scheduler.py tests/test_etl/test_historical_data_bootstrap_service.py -q'` (17 passed)
- Deploy: `docker compose up -d --build backend` (ok)
- Produção após deploy:
	- `receitas_2026_fontes = [('SCRAPING_2026', 4)]`
	- `despesas_2026_fontes = [('PDF_2026', 12)]` (API de despesas manteve erro HTTP 500; fallback PDF permanece ativo)
	- Scheduler com execução frequente confirmada (`last_run` avançando em ~60s)

## fix: cards de resumo em receitas alinhados ao total anual oficial

### Objetivo
Corrigir divergência dos indicadores `Total Arrecadado`, `Total Previsto` e `% Execução` na página `/receitas`, que estavam inconsistentes com os valores anuais esperados para anos históricos.

### Abordagem técnica
- Ajustado o cálculo dos cards em `frontend/app/receitas/receitas-client.tsx` para usar o total anual de arrecadação a partir dos KPIs mensais (fonte consolidada anual)
- Mantido o total previsto vindo dos itens de topo do detalhamento (nível 1), preservando o orçamento anual da estrutura hierárquica
- Aplicado fallback para filtros por tipo em dados históricos de PDF, evitando usar arrecadação do detalhamento quando não há consolidado anual confiável por tipo

### Arquivos alterados
- `frontend/app/receitas/receitas-client.tsx`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `regra_de_negocio`
- Domínio: `frontend`

### Validação
- `cd frontend && npm run lint` (ok, apenas warnings legados fora do escopo)
- `cd frontend && npm run type-check` (ok)
- `cd frontend && npm run build` (ok)

## fix: cards anuais de receitas e despesas com base em total consolidado do ano

### Objetivo
Corrigir divergência dos cards de `/receitas` e `/despesas` em 2025 (e demais anos), que exibiam valores parciais ou agregações inconsistentes com os totais anuais esperados.

### Abordagem técnica
- Em `frontend/app/despesas/despesas-client.tsx`, os cards deixaram de somar a lista paginada (`PAGE_SIZE=15`) e passaram a usar `useDespesasTotalAno`, consumindo `/api/v1/despesas/total/ano/{ano}`
- Em `frontend/hooks/useFinanceData.ts` e `frontend/services/api.ts`, a tipagem do total anual de despesas foi corrigida para refletir os três campos reais da API: `total_empenhado`, `total_liquidado`, `total_pago`
- Em `frontend/app/receitas/receitas-client.tsx`, o `Total Arrecadado` passou a usar `useReceitasTotalAno` (total anual consolidado), enquanto o `Total Previsto` usa a linha principal de receitas correntes no nível 1 do detalhamento (desconsiderando deduções), conforme referência informada para 2025

### Arquivos alterados
- `frontend/app/receitas/receitas-client.tsx`
- `frontend/app/despesas/despesas-client.tsx`
- `frontend/hooks/useFinanceData.ts`
- `frontend/services/api.ts`
- `.context/changelog/CHANGELOG_2026_04_14.md`

### Classificação
- Tipo: `regra_de_negocio`
- Domínio: `frontend`

### Validação
- `docker run --rm -v /home/thanos/dash/frontend:/app -w /app node:20-slim sh -c "npm install && npm run lint"` (ok, apenas warnings legados fora do escopo)
- `docker run --rm -v /home/thanos/dash/frontend:/app -w /app node:20-slim sh -c "npm run type-check"` (ok)
- `docker run --rm -v /home/thanos/dash/frontend:/app -w /app node:20-slim sh -c "npm run build"` (ok)