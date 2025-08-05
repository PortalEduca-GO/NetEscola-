
import React, { useState, useEffect, useCallback } from 'react';
import { VideoRecommendation, QuizDifficulty, QuizQuestion } from '../types';
import QuizComponent from './Quiz';
import VideoErrorHandler from './VideoErrorHandler';
import { generateQuizForVideo } from '../services/geminiService';
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

  if (!video) return null;

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      // Verifica se é uma URL de playlist direta
      const playlistDirectMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
      if (playlistDirectMatch) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistDirectMatch[1]}`;
      }
      
      // Primeiro, verifica se é uma URL de playlist
      const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      
      // Extrai o ID do vídeo
      const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      
      // Se o v= contém "videoseries", tenta usar apenas a playlist
      if (url.includes('v=videoseries') && playlistMatch) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
      }
      
      // Se tem um ID de vídeo válido
      if (videoIdMatch && videoIdMatch[1] !== 'videoseries') {
        let embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        // Adiciona a playlist se existir
        if (playlistMatch) {
          embedUrl += `?list=${playlistMatch[1]}`;
        }
        return embedUrl;
      }
      
      // Se só tem playlist, usa o primeiro vídeo da playlist
      if (playlistMatch) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
      }
      
      return null;
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
      return null;
    }
  };
  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);
  
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
        
        {embedUrl ? (
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
            onReportIssue={onReportVideoIssue}
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
