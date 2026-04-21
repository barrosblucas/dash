"""Testes unitários para o módulo de licitações."""

from __future__ import annotations

from backend.api.routes.licitacoes import _parse_dispensas_from_html

HTML_VAZIO = """
<html>
  <body>
    <table>
      <tbody></tbody>
    </table>
  </body>
</html>
"""

HTML_SEM_TBODY = """
<html>
  <body>
    <table>
      <tr><td>sem tbody</td></tr>
    </table>
  </body>
</html>
"""

HTML_UMA_LICITACAO = """
<html>
  <body>
    <table>
      <tbody>
        <tr class="modelo-Dispensa">
          <td>123</td>
          <td>Proc-001</td>
          <td>Pregão Eletrônico</td>
          <td>Aberto</td>
          <td>Menor preço</td>
          <td>Obras</td>
          <td>10/01/2024</td>
          <td>15/01/2024</td>
          <td>Publicado</td>
          <td>login-text</td>
        </tr>
        <tr></tr>
        <tr class="modelo-Dispensa"></tr>
        <tr class="modelo-Dispensa">
          <td>Objeto: Construção de escola municipal</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
"""

HTML_MULTIPLAS_LICITACOES = """
<html>
  <body>
    <table>
      <tbody>
        <tr class="modelo-Dispensa">
          <td>100</td>
          <td>Proc-A</td>
          <td>Dispensa</td>
          <td>Fechado</td>
          <td>Menor preço</td>
          <td>Serviços</td>
          <td>01/02/2024</td>
          <td>05/02/2024</td>
          <td>Encerrado</td>
          <td>login-text</td>
        </tr>
        <tr></tr>
        <tr class="modelo-Dispensa"></tr>
        <tr class="modelo-Dispensa">
          <td>Objeto: Limpeza pública</td>
        </tr>
        <tr class="modelo-TomadaPreco">
          <td>200</td>
          <td>Proc-B</td>
          <td>Tomada de Preço</td>
          <td>Aberto</td>
          <td>Maior retorno</td>
          <td>Obras</td>
          <td>10/03/2024</td>
          <td>12/03/2024</td>
          <td>Publicado</td>
          <td>login-text</td>
        </tr>
        <tr></tr>
        <tr class="modelo-TomadaPreco"></tr>
        <tr class="modelo-TomadaPreco">
          <td>Objeto: Pavimentação asfáltica</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
"""

HTML_OBJETO_NAO_ENCONTRADO = """
<html>
  <body>
    <table>
      <tbody>
        <tr class="modelo-Dispensa">
          <td>300</td>
          <td>Proc-C</td>
          <td>Concorrência</td>
          <td>Aberto</td>
          <td>Técnica e preço</td>
          <td>Serviços</td>
          <td>20/04/2024</td>
          <td>25/04/2024</td>
          <td>Publicado</td>
          <td>login-text</td>
        </tr>
        <tr></tr>
        <tr class="modelo-Dispensa"></tr>
      </tbody>
    </table>
  </body>
</html>
"""


class TestParseDispensasFromHtml:
    """Testes para o parser de HTML do portal Quality."""

    def test_html_vazio_retorna_lista_vazia(self) -> None:
        result = _parse_dispensas_from_html(HTML_VAZIO)
        assert result == []

    def test_html_sem_tbody_retorna_lista_vazia(self) -> None:
        result = _parse_dispensas_from_html(HTML_SEM_TBODY)
        assert result == []

    def test_uma_licitacao_extrai_todos_os_campos(self) -> None:
        result = _parse_dispensas_from_html(HTML_UMA_LICITACAO)
        assert len(result) == 1
        item = result[0]
        assert item.codigo == "123"
        assert item.processo == "Proc-001"
        assert item.modalidade == "Pregão Eletrônico"
        assert item.disputa == "Aberto"
        assert item.criterio == "Menor preço"
        assert item.tipo == "Obras"
        assert item.dataAbertura == "10/01/2024"
        assert item.dataJulgamento == "15/01/2024"
        assert item.status == "Publicado"
        assert item.objeto == "Objeto: Construção de escola municipal"
        assert item.urlProcesso == (
            "https://avisolicitacao.qualitysistemas.com.br"
            "/prefeitura_municipal_de_bandeirantes/123"
        )

    def test_multiplas_licitacoes_extraidas(self) -> None:
        result = _parse_dispensas_from_html(HTML_MULTIPLAS_LICITACOES)
        assert len(result) == 2

        first = result[0]
        assert first.codigo == "100"
        assert first.modalidade == "Dispensa"
        assert first.objeto == "Objeto: Limpeza pública"

        second = result[1]
        assert second.codigo == "200"
        assert second.modalidade == "Tomada de Preço"
        assert second.objeto == "Objeto: Pavimentação asfáltica"

    def test_objeto_nao_encontrado_deixa_campo_vazio(self) -> None:
        result = _parse_dispensas_from_html(HTML_OBJETO_NAO_ENCONTRADO)
        assert len(result) == 1
        assert result[0].objeto == ""
        assert result[0].modalidade == "Concorrência"
