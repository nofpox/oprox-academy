import { GoogleGenAI } from '@google/genai';
import { logStructured } from '../src/lib/logger';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logStructured('warn', 'GEMINI_API_KEY_MISSING', { message: 'GEMINI_API_KEY is not configured. Falling back to rule-based tutor guidance.' });
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface TutorPromptParams {
  courseTitle: string;
  lessonTitle?: string;
  lessonContent?: string;
  userMessage: string;
  chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  language?: string;
}

export async function generateTutorResponse(params: TutorPromptParams): Promise<{
  content: string;
  tokensUsed: number;
  grounded: boolean;
}> {
  const ai = getAiClient();
  const lang = params.language === 'ar' ? 'ar' : 'en';

  const systemInstruction = `You are OPROX Academy AI Tutor, a friendly, authoritative, pedagogical AI teaching assistant.
Your goal is to help the learner master the material for the course: "${params.courseTitle}".
${params.lessonTitle ? `Current Lesson: "${params.lessonTitle}"` : ''}

GROUNDING RULES:
1. Base your explanations primarily on the lesson and course material provided in the context below.
${params.lessonContent ? `LESSON CONTENT CONTEXT:\n${params.lessonContent.substring(0, 3000)}\n` : ''}
2. IMPORTANT ACADEMIC INTEGRITY RULE: NEVER reveal exact answer keys, assessment correct options, or complete solutions for test questions. Instead, guide the learner step-by-step using Socratic inquiry and conceptual explanations.
3. Respond in the requested language (${lang === 'ar' ? 'Arabic' : 'English'}).
4. Keep responses concise, clear, encouraging, and structured using bullet points or code snippets where applicable.`;

  if (!ai) {
    // Graceful rule-based response when API key is not present in local test env
    const fallbackText = lang === 'ar'
      ? `[المعلم الذكي - إجابة مستندة للمنهج]: مرحباً بك! بناءً على درس "${params.lessonTitle || params.courseTitle}"، يهدف هذا الموضوع للتركيز على المفاهيم الأساسية وتطبيقها العملي. هل ترغب في شرح خطوة بخطوة لأي جزء محدد؟`
      : `[AI Tutor - Course-Grounded Assistance]: Welcome! Based on "${params.lessonTitle || params.courseTitle}", this topic focuses on core concepts and practical application. Would you like a step-by-step explanation of any specific section?`;

    return {
      content: fallbackText,
      tokensUsed: 120,
      grounded: true,
    };
  }

  try {
    const contents: any[] = [];
    for (const h of params.chatHistory.slice(-6)) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: params.userMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text || '';
    const tokens = response.usageMetadata?.totalTokenCount || 250;

    return {
      content: text,
      tokensUsed: tokens,
      grounded: true,
    };
  } catch (err) {
    logStructured('error', 'GEMINI_TUTOR_GENERATE_ERROR', { error: String(err) });
    const fallbackText = lang === 'ar'
      ? `شكراً لسؤالك حول "${params.lessonTitle || params.courseTitle}". دعنا نراجع المفهوم الرئيسي معاً لتبسيط فهمه.`
      : `Thank you for asking about "${params.lessonTitle || params.courseTitle}". Let us break down the key concept together.`;

    return {
      content: fallbackText,
      tokensUsed: 50,
      grounded: true,
    };
  }
}
