# Management Actions Admin — Design

**Spec**: `.specs/features/management-actions-admin/spec.md`
**Status**: Draft

---

## Architecture Overview

Extensão da feature `management-actions` existente. Novos endpoints admin + páginas admin no frontend.

```mermaid
graph TD
    A[/admin/acoes] --> B[AcoesListPage]
    A1[/admin/acoes/new] --> C[ActionForm]
    A2[/admin/acoes/[id]] --> C
    B --> D[managementActionsAdminService]
    C --> D
    D --> E[POST/PUT/DELETE /api/v1/management-actions]
    E --> F[management_actions_handler.py]
    F --> G[management_actions_data.py]
    G --> H[(SQLite)]
```

---

## Code Reuse Analysis

| Component | Location | How to Use |
|---|---|---|
| `AdminShell` | `components/admin/AdminShell.tsx` | Já envolve todas páginas `/admin/*` |
| `AdminFields` | `components/admin/forms/AdminFields.tsx` | `InputField`, `TextareaField`, `SelectField` |
| `action_to_dict` | `management_actions_data.py` | Já existe, reusar nos novos endpoints |
| `list_actions` | `management_actions_data.py` | Adicionar funções `get_action_by_id`, `update_action`, `delete_action` |
| `ActionRecord` | `management_actions_types.py` | Já existe, reusar como response |
| `QUERY_KEYS` | `frontend/lib/constants.ts` | Adicionar chave `admin` para management-actions |

### Páginas admin existentes como referência

| Template | Location |
|---|---|
| Lista | `components/admin/legislacoes/LegislacoesListPage.tsx` |
| Formulário | `components/admin/legislacoes/LegislacaoForm.tsx` |
| Service admin | `services/legislacao-service.ts` |
| Service admin endpoints | `services/api.ts` (API_ENDPOINTS ou inline) |

---

## Components

### Backend: Data Layer (extensão)

- **Purpose**: Adicionar `get_action_by_id`, `update_action`, `delete_action` ao módulo existente
- **Location**: `backend/features/management_actions/management_actions_data.py` (modify)
- **Reuses**: `action_to_dict` existente

### Backend: Pydantic Types (extensão)

- **Purpose**: Adicionar `ActionCreateRequest`, `ActionUpdateRequest`
- **Location**: `backend/features/management_actions/management_actions_types.py` (modify)
- **Reuses**: `ActionRecord` existente como response

### Backend: Handler (extensão)

- **Purpose**: Adicionar POST, PUT, DELETE protegidos por `require_admin_user`
- **Location**: `backend/features/management_actions/management_actions_handler.py` (modify)
- **Interfaces**:
  - `POST /management-actions` → `ActionRecord` (201)
  - `PUT /management-actions/{id}` → `ActionRecord`
  - `DELETE /management-actions/{id}` → 204

### Frontend: Types (extensão)

- **Purpose**: Adicionar `ManagementActionCreatePayload`, `ManagementActionUpdatePayload`
- **Location**: `frontend/types/management-actions.ts` (modify)

### Frontend: Service (extensão)

- **Purpose**: Adicionar `create`, `update`, `remove` ao service existente
- **Location**: `frontend/services/management-actions-service.ts` (modify)

### Frontend: List Page

- **Purpose**: Tabela com grid de ações + botão criar + ações editar/excluir
- **Location**: `frontend/components/admin/management-actions/AcoesListPage.tsx` (new)
- **Reuses**: Padrão `LegislacoesListPage`, `AdminFields`

### Frontend: Form Component

- **Purpose**: Formulário criar/editar com todos os 14 campos
- **Location**: `frontend/components/admin/management-actions/ActionForm.tsx` (new)
- **Reuses**: `InputField`, `TextareaField`, `SelectField` de `AdminFields`

### Frontend: Page Routes (3 arquivos)

- `/admin/acoes/page.tsx` → `AcoesListPage`
- `/admin/acoes/new/page.tsx` → `ActionForm`
- `/admin/acoes/[id]/page.tsx` → `ActionForm actionId={id}`

---

## Data Models (Pydantic extensions)

### ActionCreateRequest

```python
class ActionCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(..., min_length=1, max_length=100)
    category_icon: str = Field(..., min_length=1, max_length=100)
    investment_raw: float = Field(..., ge=0)
    impact_label: str = Field(..., min_length=1, max_length=100)
    impact_number: float = Field(..., ge=0)
    impact_suffix: str = ""
    image: str | None = None
    month: str = Field(..., min_length=1, max_length=50)
    year: str = Field(..., min_length=4, max_length=4)
    status: ActionStatus = ActionStatus.EM_ANDAMENTO
    color: str = Field(default="#3b82f6", min_length=7, max_length=7)
    progress: float = Field(default=0.0, ge=0, le=100)
```

### ActionUpdateRequest

```python
class ActionUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    ...
    progress: float | None = Field(default=None, ge=0, le=100)
```
Todos os campos opcionais (`= None`), usando `exclude_unset=True` no update.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Ação não encontrada (PUT/DELETE) | 404 + detail |
| Payload inválido | 422 FastAPI automático |
| DB offline | 500 |
