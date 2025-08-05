
import React, { useState } from 'react';
import { Student, Bimester, AnalysisData, SubjectPerformance, VideoRecommendation, QuizDifficulty, QuizQuestion } from '../types';
import { BIMESTER_OPTIONS } from '../constants';
import { grades as allGrades } from '../studentData';
import AnalysisResult from './AnalysisResult';
import LoadingSpinner from './LoadingSpinner';
import { ChartBarIcon, ArrowLeftIcon, LightBulbIcon } from './icons';
import PerformanceChart from './PerformanceChart';
import { generatePerformanceSummary } from '../services/geminiService';

interface StudentDashboardProps {
  student: Student;
  onSelectVideoForQuiz: (video: VideoRecommendation, difficulty: QuizDifficulty) => void;
  currentQuiz: QuizQuestion[] | null;
  currentQuizVideo: VideoRecommendation | null;
  currentQuizDifficulty: QuizDifficulty | null;
  isQuizLoading: boolean;
  onReportVideoIssue?: (videoId: string, issueType: string) => void;
}

const bimesterMap: { [key: string]: number } = {
  [Bimester.BIM_1]: 1,
  [Bimester.BIM_2]: 2,
  [Bimester.BIM_3]: 3,
  [Bimester.BIM_4]: 4,
};

type AnalysisStep = 'selection' | 'report' | 'reinforcement';

const StudentDashboard: React.FC<StudentDashboardProps> = (props) => {
  const { student } = props;
  const [bimester, setBimester] = useState<Bimester>(BIMESTER_OPTIONS[0]);
  
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('selection');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const hasLowGrades = analysisData?.performance.some(p => p.grade < 60) ?? false;

  const handleStartAnalysis = (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);
    setSummary('');

    setTimeout(async () => {
      const bimesterNumber = bimesterMap[bimester];
      const studentGrades = allGrades.filter(
        g => g.matricula === student.matricula && g.bimestre === bimesterNumber
      );
      
      const performanceData: SubjectPerformance[] = studentGrades.map(g => ({
        subject: g.disciplina,
        grade: g.nota * 10, // Escala de 0-10 para 0-100
      }));

      const data: AnalysisData = {
        schoolGrade: student.serie,
        bimester,
        performance: performanceData,
      };

      setAnalysisData(data);
      setAnalysisStep('report');
      setIsProcessing(false);

      if (performanceData.length > 0) {
        setIsSummaryLoading(true);
        const generatedSummary = await generatePerformanceSummary(student, data);
        setSummary(generatedSummary);
        setIsSummaryLoading(false);
      }
    }, 1000);
  };

  const handleProceedToReinforcement = () => {
    setAnalysisStep('reinforcement');
  };

  const handleBackToSelection = () => {
      setAnalysisStep('selection');
      setAnalysisData(null);
      setSummary('');
  };

  if (analysisStep === 'reinforcement' && analysisData) {
    return (
      <AnalysisResult 
        analysisData={analysisData}
        onResetAnalysis={handleBackToSelection}
        onSelectVideoForQuiz={props.onSelectVideoForQuiz}
        currentQuiz={props.currentQuiz}
        currentQuizVideo={props.currentQuizVideo}
        currentQuizDifficulty={props.currentQuizDifficulty}
        isQuizLoading={props.isQuizLoading}
        onReportVideoIssue={props.onReportVideoIssue}
      />
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <LoadingSpinner size="lg" message={`Analisando desempenho do ${bimester}...`} />
      </div>
    );
  }

  if (analysisStep === 'report' && analysisData) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={handleBackToSelection}
          className="mb-6 inline-flex items-center text-brandBlue hover:text-blue-700 transition-colors"
          aria-label="Analisar outro bimestre"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Analisar Outro Bimestre
        </button>

        <h2 className="text-3xl font-bold text-brandDarkGray mb-2 text-center">Seu Relatório de Desempenho</h2>
        <p className="text-center text-gray-600 mb-8">{analysisData.bimester}</p>
        
        <div className="space-y-8 max-w-4xl mx-auto">
            {isSummaryLoading && <LoadingSpinner message="Gerando análise pedagógica..." />}
            {summary && !isSummaryLoading && (
                <div className="p-4 bg-blue-50 border-l-4 border-brandBlue rounded-lg shadow-md">
                    <h3 className="font-semibold text-brandBlue mb-2 flex items-center">
                        <LightBulbIcon className="h-5 w-5 mr-2" />
                        Análise do seu Desempenho
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</p>
                </div>
            )}

            {analysisData.performance.length > 0 ? (
                <PerformanceChart data={analysisData.performance} />
            ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                  <h3 className="text-xl font-semibold text-brandDarkGray mb-2">Nenhum dado encontrado</h3>
                  <p className="text-gray-600">Não encontramos notas registradas para você neste bimestre.</p>
                </div>
            )}

            {analysisData.performance.length > 0 && (
                <div className="text-center pt-4">
                    <button
                        onClick={handleProceedToReinforcement}
                        className="bg-brandGreen hover:bg-brandGreenDark text-white font-bold py-3 px-8 rounded-lg shadow-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
                        aria-label={hasLowGrades ? 'Buscar reforço escolar' : 'Explorar vídeos de estudo'}
                    >
                        {hasLowGrades ? 'Buscar Reforço Escolar' : 'Explorar Vídeos de Estudo'}
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center min-h-[calc(100vh-12rem)]">
        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-left self-stretch">
          <h1 className="text-2xl font-bold text-brandDarkGray mb-2">
            Bem-vindo(a), <span className="text-brandGreen">{student.nome.split(' ')[0]}!</span>
          </h1>
          <div className="text-sm text-gray-600 space-y-1 mt-4 border-t pt-4">
            <p><strong>Matrícula:</strong> {student.matricula}</p>
            <p><strong>Turma:</strong> {student.turma}</p>
            <p><strong>Escola:</strong> {student.escola}</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <form 
              onSubmit={handleStartAnalysis} 
              className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6"
          >
              <h2 className="text-xl font-semibold text-center text-brandDarkGray">Analisar Desempenho</h2>
              <div>
                  <label htmlFor="bimester-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione o Bimestre
                  </label>
                  <select
                      id="bimester-select"
                      value={bimester}
                      onChange={(e) => setBimester(e.target.value as Bimester)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brandGreen focus:border-brandGreen sm:text-sm"
                  >
                      {BIMESTER_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                      ))}
                  </select>
              </div>
              <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brandGreen hover:bg-brandGreenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandGreen transition duration-150 disabled:opacity-50"
                  aria-label="Analisar meu desempenho"
              >
                  {isProcessing ? <LoadingSpinner size="sm" /> : <><ChartBarIcon className="h-5 w-5 mr-2" /> Analisar</>}
              </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;