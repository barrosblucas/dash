# CHANGELOG — 2026-05-04

## backend
### Adicionado
- `ObraMediaModel.is_cover`: campo booleano para marcar mídia como capa da obra (default False)
- migration `d4e5f6a7b8c9` adiciona coluna `is_cover` + índice `ix_obra_media_assets_cover` em `obra_media_assets`
- `ObraMediaAssetPayload.is_cover`, `ObraMediaAssetResponse.is_cover`, `ObraMediaLinkRequest.is_cover`
- endpoint `POST /api/v1/obras/{hash}/media/upload` aceita `is_cover` via Form
- `_resolve_is_cover()`: só permite capa em mídia global (`medicao_id is None`) do tipo `image`
- `_clear_other_covers()`: ao marcar uma mídia global como capa, limpa `is_cover` das demais
- `_sync_global_media_assets()`: preserva `is_cover` em URL media, permite atualizar `titulo`, `media_kind`, `is_cover` de uploads existentes (identificados por `id`)
- listagem global ordenada com capa primeiro (`is_cover DESC`)

### Alterado
- `create_media_link()`, `create_uploaded_media()`: aceitam e persistem `is_cover` com validação de regra
- `_replace_url_media_assets()`: persiste `is_cover` nas mídias URL recriadas

### Corrigido
- migration `e6f7a8b9c0d1` faz merge dos heads `a1b2c3d4e5f6` e `d4e5f6a7b8c9`, restaurando `alembic upgrade head` e o startup automático do backend local via `dev.sh`

## tests
### Adicionado
- `test_media_cover_exposed_on_create_and_read`: valida exposição de `is_cover` em create/read
- `test_media_cover_upload_promotes_and_clears_previous`: upload de duas capas valida promoção e limpeza
- `test_media_cover_only_for_global_images`: mídia vinculada a medição não vira capa
