#!/usr/bin/env python3
"""
Script para inicializar o banco de dados e popular com dados dos PDFs.

Uso:
    python backend/init_db.py
"""

import sys
from pathlib import Path

# Adiciona o diretório raiz ao path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))



from backend.shared.database.connection import db_manager, init_database
from backend.shared.database.models import (
    DespesaModel,
    ReceitaModel,
)
from backend.shared.pdf_extractor import PDFExtractor


def popular_banco_dados():
    """Extrai dados dos PDFs e popula o banco de dados."""
    print("=" * 60)
    print("Iniciando extração de dados dos PDFs")
    print("=" * 60)

    # Diretório dos dados
    dados_dir = Path(__file__).resolve().parent.parent

    # Cria o extrator
    extractor = PDFExtractor(dados_dir)

    # Extrai dados de receitas e despesas
    print("\n Extraindo receitas...")
    resultado_receitas = extractor.extract_receitas(anos=list(range(2016, 2027)))

    print("\n Extraindo despesas...")
    resultado_despesas = extractor.extract_despesas(anos=list(range(2016, 2027)))

    # Exibe resumo da extração
    print("\n" + "=" * 60)
    print("Resumo da Extração")
    print("=" * 60)
    print(f"Receitas: {resultado_receitas.registros_processados} registros")
    print(f"Despesas: {resultado_despesas.registros_processados} registros")

    if resultado_receitas.erro:
        print(f"\nErros em receitas: {resultado_receitas.erro}")

    if resultado_despesas.erro:
        print(f"\nErros em despesas: {resultado_despesas.erro}")

    # Salva no banco de dados
    print("\n" + "=" * 60)
    print("Salvando no banco de dados")
    print("=" * 60)

    with db_manager.get_session() as session:
        # Salva receitas
        print(f"\n Salvando {len(resultado_receitas.receitas)} receitas...")
        receitas_salvas = 0
        for receita in resultado_receitas.receitas:
            try:
                # Verifica se já existe
                existing = (
                    session.query(ReceitaModel)
                    .filter(
                        ReceitaModel.ano == receita.ano,
                        ReceitaModel.mes == receita.mes,
                        ReceitaModel.categoria == receita.categoria,
                    )
                    .first()
                )

                if existing:
                    # Atualiza existente
                    existing.valor_previsto = receita.valor_previsto
                    existing.valor_arrecadado = receita.valor_arrecadado
                    existing.valor_anulado = receita.valor_anulado
                    existing.subcategoria = receita.subcategoria
                    existing.tipo = receita.tipo.value
                    existing.fonte = receita.fonte
                else:
                    # Cria novo
                    model = ReceitaModel(
                        ano=receita.ano,
                        mes=receita.mes,
                        categoria=receita.categoria,
                        subcategoria=receita.subcategoria,
                        tipo=receita.tipo.value,
                        valor_previsto=receita.valor_previsto,
                        valor_arrecadado=receita.valor_arrecadado,
                        valor_anulado=receita.valor_anulado,
                        fonte=receita.fonte,
                    )
                    session.add(model)
                    receitas_salvas += 1
            except Exception as e:
                print(f"  Erro ao salvar receita: {e}")
                session.rollback()
                continue

        session.commit()
        print(f"   {receitas_salvas} receitas salvas com sucesso!")

        # Salva despesas
        print(f"\n Salvando {len(resultado_despesas.despesas)} despesas...")
        despesas_salvas = 0
        for despesa in resultado_despesas.despesas:
            try:
                # Verifica se já existe (para despesas sem categoria, usa ano+mes+tipo como único)
                query = session.query(DespesaModel).filter(
                    DespesaModel.ano == despesa.ano,
                    DespesaModel.mes == despesa.mes,
                    DespesaModel.tipo == despesa.tipo.value,
                )

                if despesa.categoria:
                    query = query.filter(DespesaModel.categoria == despesa.categoria)

                existing = query.first()

                if existing:
                    # Atualiza existente
                    existing.valor_empenhado = despesa.valor_empenhado
                    existing.valor_liquidado = despesa.valor_liquidado
                    existing.valor_pago = despesa.valor_pago
                    existing.categoria = despesa.categoria
                    existing.subcategoria = despesa.subcategoria
                    existing.fonte = despesa.fonte
                else:
                    # Cria novo
                    model = DespesaModel(
                        ano=despesa.ano,
                        mes=despesa.mes,
                        categoria=despesa.categoria,
                        subcategoria=despesa.subcategoria,
                        tipo=despesa.tipo.value,
                        valor_empenhado=despesa.valor_empenhado,
                        valor_liquidado=despesa.valor_liquidado,
                        valor_pago=despesa.valor_pago,
                        fonte=despesa.fonte,
                    )
                    session.add(model)
                    despesas_salvas += 1
            except Exception as e:
                print(f"  Erro ao salvar despesa: {e}")
                session.rollback()
                continue

        session.commit()
        print(f"   {despesas_salvas} despesas salvas com sucesso!")

    # Exibe estatísticas finais
    print("\n" + "=" * 60)
    print("Estatísticas do Banco de Dados")
    print("=" * 60)
    stats = db_manager.get_db_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")

    print("\n" + "=" * 60)
    print("Banco de dados população com sucesso!")
    print("=" * 60)


def main():
    """Função principal."""
    print("\n" + "=" * 60)
    print("Dashboard Financeiro Municipal - Inicialização")
    print("=" * 60)

    # Inicializa o banco de dados
    print("\n1. Inicializando banco de dados...")
    init_database()

    # Popula com os dados dos PDFs
    print("\n2. Populando banco de dados...")
    popular_banco_dados()

    print("\n✅ Processo concluído com sucesso!")
    print("\nPara iniciar a API, execute:")
    print("   cd backend && uvicorn api.main:app --reload")


if __name__ == "__main__":
    main()
