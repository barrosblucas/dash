# Documentacao de API - E-Saude / Saude Transparente

> **Fonte**: `https://bandeirantes.esaude.genesiscloud.tec.br/publico/saude-transparente`
> **Data da analise**: 2026-04-22
> **Aplicacao**: Sistema E-Saude (Laravel + Inertia.js) - Prefeitura de Bandeirantes/MS
> **Base URL**: `https://bandeirantes.esaude.genesiscloud.tec.br`

---

## Sumario

| Secao | Endpoints | Autenticacao |
|-------|-----------|-------------|
| [1. Saude Transparente - Paginas](#1-saude-transparente---paginas) | 4 | Nao |
| [2. Saude Transparente - Dados Publicos](#2-saude-transparente---dados-publicos) | 15 | Nao |
| [3. Saude Transparente - Charts](#3-saude-transparente---charts) | 30+ | Nao |
| [4. Saude Transparente - Area Restrita](#4-saude-transparente---area-restrita) | 20+ | Sim (login) |
| [5. API Bot / Chatbot](#5-api-bot--chatbot) | 35 | Chave de acesso |
| [6. Outros Modulos Publicos](#6-outros-modulos-publicos) | 103 | Variavel |

---

## Formato de Resposta Padrao

### Resposta JSON de Tabela (paginada)

```json
{
  "data": [...],
  "total": 281,
  "paginate": false,
  "itemsPerPage": 10,
  "orderColumn": "quantidade",
  "orderDirection": "desc",
  "url": "https://...",
  "firstInteration": false
}
```

### Resposta JSON de Chart (Chart.js)

```json
{
  "labels": ["Label1", "Label2", "..."],
  "datasets": [
    {
      "label": "",
      "data": [10, 20, "..."],
      "backgroundColor": ["rgba(...)"],
      "borderColor": ["rgba(...)"],
      "borderWidth": 1.2
    }
  ]
}
```

---

## 1. Saude Transparente - Paginas

Paginas renderizadas via Inertia.js (retornam HTML completo). Acesso publico, sem autenticacao.

### 1.1 Pagina Principal (Index)

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente` |
| **Route Name** | `publico.saude-transparente.index` |
| **Content-Type** | `text/html; charset=UTF-8` |
| **Status** | `200` |
| **Descricao** | Pagina principal do portal Saude Transparente. Renderiza o dashboard com cards de dados quantitativos, graficos, tabelas de servidores, unidades, medicamentos e mapa de localizacao. |

### 1.2 Pagina de Login

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/login` |
| **Route Name** | `publico.saude-transparente.login` |
| **Content-Type** | `text/html; charset=UTF-8` |
| **Status** | `200` |
| **Descricao** | Formulario de login para acesso a area restrita do Saude Transparente. |

### 1.3 Area Restrita (Index)

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/area-restrita` |
| **Route Name** | `publico.saude-transparente.area-restrita.index` |
| **Content-Type** | `text/html; charset=UTF-8` |
| **Status** | `200` |
| **Descricao** | Dashboard da area restrita com dados detalhados de ocupacao de leitos, atendimentos nominais, profissionais, farmacia e regulacao. Requer autenticacao. |

### 1.4 Area Restrita - Login

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/area-restrita-login` |
| **Descricao** | Pagina de autenticacao alternativa para area restrita. |

---

## 2. Saude Transparente - Dados Publicos

Endpoints que retornam dados JSON. Acesso publico, sem autenticacao.

### 2.1 Dados Quantitativos

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/buscar-dados-quantitativos` |
| **Route Name** | `publico.saude-transparente.buscar-dados-quantitativos` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna contadores quantitativos de populacao atendida pelo sistema de saude. |

**Resposta de exemplo:**

```json
{
  "quantitativos": {
    "quantitativo_mulheres": { "titulo": "Mulheres", "valor": 4013 },
    "quantitativo_criancas": { "titulo": "Criancas", "valor": 399 },
    "quantitativo_idosos": { "titulo": "Idosos", "valor": 1422 },
    "quantitativo_homens": { "titulo": "Homens", "valor": 2941 },
    "quantitativo_gestantes": { "titulo": "Gestantes", "valor": 50 },
    "quantitativo_hipertensos": { "titulo": "Hipertensos", "valor": 2418 },
    "quantitativo_diabeticos": { "titulo": "Diabeticos", "valor": 834 },
    "quantitativo_risco_cardio_vascular": { "titulo": "Risco Cardiovascular", "valor": "..." }
  },
  "temDados": true
}
```

---

### 2.2 Tabela de Servidores

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/servidores-tabela` |
| **Route Name** | `publico.saude-transparente.servidores-tabela` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Lista todos os servidores da saude publica com vinculo, cargo e lotacao. |

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `search` | string | Nao | Filtra por nome do servidor |

**Resposta de exemplo:**

```json
{
  "firstInteration": false,
  "data": [
    {
      "pessoas": { "nome": "ABADIA APARECIDA CARVALHO BORGES" },
      "estabelecimentos_de_saude": { "nome_fantasia": "UBSF CIRO ABDO" },
      "public": { "tb_cbo": { "no_cbo": "AGENTE COMUNITARIO DE SAUDE" } },
      "vinculo": "VINCULO EMPREGATICIO",
      "tipo_de_vinculo": "ESTATUTARIO EFETIVO",
      "carga_horaria_semanal": "40 horas"
    }
  ]
}
```

---

### 2.3 Tabela de Unidades de Saude

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/unidades-tabela` |
| **Route Name** | `publico.saude-transparente.unidades-tabela` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Lista todas as unidades de saude do municipio com endereco, telefone e tipo. |

**Resposta de exemplo:**

```json
{
  "firstInteration": false,
  "data": [
    {
      "id": 3,
      "nome": "POSTO DE SAUDE CONGONHAS",
      "telefone": "",
      "endereco": "  ",
      "tipo": "POSTO DE SAUDE"
    },
    {
      "id": 6,
      "nome": "SECRETARIA MUNICIPAL DE SAUDE",
      "telefone": "6732611838",
      "endereco": "10a RUA AVENIDA FRANCISCO ANTONIO DE SOUZA , No 2348  - Bairro: CENTRO",
      "tipo": "SECRETARIA DE SAUDE"
    }
  ]
}
```

---

### 2.4 Tabela de Medicamentos

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/medicamentos-tabela` |
| **Route Name** | `publico.saude-transparente.medicamentos-tabela` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Lista medicamentos disponiveis com estoque por estabelecimento de saude. |

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `search` | string | Nao | Filtra por nome do medicamento |

**Resposta de exemplo:**

```json
{
  "total": 281,
  "medicamentos": [
    {
      "nome_do_produto": "AAS, 100 MG COMPRIMIDO",
      "unidade_do_produto": "COMP",
      "em_estoque": 320,
      "departamento": "FARMACIA",
      "estabelecimento": "UNIDADE BASICA DE SAUDE DE BANDEIRANTES",
      "estoque_minimo": 500
    }
  ]
}
```

---

### 2.5 Consultar Localizacao de Unidades

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/consultar-servicos-de-saude/localizacao` |
| **Route Name** | `publico.saude-transparente.consultar-localizacao` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna unidades de saude com geolocalizacao, horario de funcionamento e contato para uso em mapa. |

**Resposta de exemplo:**

```json
[
  {
    "title": "SECRETARIA MUNICIPAL DE SAUDE",
    "id": 6,
    "no_tipo_unidade_saude": "SECRETARIA DE SAUDE",
    "horario_de_funcionamento_inicial": "07:00:00",
    "horario_de_funcionamento_final": "17:00:00",
    "logradouro": "AVENIDA FRANCISCO ANTONIO DE SOUZA No 2348",
    "bairro": "CENTRO",
    "telefone": "(67) 3261-1838",
    "lat": null,
    "lng": null
  }
]
```

---

### 2.6 Horarios de Unidades

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/unidades/{id}/horarios` |
| **Route Name** | `publico.saude-transparente.horarios-da-unidade` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna horarios de funcionamento de uma unidade de saude especifica. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | integer | Sim | ID da unidade de saude |

**Resposta de exemplo:**

```json
{
  "horarios": null
}
```

---

### 2.7 Funcionarios de Unidades

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/unidades/{id}/funcionarios` |
| **Route Name** | `publico.saude-transparente.funcionarios-da-unidade` |
| **Status** | `200` (pode retornar `500`) |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna funcionarios alocados em uma unidade de saude especifica. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | integer | Sim | ID da unidade de saude |

---

### 2.8 Horarios de Estabelecimentos de Saude

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/estabelecimentos-de-saude/{estabelecimentoId}/horarios` |
| **Route Name** | `publico.saude-transparente.estabelecimentos-de-saude.horarios` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna grade de horarios completa de um estabelecimento de saude. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `estabelecimentoId` | integer | Sim | ID do estabelecimento de saude |

**Resposta de exemplo:**

```json
{
  "horarios": [],
  "dias": ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"],
  "horario_de_funcionamento_inicial": null,
  "horario_de_funcionamento_final": null,
  "completo": false
}
```

---

### 2.9 Profissionais CNES por Estabelecimento

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/estabelecimentos-de-saude/{id}/cnes` |
| **Route Name** | `publico.saude-transparente.estabelecimentos-de-saude.profissionais-cnes` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna lista de profissionais cadastrados no CNES para um estabelecimento. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `id` | integer | Sim | ID do estabelecimento de saude |

---

### 2.10 Quantidade de Pessoas Fisicas e Juridicas

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/buscar-dados-da-quantidade-pessoa-fisisca-juridica` |
| **Route Name** | `publico.saude-transparente.BuscarDadosDaPessoaFisicaJuridica` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna contagem de pessoas fisicas e juridicas cadastradas. |

**Resposta de exemplo:**

```json
[484, 156]
```

> Formato: `[quantidade_pessoas_fisicas, quantidade_pessoas_juridicas]`

---

### 2.11 Atendimentos por CID

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/buscar-atendimentos-por-cid` |
| **Route Name** | `publico.saude-transparente.buscar-dados-table-quantitativo-de-atendimentos-por-cid` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna atendimentos agrupados por CID com formato de tabela paginada. |

**Resposta de exemplo:**

```json
{
  "data": [],
  "total": 0,
  "paginate": false,
  "itemsPerPage": 10,
  "orderColumn": "quantidade",
  "orderDirection": "desc",
  "url": "https://...",
  "firstInteration": false
}
```

---

### 2.12 Censo dos Leitos de Internacao

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/buscar-censo-dos-leitos-da-internacao` |
| **Route Name** | `publico.saude-transparente.buscar-censo-dos-leitos-da-internacao` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna resumo do censo atual de leitos hospitalares (total, ocupados, livres, taxa de ocupacao). |

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `estabelecimento_id` | integer | Nao | Filtra por estabelecimento de saude |

**Resposta de exemplo:**

```json
{
  "total": 15,
  "ocupados": 0,
  "livres": 15,
  "taxaDeOcupacao": "0.00",
  "quantidadeDeLeitosPorStatus": []
}
```

---

### 2.13 Procedimentos Realizados - Hospitalar

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/dados-hospitalar-quantidade-procedimentos-realizados` |
| **Route Name** | `publico.saude-transparente.dados-hospitalar-quantidade-procedimentos-realizados` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna procedimentos hospitalares realizados em formato de tabela paginada. |

---

### 2.14 Procedimentos Realizados - UPA

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/dados-upa-quantidade-procedimentos-realizados` |
| **Route Name** | `publico.saude-transparente.dados-upa-quantidade-procedimentos-realizados` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna procedimentos realizados na UPA em formato de tabela paginada. |

---

### 2.15 Pessoas do Transporte por Periodo

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/buscar-pessoas-do-transporte-por-periodo` |
| **Route Name** | `publico.saude-transparente.buscar-pessoas-do-transporte-por-periodo` |
| **Status** | `200` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna registros de transporte de pacientes por periodo em formato de tabela paginada. |

---

### 2.16 Dados de Regulacao

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/dados-regulacao/{regulacao}` |
| **Route Name** | `publico.saude-transparente.dados-regulacao` |
| **Status** | `200` / `404` |
| **Content-Type** | `application/json` |
| **Descricao** | Retorna dados de uma regulacao especifica. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `regulacao` | integer | Sim | ID da regulacao |

---

### 2.17 Documentos / Anexo

| Campo | Valor |
|-------|-------|
| **Endpoint** | `GET /publico/saude-transparente/documentos/{anexo}/anexo` |
| **Route Name** | `publico.saude-transparente.documentos.anexo` |
| **Status** | `200` |
| **Descricao** | Download de documento anexo vinculado ao Saude Transparente. |

**Path Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `anexo` | integer | Sim | ID do anexo |

---

## 3. Saude Transparente - Charts

Endpoints de graficos que retornam dados no formato Chart.js. Todos sao `GET` e publicos.

**URL Base**: `/publico/saude-transparente/buscar-dados-do-chart/{recurso}`

### 3.1 Charts sem Parametros de Query

| # | Recurso | Descricao | Dados Retornados |
|---|---------|-----------|------------------|
| 1 | `atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade` | Procedimentos por especialidade na atencao basica | labels/datasets |
| 2 | `familias-visitadas-acompanhamento` | Motivos de acompanhamento em visitas domiciliares | Gestante, Puerpera, Recem-nascido, Crianca, etc. |
| 3 | `familias-visitadas-busca-ativa` | Motivos de busca ativa | Consulta, Exame, Vacina, Bolsa Familia |
| 4 | `familias-visitadas-controle-ambiente-vetorial` | Acoes de controle vetorial | Acao Educativa, Imovel Foco, Acao Mecanica, Tratamento Focal |
| 5 | `familias-visitadas-motivos-da-visita` | Motivos das visitas domiciliares | Cad. Atualizacao, Periodica, Busca Ativa, Acompanhamento, etc. |
| 6 | `lista-de-exames-mais-realizados` | Ranking de exames mais solicitados | labels/datasets |
| 7 | `lista-de-medicamentos-com-mais-saidas` | Ranking de medicamentos com mais saidas | Losartana, Hidroclorotiazida, Dipirona, etc. |
| 8 | `media-de-permanencia-na-internacao` | Tempo medio de permanencia em internacoes | labels/datasets |
| 9 | `ocorrencias-do-samu-por-mes` | Ocorrencias do SAMU por mes | labels/datasets |
| 10 | `procedimentos-mais-realizados-na-vigilancia-sanitaria` | Procedimentos de vigilancia sanitaria | labels/datasets |
| 11 | `quantidade-de-atendimento-por-sexo` | Atendimentos por sexo | labels/datasets |
| 12 | `quantidade-de-atendimentos-medicamentos-por-mes` | Atendimentos de medicamentos por mes | Janeiros de 2026, Fevereiro de 2026, etc. |
| 13 | `quantidade-de-atendimentos-por-cid` | Atendimentos agrupados por CID | labels/datasets |
| 14 | `quantidade-de-atendimentos-por-mes-da-odonto` | Atendimentos odontologicos por mes | labels/datasets |
| 15 | `quantidade-de-atendimentos-por-mes-da-vigilancia-sanitaria` | Atendimentos de vigilancia por mes | labels/datasets |
| 16 | `quantidade-de-atendimentos-por-mes-do-atendimento-pessoal` | Atendimentos presenciais por mes | labels/datasets |
| 17 | `quantidade-de-castracoes-por-mes` | Castracoes de animais por mes | labels/datasets |
| 18 | `quantidade-de-exames-realizados-por-mes` | Exames realizados por mes | labels/datasets |
| 19 | `quantidade-de-internacao-por-cid` | Internacoes agrupadas por CID | labels/datasets |
| 20 | `quantidade-de-internacoes-por-mes` | Internacoes por mes | labels/datasets |
| 21 | `quantidade-de-medicamentos-dispensados-por-mes` | Medicamentos dispensados por mes | Maio de 2025, Junho de 2025, etc. |
| 22 | `quantidade-de-pacientes-por-municipio` | Pacientes agrupados por municipio | labels/datasets |
| 23 | `quantidade-de-pacientes-que-retornaram` | Pacientes que retornaram ao servico | labels/datasets |
| 24 | `quantidade-de-pessoas-fisicas-e-juridicas` | Pessoas fisicas vs juridicas | Fisica: 484, Juridica: 156 |
| 25 | `quantidade-de-pessoas-por-mes` | Cadastros de pessoas por mes | labels/datasets |
| 26 | `quantidade-de-procedimentos-por-tipo` | Procedimentos por tipo | Consulta Medica, Fisioterapia, Hemodialise, etc. |
| 27 | `quantidade-de-vacinas-por-mes-do-esus` | Vacinas aplicadas por mes (e-SUS) | Janeiro: 690, Fevereiro: 345, etc. |
| 28 | `quantidade-de-viagens-por-cidade` | Viagens de transporte por cidade destino | Campo Grande: 5, Sao Gabriel: 2, Dourados: 1 |
| 29 | `quantidade-de-viagens-por-mes` | Viagens de transporte por mes | labels/datasets |
| 30 | `quantidade-de-zoonoses-por-mes` | Casos de zoonoses por mes | labels/datasets |
| 31 | `vacinas-mais-aplicadas-por-periodo` | Ranking de vacinas mais aplicadas | labels/datasets |

### 3.2 Charts com Parametros de Query

| # | Recurso | Parametros | Descricao |
|---|---------|------------|-----------|
| 32 | `atendimentos-por-clinica` | `ano`, `estabelecimento_id` | Atendimentos agrupados por clinica |
| 33 | `atendimentos-por-convenio` | `estabelecimento_id` | Atendimentos agrupados por convenio |
| 34 | `atendimentos-por-hora` | `data`, `estabelecimento_id`, `clinica_id` | Distribuicao de atendimentos por hora do dia |
| 35 | `atendimentos-por-hora-periodo` | `data_de_inicio`, `estabelecimento_id`, `clinica_id` | Atendimentos por hora em periodo especifico |
| 36 | `mapa-de-calor-atendimentos` | `estabelecimento_id` | Mapa de calor de atendimentos |
| 37 | `mapa-de-calor-de-atendimentos-por-hora-e-dia-do-mes` | `estabelecimento_id` | Mapa de calor por hora e dia |
| 38 | `media-de-atendimentos-por-mes-do-hospital` | `estabelecimento_id`, `clinica_id`, `hora_inicio`, `hora_fim` | Media de atendimentos hospitalares |
| 39 | `quantidade-de-atendimentos-por-mes-do-hospital` | `estabelecimento_id`, `clinica_id`, `hora_inicio`, `hora_fim` | Atendimentos hospitalares por mes |
| 40 | `quantidade-de-pacientes-classificados-por-risco` | `estabelecimento_id`, `ano`, `clinica_id` | Pacientes por classificacao de risco |
| 41 | `quantidade-de-atendimentos-por-medico` | `data_de_inicio` | Atendimentos por medico |
| 42 | `quantidade-de-atendimentos-por-cbo-da-especialidade` | `data_de_inicio` | Atendimentos por CBO da especialidade |
| 43 | `quantidade-de-atendimentos-pessoais-por-departamento` | `data_de_inicio` | Atendimentos por departamento |
| 44 | `quantidade-de-atendimentos-por-mes-da-especialidade` | `ano` | Atendimentos de especialidade por mes |
| 45 | `quantidade-de-atendimentos-por-mes-atendimento-regulacao` | `ano` | Atendimentos de regulacao por mes |
| 46 | `quantidade-de-atendimentos-medicamentos-por-mes` | `ano` | Atendimentos de medicamentos por mes |
| 47 | `quantidade-de-exames-realizados-por-mes` | `ano` | Exames por mes |
| 48 | `quantidade-de-vacinas-por-mes-do-esus` | `ano` | Vacinas e-SUS por mes |
| 49 | `quantidade-de-atendimentos-por-mes-da-vigilancia-sanitaria` | `ano` | Atendimentos de vigilancia por mes |
| 50 | `taxa-de-retorno-de-pacientes` | `estabelecimento_id` | Taxa de retorno de pacientes |
| 51 | `taxa-de-reinternacoes` | `estabelecimento_id` | Taxa de reinternacoes |
| 52 | `taxa-de-ocupacao-de-leito` | `estabelecimento_id` | Taxa de ocupacao de leitos |
| 53 | `tempo-medio-de-permanencia` | `ano_selecionado` | Tempo medio de permanencia |
| 54 | `tempo-medio-de-espera-por-hora-chegada-ate-consulta` | `data_de_inicio` | Tempo medio de espera (chegada ate consulta) |
| 55 | `tempo-medio-para-atendimento-medico-por-cr` | `ano` | Tempo medio de atendimento medico por classificacao de risco |
| 56 | `tempo-medio-de-espera-classificacao-de-risco` | (parametros a confirmar) | Tempo medio de espera por classificacao de risco |

### Parametros de Query Comuns

| Parametro | Tipo | Usado em | Descricao |
|-----------|------|----------|-----------|
| `ano` | integer (ex: 2026) | Charts mensais | Ano de referencia para os dados |
| `estabelecimento_id` | integer | Charts hospitalares | ID do estabelecimento de saude |
| `clinica_id` | integer | Charts hospitalares | ID da clinica dentro do estabelecimento |
| `data` | date (YYYY-MM-DD) | Charts por dia | Data especifica |
| `data_de_inicio` | date (YYYY-MM-DD) | Charts por periodo | Data inicial do periodo |
| `hora_inicio` | time (HH:MM) | Charts hospitalares | Hora inicial do filtro |
| `hora_fim` | time (HH:MM) | Charts hospitalares | Hora final do filtro |
| `ano_selecionado` | integer | Charts de permanencia | Ano selecionado |
| `search` | string | medicamentos-tabela, servidores-tabela | Termo de busca textual |

---

## 4. Saude Transparente - Area Restrita

Endpoints acessados internamente pela area restrita. Requerem autenticacao (login na sessao).

### 4.1 Tipos de Request

| Route Name Pattern | Descricao |
|-------------------|-----------|
| `publico.saude-transparente.area-restrita.buscar-dados` | Busca dados sob demanda com recurso como parametro |
| `publico.saude-transparente.area-restrita.buscar-dados-em-cache` | Busca dados em cache (performance) |
| `publico.saude-transparente.area-restrita.buscar-dados-para-chart` | Busca dados para graficos especificos |

### 4.2 Recursos Disponiveis (buscar-dados)

| # | Recurso | Descricao |
|---|---------|-----------|
| 1 | `ocupacao-de-leitos` | Dados de ocupacao de leitos hospitalares |
| 2 | `aguardando-atendimento-nominal` | Lista nominal de pacientes aguardando |
| 3 | `aguardando-atendimento-unidades` | Pacientes aguardando por unidade |
| 4 | `atendimentos-nominal` | Lista nominal de atendimentos |
| 5 | `atendimentos-profissionais` | Atendimentos por profissional |
| 6 | `profissionais-com-mais-encaminhamentos` | Ranking de profissionais por encaminhamentos |
| 7 | `profissionais-com-mais-encaminhamentos-pela-especialidade` | Profissionais por especialidade |
| 8 | `especialidades-com-mais-encaminhamentos` | Especialidades com mais encaminhamentos |
| 9 | `especialidades-mais-encaminhadas-pelo-profissional` | Especialidades encaminhadas por profissional |
| 10 | `funcionarios-que-mais-solicitaram-exames` | Funcionarios que mais solicitam exames |
| 11 | `funcionarios-que-mais-solicitaram-exames-nominal` | Funcionarios que mais solicitam exames (nominal) |
| 12 | `exames-mais-solicitados` | Ranking de exames mais solicitados |
| 13 | `exames-mais-solicitados-profissional` | Exames mais solicitados por profissional |
| 14 | `resultados-equipes` | Resultados das equipes de saude |
| 15 | `qtd-vacinas-faltantes-aplicar` | Quantidade de vacinas faltantes para aplicar |
| 16 | `profissional-atendimentos-nominais-tempo-historico` | Tempo historico de atendimentos por profissional |
| 17 | `profissional-atendimentos-nominais-tempo-hoje` | Tempo de atendimentos por profissional hoje |
| 18 | `farmacia-medicamentos-vencidos` | Medicamentos vencidos na farmacia |
| 19 | `farmacia-medicamentos-vencendo-em-30-dias` | Medicamentos vencendo em 30 dias |
| 20 | `exames-de-imagem-com-mais-de-30-dias` | Exames de imagem com mais de 30 dias de espera |
| 21 | `especialidades-com-mais-de-30-dias` | Especialidades com mais de 30 dias de espera |
| 22 | `encaminhamentos-em-aberto` | Encaminhamentos pendentes de atendimento |
| 23 | `efetividade-esf` | Efetividade das Equipes de Saude da Familia |

### 4.3 Recursos em Cache (buscar-dados-em-cache)

| # | Recurso | Descricao |
|---|---------|-----------|
| 1 | `atencao-primaria-unidades` | Dados de atencao primaria por unidade |
| 2 | `atencao-primaria-profissionais` | Dados de atencao primaria por profissional |

### 4.4 Recursos para Chart (buscar-dados-para-chart)

| # | Recurso | Descricao |
|---|---------|-----------|
| 1 | `efetividade-de-atendimentos-finalizados-esus-esf` | Grafico de efetividade ESF (e-SUS) |

---

## 5. API Bot / Chatbot

Endpoints da API REST para integracao com chatbot/bot. Base: `/api/bot/`.

### 5.1 Autenticacao e Pessoas

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `POST` | `/api/bot/criar-chave-de-acesso` | `bot.generated::ZHlS2IiaFb8sTZzf` | Cria chave de acesso para o bot |
| `POST` | `/api/bot/confirmar-chave-de-acesso` | `bot.generated::NvcuuNM3thyNO83J` | Confirma/valida chave de acesso |
| `POST` | `/api/bot/verificar-pessoa` | `bot.generated::tMmYRRanBV7cWd4h` | Verifica se pessoa existe no sistema |
| `GET` | `/api/bot/pessoa` | `bot.generated::*` | Busca dados de uma pessoa |
| `POST` | `/api/bot/pessoa-esus` | `bot.generated::CZ1eeieZ3vU56sHQ` | Busca pessoa no e-SUS |
| `GET` | `/api/bot/busca-pessoa-esus` | `bot.generated::iMsH8dEhp5cPnJu2` | Busca pessoa no e-SUS (GET) |
| `POST` | `/api/bot/chatbot/buscar-pessoa-pelas-informacoes-pessoais` | `bot.generated::cZ0AyQqfmoWjxWgG` | Busca pessoa por dados pessoais |
| `POST` | `/api/bot/chatbot/pesquisar-pessoa-pelo-numero` | `bot.generated::C8NOneTM5uAkjSqh` | Busca pessoa por numero (CPF/CNS) |
| `GET` | `/api/bot/cartao-sus` | `bot.generated::wJyZ7MBWiWOxckEX` | Busca dados do cartao SUS |

### 5.2 Agendamento e-SUS

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/bot/agenda-esus/profissionais` | `bot.generated::x2Aha67q8V6mg0cF` | Lista profissionais disponiveis |
| `GET` | `/api/bot/agenda-esus/dias` | `bot.generated::y9haua1k78UfIZ3D` | Dias disponiveis para agendamento |
| `GET` | `/api/bot/agenda-esus/periodos` | `bot.generated::nWZ9PugnD4lyw3u2` | Periodos disponiveis |
| `GET` | `/api/bot/agenda-esus/horarios` | `bot.generated::2Dx6Vt0EeHhi7Nra` | Horarios disponiveis |
| `POST` | `/api/bot/agenda-esus/agendar` | `bot.generated::I6t48S3rzspfXQ47` | Realiza agendamento |

### 5.3 Atendimento e Regulacao

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `POST` | `/api/bot/iniciar-atendimento` | `bot.generated::wORBy4eKRxeGLAR2` | Inicia atendimento via bot |
| `GET` | `/api/bot/encaminhamento` | `bot.generated::Lx96Rho0xvkigkNT` | Busca dados de encaminhamento |
| `POST` | `/api/bot/regulacao/situacao-ultimo-encaminhamento` | `bot.generated::K2MUuYPys4dviRX8` | Situacao do ultimo encaminhamento |

### 5.4 Resultados e Documentos

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/bot/exames-imagem` | `bot.generated::dx9eeiWn9bhDXqBJ` | Resultados de exames de imagem |
| `POST` | `/api/bot/exames-imagem/area-publica` | `bot.generated::ebR4V8j8Y9nU1gBB` | Exames de imagem (area publica) |
| `GET` | `/api/bot/exames-laboratorio` | `bot.generated::d4NHUZU4gu0ldOAH` | Resultados de exames laboratoriais |

### 5.5 Farmacia e Medicamentos

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/bot/medicamento` | `bot.generated::Bb7E0OGqAp9qbadB` | Busca medicamentos disponiveis |
| `GET` | `/api/bot/medicamento-retirados` | `bot.generated::PgDCk12zknLivqHb` | Medicamentos retirados pelo paciente |

### 5.6 Outros Servicos Bot

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/bot/campanha-vacinacao` | `bot.generated::xKxEkMp5y6pWmTNP` | Campanhas de vacinacao ativas |
| `GET` | `/api/bot/comprovante-vacinacao` | `bot.generated::4lOfxCEKdNu28QDQ` | Comprovante de vacinacao |
| `GET` | `/api/bot/comprovante-viagem` | `bot.generated::uEm7xE1NUgGbAyFq` | Comprovante de viagem (transporte) |
| `GET` | `/api/bot/autorizacao-de-gasto` | `bot.generated::a5oiENRIL62nGKb4` | Autorizacao de gasto |
| `POST` | `/api/bot/alvara-contribuinte` | `bot.generated::FDBRk00NFGDPz91p` | Alvara de contribuinte |
| `POST` | `/api/bot/ouvidoria` | `bot.generated::I9rS9WXYZclRI7ee` | Registro de ouvidoria |
| `POST` | `/api/bot/unidade` | `bot.generated::3OfN34Jc5a52H12x` | Busca dados de unidade |

### 5.7 Outras APIs REST

| Metodo | Endpoint | Route Name | Descricao |
|--------|----------|------------|-----------|
| `GET` | `/api/usuario-logado` | `api.usuarios.usuario-logado` | Retorna usuario logado na sessao |
| `GET` | `/api/transporte/reservas` | `reservas.index` | Lista reservas de transporte |
| `POST` | `/api/transporte/reservas` | `reservas.store` | Cria reserva de transporte |
| `DELETE` | `/api/transporte/reservas/{reserva}` | `reservas.destroy` | Cancela reserva de transporte |
| `GET` | `/api/worklist` | `worklist.index` | Lista de trabalho (worklist) |
| `GET` | `/api/integra-icp/callback/{chave}/{user}` | `integra-icp.callback` | Callback de integracao ICP |

---

## 6. Outros Modulos Publicos

Modulos publicos adicionais identificados no sistema. Todos sob o prefixo `/publico/`.

### 6.1 Autoatendimento - Especialidade

CRUD completo para autoatendimento por especialidade medica.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/autoatendimento-especialidade` | Lista |
| `POST` | `/publico/autoatendimento-especialidade` | Cria |
| `GET` | `/publico/autoatendimento-especialidade/{id}` | Detalhe |
| `PUT/PATCH` | `/publico/autoatendimento-especialidade/{id}` | Atualiza |
| `DELETE` | `/publico/autoatendimento-especialidade/{id}` | Remove |
| `GET` | `/publico/autoatendimento-especialidade/create` | Formulario |
| `GET` | `/publico/autoatendimento-especialidade/{id}/edit` | Formulario edicao |
| `GET` | `/publico/autoatendimento-especialidade/buscar-pessoa` | Busca pessoa |
| `POST` | `/publico/autoatendimento-especialidade/update-settings` | Atualiza config |

### 6.2 Autoatendimento - Hospitalar

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/autoatendimento-hospitalar` | Lista |
| `POST` | `/publico/autoatendimento-hospitalar` | Cria |
| `GET` | `/publico/autoatendimento-hospitalar/{id}` | Detalhe |
| `PUT/PATCH` | `/publico/autoatendimento-hospitalar/{id}` | Atualiza |
| `DELETE` | `/publico/autoatendimento-hospitalar/{id}` | Remove |
| `GET` | `/publico/autoatendimento-hospitalar/create` | Formulario |
| `GET` | `/publico/autoatendimento-hospitalar/{id}/edit` | Formulario edicao |
| `POST` | `/publico/autoatendimento-hospitalar/update-settings` | Atualiza config |

### 6.3 Avaliar Atendimento

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/avaliar-atendimento` | Lista avaliacoes |
| `POST` | `/publico/avaliar-atendimento` | Cria avaliacao |
| `GET` | `/publico/avaliar-atendimento/{id}` | Detalhe |
| `GET` | `/publico/avaliar-atendimento/buscar-atendimento` | Busca atendimento |
| `GET` | `/publico/avaliar-atendimento/buscar-pessoas` | Busca pessoas |

### 6.4 Documentos Publicos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET,POST` | `/publico/documentos/prescricao/{protocolo}` | Prescricao medica |
| `GET,POST` | `/publico/documentos/prescricao-medica/{protocolo}` | Prescricao medica (v2) |
| `GET,POST` | `/publico/documentos/atestado/{protocolo}` | Atestado medico |
| `GET,POST` | `/publico/documentos/evolucoes/{protocolo}` | Evolucoes clinicas |
| `GET,POST` | `/publico/documentos/orientacao/{protocolo}` | Orientacoes |
| `GET,POST` | `/publico/documentos/guia-encaminhamento/{protocolo}` | Guia de encaminhamento |
| `GET,POST` | `/publico/documentos/regulacao-encaminhamento/{protocolo}` | Regulacao/encaminhamento |
| `GET,POST` | `/publico/documentos/requisicao-exames/{protocolo}` | Requisicao de exames |
| `GET,POST` | `/publico/documentos/sae/{protocolo}` | Documento SAE |
| `GET` | `/publico/documentos/exames/{protocolo?}` | Resultado de exames |
| `GET` | `/publico/documentos/exames-imagem/{protocolo?}` | Exames de imagem |
| `GET` | `/publico/documentos/exames/agenda-coleta/{protocolo?}` | Agenda de coleta |

### 6.5 Fila de Dispensacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/fila-dispensacao` | Lista |
| `POST` | `/publico/fila-dispensacao` | Cria |
| `GET` | `/publico/fila-dispensacao/{id}` | Detalhe |
| `GET` | `/publico/fila-dispensacao/buscar-pessoa` | Busca pessoa |
| `POST` | `/publico/fila-dispensacao/update-settings` | Atualiza config |

### 6.6 Orcamentos dos Fornecedores

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/orcamentos/login` | Login de fornecedor |
| `POST` | `/publico/orcamentos/login` | Autentica fornecedor |
| `GET` | `/publico/orcamentos/logout` | Logout |
| `GET` | `/publico/orcamentos/orcamentos-dos-fornecedores` | Lista orcamentos |
| `POST` | `/publico/orcamentos/orcamentos-dos-fornecedores` | Cria orcamento |
| `GET` | `/publico/orcamentos/orcamentos-dos-fornecedores/{id}` | Detalhe |
| `GET` | `/publico/orcamentos/orcamentos-dos-fornecedores/filtrar-orcamento-por-status` | Filtra por status |
| `GET` | `/publico/orcamentos/orcamentos-dos-fornecedores/get-produtos-do-orcamento/{id}` | Produtos do orcamento |
| `POST` | `/publico/orcamentos/orcamentos-dos-fornecedores/{id}/finalizar` | Finaliza orcamento |
| `POST` | `/publico/orcamentos/orcamentos-dos-fornecedores/{id}/salvar-produtos` | Salva produtos |

### 6.7 Totem (Autoatendimento)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/totem` | Pagina principal |
| `GET` | `/publico/totem/login` | Login |
| `GET` | `/publico/totem/atendimento` | Atendimento |
| `POST` | `/publico/totem/criar-atendimento` | Cria atendimento |
| `POST` | `/publico/totem/verificar-se-possui-atendimento-ou-cadastro` | Verifica paciente |
| `POST` | `/publico/totem/update-icone` | Atualiza icone |
| `POST` | `/publico/totem/update-profissional` | Atualiza profissional |

### 6.8 Vigilancia Sanitaria

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `GET` | `/publico/vigilancia-sanitaria` | Pagina principal |
| `GET` | `/publico/vigilancia-sanitaria/login` | Login |
| `GET` | `/publico/vigilancia-sanitaria/create` | Cadastro contribuinte |
| `POST` | `/publico/vigilancia-sanitaria` | Salva contribuinte |
| `GET` | `/publico/vigilancia-sanitaria/contribuinte/perfil` | Perfil |
| `GET` | `/publico/vigilancia-sanitaria/contribuinte/edit` | Edita perfil |
| `PUT` | `/publico/vigilancia-sanitaria/contribuinte` | Atualiza perfil |
| `GET,PUT` | `/publico/vigilancia-sanitaria/contribuinte/trocar-senha` | Troca senha |
| `GET` | `/publico/vigilancia-sanitaria/dados-do-cadastro` | Dados do cadastro |
| `POST` | `/publico/vigilancia-sanitaria/adicao-media-do-contribuinte/{id}` | Adiciona media |
| `POST` | `/publico/vigilancia-sanitaria/denuncia` | Registra denuncia |
| `GET` | `/publico/vigilancia-sanitaria/solicitacoes-de-servico` | Lista solicitacoes |
| `POST` | `/publico/vigilancia-sanitaria/solicitacoes-de-servico` | Cria solicitacao |
| `GET` | `/publico/vigilancia-sanitaria/servicos` | Lista servicos |
| `POST` | `/publico/vigilancia-sanitaria/servicos/{solicitacao_id}/adicionar-anexos` | Adiciona anexos |
| `GET` | `/publico/vigilancia-sanitaria/servicos/{solicitacao_id}/get-table-data` | Dados tabela |
| `DELETE` | `/publico/vigilancia-sanitaria/anexos/{anexoId}` | Remove anexo |

### 6.9 Questionarios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/publico/questionarios` | Salva respostas de questionario |

---

## Notas Tecnicas

### Headers Recomendados

```
Accept: application/json
X-Requested-With: XMLHttpRequest
```

### Framework

- **Backend**: Laravel (PHP) com Inertia.js
- **Frontend**: Vue.js (compilado via Inertia)
- **Rotas expostas via**: Ziggy (pacote Laravel que expoe rotas nomeadas ao JavaScript)
- **Total de rotas registradas**: 4.389

### Formato de Dados dos Charts

Todos os charts seguem o padrao Chart.js:

```typescript
interface ChartResponse {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }>;
}
```

### Formato de Dados das Tabelas

```typescript
interface TableResponse {
  data: Record<string, any>[];
  total: number;
  paginate: boolean;
  itemsPerPage: number;
  orderColumn: string;
  orderDirection: "asc" | "desc";
  url: string;
  firstInteration: boolean;
}
```

### Observacoes para Integracao

1. **CORS**: Verificar politicas de CORS antes de integracao cross-origin
2. **Rate Limiting**: Laravel pode aplicar rate limiting em endpoints publicos
3. **Autenticacao**: Endpoints da area restrita usam sessao (cookie-based auth)
4. **CSRF**: Requests POST/PUT/DELETE podem exigir token CSRF
5. **Dados Dinamicos**: Charts com parametros de data/ano retornam dados diferentes conforme filtro
6. **Paginacao**: Tabelas suportam paginacao via `itemsPerPage` e ordenacao via `orderColumn`/`orderDirection`
7. **Cache**: Alguns endpoints da area restrita usam cache (`buscar-dados-em-cache`)
8. **Ids**: O parametro `id` em todas as rotas tem constraint regex `[0-9]+` (apenas numeros)

---

## Historico de Revisoes

| Data | Versao | Autor | Descricao |
|------|--------|-------|-----------|
| 2026-04-22 | 1.0 | AI Analyst | Documentacao inicial completa via analise do Ziggy routes + testes de endpoints |
