# Management Actions — Spec

## Problem Statement

A página `/acoes` exibe ações da gestão municipal com dados 100% mockados em `constants.ts`. Não há backend, banco de dados ou API — qualquer alteração nos dados exige deploy de código. Precisamos de um backend que persista os dados e uma API REST para consumo do frontend.

## Goals

- [ ] Criar endpoint público `GET /api/v1/management-actions` que retorna todas as ações + estatísticas agregadas
- [ ] Migrar os 7 itens mockados para seed data no banco
- [ ] Frontend `/acoes` consumir API em vez de dados hardcoded
- [ ] Manter experiência visual e animações existentes da página

## Out of Scope

| Feature | Reason |
|---------|--------|
| Upload de imagens | Usaremos URLs externas (Unsplash) como já feito |
| Paginação da listagem | 7-20 itens, sem necessidade imediata |
| Painel admin para CRUD de ações | Feature futura; hoje dados são gerenciados via seed/DB direto |
| Autenticação na rota pública | Página pública, sem login |

---

## User Stories

### P1: Visitante visualiza ações da gestão ⭐ MVP

**User Story**: Como cidadão de Bandeirantes, quero acessar `/acoes` e ver as ações da gestão municipal com indicadores e progresso, para acompanhar os investimentos da prefeitura.

**Why P1**: A página já existe e é o core da feature — precisa funcionar com dados reais do backend.

**Acceptance Criteria**:

1. WHEN o visitante acessa `/acoes` THEN a página SHALL carregar ações via `GET /api/v1/management-actions`
2. WHEN a API retorna dados THEN a página SHALL exibir os mesmos cards, filtros, gráfico donut e stats que já existem
3. WHEN a API falha (erro de rede) THEN a página SHALL exibir estado de erro com feedback visual
4. WHEN o banco está vazio (zero ações) THEN a página SHALL exibir estado vazio informativo

**Independent Test**: Acessar `http://localhost:3000/acoes` e ver os 7 cards com dados vindos da API em vez do mock.

### P2: Bootstrap com dados seed ⭐ MVP

**User Story**: Como desenvolvedor, quero que os 7 itens mockados atuais sejam carregados automaticamente no banco como seed data, para que a página funcione imediatamente após o setup.

**Why P1 (part of MVP)**: Sem dados a página fica vazia — seed é indispensável para o funcionamento imediato.

**Acceptance Criteria**:

1. WHEN o backend inicializa THEN as 7 ações do mock atual SHALL estar disponíveis no banco (idempotente)
2. WHEN o seed roda novamente THEN ações existentes NÃO SHALL ser duplicadas

**Independent Test**: Subir backend, chamar `GET /api/v1/management-actions` e verificar 7 itens retornados.

---

## Edge Cases

- WHEN o banco está vazio THEN `GET /api/v1/management-actions` SHALL retornar `items: []` e `total: 0`
- WHEN uma ação tem `progress` fora do range 0-100 THEN a API SHALL normalizar para o range válido
- WHEN `investmentRaw` é zero ou negativo THEN a API SHALL tratá-lo normalmente (não quebrar divisão por zero no frontend)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MGA-01 | P1: GET endpoint público | Design | ✅ Verified |
| MGA-02 | P1: Frontend consumir API | Design | ✅ Verified |
| MGA-03 | P1: Loading/erro/vazio states | Design | ✅ Verified |
| MGA-04 | P2: Seed data idempotente | Design | ✅ Verified |

**Coverage:** 4 total, 4 mapped, 0 unmapped

---

## Success Criteria

- [ ] Página `/acoes` renderiza 7 cards idênticos aos atuais, mas via API
- [ ] `GET /api/v1/management-actions` retorna em < 200ms com SQLite
- [ ] Zero alterações visuais na página (mesmas animações, cores, layout)
- [ ] Dados mockados de `constants.ts` removidos do frontend
