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