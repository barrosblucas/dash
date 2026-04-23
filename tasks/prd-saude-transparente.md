# PRD: Modulo Saude Transparente - Integracao E-Saude

> **Data**: 2026-04-22
> **Status**: Rascunho
> **Autor**: AI Analyst
> **Feature ID**: `saude-transparente`

---

## 1. Overview

Integracao dos dados publicos do sistema E-Saude (Laravel) com o portal de transparencia do municipio (Next.js + FastAPI). O objetivo e apresentar a populacao dados de saude publica de forma clara, atualizada e acessivel, sem depender diretamente do frontend do E-Saude.

Alem dos dados extraidos da API do E-Saude, o modulo inclui uma area administrativa para cadastro manual de unidades de saude com horarios de funcionamento, geolocalizacao e contatos — independentemente da API.

**API de origem**: `https://bandeirantes.esaude.genesiscloud.tec.br/publico/saude-transparente`
**Documentacao completa**: `docs/API_E-SAUDE_SAUDE-TRANSPARENTE.md`

---

## 2. Goals

- Disponibilizar 12 categorias de dados de saude publica no portal de transparencia
- Criar pagina administrativa para cadastro de unidades de saude (CRUD proprio)
- Popular o dashboard com dados reais do E-Saude via sincronizacao programada
- Oferecer busca e filtro por estabelecimento, periodo e tipo de servico
- Manter dados atualizados sem intervencao manual (sync automatico)

---

## 3. User Stories

### US-01: Dashboard de Medicamentos em Estoque

**Como cidadao**, quero consultar quais medicamentos estao disponiveis na unidade de saude mais proxima, para saber se devo me deslocar ate la.

**Aceitacao**:
- [ ] Lista paginada com nome do medicamento, unidade, quantidade em estoque, estoque minimo, estabelecimento e departamento
- [ ] Campo de busca textual por nome do medicamento
- [ ] Filtro por estabelecimento de saude
- [ ] Indicador visual de estoque abaixo do minimo (destaque em vermelho)
- [ ] Badge com total de itens em estoque e total de itens abaixo do minimo

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/medicamentos-tabela`
- Query param: `search` (opcional)

---

### US-02: Dashboard de Medicamentos Dispensados

**Como cidadao**, quero ver quais medicamentos foram mais dispensados no mes, para entender o perfil de consumo da saude publica.

**Aceitacao**:
- [ ] Grafico de barras com medicamentos mais dispensados no periodo
- [ ] Grafico de linhas com evolucao mensal de dispensacao
- [ ] Filtro por ano
- [ ] Tabela com ranking dos medicamentos mais retirados

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes?ano={ano}`

---

### US-03: Dashboard de Vacinacao

**Como cidadao**, quero acompanhar o andamento da vacinacao no municipio, para entender a cobertura vacinal.

**Aceitacao**:
- [ ] Grafico de barras com vacinas aplicadas por mes
- [ ] Grafico com ranking das vacinas mais aplicadas no periodo
- [ ] Filtro por ano
- [ ] Card com total de vacinas aplicadas no ano

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-vacinas-por-mes-do-esus?ano={ano}`
- `GET /publico/saude-transparente/buscar-dados-do-chart/vacinas-mais-aplicadas-por-periodo`

---

### US-04: Dashboard de Visitas Domiciliares

**Como cidadao**, quero ver as estatisticas de visitas domiciliares das equipes de saude da familia, para acompanhar a atencao basica.

**Aceitacao**:
- [ ] 4 graficos: motivos da visita, acompanhamento, busca ativa, controle vetorial
- [ ] Cada grafico mostra labels e quantidades reais
- [ ] Permite comparar periodos quando disponivel

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/familias-visitadas-motivos-da-visita`
- `GET /publico/saude-transparente/buscar-dados-do-chart/familias-visitadas-acompanhamento`
- `GET /publico/saude-transparente/buscar-dados-do-chart/familias-visitadas-busca-ativa`
- `GET /publico/saude-transparente/buscar-dados-do-chart/familias-visitadas-controle-ambiente-vetorial`

---

### US-05: Perfil Epidemiologico

**Como cidadao**, quero ver o perfil da populacao atendida pelo SUS municipal, para entender as demandas de saude publica.

**Aceitacao**:
- [ ] Cards com contadores: mulheres, homens, idosos, criancas, gestantes, hipertensos, diabeticos, risco cardiovascular
- [ ] Indicador de tendencia (subindo/estavel/descendo) quando houver historico
- [ ] Grafico de atendimentos por sexo

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-quantitativos`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimento-por-sexo`

---

### US-06: Dashboard de Transporte Sanitario

**Como cidadao**, quero ver as estatisticas de transporte de pacientes, para acompanhar os gastos e destinos.

**Aceitacao**:
- [ ] Grafico de viagens por cidade destino
- [ ] Grafico de viagens por mes
- [ ] Tabela com dados de transporte por periodo
- [ ] Card com total de viagens no periodo

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-viagens-por-cidade`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-viagens-por-mes`
- `GET /publico/saude-transparente/buscar-pessoas-do-transporte-por-periodo`

---

### US-07: Atendimentos da Atencao Primaria

**Como cidadao**, quero ver o volume e tipos de atendimentos realizados na atencao primaria, para entender a capacidade do sistema.

**Aceitacao**:
- [ ] Grafico de atendimentos por especialidade por mes
- [ ] Grafico de procedimentos realizados por especialidade
- [ ] Grafico de atendimentos por CBO da especialidade
- [ ] Filtro por ano e data de inicio

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-especialidade?ano={ano}`
- `GET /publico/saude-transparente/buscar-dados-do-chart/atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-especialidade?data_de_inicio={data}`

---

### US-08: Saude Bucal (Odonto)

**Como cidadao**, quero ver os dados de atendimentos odontologicos, para entender a oferta de saude bucal no municipio.

**Aceitacao**:
- [ ] Grafico de linhas com atendimentos odontologicos por mes
- [ ] Filtro por ano
- [ ] Card com total de atendimentos no periodo

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-odonto`

---

### US-09: Atendimentos do Hospital

**Como cidadao**, quero ver os dados hospitalares, para acompanhar a capacidade e demanda do hospital municipal.

**Aceitacao**:
- [ ] Card com censo de leitos: total, ocupados, livres, taxa de ocupacao
- [ ] Grafico de internacoes por mes
- [ ] Grafico de internacoes por CID
- [ ] Grafico de tempo medio de permanencia
- [ ] Grafico de procedimentos realizados (hospitalar)
- [ ] Filtro por estabelecimento quando houver mais de um

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-censo-dos-leitos-da-internacao`
- `GET /publico/saude-transparente/dados-hospitalar-quantidade-procedimentos-realizados`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-internacoes-por-mes`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-internacao-por-cid`
- `GET /publico/saude-transparente/buscar-dados-do-chart/media-de-permanencia-na-internacao`

---

### US-10: Atendimentos da Farmacia

**Como cidadao**, quero ver o historico de atendimentos da farmacia, para entender a demanda por medicamentos.

**Aceitacao**:
- [ ] Grafico de atendimentos de medicamentos por mes
- [ ] Grafico de medicamentos dispensados por mes
- [ ] Filtro por ano

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes?ano={ano}`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes`

---

### US-11: Perfil Demografico

**Como cidadao**, quero ver o perfil demografico dos cadastrados no sistema de saude, para entender o tamanho e composicao da populacao atendida.

**Aceitacao**:
- [ ] Grafico pizza com pessoas fisicas vs juridicas
- [ ] Grafico de linhas com cadastros por mes
- [ ] Cards com contadores demograficos (integrado com US-05)

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-pessoas-fisicas-e-juridicas`
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-pessoas-por-mes`
- `GET /publico/saude-transparente/buscar-dados-da-quantidade-pessoa-fisisca-juridica`

---

### US-12: Procedimentos por Tipo

**Como cidadao**, quero ver quais tipos de procedimentos sao mais realizados, para entender o perfil de servicos oferecidos.

**Aceitacao**:
- [ ] Grafico de barras horizontais com procedimentos por tipo e quantidade
- [ ] Tabela com detalhamento

**Endpoints E-Saude**:
- `GET /publico/saude-transparente/buscar-dados-do-chart/quantidade-de-procedimentos-por-tipo`

---

### US-13: Cadastro de Unidades de Saude (CRUD Administrativo)

**Como servidor da prefeitura**, quero cadastrar e gerenciar as unidades de saude do municipio com horarios, localizacao e contatos, para manter o mapa e as informacoes atualizadas no portal sem depender do sistema E-Saude.

**Aceitacao**:
- [ ] Pagina administrativa protegida por autenticacao (admin)
- [ ] Listagem de unidades em tabela com filtros e busca
- [ ] Formulario de criacao com campos: nome, tipo (UBSF, Hospital, UPA, Secretaria, Posto, Clinica), endereco, bairro, telefone, lat, lng, horario de funcionamento (abertura/fechamento)
- [ ] Grade de horarios por dia da semana (seg-dom) com horario de abertura e fechamento por dia
- [ ] Edicao e exclusao de unidades
- [ ] Ativacao/desativacao de unidades
- [ ] Opcao de importar dados iniciais do endpoint `/publico/saude-transparente/consultar-servicos-de-saude/localizacao` do E-Saude

**Nao depende da API** — dados persistidos no banco do portal (SQLite).

---

### US-14: Mapa Publico de Unidades de Saude

**Como cidadao**, quero ver no mapa onde ficam as unidades de saude, com horarios e telefone, para encontrar a mais proxima de mim.

**Aceitacao**:
- [ ] Mapa interativo com markers das unidades
- [ ] Click no marker abre card com: nome, tipo, endereco, telefone, horario de funcionamento
- [ ] Filtro por tipo de unidade
- [ ] Geolocalizacao do usuario (opcional, com permissao)
- [ ] Dados vindos do CRUD administrativo (US-13), nao da API E-Saude

---

## 4. Functional Requirements

### FR-01: Sincronizacao de dados E-Saude

O backend deve implementar um servico de sincronizacao que:
- Faz GET nos endpoints publicos do E-Saude em intervalos configuraveis (default: a cada 6 horas)
- Armazena os dados em tabelas proprias no SQLite do portal
- Marca a data da ultima sincronizacao
- Mantem historico de sincronizacoes (timestamp, status, endpoints sincronizados)
- Trata erros de conectividade com retry e backoff
- Nao bloqueia o portal caso o E-Saude esteja fora do ar (serve dados do cache local)

### FR-02: Endpoints internos do portal

O backend FastAPI deve expor endpoints para o frontend Next.js consumir:
- `GET /api/saude/medicamentos-estoque` — lista paginada com filtros
- `GET /api/saude/medicamentos-dispensados` — dados de dispensacao
- `GET /api/saude/vacinacao` — dados de vacinacao
- `GET /api/saude/visitas-domiciliares` — dados de visitas
- `GET /api/saude/perfil-epidemiologico` — contadores demograficos
- `GET /api/saude/transporte` — dados de transporte
- `GET /api/saude/atencao-primaria` — atendimentos da atencao basica
- `GET /api/saude/saude-bucal` — atendimentos odontologicos
- `GET /api/saude/hospital` — dados hospitalares e leitos
- `GET /api/saude/farmacia` — atendimentos da farmacia
- `GET /api/saude/perfil-demografico` — pessoas fisicas/juridicas
- `GET /api/saude/procedimentos-tipo` — procedimentos por tipo
- `GET /api/saude/sync-status` — status da ultima sincronizacao
- `POST /api/saude/sync` — trigger manual de sincronizacao (admin)

### FR-03: CRUD de Unidades de Saude

O backend deve implementar:
- `GET /api/saude/unidades` — lista com filtros (tipo, ativo, busca textual)
- `POST /api/saude/unidades` — criacao (admin)
- `PUT /api/saude/unidades/{id}` — atualizacao (admin)
- `DELETE /api/saude/unidades/{id}` — desativacao (soft delete, admin)
- `GET /api/saude/unidades/{id}/horarios` — grade de horarios
- `PUT /api/saude/unidades/{id}/horarios` — atualizar grade de horarios (admin)
- `POST /api/saude/unidades/importar-esaude` — importacao inicial do E-Saude (admin)

### FR-04: Pagina de Saude no Portal

O frontend deve ter uma rota `/saude` com:
- Pagina principal com cards-resumo de cada categoria
- Navegacao por abas ou submenu para cada dashboard
- Cada dashboard em sua propria sub-rota:
  - `/saude/medicamentos` — US-01 + US-02
  - `/saude/vacinacao` — US-03
  - `/saude/visitas-domiciliares` — US-04
  - `/saude/perfil-epidemiologico` — US-05 + US-11
  - `/saude/transporte` — US-06
  - `/saude/atencao-primaria` — US-07
  - `/saude/saude-bucal` — US-08
  - `/saude/hospital` — US-09
  - `/saude/farmacia` — US-10
  - `/saude/procedimentos` — US-12
  - `/saude/unidades` — US-14 (mapa)

### FR-05: Pagina administrativa de Unidades

O frontend deve ter rota `/admin/saude/unidades` com:
- Tabela de unidades com acoes (editar, desativar, excluir)
- Formulario de criacao/edicao com todos os campos da US-13
- Componente de grade de horarios por dia da semana
- Botao "Importar do E-Saude" para carga inicial

---

## 5. Non-Goals

- **Nao** sera implementada autenticacao no E-Saude (usamos apenas endpoints publicos)
- **Nao** sera feito scraping de dados protegidos ou area restrita
- **Nao** sera implementado chatbot ou integracao com `api/bot/*`
- **Nao** sera criado CRUD para medicamentos, vacinas ou atendimentos (dados vem do E-Saude)
- **Nao** sera implementado portal de agendamento ou atendimento online
- **Nao** sera feita integracao em tempo real (dados sincronizados periodicamente)
- **Nao** sera criado app mobile (apenas web responsivo)

---

## 6. Design Considerations

### Layout

- Seguir o padrao visual existente do portal (Tailwind + componentes em `components/ui/`)
- Usar `Recharts` para graficos (ja esta no projeto)
- Usar `D3` para mapa de calor ou visualizacoes complexas (ja esta no projeto)
- Usar `lucide-react` para icones (ja esta no projeto)

### Navegacao

- Item "Saude" no menu principal do portal
- Submenu com as categorias
- Breadcrumb em cada sub-pagina

### Responsividade

- Dashboards devem funcionar em mobile (graficos adaptam largura)
- Tabelas com scroll horizontal em telas pequenas
- Mapa ocupa largura total em mobile

### Cores por categoria

| Categoria | Cor sugerida | Rationale |
|-----------|-------------|-----------|
| Medicamentos | Verde | Saude/farmacia |
| Vacinacao | Azul | Imunizacao/confianca |
| Visitas | Roxo | Atencao basica |
| Epidemiologia | Laranja | Alerta/vigilancia |
| Transporte | Cinza | Logistica |
| Atencao Primaria | Teal | Cuidado basico |
| Odonto | Rosa | Saude bucal |
| Hospital | Vermelho | Emergencia |
| Farmacia | Verde escuro | Dispensacao |
| Procedimentos | Amarelo | Servicos |

---

## 7. Technical Considerations

### Arquitetura

```
E-Saude API → [Sync Service] → SQLite (portal) → FastAPI → Next.js
                                     ↑
                          CRUD Unidades (admin)
```

### Stack existente (reutilizar)

| Componente | Tecnologia | Local |
|-----------|-----------|-------|
| Backend | FastAPI + SQLAlchemy | `backend/` |
| Frontend | Next.js 14 + React 18 | `frontend/` |
| Graficos | Recharts | `frontend/components/charts/` |
| Estado | Zustand + TanStack Query | `frontend/stores/`, `frontend/hooks/` |
| UI | Tailwind + componentes proprios | `frontend/components/ui/` |
| BD | SQLite | `database/` |

### Novas tabelas SQLite

```sql
-- Dados sincronizados do E-Saude
saude_medicamentos_estoque (id, nome, unidade, em_estoque, estoque_minimo, departamento, estabelecimento, sync_id)
saude_medicamentos_dispensados (id, label, quantidade, periodo, sync_id)
saude_vacinacao (id, label, quantidade, periodo, sync_id)
saude_visitas_domiciliares (id, tipo, label, quantidade, sync_id)
saude_perfil_epidemiologico (id, titulo, valor, sync_id)
saude_transporte (id, label, quantidade, tipo_grafico, sync_id)
saude_atencao_primaria (id, label, quantidade, tipo_grafico, periodo, sync_id)
saude_hospital (id, label, quantidade, tipo_grafico, periodo, sync_id)
saude_farmacia_atendimentos (id, label, quantidade, periodo, sync_id)
saude_perfil_demografico (id, label, quantidade, tipo_grafico, sync_id)
saude_procedimentos_tipo (id, label, quantidade, sync_id)
saude_sync_log (id, endpoint, status, started_at, finished_at, registros_sincronizados, erro)

-- CRUD administrativo (independente da API)
saude_unidades (id, nome, tipo, endereco, bairro, telefone, lat, lng, horario_abertura, horario_fechamento, ativo, created_at, updated_at)
saude_unidade_horarios (id, unidade_id, dia_semana, horario_abertura, horario_fechamento)
```

### Feature structure (backend)

```
backend/features/saude/
  saude_handler.py          # Rotas FastAPI
  saude_service.py           # Logica de negocio
  saude_sync_service.py      # Sincronizacao com E-Saude
  saude_models.py            # SQLAlchemy models
  saude_schemas.py           # Pydantic schemas
  saude_repository.py        # Acesso ao banco
```

### Feature structure (frontend)

```
frontend/app/saude/
  page.tsx                          # Dashboard principal com cards
  medicamentos/page.tsx             # US-01 + US-02
  vacinacao/page.tsx                # US-03
  visitas-domiciliares/page.tsx     # US-04
  perfil-epidemiologico/page.tsx    # US-05 + US-11
  transporte/page.tsx               # US-06
  atencao-primaria/page.tsx         # US-07
  saude-bucal/page.tsx              # US-08
  hospital/page.tsx                 # US-09
  farmacia/page.tsx                 # US-10
  procedimentos/page.tsx            # US-12
  unidades/page.tsx                 # US-14 (mapa publico)

frontend/app/admin/saude/
  unidades/page.tsx                 # US-13 (CRUD admin)
  unidades/[id]/page.tsx            # Edicao
  unidades/nova/page.tsx            # Criacao

frontend/components/saude/
  SaudeCard.tsx                     # Card resumo reutilizavel
  SaudeChart.tsx                    # Wrapper de grafico reutilizavel
  SaudeTabela.tsx                   # Tabela paginada reutilizavel
  MapaUnidades.tsx                  # Mapa com markers
  GradeHorarios.tsx                 # Componente de grade seg-dom
  SyncStatusBadge.tsx               # Badge de status da sincronizacao

frontend/services/saude.ts          # Chamadas API (axios)
frontend/hooks/useSaudeData.ts      # Hooks TanStack Query
frontend/types/saude.ts             # Tipos TypeScript
```

### Sincronizacao

- Job agendado (APScheduler ou cron) a cada 6 horas
- Cada endpoint do E-Saude e chamado sequencialmente
- Dados substituidos a cada sync (nao acumulativo, exceto sync_log)
- Em caso de falha parcial, os endpoints que funcionaram sao persistidos
- O sync log registra cada endpoint individualmente

### Dependencia externa

- E-Saude precisa estar acessivel em `bandeirantes.esaude.genesiscloud.tec.br`
- Timeout de 30s por endpoint
- Retry: 3 tentativas com backoff exponencial (1s, 2s, 4s)
- Se E-Saude estiver fora, o portal exibe "Dados atualizados em {data_ultima_sync}" e serve do cache local

---

## 8. Success Metrics

| Metrica | Meta | Como medir |
|---------|------|-----------|
| Dados sincronizados com sucesso | > 95% dos syncs sem erro | `saude_sync_log` |
| Tempo de carregamento do dashboard | < 2s | Lighthouse / Web Vitals |
| Disponibilidade dos dados | 99.9% (cache local) | Monitoramento do endpoint `/api/saude/sync-status` |
| Cobertura de medicamentos | 100% dos 281 itens importados | Comparar com fonte |
| Cadastro de unidades | 100% das unidades ativas importadas | CRUD admin |

---

## 9. Plano de Entrega (sugerido)

### Fase 1 — Fundacao
1. Schema do banco + migracoes
2. Sync service basico (um endpoint)
3. CRUD de unidades (backend)
4. Infra de rotas e tipos no frontend

### Fase 2 — Dashboards de Dados
5. Medicamentos (estoque + dispensados)
6. Vacinacao
7. Perfil epidemiologico + demografico
8. Procedimentos por tipo

### Fase 3 — Dashboards Complementares
9. Visitas domiciliares
10. Transporte
11. Atencao primaria + Saude bucal
12. Hospital + Farmacia

### Fase 4 — Mapa e Admin
13. Mapa publico de unidades
14. Pagina admin de unidades com grade de horarios
15. Importacao do E-Saude

---

## 10. Open Questions

| # | Questao | Impacto | Decisao |
|---|---------|---------|---------|
| 1 | Qual biblioteca de mapas usar? (Leaflet vs MapLibre vs Google Maps) | US-14 | A definir |
| 2 | A sincronizacao sera via cron no servidor ou APScheduler na aplicacao? | FR-01 | A definir |
| 3 | Os dados historicos de chart devem ser mantidos ou substituidos a cada sync? | Modelagem | A definir (sugestao: substituir) |
| 4 | Deve haver notificacao visual quando os dados estao desatualizados? | UX | A definir |
| 5 | O portal ja tem sistema de roles/permissoes para proteger o admin de unidades? | US-13 | Verificar `features/identity/` |
| 6 | Os endpoints de chart com parametros (ano, estabelecimento_id) devem ser chamados com multiplos valores no sync? | FR-01 | A definir (sugestao: sync do ano atual + ano anterior) |
