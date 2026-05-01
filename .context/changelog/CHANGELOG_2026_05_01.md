# Changelog 2026-05-01

## Correções

### Backend — Movimento Extra (500 ao buscar período sem dados)
- **Fixed** HTTP 500 em `GET /api/v1/movimento-extra/busca?ano=2026&mes=5&tipo=AMBOS`.
  - Causa raiz: a API externa Quality (`portalquality.qualitysistemas.com.br`) retorna itens placeholder com todos os campos `null` quando não há dados para o período solicitado. O adapter (`movimento_extra_adapter.py`) tentava construir `MovimentoExtraItem(**item)` com `codigo=None`, `tipo=""`, `valor_recebido=None`, etc., causando `pydantic.ValidationError` não tratado que escalava para 500.
  - Solução: `fetch_tipo()` agora filtra itens com `codigo is None` e `tipo not in ("R", "D")` antes de tentar a construção Pydantic. Adicionado `try/except` com log de warning como rede de segurança para outros possíveis desalinhamentos de schema da API externa.
  - Comportamento: períodos sem dados agora retornam 200 com lista vazia (`items: [], quantidade: 0`) em vez de 500.
- Arquivo modificado:
  - `backend/features/movimento_extra/movimento_extra_adapter.py`

## Validação
- `ruff check .` — pass
- Teste manual: `2026/5` (sem dados) → 200 OK com items vazios
- Teste manual: `2025/1` (dados reais) → 200 OK com 565 itens, totais e insights corretos
- `pytest` — não executável (ambiente de testes requer dependências ausentes — problema pré-existente)
