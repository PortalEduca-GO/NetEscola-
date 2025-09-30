// Serviço para buscar vídeos do canal Goiás Tec
import { VideoRecommendation, SchoolGrade } from '../types';
import { ALL_VIDEOS, SUBJECT_NAME_MAPPING } from '../constants';

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
  // Busca os vídeos mais recentes do canal GoiásTec para a série informada
  // Busca os vídeos mais recentes do canal GoiásTec para a série informada
  async getRecentVideos(maxResults: number = 20, gradeLevel?: string): Promise<VideoRecommendation[]> {
    if (!this.API_KEY) return [];
    const channelId = this.getChannelIdForGrade(gradeLevel);
    const url = `https://www.googleapis.com/youtube/v3/search?key=${this.API_KEY}&channelId=${channelId}&type=video&part=snippet&maxResults=${maxResults}&order=date`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return this.parseYouTubeVideos(data.items || []);
  }
  // Busca todas as playlists do canal e retorna um mapa disciplina -> playlistId
  private async getPlaylistsByDiscipline(): Promise<Record<string, string>> {
  if (!this.API_KEY) return {};
  // Usa a série do aluno para buscar no canal correto
  // Por padrão, playlists são buscadas para a 3ª série se não informado
  const channelId = this.getChannelIdForGrade();
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${this.API_KEY}`;
  const response = await fetch(url);
    if (!response.ok) return {};
    const data = await response.json();
    const playlists: Record<string, string> = {};
    for (const item of data.items || []) {
      const title = (item.snippet.title || '').toLowerCase();
      // Mapeia disciplina pelo nome da playlist (ex: "Língua Portuguesa")
      for (const disciplina of Object.keys(this.SUBJECT_KEYWORDS)) {
        if (title.includes(disciplina.toLowerCase())) {
          playlists[disciplina] = item.id;
        }
      }
    }
    return playlists;
  }

  // Busca vídeos de uma playlist específica
  private async getVideosFromPlaylist(playlistId: string, maxResults: number = 20): Promise<VideoRecommendation[]> {
    if (!this.API_KEY) return [];
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${this.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.items || []).map((item: any) => {
      const s = item.snippet;
      return {
        id: item.id,
        title: s.title,
        description: s.description,
        thumbnailUrl: s.thumbnails?.high?.url || s.thumbnails?.default?.url || '',
        videoUrl: `https://www.youtube.com/watch?v=${s.resourceId?.videoId || s.videoId}`,
        subject: this.identifySubject(s.title, s.description),
        gradeLevel: this.determineGradeLevel(s.title, s.description),
        source: 'GoiásTec',
        isRecommended: true,
      };
    });
  }
  // IDs dos canais do GoiásTec por série
  private readonly CHANNEL_IDS: Record<string, string> = {
    '2ª Série EM': 'UCM5U9EpaRFrJh5Wt3dXggKg', // Canal @goiastec.2serie
    '3ª Série EM': 'UCwm7h_0nqI8I5I1c5K5q5qw', // Canal @goiastec.3serie
  };

  // Retorna o canal correto para a série
  private getChannelIdForGrade(grade?: string): string {
    if (grade && this.CHANNEL_IDS[grade]) return this.CHANNEL_IDS[grade];
    // fallback para 3ª série
    return this.CHANNEL_IDS['3ª Série EM'];
  }
  private readonly API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  
  // Cache para evitar muitas requisições
  private cache = new Map<string, { data: VideoRecommendation[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  // Mapeamento de termos para disciplinas
  private readonly SUBJECT_KEYWORDS = {
    'Matemática': ['matemática', 'matematica', 'álgebra', 'algebra', 'geometria', 'trigonometria', 'função', 'funcao', 'equação', 'equacao'],
    'Português': [
      'português', 'portugues', 'língua portuguesa', 'lingua portuguesa',
      'literatura', 'gramática', 'gramatica', 'redação', 'redacao', 'interpretação', 'interpretacao',
      'estudo orientado',
      // Combinações comuns
      'português (língua portuguesa)', 'português - língua portuguesa', 'português língua portuguesa',
      // Para pegar títulos como "Estudo Orientado - Português (Língua Portuguesa)"
      'estudo orientado português', 'estudo orientado lingua portuguesa', 'estudo orientado língua portuguesa',
      // Para pegar títulos que tenham só "Estudo Orientado" e a disciplina separada
      'estudo orientado',
    ],
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
  async searchVideosBySubject(subject: string, maxResults: number = 20, gradeLevel?: string): Promise<VideoRecommendation[]> {
    console.log(`🔍 BUSCANDO VÍDEOS PARA: ${subject} (gradeLevel: ${gradeLevel})`);
    console.log('✅ API Key disponível:', !!this.API_KEY);
    
    // Adiciona o bimestre ao cacheKey se disponível
    let bimester = '';
    if (typeof gradeLevel === 'string' && gradeLevel.match(/bimestre|bimester|bim\d/i)) {
      bimester = gradeLevel;
    }
    const cacheKey = `${subject}_${maxResults}_${bimester}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📋 Retornando ${cached.data.length} vídeos do cache`);
      return cached.data;
    }

    try {
      if (!this.API_KEY) {
        return [];
      }
      const channelId = this.getChannelIdForGrade(gradeLevel);
      const keywords = this.SUBJECT_KEYWORDS[subject as keyof typeof this.SUBJECT_KEYWORDS] || [subject.toLowerCase()];

      // Realiza uma busca para cada palavra-chave e agrega os resultados
      let allItems: YouTubeSearchResult[] = [];
      const seenVideoIds = new Set<string>();
      for (const keyword of keywords) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${this.API_KEY}&channelId=${channelId}&q=${encodeURIComponent(keyword)}&type=video&part=snippet&maxResults=${maxResults}&order=relevance`;
        const response = await fetch(searchUrl);
        if (!response.ok) {
          console.warn(`Erro na busca para keyword '${keyword}': ${response.status}`);
          continue;
        }
        const data = await response.json();
        for (const item of (data.items || [])) {
          if (item.id && item.id.videoId && !seenVideoIds.has(item.id.videoId)) {
            allItems.push(item);
            seenVideoIds.add(item.id.videoId);
          }
        }
      }
      const videos = this.parseYouTubeVideos(allItems, subject);
      this.cache.set(cacheKey, { data: videos, timestamp: Date.now() });
      return videos;
    } catch (error) {
      console.error('Erro ao buscar vídeos do canal Goiás Tec:', error);
      return [];
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
    // Aplica mapeamento de nomes de disciplinas oficiais para nomes de vídeos
    const mappedSubject = SUBJECT_NAME_MAPPING[subject] || subject;
    
    console.log(`🔍 FILTRANDO VÍDEOS PARA SUBJECT: "${subject}" (mapeado para: "${mappedSubject}")`);
    console.log(`📊 TOTAL DE VÍDEOS DISPONÍVEIS: ${ALL_VIDEOS.length}`);
    
    // Importa os vídeos estáticos e filtra por disciplina
    const filteredVideos = ALL_VIDEOS.filter((video: VideoRecommendation) => 
      video.subject === mappedSubject && video.source === 'GoiásTec'
    );
    
    console.log(`🎯 VÍDEOS ENCONTRADOS PARA "${mappedSubject}": ${filteredVideos.length}`);
    console.log('📋 VÍDEOS DISPONÍVEIS:', ALL_VIDEOS.map(v => `${v.subject} (${v.source})`).slice(0, 10));
    
    return filteredVideos;
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
