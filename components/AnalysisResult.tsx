

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnalysisData, VideoRecommendation, SchoolGrade, QuizDifficulty, QuizQuestion } from '../types'; 
import { DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD, ALL_VIDEOS } from '../constants'; 
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import { generateVideoJustification } from '../services/geminiService';
import { videoValidationService } from '../services/videoValidationService';
import { goiasTecChannelService } from '../services/goiasTecChannelService';
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
    
    try {
      let baseVideoPool: VideoRecommendation[] = [];

      // 1. Se o usuário está filtrando por disciplina específica, buscar do canal Goiás Tec
      if (activelyFiltered && selectedFilterSubjects.size > 0) {
        console.log('Buscando vídeos específicos do canal Goiás Tec para:', Array.from(selectedFilterSubjects));
        
        // Buscar vídeos do canal para cada disciplina selecionada
        const channelVideosPromises = Array.from(selectedFilterSubjects).map((subject: string) => 
          goiasTecChannelService.searchVideosBySubject(subject, 15)
        );
        
        const channelVideosBySubject = await Promise.all(channelVideosPromises);
        const channelVideos = channelVideosBySubject.flat();
        
        // Filtrar por série do aluno
        const gradeFilteredChannelVideos = channelVideos.filter(video => 
          video.gradeLevel.includes(data.schoolGrade)
        );

        // Combinar com vídeos estáticos se necessário
        const staticVideos = ALL_VIDEOS.filter(video => 
          video.gradeLevel.includes(data.schoolGrade) &&
          Array.from(selectedFilterSubjects).some((subject: string) => 
            video.subject.toLowerCase() === subject.toLowerCase()
          )
        );

        baseVideoPool = [...gradeFilteredChannelVideos, ...staticVideos];
      } 
      // 2. Para recomendações de reforço, priorizar disciplinas com dificuldade
      else {
        console.log('Buscando vídeos de reforço do canal Goiás Tec para disciplinas:', difficultSubjectsList);
        
        if (difficultSubjectsList.length > 0) {
          // Buscar vídeos do canal para disciplinas com dificuldade
          const reinfocementVideosPromises = difficultSubjectsList.map(subject => 
            goiasTecChannelService.searchVideosBySubject(subject, 10)
          );
          
          const reinforcementVideosBySubject = await Promise.all(reinfocementVideosPromises);
          const reinforcementVideos = reinforcementVideosBySubject.flat();
          
          // Filtrar por série
          const gradeFilteredReinforcementVideos = reinforcementVideos.filter(video => 
            video.gradeLevel.includes(data.schoolGrade)
          );

          // Adicionar vídeos estáticos como complemento
          const staticReinforcementVideos = ALL_VIDEOS.filter(video => 
            video.gradeLevel.includes(data.schoolGrade) &&
            difficultSubjectsList.some(subject => 
              video.subject.toLowerCase() === subject.toLowerCase()
            )
          );

          baseVideoPool = [...gradeFilteredReinforcementVideos, ...staticReinforcementVideos];
        } else {
          // Se não há dificuldades, buscar vídeos recentes do canal
          const recentVideos = await goiasTecChannelService.getRecentVideos(20);
          const gradeFilteredRecentVideos = recentVideos.filter(video => 
            video.gradeLevel.includes(data.schoolGrade)
          );

          const staticVideos = ALL_VIDEOS.filter(video => 
            video.gradeLevel.includes(data.schoolGrade)
          );

          baseVideoPool = [...gradeFilteredRecentVideos, ...staticVideos];
        }
      }

      // 3. Remover duplicatas baseado no videoUrl
      const uniqueVideos = baseVideoPool.filter((video, index, arr) => 
        arr.findIndex(v => v.videoUrl === video.videoUrl) === index
      );

      // 4. Ordenar os vídeos por prioridade
      const sortedVideos = [...uniqueVideos].sort((a, b) => {
        const aIsFocus = focusSubjectsLower.includes(a.subject.toLowerCase());
        const bIsFocus = focusSubjectsLower.includes(b.subject.toLowerCase());

        // Prioridade 1: Disciplinas com dificuldade
        if (aIsFocus && !bIsFocus) return -1;
        if (!aIsFocus && bIsFocus) return 1;

        // Prioridade 2: Vídeos do canal Goiás Tec
        const aIsGoiasTec = a.source === 'GoiásTec';
        const bIsGoiasTec = b.source === 'GoiásTec';
        
        if (aIsGoiasTec && !bIsGoiasTec) return -1;
        if (!aIsGoiasTec && bIsGoiasTec) return 1;

        // Prioridade 3: Ordem alfabética
        return a.title.localeCompare(b.title);
      });

      // 5. Validar vídeos para garantir que estão disponíveis
      const validVideos = await videoValidationService.filterValidVideos(sortedVideos);
      
      // 6. Gerar justificativas para os vídeos principais
      const videosToJustify = validVideos.slice(0, 3);
      
      const justifiedVideos = [];
      for (const video of videosToJustify) {
        const needsJustification = !video.justification || video.justification.trim() === "" || video.justification.includes("geral");
        const justification = needsJustification && data.performance.length > 0 
                              ? await generateVideoJustification(video, data) 
                              : (video.justification || "Vídeo recomendado para complementar seus estudos.");
        justifiedVideos.push({ ...video, justification });
      }
      
      const remainingVideos = validVideos.slice(videosToJustify.length);
      
      setRecommendedVideos([...justifiedVideos, ...remainingVideos]);

    } catch (error) {
      console.error('Erro ao buscar vídeos do canal Goiás Tec:', error);
      
      // Fallback para vídeos estáticos em caso de erro
      let fallbackVideos = ALL_VIDEOS.filter(video => video.gradeLevel.includes(data.schoolGrade));
      
      if (activelyFiltered && selectedFilterSubjects.size > 0) {
        const filterSubjectsLower = Array.from(selectedFilterSubjects).map((s: string) => s.toLowerCase());
        fallbackVideos = fallbackVideos.filter(video => filterSubjectsLower.includes(video.subject.toLowerCase()));
      }
      
      setRecommendedVideos(fallbackVideos);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [difficultSubjectsList, activelyFiltered, selectedFilterSubjects]);

  useEffect(() => {
    if (analysisData && analysisData.performance) {
      // Usar disciplinas da análise de desempenho + disciplinas disponíveis no Goiás Tec
      const subjectsFromPerformance = analysisData.performance.map(p => p.subject);
      const availableSubjectsFromChannel = goiasTecChannelService.getAvailableSubjects();
      
      // Combinar e remover duplicatas
      const allSubjects = [...new Set([...subjectsFromPerformance, ...availableSubjectsFromChannel])];
      setAllSubjectsForGrade(allSubjects);
      
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
    if (activelyFiltered && selectedFilterSubjects.size > 0) {
      return `🎯 Resultados do Canal @goiastec.3serie`;
    }
    if (hasInitialDifficulties) {
      return "📚 Recomendações de Reforço - Canal Goiás Tec";
    }
    return "🎓 Explore Vídeos Educacionais";
  };

  const getSubtitle = () => {
    if (activelyFiltered && selectedFilterSubjects.size > 0) {
      const subjects = Array.from(selectedFilterSubjects).join(', ');
      return `Vídeos encontrados para: ${subjects}`;
    }
    if (hasInitialDifficulties) {
      return `Baseado nas suas dificuldades em: ${difficultSubjectsList.join(', ')}`;
    }
    return "Conteúdo curado do canal oficial Goiás Tec";
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
            <h4 id="filter-sidebar-heading" className="text-lg font-semibold text-brandDarkGray mb-1">Buscar por Disciplina</h4>
            <p className="text-xs text-gray-500 mb-2">Encontre aulas específicas do canal <strong>@goiastec.3serie</strong></p>
            <p className="text-xs text-blue-600 mb-3">💡 Selecione a(s) disciplina(s) que deseja estudar</p>
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
                    aria-label="Buscar vídeos no canal Goiás Tec para as disciplinas selecionadas"
                >
                    {isLoadingRecommendations ? <LoadingSpinner size="sm" /> : 
                      selectedFilterSubjects.size > 0 ? "🔍 Buscar no Canal" : "Ver Recomendações"
                    }
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
                 <p className="text-sm text-gray-600 mb-4">{getSubtitle()}</p>
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
