import React, { useState } from 'react';
import { Student, Bimester, AnalysisData, SubjectPerformance, VideoRecommendation, QuizDifficulty, QuizQuestion } from '../types';
import { BIMESTER_OPTIONS } from '../constants';
import { grades as allGrades } from '../studentData';
import AnalysisResult from './AnalysisResult';
import LoadingSpinner from './LoadingSpinner';
import { ChartBarIcon, ArrowLeftIcon, LightBulbIcon, XCircleIcon } from './icons';
import PerformanceChart from './PerformanceChart';
import StudentPerformancePanel from './StudentPerformancePanel';
import { generatePerformanceSummary } from '../services/geminiService';

interface StudentDashboardProps {
  student: Student;
  onSelectVideoForQuiz: (video: VideoRecommendation, difficulty: QuizDifficulty) => void;
  currentQuiz: QuizQuestion[] | null;
  currentQuizVideo: VideoRecommendation | null;
  currentQuizDifficulty: QuizDifficulty | null;
  isQuizLoading: boolean;
  onReportVideoIssue?: (videoId: string, issueType: string) => void;
  isProfileOpen: boolean;
  onCloseProfile: () => void;
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
  const firstName = student.nome.split(' ')[0];
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
  props.onCloseProfile();
    setSummary('');

    setTimeout(async () => {
      const bimesterNumber = bimesterMap[bimester];
      const studentGrades = allGrades.filter(
        (g) => g.matricula === student.matricula && g.bimestre === bimesterNumber
      );

      const performanceData: SubjectPerformance[] = studentGrades.map((g) => ({
        subject: g.disciplina,
        grade: g.nota * 10,
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
        try {
          const generatedSummary = await generatePerformanceSummary(student, data);
          setSummary(generatedSummary);
        } catch (error) {
          console.error('Erro ao gerar resumo de desempenho:', error);
          const fallbackSummary = `Olá ${student.nome.split(' ')[0]}! Seus resultados foram analisados. Continue se dedicando aos estudos e utilizando os recursos disponíveis na plataforma para melhorar ainda mais seu desempenho!`;
          setSummary(fallbackSummary);
        }
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
  props.onCloseProfile();
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

        <h2 className="text-3xl font-bold text-brandDarkGray mb-2 text-center">
          Seu Relatório de Desempenho
        </h2>
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
              <p className="text-gray-600">
                Não encontramos notas registradas para você neste bimestre.
              </p>
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-brandDarkGray">
              Bem-vindo(a), <span className="text-brandGreen uppercase">{firstName}!</span>
            </h2>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-brandGreen/20 via-brandGreen/40 to-brandGreen/20" />
          </div>
          <div className="space-y-3 text-sm sm:text-base text-brandDarkGray">
            <p>
              <span className="font-semibold text-brandGreen">Matrícula:</span>{' '}
              {student.matricula}
            </p>
            <p>
              <span className="font-semibold text-brandGreen">Turma:</span>{' '}
              {student.turma}
            </p>
            <p>
              <span className="font-semibold text-brandGreen">Escola:</span>{' '}
              {student.escola}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col space-y-6">
          <h2 className="text-2xl font-semibold text-center text-brandDarkGray">Analisar Desempenho</h2>
          <form onSubmit={handleStartAnalysis} className="space-y-6">
            <div>
              <label
                htmlFor="bimester-select"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Selecione o Bimestre
              </label>
              <select
                id="bimester-select"
                value={bimester}
                onChange={(e) => setBimester(e.target.value as Bimester)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brandGreen focus:border-brandGreen sm:text-sm"
              >
                {BIMESTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brandGreen hover:bg-brandGreenDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandGreen transition duration-150 disabled:opacity-50"
              aria-label="Analisar meu desempenho"
            >
              {isProcessing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <ChartBarIcon className="h-5 w-5 mr-2" /> Analisar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {props.isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={props.onCloseProfile}
          />
          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-brandDarkGray">Meu Perfil</h3>
                <button
                  type="button"
                  onClick={props.onCloseProfile}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-brandDarkGray hover:bg-gray-200 transition"
                  aria-label="Fechar Meu Perfil"
                >
                  <XCircleIcon className="w-5 h-5" /> Fechar
                </button>
              </div>

              <StudentPerformancePanel student={student} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;