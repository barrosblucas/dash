# Auditoria de Maturidade AI-Native — Repositório DASH

> **Data:** 2026-04-21
> **Classificação:** Nível 3 — AI-Ready | Score: **70.5 / 100**
> **Projeto:** Dashboard Financeiro Municipal — Prefeitura de Bandeirantes MS

---

## Visão Geral do Repositório

| Aspecto | Valor |
|---------|-------|
| **Backend** | 73 arquivos Python, ~10.839 linhas |
| **Frontend** | 87 arquivos TS/TSX, ~10.765 linhas |
| **Testes** | 19 arquivos de teste |
| **Features backend** | 8 (receitas, despesas, forecast, kpis, licitacoes, movimento_extra, scraping, export) |
| **Páginas frontend** | 12 rotas de página |
| **Organização** | Camada técnica (layer-first) |

---

## FASE 1 — Resultado da Auditoria

### BLOCO 1 — Contexto para Agentes de IA (peso: 30%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 1.1 | Arquivo de contexto AI existe | **3** | `AGENTS.md` na raiz + `AI-GOVERNANCE.md` em `.context/` — ambos bem estruturados |
| 1.2 | Descreve propósito, domínio e stack | **3** | AI-GOVERNANCE descreve claramente: "Dashboard Financeiro Municipal", stack completo, domínio orçamentário |
| 1.3 | Decisões arquiteturais documentadas (ADRs) | **3** | `architecture.md` com decisões explícitas: "Feature-first dentro de cada camada", regras de dependência |
| 1.4 | Explica o "porquê" das decisões | **2** | Documenta o quê muito bem, mas faltam justificativas de trade-off (ex: por que layer-first e não vertical slicing) |
| 1.5 | Arquivo de regras para agente existe | **0** | Não existe `.cursorrules`, `.windsurfrules` ou `copilot-instructions.md` |
| 1.6 | Regras cobrem estilo, padrões proibidos, convenções | **2** | `AGENTS.md` cobre estilo e convenções, mas falta um arquivo dedicado para regras do editor/IDE |

**Score do Bloco 1: 13/18 → normalizado: 2.17/3 → ponderado: 21.7/30**

---

### BLOCO 2 — Documentação Estrutural (peso: 20%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 2.1 | README.md otimizado para onboarding rápido | **0** | **Não existe README.md na raiz.** Frontend tem README com design system apenas |
| 2.2 | CONVENTIONS.md ou equivalente existe | **2** | Convenções documentadas dentro de `AI-GOVERNANCE.md` (naming, feature-first, imports) |
| 2.3 | Convenções cobrem nomenclatura, pastas, imports | **2** | AI-GOVERNANCE cobre naming por tipo, estrutura de pastas, regras de import |
| 2.4 | CONTRIBUTING.md existe | **0** | Ausente. Fluxo de branches/commits/PRs não documentado |
| 2.5 | Diagrama de arquitetura existe | **2** | `architecture.md` tem diagrama ASCII das camadas e dependências |
| 2.6 | Estrutura de pastas explicada | **3** | `REPOMAP.md` descreve cada pasta e arquivo com propósito — excelente |

**Score do Bloco 2: 9/18 → normalizado: 1.50/3 → ponderado: 10.0/20**

---

### BLOCO 3 — Qualidade do Código — LLM-Readable (peso: 25%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 3.1 | Funções pequenas e SRP | **2** | Boa separação na maioria, mas `ForecastingService` (125+ linhas em 1 método) e `ScrapingService` têm métodos longos |
| 3.2 | Nomes semânticos e descritivos | **3** | Nomes excelentes: `_parse_brazilian_currency`, `_classificar_tipo_despesa`, `_remove_partial_current_month` |
| 3.3 | Tipos centralizados em local dedicado | **2** | Backend: schemas Pydantic por feature + `schemas.py` legado. Frontend: `types/` com 8 arquivos bem organizados |
| 3.4 | Docstrings/JSDoc em funções públicas | **2** | Python tem docstrings completas (Google style). Frontend TSX não tem TSDoc |
| 3.5 | Sem magia implícita | **2** | Constantes bem nomeadas (`MESES_MAP`, `_MAX_RETRIES`). Exceção: `_REALTIME_API_YEAR = 2026` hardcoded em `scraping_service.py` |
| 3.6 | Tratamento de erros explícito e padronizado | **2** | HTTPException com schema ErrorResponse. Handler global. Falta: erro de domínio tipado (não só HTTP) |
| 3.7 | Logs estruturados | **2** | Usa `logging.getLogger(__name__)` consistentemente. Não é JSON mas é padronizado. Sem PII nos logs |

**Score do Bloco 3: 15/21 → normalizado: 2.14/3 → ponderado: 17.9/25**

---

### BLOCO 4 — Contratos e Interfaces (peso: 15%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 4.1 | Contrato de API documentado | **3** | FastAPI gera OpenAPI automaticamente. `/docs` e `/redoc` disponíveis com descrição completa |
| 4.2 | Schema de banco versionado | **2** | SQLAlchemy models em `models.py` centralizado. Sem migrations versionadas (sem Alembic) |
| 4.3 | Variáveis de ambiente documentadas | **2** | `backend/.env.example` existe com descrições em PT-BR por seção. Frontend também tem `.env.example` |
| 4.4 | Interfaces de domínio separadas de DTOs | **3** | Excelente separação: `domain/entities/` (dataclasses puras), `api/schemas_*.py` (Pydantic DTOs), `domain/repositories/` (Protocol interfaces) |

**Score do Bloco 4: 10/12 → normalizado: 2.50/3 → ponderado: 12.5/15**

---

### BLOCO 5 — Testes como Documentação Viva (peso: 10%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 5.1 | Testes com nomes descritivos | **2** | Nomes como `test_despesa_classify`, `test_despesa_currency`, `test_scraping_pdf_load` — funcionais mas sem padrão `should/given/when/then` |
| 5.2 | Cobrem casos de borda | **2** | Cobrem parsing de currency (negativo, vazio, None), merge com fallback, HTML vazio/sem tbody |
| 5.3 | Cobertura com thresholds | **2** | pytest-cov configurado com `--cov-report=term-missing`, mas sem threshold mínimo definido (não falha se cobertura baixa) |

**Score do Bloco 5: 6/9 → normalizado: 2.00/3 → ponderado: 6.7/10**

---

### BLOCO 6 — Isolamento e Controle de Contexto (peso: 5%)

| # | Critério | Nota | Observação |
|---|----------|------|------------|
| 6.1 | `.aiignore` existe | **0** | Ausente. Nenhum arquivo de exclusão para ferramentas de IA |
| 6.2 | `.gitignore` bem configurado | **3** | Cobertura completa: dependencies, Python cache, build, IDEs, env, logs, OS |
| 6.3 | Prompts reutilizáveis em pasta dedicada | **0** | Não existe diretório `prompts/` |

**Score do Bloco 6: 3/9 → normalizado: 1.00/3 → ponderado: 1.7/5**

---

## Score Geral

| Bloco | Peso | Nota Média | Score Ponderado |
|-------|------|-----------|-----------------|
| 1. Contexto para AI | 30% | 2.17/3 | **21.7** |
| 2. Documentação Estrutural | 20% | 1.50/3 | **10.0** |
| 3. Qualidade do Código | 25% | 2.14/3 | **17.9** |
| 4. Contratos e Interfaces | 15% | 2.50/3 | **12.5** |
| 5. Testes | 10% | 2.00/3 | **6.7** |
| 6. Isolamento de Contexto | 5% | 1.00/3 | **1.7** |
| **TOTAL** | **100%** | | **70.5 / 100** |

### Classificação

| Score | Nível | Descrição |
|-------|-------|-----------|
| 0–30 | 🔴 Nível 1 — AI-Unaware | Repositório ignora agentes de IA |
| 31–50 | 🟠 Nível 2 — AI-Assisted | IA consegue ajudar, mas com muito atrito |
| 51–70 | 🟡 Nível 3 — AI-Ready | Base sólida, mas com gaps críticos |
| **71–85** | **🟢 Nível 4 — AI-Native** | **Repositório preparado para agentes** |
| 86–100 | 🚀 Nível 5 — AI-First | Infraestrutura de feedback completa |

> **Resultado: 🟡 Nível 3 — AI-Ready (70.5/100)**
>
> Base sólida para agentes de IA, com gaps críticos em documentação estrutural e isolamento de contexto. A infraestrutura de governança (`AI-GOVERNANCE.md`, `REPOMAP.md`, gates de pre-commit) é **excepcional** para um repositório deste porte — o diferenciador está na ausência de documentos convencionais (README, CONTRIBUTING) e na organização layer-first que dispersa o contexto por camada.

---

## Top 3 Gaps Críticos

### 1. Sem README.md na raiz (Nota: 0)

**Impacto:** Sem README, nenhum agente de IA (nem humano) consegue onboarding em <5 minutos. É o primeiro arquivo que qualquer ferramenta busca. O repositório tem documentação excelente em `.context/`, mas ela é invisível para ferramentas que procuram arquivos convencionais.

**Evidência:** Frontend tem README mas focado em design system, não em setup.

### 2. Organização Layer-First dispersa contexto por camada

**Impacto:** Para entender a feature "receita", um agente precisa abrir 6+ arquivos em 4 camadas diferentes (`api/routes/receitas.py` → `api/schemas_receita.py` → `domain/entities/receita.py` → `domain/repositories/receita_repository.py` → `infrastructure/repositories/sql_receita_repository.py` → `services/`). Cada jump consome tokens e perde contexto.

**Evidência:** 73 arquivos backend organizados por `api/`, `domain/`, `infrastructure/`, `services/`, `etl/`.

### 3. Sem `.aiignore` e sem arquivo de regras do editor (`.cursorrules`) (Nota: 0)

**Impacto:** Ferramentas como Cursor, Windsurf, Aider incluem `node_modules/`, `.mypy_cache/`, `package-lock.json` no contexto, desperdiçando tokens em ruído. Sem regras do editor, cada agente reinventa interpretação da codebase.

**Evidência:** `.gitignore` existe mas `.aiignore` não.

---

## Quick Wins (impacto alto, esforço < 1 hora)

### 1. Criar `README.md` na raiz

```markdown
# Dashboard Financeiro Municipal — Bandeirantes MS

## Setup rápido
```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn backend.api.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Docker
docker compose up --build
```

## Stack: Python 3.13 + FastAPI | Next.js 14 + TypeScript | SQLite + Prophet
## Docs: `.context/AI-GOVERNANCE.md` | `.context/architecture.md` | `.context/REPOMAP.md`
```

### 2. Criar `.aiignore`

```
node_modules/
.next/
__pycache__/
.mypy_cache/
.pytest_cache/
.ruff_cache/
.git/
*.db
*.sqlite
package-lock.json
coverage/
venv/
.venv/
*.png
*.jpg
```

### 3. Criar `.cursorrules`

```
Você é o desenvolvedor sênior deste repositório.
Leia .context/AI-GOVERNANCE.md antes de editar.
Organização: feature-first dentro de cada camada.
Backend: FastAPI + SQLAlchemy + Pydantic. Frontend: Next.js + React + TypeScript.
Nunca importe de backend/ no frontend.
Rode ruff + mypy + pytest antes de finalizar.
```

### 4. Adicionar `fail_under` no coverage

```toml
# pyproject.toml
[tool.coverage.report]
fail_under = 60  # threshold mínimo
```

### 5. Criar `CONTRIBUTING.md` mínimo

```markdown
# Contribuindo
- Branches: feat/, fix/, refactor/
- Commits: conventional commits
- PRs: rodar `python scripts/run_governance_gates.py` antes
- Validação: `cd backend && ruff check . && mypy . && pytest`
```

---

---

## FASE 2 — Plano de Refatoração AI-Native

### Refatoração 1 — Transição para Bounded Contexts Verticais

#### Diagnóstico Atual

A organização atual é **layer-first (por camada técnica)**:

```
backend/
  api/routes/          → Todos os controllers juntos
  api/schemas_*.py     → Todos os schemas juntos
  domain/entities/     → Todas as entidades juntas
  domain/repositories/ → Todas as interfaces juntas
  infrastructure/repositories/ → Todas as implementações juntas
  services/            → Todos os serviços juntos
  etl/                 → Pipeline de ingestão
```

**Problema para LLMs:** Para entender ou modificar a feature "despesa", um agente precisa navegar 6+ arquivos em 5 diretórios diferentes. Cada salto de arquivo é uma chance de perder contexto.

#### Estrutura Proposta

```
backend/
  features/
    receita/
      receita_handler.py        ← Routes HTTP
      receita_business.py       ← Regras de domínio puras
      receita_data.py           ← Queries/persistência
      receita_types.py          ← Entidades + schemas Pydantic + Protocol
      receita_scraper.py        ← Scraper específico da feature
      test_receita.py           ← Testes de comportamento
    despesa/
      despesa_handler.py
      despesa_business.py
      despesa_data.py
      despesa_types.py
      despesa_scraper.py
      test_despesa.py
    forecast/
      forecast_handler.py
      forecast_business.py      ← Lógica Prophet isolada
      forecast_types.py
      test_forecast.py
    licitacao/
      licitacao_handler.py
      licitacao_adapter.py      ← ACL para APIs externas (ComprasBR, Quality)
      licitacao_types.py
      test_licitacao.py
    kpi/
      kpi_handler.py
      kpi_business.py
      kpi_types.py
    movimento_extra/
      movimento_extra_handler.py
      movimento_extra_types.py
    scraping/
      scraping_handler.py
      scraping_orchestrator.py  ← Coordenação do pipeline
      scraping_types.py
    export/
      export_handler.py
      export_types.py
  shared/
    database/
      connection.py             ← Engine, session, DB manager
      models.py                 ← ORM models (todos, pois são schema compartilhado)
    pdf_extractor.py            ← Extração genérica de PDF
    logging_config.py           ← Configuração de logging
  api/
    main.py                     ← Montagem da app, registro de routers
```

#### Exemplo de Migração Concreto — Feature "Receita"

```
ANTES (6 arquivos em 4 camadas):
backend/
  api/routes/receitas.py                    (96 linhas)
  api/schemas_receita.py                    (~80 linhas)
  domain/entities/receita.py                (~90 linhas)
  domain/repositories/receita_repository.py  (~130 linhas)
  infrastructure/repositories/sql_receita_repository.py  (~250 linhas)
  etl/scrapers/receita_scraper.py           (~200 linhas)

DEPOIS (4 arquivos em 1 diretório):
backend/
  features/receita/
    receita_types.py         ← Entidade + Enum + Protocol + Schemas Pydantic (~170 linhas)
    receita_handler.py       ← Routes HTTP (~96 linhas)
    receita_data.py          ← SQL Repository + queries (~250 linhas)
    receita_scraper.py       ← Scraper específico (~200 linhas)
    test_receita.py          ← Testes de comportamento
```

**Ganho para LLM:** Um agente abre `features/receita/` e vê TUDO que precisa para trabalhar na feature em 4 arquivos ao invés de 6 em 4 diretórios.

---

### Refatoração 2 — Achatamento (Flattening) de Features

#### As 3 features com mais arquivos dispersos

| Feature | Arquivos hoje | Arquivos propostos |
|---------|--------------|-------------------|
| **Despesa** | 7 (`routes/despesas.py`, `schemas_despesa.py`, `entities/despesa.py`, `repositories/` (sem interface!), `sql_despesa_repository.py`, `scrapers/despesa_scraper.py`, `services/scraping_helpers.py`) | 4 (`despesa_types.py`, `despesa_handler.py`, `despesa_data.py`, `despesa_scraper.py`) |
| **Scraping/ETL** | 6 (`routes/scraping.py`, `scraping_service.py`, `scraping_helpers.py`, `scraping_scheduler.py`, `expense_pdf_sync_service.py`, `historical_data_bootstrap_service.py`) | 3 (`scraping_handler.py`, `scraping_orchestrator.py`, `scraping_types.py`) |
| **Receita** | 6 (`routes/receitas.py`, `schemas_receita.py`, `entities/receita.py`, `repositories/receita_repository.py`, `sql_receita_repository.py`, `scrapers/receita_scraper.py`) | 4 (`receita_types.py`, `receita_handler.py`, `receita_data.py`, `receita_scraper.py`) |

#### Exemplo de achatamento — `despesa_types.py` consolidado

```python
"""Tipos, entidades e contratos do domínio Despesa.

Contém: entidade de domínio, enum de tipo, schemas Pydantic de entrada/saída.
Sem imports de SQLAlchemy, FastAPI ou HTTP.
"""

from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums de domínio ──

class TipoDespesa(str, Enum):
    """Tipos de despesa municipal."""
    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"
    CONTINGENCIA = "CONTINGENCIA"


# ── Entidade de domínio (pura) ──

@dataclass
class Despesa:
    """Entidade representando uma despesa municipal."""
    ano: int
    mes: int
    valor_empenhado: Decimal
    valor_liquidado: Decimal
    valor_pago: Decimal
    categoria: str
    tipo: TipoDespesa
    subcategoria: Optional[str] = None
    fonte: str = ""
    id: Optional[int] = None

    @property
    def is_zero(self) -> bool:
        return (
            self.valor_empenhado == self.valor_liquidado == self.valor_pago == Decimal("0")
        )


# ── Schemas Pydantic (contratos HTTP) ──

class DespesaResponse(BaseModel):
    """Schema de resposta para despesa."""
    id: Optional[int] = None
    ano: int = Field(..., ge=2013, le=2030)
    mes: int = Field(..., ge=1, le=12)
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    tipo: TipoDespesa
    valor_empenhado: Decimal
    valor_liquidado: Decimal
    valor_pago: Decimal
    fonte: str


class DespesaListResponse(BaseModel):
    """Schema de resposta paginada para lista de despesas."""
    despesas: list[DespesaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
```

**Resultado:** Lógica de negócio testável sem mock de SQLAlchemy. Entidade de domínio pura. Schemas Pydantic no mesmo arquivo para visibilidade imediata.

---

### Refatoração 3 — Limites Arquiteturais de Baixo Custo

#### 3a. Tipos Fortes como Contratos entre Módulos

**Módulos mais críticos e seus contratos:**

**Receita:**

```python
# features/receita/receita_types.py

# Contrato de ENTRADA do handler
class ReceitaQueryParams:
    ano: int | None
    mes: int | None
    categoria: str | None
    tipo: TipoReceita | None
    page: int
    page_size: int

# Contrato de SAÍDA do handler
class ReceitaListResult:
    receitas: list[Receita]
    total: int
    has_next: bool

# Contrato de ENTRADA do scraper
class ReceitaScrapingInput:
    year: int
    raw_monthly: list[dict[str, Any]]
    raw_detail: list[dict[str, Any]]

# Contrato de SAÍDA do data layer
class ReceitaUpsertResult:
    inserted: int
    updated: int
```

**Forecast:**

```python
# features/forecast/forecast_types.py

# Contrato de ENTRADA
class ForecastRequest:
    horizonte_meses: int = 12
    nivel_confianca: float = 0.95

# Contrato de SAÍDA
@dataclass
class ForecastResult:
    data: date
    valor_previsto: Decimal
    intervalo_inferior: Decimal
    intervalo_superior: Decimal
    tendencia: str  # "alta" | "baixa" | "estavel"

# Contrato do data provider (injeta no business)
class ForecastDataProvider(Protocol):
    def get_receitas_mensais(self) -> list[tuple[datetime, float]]: ...
    def get_despesas_mensais(self) -> list[tuple[datetime, float]]: ...
```

**Licitação (ACL para APIs externas):**

```python
# features/licitacao/licitacao_types.py

# Contrato limpo de SAÍDA (domínio)
class LicitacaoSummary:
    id: str
    modalidade: str  # "pregao" | "concorrencia" | "dispensa" | "tomada_preco"
    status: str      # "aberto" | "encerrado" | "andamento"
    objeto: str
    data_abertura: date | None
    valor_estimado: Decimal | None
    orgao: str
    fonte: str       # "comprasbr" | "quality"

# Contrato do adaptador externo
class LicitacaoExternalSource(Protocol):
    async def fetch_summary(self, page: int, size: int) -> list[LicitacaoSummary]: ...
    async def fetch_detail(self, id: str) -> LicitacaoDetail | None: ...
```

#### 3b. Regras de Linter para Impedir Imports Cruzados

**Backend — gate de governança (`scripts/check_cross_feature_imports.py`):**

```python
"""Gate: impede imports diretos entre features."""
import re
from pathlib import Path

FEATURES_DIR = Path("backend/features")

def check_file(filepath: Path) -> list[str]:
    """Retorna violações de import cruzado."""
    violations = []
    content = filepath.read_text()
    parts = filepath.parts
    feature_idx = parts.index("features") + 1 if "features" in parts else -1
    if feature_idx < 0 or feature_idx >= len(parts):
        return violations
    own_feature = parts[feature_idx]

    import_pattern = re.compile(r"from backend\.features\.(\w+)")
    for line_no, line in enumerate(content.splitlines(), 1):
        for match in import_pattern.finditer(line):
            imported_feature = match.group(1)
            if imported_feature != own_feature:
                violations.append(
                    f"{filepath}:{line_no} — cross-feature import: "
                    f"{own_feature} → {imported_feature}"
                )
    return violations
```

**Frontend — regras no `.eslintrc.js`:**

```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@tanstack/query/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    // ... existing rules ...
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['../avisos-licitacoes/*'],
          message: 'Cross-page import bloqueado. Use types/ ou hooks/ compartilhados.'
        },
        {
          group: ['../movimento-extra/*'],
          message: 'Cross-page import bloqueado. Use types/ ou hooks/ compartilhados.'
        },
        {
          group: ['../../backend/*'],
          message: 'Frontend não pode importar de backend/. Use a API.'
        },
      ],
    }],
  },
};
```

#### 3c. Testes Focados em Comportamento

**Exemplo 1 — Despesa Scraper:**

```python
# ANTES: teste de implementação (frágil)
def test_parse_annual_entry_extracts_month_correctly():
    scraper = DespesaScraper()
    registro = {"mes": "Janeiro", "empenhado": "1.000,00", "liquidado": "900,00", "pago": "800,00"}
    result = scraper._parse_annual_entry(registro, 2024)  # testa método privado!
    assert result.mes == 1

# DEPOIS: teste de comportamento (robusto, documenta regra de negócio)
def test_should_parse_annual_expense_record_into_despesa_entity():
    """Dado um registro anual com valores válidos,
    retorna uma Despesa com mês, valores e tipo corretos."""
    scraper = DespesaScraper()
    registros = [{"mes": "Janeiro", "empenhado": "1.000,00",
                   "liquidado": "900,00", "pago": "800,00"}]
    resultado = scraper.parse_despesas_annual(
        {"0": registros[0], "quantidade": 1}, 2024
    )

    assert len(resultado) == 1
    despesa = resultado[0]
    assert despesa.ano == 2024
    assert despesa.mes == 1
    assert despesa.valor_empenhado == Decimal("1000.00")
    assert despesa.valor_pago == Decimal("800.00")
    assert despesa.fonte == "SCRAPING_2024"
```

**Exemplo 2 — Forecasting Service:**

```python
# ANTES: teste que depende de mock de Prophet
def test_forecast_calls_prophet_fit():
    service = ForecastingService(mock_db)
    with patch("backend.domain.services.forecasting_service.Prophet") as mock_prophet:
        service.forecast_receitas(horizonte_meses=6)
        mock_proponent_instance.fit.assert_called_once()  # testa implementação!

# DEPOIS: teste de comportamento com dados reais mínimos
def test_should_produce_forecast_with_valid_confidence_intervals():
    """Dado dados históricos suficientes (24+ meses),
    o forecast retorna predições com intervalo inferior <= previsto <= superior."""
    service = ForecastingService(db_with_24_months_of_data)
    resultados = service.forecast_receitas(horizonte_meses=3)

    assert len(resultados) == 3
    for resultado in resultados:
        assert resultado.intervalo_inferior <= resultado.valor_previsto
        assert resultado.valor_previsto <= resultado.intervalo_superior
        assert resultado.tendencia in ("alta", "baixa", "estavel")

def test_should_fallback_to_linear_projection_with_insufficient_data():
    """Dado menos de 24 meses de dados,
    o forecast degrada para projeção linear em vez de falhar."""
    service = ForecastingService(db_with_5_months_of_data)
    resultados = service.forecast_receitas(horizonte_meses=3)

    assert len(resultados) == 3  # não falhou, degradou
    for r in resultados:
        assert r.valor_previsto > 0
```

---

### Refatoração 4 — Anti-Corruption Layer "Por Dor"

#### Análise de Integrações Externas

| Integração | Justifica ACL? | Motivo | Recomendação |
|------------|---------------|--------|--------------|
| **QualitySistemas (Receitas API)** | **Sim** | API proprietária, mudou formato recentemente (ex: barra dupla em URLs), sem documentação oficial, scraping frágil | **Manter e fortalecer ACL** |
| **QualitySistemas (Despesas API)** | **Sim** | Mesmos riscos acima + múltiplos endpoints com estratégia de merge (annual + natureza) | **Manter e fortalecer ACL** |
| **ComprasBR API (Licitações)** | **Sim** | API governamental federal, contrato complexo, pode mudar sem aviso, requer parsing de campos aninhados | **Manter ACL** |
| **QualitySistemas HTML (Dispensas)** | **Sim** | Scraping de HTML com selectolax, altamente frágil a mudanças de layout | **Manter ACL** |
| **PDFs financeiros (ETL)** | **Sim** | Formato de PDF muda por ano, parsing com pdfplumber é intrinsecamente frágil | **Manter ACL** |
| **Prophet (ML)** | **Não** | Biblioteca estável, bem documentada, sem risco de troca de provider | **Remover abstração** — chamar Prophet diretamente |

#### ACL Fortalecida — Exemplo: QualitySistemas Adapter

```python
# features/receita/receita_scraper.py (ACL existente, proposta de fortalecimento)

"""
Anti-Corruption Layer para o portal QualitySistemas.

Isola o domínio "receita" do contrato externo do portal de transparência.
Se o portal mudar formato, APENAS este arquivo precisa ser atualizado.
"""

from typing import Any

from backend.features.receita.receita_types import Receita, ReceitaScrapingInput


class QualityReceitaAdapter:
    """Transforma payload bruto do QualitySistemas em entidades de domínio."""

    def parse_monthly(self, raw: list[dict[str, Any]], year: int) -> list[Receita]:
        """Converte payload mensal bruto em entidades Receita.

        Regra de negócio: valores zerados são omitidos.
        """
        receitas = []
        for item in raw:
            categoria = item.get("categoria", "").strip()
            if not categoria:
                continue
            # ... transformação isolada ...
        return receitas

    def parse_detail(self, raw: list[dict[str, Any]], year: int) -> list[ReceitaDetalhamento]:
        """Converte payload de detalhamento em entidades."""
        # ... transformação isolada ...
```

#### Prophet — Remover Abstração Desnecessária

```python
# ANTES: ForecastingService abstrai Prophet com ForecastResult customizado
class ForecastingService:
    def __init__(self, db: Session):  # depende de SQLAlchemy Session!
        self.db = db
    # ... 125+ linhas ...

# DEPOIS: Prophet chamado diretamente, lógica de domínio separada
# features/forecast/forecast_business.py

from prophet import Prophet
import pandas as pd

def forecast_timeseries(
    dados: list[tuple[datetime, float]],
    horizonte_meses: int = 12,
    nivel_confianca: float = 0.95,
) -> list[ForecastResult]:
    """Prevê série temporal usando Prophet.

    Pura: sem dependência de banco, HTTP ou framework.
    Testável: basta passar uma lista de tuplas.
    """
    if len(dados) < 24:
        return linear_projection(dados, horizonte_meses)

    df = pd.DataFrame(dados, columns=["ds", "y"])
    modelo = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        interval_width=nivel_confianca,
    )
    modelo.fit(df)
    futuro = modelo.make_future_dataframe(periods=horizonte_meses, freq="MS")
    previsao = modelo.predict(futuro)

    return _extract_results(previsao, horizonte_meses)

# features/forecast/forecast_data.py
def get_receitas_mensais(db: Session) -> list[tuple[datetime, float]]:
    """Provider de dados para o forecast. Único ponto que toca SQLAlchemy."""
    # ... query ...

# features/forecast/forecast_handler.py
@router.get("/receitas")
async def forecast_receitas(horizonte: int = 12, db: Session = Depends(get_db)):
    dados = get_receitas_mensais(db)
    resultados = forecast_timeseries(dados, horizonte)
    return [r.to_dict() for r in resultados]
```

---

## Plano de Execução Priorizado

| Prioridade | Refatoração | Módulos Afetados | Esforço | Impacto LLM-Readability |
|------------|------------|-------------------|---------|------------------------|
| **1** | Criar README.md + `.aiignore` + `.cursorrules` | Raiz | **Baixo** (1h) | **Alto** — primeiro contato do agente |
| **2** | Migrar `ForecastingService` para `features/forecast/` com separação business/data | forecast | **Baixo** (2h) | **Alto** — exemplo canônico para as próximas migrações |
| **3** | Migrar feature "Despesa" para `features/despesa/` | despesa, scraping | **Médio** (4h) | **Alto** — feature mais complexa, valida o padrão |
| **4** | Migrar feature "Receita" para `features/receita/` | receita | **Médio** (3h) | **Médio** — segue padrão validado |
| **5** | Migrar feature "Licitação" com ACL fortalecida | licitacao | **Médio** (3h) | **Alto** — integração externa mais frágil |
| **6** | Criar gate de cross-feature imports | infra | **Baixo** (1h) | **Médio** — enforcement automático |
| **7** | Reescrever testes de implementação como testes de comportamento | testes | **Médio** (4h) | **Médio** — documentação viva |
| **8** | Migrar remaining features (kpi, movimento_extra, scraping, export) | remaining | **Médio** (6h) | **Médio** — consistência |
| **9** | Criar CONTRIBUTING.md + `fail_under` no coverage | docs | **Baixo** (30min) | **Baixo** |

---

## Estrutura Final Proposta

```
dash/
├── AGENTS.md                          # Regras do agente (existente)
├── README.md                          # Setup rápido (NOVO)
├── .cursorrules                       # Regras do editor (NOVO)
├── .aiignore                          # Exclusões para IA (NOVO)
├── .gitignore                         # (existente)
├── .pre-commit-config.yaml            # Gates de governança (existente)
├── docker-compose.yml                 # (existente)
├── dev.sh                             # (existente)
│
├── .context/
│   ├── AI-GOVERNANCE.md               # Fonte canônica de regras
│   ├── architecture.md                # Decisões arquiteturais
│   ├── REPOMAP.md                     # Mapa atualizado
│   ├── PROJECT_STATE.md               # Estado do projeto
│   ├── audit-ai-native-2026-04-21.md  # Este documento
│   └── changelog/                     # Changelog diário
│
├── backend/
│   ├── api/
│   │   └── main.py                    # Montagem da app, registro de routers
│   ├── features/
│   │   ├── receita/
│   │   │   ├── receita_types.py       # Entidade + Enums + Schemas + Protocol
│   │   │   ├── receita_handler.py     # Routes HTTP
│   │   │   ├── receita_data.py        # SQL Repository
│   │   │   ├── receita_scraper.py     # ACL QualitySistemas
│   │   │   └── test_receita.py        # Testes de comportamento
│   │   ├── despesa/
│   │   │   ├── despesa_types.py
│   │   │   ├── despesa_handler.py
│   │   │   ├── despesa_data.py
│   │   │   ├── despesa_scraper.py
│   │   │   └── test_despesa.py
│   │   ├── forecast/
│   │   │   ├── forecast_types.py
│   │   │   ├── forecast_handler.py
│   │   │   ├── forecast_business.py   # Prophet isolado, testável
│   │   │   ├── forecast_data.py       # Provider de dados
│   │   │   └── test_forecast.py
│   │   ├── licitacao/
│   │   │   ├── licitacao_types.py
│   │   │   ├── licitacao_handler.py
│   │   │   ├── licitacao_adapter.py   # ACL ComprasBR + Quality HTML
│   │   │   └── test_licitacao.py
│   │   ├── kpi/
│   │   │   ├── kpi_types.py
│   │   │   └── kpi_handler.py
│   │   ├── movimento_extra/
│   │   │   ├── movimento_extra_types.py
│   │   │   └── movimento_extra_handler.py
│   │   ├── scraping/
│   │   │   ├── scraping_types.py
│   │   │   ├── scraping_handler.py
│   │   │   └── scraping_orchestrator.py
│   │   └── export/
│   │       ├── export_types.py
│   │       └── export_handler.py
│   ├── shared/
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── models.py
│   │   ├── pdf_extractor.py
│   │   └── logging_config.py
│   ├── tests/                         # Testes de integração cross-feature
│   │   └── test_integration.py
│   ├── .env.example
│   └── pyproject.toml
│
├── frontend/
│   ├── app/                           # Pages (por domínio, já OK)
│   │   ├── dashboard/
│   │   ├── receitas/
│   │   ├── despesas/
│   │   ├── forecast/
│   │   ├── avisos-licitacoes/
│   │   ├── movimento-extra/
│   │   └── ...
│   ├── components/                    # Componentes compartilhados
│   ├── hooks/                         # Hooks por feature
│   ├── stores/                        # Zustand stores
│   ├── types/                         # Tipos por feature (já OK)
│   ├── services/api.ts                # API client
│   └── lib/                           # Utilidades
│
├── database/                          # SQLite database
├── scripts/                           # Gates de governança
│   ├── run_governance_gates.py
│   ├── check_file_length.py
│   ├── check_frontend_boundaries.py
│   ├── check_no_console.py
│   ├── check_cross_feature_imports.py  # NOVO
│   └── check_alembic_migration.py
│
└── receitas/                          # Dados fonte (PDFs)
```

---

## Checklist de Validação

### Por feature migrada

- [ ] Todos os testes existentes ainda passam (`cd backend && pytest`)
- [ ] Nenhum import cruzado entre domínios (validado pelo gate)
- [ ] Cada feature tem no máximo 5 arquivos principais (`*_types.py`, `*_handler.py`, `*_data.py`, `*_business.py`, `test_*.py`)
- [ ] `*_types.py` não importa de SQLAlchemy, FastAPI ou Prophet
- [ ] `*_business.py` não importa de SQLAlchemy, FastAPI ou HTTP
- [ ] `*_handler.py` não contém lógica de negócio — apenas delega
- [ ] Gate `ruff check .` passa
- [ ] Gate `mypy .` passa
- [ ] Gate `check_file_length.py` passa

### Quick Wins

- [ ] `README.md` existe na raiz com setup em <5 passos
- [ ] `.aiignore` exclui `node_modules`, `__pycache__`, `.mypy_cache`, `.venv`, `package-lock.json`
- [ ] `.cursorrules` referencia `AI-GOVERNANCE.md`
- [ ] `CONTRIBUTING.md` documenta fluxo de branches e PRs
- [ ] Coverage tem `fail_under` configurado

### Gates de governança

- [ ] `python scripts/run_governance_gates.py` passa 100%
- [ ] `check_cross_feature_imports.py` adicionado aos governance gates
- [ ] `REPOMAP.md` atualizado com nova estrutura
- [ ] `architecture.md` atualizado com decisão de vertical slicing
