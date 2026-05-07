# CHANGELOG — 2026-05-06

## Institucional — Prefeitura, gestão, secretarias e repartições

### Adicionado
- **Backend institucional** (`backend/features/institucional/`): novo bounded context com rotas públicas `/api/v1/institucional/{prefeitura,gestao,secretarias,reparticoes}` e rotas admin protegidas para profile, secretarias e repartições.
- **Persistência institucional** (`backend/shared/database/institucional_models.py` + migration `f0e1d2c3b4a5_add_institucional_tables.py`): profile singleton, departamentos e repartições com bootstrap idempotente de 10 secretarias + SAAE.
- **Testes backend** (`backend/tests/test_api/test_institucional.py`): cobertura de bootstrap, leitura pública, CRUD admin, auth 401 e erros 404.
- **Tipos TypeScript** (`frontend/types/institucional.ts`): contratos espelhando os schemas do backend para prefeitura, gestão, secretarias e repartições.
- **Service layer** (`frontend/services/institucional-service.ts`): cliente HTTP para os endpoints institucionais.
- **Componentes compartilhados** (`frontend/components/prefeitura/`): hero, cards, bloco de contato, navegação contextual, placeholder e cards de gestores.
- **Páginas públicas**:
  - `/prefeitura`
  - `/prefeitura/prefeito-e-vice`
  - `/prefeitura/gabinete`
  - `/prefeitura/secretarias`
  - `/prefeitura/secretarias/[slug]`
  - `/prefeitura/reparticoes`
- **Testes frontend**:
  - `frontend/services/institucional-service.test.ts`
  - `frontend/app/prefeitura/prefeitura-client.test.tsx`

### Alterado
- `backend/api/main.py`: registra o router institucional e executa bootstrap idempotente no startup.
- `backend/shared/database/models.py`: importa os novos modelos ORM institucionais.
- `frontend/components/layouts/PortalHeader.tsx`: adiciona link público para Prefeitura.
- `frontend/components/layouts/PortalFooter.tsx`: adiciona link público para Prefeitura.
- `frontend/components/portal/portal-data.ts`: adiciona card institucional no portal.
- `frontend/types/index.ts`: exporta `institucional`.

### Notas
- Seed inicial usa placeholders neutros quando faltam dados factuais reais.
- Fallback visual mostra “Informações em atualização” ou “Aguardando atualização” quando nomes, fotos e descrições ainda não foram publicados.
- Validação final executada com backend e frontend verdes; lint do frontend mantém apenas warnings de `<img>`, no mesmo padrão já existente no projeto.
