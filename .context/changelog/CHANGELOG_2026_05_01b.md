# Changelog 2026-05-01b

## Funcionalidades Novas

### Backend — Painel de Informações Rápidas (endpoints dinâmicos)

#### Obra em Destaque (`GET /api/v1/obras/destaque`)
- **Added** Método `get_most_recently_updated()` em `SQLObraRepository` que retorna a obra ordenada por `updated_at DESC`, limit 1.
- **Added** Rota `GET /destaque` em `obra_handler.py` que expõe a obra mais recentemente atualizada no mesmo formato de `ObraResponse`.

#### Próxima Licitação (`GET /api/v1/licitacoes/proxima`)
- **Added** Rota `GET /proxima` em `licitacao_handler.py` que busca licitações do ComprasBR, filtra por `dataAbertura ≥ hoje`, ordena pela data mais próxima e retorna o primeiro item. Fallback para a licitação mais recente se nenhuma futura for encontrada.

#### Feature Notícias do Município
- **Added** Nova feature `features/noticias/` com adapter mockado para notícias do município.
  - `noticias_types.py`: schema `NoticiaResponse` (titulo, chamada, link, data_publicacao, fonte)
  - `noticias_adapter.py`: ACL com dados mockados demonstrativos; preparado para substituir por fonte RSS/API oficial
  - `noticias_handler.py`: endpoint `GET /api/v1/noticias/ultima`
- **Added** Registro do router `noticias_router` em `main.py`.

### Frontend — Cards dinâmicos no Painel de Informações Rápidas
- **Changed** `portal-client.tsx` (refatorado de 398 → 249 linhas):
  - Dados estáticos extraídos para `components/portal/portal-data.ts`
  - Componentes de card extraídos para `components/portal/QuickInfoCard.tsx`
  - **Contas Públicas**: exibe `Total arrecadado até o momento: R$ XX,X Mi` via `GET /api/v1/kpis/`. Ao clicar → `/dashboard`.
  - **Obras em Destaque**: exibe título + "atualizado há X dias" via `GET /api/v1/obras/destaque`. Ao clicar → `/obras/[hash]`.
  - **Aviso de Licitação**: exibe modalidade + edital + objeto via `GET /api/v1/licitacoes/proxima`. Ao clicar → `/avisos-licitacoes`.
  - **Iluminação Pública**: mantido estático (não alterado).
  - **Notícias do Município**: exibe chamada da notícia via `GET /api/v1/noticias/ultima`. Ao clicar → link externo da notícia.
  - Todos os cards possuem estado de loading (skeleton pulse) e tratamento de erro (fallback message).
- **Added** `services/portal-service.ts`: serviço centralizado com `fetchObraDestaque`, `fetchProximaLicitacao`, `fetchUltimaNoticia`, `fetchReceitasTotais`.

## Arquivos criados
- `backend/features/noticias/__init__.py`
- `backend/features/noticias/noticias_types.py`
- `backend/features/noticias/noticias_adapter.py`
- `backend/features/noticias/noticias_handler.py`
- `frontend/components/portal/portal-data.ts`
- `frontend/components/portal/QuickInfoCard.tsx`
- `frontend/services/portal-service.ts`

## Arquivos modificados
- `backend/api/main.py`
- `backend/features/obra/obra_data.py`
- `backend/features/obra/obra_handler.py`
- `backend/features/licitacao/licitacao_handler.py`
- `frontend/app/portal-client.tsx`

## Validação

### Backend
- `ruff check .` — 1 erro pré-existente em `connection.py` (import ordering, não relacionado)
- `mypy .` — Success: no issues found
- `pytest tests/ -q` — 123 passed

### Frontend
- `npm run lint` — ✔ No ESLint warnings or errors
- `npm run type-check` — ✔ No errors
- `npm run build` — ✓ Compiled successfully, 40 static pages + 6 dynamic + 1 middleware

## Riscos e observações
- Feature `noticias` usa dados mockados. Substituir adapter por fonte RSS/API oficial quando disponível.
- Endpoint `licitacoes/proxima` depende da API externa ComprasBR — indisponibilidade retorna 502.
- Dados de receita total vêm do endpoint `/api/v1/kpis/` (ano mais recente com dados).
