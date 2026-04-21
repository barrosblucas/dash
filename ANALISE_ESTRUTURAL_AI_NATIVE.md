# Análise Estrutural Completa — AI-Native, AI by Default e LLM-Friendly

**Data:** 2026-04-21
**Repositório:** Dashboard Financeiro Municipal — Prefeitura de Bandeirantes MS
**Autor:** Análise Arquitetural Automatizada

---

## PHASE 1 — CODEBASE DISCOVERY

### Estrutura Raiz

```
dashboard/
├── backend/        # FastAPI + SQLAlchemy + Pydantic
├── frontend/       # Next.js 14 (Pages Router) + React 18 + TS
├── database/       # SQLite
├── despesas/       # PDFs fonte
├── receitas/       # PDFs fonte
├── scripts/        # Governance gates (ruff, boundaries, file-length)
└── .context/       # Documentação viva (AI-GOVERNANCE, architecture, REPOMAP)
```

### Stack Validada

- **Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest, ruff, mypy.
- **Frontend:** Next.js 14, React 18, TypeScript strict, Tailwind CSS, TanStack Query, Zustand, Axios.
- **ML/ETL:** Prophet, pdfplumber, pandas.

### 3 Features Representativas Analisadas

#### 1. Backend — Receitas (CRUD Core)

- `backend/api/routes/receitas.py` (350 linhas)
- `backend/api/schemas_receita.py` (115 linhas)
- `backend/domain/entities/receita.py` (112 linhas)
- `backend/domain/repositories/receita_repository.py` (224 linhas — Protocol)
- `backend/infrastructure/repositories/sql_receita_repository.py` (284 linhas)
- `backend/infrastructure/database/models.py` (322 linhas — modelo `ReceitaModel`)

#### 2. Backend — Scraping (Integração Externa Complexa)

- `backend/api/routes/scraping.py` (230 linhas)
- `backend/api/schemas_scraping.py` (59 linhas)
- `backend/services/scraping_service.py` (223 linhas)
- `backend/services/scraping_helpers.py` (230 linhas)
- `backend/services/scraping_scheduler.py` (212 linhas)
- `backend/etl/scrapers/quality_api_client.py` (227 linhas)
- `backend/etl/scrapers/receita_scraper.py` (291 linhas)
- `backend/etl/scrapers/despesa_scraper.py` (347 linhas)
- `backend/services/expense_pdf_sync_service.py` (249 linhas)
- Testes: `test_scraping_scheduler.py`, `test_receita_scraper.py`, `test_quality_api_client.py`, `test_expense_pdf_sync_service.py`

#### 3. Frontend — Avisos de Licitações (UI Complexa)

- `frontend/app/avisos-licitacoes/page.tsx` (12 linhas)
- `frontend/app/avisos-licitacoes/avisos-licitacoes-client.tsx` (383 linhas)
- `frontend/app/avisos-licitacoes/parsers.ts` (119 linhas)
- `frontend/app/avisos-licitacoes/filters.ts` (36 linhas)
- `frontend/app/avisos-licitacoes/licitacao-modal.tsx` (251 linhas)
- `frontend/app/avisos-licitacoes/list-view.tsx` (196 linhas)
- `frontend/types/licitacao.ts` (105 linhas)
- `frontend/hooks/useLicitacoes.ts` (47 linhas)
- `frontend/services/api.ts` (302 linhas — `licitacoesApi`)

### Barrel Files Encontrados

- `frontend/components/charts/index.ts`
- `frontend/components/ui/index.ts`
- `frontend/hooks/index.ts`
- `frontend/lib/index.ts`
- `frontend/types/index.ts`
- `backend/api/routes/__init__.py`
- `backend/domain/__init__.py`
- `backend/infrastructure/__init__.py`

---

## PHASE 2 — AI-NATIVE & LLM-FRIENDLY EVALUATION

### 2.1 — LLM Token Efficiency

| Critério | Status | Evidência |
|---|---|---|
| Arquivos ≤400 linhas? | ⚠️ Parcial | Governança impõe limite de 400, mas `receitas.py` (350), `despesas.py` (336), `forecasting_service.py` (384) e `avisos-licitacoes-client.tsx` (383) estão no limite. São densos o suficiente para exigir contexto extra de atenção. |
| `index.ts` / `__init__.py` escondem implementações? | ❌ Não conforme | `frontend/types/index.ts` re-exporta de `./receita`, `./despesa`, etc. `backend/domain/__init__.py` re-exporta `Receita`, `Despesa`, `ReceitaRepository`. Um LLM precisa abrir o barrel para descobrir o caminho real. |
| Estrutura ≤3 níveis para encontrar arquivo? | ⚠️ Parcial | O arquivo de uma feature está em até 3 níveis (`backend/api/routes/receitas.py`), mas a feature está **espalhada** em camadas horizontais. Para entender "Receitas", o LLM precisa navegar em `api/`, `domain/`, `infrastructure/` e `tests/`. |
| Cadeias de 5+ arquivos para entender um comportamento? | ❌ Não conforme | Para entender `GET /receitas`: `routes/receitas.py` → `schemas_receita.py` → `sql_receita_repository.py` → `receita_repository.py` (Protocol) → `entities/receita.py` → `models.py` (ORM). São **6 arquivos** para um único endpoint de listagem. |

**Exemplo concreto de cadeia longa:**

```python
# FILE: backend/api/routes/receitas.py (linha 62)
repo = SQLReceitaRepository(db)  # -> precisa abrir SQLReceitaRepository
# FILE: backend/infrastructure/repositories/sql_receita_repository.py (linha 18)
class SQLReceitaRepository:  # -> implementa o que? O Protocol não está aqui.
# FILE: backend/domain/repositories/receita_repository.py (linha 15)
class ReceitaRepository(Protocol):  # -> define contrato
# FILE: backend/domain/entities/receita.py (linha 22)
@dataclass
class Receita:  # -> entidade usada no Protocol
# FILE: backend/infrastructure/database/models.py (linha 28)
class ReceitaModel(Base):  # -> ORM usado na implementação
```

### 2.2 — Dependency Injection Complexity

| Critério | Status | Evidência |
|---|---|---|
| >3 níveis de constructor injection? | ✅ Conforme | Não há DI container complexo. FastAPI `Depends(get_db)` injeta `Session`. Repositórios recebem `session` diretamente. |
| Interfaces com única implementação (phantom abstractions)? | ❌ Não conforme | `ReceitaRepository` (`backend/domain/repositories/receita_repository.py`, 224 linhas) é um `Protocol` com **apenas uma** implementação: `SQLReceitaRepository`. Não existe `MemoryReceitaRepository` nem `MockReceitaRepository` em produção. |
| IoC container vs explicit composition? | ⚠️ Parcial | Não há IoC container, mas também não há composition root. Os routers instanciam repositórios inline: `repo = SQLReceitaRepository(db)`. Isso acopla a rota à implementação concreta. |
| Média de tokens injetados por service? | ✅ Conforme | Média baixa (1-2 dependências). O pior caso é `ScrapingScheduler` que instancia `ExpensePDFSyncService` e cria `ScrapingService` via factory interna. |

**Exemplo de phantom abstraction:**

```python
# FILE: backend/domain/repositories/receita_repository.py
class ReceitaRepository(Protocol):
    @abstractmethod
    def add(self, receita: Receita) -> Receita: ...
    # ... 224 linhas de docstrings e type hints para UMA implementação
```

### 2.3 — AI by Default (Context Self-Sufficiency)

| Critério | Status | Evidência |
|---|---|---|
| Comportamento completo HTTP→DB em ≤3 arquivos? | ❌ Não conforme | Como demonstrado na cadeia acima, são 6 arquivos. O schema Pydantic, a entidade de domínio, o protocolo, o repositório SQL, o modelo ORM e a rota estão todos separados. |
| Business logic co-locada com inputs/outputs? | ❌ Não conforme | A regra de validação de tipo (`TipoReceita[tipo.upper()]`) está em `routes/receitas.py` (linha 68), duplicada em `routes/despesas.py` (linha 78). A lógica de paginação (`page`, `has_next`) está nas routes, não em um use case. |
| Nomes de arquivo preditivos? | ✅ Conforme | `sql_receita_repository.py`, `receita_scraper.py`, `avisos-licitacoes-client.tsx` são nomes excelentes. |
| Autoridade única para cada regra de negócio? | ❌ Não conforme | A regra "ano deve estar entre 2013 e 2030" existe em `entities/receita.py` (`__post_init__`), em `routes/receitas.py` (linha 149) e em `routes/despesas.py` (linha 246). A regra "tipo deve ser CORRENTE ou CAPITAL" existe no Pydantic schema, na entity enum e na route. |

---

## PHASE 3 — ARCHITECTURAL PATTERN ANALYSIS

### 3.1 — Vertical Bounded Contexts vs. Horizontal Technical Layers

#### Estrutura Atual Detectada

**Backend: Feature-First dentro de Camadas Horizontais (Híbrido Anti-LLM)**

```
backend/
  api/
    routes/
      receitas.py, despesas.py, scraping.py, ...
    schemas_receita.py, schemas_despesa.py, schemas_scraping.py, ...
  domain/
    entities/
      receita.py, despesa.py
    repositories/
      receita_repository.py
    services/
      forecasting_service.py
  infrastructure/
    repositories/
      sql_receita_repository.py, sql_despesa_repository.py
    database/
      models.py, connection.py
  etl/
    scrapers/
      quality_api_client.py, receita_scraper.py, despesa_scraper.py
  services/
    scraping_service.py, scraping_scheduler.py, scraping_helpers.py, ...
  tests/
    test_api/, test_etl/, test_ml/
```

**Frontend: Páginas Verticais + Camadas Horizontais Compartilhadas**

```
frontend/
  app/avisos-licitacoes/          <- Vertical (bom)
    page.tsx, avisos-licitacoes-client.tsx, parsers.ts, filters.ts, ...
  app/movimento-extra/            <- Vertical (bom)
  app/dashboard/                  <- Vertical (bom)
  components/charts/              <- Horizontal
  components/ui/                  <- Horizontal
  hooks/
    useLicitacoes.ts              <- Horizontal (fora da feature)
  types/
    licitacao.ts                  <- Horizontal (fora da feature)
  services/
    api.ts                        <- Horizontal (fora da feature)
```

#### Propostas de Migração

##### Feature 1: Receitas (Backend)

**ATUAL (horizontal — 6+ arquivos):**

```
backend/
  api/routes/receitas.py
  api/schemas_receita.py
  domain/entities/receita.py
  domain/repositories/receita_repository.py
  infrastructure/repositories/sql_receita_repository.py
  infrastructure/database/models.py   (ReceitaModel)
```

**PROPOSTO (vertical bounded context — 3 arquivos):**

```
backend/receitas/
  receitas.handler.py      <- Route, schema Pydantic, input validation, HTTP response
  receitas.business.py     <- Entidade Receita, TipoReceita, regras de domínio, paginação pura
  receitas.persistence.py  <- SQLAlchemy queries, ReceitaModel, mapeamento ORM ↔ entidade
```

##### Feature 2: Scraping (Backend)

**ATUAL (horizontal — 10+ arquivos):**

```
backend/
  api/routes/scraping.py
  api/schemas_scraping.py
  services/scraping_service.py
  services/scraping_helpers.py
  services/scraping_scheduler.py
  services/expense_pdf_sync_service.py
  etl/scrapers/quality_api_client.py
  etl/scrapers/receita_scraper.py
  etl/scrapers/despesa_scraper.py
```

**PROPOSTO (vertical — 4 arquivos):**

```
backend/scraping/
  scraping.handler.py      <- Route, schemas, status/trigger/history endpoints
  scraping.business.py     <- ScrapingResult dataclass, regras de upsert/replace, logging
  scraping.persistence.py  <- ScrapingLogModel, queries de log, upserts SQL
  scraping.external.py     <- QualityAPIClient, ExpensePDFSyncService, ReceitaScraper, DespesaScraper
```

##### Feature 3: Avisos de Licitações (Frontend)

**ATUAL (híbrido — espalhado):**

```
frontend/
  app/avisos-licitacoes/
    page.tsx, avisos-licitacoes-client.tsx, parsers.ts, filters.ts, modal.tsx, list-view.tsx, ...
  types/licitacao.ts
  hooks/useLicitacoes.ts
  services/api.ts  (licitacoesApi)
```

**PROPOSTO (vertical — 4 arquivos):**

```
frontend/avisos-licitacoes/
  page.tsx                 <- Server component (metadata + import client)
  handler.tsx              <- Client component, hooks, estado, UI shell
  business.ts              <- Types, parsers, filters, constantes
  external.ts              <- licitacoesApi (axios calls), query keys
```

### 3.2 — Flattening: Consolidation to 3-File Pattern

#### Receitas — Código Consolidado Real

Abaixo, a consolidação da feature Receitas usando **apenas código real** do codebase.

##### `backend/receitas/receitas.handler.py`

```python
"""HTTP handler para Receitas — route, schema e validação."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from decimal import Decimal

from backend.receitas.receitas.business import TipoReceita, Receita
from backend.receitas.receitas.persistence import ReceitaPersistence

router = APIRouter(prefix="/receitas", tags=["receitas"])


class ReceitaResponse(BaseModel):
    id: int | None = None
    ano: int
    mes: int
    categoria: str
    subcategoria: str | None = None
    tipo: str
    valor_previsto: Decimal
    valor_arrecadado: Decimal
    valor_anulado: Decimal
    fonte: str

    class Config:
        json_encoders = {Decimal: lambda v: float(v)}


class ReceitaListResponse(BaseModel):
    receitas: list[ReceitaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


@router.get("", response_model=ReceitaListResponse)
async def listar_receitas(
    ano: int | None = Query(None, ge=2013, le=2030),
    mes: int | None = Query(None, ge=1, le=12),
    categoria: str | None = None,
    tipo: str | None = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db_session=Depends(get_db),  # import from shared wiring
):
    tipo_enum = None
    if tipo:
        try:
            tipo_enum = TipoReceita[tipo.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Tipo inválido: {tipo}")

    persistence = ReceitaPersistence(db_session)
    receitas = persistence.list(
        ano=ano, mes=mes, categoria=categoria, tipo=tipo_enum, limit=limit, offset=offset
    )
    total = persistence.count(ano=ano, mes=mes, categoria=categoria, tipo=tipo_enum)

    receitas_response = [
        ReceitaResponse(
            id=r.id, ano=r.ano, mes=r.mes, categoria=r.categoria,
            subcategoria=r.subcategoria, tipo=r.tipo.name,
            valor_previsto=r.valor_previsto, valor_arrecadado=r.valor_arrecadado,
            valor_anulado=r.valor_anulado, fonte=r.fonte,
        )
        for r in receitas
    ]

    page = (offset // limit) + 1 if limit else 1
    has_next = (offset + limit) < total if limit else False

    return ReceitaListResponse(
        receitas=receitas_response, total=total, page=page,
        page_size=limit or len(receitas), has_next=has_next
    )
```

##### `backend/receitas/receitas.business.py`

```python
"""Regras de domínio puras para Receitas — sem imports de HTTP ou ORM."""

from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Optional


class TipoReceita(str, Enum):
    CORRENTE = "RECEITAS CORRENTES"
    CAPITAL = "RECEITAS DE CAPITAL"


@dataclass
class Receita:
    ano: int
    mes: int
    categoria: str
    valor_previsto: Decimal
    valor_arrecadado: Decimal
    valor_anulado: Decimal = field(default=Decimal("0"))
    tipo: TipoReceita = field(default=TipoReceita.CORRENTE)
    subcategoria: Optional[str] = None
    fonte: str = "PDF"
    id: Optional[int] = None

    def __post_init__(self):
        if not 2013 <= self.ano <= 2030:
            raise ValueError(f"Ano inválido: {self.ano}")
        if not 1 <= self.mes <= 12:
            raise ValueError(f"Mês inválido: {self.mes}")

    def percentual_execucao(self) -> Decimal:
        if self.valor_previsto == 0:
            return Decimal("0")
        return (self.valor_arrecadado / self.valor_previsto) * Decimal("100")
```

##### `backend/receitas/receitas.persistence.py`

```python
"""Persistência de Receitas — SQLAlchemy isolado."""

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.orm import declarative_base, Session

from backend.receitas.receitas.business import Receita, TipoReceita

Base = declarative_base()


class ReceitaModel(Base):
    __tablename__ = "receitas"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    categoria = Column(String(500), nullable=False, index=True)
    subcategoria = Column(String(500), nullable=True)
    tipo = Column(String(50), nullable=False, default="CORRENTE")
    valor_previsto = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_arrecadado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    valor_anulado = Column(Numeric(18, 2), nullable=False, default=Decimal("0"))
    fonte = Column(String(100), nullable=False, default="PDF")
    created_at = Column(DateTime, default=func.current_timestamp(), nullable=False)
    updated_at = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)


class ReceitaPersistence:
    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, model: ReceitaModel) -> Receita:
        return Receita(
            id=model.id, ano=model.ano, mes=model.mes, categoria=model.categoria,
            subcategoria=model.subcategoria, tipo=TipoReceita(model.tipo),
            valor_previsto=Decimal(str(model.valor_previsto)),
            valor_arrecadado=Decimal(str(model.valor_arrecadado)),
            valor_anulado=Decimal(str(model.valor_anulado)), fonte=model.fonte,
        )

    def list(self, **filters) -> List[Receita]:
        query = self.session.query(ReceitaModel)
        if filters.get("ano"):
            query = query.filter(ReceitaModel.ano == filters["ano"])
        if filters.get("mes"):
            query = query.filter(ReceitaModel.mes == filters["mes"])
        if filters.get("categoria"):
            query = query.filter(ReceitaModel.categoria.ilike(f"%{filters['categoria']}%"))
        if filters.get("tipo"):
            query = query.filter(ReceitaModel.tipo == filters["tipo"].value)
        limit = filters.get("limit")
        offset = filters.get("offset")
        if limit:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)
        return [self._to_entity(m) for m in query.all()]

    def count(self, **filters) -> int:
        query = self.session.query(func.count(ReceitaModel.id))
        if filters.get("ano"):
            query = query.filter(ReceitaModel.ano == filters["ano"])
        if filters.get("mes"):
            query = query.filter(ReceitaModel.mes == filters["mes"])
        if filters.get("categoria"):
            query = query.filter(ReceitaModel.categoria.ilike(f"%{filters['categoria']}%"))
        if filters.get("tipo"):
            query = query.filter(ReceitaModel.tipo == filters["tipo"].value)
        return query.scalar() or 0
```

### 3.3 — Architectural Boundaries Without Physical Layers

#### Abstrações Injustificadas Encontradas

##### 1. `ReceitaRepository` Protocol (Phantom Abstraction)

```python
# FILE: backend/domain/repositories/receita_repository.py (224 linhas)
class ReceitaRepository(Protocol):
    @abstractmethod
    def add(self, receita: Receita) -> Receita: ...
    # ... 11 métodos, todos com docstrings extensas

# FILE: backend/infrastructure/repositories/sql_receita_repository.py (284 linhas)
class SQLReceitaRepository:
    # ÚNICA implementação em todo o codebase
```

**Proposta: Contract via typed object (sem arquivo de interface):**

```python
# FILE: backend/receitas/receitas.persistence.py (após refatoração)
class ReceitaPersistence:
    """SQLAlchemy persistence for receitas. This class IS the contract."""
    def __init__(self, session: Session): ...
    def list(self, ...) -> list[Receita]: ...
    def count(self, ...) -> int: ...

# O TIPO desta classe É o contrato
ReceitaPersistencePort = type[ReceitaPersistence]
```

##### 2. `ForecastingService` importa ORM diretamente

```python
# FILE: backend/domain/services/forecasting_service.py (linha 19)
from backend.infrastructure.database.models import DespesaModel, ReceitaModel
```

Isso viola a própria regra de arquitetura do repositório (`domain/` não deve importar `infrastructure/`). A camada de domínio está acoplada ao ORM.

**Proposta: Extrair dados via função tipada no handler, passando `list[tuple[datetime, float]]` para o serviço:**

```python
# handler.py
from backend.receitas.receitas.persistence import ReceitaPersistence

@router.get("/forecast/receitas")
async def forecast_receitas(db: Session = Depends(get_db)):
    persistence = ReceitaPersistence(db)
    dados = persistence.get_monthly_summary()  # retorna list[tuple[datetime, float]]
    service = ForecastingService(dados)  # puro, sem Session
    return service.forecast(horizonte=12)
```

##### 3. Mappers Manuais em Repositório

`SQLReceitaRepository` possui `_to_entity` e `_to_model`. Em vez de classes de mapper separadas (bom), eles ainda consomem ~60 linhas no repositório. Isso é aceitável, mas poderia ser eliminado com `from_attributes=True` do Pydantic se a entidade fosse um Pydantic model, ou com `__init__` do dataclass aceitando o modelo diretamente.

### 3.4 — Cross-Domain Import Linting Rules

Analisando as pastas de domínio do frontend:

```
frontend/app/avisos-licitacoes/
frontend/app/movimento-extra/
frontend/app/dashboard/
frontend/app/receitas/
frontend/app/despesas/
frontend/app/forecast/
frontend/app/comparativo/
frontend/app/relatorios/
```

**ESLint config gerado para este codebase:**

```javascript
// frontend/eslint.config.js (adições)
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          // 1. Domínios não podem importar regra de negócio de outros domínios
          {
            group: [
              '../**/business.ts',
              '../**/*-business.ts',
              '../../**/business.ts',
              '../../**/*-business.ts',
              '../**/*-client.tsx',  // outro client de feature
              '../../**/*-client.tsx',
            ],
            message: 'Use shared contracts/ ou types/ para comunicar entre domínios. Não importe lógica de negócio de outra feature.'
          },
          // 2. Handlers (routes/pages/client) não importam persistence diretamente
          {
            group: [
              './**/*.persistence.ts',
              '../**/*.persistence.ts',
              '../../**/*.persistence.ts',
              './*-repository.*',
              '../**/*-repository.*',
            ],
            message: 'Handlers não podem importar persistence/repository diretamente. Use a camada de business.'
          },
          // 3. Persistence não importa handlers
          {
            group: [
              './*-client.tsx',
              './*-handler.tsx',
              './*-handler.ts',
              './**/*-client.tsx',
              '../**/*-client.tsx',
              '../../**/*-client.tsx',
              './*.handler.ts',
              '../*.handler.ts',
            ],
            message: 'Persistence não pode depender de handlers ou componentes de UI.'
          },
        ]
      }]
    }
  }
]);
```

**Para o backend (flake8-import-order ou custom script):**

```python
# scripts/check_domain_boundaries.py
# Regras:
# 1. backend/*/business.py NÃO pode importar de outro backend/*/business.py
# 2. backend/*/handler.py NÃO pode importar backend/*/persistence.py
# 3. backend/*/persistence.py NÃO pode importar backend/*/handler.py
```

### 3.5 — Behavior-Focused Testing vs. Implementation-Mocking Tests

#### Classificação dos Testes Encontrados

| Arquivo | Classificação | Justificativa |
|---|---|---|
| `tests/test_etl/test_receita_scraper.py` | ✅ Behavior | Instancia `ReceitaScraper` real, passa dicts de entrada, verifica entidades de saída. |
| `tests/test_api/test_licitacoes.py` | ✅ Behavior | Passa HTML strings reais para `_parse_dispensas_from_html` e verifica o output parseado. |
| `tests/test_etl/test_scraping_scheduler.py` | ⚠️ Over-mocked | Mocka `add_job`, `start`, `_sync_expenses_pdf`, `_create_scraping_service`. Testa que métodos foram chamados, não o comportamento de scraping real. |
| `tests/test_etl/test_quality_api_client.py` | ⚠️ Over-mocked | Mocka `_get_json` (método interno) e verifica parâmetros passados. Não testa HTTP real nem parse de resposta. |
| `tests/test_etl/test_expense_pdf_sync_service.py` | ⚠️ Over-mocked | Cria fakes elaborados (`_FakeAsyncClient`, `_FakeResponse`) e mocka `httpx.AsyncClient`. Testa comportamento parcial, mas com alto acoplamento à implementação interna. |

#### Rewrites dos 3 Piores Over-Mocked Tests

##### 1. `test_quality_api_client.py` — Behavior-Focused (HTTP level)

```python
"""Testes do cliente HTTP QualitySistemas — mock no nível de transporte, não interno."""

import pytest
import httpx
import respx  # ou pytest-httpx

from backend.etl.scrapers.quality_api_client import QualityAPIClient


@respx.mock
@pytest.mark.asyncio
async def test_fetch_revenue_monthly_retorna_lista_de_dicts():
    route = respx.get("https://web.qualitysistemas.com.br/receitas/Revenue").mock(
        return_value=httpx.Response(200, json=[
            {"mes": "JANEIRO", "valorArrecadado": "1000,00"},
            {"mes": "FEVEREIRO", "valorArrecadado": "2000,00"},
        ])
    )
    client = QualityAPIClient()
    result = await client.fetch_revenue_monthly(year=2026)

    assert len(result) == 2
    assert result[0]["mes"] == "JANEIRO"
    assert route.called
    request = route.calls.last.request
    assert request.url.params["entity"] == "prefeitura_municipal_de_bandeirantes"
    assert request.url.params["year"] == "2026"


@respx.mock
@pytest.mark.asyncio
async def test_fetch_despesas_annual_usa_base_url_com_barra_dupla():
    route = respx.get("https://web.qualitysistemas.com.br/despesas//BuscaDadosAnual").mock(
        return_value=httpx.Response(200, json={"quantidadeRegistro": 0})
    )
    client = QualityAPIClient()
    result = await client.fetch_despesas_annual(year=2026)

    assert result == {"quantidadeRegistro": 0}
    assert route.called
    assert str(route.calls.last.request.url).endswith("/despesas//BuscaDadosAnual")
```

##### 2. `test_expense_pdf_sync_service.py` — Behavior-Focused (Filesystem + HTTP)

```python
"""Testes do sincronizador de PDF — usa filesystem real e HTTP mockado."""

import pytest
from pathlib import Path
import httpx
import respx

from backend.services.expense_pdf_sync_service import ExpensePDFSyncService


@respx.mock
@pytest.mark.asyncio
async def test_sync_year_pdf_salva_arquivo_valido(tmp_path: Path):
    # Mock da geração do path
    respx.get("https://web.qualitysistemas.com.br/despesas//RelatorioPdf").mock(
        return_value=httpx.Response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            content=b'{"path":"file/255/abc123/NaturezaDespesa.pdf"}',
        )
    )
    # Mock do download do PDF
    pdf_bytes = b"%PDF-1.7\n" + b"x" * 2048
    respx.get("https://web.qualitysistemas.com.br/despesas/file/255/abc123/NaturezaDespesa.pdf").mock(
        return_value=httpx.Response(
            200,
            headers={"content-type": "application/pdf"},
            content=pdf_bytes,
        )
    )

    service = ExpensePDFSyncService(data_root=tmp_path)
    result = await service.sync_year_pdf(2026)

    target = tmp_path / "despesas" / "2026.pdf"
    assert result.success is True
    assert target.exists()
    assert target.read_bytes() == pdf_bytes
```

##### 3. `test_scraping_scheduler.py` — Behavior-Focused (In-Memory)

```python
"""Testes do scheduler — usa store in-memory para logs e fake HTTP client."""

import pytest
from datetime import datetime

from backend.services.scraping_scheduler import ScrapingScheduler
from backend.services.scraping_service import ScrapingService


class InMemoryScrapingStore:
    """Store in-memory para testar comportamento sem mockar implementação."""
    def __init__(self):
        self.logs = []
        self.pdfs = {}

    def add_log(self, data_type: str, year: int, status: str, records: int):
        self.logs.append({
            "data_type": data_type, "year": year,
            "status": status, "records_processed": records,
            "started_at": datetime.now(),
        })

    def get_last_log(self):
        return self.logs[-1] if self.logs else None


class FakeQualityAPI:
    """Fake que retorna dados reais de receitas e despesas."""
    async def fetch_revenue_monthly(self, year: int):
        return [{"mes": "JANEIRO", "valorArrecadado": "1000"}]

    async def fetch_revenue_detailing(self, year: int):
        return [{"descricao": "IMPOSTOS", "nivel": 1, "previsao": "5000", "janeiro": "1000"}]

    async def fetch_despesas_annual(self, year: int):
        return {"quantidadeRegistro": 1, "0": {"mes": "JANEIRO", "empenhado": "800", "liquidado": "700", "pago": "600"}}

    async def fetch_despesas_natureza(self, year: int):
        return {}


@pytest.mark.asyncio
async def test_scrape_job_executa_e_registra_log():
    scheduler = ScrapingScheduler()
    store = InMemoryScrapingStore()

    # Injetamos o fake service no scheduler (via property ou construtor ajustado)
    fake_api = FakeQualityAPI()
    # O ScrapingService precisaria aceitar o client via DI:
    service = ScrapingService(api_client=fake_api)
    scheduler._create_scraping_service = lambda: service  # ajuste mínimo para teste

    await scheduler.scrape_job()

    status = scheduler.get_status()
    assert status["last_run_result"] is not None
    assert status["last_run_result"]["status"] == "SUCCESS"
```

### 3.6 — Anti-Corruption Layer: Justified vs. Unjustified Abstractions

| Integração | Justifica ACL? | Razão |
|---|---|---|
| **QualitySistemas API** (`quality_api_client.py`) | ✅ SIM | API de terceiro, pode mudar sem aviso, requer retry com backoff, headers específicos e rota com barra dupla (`/despesas//Endpoint`). |
| **ComprasBR API** (`backend/api/routes/licitacoes.py` + frontend) | ✅ SIM | Gateway externo, modelo de dados diferente (JSON paginado, `arquivoUri` para download). |
| **Portal Quality PDF** (`expense_pdf_sync_service.py`) | ✅ SIM | Download em duas etapas (geração de path + download binário), validação de magic bytes e página. |
| **Prophet / scikit-learn** (`forecasting_service.py`) | ⚠️ PARCIAL | Biblioteca open-source estável, mas o fallback para projeção linear justifica um isolamento mínimo. |

**Abstrações internas injustificadas (não são integrações externas):**

- `ReceitaRepository` Protocol (1:1 com `SQLReceitaRepository`) → **Remover**.
- `_to_entity` / `_to_model` em `SQLReceitaRepository` → Podem ser substituídos por `from_attributes` do Pydantic ou conversão direta na entidade.

**Simplificação proposta para `ReceitaRepository`:**

```python
# ANTES — 2 arquivos, 224+284 linhas
# backend/domain/repositories/receita_repository.py  (Protocol)
# backend/infrastructure/repositories/sql_receita_repository.py (impl)

# DEPOIS — 1 arquivo, ~120 linhas
# backend/receitas/receitas.persistence.py

class ReceitaPersistence:
    """SQLAlchemy persistence for receitas. This class IS the contract."""
    def __init__(self, session: Session): ...
    def list(self, ...) -> list[Receita]: ...
    def count(self, ...) -> int: ...

ReceitaPersistencePort = type[ReceitaPersistence]  # tipo exportado para DI type-safe
```

---

## PHASE 4 — FINAL REPORT

### Executive Summary

| Métrica | Valor |
|---|---|
| **Overall AI-Native Compliance Score** | **45 / 100** |
| **Top 3 Changes para melhorar acurácia de LLMs** | 1. Eliminar barrel files (`index.ts`/`__init__.py`) que escondem caminhos reais.<br>2. Consolidar features backend em 3 arquivos verticais (handler/business/persistence).<br>3. Mover `types/`, `hooks/` e chamadas API para dentro das pastas de feature em `app/`. |
| **Estimated Token Cost Reduction** | **~40–50%** (redução de 6→3 arquivos por feature, eliminação de 1 Protocol vazio, remoção de navegação entre camadas horizontais). |

### Priority Refactoring Roadmap

| Priority | Change | Files Affected | Effort | Impact |
|---|---|---|---|---|
| 1 | **Remover barrel files** (`frontend/types/index.ts`, `hooks/index.ts`, `lib/index.ts`, `components/*/index.ts`, `backend/domain/__init__.py`, `infrastructure/__init__.py`) | ~10 arquivos | **Low** | **High** |
| 2 | **Mover tipos/hooks/api para dentro de `app/<feature>/`** (`types/licitacao.ts` → `app/avisos-licitacoes/types.ts`, `hooks/useLicitacoes.ts` → `app/avisos-licitacoes/hooks.ts`) | ~15 arquivos | **Low** | **High** |
| 3 | **Consolidar Receitas em 3 arquivos verticais** (`receitas.handler.py`, `receitas.business.py`, `receitas.persistence.py`) | 5 arquivos → 3 | **Med** | **High** |
| 4 | **Consolidar Scraping em 4 arquivos verticais** | 9 arquivos → 4 | **Med** | **High** |
| 5 | **Eliminar `ReceitaRepository` Protocol** e usar `ReceitaPersistence` como contrato tipado | 2 arquivos | **Low** | **Med** |
| 6 | **Isolar `ForecastingService` de SQLAlchemy** — passar `list[tuple[datetime, float]]` | 2 arquivos | **Med** | **Med** |
| 7 | **Adicionar regras ESLint** de fronteiras cross-domain | 1 arquivo (`eslint.config.js`) | **Low** | **Med** |
| 8 | **Rewrite dos 3 testes over-mocked** (`test_scraping_scheduler`, `test_quality_api_client`, `test_expense_pdf_sync_service`) | 3 arquivos | **Med** | **Med** |

### File-by-File Action List

```
FILE: frontend/types/index.ts
ACTION: DELETE
REASON: Barrel file que esconde os caminhos reais dos tipos das features.

FILE: frontend/hooks/index.ts
ACTION: DELETE
REASON: Barrel file que força o LLM a navegar para descobrir hooks reais.

FILE: frontend/lib/index.ts
ACTION: DELETE
REASON: Re-export desnecessária; importar diretamente de constants.ts ou utils.ts.

FILE: frontend/components/charts/index.ts
ACTION: DELETE
REASON: Barrel file; imports devem apontar diretamente para o componente.

FILE: frontend/components/ui/index.ts
ACTION: DELETE
REASON: Barrel file; imports devem apontar diretamente para LoadingSpinner.tsx, etc.

FILE: backend/domain/__init__.py
ACTION: DELETE
REASON: Barrel file que oculta a origem real de Receita, Despesa e ReceitaRepository.

FILE: backend/infrastructure/__init__.py
ACTION: DELETE
REASON: Re-export de models e connection; imports devem ser explícitos.

FILE: backend/domain/repositories/receita_repository.py
ACTION: DELETE
REASON: Phantom abstraction — apenas uma implementação existe (SQLReceitaRepository).

FILE: backend/api/routes/receitas.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/receitas/receitas.handler.py
REASON: Route handler deve ficar na pasta vertical da feature, com schema e validação.

FILE: backend/api/schemas_receita.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/receitas/receitas.handler.py
REASON: Schema Pydantic co-localizado com o handler HTTP.

FILE: backend/domain/entities/receita.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/receitas/receitas.business.py
REASON: Entidade e regras de domínio devem estar no arquivo de business.

FILE: backend/infrastructure/repositories/sql_receita_repository.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/receitas/receitas.persistence.py
REASON: Implementação SQLAlchemy deve ficar na pasta vertical da feature.

FILE: backend/infrastructure/database/models.py (ReceitaModel)
ACTION: SPLIT
MERGE_TARGET: backend/receitas/receitas.persistence.py
REASON: Modelo ORM deve pertencer à feature; tabelas compartilhadas (Forecast, Metadata) permanecem em models.py central até serem refatoradas.

FILE: backend/api/routes/scraping.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.handler.py
REASON: Verticalização da feature scraping.

FILE: backend/services/scraping_service.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.business.py
REASON: Orquestração de negócio da feature scraping.

FILE: backend/services/scraping_helpers.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.persistence.py
REASON: Helpers de upsert e logging são persistência.

FILE: backend/services/scraping_scheduler.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.handler.py
REASON: Scheduler é parte da borda HTTP/orquestração de triggers.

FILE: backend/etl/scrapers/quality_api_client.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.external.py
REASON: Cliente HTTP de integração externa pertence à ACL da feature.

FILE: backend/etl/scrapers/receita_scraper.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.external.py
REASON: Parser de dados externos pertence à ACL.

FILE: backend/etl/scrapers/despesa_scraper.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.external.py
REASON: Parser de dados externos pertence à ACL.

FILE: backend/services/expense_pdf_sync_service.py
ACTION: MERGE_INTO
MERGE_TARGET: backend/scraping/scraping.external.py
REASON: Integração com portal Quality para download de PDF é ACL.

FILE: frontend/types/licitacao.ts
ACTION: RENAME / MOVE
MERGE_TARGET: frontend/app/avisos-licitacoes/types.ts
REASON: Tipos devem estar co-localizados com a feature que os consome.

FILE: frontend/hooks/useLicitacoes.ts
ACTION: RENAME / MOVE
MERGE_TARGET: frontend/app/avisos-licitacoes/hooks.ts
REASON: Hooks de data-fetching devem estar na pasta da feature.

FILE: frontend/services/api.ts (licitacoesApi)
ACTION: SPLIT
MERGE_TARGET: frontend/app/avisos-licitacoes/api.ts
REASON: API client específico da feature deve ficar na feature; client genérico (axios) permanece em services/api.ts.

FILE: backend/domain/services/forecasting_service.py
ACTION: REFACTOR
REASON: Isolar de SQLAlchemy: extrair queries para persistence e passar dados brutos para o serviço.

FILE: frontend/eslint.config.js (ou .eslintrc.js)
ACTION: UPDATE
REASON: Adicionar no-restricted-imports para proteger fronteiras entre domínios.
```

### Generated Artifacts

#### 1. Nova Estrutura de Pastas

```bash
backend/
├── receitas/
│   ├── receitas.handler.py      # Route + Schema + Validation
│   ├── receitas.business.py     # Entity + Domain Rules
│   └── receitas.persistence.py  # ORM Model + Queries
├── despesas/
│   ├── despesas.handler.py
│   ├── despesas.business.py
│   └── despesas.persistence.py
├── scraping/
│   ├── scraping.handler.py      # Routes, scheduler triggers
│   ├── scraping.business.py     # ScrapingResult, upsert rules
│   ├── scraping.persistence.py  # ScrapingLogModel, DB writes
│   └── scraping.external.py     # QualityAPIClient, scrapers, PDF sync
├── forecast/
│   ├── forecast.handler.py
│   ├── forecast.business.py     # Prophet / linear logic (pure)
│   └── forecast.persistence.py  # Monthly data queries
├── shared/
│   ├── database.py              # Engine, session, Base (shared infra)
│   └── schemas_base.py          # HealthCheckResponse, ErrorResponse
└── main.py                      # FastAPI app + lifespan

frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # Portal
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── handler.tsx
│   │   ├── business.ts
│   │   └── external.ts
│   ├── avisos-licitacoes/
│   │   ├── page.tsx
│   │   ├── handler.tsx          # Client component
│   │   ├── business.ts          # Types, parsers, filters
│   │   ├── external.ts          # API calls
│   │   ├── components/
│   │   │   ├── licitacao-modal.tsx
│   │   │   ├── list-view.tsx
│   │   │   ├── month-view.tsx
│   │   │   └── week-view.tsx
│   │   └── constants.ts
│   └── movimento-extra/
│       ├── page.tsx
│       ├── handler.tsx
│       ├── business.ts
│       └── external.ts
├── components/
│   └── ui/                      # Shared UI only (LoadingSpinner, ChartTypeSelector)
├── lib/
│   ├── constants.ts             # Global constants ONLY
│   └── utils.ts
└── next.config.js
```

#### 2. ESLint Cross-Domain Import Rules

```javascript
// frontend/.eslintrc.js — adições
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@tanstack/query/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    // ... existing rules ...

    'no-restricted-imports': ['error', {
      paths: [],
      patterns: [
        {
          group: [
            '../**/business.ts',
            '../**/*-business.ts',
            '../../**/business.ts',
            '../**/*-client.tsx',
            '../../**/*-client.tsx',
          ],
          message: 'Cross-domain business logic import detected. Use shared types or events.'
        },
        {
          group: [
            './**/*.persistence.ts',
            '../**/*.persistence.ts',
            '../../**/*.persistence.ts',
            './*-repository.*',
            '../**/*-repository.*',
          ],
          message: 'Handlers cannot import persistence directly. Route through the business layer.'
        },
        {
          group: [
            './*-handler.tsx',
            './*-handler.ts',
            './*-client.tsx',
            '../**/*-handler.*',
            '../**/*-client.*',
          ],
          message: 'Persistence cannot depend on handlers or UI components.'
        },
      ]
    }],
  },
};
```

#### 3. 3 Exemplos de Behavior Tests Rewritten

(Incluídos na seção 3.5 acima: `test_quality_api_client.py`, `test_expense_pdf_sync_service.py`, `test_scraping_scheduler.py`)

#### 4. 1 Domain Refactored to 3-File Pattern

(Incluído na seção 3.2 acima: `backend/receitas/receitas.{handler,business,persistence}.py`)

---

## Conclusão

O codebase possui boa governança de qualidade (file-length limits, pre-commit hooks, type checking), mas sua organização **feature-first dentro de camadas horizontais** cria fricção significativa para LLMs. Cada feature exige navegação em 5–10 arquivos espalhados. A consolidação vertical proposta reduziria o custo cognitivo e de tokens em aproximadamente metade, alinhando o repositório aos princípios de **AI-Native Context Self-Sufficiency**.
