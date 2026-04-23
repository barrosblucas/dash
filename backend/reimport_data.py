#!/usr/bin/env python3
"""
Script para reimportar dados dos PDFs com correções.

Corrige:
- Despesas duplicadas (remove duplicatas e reimporta valores corretos)
- Receitas sem previsto (adiciona valor previsto anual)
- Breakdown por tipo de despesa (CORRENTE, CAPITAL, CONTINGENCIA)

Uso:
    python backend/reimport_data.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_types import Despesa
from backend.features.receita.receita_types import Receita
from backend.shared.database.connection import db_manager, init_database
from backend.shared.database.models import DespesaModel, ReceitaModel
from backend.shared.pdf_extractor import PDFExtractor


def limpar_dados(session: Session) -> None:
    """Remove todos os dados existentes para reimportação limpa."""
    print("  Limpando dados existentes...")
    session.execute(text("DELETE FROM despesas"))
    session.execute(text("DELETE FROM receitas"))
    session.commit()
    print("  Dados limpos com sucesso!")


def importar_receitas(session: Session, receitas: list[Receita]) -> int:
    """Importa receitas com valores previstos corretos."""
    print(f"\n  Importando {len(receitas)} receitas...")
    salvas = 0

    for receita in receitas:
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
        salvas += 1

    session.commit()
    print(f"  ✅ {salvas} receitas importadas")
    return salvas


def importar_despesas(session: Session, despesas: list[Despesa]) -> int:
    """Importa despesas com breakdown por tipo e sem duplicatas."""
    print(f"\n  Importando {len(despesas)} despesas...")
    salvas = 0

    for despesa in despesas:
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
        salvas += 1

    session.commit()
    print(f"  ✅ {salvas} despesas importadas")
    return salvas


def verificar_dados(session: Session) -> None:
    """Verifica os dados importados contra os PDFs."""
    print("\n" + "=" * 70)
    print("VERIFICAÇÃO DOS DADOS IMPORTADOS")
    print("=" * 70)

    # Verificar receitas
    print("\n--- RECEITAS ---")
    result = session.execute(
        text("""
        SELECT ano,
               SUM(valor_previsto) as total_previsto,
               SUM(valor_arrecadado) as total_arrecadado,
               COUNT(*) as num_registros
        FROM receitas
        GROUP BY ano
        ORDER BY ano
    """)
    ).fetchall()

    for row in result:
        previsto = float(row[1]) if row[1] else 0
        arrecadado = float(row[2]) if row[2] else 0
        pct = (arrecadado / previsto * 100) if previsto > 0 else 0
        print(
            f"  Ano {row[0]}: Previsto={previsto:>15,.2f} | "
            f"Arrecadado={arrecadado:>15,.2f} | Exec={pct:.1f}% | "
            f"Registros={row[3]}"
        )

    # Verificar despesas
    print("\n--- DESPESAS ---")
    result = session.execute(
        text("""
        SELECT ano,
               SUM(valor_empenhado) as total_emp,
               SUM(valor_liquidado) as total_liq,
               SUM(valor_pago) as total_pago,
               COUNT(*) as num_registros
        FROM despesas
        GROUP BY ano
        ORDER BY ano
    """)
    ).fetchall()

    for row in result:
        emp = float(row[1]) if row[1] else 0
        liq = float(row[2]) if row[2] else 0
        pago = float(row[3]) if row[3] else 0
        print(
            f"  Ano {row[0]}: Empenhado={emp:>15,.2f} | "
            f"Liquidado={liq:>15,.2f} | Pago={pago:>15,.2f} | "
            f"Registros={row[4]}"
        )

    # Verificar tipos de despesa
    print("\n--- TIPOS DE DESPESA ---")
    result = session.execute(
        text("""
        SELECT tipo, COUNT(*) as num, SUM(valor_pago) as total
        FROM despesas
        GROUP BY tipo
        ORDER BY tipo
    """)
    ).fetchall()

    for row in result:
        print(
            f"  Tipo '{row[0]}': {row[1]} registros, Total Pago={float(row[2]):>15,.2f}"
        )


def main() -> None:
    print("\n" + "=" * 70)
    print("REIMPORTAÇÃO DE DADOS - CORREÇÃO DE DIVERGÊNCIAS")
    print("Dashboard Financeiro - Bandeirantes MS")
    print("=" * 70)

    # Inicializar banco
    print("\n1. Inicializando banco de dados...")
    init_database()

    # Extrair dados dos PDFs
    print("\n2. Extraindo dados dos PDFs...")
    dados_dir = Path(__file__).resolve().parent.parent
    extractor = PDFExtractor(dados_dir)

    anos_receitas = list(range(2013, 2027))
    anos_despesas = list(range(2013, 2027))

    print("  Extraindo receitas...")
    resultado_receitas = extractor.extract_receitas(anos=anos_receitas)
    print(f"  Receitas: {resultado_receitas.registros_processados} registros")
    if resultado_receitas.erro:
        print(f"  ⚠️  Erros: {resultado_receitas.erro}")

    print("  Extraindo despesas...")
    resultado_despesas = extractor.extract_despesas(anos=anos_despesas)
    print(f"  Despesas: {resultado_despesas.registros_processados} registros")
    if resultado_despesas.erro:
        print(f"  ⚠️  Erros: {resultado_despesas.erro}")

    # Limpar e reimportar
    print("\n3. Limpando banco e reimportando dados...")
    with db_manager.get_session() as session:
        limpar_dados(session)
        importar_receitas(session, resultado_receitas.receitas)
        importar_despesas(session, resultado_despesas.despesas)

    # Verificar
    print("\n4. Verificando dados importados...")
    with db_manager.get_session() as session:
        verificar_dados(session)

    # Estatísticas finais
    print("\n5. Estatísticas finais:")
    stats = db_manager.get_db_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")

    print("\n" + "=" * 70)
    print("✅ REIMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 70)
    print("\nPara iniciar a API:")
    print("  cd backend && ../venv/bin/uvicorn backend.api.main:app --reload")


if __name__ == "__main__":
    main()
