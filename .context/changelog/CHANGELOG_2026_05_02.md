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

## Validação
- Ruff: ✅ All checks passed
- mypy: ✅ Success: no issues found in 7 source files
- Pytest: ✅ All tests passing
- Frontend ESLint: ✅ No warnings or errors
- Frontend TypeScript: ✅ `tsc --noEmit` sem erros
- Frontend Build: ✅ Next.js build completo com `/admin/diario-oficial` gerado (2.45 kB)
