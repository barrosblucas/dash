"""
Script para (re)extrair o detalhamento hierárquico de todos os PDFs de receitas.

Uso: python -m backend.scripts.reload_detalhamento
"""

import logging
import sys
from pathlib import Path

# Adicionar raiz ao path para imports do backend
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import delete

from backend.shared.database.connection import DatabaseManager
from backend.shared.database.models import Base, ReceitaDetalhamentoModel
from backend.shared.pdf_extractor import PDFExtractor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    """Extrai detalhamento de todos os PDFs e carrega no banco."""
    dados_dir = Path(__file__).parent.parent.parent
    extractor = PDFExtractor(dados_dir)

    db_manager = DatabaseManager()

    with db_manager.get_session() as session:
        try:
            anos = sorted([int(p.stem) for p in (dados_dir / "receitas").glob("*.pdf")])

            total_registros = 0

            for ano in anos:
                arquivo = dados_dir / "receitas" / f"{ano}.pdf"
                if not arquivo.exists():
                    continue

                # Limpar dados existentes do ano
                session.execute(
                    delete(ReceitaDetalhamentoModel).where(
                        ReceitaDetalhamentoModel.ano == ano
                    )
                )
                session.flush()

                # Extrair detalhamento
                detalhamentos = extractor.extrair_detalhamento_pdf(arquivo)

                # Inserir novos dados
                for det in detalhamentos:
                    model = ReceitaDetalhamentoModel(
                        ano=det.ano,
                        detalhamento=det.detalhamento,
                        nivel=det.nivel,
                        ordem=det.ordem,
                        tipo=det.tipo,
                        valor_previsto=det.valor_previsto,
                        valor_arrecadado=det.valor_arrecadado,
                        valor_anulado=det.valor_anulado,
                        fonte=det.fonte,
                    )
                    session.add(model)

                session.flush()
                total_registros += len(detalhamentos)
                logger.info("Ano %d: %d itens extraídos", ano, len(detalhamentos))

            logger.info("Total: %d itens de detalhamento carregados", total_registros)
        except Exception:
            logger.exception("Erro durante extração de detalhamento")
            raise


if __name__ == "__main__":
    # Garantir que a tabela existe
    db_mgr = DatabaseManager()
    Base.metadata.create_all(db_mgr.engine)
    main()
