# Changelog 2026-04-27

## Correções

### Backend — Scraping (Schema desalinhado: `receita_detalhamento`)
- **Fixed** `sqlalchemy.exc.OperationalError: table receita_detalhamento has no column named valores_mensais` durante execução de `scrape_receitas`.
  - Causa raiz: o modelo SQLAlchemy `ReceitaDetalhamentoModel` possui as colunas `valores_mensais` (Text) e `valores_anulados_mensais` (Text), adicionadas via migration `686fd3aaaeb2`, mas o schema real do SQLite (`database/dashboard.db`) não as continha. A tabela `alembic_version` não existe no banco, indicando que o banco foi criado/gerenciado fora do fluxo de migrations Alembic.
  - Solução: aplicado `ALTER TABLE receita_detalhamento ADD COLUMN valores_mensais TEXT` e `ALTER TABLE receita_detalhamento ADD COLUMN valores_anulados_mensais TEXT` diretamente no banco de produção.
  - Verificação pós-correção: script de consistência comparando todos os modelos SQLAlchemy contra `PRAGMA table_info` retornou "Schema fully aligned" — nenhuma outra tabela desalinhada.
  - Observação técnica: ausência da tabela `alembic_version` no banco significa que o schema é gerenciado manualmente ou via `Base.metadata.create_all()`. Recomenda-se avaliar a adoção do fluxo Alembic para o banco de dados principal ou, no mínimo, garantir que `create_tables()` seja executado após alterações de modelo.

## Validação
- Schema consistency check (all models vs. SQLite PRAGMA) — pass
- `ruff check .` — pass
- `mypy .` — pass
- `pytest` — suite completa pass

## Débito técnico
- Resolvido: `database/dashboard.db` agora possui tabela `alembic_version` e está sincronizado com as migrations. O startup da aplicação executa `alembic upgrade head` automaticamente, garantindo que o schema runtime nunca mais fique desalinhado do modelo SQLAlchemy.

### Backend — Infra (Alembic no startup)
- **Added** execução automática de `alembic upgrade head` no lifespan do FastAPI, substituindo `init_database()` (que usava `Base.metadata.create_all()`).
  - Arquivos modificados:
    - `backend/shared/database/connection.py` — nova função `run_alembic_upgrade()` que configura o `AlembicConfig` programaticamente, apontando `script_location` para o diretório absoluto de migrations e detecta bancos legados sem `alembic_version` para fazer `stamp` da revision base antes do `upgrade head`.
    - `backend/alembic/env.py` — `run_migrations_online()` agora lê `sqlalchemy.url` do config e passa o `db_path` correto para `create_db_engine()`, garantindo que migrations CLI e programática usem o mesmo banco.
    - `backend/api/main.py` — lifespan chama `run_alembic_upgrade()` no lugar de `init_database()`; log atualizado.
    - `backend/tests/conftest.py` — monkeypatch ajustado para `run_alembic_upgrade`.
  - Estratégia de compatibilidade com bancos legados:
    - Se o banco existe mas não possui tabela `alembic_version`, a função detecta o schema existente e executa `alembic stamp <base>` antes de `upgrade head`, evitando falhas de "table already exists".
    - Bancos novos recebem todas as migrations normalmente.
  - `init_database()` mantido como fallback para scripts legados (`init_db.py`, `reimport_data.py`, etc.) que ainda usam `Base.metadata.create_all()`.
  - Validação:
    - `ruff check .` — pass
    - `mypy .` — pass
    - `pytest` — 100% pass
    - Teste manual: banco existente (`dashboard.db`) e banco novo (temp) aplicaram migrations com sucesso.


### Frontend — Obras (POST /api/v1/obras retornando 422 sem detalhe)
- **Fixed** HTTP 422 no formulário de criação de obra sem mensagem de erro visível para o usuário. Três problemas identificados e corrigidos:
  1. **Erro 422 sem detalhe**: o interceptor de erro do `apiClient` (`frontend/services/api.ts`) tratava apenas status 400, mas não 422. O backend FastAPI retorna erros de validação Pydantic como 422 com array de `detail`. O interceptor agora unifica 400 e 422, extrai o detalhe estruturado do backend (`loc[].msg`) e exibe mensagem legível no frontend.
  2. **Validação frontend vs backend desalinhada em `titulo`/`descricao`**: o backend exige `min_length=3` para ambos os campos, mas a validação frontend (`validatePayload`) apenas verificava se os campos não estavam vazios. Títulos com 1-2 caracteres passavam na validação local mas falhavam no backend com 422. Corrigido para `< 3`.
  3. **Validação de arrays incompleta**: `validatePayload` verificava apenas `locations[0]` e `funding_sources[0]`. Itens adicionais adicionados via "Adicionar local"/"Adicionar fonte" com campos vazios passavam na validação frontend mas falhavam no backend. Corrigido para iterar todos os itens com `forEach`.
- Arquivos modificados:
  - `frontend/services/api.ts` — interceptor de erro agora cobre `status === 400 || status === 422` com extração de `detail` array.
  - `frontend/components/admin/obras/obra-form-helpers.ts` — `validatePayload` refatorado: `titulo`/`descricao` com min length 3; validação de todos os `locations` e `funding_sources` em vez de apenas o primeiro; remoção de checagem duplicada.
- Validação:
  - `npx tsc --noEmit` — pass
  - `npm run lint` — pass
  - `npm run build` — pass
  - `ruff check .` (backend) — pass (fix de import sorting em `connection.py`)
  - `pytest` — suite completa pass

### Frontend — Obras (Upload bloqueando após primeira foto)
- **Fixed** impossibilidade de anexar mais de uma foto na página de obras sem recarregar (F5).
  - Causa raiz: o `event.currentTarget.value = ''` no `onChange` do `<input type="file">` não era suficiente para resetar o input no ciclo de renderização do React. O browser mantinha estado interno que impedia novas seleções.
  - Solução: substituído por `key={fileInputKey}` com contador `useState`, forçando React a desmontar e remontar o elemento DOM a cada seleção — padrão confiável para reset de file inputs.
  - Arquivos modificados:
    - `frontend/components/admin/obras/ObraMediaEditor.tsx`
  - Validação:
    - `npm run lint` — pass
    - `npm run type-check` — pass
    - `npm run build` — pass
    - `npx vitest run ObraForm ObrasListPage` — 7/7 pass

### Frontend — Obras (Máscara monetária BRL ao vivo)
- **Added** `CurrencyField` — componente dedicado com máscara monetária brasileira em tempo real.
  - Comportamento: últimos 2 dígitos sempre representam centavos. Ex: digitar `123456` → `1.234,56`.
  - Cursor preservado entre reformatações via `computeCursor()` + `requestAnimationFrame`.
  - Substitui o `InputField` genérico com `toCurrencyInput` nos campos: `Valor orçamento`, `Valor original`, `Valor aditivo`, `Valor convênio`, `Valor contrapartida`, `Valor homologado`, `Valor da medição`, `Valor da fonte`.
  - `FieldShell` e `baseFieldClassName` exportados de `AdminFields.tsx` para reuso por `CurrencyField` sem duplicação de markup.
  - Removido estado `focusedField` + lógica de blur — máscara inline torna desnecessário.
  - Arquivos modificados:
    - `frontend/components/admin/obras/CurrencyField.tsx` — novo
    - `frontend/components/admin/forms/AdminFields.tsx` — export `FieldShell` + `baseFieldClassName`
    - `frontend/components/admin/obras/ObraForm.tsx` — `CurrencyField` nos campos financeiros e fonte
    - `frontend/components/admin/obras/ObraMeasurementsSection.tsx` — `CurrencyField` no valor da medição
    - `frontend/components/admin/obras/obra-form-helpers.ts` — removido `toCurrencyInput` (substituído pela máscara)
    - `frontend/components/admin/obras/ObraForm.test.tsx` — ajustado `getByDisplayValue` e valores de digitação para refletir a máscara (6 dígitos = centavos nos 2 últimos)
  - Validação:
    - `npm run lint` — pass
    - `npm run type-check` — pass
    - `npm run build` — pass
    - `npx vitest run ObraForm ObrasListPage` — 7/7 pass

### Frontend — Obras (Detalhamento de obra reformulado)
- **Added** 6 novos componentes para a página pública de detalhes da obra (`/obras/[id]`), seguindo o layout do design system `obras_detalhes`:
  1. `ObraProgressChart` — gráfico de linha Recharts com evolução planejada (tracejada cinza) vs realizada (verde), calculada a partir das medições e datas de início/previsão.
  2. `ObraFinancialChart` — gráfico de barras Recharts com desembolso financeiro mensal por medição, com hover em secondary.
  3. `ObraStatusPanel` — painel lateral com Status Atual (% físico), barra de progresso, atraso estimado (quando houver divergência físico/financeiro) e card de Valor Total Empenhado com ícone decorativo.
  4. `ObraMeasurementHistory` — tabela sem bordas ("No-Line" rule) com histórico de medições, % de avanço acumulado, valor medido e status chip (Aprovado/Pago).
  5. `ObraLocationMap` — mapa Leaflet interativo com toggle Padrão/Satélite, markers numerados e popup com endereço.
  6. `ObraPhotoGallery` — galeria de fotos filtradas por tipo de mídia, com grid responsivo e lightbox navegável via teclado (Escape, setas).
- **Changed** `obra-detalhe-client.tsx` reorganizado em novo layout: grid de charts + status (lg:grid-cols-3), seguido de informações gerais, histórico de medições e mapa + galeria. Todas as informações pré-existentes (métricas, cronograma, medições mensais, locais, fontes, anexos) foram mantidas.
- **Added** barrel export `frontend/components/obras/index.ts`.
- Arquivos criados:

  - `frontend/components/obras/ObraProgressChart.tsx` (229 linhas)
  - `frontend/components/obras/ObraFinancialChart.tsx` (146 linhas)
  - `frontend/components/obras/ObraStatusPanel.tsx` (125 linhas)
  - `frontend/components/obras/ObraMeasurementHistory.tsx` (134 linhas)
  - `frontend/components/obras/ObraLocationMap.tsx` (144 linhas)
  - `frontend/components/obras/ObraPhotoGallery.tsx` (169 linhas)
  - `frontend/components/obras/index.ts`

- Arquivo modificado: `frontend/app/obras/[id]/obra-detalhe-client.tsx`
- Validação:
  - `npm run lint` — pass
  - `npm run type-check` — pass
  - `npm run build` — pass