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
