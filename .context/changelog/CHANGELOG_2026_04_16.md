# Changelog — 2026-04-16

## fix: despesas 2026 atualizando com contrato real da Quality

### Objetivo
Restabelecer a atualização automática de despesas (API em tempo real com fallback por PDF), eliminando o cenário em que o pipeline marcava sucesso mas persistia dados antigos de PDF.

### Diagnóstico
- O cliente de despesas estava chamando endpoints com caminho de barra simples (`/despesas/BuscaDadosAnual` e `/despesas/NaturezaDespesa`), enquanto o portal respondeu corretamente com barra dupla (`/despesas//...`).
- O endpoint `RelatorioPdf` não retorna o binário PDF diretamente; ele retorna JSON com `path` do arquivo gerado.
- O backend tentava interpretar `RelatorioPdf` como download direto de PDF e recebia HTML da página.
- No Docker de produção, `./despesas:/app/despesas:ro` impedia a substituição do PDF local quando o download fosse válido.

### Abordagem técnica
- Ajustado `QualityAPIClient` para usar base de despesas com barra final, produzindo chamadas funcionais para `/despesas//BuscaDadosAnual` e `/despesas//NaturezaDespesa`.
- Reescrito `ExpensePDFSyncService` para fluxo de duas etapas:
  - chamada AJAX de geração (`RelatorioPdf`) para obter JSON com `path`;
  - download do PDF real via URL resolvida a partir do `path`.
- Ajustado o scheduler para 10 minutos (alinhado ao requisito operacional atual).
- Alterado `docker-compose.yml` para montar `despesas/` com escrita no backend.
- Adicionados/atualizados testes unitários para cliente da Quality, sincronização de PDF e scheduler.

### Arquivos alterados
- `backend/etl/scrapers/quality_api_client.py`
- `backend/services/expense_pdf_sync_service.py`
- `backend/services/scraping_scheduler.py`
- `backend/tests/test_etl/test_expense_pdf_sync_service.py`
- `backend/tests/test_etl/test_scraping_scheduler.py`
- `backend/tests/test_etl/test_quality_api_client.py`
- `docker-compose.yml`
- `.context/changelog/CHANGELOG_2026_04_16.md`

### Classificação
- Tipo: `borda_externa`
- Domínio: `backend` e `etl`

### Validação
- Verificação de contrato externo (manual):
  - `/despesas//BuscaDadosAnual` e `/despesas//NaturezaDespesa` retornaram JSON válido para 2026.
  - `RelatorioPdf` retornou JSON com `path`; download subsequente retornou `application/pdf` válido.
- Testes focados (container com dependências):
  - `pytest tests/test_etl/test_expense_pdf_sync_service.py tests/test_etl/test_scraping_scheduler.py tests/test_etl/test_quality_api_client.py -q` (10 passed)
- Qualidade nos arquivos alterados:
  - `ruff check ...` (ok)
  - `mypy ...` (ok)
- Gate backend completo executado e com falhas legadas fora do escopo (ex.: `backend/etl/extractors/pdf_extractor.py`, imports não tipados antigos em infraestrutura).

---

## fix: comparativo do dashboard sem despesas em 2026

### Objetivo
Restaurar o comparativo receitas x despesas no dashboard quando a fonte de despesas 2026 alterna entre vazio e dados válidos.

### Diagnóstico
- O frontend estava correto; os endpoints de KPI retornavam `despesas_total=0` porque o backend não tinha registros de despesas 2026.
- O pipeline de despesas para 2026 fazia replace por ano; quando a origem vinha vazia, o snapshot do ano podia ser limpo.
- No portal Quality, o parâmetro `unidadeGestora=-1` passou a retornar consolidado zerado para 2026.
- O mesmo endpoint com `unidadeGestora=0` retorna valores válidos para 2026.

### Abordagem técnica
- Adicionada proteção no `ScrapingService`:
  - quando API + fallback PDF retornam vazio, o fluxo finaliza com `NO_DATA` e não executa replace do ano.
  - isso preserva o snapshot anterior e evita regressão silenciosa no dashboard.
- Ajustado default do `QualityAPIClient` para despesas (`annual` e `natureza`) de `unidadeGestora=-1` para `unidadeGestora=0`.
- Atualizados testes unitários para cobrir:
  - cenário `NO_DATA` sem replace;
  - novo default de `unidadeGestora` no cliente da Quality.

### Arquivos alterados
- `backend/services/scraping_service.py`
- `backend/etl/scrapers/quality_api_client.py`
- `backend/tests/test_etl/test_scraping_service.py`
- `backend/tests/test_etl/test_quality_api_client.py`

### Validação
- Testes focados (container):
  - `pytest -q backend/tests/test_etl/test_quality_api_client.py backend/tests/test_etl/test_scraping_service.py -k "despesas or no_data"` (8 passed)
- Lint focado:
  - `ruff check etl/scrapers/quality_api_client.py services/scraping_service.py tests/test_etl/test_quality_api_client.py tests/test_etl/test_scraping_service.py` (ok)
- Verificação funcional pós-deploy:
  - trigger manual `POST /api/v1/scraping/trigger` com `{"year": 2026, "data_type": "despesas"}` retornou `despesas_processed=8`.
  - `GET /api/v1/despesas?ano=2026` retornou registros da fonte `SCRAPING_2026`.
  - `GET /api/v1/kpis/mensal/2026` retornou `despesas_total=35760480.69` (não zero), restaurando o comparativo no dashboard.
