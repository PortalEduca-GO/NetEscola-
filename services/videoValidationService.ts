import { VideoRecommendation } from '../types';

interface VideoValidationResult {
  isValid: boolean;
  embedUrl: string | null;
  thumbnailUrl?: string;
  error?: string;
}

interface CachedResult {
  result: VideoValidationResult;
  timestamp: number;
  expiresAt: number;
}

class VideoValidationService {
  private cache = new Map<string, CachedResult>();
  private thumbnailCache = new Map<string, { isValid: boolean; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private readonly THUMBNAIL_CACHE_DURATION = 60 * 60 * 1000; // 1 hora
  private readonly API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

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

  // Método para validar thumbnail URL
  async validateThumbnail(thumbnailUrl: string): Promise<string> {
    const cacheKey = thumbnailUrl;
    const cached = this.thumbnailCache.get(cacheKey);
    
    // Verifica cache de thumbnail
    if (cached && Date.now() - cached.timestamp < this.THUMBNAIL_CACHE_DURATION) {
      return cached.isValid ? thumbnailUrl : this.getFallbackThumbnail();
    }

    try {
      const response = await fetch(thumbnailUrl, { method: 'HEAD' });
      const isValid = response.ok;
      
      this.thumbnailCache.set(cacheKey, {
        isValid,
        timestamp: Date.now()
      });
      
      return isValid ? thumbnailUrl : this.getFallbackThumbnail();
    } catch (error) {
      console.warn('Thumbnail validation failed:', thumbnailUrl, error);
      this.thumbnailCache.set(cacheKey, {
        isValid: false,
        timestamp: Date.now()
      });
      return this.getFallbackThumbnail();
    }
  }

  // Método para obter thumbnail de fallback
  private getFallbackThumbnail(): string {
    // Retorna uma imagem placeholder ou uma imagem padrão
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzUuNSA2NUwxNTUuNSA4NUwxMzUuNSAxMDVWNjVaIiBmaWxsPSIjOTVBM0I3Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NUEzQjciPkltYWdlbSBJbmRpc3BvbsOtdmVsPC90ZXh0Pgo8L3N2Zz4=';
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
          thumbnailUrl: video.thumbnailUrl,
          error: 'URL inválida'
        };
        this.cacheResult(cacheKey, result);
        return result;
      }

      // Simula verificação de disponibilidade
      // Em produção, você poderia fazer uma verificação real via YouTube API
      const isAvailable = await this.checkVideoAvailability(embedUrl);
      
      // Valida thumbnail se o vídeo for válido
      let validatedThumbnailUrl = video.thumbnailUrl;
      if (isAvailable && video.thumbnailUrl) {
        validatedThumbnailUrl = await this.validateThumbnail(video.thumbnailUrl);
      }
      
      const result: VideoValidationResult = {
        isValid: isAvailable,
        embedUrl: isAvailable ? embedUrl : null,
        thumbnailUrl: validatedThumbnailUrl,
        error: isAvailable ? undefined : this.getVideoErrorMessage(embedUrl)
      };

      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      const result: VideoValidationResult = {
        isValid: false,
        embedUrl: null,
        thumbnailUrl: video.thumbnailUrl,
        error: 'Erro ao validar vídeo'
      };
      this.cacheResult(cacheKey, result);
      return result;
    }
  }

  private async checkVideoAvailability(embedUrl: string): Promise<boolean> {
    try {
      const videoId = this.extractVideoIdFromEmbed(embedUrl);
      
      if (!videoId) {
        // Se é uma playlist, assume que está disponível
        if (embedUrl.includes('videoseries')) {
          return true;
        }
        return false;
      }

      // Lista de IDs conhecidamente problemáticos (baseado em reports)
      const problematicVideos = this.getProblematicVideoIds();
      
      if (problematicVideos.includes(videoId)) {
        return false;
      }

      // Se temos API key, faz verificação real via YouTube API
      if (this.API_KEY) {
        return await this.checkVideoWithYouTubeAPI(videoId);
      }

      // Fallback: simulação (para desenvolvimento sem API key)
      return Math.random() > 0.05;
      
    } catch (error) {
      console.error('Error checking video availability:', error);
      return false;
    }
  }

  private async checkVideoWithYouTubeAPI(videoId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${this.API_KEY}&part=status,contentDetails`
      );

      if (!response.ok) {
        console.warn(`YouTube API request failed for video ${videoId}: ${response.status}`);
        return false;
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return false; // Vídeo não encontrado
      }

      const video = data.items[0];
      const status = video.status;

      // Verifica se o vídeo está disponível
      if (status.privacyStatus === 'private') {
        return false; // Vídeo privado
      }

      if (status.uploadStatus !== 'processed') {
        return false; // Vídeo não processado
      }

      // Verifica se há restrições regionais
      const contentDetails = video.contentDetails;
      if (contentDetails && contentDetails.regionRestriction) {
        const blockedRegions = contentDetails.regionRestriction.blocked || [];
        // Você pode adicionar lógica para verificar região do usuário
        // Por simplicidade, assume disponível se não há bloqueio explícito
        if (blockedRegions.length > 0) {
          // Para este projeto, assumimos que vídeos bloqueados em algumas regiões ainda podem estar disponíveis
          // Em produção, você verificaria a região do usuário
        }
      }

      return true;

    } catch (error) {
      console.error('Error checking video with YouTube API:', error);
      return false;
    }
  }

  private getVideoErrorMessage(embedUrl: string): string {
    const videoId = this.extractVideoIdFromEmbed(embedUrl);
    
    if (!videoId) {
      return 'URL do vídeo inválida';
    }

    // Verifica se é um vídeo reportado como problemático
    const problematicVideos = this.getProblematicVideoIds();
    if (problematicVideos.includes(videoId)) {
      return 'Vídeo reportado como indisponível pelos usuários';
    }

    // Se temos API key, tenta dar mensagem mais específica
    if (this.API_KEY) {
      // Por enquanto, mensagem genérica. Em produção, poderia armazenar o status da API
      return 'Vídeo não está disponível no YouTube';
    }

    return 'Vídeo temporariamente indisponível';
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
    this.thumbnailCache.clear();
  }

  // Obtém estatísticas do cache
  getCacheStats(): { 
    total: number; 
    expired: number; 
    valid: number; 
    thumbnails: { total: number; valid: number; expired: number } 
  } {
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

    // Estatísticas de thumbnails
    let thumbnailValid = 0;
    let thumbnailExpired = 0;
    this.thumbnailCache.forEach((cached) => {
      if (now - cached.timestamp >= this.THUMBNAIL_CACHE_DURATION) {
        thumbnailExpired++;
      } else {
        thumbnailValid++;
      }
    });

    return {
      total: this.cache.size,
      expired,
      valid,
      thumbnails: {
        total: this.thumbnailCache.size,
        valid: thumbnailValid,
        expired: thumbnailExpired
      }
    };
  }
}

export const videoValidationService = new VideoValidationService();
export default VideoValidationService;
