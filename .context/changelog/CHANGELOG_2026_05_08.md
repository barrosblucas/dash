# CHANGELOG — 2026-05-08

## frontend
### Adicionado
- `app/transparencia/page.tsx`: rota espelho do portal público para links legados
- `app/servicos/page.tsx`: placeholder de serviços públicos do portal
- `public/manifest.json` e `public/icon.svg`: manifesto e ícone do app

### Alterado
- `app/layout.tsx`: remove referências a assets ausentes e usa apenas `icon.svg` nos metadados de ícone

### Corrigido
- `PortalHeader` e cards do portal deixam de apontar para rota inexistente em `/transparencia`
- `GET /manifest.json` deixa de responder 404 no frontend local

## docs
### Alterado
- `REPOMAP.md` e `PROJECT_STATE.md` atualizados para refletir as novas rotas e assets públicos
