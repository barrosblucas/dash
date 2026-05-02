"""
Dados mockados de fallback para legislações municipais (parte 1).
"""

from __future__ import annotations

from backend.features.legislacao.legislacao_types import (
    StatusLegislacao,
    TipoLegislacao,
)

_MOCK_LEGISLACOES_PART1: list[dict[str, object]] = [
    {
        "id": "lei-001-2018",
        "tipo": TipoLegislacao.LEI,
        "numero": "001",
        "ano": 2018,
        "ementa": (
            "Dispõe sobre o Código Tributário do Município de Bandeirantes, "
            "estabelecendo normas gerais de direito tributário aplicáveis aos"
            " tributos sob jurisdição municipal e dá outras providências."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "conforme previsto na Lei Orgânica do Município, faz saber que a Câmara "
            "Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "TÍTULO I – DISPOSIÇÕES PRELIMINARES\n\n"
            "Art. 1º – Esta lei estabelece o Código Tributário do Município de "
            "Bandeirantes, disciplinando a instituição, a cobrança e a fiscalização "
            "dos tributos municipais, bem como os direitos e obrigações dos contribuintes.\n\n"
            "Art. 2º – O Município poderá instituir os seguintes tributos: Imposto Predial "
            "e Territorial Urbano (IPTU), Imposto sobre Transmissão de Bens Imóveis (ITBI), "
            "Taxas pelo exercício do poder de polícia ou pelo uso de serviços públicos, "
            "e contribuições de melhoria.\n\n"
            "Art. 3º – São sujeitos passivos dos tributos municipais as pessoas físicas e "
            "jurídicas, de direito público ou privado, que possuam relação jurídica ativa "
            "ou passiva com o Município na esfera tributária.\n\n"
            "TÍTULO II – DO CRÉDITO TRIBUTÁRIO\n\n"
            "Art. 4º – O crédito tributário é constituído pela inscrição do lançamento "
            "no cadastro da Secretaria Municipal de Finanças, sendo exigível após o "
            "decursão do prazo de pagamento fixado nesta lei.\n\n"
            "Art. 5º – Prescreve em cinco anos o direito do Município de constituir o "
            "crédito tributário, contados do primeiro dia do exercício seguinte aquele em "
            "que o lançamento poderia ter sido efetuado.\n\n"
            "Art. 6º – Constituem garantias do crédito tributário: a hipoteca legal, "
            "os privilégios creditórios e a ação fiscal, nos termos da legislação federal "
            "e deste Código.\n\n"
            "TÍTULO III – DISPOSIÇÕES FINAIS\n\n"
            "Art. 7º – Esta lei entra em vigor na data de sua publicação, revogadas as "
            "disposições em contrário.\n\n"
            "Bandeirantes, 15 de janeiro de 2018.\n\n"
            "PREFEITO MUNICIPAL\n"
            "JOÃO CARLOS SILVA"
        ),
        "data_publicacao": "2018-01-15",
        "data_promulgacao": "2018-01-15",
        "data_vigencia_inicio": "2018-02-01",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeito João Carlos Silva",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-001-2018.pdf",
    },
    {
        "id": "decreto-045-2019",
        "tipo": TipoLegislacao.DECRETO,
        "numero": "045",
        "ano": 2019,
        "ementa": (
            "Regulamenta a Lei nº 001/2018, dispondo sobre o procedimento de "
            "arrecadação e fiscalização do IPTU no Município de Bandeirantes."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "DECRETO Nº 045, DE 10 DE MARÇO DE 2019\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso das atribuições que lhe são "
            "conferidas pelo art. 59 da Lei Orgânica do Município e pelo art. 7º da Lei "
            "nº 001/2018, decreta:\n\n"
            "Art. 1º – Fica regulamentado o procedimento de arrecadação e fiscalização "
            "do Imposto Predial e Territorial Urbano (IPTU) no âmbito do Município de "
            "Bandeirantes, nos termos do presente decreto.\n\n"
            "Art. 2º – O lançamento do IPTU será efetuado anualmente pela Secretaria "
            "Municipal de Finanças, com base no cadastro imobiliário atualizado, observados "
            "os valores de venal de referência definidos em portaria.\n\n"
            "Art. 3º – Os imóveis situados na zona urbana do Município estão sujeitos ao "
            "IPTU, exceto aqueles expressamente isentos por força de lei federal ou municipal.\n\n"
            "Art. 4º – O contribuinte poderá pagar o IPTU à vista, com desconto de até 10% "
            "(dez por cento), ou parcelado em até 10 (dez) parcelas mensais, sem acréscimo "
            "de juros para pagamento dentro do prazo.\n\n"
            "Art. 5º – A inadimplência do IPTU sujeita o contribuinte à inscrição em dívida "
            "ativa, com aplicação de multa de 2% (dois por cento) e juros de mora de 1% (um "
            "por cento) ao mês, além da possibilidade de protesto e execução fiscal.\n\n"
            "Art. 6º – Fica instituída a Comissão de Fiscalização Tributária, vinculada à "
            "Secretaria Municipal de Finanças, responsável por inspeções, notificações e "
            "apuração de irregularidades no cadastro imobiliário.\n\n"
            "Art. 7º – Este decreto entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 10 de março de 2019.\n\n"
            "PREFEITO MUNICIPAL\n"
            "JOÃO CARLOS SILVA"
        ),
        "data_publicacao": "2019-03-10",
        "data_promulgacao": "2019-03-10",
        "data_vigencia_inicio": "2019-03-11",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": "Prefeito João Carlos Silva",
        "origem": "Poder Executivo",
        "legislacao_vinculada": ["lei-001-2018"],
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/decreto-045-2019.pdf",
    },
    {
        "id": "lei-120-2020",
        "tipo": TipoLegislacao.LEI,
        "numero": "120",
        "ano": 2020,
        "ementa": (
            "Institui o Plano Municipal de Saneamento Básico de Bandeirantes-MS, "
            "definindo diretrizes, metas e estratégias para o abastecimento de água, "
            "esgotamento sanitário, limpeza urbana e manejo de resíduos sólidos."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI Nº 120, DE 20 DE JUNHO DE 2020\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "Art. 1º – Fica instituído o Plano Municipal de Saneamento Básico (PMSB) do "
            "Município de Bandeirantes, Estado de Mato Grosso do Sul, como instrumento de "
            "planejamento e gestão dos serviços públicos de saneamento básico.\n\n"
            "Art. 2º – O PMSB tem por objetivo garantir o acesso universal e adequado aos "
            "serviços de saneamento básico, promovendo a saúde pública, a proteção ambiental "
            "e o desenvolvimento socioeconômico sustentável do Município.\n\n"
            "Art. 3º – O PMSB abrange as seguintes modalidades de saneamento básico: "
            "abastecimento de água, esgotamento sanitário, limpeza urbana e manejo de resíduos "
            "sólidos, e drenagem e manejo das águas pluviais urbanas.\n\n"
            "Art. 4º – São diretrizes do PMSB: a universalização do acesso aos serviços de "
            "saneamento básico; a integração entre as modalidades de saneamento; a sustentabilidade "
            "econômica, social e ambiental; e a participação da sociedade no planejamento e no "
            "controle social.\n\n"
            "Art. 5º – O PMSB estabelece metas de cobertura para o abastecimento de água e "
            "esgotamento sanitário, a serem alcançadas no prazo de 10 (dez) anos, contados da "
            "vigência desta lei, observando os parâmetros do Plano Nacional de Saneamento Básico.\n\n"
            "Art. 6º – A implementação do PMSB será financiada por recursos próprios do "
            "Município, transferências federais e estaduais, e parcerias público-privadas, "
            "nos termos da legislação vigente.\n\n"
            "Art. 7º – Fica criado o Conselho Municipal de Saneamento Básico, órgão colegiado "
            "de caráter deliberativo e fiscalizador, vinculado à Secretaria Municipal de Obras e "
            "Serviços Públicos.\n\n"
            "Art. 8º – Esta lei entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 20 de junho de 2020.\n\n"
            "PREFEITO MUNICIPAL\n"
            "MARIA APARECIDA FERREIRA"
        ),
        "data_publicacao": "2020-06-20",
        "data_promulgacao": "2020-06-20",
        "data_vigencia_inicio": "2020-07-01",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeita Maria Aparecida Ferreira",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-120-2020.pdf",
    },
    {
        "id": "portaria-012-2021",
        "tipo": TipoLegislacao.PORTARIA,
        "numero": "012",
        "ano": 2021,
        "ementa": (
            "Designa os membros da Comissão Permanente de Licitações do Município de "
            "Bandeirantes para o exercício de 2021."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "PORTARIA Nº 012, DE 05 DE JANEIRO DE 2021\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "conforme o disposto na Lei nº 8.666/1993 e suas alterações, resolve:\n\n"
            "Art. 1º – Ficam designados os seguintes servidores municipais para comporem a "
            "Comissão Permanente de Licitações do Município de Bandeirantes, no exercício de 2021:\n\n"
            "I – José Antônio Mendes, matrícula nº 1.234, Presidente;\n\n"
            "II – Ana Paula Ribeiro, matrícula nº 2.345, Membro;\n\n"
            "III – Carlos Eduardo Souza, matrícula nº 3.456, Membro.\n\n"
            "Art. 2º – A Comissão Permanente de Licitações terá como atribuições conduzir "
            "os processos licitatórios do Município, elaborar editais, receber propostas, "
            "abrir envelopes, julgar habilitação e classificação, e emitir pareceres finais, "
            "sempre observando os princípios da legalidade, impessoalidade, moralidade, "
            "igualdade e publicidade.\n\n"
            "Art. 3º – Os membros da Comissão deverão prestar compromisso de atuação ética "
            "e imparcial nos processos licitatórios, sob pena de responsabilidade administrativa, "
            "civil e penal.\n\n"
            "Art. 4º – Esta portaria entra em vigor na data de sua publicação, revogadas as "
            "disposições em contrário.\n\n"
            "Bandeirantes, 05 de janeiro de 2021.\n\n"
            "PREFEITO MUNICIPAL\n"
            "MARIA APARECIDA FERREIRA"
        ),
        "data_publicacao": "2021-01-05",
        "data_promulgacao": None,
        "data_vigencia_inicio": None,
        "data_vigencia_fim": None,
        "status": StatusLegislacao.REVOGADA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": None,
        "origem": "Poder Executivo",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/portaria-012-2021.pdf",
    },
    {
        "id": "lei-210-2021",
        "tipo": TipoLegislacao.LEI,
        "numero": "210",
        "ano": 2021,
        "ementa": (
            "Altera a Lei nº 001/2018, dispondo sobre a atualização dos valores de "
            "referência para cálculo do IPTU e redefinindo alíquotas progressivas para "
            "imóveis de maior valor venal."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI Nº 210, DE 15 DE SETEMBRO DE 2021\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "Art. 1º – Ficam alterados os arts. 2º, 4º e 5º da Lei nº 001/2018, que "
            "instituiu o Código Tributário do Município, para atualizar os valores de "
            "referência para cálculo do Imposto Predial e Territorial Urbano (IPTU).\n\n"
            "Art. 2º – O valor venal de referência dos imóveis urbanos será reavaliado "
            "anualmente pelo Comitê de Avaliação Imobiliária, com base em pesquisa de "
            "mercado e critérios técnicos de engenharia de avaliações.\n\n"
            "Art. 3º – Ficam instituídas alíquotas progressivas para imóveis com valor venal "
            "superior a R$ 500.000,00 (quinhentos mil reais), conforme a seguinte tabela:\n\n"
            "I – faixa de R$ 500.000,01 a R$ 1.000.000,00: alíquota de 1,2%;\n\n"
            "II – faixa de R$ 1.000.000,01 a R$ 2.000.000,00: alíquota de 1,5%;\n\n"
            "III – faixa acima de R$ 2.000.000,00: alíquota de 1,8%.\n\n"
            "Art. 4º – O contribuinte poderá recorrer da avaliação imobiliária perante a "
            "Junta de Recursos Tributários, no prazo de 30 (trinta) dias contados da data "
            "do lançamento.\n\n"
            "Art. 5º – Esta lei entra em vigor no exercício financeiro de 2022, revogadas "
            "as disposições em contrário.\n\n"
            "Bandeirantes, 15 de setembro de 2021.\n\n"
            "PREFEITO MUNICIPAL\n"
            "MARIA APARECIDA FERREIRA"
        ),
        "data_publicacao": "2021-09-15",
        "data_promulgacao": "2021-09-15",
        "data_vigencia_inicio": "2022-01-01",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ALTERADA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeita Maria Aparecida Ferreira",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": ["lei-001-2018"],
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-210-2021.pdf",
    },
    {
        "id": "decreto-089-2022",
        "tipo": TipoLegislacao.DECRETO,
        "numero": "089",
        "ano": 2022,
        "ementa": (
            "Declara situação de emergência em saúde pública no Município de Bandeirantes "
            "face ao surto de dengue registrado nos meses de janeiro e fevereiro de 2022."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "DECRETO Nº 089, DE 18 DE FEVEREIRO DE 2022\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso das atribuições que lhe são "
            "conferidas pelo art. 59 da Lei Orgânica do Município e pelo art. 6º da Lei "
            "Complementar Federal nº 141/2012, considerando o elevado número de casos de "
            "dengue registrados no Município, decreta:\n\n"
            "Art. 1º – Fica declarada situação de emergência em saúde pública no Município "
            "de Bandeirantes, em razão do surto de dengue, nos termos deste decreto.\n\n"
            "Art. 2º – A situação de emergência terá vigência pelo prazo de 90 (noventa) "
            "dias, podendo ser prorrogada por igual período, mediante decreto específico, "
            "caso persistam os fatores que a determinaram.\n\n"
            "Art. 3º – Durante o período de emergência, fica autorizada a realização de "
            "dispensa de licitação para aquisição de medicamentos, inseticidas, equipamentos "
            "de proteção individual e outros insumos necessários ao combate à dengue, nos "
            "termos do art. 24, inciso IV, da Lei nº 8.666/1993.\n\n"
            "Art. 4º – A Secretaria Municipal de Saúde deverá intensificar as ações de "
            "nebulização, eliminação de criadouros do mosquito Aedes aegypti e campanhas de "
            "conscientização da população, mobilizando recursos humanos e materiais adicionais.\n\n"
            "Art. 5º – O Município poderá solicitar apoio técnico e financeiro do Governo "
            "Estadual e Federal para enfrentamento da emergência declarada neste decreto.\n\n"
            "Art. 6º – Este decreto entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 18 de fevereiro de 2022.\n\n"
            "PREFEITO MUNICIPAL\n"
            "ROBERTO ALMEIDA"
        ),
        "data_publicacao": "2022-02-18",
        "data_promulgacao": "2022-02-18",
        "data_vigencia_inicio": "2022-02-18",
        "data_vigencia_fim": "2022-05-18",
        "status": StatusLegislacao.REVOGADA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": "Prefeito Roberto Almeida",
        "origem": "Poder Executivo",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/decreto-089-2022.pdf",
    },
    {
        "id": "resolucao-003-2022",
        "tipo": TipoLegislacao.RESOLUCAO,
        "numero": "003",
        "ano": 2022,
        "ementa": (
            "Aprova o Regimento Interno da Câmara Municipal de Bandeirantes e dá "
            "outras providências."
        ),
        "texto_integral": (
            "CÂMARA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "RESOLUÇÃO Nº 003, DE 01 DE MARÇO DE 2022\n\n"
            "O PRESIDENTE DA CÂMARA MUNICIPAL DE BANDEIRANTES, no exercício de suas "
            "atribuições regimentais, faz saber que o Plenário aprovou a seguinte resolução:\n\n"
            "Art. 1º – Fica aprovado o Regimento Interno da Câmara Municipal de "
            "Bandeirantes, na forma do anexo único desta resolução.\n\n"
            "Art. 2º – O Regimento Interno disciplina a organização e o funcionamento da "
            "Câmara Municipal, compreendendo: a composição e as atribuições da Mesa Diretora; "
            "o regime das sessões legislativas ordinárias e extraordinárias; o processo legislativo; "
            "as comissões permanentes e temporárias; e o controle interno.\n\n"
            "Art. 3º – A Mesa Diretora da Câmara Municipal será composta por Presidente, "
            "Vice-Presidente e 1º, 2º e 3º Secretários, eleitos em sessão preparatória para "
            "cada legislatura, nos termos da Lei Orgânica do Município.\n\n"
            "Art. 4º – As comissões permanentes da Câmara Municipal são: Comissão de "
            "Constituição, Justiça e Redação; Comissão de Finanças e Orçamento; Comissão de "
            "Obras e Serviços Públicos; Comissão de Educação, Saúde e Assistência Social; e "
            "Comissão de Agricultura, Pecuária e Meio Ambiente.\n\n"
            "Art. 5º – O processo legislativo compreende as fases de iniciativa, discussão, "
            "votação, sanção e promulgação das leis, observando-se os prazos e quóruns previstos "
            "na Lei Orgânica e no Regimento Interno.\n\n"
            "Art. 6º – Esta resolução entra em vigor na data de sua publicação, revogando o "
            "Regimento Interno anterior.\n\n"
            "Bandeirantes, 01 de março de 2022.\n\n"
            "PRESIDENTE DA CÂMARA MUNICIPAL\n"
            "VEREADOR ANTÔNIO CARLOS LIMA"
        ),
        "data_publicacao": "2022-03-01",
        "data_promulgacao": None,
        "data_vigencia_inicio": "2022-03-01",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": None,
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/resolucao-003-2022.pdf",
    },
]
