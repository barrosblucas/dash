# Changelog — 2026-04-13

## feat: Docker Compose para backend e frontend

### Objetivo
Empacotar a aplicação para execução local via Docker Compose, mantendo o backend FastAPI, o frontend Next.js e a persistência do SQLite em um fluxo único de inicialização.

### Abordagem técnica
- `backend/Dockerfile` usa `python:3.13-slim`, instala as dependências do backend e sobe a API com `uvicorn backend.api.main:app`
- `frontend/Dockerfile` usa `node:20-slim`, instala dependências com `npm ci`, compila o Next.js e executa `next start`
- `docker-compose.yml` expõe as portas `8000` e `3000`, persiste o SQLite em volume nomeado e monta `receitas/` e `despesas/` em modo somente leitura
- `.dockerignore` e `frontend/.dockerignore` reduzem o contexto de build e evitam levar artefatos gerados para a imagem

### Arquivos criados
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `.dockerignore`
- `frontend/.dockerignore`
- `.context/changelog/CHANGELOG_2026_04_13.md`

### Arquivos alterados
- `README_PROJETO.md` — adicionada instrução oficial de execução via Docker Compose
- `.context/REPOMAP.md` — mapeamento atualizado com os novos artefatos de Docker
- `.context/PROJECT_STATE.md` — estado do projeto atualizado para refletir a entrega containerizada
- `.context/architecture.md` — decisão arquitetural registrada para o deploy local via Docker Compose

### Classificação
- Tipo: `mudanca_mecanica` (empacotamento/deploy sem alteração de regra de negócio)
- Domínio: `infraestrutura`

### Validação
- `docker compose config` ✅
- `docker compose build backend --progress=plain` não executou no ambiente atual por falta de acesso ao socket do Docker (`/var/run/docker.sock`)

## feat: Override de dev com hot reload

### Objetivo
Adicionar um fluxo de desenvolvimento em Docker Compose com hot reload para backend e frontend, sem afetar o compose de produção.

### Abordagem técnica
- `docker-compose.dev.yml` sobrescreve o backend com `uvicorn --reload` e monta `./backend` no container
- `frontend/Dockerfile.dev` instala dependências e executa `next dev` sem build de produção
- O frontend usa `CHOKIDAR_USEPOLLING` e `WATCHPACK_POLLING` para manter o reload confiável em container

### Arquivos criados
- `docker-compose.dev.yml`
- `frontend/Dockerfile.dev`

### Arquivos alterados
- `README_PROJETO.md` — adicionada instrução de execução dev com hot reload
- `.context/REPOMAP.md` — mapeamento atualizado com os artefatos dev
- `.context/PROJECT_STATE.md` — estado do projeto atualizado com o override dev

### Classificação
- Tipo: `mudanca_mecanica` (wiring de runtime/infraestrutura)
- Domínio: `infraestrutura`

### Validação
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml config` ✅
- `npm ci` no frontend ✅
- `npm run type-check` no frontend ✅
- `npm run build` no frontend ✅
- `npm run lint` no frontend ❌ (configuração atual do ESLint não resolve o preset `@tanstack/eslint-plugin-query`)
- `python3 -m compileall backend` ✅
- `python3 -m pytest` não disponível no ambiente atual (`No module named pytest`)

## fix: Build do frontend no Docker Compose

### Objetivo
Corrigir a falha de build do `frontend` no `docker compose` causada por inconsistência entre `package.json` e `package-lock.json` e por configuração inválida de regras no ESLint.

### Abordagem técnica
- Sincronizado o lockfile do frontend com `npm@10.8.2` (mesma major usada no build da imagem `node:20-slim`)
- Ajustada a configuração do ESLint em `frontend/.eslintrc.js`:
	- `extends` de `@tanstack/eslint-plugin-query` para `plugin:@tanstack/query/recommended`
	- inclusão explícita de `plugins: ['@typescript-eslint']` para resolver regras `@typescript-eslint/*`
	- regra `@tanstack/query/no-rest-deps` atualizada para `@tanstack/query/no-rest-destructuring`
- Executado `npm run lint -- --fix` para corrigir automaticamente violações de `import/order` que quebravam o `next build` dentro do container

### Arquivos alterados
- `frontend/package-lock.json`
- `frontend/.eslintrc.js`
- múltiplos arquivos TS/TSX no frontend (somente ajustes automáticos de lint/import-order)

### Classificação
- Tipo: `mudanca_mecanica` (ajuste de build/lint sem alteração de regra de negócio)
- Domínio: `frontend` e `infraestrutura`

### Validação
- `cd frontend && npx -y npm@10.8.2 ci` ✅
- `cd frontend && npm run lint -- --fix && npm run lint` ✅ (sem errors; warnings remanescentes)
- `cd frontend && npm run type-check` ✅
- `cd frontend && npm run build` ✅
- `docker compose build frontend --progress=plain` ✅
- `docker compose build backend --progress=plain` ✅
- `docker compose up -d` ❌ no ambiente atual por restrição externa do runtime Docker host:
	- `OCI runtime create failed ... open sysctl net.ipv4.ip_unprivileged_port_start ... permission denied`
	- reproduzido também com `docker run --rm hello-world`, indicando bloqueio do host e não da aplicação
