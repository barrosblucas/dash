# CHANGELOG — 2026-05-07
## Admin — Painel de gestão da Prefeitura

### Adicionado
- **Página admin de Prefeitura** (`frontend/app/admin/prefeitura/`): painel administrativo com 3 abas para gerenciar os dados exibidos na página pública `/prefeitura`:
  - **Perfil da Prefeitura**: formulário para editar nome, descrição, imagem, contato (endereço, telefone, e-mail, horário), links sociais e gestão (prefeito, vice-prefeito, chefe de gabinete).
  - **Secretarias**: tabela CRUD para secretarias e autarquias (criar, editar, excluir).
  - **Repartições**: tabela CRUD para repartições, setores, gabinetes (criar, editar, excluir).
- **Tipos admin** (`frontend/types/institucional.ts`): adicionados `ProfileUpdatePayload`, `AdminPrefeituraProfile`, `DepartmentCreatePayload`, `DepartmentUpdatePayload`, `OfficeCreatePayload`, `OfficeUpdatePayload`.
- **Métodos admin no service** (`frontend/services/institucional-service.ts`): adicionados 10 métodos admin (getProfile, updateProfile, list/create/update/delete secretarias, list/create/update/delete repartições).

### Alterado
- `frontend/components/admin/AdminShell.tsx`: adicionado item "Prefeitura" na navegação lateral do painel admin.
- `frontend/components/admin/AdminHomePage.tsx`: adicionado card "Prefeitura" no dashboard admin.

### Notas
- O backend já possuía todos os endpoints admin CRUD (`/api/v1/institucional/admin/...`). Esta tarefa criou apenas a interface administrativa no frontend.
- Não houve upload de arquivos — imagens são informadas via URL manual, consistente com o padrão existente.
- Validação final: `tsc --noEmit` ✅, `next lint` ✅ (sem erros, apenas warnings `<img>` pré-existentes), `next build` ✅.

---

## Dados Reais — Prefeitura de Bandeirantes-MS
### Adicionado
- **Script de seed com dados reais** (`backend/scripts/seed_institucional_real.py`): popula as tabelas institucionais com informações extraídas do site oficial `bandeirantes.ms.gov.br/v2/`.
- **Perfil da prefeitura**: nome, endereço, telefone, e-mail, horário de funcionamento, links sociais (Facebook, Instagram), gestão 2025-2028.
- **Gestão**: prefeito Celso Ribeiro Abrantes, vice-prefeito Mario Serpa Pinto Filho (com fotos e bios).
- **11 secretarias/autarquias** com dados reais:
  1. Administração — Vagner Trindade de Castro
  2. Assistência Social e Cidadania — Francielly Ramos
  3. Desenvolvimento e Turismo — Gediana Ribeiro da Rocha
  4. Educação — Josiane Souza Gomes Schonhalz
  5. Esporte e Cultura — Junior Mulari
  6. Finanças Públicas (SEFIN) — Edleuza Vidal Borges
  7. Gestão Agrária e Ambiental — Gustavo Hoppen Lindner
  8. Governo — (não informado no site)
  9. Infraestrutura — Ronaldo Correia de Moraes
  10. Saúde — Rafael Maciel Acosta
  11. SAAE — (autarquia, sem diretor informado)
- Cada secretaria inclui: nome, slug, secretário, foto, missão, visão, valores, contato (telefone, e-mail, endereço).

### Notas
- Dados extraídos via scraping do site oficial em 2026-05-07.
- Campos não disponíveis no site (ex: chefe de gabinete, secretário de Governo) ficaram como `null`.
- A foto da secretária de Finanças no site estava incorreta (mostrava Junior Mulari); ficou sem foto no seed.
