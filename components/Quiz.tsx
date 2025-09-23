
import React, { useState } from 'react';
import { QuizQuestion, QuizDifficulty } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from './icons';

interface QuizProps {
  questions: QuizQuestion[] | null;
  difficulty: QuizDifficulty;
  isLoading: boolean;
  videoTitle: string;
}

const QuizComponent: React.FC<QuizProps> = ({ questions, difficulty, isLoading, videoTitle }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message={`Gerando quiz de nível ${difficulty}...`} />;
  }

  if (!questions || questions.length === 0) {
    return <p className="text-center text-gray-600 py-4">Não foi possível carregar o quiz. Tente novamente mais tarde.</p>;
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => {
    setShowResults(true);
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const score = questions.reduce((acc, q, index) => {
    return selectedAnswers[index] === q.correctAnswer ? acc + 1 : acc;
  }, 0);

  if (showResults) {
    return (
      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-2xl font-bold text-brandDarkGray mb-2 text-center">Resultados do Quiz</h3>
        <p className="text-center text-gray-700 mb-4">Nível: {difficulty} - {videoTitle}</p>
        <p className="text-center text-2xl font-semibold mb-6">
          Você acertou <span className="text-brandGreen">{score}</span> de <span className="text-brandBlue">{questions.length}</span> perguntas!
        </p>
        
        <div className="space-y-4 mb-6">
          {questions.map((q, index) => (
            <div key={index} className={`p-4 rounded-md border ${selectedAnswers[index] === q.correctAnswer ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <p className="font-semibold text-gray-800">{index + 1}. {q.question}</p>
              <p className={`text-sm ${selectedAnswers[index] === q.correctAnswer ? 'text-green-700' : 'text-red-700'}`}>
                Sua resposta: {selectedAnswers[index] || "Não respondida"} 
                {selectedAnswers[index] === q.correctAnswer 
                  ? <CheckCircleIcon className="inline h-5 w-5 ml-1 text-green-500" /> 
                  : <XCircleIcon className="inline h-5 w-5 ml-1 text-red-500" />}
              </p>
              {selectedAnswers[index] !== q.correctAnswer && <p className="text-sm text-green-700">Resposta correta: {q.correctAnswer}</p>}
              <p className="text-xs text-gray-600 mt-1 flex items-start">
                <LightBulbIcon className="h-3 w-3 mr-1 mt-0.5 text-yellow-500 flex-shrink-0" />
                <span className="italic">Explicação: {q.explanation}</span>
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleRetakeQuiz}
          className="w-full bg-brandBlue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150"
          aria-label="Refazer quiz"
        >
          Refazer Quiz ({difficulty})
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-brandDarkGray mb-1">Quiz: {videoTitle}</h3>
      <p className="text-sm text-gray-500 mb-4">Nível: {difficulty} - Pergunta {currentQuestionIndex + 1} de {questions.length}</p>
      
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-800 mb-3">{currentQuestion.question}</p>
        <div className="space-y-3">
          {currentQuestion.options.map((option,_index) => (
            <button
              key={option}
              onClick={() => handleAnswerSelect(currentQuestionIndex, option)}
              className={`w-full text-left p-3 border rounded-md transition-colors duration-150
                ${selectedAnswers[currentQuestionIndex] === option 
                  ? 'bg-brandGreen border-brandGreenDark text-white ring-2 ring-brandGreenDark' 
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700'}`}
              aria-label={`Opção ${option}`}
            >
              {String.fromCharCode(65 + _index)}. {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
          aria-label="Pergunta anterior"
        >
          Anterior
        </button>
        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={!selectedAnswers[currentQuestionIndex]}
            className="bg-brandGreen hover:bg-brandGreenDark text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
            aria-label="Finalizar quiz"
          >
            Finalizar Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={!selectedAnswers[currentQuestionIndex]}
            className="bg-brandBlue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 disabled:opacity-50"
            aria-label="Próxima pergunta"
          >
            Próxima
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
