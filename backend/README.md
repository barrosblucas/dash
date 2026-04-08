# Backend - Dashboard Financeiro Municipal

Backend Python/FastAPI para o dashboard financeiro da Prefeitura de Bandeirantes MS.

## 🚀 Funcionalidades

- **API REST** para consulta de receitas e despesas municipais
- **ETL Pipeline** para extração de dados de PDFs
- **KPIs Financeiros** com totais anuais e mensais
- **Clean Architecture** com separação de responsabilidades
- **SQLite Database** para persistência de dados

## 📁 Estrutura do Projeto

```
backend/
├── api/                      # Camada de apresentação
│   ├── routes/               # Rotas da API
│   │   ├── receitas.py       # Endpoints de receitas
│   │   ├── despesas.py       # Endpoints de despesas
│   │   └── kpis.py           # Endpoints de KPIs
│   ├── schemas.py            # Schemas Pydantic
│   └── main.py               # Aplicação FastAPI
├── domain/                   # Camada de domínio
│   ├── entities/             # Entidades de negócio
│   │   ├── receita.py
│   │   └── despesa.py
│   └── repositories/          # Interfaces de repositório
│       └── receita_repository.py
├── infrastructure/           # Camada de infraestrutura
│   ├── database/             # Modelos e conexão
│   │   ├── models.py         # Modelos SQLAlchemy
│   │   └── connection.py     # Gerenciador de banco
│   └── repositories/         # Implementações
│       └── sql_receita_repository.py
├── etl/                      # Pipeline ETL
│   └── extractors/
│       └── pdf_extractor.py  # Extrator de PDFs
├── init_db.py                # Script de inicialização
└── requirements.txt          # Dependências
```

## 🛠️ Instalação

### Pré-requisitos

- Python 3.13+
- pip ou poetry

### Passos

1. **Criar ambiente virtual:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # ou
   .\venv\Scripts\activate   # Windows
   ```

2. **Instalar dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Inicializar banco de dados:**
   ```bash
   python init_db.py
   ```

4. **Iniciar API:**
   ```bash
   uvicorn backend.api.main:app --reload
   ```

5. **Acessar documentação:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## 📊 API Endpoints

### Receitas

- `GET /api/v1/receitas/` - Lista receitas com filtros
- `GET /api/v1/receitas/{id}` - Busca receita por ID
- `GET /api/v1/receitas/categorias/` - Lista categorias
- `GET /api/v1/receitas/total/ano/{ano}` - Total por ano
- `GET /api/v1/receitas/total/mes/{ano}/{mes}` - Total por mês

### Despesas

- `GET /api/v1/despesas/` - Lista despesas com filtros
- `GET /api/v1/despesas/{id}` - Busca despesa por ID
- `GET /api/v1/despesas/categorias/` - Lista categorias
- `GET /api/v1/despesas/total/ano/{ano}` - Total por ano
- `GET /api/v1/despesas/total/mes/{ano}/{mes}` - Total por mês

### KPIs

- `GET /api/v1/kpis/` - KPIs principais
- `GET /api/v1/kpis/mensal/{ano}` - KPIs mensais
- `GET /api/v1/kpis/anual/` - KPIs anuais
- `GET /api/v1/kpis/resumo/` - Resumo geral

### Health Check

- `GET /health` - Verifica status da API

### Admin

- `POST /admin/reset-database` - Reinicializa banco (desenvolvimento)
- `GET /admin/stats` - Estatísticas do banco

## 🔍 Exemplos de Uso

### Listar receitas de 2023

```bash
curl "http://localhost:8000/api/v1/receitas?ano=2023"
```

### Total de despesas por mês

```bash
curl "http://localhost:8000/api/v1/despesas/total/mes/2023/6"
```

### KPIs anuais de 2020 a 2023

```bash
curl "http://localhost:8000/api/v1/kpis/anual/?ano_inicio=2020&ano_fim=2023"
```

## 🧪 Testes

```bash
# Executar testes
pytest

# Com cobertura
pytest --cov=backend tests/

# Teste específico
pytest tests/test_api/test_receitas.py -v
```

## 📝 Arquitetura

O projeto segue **Clean Architecture** com as seguintes camadas:

1. **Domain**: Entidades de negócio, interfaces de repositório
2. **Infrastructure**: Implementações de persistência, modelos
3. **API**: Controllers, schemas, rotas

### Benefícios

- ✅ Separação de responsabilidades
- ✅ Testabilidade
- ✅ Manutenibilidade
- ✅ Flexibilidade para trocar banco de dados
- ✅ Independência de frameworks

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL=sqlite:///./database/dashboard.db
DEBUG=True
API_VERSION=1.0.0
```

## 📚 Dependências Principais

- **FastAPI** - Framework web assíncrono
- **SQLAlchemy** - ORM para banco de dados
- **Pydantic** - Validação de dados
- **pdfplumber** - Extração de dados de PDFs
- **Prophet** - Modelos de previsão (futuro)

## 🚧 Roadmap

- [ ] Implementar cache com Redis
- [ ] Adicionar autenticação JWT
- [ ] Implementar previsões com Prophet
- [ ] Adicionar exportação para Excel/PDF
- [ ] Implementar testes automatizados
- [ ] Adicionar logging estruturado
- [ ] Implementar rate limiting

## 📖 Documentação

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/08/the-clean-architecture.html)

## 📄 Licença

MIT License - Veja [LICENSE](../LICENSE) para mais detalhes.

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request