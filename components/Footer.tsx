
import React from 'react';
import { APP_NAME } from '../constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const footerLinks = [
    { name: "Sobre", href: "#" },
    { name: "Contato", href: "#" },
    { name: "Termos de Uso", href: "#" }
  ];

  return (
    <footer className="bg-brandDarkGray text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        {/* Container flexível principal para as três seções do rodapé */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

          {/* Esquerda: Links (ordem 2 em telas pequenas, 1 em médias+) */}
          <div className="flex gap-x-6 text-sm order-2 md:order-1">
            {footerLinks.map(link => (
              <a 
                key={link.name}
                href={link.href}
                onClick={(e) => e.preventDefault()}
                className="text-gray-300 hover:text-white hover:underline transition-colors"
                aria-label={`Ir para a página ${link.name}`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Centro: Copyright (ordem 3 em telas pequenas, 2 em médias+) */}
          <div className="text-center text-xs sm:text-sm text-gray-400 order-3 md:order-2">
            <p>
              &copy; {currentYear} {APP_NAME}. Todos os direitos reservados.
            </p>
          </div>

          {/* Direita: Logo (ordem 1 em telas pequenas, 3 em médias+) */}
          <div className="flex-shrink-0 order-1 md:order-3">
            <img 
              src="https://imgur.com/q1QE2cK.png" 
              alt="Logo Governo de Goiás e Secretaria da Educação" 
              className="h-12 w-auto" 
            />
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
