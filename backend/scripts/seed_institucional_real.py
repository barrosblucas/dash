"""Seed real data from Bandeirantes-MS official website into institucional tables."""
from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("DATABASE_URL", "sqlite:///./data/portal.db")

from backend.shared.database.connection import create_db_engine, create_session_factory
from backend.shared.database.institucional_models import (
    ProfileInstitucionalModel,
    DepartmentModel,
    OfficeModel,
)
from backend.features.institucional.institucional_data import get_or_create_profile
import json


def seed_profile(db):
    """Update profile with real data from bandeirantes.ms.gov.br."""
    profile = get_or_create_profile(db)

    profile.city_hall_name = "Prefeitura Municipal de Bandeirantes"
    profile.description = (
        "Portal oficial do Poder Executivo Municipal de Bandeirantes — MS. "
        "Gestão 2025-2028 — Reconstruindo com Trabalho."
    )
    profile.image_url = "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/CELSORIBEIROABRANTES-1024x683.jpg"
    profile.address = "Rua Artur Bernardes, 300, 79430-015 — Bandeirantes — MS"
    profile.phone = "(67) 99922-8981"
    profile.email = "gabinete@bandeirantes.ms.gov.br"
    profile.office_hours = "Segunda a Sexta: 7h às 11h e 13h às 17h"

    # Gestão
    profile.mayor_name = "Celso Ribeiro Abrantes"
    profile.mayor_photo_url = "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/CELSORIBEIROABRANTES.jpg"
    profile.mayor_bio = (
        "Prefeito Municipal de Bandeirantes — MS (Gestão 2025-2028). "
        "O Prefeito é o chefe do Poder Executivo municipal, responsável por administrar a cidade, "
        "executar políticas públicas e gerenciar serviços essenciais, como saúde, educação e infraestrutura."
    )

    profile.vice_mayor_name = "Mario Serpa Pinto Filho"
    profile.vice_mayor_photo_url = "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/MARIOSERPAPINTOFILHO.jpg"
    profile.vice_mayor_bio = "Vice-Prefeito Municipal de Bandeirantes — MS (Gestão 2025-2028)."

    profile.cabinet_chief_name = None  # Not listed on the site
    profile.cabinet_chief_photo_url = None
    profile.cabinet_chief_bio = None
    profile.cabinet_description = (
        "O Gabinete do Prefeito é o núcleo central da administração municipal, responsável por assessorar "
        "o prefeito na gestão das políticas públicas e na tomada de decisões. Composto por secretários e "
        "assessores, coordena ações entre as secretarias, articula projetos e representa o município em "
        "eventos oficiais."
    )

    profile.social_links_json = json.dumps([
        {"label": "Facebook", "url": "https://www.facebook.com/prefeituradebandeirantesms/"},
        {"label": "Instagram", "url": "https://www.instagram.com/prefbandeirantes.ms/"},
    ])

    db.commit()
    print(f"✅ Profile updated: {profile.city_hall_name}")


def seed_departments(db):
    """Delete existing departments and seed with real data."""
    db.query(DepartmentModel).delete()
    db.commit()

    departments = [
        {
            "slug": "administracao",
            "name": "Secretaria Municipal de Administração",
            "kind": "secretaria",
            "leader_title": "Secretário(a) Municipal",
            "secretary_name": "Vagner Trindade de Castro",
            "secretary_photo_url": None,
            "description": "Responsável pela gestão administrativa do município.",
            "mission": None,
            "vision": None,
            "values": None,
            "phone": None,
            "email": "gabinete@bandeirantes.ms.gov.br",
            "address": "Rua Artur Bernardes, 300, 79430-015 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "assistencia-social",
            "name": "Secretaria de Assistência Social e Cidadania",
            "kind": "secretaria",
            "leader_title": "Secretária Municipal",
            "secretary_name": "Francielly Ramos",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/FranciellyRamos.jpg",
            "description": "Fomentar uma rede que garanta a proteção social, assegurando os direitos sociais às pessoas em situação de vulnerabilidade.",
            "mission": "Fomentar uma rede que garanta a proteção social, assegurando os direitos sociais às pessoas em situação de vulnerabilidade social e risco da violação de direitos, em busca da equidade, inclusão social e busca de autonomia das famílias.",
            "vision": "Garantir o acesso aos direitos sociais, o enfrentamento a pobreza e a universalização da proteção social, materializando o Sistema Único de Assistência Social — SUAS.",
            "values": "Integralidade da proteção social; Centralidade na família; Respeito à diversidade e a pluralidade; Equidade no acesso aos direitos; Compromisso com a gestão democrática e transparente; Descentralização político-administrativa e comando único do SUAS; Participação popular e controle social.",
            "phone": None,
            "email": "assistenciasocial@bandeirantes.ms.gov.br",
            "address": "Rua Artur Bernardes, 1896 — Centro, 79430-015 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "desenvolvimento-e-turismo",
            "name": "Secretaria Municipal de Desenvolvimento e Turismo",
            "kind": "secretaria",
            "leader_title": "Secretária Municipal",
            "secretary_name": "Gediana Ribeiro da Rocha",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/GEDIANARIBEIRODAROCHA.jpg",
            "description": "Secretaria responsável pelo desenvolvimento econômico, turismo e empregabilidade do município.",
            "mission": "Ser uma secretaria obstinada em prever e atender as necessidades dos munícipes sempre contribuindo com o bem-estar junto a população em geral.",
            "vision": "Ser uma secretaria reconhecida pelo desenvolvimento do empreendedorismo junto ao comércio e empresas locais, favorecendo o atendimento ao público alvo a procura de emprego através do nosso Balcão de Emprego, estruturar o turismo de forma consciente e ordenada para desenvolver suas atividades no município de Bandeirantes.",
            "values": "Agir sempre buscando a integridade, ética, justiça, transparência, comprometimento e estabelecendo o respeito e a confiança nas relações.",
            "phone": "(67) 99917-1200",
            "email": "sec.desenvolvimento@prefeitura.bandeirantes.ms.gov.br",
            "address": "Rua Rocha Xavier, 1875 — Centro, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "educacao",
            "name": "Secretaria Municipal de Educação",
            "kind": "secretaria",
            "leader_title": "Secretária Municipal",
            "secretary_name": "Josiane Souza Gomes Schonhalz",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/JOSIANESOUZAGOMESSCHONHALZ.jpg",
            "description": "Garantir o acesso, a permanência com sucesso na escola e o desenvolvimento da Educação Integral humanizada.",
            "mission": "Garantir o acesso, a permanência com sucesso na escola e o desenvolvimento da Educação Integral humanizada, por meio da gestão democrática e inovação educacional, propiciando um ambiente adequado e estimulador, e promovendo a integração escola-comunidade.",
            "vision": "Ser uma secretaria de referência e qualidade com excelência dos serviços educacionais prestados, transparência e compromisso com a gestão pública democrática e por ações de educação integral humanizada visando a formação cidadã do aluno.",
            "values": "Desenvolvimento integral do ser humano; Profissionalização e valorização dos profissionais da Educação; Eficiência na oferta e nos resultados dos serviços educacionais; Compromisso e transparência na gestão pública democrática; Criatividade e inovação tecnológica; Ética profissional e pessoal; Valorização das vivências culturais; Respeito a individualidade e a diversidade; Trabalho em equipe; Comprometimento; Eficiência e eficácia.",
            "phone": None,
            "email": "educacao@bandeirantesms.com.br",
            "address": "Rua Francisco Antônio de Souza, 2496, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "esporte-e-cultura",
            "name": "Secretaria de Esporte e Cultura",
            "kind": "secretaria",
            "leader_title": "Secretário Municipal",
            "secretary_name": "Junior Mulari",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/JUNIORMULARI.jpg",
            "description": "Formular e executar políticas de fomento ao desenvolvimento da cultura e do esporte no município.",
            "mission": "Formular e executar fomentando o desenvolvimento da cultura e do Esporte em nosso Município, por meio de novos projetos que serão desenvolvidos tanto ao lazer, quanto para a cultura e esporte e principalmente ao bem estar dos munícipes.",
            "vision": "Promover, incentivar e apoiar todos os tipos de manifestações culturais e Esportivas, além de estabelecer parcerias para a produção da cultura e esporte com escolas, organizações sociais, fundações e outras instituições.",
            "values": "Difusão, descentralização e acessibilidade da cultura e do Esporte para os Munícipes, com transparência, compromisso e equidade, trazendo melhorias na qualidade de vida da população.",
            "phone": "(67) 99922-8981",
            "email": "funcest@bandeirantes.ms.gov.br",
            "address": "Rua Rocha Xavier, 1881, Centro, 79430-013 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "fazenda",
            "name": "Secretaria Municipal de Finanças Públicas",
            "kind": "secretaria",
            "leader_title": "Secretária Municipal",
            "secretary_name": "Edleuza Vidal Borges",
            "secretary_photo_url": None,  # Photo on site was wrong (showed Junior Mulari)
            "description": "A Secretaria Municipal de Finanças (SEFIN) é um órgão vinculado ao Executivo municipal, que tem a responsabilidade de fiscalizar, pagar, arrecadar e controlar os recursos públicos.",
            "mission": "Orientar e acompanhar a gestão orçamentária, financeira, patrimonial e contábil dos órgãos e entidades que compõem o Poder Executivo municipal, tendo como meta o equilíbrio fiscal para o desenvolvimento das ações governamentais.",
            "vision": "Ser uma secretaria reconhecida pela excelência na gestão pública e indutora do desenvolvimento econômico e social do município de Bandeirantes.",
            "values": "Agir sempre buscando a integridade, ética, justiça tributária, transparência, comprometimento e estabelecendo o respeito e a confiança nas relações.",
            "phone": "(67) 99870-3194",
            "email": "fazenda@bandeirantes.ms.gov.br",
            "address": "Rua Artur Bernardes, 300, 79430-015 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "gestao-agraria-e-ambiental",
            "name": "Secretaria de Gestão Agrária e Ambiental",
            "kind": "secretaria",
            "leader_title": "Secretário Municipal",
            "secretary_name": "Gustavo Hoppen Lindner",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/GUSTAVOHOPPENLINDNER.jpg",
            "description": "Planejar, coordenar e promover ações de políticas públicas para o desenvolvimento sustentável do meio rural e do agronegócio.",
            "mission": "Planejar, coordenar e promover ações de políticas públicas para o desenvolvimento sustentável do meio rural e do agronegócio, em benefício do produtor rural e da população em geral de Bandeirantes.",
            "vision": "Ter o reconhecimento da sociedade pelo protagonismo na formulação e execução de políticas para o desenvolvimento rural e do agronegócio, e ser referência no fomento a práticas agrícolas inovadoras e sustentáveis.",
            "values": "Comportamento ético, cooperativo e inovador; Respeito às pessoas, ao trabalho e ao meio ambiente; Responsabilidade com os trabalhos desempenhados; Comprometimento com a gestão, com o produtor e com a população; Melhoria constante na oferta de serviços públicos; Transparência nas ações; Sustentabilidade.",
            "phone": None,
            "email": "agricultura@bandeirantes.ms.gov.br",
            "address": "Rua Tenente Germiniano Ribeiro, 305, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "governo",
            "name": "Secretaria Municipal de Governo",
            "kind": "secretaria",
            "leader_title": "Secretário(a) Municipal",
            "secretary_name": None,  # Not listed on the site
            "secretary_photo_url": None,
            "description": "Responsável pelo fortalecimento do relacionamento e articulação do Executivo Municipal com entidades da sociedade civil, representação política da Gestão, planejamento e coordenação de planos e programas da administração.",
            "mission": "Fortalecer o relacionamento e facilitar a articulação do Executivo Municipal com as entidades da sociedade civil, visando maior participação do cidadão bandeirantense nas ações de Governo; garantir a representação política da Gestão, promovendo a integração política institucional, planejar, promover e coordenar os planos e programas de toda administração.",
            "vision": "Ser reconhecida pela contribuição à toda estrutura organizacional da gestão e planejamento de ações e programas, com fortalecimento do vínculo entre os cidadãos e Executivo Municipal.",
            "values": "Ética; Valorização da capacidade contributiva dos servidores; Fortalecimento da relação institucional do Município e cidadãos; Atuação integrada e cooperativa interna e externamente; Cidadania; Igualdade; Solidariedade; Liberdade.",
            "phone": None,
            "email": "gabinete@bandeirantes.ms.gov.br",
            "address": "Rua Artur Bernardes, 300, 79430-015 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "infraestrutura",
            "name": "Secretaria de Infraestrutura",
            "kind": "secretaria",
            "leader_title": "Secretário Municipal",
            "secretary_name": "Ronaldo Correia de Moraes",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2025/08/RONALDOCORREIADEMORAES.jpg",
            "description": "Responsável por projetos, obras públicas, limpeza urbana e conservação municipal.",
            "mission": "Elaborar projetos, executar e fiscalizar obras e assim, proporcionar serviços que possam resultar na melhoria da qualidade de vida dos cidadãos. Executar serviços de limpeza pública, coleta, transporte e destinação final do lixo. Manter, controlar e conservar praças, parques, jardins e demais áreas verdes. Planejar e gerenciar a prestação de serviços de iluminação pública urbana.",
            "vision": "Ser um órgão de referência na gestão de projetos e execução de obras públicas e limpeza urbana, conforme os princípios da sustentabilidade, economicidade, eficiência e eficácia.",
            "values": "Integridade, Conformidade e Transparência na prestação de serviços; Gestão participativa e sustentável; Compromisso com responsabilidade e qualidade dos projetos e obras executadas; Inovação e melhoria constante dos padrões e conceitos.",
            "phone": "(67) 99199-4962",
            "email": "obras@bandeirantes.ms.gov.br",
            "address": "Rua João Pessoa, 2001, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "saude",
            "name": "Secretaria Municipal de Saúde",
            "kind": "secretaria",
            "leader_title": "Secretário Municipal",
            "secretary_name": "Rafael Maciel Acosta",
            "secretary_photo_url": "https://bandeirantes.ms.gov.br/v2/wp-content/uploads/2026/03/RafaelMacielAcosta.jpeg",
            "description": "Prestar serviços de excelência, assegurando à população as Políticas Públicas de Saúde, considerando os princípios do SUS.",
            "mission": "Prestar serviços de excelência, assegurando à população as Políticas Públicas de Saúde, considerando os princípios do SUS, visando à melhoria da qualidade de vida no município de Bandeirantes, promovendo ações e serviços para a atenção integral à saúde da população, com humanização e qualidade.",
            "vision": "Atender a população com agilidade, qualidade e eficiência. Promovendo ações e serviços públicos em saúde de maneira eficiente e comprometida com o bem-estar da população. Tornar-se referência em humanização e qualidade na prestação de serviços de saúde.",
            "values": "Ética pessoal e institucional, comprometimento, resiliência, humanização, responsabilidade, equidade, eficiência, segurança do paciente, valorização e respeito às pessoas, satisfação dos pacientes e da população, melhoria contínua da qualidade.",
            "phone": "(67) 99967-9784",
            "email": "saude@bandeirantes.ms.gov.br",
            "address": "Av. Francisco Antônio de Souza, 2496, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
        {
            "slug": "saae",
            "name": "SAAE — Serviço Autônomo de Água e Esgoto",
            "kind": "autarquia",
            "leader_title": "Diretor-Presidente",
            "secretary_name": None,  # Not separately listed on the site
            "secretary_photo_url": None,
            "description": "Serviço Autônomo de Água e Esgoto de Bandeirantes — MS, autarquia vinculada à Prefeitura Municipal responsável pelo abastecimento de água e tratamento de esgoto.",
            "mission": None,
            "vision": None,
            "values": None,
            "phone": None,
            "email": "saude@bandeirantes.ms.gov.br",
            "address": "Av. Francisco Antônio de Souza, 2496, 79430-000 — Bandeirantes — MS",
            "office_hours": "Segunda a Sexta: 7h às 11h e 13h às 17h",
            "image_url": None,
        },
    ]

    for dept_data in departments:
        dept = DepartmentModel(**dept_data)
        db.add(dept)

    db.commit()
    print(f"✅ {len(departments)} departments seeded")


def main():
    engine = create_db_engine()
    SessionLocal = create_session_factory(engine)
    db = SessionLocal()
    try:
        seed_profile(db)
        seed_departments(db)
        print("\n🎉 Seed complete — institucional data populated with real data from bandeirantes.ms.gov.br")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
