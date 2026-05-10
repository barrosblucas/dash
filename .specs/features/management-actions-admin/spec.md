# Management Actions — Admin CRUD Spec

## Problem Statement

A feature `management-actions` já existe com endpoint público `GET /api/v1/management-actions` e seed data. Não há interface administrativa para criar, editar ou excluir ações — qualquer alteração requer acesso direto ao banco de dados.

## Goals

- [ ] Criar páginas admin em `/admin/acoes` (listagem, nova, editar)
- [ ] Adicionar endpoints POST, PUT, DELETE protegidos por admin no backend
- [ ] Adicionar entrada na sidebar de navegação admin
- [ ] Suportar todos os campos do modelo: título, descrição, categoria, ícone, investimento, impacto, imagem, mês/ano, status, cor, progresso

## Out of Scope

| Feature | Reason |
|---|---|
| Upload de imagens | Usa URL externa (campo texto), sem upload |
| Ordenação/paginação server-side | ≤ 20 itens, filtro client-side suficiente |
| Busca textual | Feature futura |

---

## User Stories

### P1: Admin lista ações da gestão ⭐ MVP

**User Story**: Como administrador, quero visualizar todas as ações cadastradas em uma tabela, para gerenciar o conteúdo da página pública `/acoes`.

**Why P1**: Base para qualquer operação CRUD.

**Acceptance Criteria**:

1. WHEN admin acessa `/admin/acoes` THEN uma tabela SHALL listar todas as ações
2. WHEN a lista está vazia THEN SHALL exibir "Nenhuma ação cadastrada"
3. WHEN admin clica em "Nova ação" THEN navega para `/admin/acoes/new`
4. WHEN admin clica em "Editar" THEN navega para `/admin/acoes/[id]`

**Independent Test**: Acessar `/admin/acoes`, ver grid com as 7 ações do seed.

### P2: Admin cria nova ação ⭐ MVP

**User Story**: Como administrador, quero preencher um formulário com todos os campos de uma ação e salvá-la, para publicar novas ações da gestão no portal.

**Why P1**: Core do CRUD — sem criação não há gestão real.

**Acceptance Criteria**:

1. WHEN admin acessa `/admin/acoes/new` THEN formulário com todos os 14 campos editáveis
2. WHEN admin submete formulário válido THEN ação é criada e redireciona para listagem
3. WHEN admin submete formulário inválido THEN erros de validação são exibidos nos campos
4. WHEN admin cancela THEN retorna à listagem sem salvar

**Independent Test**: Criar "Nova Praça Central" via formulário, verificar que aparece na listagem e na página pública.

### P3: Admin edita ação existente

**User Story**: Como administrador, quero editar os campos de uma ação existente, para corrigir ou atualizar informações.

**Why P2**: Essencial para manutenção, mas criação é pré-requisito.

**Acceptance Criteria**:

1. WHEN admin acessa `/admin/acoes/[id]` THEN formulário preenchido com dados atuais da ação
2. WHEN admin altera campos e salva THEN ação é atualizada na listagem e página pública
3. WHEN ação não existe (404) THEN formulário exibe erro

**Independent Test**: Editar progresso da "Escola Municipal" de 72% para 80%, verificar na listagem.

### P4: Admin exclui ação

**User Story**: Como administrador, quero remover uma ação da listagem, para manter apenas ações relevantes.

**Why P2**: Útil mas menos frequente que criação/edição.

**Acceptance Criteria**:

1. WHEN admin clica em "Excluir" na listagem THEN modal de confirmação é exibido
2. WHEN admin confirma exclusão THEN ação é removida e listagem atualizada
3. WHEN admin cancela exclusão THEN ação permanece na listagem

**Independent Test**: Excluir ação "CRAS", verificar que desaparece da listagem e página pública.

---

## Edge Cases

- WHEN `progress` informado > 100 THEN API SHALL normalizar para 100
- WHEN `investment_raw` informado como zero ou negativo THEN API SHALL aceitar (campo numérico livre)
- WHEN admin tenta acessar `/admin/acoes/*` sem autenticação THEN redirecionado para `/login`
- WHEN admin tenta acessar `/admin/acoes/*` como usuário não-admin THEN redirecionado para `/dashboard`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| MGA-A01 | P1: Listagem admin | Design | Pending |
| MGA-A02 | P2: Criar ação | Design | Pending |
| MGA-A03 | P3: Editar ação | Design | Pending |
| MGA-A04 | P4: Excluir ação | Design | Pending |

**Coverage:** 4 total, 4 mapped, 0 unmapped

---

## Success Criteria

- [ ] Admin pode criar, editar e excluir ações sem acesso ao banco
- [ ] Sidebar admin tem link "Ações" apontando para `/admin/acoes`
- [ ] Zero regressão na página pública `/acoes`
- [ ] Backend: 250+ testes continuam passando
