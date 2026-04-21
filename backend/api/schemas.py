"""
Schemas Pydantic para validação e serialização da API.

Define modelos de entrada e saída para todos os endpoints.
"""

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class TipoReceitaEnum(str, Enum):
    """Tipo de receita."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"


class TipoDespesaEnum(str, Enum):
    """Tipo de despesa."""

    CORRENTE = "CORRENTE"
    CAPITAL = "CAPITAL"
    CONTINGENCIA = "CONTINGENCIA"


class ReceitaResponse(BaseModel):
    """Schema de resposta para receita."""

    id: Optional[int] = None
    ano: int = Field(..., description="Ano da receita")
    mes: int = Field(..., ge=1, le=12, description="Mês da receita (1-12)")
    categoria: str = Field(..., description="Categoria da receita")
    subcategoria: Optional[str] = Field(None, description="Subcategoria da receita")
    tipo: TipoReceitaEnum = Field(
        default=TipoReceitaEnum.CORRENTE, description="Tipo da receita"
    )
    valor_previsto: Decimal = Field(..., description="Valor previsto no orçamento")
    valor_arrecadado: Decimal = Field(..., description="Valor arrecadado")
    valor_anulado: Decimal = Field(default=Decimal("0"), description="Valor anulado")
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class ReceitaListResponse(BaseModel):
    """Schema de resposta para lista de receitas."""

    receitas: List[ReceitaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class ReceitaFilterParams(BaseModel):
    """Parâmetros de filtro para receitas."""

    ano: Optional[int] = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: Optional[int] = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: Optional[str] = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: Optional[TipoReceitaEnum] = Field(None, description="Filtrar por tipo")
    ano_inicio: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano inicial do período"
    )
    ano_fim: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano final do período"
    )
    limit: Optional[int] = Field(
        None, ge=1, le=1000, description="Limite de resultados"
    )
    offset: Optional[int] = Field(None, ge=0, description="Offset para paginação")


class DespesaResponse(BaseModel):
    """Schema de resposta para despesa."""

    id: Optional[int] = None
    ano: int = Field(..., description="Ano da despesa")
    mes: int = Field(..., ge=1, le=12, description="Mês da despesa (1-12)")
    categoria: Optional[str] = Field(None, description="Categoria da despesa")
    subcategoria: Optional[str] = Field(None, description="Subcategoria da despesa")
    tipo: TipoDespesaEnum = Field(
        default=TipoDespesaEnum.CORRENTE, description="Tipo da despesa"
    )
    valor_empenhado: Decimal = Field(..., description="Valor empenhado")
    valor_liquidado: Decimal = Field(..., description="Valor liquidado")
    valor_pago: Decimal = Field(..., description="Valor pago")
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class DespesaListResponse(BaseModel):
    """Schema de resposta para lista de despesas."""

    despesas: List[DespesaResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class DespesaFilterParams(BaseModel):
    """Parâmetros de filtro para despesas."""

    ano: Optional[int] = Field(None, ge=2013, le=2030, description="Filtrar por ano")
    mes: Optional[int] = Field(None, ge=1, le=12, description="Filtrar por mês")
    categoria: Optional[str] = Field(
        None, description="Filtrar por categoria (busca parcial)"
    )
    tipo: Optional[TipoDespesaEnum] = Field(None, description="Filtrar por tipo")
    ano_inicio: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano inicial do período"
    )
    ano_fim: Optional[int] = Field(
        None, ge=2013, le=2030, description="Ano final do período"
    )
    limit: Optional[int] = Field(
        None, ge=1, le=1000, description="Limite de resultados"
    )
    offset: Optional[int] = Field(None, ge=0, description="Offset para paginação")


class KPIMensal(BaseModel):
    """KPI mensal."""

    mes: int
    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    percentual_execucao_receita: Optional[Decimal] = None
    percentual_execucao_despesa: Optional[Decimal] = None


class KPIAnual(BaseModel):
    """KPI anual."""

    ano: int
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    receitas_correntes: Optional[Decimal] = None
    receitas_capital: Optional[Decimal] = None
    despesas_correntes: Optional[Decimal] = None
    despesas_capital: Optional[Decimal] = None


class KPIsResponse(BaseModel):
    """Schema de resposta para KPIs."""

    periodo: str = Field(..., description="Período de referência (ex: 2023 ou 2023-01)")
    receitas_total: Decimal = Field(..., description="Total de receitas no período")
    despesas_total: Decimal = Field(..., description="Total de despesas no período")
    saldo: Decimal = Field(..., description="Saldo (receitas - despesas)")
    percentual_execucao_receita: Optional[Decimal] = Field(
        None, description="Percentual de execução das receitas"
    )
    percentual_execucao_despesa: Optional[Decimal] = Field(
        None, description="Percentual de execução das despesas"
    )
    kpis_mensais: Optional[List[KPIMensal]] = Field(None, description="KPIs por mês")
    kpis_anuais: Optional[List[KPIAnual]] = Field(None, description="KPIs por ano")


class HealthCheckResponse(BaseModel):
    """Schema de resposta para health check."""

    status: str = Field(..., description="Status da API")
    version: str = Field(default="1.0.0", description="Versão da API")
    database: str = Field(..., description="Status do banco de dados")
    timestamp: date = Field(default_factory=date.today, description="Data atual")


class ErrorResponse(BaseModel):
    """Schema de resposta para erros."""

    error: str = Field(..., description="Mensagem de erro")
    detail: Optional[str] = Field(None, description="Detalhes do erro")
    code: Optional[str] = Field(None, description="Código do erro")


class ForecastPoint(BaseModel):
    """Schema para um ponto de previsão."""

    data: date = Field(..., description="Data da previsão")
    valor_previsto: Decimal = Field(..., description="Valor previsto")
    intervalo_inferior: Decimal = Field(
        ..., description="Intervalo inferior de confiança"
    )
    intervalo_superior: Decimal = Field(
        ..., description="Intervalo superior de confiança"
    )
    tendencia: str = Field(..., description="Tendência: 'alta', 'baixa' ou 'estavel'")


class ForecastResponse(BaseModel):
    """Schema de resposta para forecasting."""

    tipo: str = Field(..., description="Tipo: 'receitas' ou 'despesas'")
    horizonte_meses: int = Field(..., description="Número de meses previstos")
    nivel_confianca: float = Field(..., description="Nível de confiança (0-1)")
    previsoes: List[ForecastPoint] = Field(..., description="Lista de previsões")


class ReceitaDetalhamentoResponse(BaseModel):
    """Schema de resposta para detalhamento hierárquico de receita."""

    id: int = Field(..., description="ID do registro")
    ano: int = Field(..., description="Ano de referência")
    detalhamento: str = Field(..., description="Nome da categoria detalhada")
    nivel: int = Field(
        ..., ge=1, description="Nível na hierarquia (1=raiz, 2=sub, etc.)"
    )
    ordem: int = Field(..., ge=0, description="Ordem de apresentação no PDF")
    tipo: str = Field(..., description="Tipo: CORRENTE ou CAPITAL")
    valor_previsto: Decimal = Field(..., description="Valor previsto anual")
    valor_arrecadado: Decimal = Field(..., description="Valor arrecadado anual")
    valor_anulado: Decimal = Field(
        default=Decimal("0"), description="Valor anulado anual"
    )
    fonte: str = Field(default="PDF", description="Fonte dos dados")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v),
        }


class ReceitaDetalhamentoListResponse(BaseModel):
    """Schema de resposta para lista de detalhamento de um ano."""

    ano: int = Field(..., description="Ano de referência")
    itens: List[ReceitaDetalhamentoResponse] = Field(
        ..., description="Lista de itens do detalhamento"
    )
    total_itens: int = Field(..., description="Total de itens")


class ETLStatusResponse(BaseModel):
    """Schema de resposta para status do ETL."""

    arquivo: str
    tipo: str
    ano: int
    status: str
    registros_processados: int
    erro: Optional[str] = None
    processed_at: Optional[date] = None


# --- Schemas de scraping ---


class ScrapingStatusResponse(BaseModel):
    """Status do scraper."""

    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    receitas_status: str = "unknown"
    despesas_status: str = "unknown"
    receitas_records: int = 0
    despesas_records: int = 0
    errors: List[str] = []


class ScrapingTriggerRequest(BaseModel):
    """Request para disparar scraping manual."""

    year: int = 2026
    data_type: str = "all"  # "receitas", "despesas", "all"


class ScrapingTriggerResponse(BaseModel):
    """Resposta do trigger manual."""

    status: str
    message: str
    receitas_processed: int = 0
    despesas_processed: int = 0
    errors: List[str] = []


class ScrapingLogResponse(BaseModel):
    """Log de execução do scraping."""

    id: int
    data_type: str  # "receita" or "despesa"
    year: int
    status: str  # "SUCCESS", "ERROR", "PARTIAL"
    records_processed: int
    records_inserted: int
    records_updated: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ScrapingHistoryResponse(BaseModel):
    """Histórico de execuções do scraping."""

    logs: List[ScrapingLogResponse]
    total: int


# --- Schemas de Movimento Extra Orçamentário ---


class MovimentoExtraItem(BaseModel):
    """Item de movimento extra orçamentário."""

    codigo: int = Field(..., description="Código do movimento")
    ent_codigo: int = Field(..., description="Código da entidade")
    descricao: str = Field(..., description="Descrição do movimento")
    fornecedor: str = Field(..., description="Nome do fornecedor")
    tipo: Literal["R", "D"] = Field(
        ..., description="Tipo: R=Receita, D=Despesa"
    )
    valor_recebido: float = Field(
        ..., description="Valor recebido/pago"
    )
    mes: int = Field(..., description="Mês de referência")


class FundoResumo(BaseModel):
    """Resumo agrupado por fundo municipal."""

    fundo: str = Field(..., description="Sigla do fundo (ex: FUNDEB)")
    descricao_completa: str = Field(
        ..., description="Nome completo do fundo"
    )
    total_receitas: float = Field(
        ..., description="Total de receitas do fundo"
    )
    total_despesas: float = Field(
        ..., description="Total de despesas do fundo"
    )
    quantidade_itens: int = Field(
        ..., description="Quantidade de itens no fundo"
    )


class MovimentoExtraResponse(BaseModel):
    """Resposta consolidada do movimento extra orçamentário."""

    items: list[MovimentoExtraItem] = Field(
        ..., description="Lista de itens do movimento"
    )
    total_receitas: float = Field(
        ..., description="Soma de valor_recebido para tipo=R"
    )
    total_despesas: float = Field(
        ..., description="Soma de valor_recebido para tipo=D"
    )
    saldo: float = Field(
        ..., description="Saldo (total_receitas - total_despesas)"
    )
    quantidade: int = Field(
        ..., description="Total de itens retornados"
    )
    fundos_resumo: list[FundoResumo] = Field(
        ..., description="Resumo agrupado por fundo municipal"
    )
    insights_receitas: list["InsightItem"] = Field(
        default_factory=list,
        description="Top categorias de receitas",
    )
    insights_despesas: list["InsightItem"] = Field(
        default_factory=list,
        description="Top categorias de despesas",
    )


class InsightItem(BaseModel):
    """Item de insight agregado por categoria de descrição."""

    categoria: str = Field(
        ..., description="Nome da categoria (ex: 'Total INSS', 'Total IRRF')"
    )
    valor: float = Field(
        ..., description="Soma dos valores da categoria"
    )
    percentual: float = Field(
        ..., description="Percentual em relação ao total do tipo (R ou D)"
    )
    quantidade: int = Field(
        ..., description="Quantidade de itens nesta categoria"
    )
    descricao: str = Field(
        ..., description="Explicação da categoria para o cidadão"
    )


class ResumoMensalItem(BaseModel):
    """Totais de um mês específico."""

    mes: int = Field(..., description="Mês (1-12)")
    total_receitas: float = Field(..., description="Total receitas do mês")
    total_despesas: float = Field(..., description="Total despesas do mês")
    saldo: float = Field(..., description="Saldo do mês")


class MovimentoExtraAnualResponse(BaseModel):
    """Resposta consolidada anual do movimento extra orçamentário."""

    ano: int = Field(..., description="Ano de referência")
    total_receitas: float = Field(..., description="Total de receitas do ano")
    total_despesas: float = Field(..., description="Total de despesas do ano")
    saldo: float = Field(..., description="Saldo anual")
    quantidade_total: int = Field(..., description="Total de itens no ano")
    insights_receitas: list[InsightItem] = Field(
        ..., description="Top categorias de receitas (máx 6)"
    )
    insights_despesas: list[InsightItem] = Field(
        ..., description="Top categorias de despesas (máx 6)"
    )
    evolucao_mensal: list[ResumoMensalItem] = Field(
        ..., description="Evolução mês a mês"
    )


# --- Licitações ComprasBR ---


class LicitacaoComprasBRItem(BaseModel):
    """Item de licitação retornado pela API ComprasBR."""

    id: int
    numeroEdital: str
    objeto: str
    status: str
    modalidade: str
    orgaoNome: str
    dataAbertura: str


class LicitacaoComprasBRResponse(BaseModel):
    """Resposta paginada da API ComprasBR."""

    items: list[LicitacaoComprasBRItem]
    totalPages: int
    totalElements: int
    page: int
    size: int


# --- Dispensas de Licitação (Quality) ---


class DispensaLicitaçãoItem(BaseModel):
    """Item de dispensa de licitação extraído do portal Quality."""

    codigo: str
    processo: str
    disputa: str
    criterio: str
    tipo: str
    dataAbertura: str
    dataJulgamento: str
    status: str
    objeto: str


class DispensasLicitacaoResponse(BaseModel):
    """Resposta com lista de dispensas de licitação."""

    items: list[DispensaLicitaçãoItem]
    quantidade: int
