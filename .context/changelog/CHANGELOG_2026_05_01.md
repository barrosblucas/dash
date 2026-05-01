# Changelog 2026-05-01

## Correções

### Backend — Movimento Extra (500 ao buscar período sem dados)
- **Fixed** HTTP 500 em `GET /api/v1/movimento-extra/busca?ano=2026&mes=5&tipo=AMBOS`.
  - Causa raiz: a API externa Quality (`portalquality.qualitysistemas.com.br`) retorna itens placeholder com todos os campos `null` quando não há dados para o período solicitado. O adapter (`movimento_extra_adapter.py`) tentava construir `MovimentoExtraItem(**item)` com `codigo=None`, `tipo=""`, `valor_recebido=None`, etc., causando `pydantic.ValidationError` não tratado que escalava para 500.
  - Solução: `fetch_tipo()` agora filtra itens com `codigo is None` e `tipo not in ("R", "D")` antes de tentar a construção Pydantic. Adicionado `try/except` com log de warning como rede de segurança para outros possíveis desalinhamentos de schema da API externa.
  - Comportamento: períodos sem dados agora retornam 200 com lista vazia (`items: [], quantidade: 0`) em vez de 500.
- Arquivo modificado:
  - `backend/features/movimento_extra/movimento_extra_adapter.py`

## Validação
- `ruff check .` — pass
- Teste manual: `2026/5` (sem dados) → 200 OK com items vazios
- Teste manual: `2025/1` (dados reais) → 200 OK com 565 itens, totais e insights corretos
- `pytest` — não executável (ambiente de testes requer dependências ausentes — problema pré-existente)

## Ajustes

### Frontend — SaudePeriodFilter: limitar seletor de ano por página
- **Changed** `SaudePeriodFilter` agora aceita prop opcional `yearOptions: number[]` para limitar os anos exibidos no dropdown. Sem a prop, mantém o comportamento global via `saudeYearOptions`.
- **Changed** Páginas de **farmácia**, **vacinação** e **atenção primária**: dropdown de ano limitado a 2020–presente; `minStartDate` ajustado para `2020-01-01` (vacinação alterado de `2019-11-01`).
- **Changed** Página de **saúde bucal**: dropdown de ano limitado a 2025–presente; `minStartDate` mantido em `2025-05-01`.
- As demais páginas de saúde (hospital, medicamentos, procedimentos, perfil-epidemiológico, visitas-domiciliares) não foram alteradas — continuam usando o range completo de anos.
- Arquivos modificados:
  - `frontend/components/saude/SaudePeriodFilter.tsx`
  - `frontend/app/saude/farmacia/farmacia-client.tsx`
  - `frontend/app/saude/vacinacao/vacinacao-client.tsx`
  - `frontend/app/saude/atencao-primaria/atencao-primaria-client.tsx`
  - `frontend/app/saude/saude-bucal/saude-bucal-client.tsx`

## Validação (frontend)
- `npm run lint` — ✔ No ESLint warnings or errors
- `npm run type-check` — ✔ No errors
- `npm run build` — ✓ Compiled successfully, 39 static pages generated

## Funcionalidades Novas

### Backend — Feature Diário Oficial (scraper + API + scheduler)
- **Added** Nova feature `features/diario_oficial/` com scraping do site `diariooficialms.com.br` para Bandeirantes-MS.
  - `diario_oficial_types.py`: schemas Pydantic (`DiarioEdicao`, `DiarioResponse`)
  - `diario_oficial_adapter.py`: ACL HTTP com `httpx` + `selectolax` que parseia `<ul.list-group>` para extrair número, data, link de download, tamanho e flag `suplementar`
  - `diario_oficial_handler.py`: endpoint público `GET /api/v1/diario-oficial/hoje` com cache do scheduler e fallback direto
  - `diario_oficial_scheduler.py`: APScheduler com jobs às 06:00 (edição regular) e 16:00 (verifica suplementar), armazenando resultado em memória via `app.state`
- **Added** Integração ao `main.py`: router registrado em `/api/v1` e scheduler inicializado no `lifespan` com shutdown gracioso
- Arquivos criados:
  - `backend/features/diario_oficial/__init__.py`
  - `backend/features/diario_oficial/diario_oficial_types.py`
  - `backend/features/diario_oficial/diario_oficial_adapter.py`
  - `backend/features/diario_oficial/diario_oficial_handler.py`
  - `backend/features/diario_oficial/diario_oficial_scheduler.py`
  - `backend/tests/test_etl/test_diario_oficial.py`
- Arquivos modificados:
  - `backend/api/main.py`

### Frontend — Diário Oficial dinâmico no Portal
- **Changed** `portal-client.tsx`: card "Diário Oficial do Dia" agora consome dados reais da API `/api/v1/diario-oficial/hoje` em vez de texto estático.
  - Exibe edição regular e suplementar com link de download
  - Estados: loading ("Carregando..."), sem edição (mensagem), erro (mensagem de fallback)
  - Card mantém estilo visual existente (`border-primary-container`, ícone `menu_book`)
- **Added** `types/diario-oficial.ts`: contratos TypeScript (`DiarioEdicao`, `DiarioResponse`)
- **Added** `services/diario-oficial-service.ts`: cliente `fetchDiarioHoje()`
- Arquivos criados:
  - `frontend/types/diario-oficial.ts`
  - `frontend/services/diario-oficial-service.ts`
- Arquivos modificados:
  - `frontend/app/portal-client.tsx`

## Validação (Diário Oficial)
- `ruff check .` — ✔ All checks passed
- `mypy .` — ✔ No issues (strict mode)
- Testes unitários do parser HTML: 10/10 passing (edição regular, suplementar, múltiplas, vazio, sem padrão, sem tamanho, traço longo, edição extra/especial)
- `npm run lint` — ✔ No ESLint warnings or errors
- `npm run type-check` — ✔ No errors
- `npm run build` — ✓ Compiled successfully (portal `/` mantém 129 kB First Load JS)
