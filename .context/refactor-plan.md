# Plano de Refatoração — Gates de Tamanho de Arquivo

> **Objetivo**: reduzir 9 arquivos violadores para ≤ 400 linhas cada.
> **Classificação**: `mudanca_mecanica` (split/extract sem mudança de comportamento).
> **Data**: 2026-04-21

## Princípios

- **Clean code para LLMs**: nomes descritivos, zero verbosidade, sem abstrações desnecessárias.
- **Cada arquivo novo deve ser auto-explicativo**: o nome diz o que tem dentro.
- **Sem dumping grounds**: cada arquivo extraído tem responsabilidade única.
- **Sem reexport barrels**: imports apontam direto para o arquivo real.
- **Testes continuam passando**: split é puramente mecânico, sem mudança de lógica.

## Regras por execução

1. Refatorar **um arquivo por vez**.
2. Rodar `python3 scripts/run_governance_gates.py` após cada refatoração.
3. Rodar testes relevantes após cada refatoração.
4. Atualizar `PROJECT_STATE.md` e `CHANGELOG` após cada lote.
5. Se um gate falhar, corrigir antes de prosseguir.
6. Seguir as regras do repositorio e suas documntações.

---

## Estado atual

| # | Arquivo | Linhas | Limite | Excesso | Fase |
|---|---------|--------|--------|---------|------|
| B1 | `backend/api/schemas.py` | 520 | 400 | +120 | 1 |
| B2 | `backend/etl/extractors/pdf_extractor.py` | 851 | 400 | +451 | 1 |
| B3 | `backend/services/scraping_service.py` | 430 | 400 | +30 | 1 |
| B4 | `backend/tests/test_etl/test_despesa_scraper.py` | 519 | 400 | +119 | 2 |
| B5 | `backend/tests/test_etl/test_scraping_service.py` | 693 | 400 | +293 | 2 |
| F1 | `frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx` | 1318 | 400 | +918 | 3 |
| F2 | `frontend/app/movimento-extra/movimento-extra-client.tsx` | 1050 | 400 | +650 | 3 |
| F3 | `frontend/components/dashboard/ForecastSection.tsx` | 557 | 400 | +157 | 4 |
| F4 | `frontend/lib/date.ts` | 412 | 400 | +12 | 4 |

---

## Fase 1 — Backend produção (agent: `backend_specialist`)

Arquivos B1, B2, B3 podem ser feitos em paralelo (sem dependência entre si).

### B1: `backend/api/schemas.py` (520 → ≤ 400)

**Estrutura atual**: 30+ classes Pydantic em monolito, agrupadas por comentários de seção.

**Estratégia**: extrair schemas por domínio em arquivos dedicados.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|-----------------|
| `backend/api/schemas_receita.py` | `ReceitaResponse`, `ReceitaListResponse`, `ReceitaFilterParams`, `ReceitaDetalhamentoResponse`, `ReceitaDetalhamentoListResponse`, `ETLStatusResponse`, enums `TipoReceitaEnum` | ~130 |
| `backend/api/schemas_despesa.py` | `DespesaResponse`, `DespesaListResponse`, `DespesaFilterParams`, enum `TipoDespesaEnum` | ~100 |
| `backend/api/schemas_kpi.py` | `KPIMensal`, `KPIAnual`, `KPIsResponse` | ~60 |
| `backend/api/schemas_forecast.py` | `ForecastPoint`, `ForecastResponse` | ~40 |
| `backend/api/schemas_scraping.py` | `ScrapingStatusResponse`, `ScrapingTriggerRequest/Response`, `ScrapingLogResponse`, `ScrapingHistoryResponse` | ~70 |
| `backend/api/schemas_licitacao.py` | `LicitacaoComprasBRItem/Response/Documento/DetailItem`, `DispensaLicitaçãoItem`, `DispensasLicitacaoResponse` | ~90 |
| `backend/api/schemas_movimento.py` | `MovimentoExtraItem`, `FundoResumo`, `MovimentoExtraResponse/AnualResponse`, `InsightItem`, `ResumoMensalItem` | ~120 |
| `backend/api/schemas.py` | `HealthCheckResponse`, `ErrorResponse`, reexports (se necessário) ou vazio | ~20 |

**Imports que precisam atualizar**: todas as routes em `backend/api/routes/` — trocar `from backend.api.schemas import X` pelo módulo correto.

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd backend && ruff check . && mypy . && pytest
```

---

### B2: `backend/etl/extractors/pdf_extractor.py` (851 → ≤ 400)

**Estrutura atual**: 1 classe `PDFExtractor` com 8 métodos + dataclasses + 12 funções helper standalone.

**Estratégia**: dividir em 3 arquivos por responsabilidade.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `backend/etl/extractors/pdf_entities.py` | `TipoDocumento`, `ReceitaDetalhamento`, `ResultadoExtracao`, `parse_valor_monetario`, `extrair_ano_do_arquivo` | ~150 |
| `backend/etl/extractors/pdf_parsers.py` | Todas as funções `_parse_*`, `_is_*_table`, `_detectar_nivel`, `_detect_tipo_from_header` (12 funções helper) | ~280 |
| `backend/etl/extractors/pdf_extractor.py` | Classe `PDFExtractor` (importa de `pdf_entities` e `pdf_parsers`) | ~250 |

**Dependências**: `pdf_extractor.py` importa de `pdf_entities` e `pdf_parsers`. Nenhum outro arquivo importa os helpers diretamente.

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd backend && ruff check . && mypy . && pytest tests/test_etl/
```

---

### B3: `backend/services/scraping_service.py` (430 → ≤ 400)

**Estrutura atual**: classe `ScrapingService` com 11 métodos. Apenas 30 linhas acima do limite.

**Estratégia**: extrair `ScrapingResult` dataclass + métodos de upsert para helper.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `backend/services/scraping_helpers.py` | `ScrapingResult`, métodos de DB (`_upsert_receitas`, `_upsert_despesas`, `_replace_detalhamento`, `_replace_*_for_year`, `_create_log`, `_finalize_log`, `_try_log_error`) | ~180 |
| `backend/services/scraping_service.py` | `ScrapingService` com orquestração (importa de helpers) | ~250 |

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd backend && ruff check . && mypy . && pytest tests/test_etl/test_scraping_service.py
```

---

## Fase 2 — Backend testes (agent: `backend_specialist`)

Depende de Fase 1 (B2 e B3) para imports atualizados. B4 e B5 podem ser feitos em paralelo.

### B4: `backend/tests/test_etl/test_despesa_scraper.py` (519 → ≤ 400)

**Estrutura atual**: 5 classes de teste independentes.

**Estratégia**: split por classe de teste em arquivos separados.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `backend/tests/test_etl/test_despesa_currency.py` | `TestParseBrazilianCurrency` (13 testes) | ~80 |
| `backend/tests/test_etl/test_despesa_classify.py` | `TestClassificarTipoDespesa` (6 testes) | ~50 |
| `backend/tests/test_etl/test_despesa_annual.py` | `TestParseDespesasAnnual` (7 testes) + fixture | ~150 |
| `backend/tests/test_etl/test_despesa_natureza.py` | `TestParseDespesasNatureza` (8 testes) + fixture | ~200 |
| `backend/tests/test_etl/test_despesa_merge.py` | `TestMergeDespesas` (6 testes) + fixture | ~120 |

**Remover**: arquivo original (conteúdo todo migrado).

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd backend && pytest tests/test_etl/ -v
```

---

### B5: `backend/tests/test_etl/test_scraping_service.py` (693 → ≤ 400)

**Estrutura atual**: testes de integração com muitos fakes inline.

**Estratégia**: extrair fakes para conftest + split por cenário.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `backend/tests/test_etl/conftest_scraping.py` | Fakes e helpers compartilhados (`_fake_session_context`, `_build_despesa`, patch factories) | ~100 |
| `backend/tests/test_etl/test_scraping_despesas.py` | Testes de scraping de despesas (cenários com annual/natureza/pdf) | ~200 |
| `backend/tests/test_etl/test_scraping_receitas.py` | Testes de scraping de receitas | ~200 |
| `backend/tests/test_etl/test_scraping_pdf_load.py` | Testes de `_load_despesas_from_pdf` | ~80 |

**Nota**: fakes são importados do conftest ou do módulo de helpers. Se a Fase 1 (B3) moveu helpers, ajustar imports.

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd backend && pytest tests/test_etl/ -v
```

---

## Fase 3 — Frontend páginas grandes (agent: `frontend_specialist`)

F1 e F2 podem ser feitos em paralelo. São os maiores arquivos e exigem mais cuidado com imports.

### F1: `frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx` (1318 → ≤ 400)

**Estrutura atual**: 1 mega-componente com parsers, calendário, modal, filtros, helpers, types, constantes.

**Estratégia**: extrair por responsabilidade em arquivos dentro do mesmo diretório.

**Arquivos novos** (em `frontend/app/avisos-licitacoes/`):
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `parsers.ts` | `parseComprasBR`, `parseDispensas`, `extrairTituloSucinto` | ~100 |
| `feriados.ts` | `getFeriados` (algoritmo de Meeus + tabela de feriados) | ~80 |
| `constants.ts` | `COMPRASBR_URL`, `QUALITY_URL`, `FONTES`, `STATUSES`, `DIAS_SEMANA`, tipos `ViewMode`, `FonteFilter`, `StatusFilter` | ~40 |
| `filters.ts` | `matchFonte`, `matchStatus`, `fmtIsoDate` | ~40 |
| `status-badge.tsx` | Componente `StatusBadge` | ~25 |
| `fonte-badge.tsx` | Componente `FonteBadge` | ~20 |
| `licitacao-modal.tsx` | Componente `LicitacaoModal` | ~240 |
| `avisos-licitacoes-client.tsx` | Componente principal (importa tudo) | ~300 |

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd frontend && npm run lint && npm run type-check && npm run build
```

---

### F2: `frontend/app/movimento-extra/movimento-extra-client.tsx` (1050 → ≤ 400)

**Estrutura atual**: 1 mega-componente com sub-componentes (TipoPill, KpiCard, FundoCard, ItemRow, etc.) + glossário + lógica de dados.

**Estratégia**: extrair sub-componentes e helpers para arquivos no mesmo diretório.

**Arquivos novos** (em `frontend/app/movimento-extra/`):
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `constants.ts` | `CURRENT_YEAR`, `YEARS`, tipos auxiliares | ~15 |
| `glossario.ts` | `getGlossaryKey`, `getGlossary` (tabela de glossário) | ~120 |
| `tipo-pill.tsx` | Componente `TipoPill` | ~30 |
| `kpi-card.tsx` | Componente `KpiCard` | ~40 |
| `tipo-badge.tsx` | Componente `TipoBadge` | ~20 |
| `fundo-card.tsx` | Componente `FundoCard` | ~130 |
| `item-row.tsx` | Componentes `ItemRow` + `ItemTableRow` | ~80 |
| `insight-card.tsx` | Componente `InsightCard` | ~70 |
| `monthly-bar.tsx` | Componente `MonthlyEvolutionBar` | ~30 |
| `movimento-extra-client.tsx` | Componente principal (importa tudo) | ~200 |

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd frontend && npm run lint && npm run type-check && npm run build
```

---

## Fase 4 — Frontend menores (agent: `frontend_specialist`)

F3 e F4 podem ser feitos em paralelo.

### F3: `frontend/components/dashboard/ForecastSection.tsx` (557 → ≤ 400)

**Estrutura atual**: muitas interfaces inline + componente principal grande.

**Estratégia**: mover interfaces para tipos, simplificar lógica inline.

**Arquivos novos**:
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `frontend/types/forecast.ts` | Interfaces `ChartRow`, `KPIAnual`, `KPIMensal`, `KPIsResponse`, `ForecastPoint`, `ForecastResponse`, `ProjectionMode` | ~100 |
| `frontend/components/dashboard/forecast-helpers.ts` | Funções de transformação de dados (chart rows, cálculos de KPI) extraídas do componente | ~100 |
| `frontend/components/dashboard/ForecastSection.tsx` | Componente principal (imports dos 2 acima) | ~300 |

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd frontend && npm run lint && npm run type-check && npm run build
```

---

### F4: `frontend/lib/date.ts` (412 → ≤ 400)

**Estrutura atual**: 35+ funções de utilidade de data, muitas provavelmente não usadas.

**Estratégia**: remover dead code. Verificar imports em todo o frontend e deletar funções não utilizadas.

**Passo a passo**:
1. Listar todas as funções exportadas.
2. Buscar usos de cada função no código (excluindo o próprio `date.ts`).
3. Remover funções com zero usos.
4. Se ainda acima de 400: mover funções de formatação para `date-format.ts` e funções de range para `date-range.ts`.

**Arquivos possíveis** (se split necessário):
| Arquivo | Conteúdo | Linhas estimadas |
|---------|----------|----------|
| `frontend/lib/date-format.ts` | `formatDatePt`, `formatMonthYear`, `formatYear`, `formatQuarter`, `formatSemester`, `formatPeriodRange` | ~80 |
| `frontend/lib/date-range.ts` | `getMonthRange`, `getYearRange`, `getQuarterRange`, `getSemesterRange`, `generate*` | ~120 |
| `frontend/lib/date.ts` | Funções restantes (core: parse, diff, add/subtract, current) | ~200 |

**Validação**:
```bash
python3 scripts/run_governance_gates.py
cd frontend && npm run lint && npm run type-check && npm run build
```

---

## Execução multi-agent

```
┌─────────────────────────────────────────────────────┐
│                    MAESTRO                           │
│  Coordena fases, valida gates, atualiza docs         │
└──────────┬──────────────────┬────────────────────────┘
           │                  │
     ┌─────▼─────┐    ┌──────▼──────┐
     │ BACKEND   │    │ FRONTEND    │
     │ SPECIALIST│    │ SPECIALIST  │
     │           │    │             │
     │ Fase 1:   │    │ Fase 3:     │
     │  B1 B2 B3 │    │  F1 || F2   │
     │ (paralelo)│    │ (paralelo)  │
     │           │    │             │
     │ Fase 2:   │    │ Fase 4:     │
     │  B4 || B5 │    │  F3 || F4   │
     │ (paralelo)│    │ (paralelo)  │
     └─────┬─────┘    └──────┬──────┘
           │                  │
     ┌─────▼──────────────────▼─────┐
     │     VALIDAÇÃO FINAL          │
     │  Gates + Tests + Build       │
     │  + Docs update               │
     └──────────────────────────────┘
```

### Ordem de execução

| Passo | Agent | Arquivo(s) | Gatilho |
|-------|-------|-----------|---------|
| 1 | `backend_specialist` | B1 + B2 + B3 em paralelo | Início |
| 2 | `maestro` | Validação Fase 1 (gates + `pytest tests/test_etl/`) | Fim passo 1 |
| 3 | `backend_specialist` | B4 + B5 em paralelo | Passo 2 ok |
| 4 | `maestro` | Validação Fase 2 (gates + `pytest`) | Fim passo 3 |
| 5 | `frontend_specialist` | F1 + F2 em paralelo | Passo 4 ok |
| 6 | `maestro` | Validação Fase 3 (gates + `npm run build`) | Fim passo 5 |
| 7 | `frontend_specialist` | F3 + F4 em paralelo | Passo 6 ok |
| 8 | `maestro` | Validação final completa (gates + backend + frontend + docs) | Fim passo 7 |

### Checklist pós-refatoração de cada arquivo

- [ ] Arquivo original ≤ 400 linhas
- [ ] Arquivos novos ≤ 400 linhas
- [ ] `python3 scripts/run_governance_gates.py` passa (ou só falha nos arquivos ainda não refatorados)
- [ ] Testes existentes passam (sem mudança de comportamento)
- [ ] `ruff check` passa (backend) / `npm run lint` passa (frontend)
- [ ] `mypy` passa (backend) / `npm run type-check` passa (frontend)
- [ ] `npm run build` passa (frontend)
- [ ] Imports atualizados em todos os consumidores

---

## Documentação viva — atualizar ao final

Após todas as fases:

- [ ] `.context/changelog/CHANGELOG_2026_04_21.md` — registrar cada split
- [ ] `.context/PROJECT_STATE.md` — remover violações resolvidas, atualizar débito
- [ ] `.context/REPOMAP.md` — adicionar novos arquivos/diretórios
- [ ] `.context/architecture.md` — se decisões estruturais mudaram

---

## Critérios de sucesso

1. `python3 scripts/run_governance_gates.py` retorna exit 0 (zero violações de file length).
2. `cd backend && ruff check . && mypy . && pytest` — tudo verde.
3. `cd frontend && npm run lint && npm run type-check && npm run build` — tudo verde.
4. Nenhum arquivo de produção ou teste acima de 400 linhas.
5. Documentação viva atualizada.
