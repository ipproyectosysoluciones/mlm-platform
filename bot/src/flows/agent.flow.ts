import { addKeyword, EVENTS } from '@builderbot/bot';
import { aiService, type AgentName, type Language } from '../services/ai.service.js';

/**
 * Agent assignment flow.
 *
 * Detects the user's gender via their name and assigns:
 *   - 'sophia' (female agent) → for male users (default)
 *   - 'max'    (male agent)   → for female users
 *
 * The agent can be overridden if the user explicitly requests
 * to speak with a specific advisor.
 */

/**
 * Given a user's name, assign the appropriate agent and store in state.
 * Returns the assigned AgentName.
 */
export async function assignAgent(
  name: string,
  state: any,
  flowDynamic: any,
  language: Language
): Promise<AgentName> {
  const agent = aiService.detectAgent(name);
  await state.update({ agent });
  return agent;
}

/**
 * Build the agent intro message (sent once after agent assignment).
 */
export function getAgentIntro(agent: AgentName, language: Language): string {
  if (agent === 'sophia') {
    return language === 'es'
      ? '¡Hola! 😊 Soy *Sophia*, tu asesora virtual de *Nexo Real*.\nEstoy acá para ayudarte con todo lo que necesites — ya sea sobre nuestros servicios inmobiliarios, paquetes de turismo, o el programa de afiliados.\n¿Me contás con qué te puedo ayudar hoy?'
      : "Hi there! 😊 I'm *Sophia*, your virtual advisor at *Nexo Real*.\nI'm here to help you with anything you need — whether it's about our real estate services, tourism packages, or affiliate program.\nWhat can I help you with today?";
  }

  // Max
  return language === 'es'
    ? '¡Hola! 👋 Soy *Max*, asesor virtual de *Nexo Real*.\nEstoy acá para ayudarte con lo que necesites — servicios inmobiliarios, turismo o nuestro programa de afiliados.\n¿Con qué te puedo ayudar hoy?'
    : "Hello! 👋 I'm *Max*, a virtual advisor at *Nexo Real*.\nI'm here to help you with whatever you need — real estate, tourism, or our affiliate program.\nWhat can I help you with today?";
}

/**
 * Transition message when switching agents mid-conversation.
 */
export function getAgentTransitionMessage(toAgent: AgentName, language: Language): string {
  if (toAgent === 'max') {
    return language === 'es'
      ? 'Por cierto, te paso con *Max*, uno de nuestros asesores especializados que va a poder ayudarte mejor. ¡Ya te atiende! 👋'
      : "Let me connect you with *Max*, one of our specialized advisors who'll be a great fit for you! 👋";
  }

  return language === 'es'
    ? 'Te paso con *Sophia*, una de nuestras asesoras que va a poder acompañarte mejor. ¡Ya te atiende! 😊'
    : "Let me connect you with *Sophia*, one of our advisors who'll be a great fit for you! 😊";
}
