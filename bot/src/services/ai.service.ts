/**
 * @fileoverview AI Service — OpenAI chat integration with live knowledge base
 * @description Manages OpenAI conversation sessions, builds system prompts from
 *              static KB files, and injects real-time property/tour data from
 *              the backend for richer bot responses.
 *              Gestiona sesiones de conversación de OpenAI, construye prompts del
 *              sistema desde archivos KB estáticos e inyecta datos en tiempo real
 *              de propiedades/tours del backend para respuestas más ricas.
 * @module services/ai.service
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { mlmApi, BotProperty, BotTour } from './mlm-api.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentName = 'sophia' | 'max';
export type Language = 'es' | 'en';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text: string;
  agent: AgentName;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROMPT_KB_DIR = path.resolve(__dirname, '../prompt_kb');
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 512;
const TEMPERATURE = 0.7;

// In-memory conversation history keyed by WhatsApp phone number
const conversationHistory = new Map<string, ChatMessage[]>();
const MAX_HISTORY_MESSAGES = 20; // keep last 20 turns to avoid token bloat

// ─── Prompt Loader ────────────────────────────────────────────────────────────

function loadFile(filename: string): string {
  const filePath = path.join(PROMPT_KB_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`[ai.service] ERROR: Could not load ${filePath}`);
    return '';
  }
}

/**
 * Fetch live property/tour context for the bot prompt.
 * Obtiene contexto en tiempo real de propiedades y tours para el prompt del bot.
 *
 * @returns Formatted markdown string with live data, or empty string on failure.
 *          String markdown formateado con datos en vivo, o string vacío si falla.
 */
async function fetchLiveContext(): Promise<string> {
  try {
    const [properties, tours] = await Promise.all([
      mlmApi.searchProperties({ limit: 5 }),
      mlmApi.searchTours({ limit: 5 }),
    ]);

    let context = '';

    if (properties.length > 0) {
      context += '\n\n## Propiedades disponibles (datos en tiempo real)\n';
      context += properties
        .map(
          (p: BotProperty) =>
            `- ${p.title} | ${p.type} | ${p.city} | ${p.price} ${p.currency}` +
            (p.bedrooms ? ` | ${p.bedrooms} hab` : '') +
            (p.areaM2 ? ` | ${p.areaM2}m²` : '')
        )
        .join('\n');
    }

    if (tours.length > 0) {
      context += '\n\n## Tours disponibles (datos en tiempo real)\n';
      context += tours
        .map(
          (t: BotTour) =>
            `- ${t.title} | ${t.destination} | ${t.durationDays} días | ${t.price} ${t.currency}`
        )
        .join('\n');
    }

    return context;
  } catch {
    // Non-blocking — return empty string if backend is unreachable
    // No bloqueante — retorna string vacío si el backend no está disponible
    return '';
  }
}

/**
 * Build the system prompt by combining static KB files with optional live context.
 * Construye el prompt del sistema combinando archivos KB estáticos con contexto en vivo opcional.
 *
 * @param agent      - Active agent name ('sophia' | 'max')
 * @param language   - Conversation language ('es' | 'en')
 * @param liveContext - Optional real-time property/tour data / Contexto en tiempo real opcional
 * @returns Composed system prompt string / String del prompt del sistema compuesto
 */
function buildSystemPrompt(agent: AgentName, language: Language, liveContext = ''): string {
  const basePrompt = loadFile('base-system-prompt.md');
  const knowledgeBase = loadFile('knowledge-base.md');
  const agentPrompt = loadFile(`${agent}.prompt.md`);

  // Inject KB into base prompt
  const promptWithKB = basePrompt.replace('{KNOWLEDGE_BASE}', knowledgeBase);

  // Add language instruction
  const langInstruction =
    language === 'en'
      ? '\n\n## ACTIVE LANGUAGE\nThe user has selected ENGLISH. Respond ONLY in English for this entire conversation.'
      : '\n\n## IDIOMA ACTIVO\nEl usuario seleccionó ESPAÑOL. Respondé ÚNICAMENTE en español durante toda esta conversación.';

  return `${promptWithKB}\n\n---\n\n## AGENT PERSONALITY\n\n${agentPrompt}${langInstruction}${liveContext}`;
}

// ─── Gender Detection ─────────────────────────────────────────────────────────

const FEMALE_NAMES_ES = [
  'maria',
  'ana',
  'sofia',
  'laura',
  'carolina',
  'valentina',
  'camila',
  'paula',
  'andrea',
  'monica',
  'patricia',
  'claudia',
  'angela',
  'sandra',
  'diana',
  'alejandra',
  'isabela',
  'isabella',
  'natalia',
  'veronica',
  'daniela',
  'fernanda',
  'gabriela',
  'marcela',
  'lorena',
  'catalina',
  'paola',
  'rosa',
  'elena',
  'lucia',
  'mariana',
  'juliana',
  'sara',
  'sara',
  'luisa',
  'gloria',
  'adriana',
  'viviana',
  'susana',
  'pilar',
];

const FEMALE_NAMES_EN = [
  'mary',
  'anna',
  'anna',
  'sarah',
  'jessica',
  'emily',
  'emma',
  'olivia',
  'ava',
  'isabella',
  'sophia',
  'mia',
  'charlotte',
  'amelia',
  'harper',
  'evelyn',
  'abigail',
  'elizabeth',
  'sofía',
  'jennifer',
  'linda',
  'barbara',
  'patricia',
  'susan',
  'jessica',
  'margaret',
  'lisa',
  'betty',
  'dorothy',
  'sandra',
  'ashley',
  'kimberly',
  'amanda',
  'donna',
  'carol',
  'michelle',
  'emily',
  'amanda',
  'melissa',
  'stephanie',
];

const FEMALE_NAMES = new Set([...FEMALE_NAMES_ES, ...FEMALE_NAMES_EN]);

/**
 * Detect agent based on user's name.
 * Returns 'max' for female names, 'sophia' for everything else (default).
 */
export function detectAgent(name: string): AgentName {
  if (!name) return 'sophia';
  const normalized = name.trim().toLowerCase().split(' ')[0];
  return FEMALE_NAMES.has(normalized) ? 'max' : 'sophia';
}

// ─── withRetry utility ────────────────────────────────────────────────────────

/**
 * Retries an async operation with exponential backoff on transient failures.
 * Transient errors include rate limits (429), server errors (5xx), and network timeouts.
 * Non-retryable errors (auth 401, invalid request 400) are re-thrown immediately.
 *
 * Reintenta una operación async con backoff exponencial ante fallos transitorios.
 * Los errores transitorios incluyen rate limits (429), errores de servidor (5xx) y timeouts de red.
 * Los errores no reintentables (auth 401, request inválido 400) se vuelven a lanzar de inmediato.
 *
 * @param fn       - Async function to retry
 * @param retries  - Maximum number of attempts (default: 3)
 * @param baseMs   - Base delay in ms between attempts (doubles each retry, default: 500)
 * @returns Result of fn on first successful attempt
 * @throws Last error after all retries are exhausted
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseMs = 500): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // Determine if error is retryable
      const status =
        (err as { status?: number })?.status ??
        (err as { response?: { status?: number } })?.response?.status;

      const isNonRetryable = status !== undefined && status < 500 && status !== 429;

      if (isNonRetryable) {
        console.error(`[withRetry] Non-retryable error (status ${status}), aborting.`);
        throw err;
      }

      if (attempt < retries) {
        const delay = baseMs * 2 ** (attempt - 1);
        console.warn(
          `[withRetry] Attempt ${attempt}/${retries} failed${status ? ` (${status})` : ''}. Retrying in ${delay}ms…`
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  console.error(`[withRetry] All ${retries} attempts failed.`);
  throw lastError;
}

// ─── OpenAI Client ────────────────────────────────────────────────────────────

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('[ai.service] OPENAI_API_KEY is not set in environment variables');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ─── Conversation History ─────────────────────────────────────────────────────

export function getHistory(phone: string): ChatMessage[] {
  return conversationHistory.get(phone) || [];
}

export function appendToHistory(phone: string, message: ChatMessage): void {
  const history = conversationHistory.get(phone) || [];
  history.push(message);
  // Trim to last N messages to avoid excessive token usage
  if (history.length > MAX_HISTORY_MESSAGES) {
    history.splice(0, history.length - MAX_HISTORY_MESSAGES);
  }
  conversationHistory.set(phone, history);
}

export function clearHistory(phone: string): void {
  conversationHistory.delete(phone);
}

// ─── Main AI Chat Function ────────────────────────────────────────────────────

/**
 * Send a message to the AI agent and get a response.
 *
 * @param phone    - WhatsApp phone number (used as session key)
 * @param userMsg  - The user's message
 * @param agent    - 'sophia' | 'max'
 * @param language - 'es' | 'en'
 * @returns AIResponse with text and active agent
 */
export async function chat(
  phone: string,
  userMsg: string,
  agent: AgentName,
  language: Language
): Promise<AIResponse> {
  const client = getClient();

  // Fetch real-time property/tour context (non-blocking — empty string on failure)
  // Obtiene contexto de propiedades/tours en tiempo real (no bloqueante — string vacío si falla)
  const liveContext = await fetchLiveContext();

  // Build system prompt with KB + agent personality + language + live context
  const systemPrompt = buildSystemPrompt(agent, language, liveContext);

  // Append user message to history
  appendToHistory(phone, { role: 'user', content: userMsg });

  // Build messages array: system + history
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...getHistory(phone).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  try {
    const completion = await withRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      })
    );

    const responseText =
      completion.choices[0]?.message?.content?.trim() ||
      (language === 'en'
        ? "I'm sorry, I couldn't process that. Let me connect you with a human advisor."
        : 'Lo siento, no pude procesar eso. Te conecto con un asesor humano.');

    // Append assistant response to history
    appendToHistory(phone, { role: 'assistant', content: responseText });

    return { text: responseText, agent };
  } catch (error) {
    console.error('[ai.service] OpenAI error:', error);

    const fallback =
      language === 'en'
        ? "I'm experiencing a technical issue right now. Please try again in a moment, or type *help* to connect with a human advisor. 🙏"
        : 'Estoy teniendo un problema técnico ahora mismo. Por favor intentá de nuevo en un momento, o escribí *ayuda* para hablar con un asesor. 🙏';

    return { text: fallback, agent };
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const aiService = {
  chat,
  detectAgent,
  getHistory,
  appendToHistory,
  clearHistory,
  withRetry,
};
