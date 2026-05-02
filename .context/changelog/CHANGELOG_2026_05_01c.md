# Changelog 2026-05-01c

## Funcionalidades Novas

### Backend — Feature Legislação: persistência SQL + CRUD administrativo

#### Migração de mock para persistência real
- **Changed** `features/legislacao/legislacao_handler.py`: rotas GET substituídas de adapter mockado para repositório SQL via SQLAlchemy. ID do path parameter mudou de `str` para `int`.
- **Added** `features/legislacao/legislacao_data.py`: repositório `SQLLegislacaoRepository` com CRUD completo (list paginado com filtros, get by id, create, update, delete, count). Helpers `legislacao_to_item_dict` e `legislacao_to_detalhe_dict` para conversão ORM→response.
- **Added** `LegislacaoModel` em `shared/database/models.py`: modelo ORM com campos tipo, numero, ano, ementa, texto_integral, datas de publicação/promulgação/vigência, status, autor, sancionado_por, origem, legislacao_vinculada_json, url_arquivo. UniqueConstraint `(tipo, numero, ano)`.
- **Added** Migration `a1b2c3d4e5f6_add_legislacao_table.py`: cria tabela `legislacoes` com índices.

#### CRUD administrativo
- **Added** `POST /api/v1/legislacao` — cria legislação (protegido com `require_admin_user`)
- **Added** `PUT /api/v1/legislacao/{id}` — atualiza legislação parcialmente (protegido com `require_admin_user`)
- **Added** `DELETE /api/v1/legislacao/{id}` — remove legislação (protegido com `require_admin_user`, retorna 204)
- **Added** Schemas `LegislacaoCreateRequest` e `LegislacaoUpdateRequest` em `legislacao_types.py`

#### Bootstrap idempotente
- **Added** `features/legislacao/legislacao_bootstrap.py`: seed automático dos 15 dados mockados quando a tabela está vazia. Integrado no lifespan da aplicação em `main.py`.

#### Refatoração: models.py dentro do limite de 400 linhas
- **Added** `shared/database/saude_models.py`: extraídos 10 modelos `Saude*` de `models.py` para arquivo próprio (mesmo padrão de `quality_models.py`).
- **Changed** `shared/database/models.py`: reduzido de 598 → 391 linhas. Modelos de saúde re-exportados via import no final do arquivo.

## Arquivos criados
- `backend/shared/database/saude_models.py`
- `backend/features/legislacao/legislacao_data.py`
- `backend/features/legislacao/legislacao_bootstrap.py`
- `backend/alembic/versions/a1b2c3d4e5f6_add_legislacao_table.py`

## Arquivos modificados
- `backend/shared/database/models.py` — adicionado `LegislacaoModel`, extraídos modelos Saude*
- `backend/features/legislacao/legislacao_types.py` — adicionados schemas de create/update
- `backend/features/legislacao/legislacao_handler.py` — reescrito para SQL-backed CRUD com admin auth
- `backend/api/main.py` — integrado bootstrap de legislações no lifespan
- `backend/tests/test_api/test_legislacao.py` — reescrito com testes de integração CRUD, auth, filtros, paginação, bootstrap

## Validação

### Backend
- `ruff check .` — All checks passed!
- `mypy .` — Success: no issues found in 168 source files
- `pytest` — 137 passed (20 de legislação), 0 failed

## Riscos e observações
- Arquivos de mock data (`legislacao_adapter.py`, `legislacao_mock_data.py`, `legislacao_mock_data_extra.py`) mantidos para bootstrap. Podem ser removidos quando houver fonte real de dados.
- IDs mudaram de string (ex: "lei-001-2018") para inteiros sequenciais do banco. Frontend compatível pois usa `str(model.id)`.
- Bootstrap roda a cada startup quando a tabela está vazia — não sobrescreve dados existentes.
