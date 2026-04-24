### 2026-04-23 — feat(backend): entregar V1 de Saúde Transparente no FastAPI

**Classificação:** `borda_externa`

**Adicionado:**
- feature `backend/features/saude/` com contratos Pydantic, ACL HTTP do E-Saúde, persistência SQLAlchemy, orquestração de sync/importação e scheduler APScheduler a cada 6h
- endpoints públicos `/api/v1/saude/*` para medicamentos em estoque, medicamentos dispensados, perfil epidemiológico, perfil demográfico, procedimentos por tipo, unidades, horários e `sync-status`
- endpoints administrativos `/api/v1/saude/admin/*` para CRUD de unidades, atualização de horários, importação inicial do E-Saúde e trigger manual de sync
- novas tabelas SQLite `saude_unidades`, `saude_unidade_horarios`, `saude_snapshots` e `saude_sync_logs` com migration Alembic `7b6610d4f1c2_add_saude_transparente_v1.py`

**Alterado:**
- `backend/api/main.py` agora registra o router de saúde e inicia o scheduler da feature no lifespan sem quebrar os testes
- `backend/shared/settings.py` recebeu settings seguros para base URL, timeout e intervalo de sync do E-Saúde
- `backend/tests/conftest.py` ganhou fake scheduler da feature para manter o ciclo de testes isolado de chamadas externas

**Testes:**
- novos testes de integração `backend/tests/test_api/test_saude.py`
- novos testes unitários `backend/tests/test_etl/test_saude_scheduler.py`
- validação backend completa verde: `ruff check . && mypy . && pytest`

**Limitação conhecida:**
- o chart público `quantidade-de-atendimento-por-sexo` do E-Saúde retorna `404`; no V1, o backend deriva `por_sexo` a partir dos quantitativos canônicos para manter o dashboard integrável

### 2026-04-23 — fix(frontend): eliminar CORS em chamadas admin via proxy reverso

**Problema:** Ao criar usuários e obras na área administrativa, o frontend exibia 
"Não foi possível conectar ao servidor. Verifique sua conexão." O login funcionava 
normalmente.

**Causa-raiz:** O \`authService\` faz chamadas via route handlers do Next.js 
(\`/api/auth/*\`, same-origin), enquanto \`usersService\` e \`obrasService\` 
(entre outros) usam \`apiClient\` com \`baseURL\` apontando diretamente ao backend 
(\`http://192.168.1.21:8000\`). Essa diferença arquitetural fazia com que operações 
admin executassem chamadas cross-origin do browser, sujeitas a bloqueio de CORS — 
resultando em \`error.request\` sem \`error.response\` (a mensagem de erro exibida).

**Correção:**
- \`next.config.js\`: adicionado \`rewrites()\` para proxiar \`/api/v1/:path*\` e \`/health\` 
  ao backend via Next.js (server-side), eliminando chamadas cross-origin do browser.
- \`lib/constants.ts\`: \`API_ENDPOINTS.base\` alterado de \`process.env.NEXT_PUBLIC_API_URL\` 
  para string vazia, direcionando todas as chamadas \`apiClient\` ao mesmo origin 
  (Next.js rewrites encaminha ao backend).

**Arquitetura alinhada:** Agora TODAS as chamadas de API passam pelo servidor Next.js 
(proxy reverso), consistente com o ADR-002 (route handlers como borda). O browser nunca 
contata o backend diretamente — elimina CORS, simplifica configuração e oculta a URL 
do backend do client.

**Arquivos alterados:**
- \`frontend/next.config.js\`
- \`frontend/lib/constants.ts\`

**Classificação:** \`borda_externa\` (mudança na borda de comunicação frontend↔backend)

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

### 2026-04-23 — feat(frontend): entregar V1 de Saúde Transparente no portal e no admin

**Classificação:** `borda_externa`

**Adicionado:**
- contratos TypeScript da feature `saude` em `frontend/types/saude.ts` e client HTTP dedicado em `frontend/services/saude-service.ts`
- páginas públicas `/saude`, `/saude/medicamentos`, `/saude/perfil-epidemiologico`, `/saude/procedimentos` e `/saude/unidades`
- página administrativa `/admin/saude/unidades` com listagem, cadastro/edição inline, horários por dia, importação do E-Saúde e trigger manual de sync
- mapa Leaflet client-only (`leaflet` + `react-leaflet`) com markers, popup com horários e botão de geolocalização do usuário
- testes unitários para helpers da feature e normalização do service de saúde

**Alterado:**
- `Sidebar.tsx`, `PortalHeader.tsx`, `portal-client.tsx` e `AdminShell.tsx` agora expõem navegação para Saúde Transparente
- home do portal ganhou card de acesso para Saúde sem quebrar a malha visual existente

**Validação:**
- frontend verde com `npm run lint && npm run type-check && npm run test && npm run build`

**Limitações conhecidas:**
- a página pública de unidades depende dos horários cadastrados no backend por unidade; quando ausentes, o popup mostra estado vazio
- o build continua emitindo avisos legados de `metadataBase` não configurado, sem relação com a feature de saúde

### 2026-04-23 — refactor(frontend): separar dados operacionais da Saúde Transparente entre público e admin

**Classificação:** `mudanca_mecanica`

**Contexto:** A página pública de Saúde Transparente exibia seções operacionais (status da rotina, snapshots recentes, logs recentes) que são informações de gestão, não de transparência pública.

**Alterado:**
- `frontend/app/saude/saude-client.tsx`: removidas seções de status da rotina (Sincronizando agora, Próxima execução, Snapshots disponíveis), Snapshots recentes e Logs recentes. Página pública agora exibe apenas hero e cards de navegação (Medicamentos, Perfil epidemiológico, Procedimentos, Unidades).
- `frontend/components/admin/AdminHomePage.tsx`: adicionado card de navegação "Saúde Transparente" e seção completa de monitoramento da sincronização com status da rotina, snapshots recentes e logs recentes.

**Adicionado:**
- `frontend/components/admin/AdminSaudeSyncPanel.tsx`: client component com painel de status da rotina (Sincronizando agora, Próxima execução, Snapshots disponíveis), lista de Snapshots recentes e Logs recentes — antes na página pública, agora exclusivo do admin.

**Validação:**
- `npm run lint && npm run type-check && npm run build` — todos verdes

### 2026-04-23 — feat(backend): expandir Saúde Transparente para vacinação, visitas, atenção primária, bucal, hospital e farmácia

**Classificação:** `borda_externa`

**Adicionado:**
- novos contratos públicos do backend em `/api/v1/saude/vacinacao`, `/visitas-domiciliares`, `/atencao-primaria`, `/saude-bucal`, `/hospital` e `/farmacia`
- novos snapshots sincronizados para vacinação, visitas domiciliares, atendimento por sexo, atenção primária, saúde bucal e hospital
- histórico real de snapshots para permitir tendência honesta em `perfil-epidemiologico`
- testes de integração dedicados para os dashboards novos e para os fallbacks live de `start_date` e `estabelecimento_id`

**Alterado:**
- feature `backend/features/saude/` refatorada em módulos menores (`saude_public_handler`, `saude_units_handler`, `saude_admin_handler`, `saude_sync`, `saude_snapshot_mapper`, `saude_public_live`, `saude_public_support`, `saude_unit_import`, `saude_resource_catalog`) para respeitar o hard limit de 400 linhas
- `/api/v1/saude/perfil-epidemiologico` agora usa o snapshot real de `quantidade-de-atendimento-por-sexo` e só retorna tendência quando existe histórico real
- `/api/v1/saude/medicamentos-dispensados` mantido compatível, enquanto `/api/v1/saude/farmacia` reaproveita os snapshots de farmácia já existentes
- `sync-status` passou a listar apenas o snapshot mais recente por recurso/escopo, mesmo mantendo histórico no banco

**Validação:**
- `cd backend && ../venv/bin/ruff check .` — verde
- `cd backend && ../venv/bin/pytest` — verde
- `cd backend && ../venv/bin/mypy .` — falha por débito pré-existente em `backend/scripts/seed_admin.py`

**Limitações conhecidas:**
- o backend expõe `hospital` com os recursos hoje disponíveis no E-Saúde e sinaliza `internacoes_por_mes`, `internacoes_por_cid` e `media_permanencia` em `recursos_indisponiveis`, porque esses endpoints seguem retornando `404`

### 2026-04-23 — feat(frontend): expandir Saúde Transparente para vacinação, visitas, APS, saúde bucal, hospital e farmácia

**Classificação:** `borda_externa`

**Adicionado:**
- novas páginas públicas `frontend/app/saude/vacinacao`, `visitas-domiciliares`, `atencao-primaria`, `saude-bucal`, `hospital` e `farmacia`
- componentes compartilhados da feature em `frontend/components/saude/SaudePageSection.tsx` e `SaudeFeatureNav.tsx` para unificar hero, cards, painéis e navegação contextual
- teste de renderização `frontend/app/saude/hospital/hospital-client.test.tsx` cobrindo estados explícitos de indisponibilidade hospitalar

**Alterado:**
- `frontend/app/saude/saude-client.tsx` agora expõe a navegação ampliada da Saúde Transparente e separa farmácia de medicamentos
- `frontend/app/saude/medicamentos/medicamentos-client.tsx` foi enxugado para estoque público; dispensação mensal migrou para `/saude/farmacia`
- `frontend/app/saude/perfil-epidemiologico/perfil-epidemiologico-client.tsx` passou a consumir tendência opcional nos quantitativos e focar no gráfico real por sexo
- `frontend/services/saude-service.ts`, `frontend/types/saude.ts` e `frontend/lib/saude-utils.ts` foram expandidos para os novos contratos HTTP da feature
- testes de `saude-service` e `saude-utils` ampliados para os contratos e helpers novos

**Validação:**
- `cd frontend && npm run lint`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
- `cd frontend && npm run type-check` (executado após o build para regenerar `.next/types`, já que a configuração do projeto inclui esses artefatos)

**Limitações conhecidas:**
- o filtro hospitalar por estabelecimento usa `estabelecimento_id` numérico porque o contrato atual não expõe catálogo/lista de estabelecimentos
- a forma exata do objeto de tendência em `perfil-epidemiologico` precisa continuar alinhada ao backend caso ele refine esse payload além de `direction/label/delta`
