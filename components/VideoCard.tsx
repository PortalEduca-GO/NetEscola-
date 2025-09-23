import React from 'react';
import { VideoRecommendation } from '../types';
import { VideoCameraIcon } from './icons';

interface VideoCardProps {
  video: VideoRecommendation;
  onSelectVideo: (video: VideoRecommendation) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onSelectVideo }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col h-full">
      <div className="relative">
        <img 
            src={video.thumbnailUrl || `https://picsum.photos/seed/${video.id}/400/225`} 
            alt={`Thumbnail para ${video.title}`} 
            className="w-full h-48 object-cover" 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop if picsum also fails
                target.src = `https://picsum.photos/seed/${video.id}/400/225`;
            }}
        />
        <div className="absolute top-2 right-2 bg-brandGreen text-white px-2 py-1 text-xs font-semibold rounded">
          {video.subject}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-brandDarkGray mb-2 leading-tight h-14 overflow-hidden">{video.title}</h3>
        <p className="text-sm text-gray-600 mb-3 flex-grow h-20 overflow-hidden">
          {video.description}
        </p>
        <button
          onClick={() => onSelectVideo(video)}
          className="mt-auto w-full bg-brandBlue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center"
          aria-label={`Assistir vídeo: ${video.title}`}
        >
          <VideoCameraIcon className="h-5 w-5 mr-2" />
          Assistir Agora
        </button>
      </div>
    </div>
  );
};

export default VideoCard;