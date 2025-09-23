
import React from 'react';
import { APP_NAME } from '../constants';
import { LogoIcon, UserCircleIcon } from './icons';
import { View } from '../App';
import { Student } from '../types';

interface NavbarProps {
  onNavigate: (view: View) => void;
  currentUser: Student | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentUser, onLogout }) => {
  const getFirstName = (name: string) => name.split(' ')[0];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer"
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'home')}
            aria-label="Ir para a página inicial"
          >
            <LogoIcon className="h-8 w-auto text-brandGreen" />
          </div>
          <div className="flex items-center">
            {currentUser ? (
              <>
                <span className="text-gray-700 text-sm font-medium mr-4 hidden sm:block">
                  Olá, {getFirstName(currentUser.nome)}
                </span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-gray-700 hover:bg-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium mr-4"
                  aria-label="Acessar seu painel"
                >
                  Meu Painel
                </button>
                 <button
                  onClick={onLogout}
                  className="bg-brandGreen hover:bg-brandGreenDark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                  aria-label="Sair da conta"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="bg-brandGreen hover:bg-brandGreenDark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center"
                  aria-label="Acessar página de login"
                >
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
