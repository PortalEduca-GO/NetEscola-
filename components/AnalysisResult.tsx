

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalysisData, VideoRecommendation, SchoolGrade, QuizDifficulty, QuizQuestion } from '../types'; 
import { DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD, ALL_VIDEOS } from '../constants'; 
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import { generateVideoJustification } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { ArrowLeftIcon, LightBulbIcon, AdjustmentsHorizontalIcon } from './icons'; 

interface AnalysisResultProps {
  analysisData: AnalysisData | null;
  onResetAnalysis: () => void;
  onSelectVideoForQuiz: (video: VideoRecommendation, difficulty: QuizDifficulty) => void;
  currentQuiz: QuizQuestion[] | null;
  currentQuizVideo: VideoRecommendation | null;
  currentQuizDifficulty: QuizDifficulty | null;
  isQuizLoading: boolean;
  onReportVideoIssue?: (videoId: string, issueType: string) => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ 
    analysisData, 
    onResetAnalysis, 
    onSelectVideoForQuiz,
    currentQuiz,
    currentQuizVideo,
    currentQuizDifficulty,
    isQuizLoading,
    onReportVideoIssue
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoRecommendation | null>(null);
  const [recommendedVideos, setRecommendedVideos] = useState<VideoRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  const [selectedFilterSubjects, setSelectedFilterSubjects] = useState<Set<string>>(new Set());
  const [allSubjectsForGrade, setAllSubjectsForGrade] = useState<string[]>([]);
  const [activelyFiltered, setActivelyFiltered] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isComponentReady, setIsComponentReady] = useState(false);

  const difficultSubjectsList = useMemo(() => {
    if (!analysisData || !analysisData.performance) return [];
    return analysisData.performance
        .filter(s => s.grade < DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD)
        .map(s => s.subject);
  }, [analysisData]);
  
  const filterAndPrepareVideos = useCallback(async (data: AnalysisData) => {
    setIsLoadingRecommendations(true);
    const focusSubjectsLower = difficultSubjectsList.map(s => s.toLowerCase());
    
    // 1. Get all videos for the student's grade.
    let baseVideoPool = ALL_VIDEOS.filter(video => video.gradeLevel.includes(data.schoolGrade));

    // 2. If user is actively filtering, apply that filter to the pool.
    if (activelyFiltered && selectedFilterSubjects.size > 0) {
        const filterSubjectsLower = Array.from(selectedFilterSubjects).map((s: string) => s.toLowerCase());
        baseVideoPool = baseVideoPool.filter(video => filterSubjectsLower.includes(video.subject.toLowerCase()));
    }

    // 3. Sort the videos.
    //    - Priority 1: Subjects the student has difficulty with (from difficultSubjectsList).
    //    - Priority 2: 'GoiásTec' source.
    //    - Priority 3: Alphabetical by title for consistency.
    const sortedVideos = [...baseVideoPool].sort((a, b) => {
        const aIsFocus = focusSubjectsLower.includes(a.subject.toLowerCase());
        const bIsFocus = focusSubjectsLower.includes(b.subject.toLowerCase());

        if (aIsFocus && !bIsFocus) return -1; // a is priority
        if (!aIsFocus && bIsFocus) return 1;  // b is priority

        // If both are focus subjects or neither are, prioritize by source
        const aIsGoiasTec = a.source === 'GoiásTec';
        const bIsGoiasTec = b.source === 'GoiásTec';
        
        if (aIsGoiasTec && !bIsGoiasTec) return -1;
        if (!aIsGoiasTec && bIsGoiasTec) return 1;

        return a.title.localeCompare(b.title); // Final deterministic sort
    });
    
    // 4. Generate justifications for the top N videos to provide context.
    const videosToJustify = sortedVideos.slice(0, 3); // Reduzido de 9 para 3 para evitar rate limits 
    
    // Process sequentially to avoid rate limiting
    const justifiedVideos = [];
    for (const video of videosToJustify) {
      const needsJustification = !video.justification || video.justification.trim() === "" || video.justification.includes("geral");
      const justification = needsJustification && data.performance.length > 0 
                            ? await generateVideoJustification(video, data) 
                            : (video.justification || "Vídeo recomendado para complementar seus estudos.");
      justifiedVideos.push({ ...video, justification });
    }
    
    const remainingVideos = sortedVideos.slice(videosToJustify.length);
    
    setRecommendedVideos([...justifiedVideos, ...remainingVideos]);
    setIsLoadingRecommendations(false);
  }, [difficultSubjectsList, activelyFiltered, selectedFilterSubjects]);

  useEffect(() => {
    if (analysisData && analysisData.performance) {
      const subjectsFromPerformance = analysisData.performance.map(p => p.subject);
      setAllSubjectsForGrade(subjectsFromPerformance);
      
      // Don't pre-select filters. Prioritization is now handled by sorting.
      setSelectedFilterSubjects(new Set());
      setActivelyFiltered(false); 
      
      const loadInitialData = async () => {
        await filterAndPrepareVideos(analysisData);
        setIsComponentReady(true);
      };
      loadInitialData();

    } else {
        setIsComponentReady(true);
    }
  }, [analysisData]); // Removendo filterAndPrepareVideos das dependências

  const handleSubjectFilterChange = (subject: string) => {
    setSelectedFilterSubjects(prev => {
        const newSet = new Set(prev);
        if (newSet.has(subject)) {
            newSet.delete(subject);
        } else {
            newSet.add(subject);
        }
        return newSet;
    });
  };

  const handleRefineSearch = async () => {
    if (analysisData) {
        setActivelyFiltered(true);
        await filterAndPrepareVideos(analysisData);
        if (window.innerWidth < 768) { 
          setIsSidebarOpen(false);
        }
    }
  };

  const handleSelectVideo = (video: VideoRecommendation) => {
    setSelectedVideo(video);
  };

  const handleCloseVideoModal = () => {
    setSelectedVideo(null);
  };

  if (!analysisData) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-xl text-gray-700">Nenhum dado de análise disponível.</p>
        <button
          onClick={onResetAnalysis}
          className="mt-4 bg-brandBlue hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-150"
          aria-label="Voltar para o painel"
        >
          Voltar ao Painel
        </button>
      </div>
    );
  }

  const displayFocusSubjectsPills = activelyFiltered ? Array.from(selectedFilterSubjects) : difficultSubjectsList;
  const hasInitialDifficulties = difficultSubjectsList.length > 0;

  const getTitle = () => {
    if (activelyFiltered) {
      return "Resultados da Busca Refinada";
    }
    if (hasInitialDifficulties) {
      return "Recomendações de Reforço";
    }
    return "Explore Vídeos para Estudo";
  };

  const sidebarBaseClasses = "bg-gray-50 p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out md:sticky md:top-24 md:self-start";
  const sidebarWidthClass = "md:w-1/4 lg:w-1/5 xl:w-1/6";

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onResetAnalysis}
          className="inline-flex items-center text-brandBlue hover:text-blue-700 transition-colors"
          aria-label="Voltar para a seleção de bimestre"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Voltar
        </button>
        <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-md bg-brandGreen text-white hover:bg-brandGreenDark focus:outline-none"
            aria-label={isSidebarOpen ? "Fechar filtros" : "Abrir filtros"}
            aria-expanded={isSidebarOpen}
        >
            <AdjustmentsHorizontalIcon className="h-6 w-6"/>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        <aside 
            className={`${sidebarBaseClasses} ${isSidebarOpen ? `${sidebarWidthClass} block` : 'hidden'} md:block`}
            aria-labelledby="filter-sidebar-heading"
        >
            <h4 id="filter-sidebar-heading" className="text-lg font-semibold text-brandDarkGray mb-1">Filtrar por Disciplina</h4>
            <p className="text-xs text-gray-500 mb-3">Selecione para refinar as recomendações.</p>
            <div className="space-y-2 max-h-80 md:max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {allSubjectsForGrade.length > 0 ? allSubjectsForGrade.map(subject => (
                    <label key={subject} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-brandGreen rounded border-gray-300 focus:ring-brandGreen focus:ring-offset-0"
                            checked={selectedFilterSubjects.has(subject)}
                            onChange={() => handleSubjectFilterChange(subject)}
                            aria-labelledby={`subject-label-${subject.replace(/\s+/g, '-')}`}
                        />
                        <span id={`subject-label-${subject.replace(/\s+/g, '-')}`} className="text-sm text-gray-700 select-none">{subject}</span>
                    </label>
                )) : <p className="text-sm text-gray-500">Nenhuma disciplina carregada.</p>}
            </div>
            {isComponentReady && (
              <>
                <button
                    onClick={handleRefineSearch}
                    className="mt-4 w-full bg-brandGreen hover:bg-brandGreenDark text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150"
                    disabled={isLoadingRecommendations || allSubjectsForGrade.length === 0}
                    aria-label="Refinar busca de vídeos com as disciplinas selecionadas"
                >
                    {isLoadingRecommendations ? <LoadingSpinner size="sm" /> : "Refinar Busca"}
                </button>
              </>
            )}
        </aside>

        <main className="flex-1 min-w-0">
            {isLoadingRecommendations && <LoadingSpinner message="Atualizando recomendações..." />}
            
            {!isLoadingRecommendations && recommendedVideos.length > 0 && (
              <div className="mb-8">
                 <h2 className="text-3xl font-bold text-brandDarkGray mb-2">
                    {getTitle()}
                 </h2>
                {displayFocusSubjectsPills.length > 0 && (
                  <div className="mb-4 text-sm text-gray-700">
                      <span>Foco em: </span>
                      {displayFocusSubjectsPills.map((subject) => (
                          <span key={subject} className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mr-2 mb-1 ${difficultSubjectsList.includes(subject) && !activelyFiltered ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {subject}
                          </span>
                      ))}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recommendedVideos.map(video => (
                    <VideoCard key={video.id} video={video} onSelectVideo={handleSelectVideo} />
                  ))}
                </div>
              </div>
            )}
            
            {!isLoadingRecommendations && recommendedVideos.length === 0 && (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-700 mt-6">
                  <h4 className="font-semibold flex items-center"><LightBulbIcon className="h-5 w-5 mr-2" />Nenhuma Recomendação Encontrada</h4>
                  <p className="text-sm">
                      Não encontramos vídeos para os critérios selecionados ({activelyFiltered ? "filtros ativos" : "dificuldades identificadas"}). 
                      Tente ajustar os filtros para encontrar outros conteúdos.
                  </p>
              </div>
            )}
        </main>
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={handleCloseVideoModal}
          onGenerateQuiz={(difficulty) => onSelectVideoForQuiz(selectedVideo, difficulty)}
          currentQuiz={currentQuiz}
          currentQuizVideo={currentQuizVideo}
          currentQuizDifficulty={currentQuizDifficulty}
          isQuizLoading={isQuizLoading}
          onReportVideoIssue={onReportVideoIssue}
        />
      )}
    </div>
  );
};

export default AnalysisResult;
