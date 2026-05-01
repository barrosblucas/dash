"""
Dados mockados de fallback para legislações municipais (parte 2).
"""
from __future__ import annotations

from backend.features.legislacao.legislacao_types import (
    StatusLegislacao,
    TipoLegislacao,
)

_MOCK_LEGISLACOES_PART2: list[dict[str, object]] = [
    {
        "id": "lei-305-2023",
        "tipo": TipoLegislacao.LEI,
        "numero": "305",
        "ano": 2023,
        "ementa": (
            "Dispõe sobre a criação do Fundo Municipal de Assistência Social de "
            "Bandeirantes e estabelece normas para sua gestão, execução e fiscalização."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI Nº 305, DE 10 DE ABRIL DE 2023\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "Art. 1º – Fica criado o Fundo Municipal de Assistência Social (FMAS) do "
            "Município de Bandeirantes, vinculado à Secretaria Municipal de Assistência Social, "
            "com natureza contábil especial e gestão descentralizada.\n\n"
            "Art. 2º – O FMAS tem por finalidade financiar as ações, programas, projetos e "
            "serviços da política de assistência social do Município, em conformidade com a Lei "
            "Orgânica da Assistência Social (LOAS) e o Sistema Único de Assistência Social (SUAS).\n\n"
            "Art. 3º – Constituem recursos do FMAS: dotações orçamentárias próprias; "
            "transferências do Fundo Nacional de Assistência Social (FNAS) e do Fundo Estadual "
            "de Assistência Social (FEAS); doações, legados e convênios; e outros recursos "
            "legalmente destinados à assistência social.\n\n"
            "Art. 4º – A gestão do FMAS será exercida pelo Conselho Municipal de Assistência "
            "Social, órgão colegiado de caráter deliberativo e normativo, e pela Secretaria "
            "Municipal de Assistência Social, como órgão gestor executivo.\n\n"
            "Art. 5º – O FMAS será movimentado por conta bancária específica, devendo os "
            "recursos ser aplicados exclusivamente nas finalidades previstas nesta lei, sob pena "
            "de responsabilidade civil e criminal dos gestores.\n\n"
            "Art. 6º – A prestação de contas do FMAS será realizada semestralmente pelo "
            "Conselho Municipal de Assistência Social, mediante publicação de relatório de gestão "
            "no Diário Oficial do Município.\n\n"
            "Art. 7º – Esta lei entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 10 de abril de 2023.\n\n"
            "PREFEITO MUNICIPAL\n"
            "ROBERTO ALMEIDA"
        ),
        "data_publicacao": "2023-04-10",
        "data_promulgacao": "2023-04-10",
        "data_vigencia_inicio": "2023-04-11",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeito Roberto Almeida",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-305-2023.pdf",
    },
    {
        "id": "decreto-112-2023",
        "tipo": TipoLegislacao.DECRETO,
        "numero": "112",
        "ano": 2023,
        "ementa": (
            "Nomeia o senhor Pedro Henrique Costa para o cargo de Secretário Municipal "
            "de Educação de Bandeirantes."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "DECRETO Nº 112, DE 01 DE JANEIRO DE 2023\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso das atribuições que lhe são "
            "conferidas pelo art. 59 da Lei Orgânica do Município, resolve:\n\n"
            "Art. 1º – Fica nomeado o senhor Pedro Henrique Costa, brasileiro, casado, "
            "professor, portador do CPF nº 123.456.789-00, para exercer o cargo em comissão "
            "de Secretário Municipal de Educação.\n\n"
            "Art. 2º – O cargo em comissão de Secretário Municipal de Educação é de livre "
            "nomeação e exoneração do Prefeito Municipal, com funções de direção, coordenação "
            "e supervisão das atividades da Secretaria Municipal de Educação.\n\n"
            "Art. 3º – O Secretário Municipal de Educação terá como atribuições: planejar, "
            "coordenar e executar as políticas educacionais do Município; gerenciar a rede "
            "municipal de ensino; supervisionar os estabelecimentos de educação infantil e "
            "ensino fundamental; e representar o Município em órgãos e entidades do sistema "
            "educacional.\n\n"
            "Art. 4º – Este decreto entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 01 de janeiro de 2023.\n\n"
            "PREFEITO MUNICIPAL\n"
            "ROBERTO ALMEIDA"
        ),
        "data_publicacao": "2023-01-01",
        "data_promulgacao": None,
        "data_vigencia_inicio": "2023-01-01",
        "data_vigencia_fim": "2024-12-31",
        "status": StatusLegislacao.REVOGADA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": None,
        "origem": "Poder Executivo",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/decreto-112-2023.pdf",
    },
    {
        "id": "lei-412-2024",
        "tipo": TipoLegislacao.LEI,
        "numero": "412",
        "ano": 2024,
        "ementa": (
            "Institui o Programa Municipal de Incentivo à Agricultura Familiar e ao "
            "Desenvolvimento Rural Sustentável de Bandeirantes."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI Nº 412, DE 20 DE MAIO DE 2024\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "Art. 1º – Fica instituído o Programa Municipal de Incentivo à Agricultura "
            "Familiar e ao Desenvolvimento Rural Sustentável (PMAF), como política pública "
            "de fomento à produção agropecuária de base familiar no Município de Bandeirantes.\n\n"
            "Art. 2º – O PMAF tem como objetivos: fortalecer a agricultura familiar como "
            "eixo de desenvolvimento econômico e social; promover a segurança alimentar e "
            "nutricional; incentivar práticas agroecológicas e sustentáveis; e melhorar a "
            "qualidade de vida dos agricultores familiares e trabalhadores rurais.\n\n"
            "Art. 3º – São beneficiários do PMAF os agricultores familiares cadastrados no "
            "Programa Nacional de Agricultura Familiar (PRONAF) e os produtores rurais que "
            "comprovem renda bruta anual de até R$ 360.000,00 (trezentos e sessenta mil reais), "
            "nos termos da Lei Federal nº 11.326/2006.\n\n"
            "Art. 4º – O PMAF compreende as seguintes linhas de ação: assistência técnica "
            "e extensão rural; acesso a crédito rural facilitado; compras institucionais do "
            "governo municipal; organização de feiras agroecológicas; e capacitação em gestão "
            "e comercialização da produção.\n\n"
            "Art. 5º – Fica criado o Conselho Municipal de Desenvolvimento Rural, órgão "
            "colegiado de caráter deliberativo e fiscalizador, vinculado à Secretaria Municipal "
            "de Agricultura e Meio Ambiente.\n\n"
            "Art. 6º – Os recursos financeiros do PMAF serão provenientes de dotações "
            "orçamentárias próprias, transferências federais e estaduais, e parcerias com "
            "organizações da sociedade civil.\n\n"
            "Art. 7º – Esta lei entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 20 de maio de 2024.\n\n"
            "PREFEITO MUNICIPAL\n"
            "FERNANDO RIBEIRO"
        ),
        "data_publicacao": "2024-05-20",
        "data_promulgacao": "2024-05-20",
        "data_vigencia_inicio": "2024-05-21",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeito Fernando Ribeiro",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-412-2024.pdf",
    },
    {
        "id": "portaria-028-2024",
        "tipo": TipoLegislacao.PORTARIA,
        "numero": "028",
        "ano": 2024,
        "ementa": (
            "Define a composição e as atribuições da Comissão de Avaliação de Desempenho "
            "dos servidores públicos municipais para o exercício de 2024."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "PORTARIA Nº 028, DE 15 DE FEVEREIRO DE 2024\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "conforme o disposto na Lei nº 1.234/2010, que instituiu o Plano de Cargos, "
            "Carreiras e Remuneração dos Servidores Públicos Municipais, resolve:\n\n"
            "Art. 1º – Ficam designados os seguintes servidores para comporem a Comissão "
            "de Avaliação de Desempenho dos Servidores Públicos Municipais no exercício de 2024:\n\n"
            "I – Lucia Helena Martins, matrícula nº 4.567, Coordenadora;\n\n"
            "II – Marcos Vinícius Teixeira, matrícula nº 5.678, Membro;\n\n"
            "III – Patrícia Oliveira Santos, matrícula nº 6.789, Membro.\n\n"
            "Art. 2º – A Comissão de Avaliação de Desempenho será responsável por aplicar "
            "os instrumentos de avaliação previstos no Plano de Cargos, analisar os resultados "
            "e emitir pareceres conclusivos sobre o desempenho individual dos servidores, "
            "observando critérios de produtividade, assiduidade, capacitação e comportamento.\n\n"
            "Art. 3º – Os membros da Comissão deverão ser servidores de carreira, com pelo "
            "menos três anos de exercício efetivo no Município, e não poderão ser avaliados "
            "pelo próprio colegiado durante o período de sua composição.\n\n"
            "Art. 4º – Esta portaria entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 15 de fevereiro de 2024.\n\n"
            "PREFEITO MUNICIPAL\n"
            "FERNANDO RIBEIRO"
        ),
        "data_publicacao": "2024-02-15",
        "data_promulgacao": None,
        "data_vigencia_inicio": None,
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": None,
        "origem": "Poder Executivo",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/portaria-028-2024.pdf",
    },
    {
        "id": "lei-comp-005-2024",
        "tipo": TipoLegislacao.LEI_COMPLEMENTAR,
        "numero": "005",
        "ano": 2024,
        "ementa": (
            "Altera dispositivos da Lei Complementar nº 002/2020, dispondo sobre o "
            "zoneamento urbano e as diretrizes de uso e ocupação do solo no Município de Bandeirantes."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI COMPLEMENTAR Nº 005, DE 10 DE AGOSTO DE 2024\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei complementar:\n\n"
            "Art. 1º – Ficam alterados os arts. 3º, 7º e 12 da Lei Complementar nº "
            "002/2020, que instituiu o Plano Diretor de Desenvolvimento Urbano do Município "
            "de Bandeirantes.\n\n"
            "Art. 2º – O zoneamento urbano do Município passa a compreender as seguintes "
            "zonas de uso: Zona Residencial de Baixa Densidade (ZR-1); Zona Residencial de Média "
            "Densidade (ZR-2); Zona Residencial de Alta Densidade (ZR-3); Zona Mista de Uso "
            "Comercial e Residencial (ZM-1); Zona Industrial (ZI-1); Zona de Preservação Ambiental "
            "(ZPA); e Zona Rural (ZR).\n\n"
            "Art. 3º – As diretrizes de uso e ocupação do solo estabelecem coeficientes de "
            "aproveitamento, alturas máximas, recuos frontais e laterais, taxas de permeabilidade "
            "e outras normas de edificação, conforme mapa de zoneamento anexo a esta lei.\n\n"
            "Art. 4º – Fica vedada a construção de edificações com mais de quatro pavimentos "
            "nas Zonas Residenciais de Baixa Densidade, salvo autorização específica do Conselho "
            "Municipal de Urbanismo.\n\n"
            "Art. 5º – A Zona de Preservação Ambiental compreende as áreas de reserva legal, "
            "Áreas de Preservação Permanente (APPs) e nascentes, onde são vedados o parcelamento, "
            "a edificação e a supressão da vegetação nativa, exceto para fins de recuperação ambiental.\n\n"
            "Art. 6º – O descumprimento das normas de zoneamento e uso do solo sujeita o "
            "infrator às penalidades de advertência, multa, embargo de obra, demolição de edificação "
            "irregular e responsabilização civil e criminal, nos termos da legislação ambiental e "
            "urbanística vigente.\n\n"
            "Art. 7º – Esta lei complementar entra em vigor no prazo de 90 (noventa) dias "
            "contados da data de sua publicação.\n\n"
            "Bandeirantes, 10 de agosto de 2024.\n\n"
            "PREFEITO MUNICIPAL\n"
            "FERNANDO RIBEIRO"
        ),
        "data_publicacao": "2024-08-10",
        "data_promulgacao": "2024-08-10",
        "data_vigencia_inicio": "2024-11-08",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ALTERADA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeito Fernando Ribeiro",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-complementar-005-2024.pdf",
    },
    {
        "id": "emenda-001-2025",
        "tipo": TipoLegislacao.EMENDA,
        "numero": "001",
        "ano": 2025,
        "ementa": (
            "Altera o art. 5º da Lei nº 305/2023, ampliando as fontes de recursos do "
            "Fundo Municipal de Assistência Social e incluindo parcerias com o setor privado."
        ),
        "texto_integral": (
            "CÂMARA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "EMENDA LEGISLATIVA Nº 001, DE 12 DE MARÇO DE 2025\n\n"
            "O PRESIDENTE DA CÂMARA MUNICIPAL DE BANDEIRANTES, no exercício de suas "
            "atribuições regimentais, comunica que o Plenário aprovou a seguinte emenda à Lei "
            "nº 305/2023:\n\n"
            "Art. 1º – Fica alterado o art. 5º da Lei nº 305/2023, que instituiu o Fundo "
            "Municipal de Assistência Social (FMAS), para incluir como fonte de recursos as "
            "parcerias com o setor privado, inclusive mediante contratos de patrocínio, doações "
            "corporativas e ações de responsabilidade social empresarial.\n\n"
            "Art. 2º – As parcerias com o setor privado deverão ser formalizadas por meio "
            "de termos de cooperação ou contratos, observados os princípios da transparência, "
            "da legalidade e da impessoalidade, e serão submetidas à aprovação do Conselho "
            "Municipal de Assistência Social.\n\n"
            "Art. 3º – Os recursos provenientes de parcerias privadas deverão ser aplicados "
            "exclusivamente em programas e projetos previamente aprovados no Plano de Trabalho "
            "do FMAS, vedada a destinação para despesas com pessoal e encargos sociais.\n\n"
            "Art. 4º – Fica mantido o disposto nos demais artigos da Lei nº 305/2023, nos "
            "termos em que vigoram.\n\n"
            "Art. 5º – Esta emenda entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 12 de março de 2025.\n\n"
            "PRESIDENTE DA CÂMARA MUNICIPAL\n"
            "VEREADOR JOSÉ RICARDO MENDES"
        ),
        "data_publicacao": "2025-03-12",
        "data_promulgacao": None,
        "data_vigencia_inicio": "2025-03-13",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Vereador José Ricardo Mendes",
        "sancionado_por": None,
        "origem": "Câmara Municipal",
        "legislacao_vinculada": ["lei-305-2023"],
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/emenda-001-2025.pdf",
    },
    {
        "id": "decreto-lei-002-2025",
        "tipo": TipoLegislacao.DECRETO_LEI,
        "numero": "002",
        "ano": 2025,
        "ementa": (
            "Institui medidas provisórias de contenção de despesas no âmbito da administração "
            "direta e indireta do Município de Bandeirantes, em face de crise financeira."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "DECRETO-LEI Nº 002, DE 01 DE ABRIL DE 2025\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso das atribuições que lhe são "
            "conferidas pelo art. 59 da Lei Orgânica do Município e considerando a situação "
            "de desequilíbrio financeiro constatada no relatório de gestão fiscal do 3º quadrimestre "
            "de 2024, decreta:\n\n"
            "Art. 1º – Ficam instituídas medidas provisórias de contenção de despesas no "
            "âmbito da administração direta e indireta do Município de Bandeirantes, pelo prazo "
            "de 120 (cento e vinte) dias, prorrogável por igual período.\n\n"
            "Art. 2º – Durante o período de vigência deste decreto-lei, fica vedada a "
            "contratação de pessoal por tempo determinado, salvo para cargos de natureza temporária "
            "ou emergencial, mediante autorização expressa do Chefe do Poder Executivo.\n\n"
            "Art. 3º – Fica suspensa a autorização para realização de diárias e passagens "
            "a servidores municipais, exceto para missões inadiáveis de interesse público, desde "
            "que previamente autorizadas pelo Secretário Municipal de Administração.\n\n"
            "Art. 4º – As despesas com material de consumo, serviços de terceiros e locações "
            "deverão ser reduzidas em pelo menos 20% (vinte por cento) em relação ao mesmo período "
            "do exercício anterior, observados os limites constitucionais de gastos com pessoal.\n\n"
            "Art. 5º – Os contratos em vigor poderão ser renegociados, mediante termo aditivo, "
            "para adequação dos valores às novas restrições orçamentárias, observado o princípio "
            "da economicidade.\n\n"
            "Art. 6º – Este decreto-lei entra em vigor na data de sua publicação, sujeito à "
            "ratificação da Câmara Municipal no prazo de 120 (cento e vinte) dias.\n\n"
            "Bandeirantes, 01 de abril de 2025.\n\n"
            "PREFEITO MUNICIPAL\n"
            "FERNANDO RIBEIRO"
        ),
        "data_publicacao": "2025-04-01",
        "data_promulgacao": "2025-04-01",
        "data_vigencia_inicio": "2025-04-01",
        "data_vigencia_fim": "2025-07-30",
        "status": StatusLegislacao.ATIVA,
        "autor": "Prefeitura Municipal de Bandeirantes",
        "sancionado_por": "Prefeito Fernando Ribeiro",
        "origem": "Poder Executivo",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/decreto-lei-002-2025.pdf",
    },
    {
        "id": "lei-501-2026",
        "tipo": TipoLegislacao.LEI,
        "numero": "501",
        "ano": 2026,
        "ementa": (
            "Dispõe sobre a criação do Sistema Municipal de Cultura de Bandeirantes, "
            "definindo diretrizes para preservação do patrimônio cultural e fomento às artes."
        ),
        "texto_integral": (
            "PREFEITURA MUNICIPAL DE BANDEIRANTES – ESTADO DE MATO GROSSO DO SUL\n\n"
            "LEI Nº 501, DE 10 DE JANEIRO DE 2026\n\n"
            "O PREFEITO MUNICIPAL DE BANDEIRANTES, no uso de suas atribuições legais, "
            "faz saber que a Câmara Municipal aprovou e ele sanciona a seguinte lei:\n\n"
            "Art. 1º – Fica criado o Sistema Municipal de Cultura (SMC) do Município de "
            "Bandeirantes, como instrumento de planejamento, execução e avaliação das políticas "
            "culturais do Município.\n\n"
            "Art. 2º – O SMC tem por objetivo promover o acesso universal à cultura, valorizar "
            "as manifestações culturais locais, preservar o patrimônio material e imaterial do "
            "Município, e incentivar a produção artística e criativa.\n\n"
            "Art. 3º – O SMC compreende: o Conselho Municipal de Política Cultural (CMPC), "
            "órgão colegiado de caráter deliberativo e normativo; a Secretaria Municipal de Cultura, "
            "como órgão gestor executivo; e os equipamentos culturais municipais, incluindo bibliotecas, "
            "museus, teatros, centros culturais e espaços de memória.\n\n"
            "Art. 4º – O Conselho Municipal de Política Cultural será composto por representantes "
            "do poder público municipal, do setor cultural e da sociedade civil, garantida a paridade "
            "de gênero e a representação de grupos culturais tradicionais.\n\n"
            "Art. 5º – Fica instituído o Fundo Municipal de Cultura, vinculado ao SMC, para "
            "financiar projetos culturais, eventos, premiações, editais e ações de formação artística, "
            "nos termos do Plano Municipal de Cultura.\n\n"
            "Art. 6º – O Patrimônio Cultural do Município de Bandeirantes compreende bens materiais "
            "(edificações, monumentos, sítios arqueológicos, acervos museológicos) e bens imateriais "
            "(festas, manifestações tradicionais, saberes, costumes e expressões artísticas), sujeitos "
            "a inventário, tombamento e preservação.\n\n"
            "Art. 7º – Esta lei entra em vigor na data de sua publicação.\n\n"
            "Bandeirantes, 10 de janeiro de 2026.\n\n"
            "PREFEITO MUNICIPAL\n"
            "LUCIANA PEREIRA"
        ),
        "data_publicacao": "2026-01-10",
        "data_promulgacao": "2026-01-10",
        "data_vigencia_inicio": "2026-01-11",
        "data_vigencia_fim": None,
        "status": StatusLegislacao.ATIVA,
        "autor": "Câmara Municipal de Bandeirantes",
        "sancionado_por": "Prefeita Luciana Pereira",
        "origem": "Câmara Municipal",
        "legislacao_vinculada": None,
        "url_arquivo": "https://www.bandeirantes.ms.gov.br/legislacao/lei-501-2026.pdf",
    },
]
