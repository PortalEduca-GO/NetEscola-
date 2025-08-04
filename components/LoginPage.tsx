
import React, { useState } from 'react';
import { ArrowLeftIcon, GoogleIcon } from './icons';
import { Student } from '../types';
import { students } from '../studentData';

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (student: Student) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onLoginSuccess }) => {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    
    if (!matricula || !senha) {
      setError('Por favor, preencha a matrícula e a senha.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      // Regra de negócio: senha é a própria matrícula
      if (matricula !== senha) {
          setError('Matrícula ou senha inválida.');
          setIsLoading(false);
          return;
      }

      const foundStudent = students.find(s => s.matricula === matricula);

      if (foundStudent) {
        onLoginSuccess(foundStudent);
      } else {
        setError('Matrícula ou senha inválida.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    alert('Login com Google (simulado). Em um app real, a janela de autenticação do Google seria aberta.');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-brandBlue hover:text-blue-700 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Voltar
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-brandDarkGray mb-6">
            Acessar Painel do Aluno
          </h2>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">
                Login (Matrícula)
              </label>
              <input
                id="matricula"
                name="matricula"
                type="text"
                autoComplete="username"
                required
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brandGreen focus:border-brandGreen sm:text-sm"
                placeholder="Sua matrícula"
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha (Matrícula)
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brandGreen focus:border-brandGreen sm:text-sm"
                placeholder="Digite sua matrícula novamente"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brandGreen hover:bg-brandGreenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandGreen transition duration-150 disabled:opacity-75"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <GoogleIcon className="w-5 h-5 mr-3" />
              Entrar com E-mail Educacional
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;