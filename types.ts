export enum SchoolGrade {
  ANO_9_EF = "9º Ano EF",
  SERIE_1_EM = "1ª Série EM",
  SERIE_2_EM = "2ª Série EM",
  SERIE_3_EM = "3ª Série EM",
}

export enum Bimester {
  BIM_1 = "1º Bimestre",
  BIM_2 = "2º Bimestre",
  BIM_3 = "3º Bimestre",
  BIM_4 = "4º Bimestre",
}

export interface SubjectPerformance {
  subject: string;
  grade: number; // 0-100 
}

export interface SchoolReportAISuggestions { // Optional: what AI might find about grade/bimester
  suggestedSchoolGrade?: SchoolGrade;
  suggestedBimester?: Bimester;
}

export interface SchoolReportAnalysisResult {
  subjectsPerformance: SubjectPerformance[];
  aiSuggestions?: SchoolReportAISuggestions; 
}

export interface AnalysisData {
  schoolGrade: SchoolGrade;
  bimester: Bimester;
  performance: SubjectPerformance[]; // This will be from AI if file is used, or simulated
  fileUploadedName?: string;
}

export interface VideoRecommendation {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string; // URL to image
  videoUrl: string; // YouTube video URL
  subject: string;
  gradeLevel: SchoolGrade[];
  justification?: string; // AI generated
  source?: 'GoiásTec' | 'Outro';
}

export interface QuizQuestion {
  question: string;

  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export enum QuizDifficulty {
  INICIANTE = "Iniciante",
  INTERMEDIARIO = "Intermediário",
  AVANCADO = "Avançado",
}

export interface Quiz {
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
}

export interface UserProfile {
  name: string;
  email: string;
  registration: string;
  birthDate: string;
  photoUrl: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string; 
    title?: string; 
  };
}


// --- Novos tipos baseados nas planilhas ---
export interface Student {
  coordRegional: string;
  municipio: string;
  codigoMec: string;
  escola: string;
  codComposicao: string;
  composicao: string;
  serie: SchoolGrade;
  turno: string;
  codTurma: string;
  turma: string;
  matricula: string;
  ordem: string;
  nome: string;
}

export interface StudentGradeRecord {
  codigoMec: string;
  codTurma: string;
  matricula: string;
  codDisciplina: string;
  disciplina: string;
  bimestre: number;
  nota: number;
}

export interface CurriculumPlan {
  codigoMec: string;
  codTurma: string;
  codSerie: string;
  codDisciplina: string;
  disciplina: string;
  codPlanejamento: string;
  numeroAula: number;
  codItemCurriculo: string;
  itemCurriculo: string;
}