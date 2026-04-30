import Link from 'next/link';

const footerSections = [
  {
    title: 'Portal',
    links: [
      { name: 'Início', href: '/' },
      { name: 'Painel Financeiro', href: '/dashboard' },
      { name: 'Obras Públicas', href: '/obras' },
      { name: 'Ações da Gestão', href: '/acoes' },
      { name: 'Transparência', href: '/transparencia' },
    ],
  },
  {
    title: 'Dados',
    links: [
      { name: 'Receitas', href: '/receitas' },
      { name: 'Despesas', href: '/despesas' },
      { name: 'Licitações', href: '/avisos-licitacoes' },
      { name: 'Dados Abertos', href: '#' },
    ],
  },
  {
    title: 'Serviços',
    links: [
      { name: 'Previsões', href: '/forecast' },
      { name: 'Comparativo', href: '/comparativo' },
      { name: 'Mov. Extra', href: '/movimento-extra' },
      { name: 'Relatórios', href: '/relatorios' },
    ],
  },
  {
    title: 'Contato',
    links: [
      { name: 'Suporte', href: '#' },
      { name: 'E-mail', href: 'mailto:transparencia@bandeirantes.ms.gov.br' },
      { name: 'Telefone', href: 'tel:+556733421234' },
      { name: 'Localização', href: '#' },
    ],
  },
];

export default function PortalFooter() {
  return (
    <footer className="bg-surface-container-low">
      {/* Top — Link columns */}
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-label-lg font-headline font-bold text-on-surface mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-on-surface-variant
                                 hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — Copyright & legal */}
      <div className="border-t border-outline-variant/20">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-6
                        flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-label-sm text-on-surface-variant text-center sm:text-left">
            © 2024 Prefeitura Municipal de Bandeirantes — MS
          </p>
          <div className="flex items-center gap-4 text-label-sm text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Política de Privacidade
            </a>
            <span className="text-outline-variant">·</span>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Termos de Uso
            </a>
            <span className="text-outline-variant">·</span>
            <a href="#" className="hover:text-primary transition-colors duration-200">
              Acessibilidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
