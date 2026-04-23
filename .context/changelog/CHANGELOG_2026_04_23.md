# Changelog 2026-04-23

## Configurado
- **Alembic migrations no backend** (`backend/alembic/`)
  - `alembic.ini` e `alembic/env.py` configurados para usar `backend.shared.database.models.Base` e a engine do projeto (`create_db_engine`)
  - `env.py` carrega settings de forma segura via imports do projeto (sem hardcode de segredos)
  - Migration inicial `f9d741c1a962_initial.py` gerada com `--autogenerate`, cobrindo todas as 10 tabelas:
    - `receitas`, `despesas`, `forecasts`, `metadata_etl`, `receita_detalhamento`, `scraping_log`
    - `users`, `identity_tokens`, `obras`, `obra_medicoes`
  - Validação de ciclo completo: `upgrade head` → `downgrade -1` → `upgrade head` executados com sucesso em banco limpo

## Alterado
- **`backend/api/main.py`**
  - Adicionada checagem de `SKIP_AUTO_DB_INIT` no `lifespan`: quando a variável está ativa, `init_database()` (que chama `Base.metadata.create_all`) é pulado, permitindo que Alembic seja a única fonte de verdade para schema em ambientes migrados
  - Mantida compatibilidade total: sem a variável, o comportamento anterior continua idêntico

## Decisões importantes
- O banco de desenvolvimento existente (`database/dashboard.db.pre_alembic`) foi preservado como backup; o banco ativo foi reconstruído pela migration inicial para garantir baseline limpa
- Para bancos existentes em produção que não podem ser dropados, a estratégia recomendada é: aplicar manualmente as diferenças (novas tabelas + remoção de colunas órfãs como `mes_numero`) ou fazer dump/reload via migration
- `create_all` continua disponível como fallback de bootstrap em ambientes sem Alembic ativo

## Corrigido
- **Gate `mypy .` restaurado para verde global** — 95 erros em 17 arquivos corrigidos
  - `features/receita/receita_data.py`: `cast()` em leituras de `Column[T]` → `T`; `# type: ignore[assignment]` em escritas
  - `features/despesa/despesa_data.py`: mesmo padrão de `cast()` + guarda `if resultado is None` para queries agregadas
  - `features/scraping/scraping_helpers.py`, `scraping_handler.py`, `scraping_orchestrator.py`: `cast()` e `# type: ignore[assignment]` para atributos ORM
  - `shared/pdf_extractor.py`: `cast(Decimal, previsto)` para valores extraídos de parser
  - `reimport_data.py`, `init_db.py`, `init_db_simple.py`: anotações de tipo mínimas (`-> None`, `-> int`, etc.)
  - `tests/test_ml/test_forecasting_service.py`: `cast(Session, _FakeDB(...))` para compatibilidade de tipo do fake
  - Handlers (`receita`, `despesa`, `kpi`, `forecast`, `export`) e `api/main.py`: retornos tipados + ajustes de operadores aritméticos com `None`
  - `features/forecast/forecast_business.py`: `# type: ignore[import-untyped]` no import do Prophet

## Decisões importantes
- Para `Column[T]` vs `T` em repositórios legados, preferiu-se `cast(T, coluna)` em vez de refactor para `Mapped[T]`, mantendo o diff mínimo e preservando comportamento
- Para escritas em atributos ORM (`model.ano = valor`), usou-se `# type: ignore[assignment]` porque SQLAlchemy 2.0 aceita valores primitivos em descriptors, mas o mypy strict vê `Column[T]`
- Variáveis `existing`/`model` reutilizadas em blocos distintos de `init_db.py` foram renomeadas em um dos blocos para evitar shadowing de tipos (`ReceitaModel` → `DespesaModel`)
- Handlers com parâmetros `int | None = Query(default=...)` usaram `assert param is not None` antes da chamada ao business, pois o default garante valor em runtime

## Adicionado
- **Testes automatizados no frontend (Vitest + jsdom + React Testing Library)**
  - Instaladas dependências: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
  - Criado `frontend/vitest.config.ts` com environment `jsdom`, path aliases `@/*` e setup file
  - Criado `frontend/test/setup.ts` importando matchers do `jest-dom` para Vitest
  - Criado `frontend/test/vitest.d.ts` com referências de tipos para `vitest/globals` e `@testing-library/jest-dom`
  - Criado `frontend/test/helpers.tsx` com `renderWithQuery` (wrapping em `QueryClientProvider`)
  - Script `test` adicionado ao `package.json`: `vitest run`
  - **24 testes em 6 arquivos cobrindo fluxos críticos da área administrativa:**
    - `LoginPageClient.test.tsx`: renderização do formulário, redirecionamento com sessão ativa, submit com credenciais válidas, erro com credenciais inválidas
    - `AdminShell.test.tsx`: tela de carregamento, redirecionamento para login sem sessão, redirecionamento para dashboard quando role não é admin, renderização com sessão admin, logout
    - `UsersListPage.test.tsx`: listagem de usuários, estado de carregamento, mensagem de erro, botão de novo usuário
    - `UserForm.test.tsx`: criação de usuário com campo senha, edição de usuário com preenchimento de dados, reset de senha com exibição do token/link
    - `ObrasListPage.test.tsx`: listagem de obras, exclusão de obra, mensagem de erro
    - `ObraForm.test.tsx`: criação com campos preenchidos, edição de medições (alteração de valor), adição e remoção de medição
  - Serviços mockados sem dependência do backend real: `auth-service.ts`, `user-service.ts`, `obra-service.ts`
  - Stores mockadas: `authStore`, `themeStore`
  - `next/navigation` e `next/link` mockados para isolamento dos componentes client
  - Validação final: `npm run lint && npm run type-check && npm run test && npm run build` — **todos verdes**

## Alterado
- **Reformulação visual da página de cadastro/edição de obras (`ObraForm.tsx` + `AdminFields.tsx`)**
  - Problema: campos de formulário ficavam "apagados" porque `baseFieldClassName` usava `bg-surface-container-low` sem borda, mesclando visualmente com o fundo do card do formulário (`bg-surface-container-low`)
  - Solução em `frontend/components/admin/forms/AdminFields.tsx`:
    - Fundo dos campos alterado para `bg-surface-container-lowest` para criar elevação
    - Adicionada borda sutil `border-outline/40` com hover `border-outline/60`
    - Adicionado `focus:border-primary` para destaque no foco
    - Adicionado `placeholder:text-on-surface-variant/50` para futuros placeholders
  - Solução em `frontend/components/admin/obras/ObraForm.tsx`:
    - Formulário reorganizado em seções temáticas com ícones e títulos: *Informações básicas*, *Localização e progresso*, *Valores financeiros*, *Medições mensais*
    - Cada seção envolvida em card interno (`bg-surface-container-lowest`) criando hierarquia visual clara
    - Botões de ação aprimorados com ícones (`save`, `delete`, `add`, `sync`) e estado hover
    - Adicionado botão "Cancelar" ao lado do botão de submit
    - Campo "Valor economizado" reposicionado dentro da seção financeira
    - Cards de medição receberam borda `border-outline/20` e fundo `bg-surface` para melhor separação entre itens
  - Validação: `npm run lint && npm run type-check && npm run build` — todos verdes

## Corrigido
- **Ambiente virtual do backend com dependências faltantes**
  - Sintoma: `ImportError: email-validator is not installed` ao iniciar a aplicação (`backend/shared/security.py` também falhava com `No module named 'jwt'`)
  - Causa: o venv em `/home/thanos/dashboard/venv` estava desatualizado/inconsistente em relação ao `backend/requirements.txt`
  - Ação: reinstalação completa das dependências via `pip install -r requirements.txt` no venv do projeto
  - Validação: `ruff check .`, `mypy .` e `pytest` — todos verdes após a correção

## Riscos reais restantes
- `cast()` em leituras ORM assume que colunas não-nulas nunca retornam `None`; se o banco violar isso, o erro será em runtime (não novo — reflete contrato implícito)
- `# type: ignore[assignment]` em escritas ORM mascara eventuais bugs reais de tipo; mitigado pelo fato de que entidades são validadas por Pydantic antes de chegarem ao repositório
- Scripts `init_db.py` e `reimport_data.py` não possuem cobertura de teste automatizado; as mudanças foram puramente de tipo/rename, sem alteração de lógica
- Prophet continua sem stubs; o bypass `# type: ignore[import-untyped]` permanece enquanto não houver stubs oficiais
