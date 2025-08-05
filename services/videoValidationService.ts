import { VideoRecommendation } from '../types';

interface VideoValidationResult {
  isValid: boolean;
  embedUrl: string | null;
  error?: string;
}

interface CachedResult {
  result: VideoValidationResult;
  timestamp: number;
  expiresAt: number;
}

class VideoValidationService {
  private cache = new Map<string, CachedResult>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  getYouTubeEmbedUrl(url: string): string | null {
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
  }

  async validateVideo(video: VideoRecommendation): Promise<VideoValidationResult> {
    const cacheKey = video.id;
    const cached = this.cache.get(cacheKey);
    
    // Verifica se temos um resultado em cache válido
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }

    try {
      const embedUrl = this.getYouTubeEmbedUrl(video.videoUrl);
      
      if (!embedUrl) {
        const result: VideoValidationResult = {
          isValid: false,
          embedUrl: null,
          error: 'URL inválida'
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Simula verificação de disponibilidade
      // Em produção, você poderia fazer uma verificação real via YouTube API
      const isAvailable = await this.checkVideoAvailability(embedUrl);
      
      const result: VideoValidationResult = {
        isValid: isAvailable,
        embedUrl: isAvailable ? embedUrl : null,
        error: isAvailable ? undefined : 'Vídeo indisponível'
      };

      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      const result: VideoValidationResult = {
        isValid: false,
        embedUrl: null,
        error: 'Erro ao validar vídeo'
      };
      this.cacheResult(cacheKey, result);
      return result;
    }
  }

  private async checkVideoAvailability(embedUrl: string): Promise<boolean> {
    try {
      // Simula uma checagem mais robusta
      // Em produção, você poderia usar a YouTube Data API v3
      
      // Por enquanto, vamos assumir que certas condições tornam um vídeo indisponível
      const videoId = this.extractVideoIdFromEmbed(embedUrl);
      
      // Lista de IDs conhecidamente problemáticos (baseado em reports)
      const problematicVideos = this.getProblematicVideoIds();
      
      if (videoId && problematicVideos.includes(videoId)) {
        return false;
      }
      
      // Se é uma playlist, assume que está disponível
      if (embedUrl.includes('videoseries')) {
        return true;
      }
      
      // Simulação: 95% dos vídeos são considerados disponíveis
      return Math.random() > 0.05;
      
    } catch (error) {
      console.error('Error checking video availability:', error);
      return false;
    }
  }

  private extractVideoIdFromEmbed(embedUrl: string): string | null {
    const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  private getProblematicVideoIds(): string[] {
    // Lista de IDs de vídeos reportados como problemáticos
    const reports = JSON.parse(localStorage.getItem('videoIssueReports') || '[]');
    return reports
      .filter((report: any) => report.issueType === 'unavailable' || report.issueType === 'deleted')
      .map((report: any) => report.videoId);
  }

  private cacheResult(key: string, result: VideoValidationResult): void {
    const cachedResult: CachedResult = {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    };
    this.cache.set(key, cachedResult);
  }

  // Método para marcar um vídeo como problemático
  markVideoAsProblematic(videoId: string, reason: string): void {
    const reports = JSON.parse(localStorage.getItem('videoIssueReports') || '[]');
    reports.push({
      videoId,
      issueType: reason,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('videoIssueReports', JSON.stringify(reports));
    
    // Remove do cache para forçar nova validação
    this.cache.delete(videoId);
  }

  // Método para filtrar vídeos válidos
  async filterValidVideos(videos: VideoRecommendation[]): Promise<VideoRecommendation[]> {
    const validationPromises = videos.map(async (video) => {
      const validation = await this.validateVideo(video);
      return { video, isValid: validation.isValid };
    });

    const results = await Promise.all(validationPromises);
    return results
      .filter(result => result.isValid)
      .map(result => result.video);
  }

  // Limpa o cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtém estatísticas do cache
  getCacheStats(): { total: number; expired: number; valid: number } {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    this.cache.forEach((cached) => {
      if (now >= cached.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: this.cache.size,
      expired,
      valid
    };
  }
}

export const videoValidationService = new VideoValidationService();
export default VideoValidationService;
