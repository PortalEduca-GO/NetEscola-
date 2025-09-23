

import { SchoolGrade, VideoRecommendation, Bimester } from './types';

export const APP_NAME = "NetEscola+";

export const SCHOOL_GRADES_OPTIONS = [
  SchoolGrade.ANO_9_EF,
  SchoolGrade.SERIE_1_EM,
  SchoolGrade.SERIE_2_EM,
  SchoolGrade.SERIE_3_EM,
];

export const BIMESTER_OPTIONS = [
  Bimester.BIM_1,
  Bimester.BIM_2,
  Bimester.BIM_3,
  Bimester.BIM_4,
];

export const SUBJECTS_BY_GRADE: Record<SchoolGrade, string[]> = {
  [SchoolGrade.ANO_9_EF]: ["Português", "Matemática", "Ciências", "História", "Geografia", "Inglês", "Física", "Química", "Biologia"],
  [SchoolGrade.SERIE_1_EM]: ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês"],
  [SchoolGrade.SERIE_2_EM]: ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês"],
  [SchoolGrade.SERIE_3_EM]: ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês"],
};

const ALLOWED_GRADES_SET = new Set(SCHOOL_GRADES_OPTIONS);

const filterVideosByAllowedGrades = (videos: VideoRecommendation[]): VideoRecommendation[] => {
  return videos
    .map(video => {
      const filteredGradeLevels = video.gradeLevel.filter(gl => ALLOWED_GRADES_SET.has(gl));
      return { ...video, gradeLevel: filteredGradeLevels };
    })
    .filter(video => video.gradeLevel.length > 0);
};

// --- Lista de Vídeos Educacionais ---
// A lista é curada para oferecer recomendações relevantes.
// A propriedade 'source' indica a origem do vídeo.
// 'GoiásTec' é priorizado nas recomendações para garantir alinhamento com o currículo.
const RAW_VIDEOS: VideoRecommendation[] = [
  // --- Goiás Tec ---
  {
    id: "gt9_mat_1",
    title: "Equações de 2º Grau - Aula Completa (10/02) (9º ANO)",
    description: "Aprenda tudo sobre equações do segundo grau, fórmula de Bhaskara e resolução de problemas.",
    thumbnailUrl: "https://i.ytimg.com/vi/R088uR4N6lY/hqdefault.jpg", 
    videoUrl: "https://www.youtube.com/watch?v=R088uR4N6lY&list=PLwBABA4s6M7fQc_v4qO5f7_Z9k8nJ6L5t",
    subject: "Matemática",
    gradeLevel: [SchoolGrade.ANO_9_EF],
    source: 'GoiásTec',
  },
  {
    id: "gt9_port_1",
    title: "Orações Coordenadas e Subordinadas - Revisão (15/03) (9º ANO)",
    description: "Revise os tipos de orações e como identificá-las em textos.",
    thumbnailUrl: "https://i.ytimg.com/vi/videoseries?list=PLwBABA4s6M7e-8w9xY5Z_zO9u7L4k3J7m&index=2&random=2",
    videoUrl: "https://www.youtube.com/watch?v=videoseries&list=PLwBABA4s6M7e-8w9xY5Z_zO9u7L4k3J7m", 
    subject: "Português",
    gradeLevel: [SchoolGrade.ANO_9_EF],
    source: 'GoiásTec',
  },
  {
    id: "gt1_fis_1",
    title: "Introdução à Cinemática - MRU e MRUV (25/04) (1ª SÉRIE EM)",
    description: "Conceitos básicos de cinemática, movimento retilíneo uniforme e uniformemente variado.",
    thumbnailUrl: "https://i.ytimg.com/vi/gXWXkS2t0sM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=gXWXkS2t0sM&list=PLwBABA4s6M7dPc0xR_T8fU_wI9yS5K_oP",
    subject: "Física",
    gradeLevel: [SchoolGrade.SERIE_1_EM],
    source: 'GoiásTec',
  },
  {
    id: "gt1_qui_1",
    title: "Modelos Atômicos - Dalton, Thomson, Rutherford, Bohr (10/05) (1ª SÉRIE EM)",
    description: "Evolução dos modelos atômicos e suas características.",
    thumbnailUrl: "https://i.ytimg.com/vi/videoseries?list=PLwBABA4s6M7cK_l_m_nJ8hP_tQ_eR2Y_z&index=4&random=4",
    videoUrl: "https://www.youtube.com/watch?v=videoseries&list=PLwBABA4s6M7cK_l_m_nJ8hP_tQ_eR2Y_z",
    subject: "Química",
    gradeLevel: [SchoolGrade.SERIE_1_EM],
    source: 'GoiásTec',
  },
   {
    id: "gt2_bio_1",
    title: "Genética Mendeliana - Leis de Mendel (05/06) (2ª SÉRIE EM)",
    description: "Explore as leis fundamentais da hereditariedade propostas por Gregor Mendel.",
    thumbnailUrl: "https://i.ytimg.com/vi/videoseries?list=PLwBABA4s6M7fG_h_J_kL9oP_x_T_wR_yQ&random=5",
    videoUrl: "https://www.youtube.com/watch?v=videoseries&list=PLwBABA4s6M7fG_h_J_kL9oP_x_T_wR_yQ",
    subject: "Biologia",
    gradeLevel: [SchoolGrade.SERIE_2_EM],
    source: 'GoiásTec',
  },
   {
      id: "gt2_qui_1", 
      title: "QUÍMICA - SOLUÇÕES: CONCEITOS E CLASSIFICAÇÕES - AULA 01 (15/05) (2ª Série)",
      description: "Introdução ao estudo de soluções químicas, seus conceitos e classificações.",
      thumbnailUrl: "https://i.ytimg.com/vi/7BMQn6nN0hM/hqdefault.jpg", 
      videoUrl: "https://www.youtube.com/watch?v=7BMQn6nN0hM&list=PLwBABA4s6M7dE_X_yZ_wQ_v_Y_sP_l_K_j&index=1",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_2_EM],
      source: 'GoiásTec',
  },
  {
      id: "gt3_hist_1", 
      title: "HISTÓRIA - A CRISE DE 1929 E SEUS REFLEXOS NO BRASIL - AULA 01 (05/08) (3ª Série)",
      description: "Análise da Crise de 1929 e como ela impactou o Brasil.",
      thumbnailUrl: "https://i.ytimg.com/vi/3gZzY2qQwSs/hqdefault.jpg", 
      videoUrl: "https://www.youtube.com/watch?v=3gZzY2qQwSs&list=PLwBABA4s6M7eP_q_R_tY_sW_z_X_l_I_u&index=1", 
      subject: "História",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
  // --- 3ª Série EM - Química (GoiásTec) ---
  {
      id: "gt3_qui_termoquimica",
      title: "QUÍMICA - TERMOQUÍMICA: ENTALPIA E LEI DE HESS - AULA 01 (12/08) (3ª Série)",
      description: "Aprenda sobre Termoquímica, incluindo conceitos de entalpia, reações exotérmicas, endotérmicas e a Lei de Hess. Conteúdo do GoiásTec para a 3ª Série do Ensino Médio.",
      thumbnailUrl: "https://i.ytimg.com/vi/FqX3qLwN84Y/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=FqX3qLwN84Y",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
  {
      id: "gt3_qui_velocidade",
      title: "QUÍMICA - VELOCIDADE DAS REAÇÕES - AULA 02 (20/10) (3ª Série)",
      description: "Entenda os fatores que influenciam a velocidade das reações químicas. Conteúdo do GoiásTec para a 3ª Série do Ensino Médio.",
      thumbnailUrl: "https://i.ytimg.com/vi/9_b3oY7s6c4/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=9_b3oY7s6c4",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
  {
      id: "gt3_qui_equilibrio",
      title: "QUÍMICA - EQUILÍBRIO QUÍMICO - AULA 03 (25/10) (3ª Série)",
      description: "Estude o conceito de equilíbrio químico e as constantes Kc e Kp. Conteúdo do GoiásTec para a 3ª Série do Ensino Médio.",
      thumbnailUrl: "https://i.ytimg.com/vi/G8m1tq3h8y8/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=G8m1tq3h8y8",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
  // --- 3ª Série EM - Biologia (GoiásTec) ---
  {
      id: "gt3_bio_genetica_conceitos",
      title: "BIOLOGIA - GENÉTICA: CONCEITOS BÁSICOS - AULA 01 (10/09) (3ª Série)",
      description: "Introdução aos conceitos fundamentais da Genética. Conteúdo do GoiásTec para a 3ª Série do Ensino Médio.",
      thumbnailUrl: "https://i.ytimg.com/vi/L2g_sM8rJ8g/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=L2g_sM8rJ8g",
      subject: "Biologia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
  // --- Outras Fontes (Qualidade, para complementar) ---
  {
      id: "yt_yfl5OSnLpSc",
      title: "Geopolítica Mundial e Conflitos Contemporâneos",
      description: "Uma análise aprofundada da geopolítica atual, globalização e os principais focos de tensão no mundo. Essencial para o 3º ano do Ensino Médio.",
      thumbnailUrl: "https://i.ytimg.com/vi/yfl5OSnLpSc/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=yfl5OSnLpSc",
      subject: "Geografia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'Outro',
  },
  {
      id: "yt_2cBoGIraLgE",
      title: "Blocos Econômicos e a Nova Ordem Mundial",
      description: "Entenda a formação e o papel dos blocos econômicos como Mercosul, União Europeia e APEC na economia globalizada.",
      thumbnailUrl: "https://i.ytimg.com/vi/2cBoGIraLgE/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=2cBoGIraLgE",
      subject: "Geografia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'Outro',
  },
  {
      id: "yt_Yln0xSwRVtQ",
      title: "Fontes de Energia (Vestibular) (18/02)",
      description: "Aprenda sobre fontes de energia renováveis e não renováveis, matriz energética brasileira e mundial e seus impactos ambientais.",
      thumbnailUrl: "https://i.ytimg.com/vi/Yln0xSwRVtQ/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=Yln0xSwRVtQ",
      subject: "Geografia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'GoiásTec',
  },
   {
      id: "yt_99tWmYj2Dn0",
      title: "Conflitos no Campo e Questão Agrária (Vestibular)",
      description: "Estude a estrutura fundiária no Brasil, os movimentos sociais no campo e os principais conflitos agrários da história.",
      thumbnailUrl: "https://i.ytimg.com/vi/99tWmYj2Dn0/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=99tWmYj2Dn0",
      subject: "Geografia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'Outro',
  },
  {
      id: "yt_nnn0WieX35o",
      title: "Genética Molecular: DNA, RNA e Síntese Proteica",
      description: "Aprofunde-se no dogma central da biologia, entendendo a replicação do DNA, transcrição e tradução para a síntese de proteínas.",
      thumbnailUrl: "https://i.ytimg.com/vi/nnn0WieX35o/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=nnn0WieX35o",
      subject: "Biologia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'Outro',
  },
  {
      id: "yt_RPFwM1aLycw",
      title: "1ª Lei de Mendel (Vestibular)",
      description: "Compreenda a Primeira Lei de Mendel (Lei da Segregação) e os conceitos básicos de hereditariedade, como alelos, genótipo e fenótipo.",
      thumbnailUrl: "https://i.ytimg.com/vi/RPFwM1aLycw/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=RPFwM1aLycw",
      subject: "Biologia",
      gradeLevel: [SchoolGrade.SERIE_3_EM, SchoolGrade.SERIE_2_EM],
      source: 'Outro',
  },
  {
      id: "yt_joYg7Ff9Dtw",
      title: "Grupos Sanguíneos e Fator Rh (Vestibular)",
      description: "Estude os sistemas sanguíneos ABO e Rh, a genética envolvida, e a importância da compatibilidade para transfusões de sangue.",
      thumbnailUrl: "https://i.ytimg.com/vi/joYg7Ff9Dtw/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=joYg7Ff9Dtw",
      subject: "Biologia",
      gradeLevel: [SchoolGrade.SERIE_3_EM, SchoolGrade.SERIE_2_EM],
      source: 'Outro',
  },
  {
      id: "yt_fWrY94eeqqo",
      title: "Herança Ligada ao Sexo (Vestibular)",
      description: "Aprenda como características são herdadas através dos cromossomos sexuais, estudando casos como daltonismo e hemofilia.",
      thumbnailUrl: "https://i.ytimg.com/vi/fWrY94eeqqo/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=fWrY94eeqqo",
      subject: "Biologia",
      gradeLevel: [SchoolGrade.SERIE_3_EM],
      source: 'Outro',
  },
  {
      id: "yt_wGR1IF93mz0",
      title: "Deslocamento de Equilíbrio: Le Chatelier (Vestibular)",
      description: "Estude o Princípio de Le Chatelier para prever como mudanças de concentração, pressão e temperatura afetam um sistema em equilíbrio.",
      thumbnailUrl: "https://i.ytimg.com/vi/wGR1IF93mz0/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=wGR1IF93mz0",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_3_EM, SchoolGrade.SERIE_2_EM],
      source: 'Outro',
  },
  {
      id: "yt_GeT43CUA1Sg",
      title: "Equilíbrio Iônico da Água: pH e pOH (Vestibular)",
      description: "Aprenda sobre o produto iônico da água e como calcular o pH e o pOH para determinar a acidez ou basicidade de soluções.",
      thumbnailUrl: "https://i.ytimg.com/vi/GeT43CUA1Sg/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=GeT43CUA1Sg",
      subject: "Química",
      gradeLevel: [SchoolGrade.SERIE_3_EM, SchoolGrade.SERIE_2_EM],
      source: 'Outro',
  }
];

export const ALL_VIDEOS: VideoRecommendation[] = filterVideosByAllowedGrades(RAW_VIDEOS);

export const DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD = 60; 

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';