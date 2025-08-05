// Serviço para buscar vídeos do canal Goiás Tec
import { VideoRecommendation, SchoolGrade } from '../types';

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
  resourceId?: {
    videoId: string;
  };
  publishedAt: string;
}

interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
}

interface YouTubePlaylistItem {
  snippet: YouTubeVideoSnippet;
}

class GoiasTecChannelService {
  private readonly CHANNEL_ID = 'UCwm7h_0nqI8I5I1c5K5q5qw'; // ID do canal @goiastec.3serie
  private readonly CHANNEL_HANDLE = '@goiastec.3serie';
  private readonly API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || '';
  
  // Cache para evitar muitas requisições
  private cache = new Map<string, { data: VideoRecommendation[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  // Mapeamento de termos para disciplinas
  private readonly SUBJECT_KEYWORDS = {
    'Matemática': ['matemática', 'matematica', 'álgebra', 'algebra', 'geometria', 'trigonometria', 'função', 'funcao', 'equação', 'equacao'],
    'Português': ['português', 'portugues', 'literatura', 'gramática', 'gramatica', 'redação', 'redacao', 'interpretação', 'interpretacao'],
    'Física': ['física', 'fisica', 'mecânica', 'mecanica', 'eletricidade', 'óptica', 'optica', 'termodinâmica', 'termodinamica'],
    'Química': ['química', 'quimica', 'orgânica', 'organica', 'inorgânica', 'inorganica', 'estequiometria', 'atomística', 'atomistica'],
    'Biologia': ['biologia', 'botânica', 'botanica', 'zoologia', 'genética', 'genetica', 'ecologia', 'citologia'],
    'História': ['história', 'historia', 'brasil', 'mundo', 'guerra', 'república', 'republica', 'idade média', 'idade media'],
    'Geografia': ['geografia', 'relevo', 'clima', 'população', 'populacao', 'urbana', 'rural', 'cartografia'],
    'Filosofia': ['filosofia', 'ética', 'etica', 'lógica', 'logica', 'epistemologia', 'metafísica', 'metafisica'],
    'Sociologia': ['sociologia', 'sociedade', 'cultura', 'política', 'politica', 'social', 'antropologia'],
    'Inglês': ['inglês', 'ingles', 'english', 'grammar', 'vocabulary', 'conversation']
  };

  // Identifica a disciplina baseada no título e descrição
  private identifySubject(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(this.SUBJECT_KEYWORDS)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return subject;
      }
    }
    
    return 'Geral'; // Disciplina padrão se não conseguir identificar
  }

  // Determina o nível de série baseado no título
  private determineGradeLevel(title: string, description: string): SchoolGrade[] {
    const text = `${title} ${description}`.toLowerCase();
    const grades: SchoolGrade[] = [];

    // Busca por indicadores de série
    if (text.includes('9º ano') || text.includes('9 ano') || text.includes('nono ano')) {
      grades.push(SchoolGrade.ANO_9_EF);
    }
    if (text.includes('1ª série') || text.includes('1 série') || text.includes('primeiro ano') || text.includes('1º ano')) {
      grades.push(SchoolGrade.SERIE_1_EM);
    }
    if (text.includes('2ª série') || text.includes('2 série') || text.includes('segundo ano') || text.includes('2º ano')) {
      grades.push(SchoolGrade.SERIE_2_EM);
    }
    if (text.includes('3ª série') || text.includes('3 série') || text.includes('terceiro ano') || text.includes('3º ano')) {
      grades.push(SchoolGrade.SERIE_3_EM);
    }

    // Se não encontrou série específica, assume ensino médio geral
    if (grades.length === 0) {
      grades.push(SchoolGrade.SERIE_1_EM, SchoolGrade.SERIE_2_EM, SchoolGrade.SERIE_3_EM);
    }

    return grades;
  }

  // Busca vídeos do canal por disciplina
  async searchVideosBySubject(subject: string, maxResults: number = 20): Promise<VideoRecommendation[]> {
    const cacheKey = `${subject}_${maxResults}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Se não tiver API key, retorna vídeos do cache estático filtrados
      if (!this.API_KEY) {
        console.warn('YouTube API key não configurada, usando vídeos estáticos');
        return this.getStaticVideosBySubject(subject);
      }

      const keywords = this.SUBJECT_KEYWORDS[subject as keyof typeof this.SUBJECT_KEYWORDS] || [subject.toLowerCase()];
      const searchQuery = keywords.join(' OR ');

      // Busca vídeos do canal específico
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${this.API_KEY}&channelId=${this.CHANNEL_ID}&q=${encodeURIComponent(searchQuery)}&type=video&part=snippet&maxResults=${maxResults}&order=relevance`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const data = await response.json();
      const videos = this.parseYouTubeVideos(data.items || [], subject);

      this.cache.set(cacheKey, { data: videos, timestamp: Date.now() });
      return videos;

    } catch (error) {
      console.error('Erro ao buscar vídeos do canal Goiás Tec:', error);
      // Fallback para vídeos estáticos
      return this.getStaticVideosBySubject(subject);
    }
  }

  // Busca todos os vídeos recentes do canal
  async getRecentVideos(maxResults: number = 50): Promise<VideoRecommendation[]> {
    const cacheKey = `recent_${maxResults}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      if (!this.API_KEY) {
        console.warn('YouTube API key não configurada, usando vídeos estáticos');
        return this.getAllStaticVideos();
      }

      // Busca vídeos recentes do canal
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${this.API_KEY}&channelId=${this.CHANNEL_ID}&type=video&part=snippet&maxResults=${maxResults}&order=date`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const data = await response.json();
      const videos = this.parseYouTubeVideos(data.items || []);

      this.cache.set(cacheKey, { data: videos, timestamp: Date.now() });
      return videos;

    } catch (error) {
      console.error('Erro ao buscar vídeos recentes do canal:', error);
      return this.getAllStaticVideos();
    }
  }

  // Converte dados do YouTube para VideoRecommendation
  private parseYouTubeVideos(items: YouTubeSearchResult[], preferredSubject?: string): VideoRecommendation[] {
    return items.map((item, index) => {
      const snippet = item.snippet;
      const subject = preferredSubject || this.identifySubject(snippet.title, snippet.description);
      const gradeLevel = this.determineGradeLevel(snippet.title, snippet.description);

      return {
        id: `gt_${item.id.videoId}`,
        title: snippet.title,
        description: snippet.description.substring(0, 300) + (snippet.description.length > 300 ? '...' : ''),
        thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.medium?.url || snippet.thumbnails.default?.url || '',
        videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        subject,
        gradeLevel,
        source: 'GoiásTec',
        bimester: [],
        isRecommended: true
      };
    });
  }

  // Fallback: vídeos estáticos filtrados por disciplina
  private getStaticVideosBySubject(subject: string): VideoRecommendation[] {
    // Importa os vídeos estáticos e filtra por disciplina
    const { ALL_VIDEOS } = require('../constants');
    return ALL_VIDEOS.filter((video: VideoRecommendation) => 
      video.subject === subject && video.source === 'GoiásTec'
    );
  }

  // Fallback: todos os vídeos estáticos do Goiás Tec
  private getAllStaticVideos(): VideoRecommendation[] {
    const { ALL_VIDEOS } = require('../constants');
    return ALL_VIDEOS.filter((video: VideoRecommendation) => video.source === 'GoiásTec');
  }

  // Obtém todas as disciplinas disponíveis
  getAvailableSubjects(): string[] {
    return Object.keys(this.SUBJECT_KEYWORDS);
  }

  // Limpa o cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const goiasTecChannelService = new GoiasTecChannelService();
export default GoiasTecChannelService;
