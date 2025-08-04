

import { GoogleGenAI } from "@google/genai";
import { Quiz, QuizDifficulty, QuizQuestion, VideoRecommendation, AnalysisData, GroundingChunk, SchoolGrade, Bimester, SchoolReportAnalysisResult, SubjectPerformance, Student } from '../types';
import { GEMINI_MODEL_TEXT, DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD, SCHOOL_GRADES_OPTIONS } from "../constants";

let aiInstance: GoogleGenAI | null = null;

// Inicializa a instância da IA de forma preguiçosa (lazy) para evitar crash na inicialização
function getAiInstance(): GoogleGenAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || process.env.API_KEY;
  console.log("API Key disponível:", apiKey ? "Sim" : "Não");
  console.log("Environment:", import.meta.env.MODE);
  if (!apiKey) {
    // Este erro será capturado pelo bloco try-catch da função que o chamou
    throw new Error("A chave da API do Gemini não está configurada. A funcionalidade de IA está desativada.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function generateQuizForVideo(videoTitle: string, videoSubject: string, difficulty: QuizDifficulty): Promise<QuizQuestion[] | null> {
  let prompt = `Crie um quiz de nível ${difficulty} sobre o tópico "${videoTitle}" da disciplina de ${videoSubject}. 
O quiz deve ter 3 perguntas de múltipla escolha, cada uma com 4 opções (A, B, C, D) e apenas uma correta.
Forneça a resposta correta e uma breve explicação para cada pergunta.
Responda APENAS com um array JSON de objetos, onde cada objeto tem os campos: "question" (string), "options" (array de 4 strings), "correctAnswer" (string, uma das opções), e "explanation" (string).
Exemplo de formato para uma pergunta:
{
  "question": "Qual é a capital da França?",
  "options": ["Berlim", "Madri", "Paris", "Lisboa"],
  "correctAnswer": "Paris",
  "explanation": "Paris é a capital e maior cidade da França."
}
`;

  if (difficulty === QuizDifficulty.AVANCADO) {
    prompt += "\nAs perguntas avançadas devem exigir um pensamento mais crítico ou conhecimento mais profundo sobre o tema."
  } else if (difficulty === QuizDifficulty.INICIANTE) {
    prompt += "\nAs perguntas iniciantes devem ser sobre conceitos fundamentais do tema."
  }


  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);
    if (Array.isArray(parsedData) && parsedData.every(item => 'question' in item && 'options' in item && 'correctAnswer' in item && 'explanation' in item)) {
        return parsedData as QuizQuestion[];
    }
    console.error("Failed to parse quiz questions or structure is incorrect:", parsedData);
    return null;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
}

export async function generateVideoJustification(video: VideoRecommendation, analysisData: AnalysisData): Promise<string> {
  const difficultSubjects = analysisData.performance
    .filter(p => p.grade < DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD) 
    .map(p => p.subject)
    .join(', ');

  const prompt = `
    O aluno está na ${analysisData.schoolGrade}, ${analysisData.bimester}. 
    Suas dificuldades identificadas (notas abaixo de ${DEFAULT_SUBJECT_PERFORMANCE_THRESHOLD}/100) são em: ${difficultSubjects || 'Nenhuma dificuldade específica destacada, mas buscando aprendizado geral'}.
    O vídeo recomendado é "${video.title}" sobre ${video.subject}. 
    Gere uma justificativa curta e motivadora (2-3 frases) explicando por que este vídeo é uma boa recomendação para este aluno, conectando com suas possíveis dificuldades ou com a relevância do tema para sua série/ano.
    Seja amigável e encorajador.
  `;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating video justification:", error);
    return "Este vídeo é recomendado para expandir seus conhecimentos sobre o tema!";
  }
}


export async function getInformationWithSearch(query: string): Promise<{ text: string; sources: GroundingChunk[] }> {
  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT, 
      contents: query
    });
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text, sources };
  } catch (error) {
    console.error("Error fetching information with search grounding:", error);
    const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar informações no momento.";
    return { text: errorMessage, sources: [] };
  }
}

export async function generatePerformanceSummary(student: Student, analysisData: AnalysisData): Promise<string> {
  const { performance, bimester } = analysisData;
  const studentFirstName = student.nome.split(' ')[0];

  const gradesText = performance.map(p => `${p.subject}: ${(p.grade / 10).toFixed(1)}/10`).join('\n');

  const prompt = `
    Aja como um conselheiro pedagógico amigável e motivador.
    O(A) aluno(a) se chama ${studentFirstName} e está na ${student.serie}. Os resultados são do ${bimester}.
    
    Aqui estão as notas do(a) aluno(a):
    ${gradesText}

    Com base nessas notas (escala de 0 a 10), escreva um breve resumo de desempenho em 2 parágrafos:
    1.  **Primeiro parágrafo:** Comece com um elogio, destacando as 2-3 disciplinas com as notas mais altas. Comente positivamente sobre o bom desempenho nessas áreas.
    2.  **Segundo parágrafo:** De forma construtiva e encorajadora, aponte as 1-2 disciplinas que precisam de mais atenção (as com notas mais baixas, especialmente abaixo de 6.0). Sugira que focar um pouco mais nessas matérias pode trazer ótimos resultados. Evite linguagem negativa. Termine com uma frase motivacional.
    
    Seja conciso, positivo e direto.
  `;

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating performance summary:", error);
    return "Não foi possível gerar um resumo do seu desempenho no momento. Mas continue se esforçando, você está no caminho certo!";
  }
}