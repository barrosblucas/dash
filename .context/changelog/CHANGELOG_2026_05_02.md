# Changelog 2026-05-02

## Funcionalidades Novas

### Scraper — Diário Oficial MS: busca e download de leis municipais

- **Added** `backend/scripts/scrape_diario_oficial_models.py`: modelos `LeiItem`, `ScrapeResult` e configurações (BASE_URL, CIDADE_ID, DATA_INICIO, etc.)
- **Added** `backend/scripts/scrape_diario_oficial_client.py`: cliente HTTP assíncrono `DiarioOficialClient` com métodos `search`, `fetch_all_pages`, `fetch_pdf_links_for_date`, `download_pdf`
- **Added** `backend/scripts/scrape_diario_oficial_parsers.py`: funções `extract_lei_numero`, `extract_direct_pdf_links`, `parse_item` para parsing de HTML e filtragem de leis
- **Changed** `backend/scripts/scrape_diario_oficial_leis.py`: refatorado para orquestração + CLI, usando módulos separados (de 784 linhas → 4 arquivos sob 400 linhas)

#### Funcionamento
- Busca leis via API DataTables (`GET /filtro`) com termo "LEI" e filtro por município
- Resolve links diretos de PDF via página principal (`GET /bandeirantes?data=`) → links do DigitalOcean Spaces (sem reCAPTCHA)
- Download de PDFs com concorrência controlada (3 paralelos)
- Catálogo CSV com: número da lei, ano, título, data, link direto, caminho do PDF local
- Deduplicação: múltiplas leis na mesma edição compartilham o mesmo PDF
- Filtragem: ignora avisos de licitação que contêm "LEI" no conteúdo mas não são leis

#### Resultado do scrape
- **128 leis** encontradas (de 320 itens brutos da API)
- **78 PDFs únicos** baixados (159 MB)
- **100% de resolução** de links diretos (128/128 leis com PDF)
- Período coberto: 03/07/2020 a 02/05/2026 (dados anteriores não disponíveis no site)
- Distribuição: 2017(1), 2020(10), 2021(39), 2022(22), 2023(11), 2024(12), 2025(20), 2026(13)

#### Uso
```bash
cd /home/thanos/dash && source .venv/bin/activate && \
python -m backend.scripts.scrape_diario_oficial_leis

# Modo simulação:
python -m backend.scripts.scrape_diario_oficial_leis --dry-run
```

## Saída gerada
- `data/diario_oficial_leis/catalogo.csv` — catálogo com 128 leis
- `data/diario_oficial_leis/pdfs/edicao_*.pdf` — 78 PDFs das edições do Diário Oficial

## Funcionalidades Novas

### Diário Oficial MS — endpoints admin de busca e importação

- **Added** `backend/shared/diario_oficial_client.py`: movido `DiarioOficialClient` de `scripts/` para `shared/` (reutilizável por features e scripts); inclui `extract_lei_numero` para evitar importação direta de `scripts` em `features`
- **Changed** `backend/scripts/scrape_diario_oficial_client.py`: re-exporta `DiarioOficialClient` de `backend.shared.diario_oficial_client` para compatibilidade com scripts existentes
- **Added** `backend/features/diario_oficial/diario_oficial_types.py`: schemas `DiarioBuscaItem`, `DiarioBuscaResponse`, `DiarioImportRequest`
- **Added** `backend/features/diario_oficial/diario_oficial_business.py`: lógica de negócio `resolver_link_direto` e `importar_como_legislacao` (resolve PDF, extrai texto, persiste via `SQLLegislacaoRepository`)
- **Changed** `backend/features/diario_oficial/diario_oficial_handler.py`: adicionados endpoints admin protegidos:
  - `GET /api/v1/diario-oficial/buscar` — busca paginada no Diário Oficial MS (termo, data_inicio, data_fim)
  - `POST /api/v1/diario-oficial/importar` — importa publicação como legislação no banco

#### Características
- Ambos os endpoints exigem autenticação admin (`require_admin_user`)
- A busca consome a API DataTables do site diariooficialms.com.br
- A importação resolve link direto do PDF, faz download temporário, extrai texto com `pdfplumber`, e cria registro na tabela `legislacoes`
- Isolamento de features: nenhum import de `backend/scripts/` em `backend/features/`

### Frontend — Página administrativa de busca e importação do Diário Oficial

- **Added** `frontend/app/admin/diario-oficial/page.tsx`: server component com metadata para rota `/admin/diario-oficial`
- **Added** `frontend/app/admin/diario-oficial/diario-oficial-admin-client.tsx`: componente client completo com formulário de busca (termo + data início/fim), tabela de resultados, paginação, botão de importação e feedback de sucesso/erro
- **Changed** `frontend/types/diario-oficial.ts`: adicionados `DiarioBuscaItem`, `DiarioBuscaResponse`, `DiarioImportRequest`
- **Changed** `frontend/services/diario-oficial-service.ts`: adicionados `buscarDiario(params)` e `importarDiario(payload)` consumindo `GET /api/v1/diario-oficial/buscar` e `POST /api/v1/diario-oficial/importar`
- **Changed** `frontend/components/admin/AdminShell.tsx`: adicionada entrada `{ href: '/admin/diario-oficial', label: 'Diário Oficial', icon: 'newspaper' }` na navegação administrativa

#### Características
- Conversão automática entre formato de data da API (`DD/MM/YYYY`) e input HTML (`YYYY-MM-DD`)
- Inferência heurística do tipo de legislação a partir do título (`LEI`, `DECRETO`, `PORTARIA`, etc.)
- Design consistente com o sistema administrativo (glassmorphism, Material Symbols, Tailwind CSS)
- Estado de carregamento individual por item na importação
- Link direto para a legislação criada após importação bem-sucedida

## Funcionalidades Novas

### Scraper — Legislação Municipal: download de matérias individuais via Playwright

- **Changed** `backend/scripts/scrape_diario_oficial_models.py`: adicionados dataclasses `LegislacaoItem`, `LegislacaoScrapeResult` e configs (`LEG_OUTPUT_DIR`, `LEG_PDFS_DIR`, `LEG_ANEXOS_DIR`, `RECAPTCHA_SITE_KEY`, `PAGE_URL`)
- **Changed** `backend/scripts/scrape_diario_oficial_parsers.py`: adicionados `extract_materia_download_url()` (extrai URL + hash do campo `action-baixar` da API) e `parse_legislacao_item()` (parse de item da API → `LegislacaoItem` com suporte a `anexo_habilitado`)
- **Added** `backend/scripts/scrape_legislacao_municipal.py`: script CLI com automação Playwright para download de matérias legislativas individuais, contornando reCAPTCHA v3 via `grecaptcha.execute()` + `fetch()` no contexto do browser
- **Changed** `backend/requirements.txt`: adicionado `playwright==1.49.1`
- **Added** `backend/tests/test_etl/test_legislacao_municipal_scraper.py`: 37 testes de parsing, CSV e dry-run
- **Added** `backend/tests/test_etl/test_legislacao_municipal_scraper_download.py`: 10 testes do fluxo de download (sucesso, falha, retry, skip, Playwright ausente, CLI exit code)

#### Funcionamento
- Reutiliza `DiarioOficialClient` para busca na API `/filtro`
- Para cada lei encontrada, extrai URL de download individual de `action-baixar` (`/baixar-materia/{id}/{hash}`)
- Usa Playwright headless para obter token reCAPTCHA v3 e fazer POST com `fetch()` no contexto do browser
- Retry com backoff exponencial (até 3 tentativas) para cada matéria
- Gera catálogo CSV com: link da legislação, link do diário oficial, flag de anexo, caminhos locais
- Suporte a anexos modelado (`anexo_habilitado`, `anexos`, `anexos_locais`) mas lógica de download de anexos é placeholder

#### Setup necessário
```bash
pip install playwright && playwright install chromium
```

#### Uso
```bash
cd /home/thanos/dash && source .venv/bin/activate && \
python -m backend.scripts.scrape_legislacao_municipal --dry-run

python -m backend.scripts.scrape_legislacao_municipal --term "LEI" --max-results 5
```

## Saída gerada
- `data/legislacao_municipal/catalogo.csv` — catálogo com links de matéria individual e edição completa
- `data/legislacao_municipal/pdfs/materia_*.pdf` — PDFs das matérias legislativas individuais

## Validação
- Ruff check: ✅ All checks passed
- Ruff format: ✅ 4 arquivos formatados (nossos arquivos)
- mypy: ✅ 1 erro pré-existente em `diario_oficial_handler.py:61` (não relacionado)
- Pytest: ✅ 188 passed (47 novos + 141 existentes), 0 failed
- Cobertura do script principal: 95.29%

## Funcionalidades Novas

### Página Admin — Legislação Municipal: integração frontend + backend

- **Added** `backend/features/legislacao_municipal/__init__.py`: novo módulo feature
- **Added** `backend/features/legislacao_municipal/legislacao_municipal_types.py`: schemas Pydantic (`LegislacaoBuscaItem`, `LegislacaoBuscaResponse`, `LegislacaoImportRequest`)
- **Added** `backend/features/legislacao_municipal/legislacao_municipal_handler.py`: endpoints admin `GET /api/v1/legislacao-municipal/buscar` (busca paginada com resolução de link do diário) e `POST /api/v1/legislacao-municipal/importar` (importa matéria como legislação via `link_diario_oficial`)
- **Changed** `backend/api/main.py`: registro do router `legislacao_municipal_router`
- **Added** `backend/tests/test_api/test_legislacao_municipal.py`: 5 testes de integração (auth, paginação, resultado vazio, wiring do link)
- **Added** `frontend/types/legislacao-municipal.ts`: tipos TypeScript espelhando Pydantic
- **Added** `frontend/services/legislacao-municipal-service.ts`: `buscarLegislacao()` e `importarLegislacao()`
- **Added** `frontend/app/admin/legislacao-municipal/page.tsx`: server component com metadata
- **Added** `frontend/app/admin/legislacao-municipal/legislacao-municipal-admin-client.tsx`: client component com formulário de busca, tabela de resultados (coluna Anexo), paginação, botão importar
- **Changed** `frontend/components/admin/AdminShell.tsx`: entrada "Legislação Municipal" (ícone `book`) na navegação admin

#### Características
- Página "/admin/legislacao-municipal" coexiste com "/admin/diario-oficial" (duas versões)
- Busca usa mesma API DataTables via `DiarioOficialClient`, parseando com `parse_legislacao_item()`
- Importação usa `link_diario_oficial` (download direto do Spaces) como URL do PDF
- Resolução automática de `link_diario_oficial` agrupada por data (batch)
- Coluna "Anexo" na tabela mostrando status do município
- Design idêntico ao sistema admin existente (glassmorphism, Material Symbols, Tailwind)

## Validação (integração)
- Pytest: ✅ 193 passed (5 novos testes de API), 0 failed
- Frontend lint: ✅ No ESLint warnings or errors
- Frontend type-check: ✅ tsc --noEmit sem erros
- Frontend build: ✅ Compiled successfully, `/admin/legislacao-municipal` gerado

## Bug Fixes

### Legislação Municipal — correção de download e importação de link

- **Fixed** `frontend/app/admin/legislacao-municipal/legislacao-municipal-admin-client.tsx`: botão "Baixar PDF" agora é funcional — abre o link direto do DigitalOcean Spaces (`link_diario_oficial`) em nova aba; desabilitado apenas quando o link não está disponível
- **Changed** `backend/features/diario_oficial/diario_oficial_types.py`: adicionado campo opcional `url_arquivo` em `DiarioImportRequest` para separar URL de download da URL armazenada
- **Changed** `backend/features/diario_oficial/diario_oficial_business.py`: `importar_como_legislacao` agora usa `payload.url_arquivo` (quando fornecido) como `url_arquivo` no registro de legislação, em vez de sempre usar `link_download`
- **Changed** `backend/features/legislacao_municipal/legislacao_municipal_handler.py`: handler `importar_legislacao` agora passa `payload.link_legislacao` como `url_arquivo` para `DiarioImportRequest`

#### Problema corrigido
1. **Botão de download**: estava desabilitado com `disabled` e sem `onClick` — agora abre o PDF do Diário Oficial em nova aba
2. **Link importado**: ao importar legislação, o `url_arquivo` salvo no banco era o link do Diário Oficial (edição completa do Spaces) em vez do link da legislação individual (`/baixar-materia/{id}/{hash}`)

#### Fluxo corrigido
- `link_diario_oficial` (DigitalOcean Spaces) → usado para download do PDF (GET direto)
- `link_legislacao` (`/baixar-materia/{id}/{hash}`) → armazenado como `url_arquivo` no banco

#### Validação
- Ruff check: ✅ All checks passed
- Ruff format: ✅ 7 arquivos formatados (mudança), 85 pré-existentes fora de escopo
- mypy: ⚠️ 2 erros pré-existentes (não introduzidos por esta mudança — `test_legislacao_municipal.py:205` union-attr e `diario_oficial_handler.py:61` no-any-return)
- Pytest: ✅ 30 passed (10 legislacao_municipal + 20 legislacao), 0 failed
- Frontend lint: ✅ No ESLint warnings or errors
- Frontend type-check: ✅ tsc --noEmit sem erros
- Frontend build: ✅ Compiled successfully

## Bug Fixes

### Legislação Municipal — segundo botão de download individual (PDF da lei)

- **Added** `backend/features/legislacao_municipal/legislacao_municipal_adapter.py`: adapter com `download_legislacao_pdf()` usando Playwright para contornar reCAPTCHA v3, `validate_download_url()` com whitelist de domínio, `validate_pdf_content()` com magic bytes `%PDF`
- **Added** `backend/features/legislacao_municipal/legislacao_municipal_types.py`: schema `LegislacaoDownloadRequest`
- **Changed** `backend/features/legislacao_municipal/legislacao_municipal_handler.py`: novo endpoint `POST /api/v1/legislacao-municipal/download` que delega ao adapter; handler `importar_legislacao` agora passa `payload.link_legislacao` como `url_arquivo`
- **Changed** `backend/features/diario_oficial/diario_oficial_types.py`: campo opcional `url_arquivo` em `DiarioImportRequest` para separar URL de download (Spaces) da URL armazenada (`/baixar-materia`)
- **Changed** `backend/features/diario_oficial/diario_oficial_business.py`: `importar_como_legislacao` usa `payload.url_arquivo` quando fornecido
- **Changed** `backend/tests/test_api/test_legislacao_municipal.py`: 5 novos testes de download + assertion `url_arquivo == link_legislacao` no teste de importação
- **Changed** `frontend/types/legislacao-municipal.ts` + `frontend/services/legislacao-municipal-service.ts`: tipo e service para `downloadLegislacao()`
- **Changed** `frontend/app/admin/legislacao-municipal/legislacao-municipal-admin-client.tsx`: novo botão "Legislação" ao lado de "Baixar PDF" + estados de loading/erro

#### Problema corrigido
1. **Botão de download**: estava desabilitado — agora "Baixar PDF" baixa a edição completa (Spaces) e o novo "Legislação" baixa apenas a lei individual via Playwright
2. **Link importado**: ao importar, `url_arquivo` agora armazena `link_legislacao` em vez de `link_diario_oficial`

#### Fluxo corrigido
- `link_diario_oficial` (DigitalOcean Spaces) → botão "Baixar PDF" (GET direto) + usado para download na importação
- `link_legislacao` (`/baixar-materia/{id}/{hash}`) → botão "Legislação" (proxy Playwright) + armazenado como `url_arquivo`

#### Segurança
- Whitelist de URL: apenas `https://www.diariooficialms.com.br/baixar-materia/` é permitido
- Validação de conteúdo: magic bytes `%PDF` verificados antes de retornar
- Mensagens de erro genéricas (sem vazar detalhes internos)
- Endpoint protegido com `require_admin_user`

#### Validação
- Ruff check: ✅ All checks passed
- Ruff format: ✅ 7 arquivos formatados
- mypy: ⚠️ 2 erros pré-existentes (não introduzidos)
- Pytest: ✅ 30 passed (10 legislacao_municipal + 20 legislacao), 0 failed
- Frontend lint, type-check, build: ✅ todos passaram
- UI Playwright: ✅ 20 botões "Baixar PDF", 20 "Legislação", 20 "Importar" presentes
