
import React, { useState, useEffect, useCallback } from 'react';
import { VideoRecommendation, QuizDifficulty, QuizQuestion } from '../types';
import QuizComponent from './Quiz';
import VideoErrorHandler from './VideoErrorHandler';
import { generateQuizForVideo } from '../services/geminiService';
import { videoValidationService } from '../services/videoValidationService';
import { DocumentArrowDownIcon, LightBulbIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface VideoModalProps {
  video: VideoRecommendation | null;
  onClose: () => void;
  onGenerateQuiz: (difficulty: QuizDifficulty) => void;
  currentQuiz: QuizQuestion[] | null;
  currentQuizVideo: VideoRecommendation | null;
  currentQuizDifficulty: QuizDifficulty | null;
  isQuizLoading: boolean;
  onReportVideoIssue?: (videoId: string, issueType: string) => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ 
    video, 
    onClose, 
    onGenerateQuiz, 
    currentQuiz,
    currentQuizVideo,
    currentQuizDifficulty,
    isQuizLoading,
    onReportVideoIssue
}) => {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!video) return;

    const validateVideo = async () => {
      setIsValidating(true);
      setValidationError(null);
      
      try {
        const validation = await videoValidationService.validateVideo(video);
        setEmbedUrl(validation.embedUrl);
        
        if (!validation.isValid) {
          setValidationError(validation.error || 'Vídeo indisponível');
        }
      } catch (error) {
        console.error('Error validating video:', error);
        setValidationError('Erro ao carregar vídeo');
        setEmbedUrl(null);
      } finally {
        setIsValidating(false);
      }
    };

    validateVideo();
  }, [video]);

  if (!video) return null;

  const shouldDisplayQuiz = !!(video && currentQuizVideo && video.id === currentQuizVideo.id && (currentQuiz || isQuizLoading));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="videoModalTitle"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative custom-scrollbar"
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-800 text-2xl sm:text-3xl font-bold leading-none"
          aria-label="Fechar modal"
        >
          &times;
        </button>

        <h2 id="videoModalTitle" className="text-xl sm:text-2xl font-bold text-brandDarkGray mb-4 pr-8 break-words">{video.title}</h2>
        
        {isValidating ? (
          <div className="w-full aspect-video mb-4 rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
            <LoadingSpinner size="md" message="Validando vídeo..." />
          </div>
        ) : embedUrl ? (
          <div className="w-full mb-4 rounded-lg overflow-hidden shadow-md">
            <iframe
              src={embedUrl}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full aspect-video"
            ></iframe>
          </div>
        ) : (
          <VideoErrorHandler 
            video={video} 
            onReportIssue={(videoId, issueType) => {
              // Marca o vídeo como problemático no serviço de validação
              videoValidationService.markVideoAsProblematic(videoId, issueType);
              // Chama a função original de report
              onReportVideoIssue?.(videoId, issueType);
            }}
          />
        )}

        <div className="mb-4">
          <span className="inline-block bg-brandGreen text-white text-xs font-semibold px-2.5 py-1 rounded-full mr-2 mb-1">
            {video.subject}
          </span>
          {video.gradeLevel.map(gl => (
            <span key={gl} className="inline-block bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full mr-2 mb-1">
              {gl}
            </span>
          ))}
        </div>

        {video.justification && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-brandBlue rounded">
            <h4 className="font-semibold text-brandBlue mb-1 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2" />
              Por que este vídeo?
            </h4>
            <p className="text-sm text-gray-700">{video.justification}</p>
          </div>
        )}
        
        <div className="space-y-6 mt-6">
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-brandDarkGray mb-3 flex items-center">
              <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-brandBlue" />
              Materiais de Apoio
            </h4>
            <div className="pl-7">
              <a 
                href={`https://example.com/pdf/${video.id}.pdf`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-brandBlue hover:text-blue-700 hover:underline text-sm font-medium"
                aria-label="Baixar material complementar ao tema (PDF)"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1.5" />
                Baixar material complementar (PDF)
              </a>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-brandDarkGray mb-3 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
              Teste Seus Conhecimentos
            </h4>
            <div className="pl-7">
              {!shouldDisplayQuiz ? (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
                  {Object.values(QuizDifficulty).map(difficulty => (
                    <button
                      key={difficulty}
                      onClick={() => onGenerateQuiz(difficulty)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 text-sm sm:text-base"
                      aria-label={`Ver quiz nível ${difficulty}`}
                    >
                      Quiz ({difficulty})
                    </button>
                  ))}
                </div>
              ) : null }
              
              {shouldDisplayQuiz && (
                <QuizComponent
                  questions={currentQuiz}
                  difficulty={currentQuizDifficulty || QuizDifficulty.INICIANTE}
                  isLoading={isQuizLoading}
                  videoTitle={video.title}
                />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose} 
          className="mt-8 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150"
          aria-label="Não tenho interesse neste vídeo / Voltar"
        >
          Não Tenho Interesse / Voltar
        </button>
      </div>
    </div>
  );
};

export default VideoModal;
