#!/usr/bin/env python3
"""
Script simplificado para inicializar o banco e popular com dados essenciais.

Este script popula apenas as despesas mensais (que estão funcionando).
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.shared.database.connection import db_manager, init_database
from backend.shared.database.models import DespesaModel
from backend.shared.pdf_extractor import PDFExtractor


def main() -> None:
    """Popula o banco com dados de despesas."""
    print("=" * 60)
    print("Dashboard Financeiro Municipal - Populando Banco")
    print("=" * 60)

    # Inicializa banco
    print("\n1. Inicializando banco de dados...")
    init_database()

    # Extrai dados
    print("\n2. Extraindo dados dos PDFs...")
    dados_dir = Path(__file__).resolve().parent.parent
    extractor = PDFExtractor(dados_dir)

    # Extrai despesas (2016-2026)
    print("   Extraindo despesas...")
    resultado_despesas = extractor.extract_despesas(anos=list(range(2016, 2027)))

    print(f"   Despesas extraídas: {resultado_despesas.registros_processados}")

    # Salva no banco
    print("\n3. Salvando no banco de dados...")
    with db_manager.get_session() as session:
        despesas_salvas = 0
        for despesa in resultado_despesas.despesas:
            try:
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
                print(f"   Erro: {e}")
                continue

        session.commit()
        print(f"   {despesas_salvas} despesas salvas!")

    # Estatísticas
    print("\n4. Estatísticas:")
    stats = db_manager.get_db_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")

    print("\n✅ Concluído!")
    print("\nPara iniciar a API:")
    print("   cd backend && ../venv/bin/uvicorn backend.api.main:app --reload")


if __name__ == "__main__":
    main()
