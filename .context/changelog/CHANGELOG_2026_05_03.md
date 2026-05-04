# Changelog 2026-05-03

## Bug Fixes

### Legislação Municipal — download individual da legislação

- **Changed** `backend/features/legislacao_municipal/legislacao_municipal_adapter.py`: o download individual agora resolve o link direto do PDF da edição por `data_publicacao` + `numero_materia` e baixa o arquivo do DigitalOcean Spaces, em vez de depender do endpoint protegido `/baixar-materia/{id}/{hash}` que passou a responder HTML de expiração.
- **Added** `backend/tests/test_etl/test_legislacao_municipal_adapter.py`: cobertura unitária do adapter para resolução do link direto, download HTTP, validação de PDF, erro de link não encontrado e rejeição de URL inválida.
- **Changed** `backend/tests/test_api/test_legislacao_municipal.py`: ajuste tipado na inspeção de `await_args` para manter o teste de integração compatível com `mypy`.

#### Problema corrigido
- O endpoint `POST /api/v1/legislacao-municipal/download` passou a retornar 400 porque o link protegido da matéria devolvia HTML (`Link expirou, acesse novamente!`) em vez de PDF, mesmo quando a matéria ainda estava listada no Diário Oficial.
- O fluxo ficou resiliente ao usar o link direto do PDF da edição, já resolvido a partir da página pública por data e número da matéria.

### Legislação Municipal — recorte do PDF da edição para extrair apenas a matéria

- **Changed** `backend/features/legislacao_municipal/legislacao_municipal_adapter.py`: o download agora recorta o PDF completo da edição devolvendo apenas a matéria/lei solicitada. Novas funções: `_clean_html_title()`, `_find_heading_position()`, `_find_next_heading_edge()`, `_crop_pdf_section()`, `_resolve_materia_heading()`, `_download_full_edition_pdf()`. O fluxo busca metadados da matéria via API (`fetch_all_pages`), localiza o heading no PDF com pdfplumber, detecta o próximo heading como limite superior, e recorta com pypdf (CropBox). Se não conseguir isolar a matéria, falha explicitamente em vez de baixar a edição inteira.
- **Added** `backend/tests/test_etl/test_legislacao_municipal_adapter_helpers.py`: cobertura unitária dos helpers de recorte (`_clean_html_title`, `_find_heading_position`, `_find_next_heading_edge`, `_crop_pdf_section`) com PDF sintético gerado por reportlab. 18 testes: busca de heading, busca do próximo heading, verificação de CropBox por página, fluxo completo de recorte.
- **Changed** `backend/tests/test_etl/test_legislacao_municipal_adapter.py`: atualizado para mockar `fetch_all_pages` (retorna item mockado com titulo HTML), usar PDF sintético real para testar recorte e verificar CropBox com pypdf em vez de `pdfplumber.extract_text()` (que ignora `/CropBox`). Adicionado `test_cropbox_is_set_on_result`.

## Maintenance

- **Changed** `backend/features/diario_oficial/diario_oficial_handler.py`: tipagem explícita do cache `ultimo_resultado` para remover erro de `mypy` no retorno do scheduler.
- **Changed** `backend/shared/database/connection.py`: organização do bloco de imports para atender `ruff`.
- **Changed** `dev.sh`: o modo DEV continua priorizando `backend/.venv` e exibindo qual virtualenv está em uso, mas o pré-check local agora valida dependências gerais do backend sem exigir Playwright/Chromium para subir a aplicação.

## Validação

- Backend lint: ✅ `backend/.venv/bin/python -m ruff check .`
- Backend type-check: ✅ `backend/.venv/bin/python -m mypy .`
- Backend tests: ✅ `backend/.venv/bin/python -m pytest -q` (suite green)
