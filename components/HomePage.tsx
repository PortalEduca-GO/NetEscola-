
import React from 'react';
import { LogoIcon } from './icons';

interface HomePageProps {
  onStartAnalysis: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartAnalysis }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <LogoIcon className="h-20 w-auto text-brandGreen mb-8" />
      
      <div className="mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-brandDarkGray mb-4">
          <span 
            className="inline-block overflow-hidden whitespace-nowrap border-r-4 border-transparent animate-typing align-bottom"
          >
            Seu assistente pessoal de aprendizado!
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Descubra suas dificuldades, receba um relatório visual do seu desempenho e acesse recomendações de vídeos educativos personalizados para turbinar seus estudos.
        </p>
      </div>

      <button
        onClick={onStartAnalysis}
        className="bg-brandGreen hover:bg-brandGreenDark text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
        aria-label="Iniciar análise e acessar painel"
      >
        Acessar Painel
      </button>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-brandGreen mb-2">Análise Inteligente</h3>
          <p className="text-gray-700 text-sm">Entenda seu progresso com gráficos interativos e claros sobre seu desempenho escolar.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-brandGreen mb-2">Recomendações Curadas</h3>
          <p className="text-gray-700 text-sm">Receba sugestões de vídeos do Goiás Tec, alinhados com o conteúdo executado em sala.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-brandGreen mb-2">Aprendizado Interativo</h3>
          <p className="text-gray-700 text-sm">Teste seus conhecimentos com quizzes gerados por IA e acompanhe sua evolução!</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
