# Changelog — 20/04/2026

## Added

### Portal Público da Transparência
- **`app/page.tsx`**: nova página inicial do portal público com hero section e grid de navegação por cards
- **`app/portal-client.tsx`**: componente client do portal com 9 cards de navegação (3 disponíveis, 6 "em breve"), toggle de tema e footer
- **`components/portal/PlaceholderPage.tsx`**: componente reutilizável para páginas de seções ainda não implementadas

### Páginas Placeholder (Em breve)
- **`app/movimento-extra/page.tsx`**: placeholder para Movimento Extra Orçamentário
- **`app/obras/page.tsx`**: placeholder para Acompanhamento de Obras
- **`app/contratos/page.tsx`**: placeholder para Gestão de Contratos
- **`app/diarias/page.tsx`**: placeholder para Diárias e Passagens
- **`app/licitacoes/page.tsx`**: placeholder para Licitações
- **`app/avisos-licitacoes/page.tsx`**: placeholder para Aviso de Licitações

## Changed

### Frontend
- **`next.config.js`**: removido redirect permanente `/ → /dashboard`; rota `/` agora é o portal público
- **`app/layout.tsx`**: metadata atualizada para "Portal da Transparência | Bandeirantes MS" com descrição expandida
- **`components/layouts/Sidebar.tsx`**: adicionado link "Portal" com ícone `Home` no topo da navegação

### Documentação viva
- **`REPOMAP.md`**: atualizado snapshot e incluídos novos arquivos do portal e placeholders
- **`PROJECT_STATE.md`**: atualizado status e funcionalidades do portal público

---

## Movimento Extra Orçamentário — Feature completa

### Backend
- **Novo**: Rota proxy `GET /api/v1/movimento-extra/busca` para consulta de movimento extra orçamentário via API Quality
- **Novo**: Schemas Pydantic `MovimentoExtraItem`, `FundoResumo`, `MovimentoExtraResponse`
- **Novo**: Extração automática de fundos municipais (FUNDEB, FMAS, FMIS, FMDCA, FUNCESP) via regex
- **Novo**: Suporte a tipo R (Receitas), D (Despesas) e AMBOS com agregação de totais por fundo

### Frontend
- **Novo**: Página completa de Movimento Extra Orçamentário em `/movimento-extra`
- **Novo**: Glossário interativo de fundos municipais com explicação para o cidadão
- **Novo**: Cards de fundos com totais de receitas/despesas e barra de proporção visual
- **Novo**: Painel de insights automáticos (fundo com maior movimentação, saldo, quantidade de fundos)
- **Novo**: Filtros por ano, mês e tipo (Receitas/Despesas/Ambos)
- **Novo**: KPIs com totais consolidados e saldo do período
- **Novo**: Busca textual nos itens do movimento
- **Novo**: Cards do portal atualizados — Movimento Extra marcado como disponível
- **Novo**: Hook `useMovimentoExtra` com React Query e cache de 5 minutos
- **Novo**: Tipos TypeScript e contrato com API backend

### Validação
- Backend: ruff check ✅ (0 erros nos novos arquivos)
- Frontend: lint ✅, type-check ✅, build ✅

---

## Movimento Extra Orçamentário — Endpoint Anual + Insights

### Backend
- **Novo**: Endpoint `GET /api/v1/movimento-extra/anual` com busca paralela dos 12 meses e agregação consolidada
- **Novo**: Schemas `InsightItem`, `ResumoMensalItem`, `MovimentoExtraAnualResponse` em `api/schemas.py`
- **Novo**: Função `_compute_insights()` com categorização regex (INSS, IRRF, ISSQN, CASSEMS, SICREDI, BB, etc.) e glossário explicativo
- **Novo**: Campos `insights_receitas` e `insights_despesas` adicionados ao endpoint mensal existente
- **Novo**: Evolução mensal (12 meses) com totais de receitas, despesas e saldo por mês

### Frontend
- **Novo**: Toggle de visualização Mensal/Anual na página de Movimento Extra
- **Novo**: Seção "Destaques do Mês" com Top 6 receitas e Top 6 despesas (cards com ranking, valor, % e glossário)
- **Novo**: Visão anual com KPIs consolidados, evolução mensal (barras visuais) e insights anuais
- **Novo**: Componentes `InsightCard` e `MonthlyEvolutionBar` com tooltips explicativos
- **Novo**: Hook `useMovimentoExtraAnual` com cache de 10 minutos
- **Novo**: Tipos `InsightItem`, `ResumoMensalItem`, `MovimentoExtraAnualResponse`

### Validação
- Backend: ruff check ✅ (0 erros nos arquivos modificados)
- Frontend: lint ✅, type-check ✅, build ✅ (`/movimento-extra` 9.08 kB)

---

### feat: rotas proxy para licitações (ComprasBR e Quality)

- **[backend]** Criado `backend/api/routes/licitacoes.py` com dois endpoints:
  - `GET /api/v1/licitacoes/comprasbr`: proxy para API ComprasBR (processos de licitação de MS/Bandeirantes)
  - `GET /api/v1/licitacoes/dispensas`: scraping do portal Quality para dispensas de licitação
- **[backend]** Adicionados schemas Pydantic em `backend/api/schemas.py`:
  - `LicitacaoComprasBRItem`, `LicitacaoComprasBRResponse`
  - `DispensaLicitaçãoItem`, `DispensasLicitacaoResponse`
- **[backend]** Router registrado em `backend/api/main.py` e exportado em `backend/api/routes/__init__.py`
- **[backend]** Adicionada dependência `selectolax==0.4.7` em `requirements.txt` para parsing HTML
- Validação: ruff OK, py_compile OK, 71 testes passando

---

## Aviso de Licitações — Feature completa

### Frontend
- **Novo**: Página completa de Aviso de Licitações em `/avisos-licitacoes`
- **Novo**: Calendário mensal com navegação (prev/next mês) e indicadores visuais (dots coloridos) por status e fonte
- **Novo**: Calendário semanal com visão de 7 dias e cards de licitação inline
- **Novo**: Lista tabular com paginação (desktop: tabela, mobile: cards)
- **Novo**: Filtros por fonte (Todas / Pregão Eletrônico / Dispensa / Concorrência) e status (Todas / Aguardando / Encerrado / Suspenso)
- **Novo**: Busca textual por objeto, número ou modalidade
- **Novo**: Modal de detalhes com objeto, modalidade, data de abertura, órgão, julgamento, link externo e botão de download
- **Novo**: Merge de dados ComprasBR + Quality Dispensas em lista unificada (`LicitacaoUnified`)
- **Novo**: KPIs de contagem (Total, Aguardando, Encerrado, Suspenso)
- **Novo**: Hook `useLicitacoesComprasBR` e `useLicitacoesDispensas` com cache de 10 minutos
- **Novo**: Métodos `licitacoesApi.comprasbr()` e `licitacoesApi.dispensas()` no API client
- **Modificado**: Card "Aviso de Licitações" no portal marcado como disponível (`available: true`)
- **Modificado**: `page.tsx` trocou placeholder por componente client real

### Validação
- Frontend: lint ✅ (0 erros nos novos arquivos), type-check ✅, build ✅
