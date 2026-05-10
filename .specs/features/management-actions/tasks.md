# Management Actions — Tasks

**Design**: `.specs/features/management-actions/design.md`
**Status**: Done

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2
```

### Phase 2: Core (Parallel — all 3 can run after T2)

```
     ┌→ T3 ─┐
T2 ──┼→ T4 ─┼──→ T6
     └→ T5 ─┘
           T8 (parallel with T4, depends on T3)
```

### Phase 3: Integration (Sequential)

```
T6, T8 complete → T7 → T9
```

### Phase 4: Validation

```
T10 (gate final)
```

---

## Task Breakdown

### T1: Create ORM Model

**What**: Criar `ManagementActionModel` (tabela `management_actions`)
**Where**: `backend/shared/database/management_actions_models.py`
**Depends on**: None
**Reuses**: `Base` de `backend/shared/database/models.py`
**Requirement**: MGA-01

**Done when**:
- [ ] Model definido com todas as colunas do design
- [ ] Importado em `backend/shared/database/models.py` (final do arquivo, com `# noqa`)
- [ ] Sem erros de importação

**Tests**: none (model-only)
**Gate**: build

---

### T2: Create Pydantic Types

**What**: Schemas `ActionStatus`, `ActionRecord`, `ActionListResponse`
**Where**: `backend/features/management_actions/management_actions_types.py`
**Depends on**: None
**Reuses**: Padrão de `institucional_types.py`
**Requirement**: MGA-01

**Done when**:
- [ ] `ActionStatus(StrEnum)` com valores `concluída` / `em andamento`
- [ ] `ActionRecord(BaseModel)` com 16 campos + `investment` computado
- [ ] `ActionListResponse` com `items: list[ActionRecord]` + `total: int`

**Tests**: none (types-only)
**Gate**: build

---

### T3: Create Data Layer [P]

**What**: Funções `list_actions()`, `create_action()`, `action_to_dict()`
**Where**: `backend/features/management_actions/management_actions_data.py`
**Depends on**: T1 (model), T2 (types)
**Reuses**: Padrão de `institucional_data.py`
**Requirement**: MGA-01, MGA-04

**Done when**:
- [ ] `list_actions(db, category)` retorna `tuple[list[Model], int]`
- [ ] `create_action(db, payload)` insere e retorna model
- [ ] `action_to_dict(model)` inclui `investment` formatado (R$ X.XXX.XXX)
- [ ] Gate check passa

**Tests**: integration
**Gate**: full

---

### T4: Create Handler (Router) [P]

**What**: Endpoint `GET /management-actions`
**Where**: `backend/features/management_actions/management_actions_handler.py`
**Depends on**: T3 (data layer)
**Reuses**: Padrão de `institucional_handler.py`
**Requirement**: MGA-01

**Done when**:
- [ ] `GET /management-actions` retorna `ActionListResponse`
- [ ] Query param `?category=` filtra por categoria
- [ ] Sem `?category=` retorna todas

**Tests**: integration
**Gate**: full

---

### T5: Create TypeScript Types [P]

**What**: Interfaces `ManagementAction`, `ManagementActionListResponse`
**Where**: `frontend/types/management-actions.ts`
**Depends on**: T2 (Pydantic types reference)
**Reuses**: Padrão de `frontend/types/institucional.ts`
**Requirement**: MGA-02

**Done when**:
- [ ] `ManagementAction` espelha `ActionRecord` (16 campos)
- [ ] Exportado via `frontend/types/index.ts`
- [ ] `npm run type-check` passa

**Tests**: none (types-only)
**Gate**: build

---

### T6: Register Router + Import Model

**What**: Conectar feature ao sistema
**Where**: `backend/api/main.py` (modify) + `backend/shared/database/models.py` (modify)
**Depends on**: T4 (router existe), T1 (model existe)
**Reuses**: Padrão de registro existente em `main.py`
**Requirement**: MGA-01

**Done when**:
- [ ] Router registrado em `main.py` com `prefix="/api/v1"`
- [ ] `ManagementActionModel` importado em `models.py`
- [ ] `ruff check` e `mypy` passam

**Tests**: none (wiring-only)
**Gate**: build

---

### T7: Create Frontend Service

**What**: Service `managementActionsService.getActions()`
**Where**: `frontend/services/management-actions-service.ts`
**Depends on**: T5 (TypeScript types)
**Reuses**: Padrão de `institucional-service.ts`
**Requirement**: MGA-02

**Done when**:
- [ ] `getActions()` chama `GET /api/v1/management-actions`
- [ ] `getActions(category)` adiciona `?category=` query param
- [ ] `npm run type-check` passa

**Tests**: none (service-only)
**Gate**: build

---

### T8: Create Bootstrap Seed Data [P]

**What**: Função `seed_management_actions()` idempotente com 7 ações do mock
**Where**: `backend/features/management_actions/management_actions_bootstrap.py`
**Depends on**: T3 (data layer `create_action`)
**Reuses**: Padrão idempotente (check existence antes de inserir)
**Requirement**: MGA-04

**Done when**:
- [ ] 7 ações inseridas (mesmos dados do `constants.ts`)
- [ ] Idempotente: reexecução não duplica
- [ ] Chamado durante startup do backend

**Tests**: none (seed data)
**Gate**: build

---

### T9: Update Frontend Page to Consume API

**What**: Substituir `import { actions } from './constants'` por `useQuery` com `managementActionsService`
**Where**: `frontend/app/acoes/acoes-client.tsx` (modify)
**Depends on**: T7 (service)
**Reuses**: `DashboardCard`, `DonutChart`, `AnimatedCounter` (inalterados)
**Requirement**: MGA-02, MGA-03

**Done when**:
- [ ] `useQuery` carrega ações da API
- [ ] Loading state: skeleton/spinner
- [ ] Error state: mensagem de erro com retry
- [ ] Empty state: "Nenhuma ação encontrada"
- [ ] Filtro por categoria mantido (client-side `useMemo`)
- [ ] Stats (totalInvest, concluded, inProgress) computados da resposta
- [ ] `npm run build` passa

**Tests**: none (UI integration)
**Gate**: build

---

### T10: Final Validation Gate

**What**: Rodar validação completa backend + frontend
**Depends on**: T9 (todas as peças integradas)
**Requirement**: MGA-01, MGA-02, MGA-03, MGA-04

**Done when**:
- [ ] Backend: `ruff check . && mypy . && pytest` — tudo verde
- [ ] Frontend: `npm run lint && npm run type-check && npm run build` — tudo verde

**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2

Phase 2 (Parallel after T2):
  T2 complete, then:
    ├── T3 [P] ──→ T8 [P] (after T3 only)
    ├── T4 [P] ──┐
    └── T5 [P] ──┤
                  ├──→ T6 (after T4, T1)
                  └──→ T7 (after T5)

Phase 3 (Sequential):
  T6, T7, T8 complete, then:
    T9 (after T7)

Phase 4:
  T10 (after T9)
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: ORM model | 1 file | ✅ Granular |
| T2: Pydantic types | 1 file | ✅ Granular |
| T3: Data layer | 1 file, 3 functions | ✅ Granular |
| T4: Handler/router | 1 file, 1 endpoint | ✅ Granular |
| T5: TypeScript types | 1 file | ✅ Granular |
| T6: Register + import | 2 files (1-line edits) | ✅ Granular |
| T7: Frontend service | 1 file, 1 method | ✅ Granular |
| T8: Bootstrap seed | 1 file, 1 function | ✅ Granular |
| T9: Page update | 1 file modification | ✅ Granular |
| T10: Validation gate | Commands only | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | T1 → T2 | ✅ Match |
| T2 | None | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T2 → T4 | ⚠️ Diagram says T2→T4 but body says depends on T3. Body is correct — handler needs data layer. Fix diagram. |
| T5 | T2 | T2 → T5 | ✅ Match |
| T6 | T4, T1 | T4 → T6, T1 → T6 | ✅ Match |
| T7 | T5 | T5 → T7 | ✅ Match |
| T8 | T3 | T3 → T8 | ✅ Match |
| T9 | T7 | T7 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Test Required | Task Says | Status |
|---|---|---|---|---|
| T1 | ORM model | none | none | ✅ OK |
| T2 | Pydantic types | none | none | ✅ OK |
| T3 | Data layer | integration | integration | ✅ OK |
| T4 | Handler | integration | integration | ✅ OK |
| T5 | TS types | none | none | ✅ OK |
| T6 | Wiring | none | none | ✅ OK |
| T7 | Service | none | none | ✅ OK |
| T8 | Seed | none | none | ✅ OK |
| T9 | Page component | none | none | ✅ OK |
| T10 | Gate | build | build | ✅ OK |
