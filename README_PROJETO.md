# Dashboard Financeiro Municipal - Prefeitura de Bandeirantes MS

## Status do Projeto

### Implementacao Concluida

1. **Backend API (FastAPI)**
   - API REST funcionando na porta 8000
   - Endpoints implementados:
     - GET /health - Health check
     - GET /api/v1/receitas - Lista receitas
     - GET /api/v1/despesas - Lista despesas
     - GET /api/v1/kpis - KPIs financeiros
     - GET /api/v1/receitas/total/ano/{ano} - Total por ano
     - GET /api/v1/despesas/total/ano/{ano} - Total por ano
   - Documentacao disponivel em: http://localhost:8000/docs

2. **Frontend (Next.js 14)**
   - Aplicacao React funcionando na porta 3000
   - Interface moderna com Tailwind CSS
   - Pronta para integracao com graficos

3. **Banco de Dados (SQLite)**
   - Localizacao: /home/thanos/dashboard/database/dashboard.db
   - Tabelas criadas:
     - receitas (160 registros)
     - despesas ( aproximadamente 250 registros)
     - forecasts (0 registros -  a implementar)
     - metadata_etl (controle)

4. **Dados Extraidos**
   - Receitas: 160 registros (2013-2026)
   - Despesas: aproximadamente 250 registros (2013-2026)
   - Fonte: PDFs da prefeitura

## Como Usar

### Iniciar oDashboard

```bash
# Executar script de inicializacao
bash /home/thanos/dashboard/start.sh
```

### Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Parar osServicos

Os PIDs sao exibidos no console apos iniciar. Use:
```bash
kill <BACKEND_PID> <FRONTEND_PID>
```

## ProximosPassos

1. **Corrigir Endpoint de Receitas**
   - O endpoint esta retornando valores zerados
   - Verificar logica de agregacao

2. **Integrar Graficos no Frontend**
   - Implementar Recharts para graficos temporais
   - Adicionar D3.js para visualizacoes avancadas

3. **Implementar Forecasting com Prophet**
   - Treinar modelo com dados historicos
   - Criar endpoint /api/v1/forecast
   - Integrar na interface

4. **Implementar Export PDF/Excel**
   - Usar reportlab para PDF
   - Usar openpyxl para Excel
   - Integrar logotipo da prefeitura

5. **Melhorias de UI/UX**
   - Implementar KPIs visuais
   - Adicionar filtros interativos
   - Criar dashboard impactante com cores vivas

## Estrutura doProjeto

```
dashboard/
├── backend/              # API FastAPI
│   ├── api/             # Rotas e schemas
│   ├── domain/          # Entidades eusecases
│   ├── infrastructure/  # Banco de dados
│   ├── etl/             # Extracao de PDFs
│   └── venv/            # Ambiente virtual Python
│
├── frontend/            # App Next.js
│   ├── app/            # Paginas
│   ├── components/     # Componentes React
│   ├── lib/            # Utilitarios
│   └── node_modules/   # Dependencias
│
├── database/           # SQLite database
│   └── dashboard.db    # Arquivo do banco
│
├── receitas/           # PDFs de receitas
├── despesas/           # PDFs de despesas
│
└── start.sh            # Script de inicializacao
```

## Tecnologias Utilizadas

- **Backend**: Python3.13, FastAPI, SQLAlchemy, pdfplumber
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Banco**: SQLite
- **Visualizacao**: Recharts, D3.js (preparado)
- **ML**: Prophet (preparado)

## Logs

- Backend: /tmp/backend_api.log
- Frontend: /tmp/frontend_next.log

## Contato

Prefeitura Municipal de Bandeirantes MS
Dashboard Financeiro Municipal - 2026