import React, { useState } from 'react';
import { VideoRecommendation } from '../types';

interface VideoErrorHandlerProps {
  video: VideoRecommendation;
  onReportIssue?: (videoId: string, issueType: string) => void;
  errorMessage?: string;
}

type IssueType = 'unavailable' | 'private' | 'deleted' | 'network' | 'other';

const VideoErrorHandler: React.FC<VideoErrorHandlerProps> = ({ 
  video, 
  onReportIssue,
  errorMessage 
}) => {
  const [hasReported, setHasReported] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const issueTypes = [
    { value: 'unavailable', label: 'Vídeo indisponível' },
    { value: 'private', label: 'Vídeo privado' },
    { value: 'deleted', label: 'Vídeo removido' },
    { value: 'network', label: 'Problema de conexão' },
    { value: 'other', label: 'Outro problema' }
  ];

  const handleReportIssue = (issueType: IssueType) => {
    if (onReportIssue) {
      onReportIssue(video.id, issueType);
    }
    setHasReported(true);
    
    // Log para análise (em produção, seria enviado para um serviço de analytics)
    console.log(`Video issue reported: ${video.id} - ${issueType}`, {
      videoTitle: video.title,
      videoUrl: video.videoUrl,
      subject: video.subject,
      gradeLevel: video.gradeLevel,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="w-full aspect-video mb-4 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
      <div className="text-center p-6 max-w-md">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Vídeo Indisponível</h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {errorMessage || 'Este vídeo não pode ser reproduzido no momento. Isso pode acontecer se o vídeo foi removido, está privado ou há problemas temporários.'}
        </p>

        <div className="space-y-3">
          {video.videoUrl && (
            <a 
              href={video.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a2.999 2.999 0 0 0-2.112-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.386.504A2.999 2.999 0 0 0 .502 6.186C0 8.067 0 12 0 12s0 3.933.502 5.814a2.999 2.999 0 0 0 2.112 2.136C4.495 20.454 12 20.454 12 20.454s7.505 0 9.386-.504a2.999 2.999 0 0 0 2.112-2.136C24 15.933 24 12 24 12s0-3.933-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Tentar no YouTube
            </a>
          )}

          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-600 hover:text-gray-800 text-sm underline focus:outline-none"
            >
              {showDetails ? 'Ocultar opções' : 'Reportar problema'}
            </button>
          </div>
        </div>

        {showDetails && !hasReported && (
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <p className="text-xs text-gray-600 mb-2">Ajude-nos a melhorar reportando o problema:</p>
            <div className="grid grid-cols-1 gap-2">
              {issueTypes.map((issue) => (
                <button
                  key={issue.value}
                  onClick={() => handleReportIssue(issue.value as IssueType)}
                  className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border text-gray-700 transition-colors duration-150"
                >
                  {issue.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasReported && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-green-700">Obrigado pelo feedback!</p>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <p>Sugestão: Explore outros vídeos relacionados ao tema <strong>{video.subject}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default VideoErrorHandler;
