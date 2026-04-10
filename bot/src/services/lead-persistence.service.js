/**
 * @fileoverview Lead Persistence Service — WhatsApp Bot
 * @description Sends bot-captured lead data to the Nexo Real backend API for persistence.
 *              Envía datos de leads capturados por el bot a la API del backend de Nexo Real.
 * @module services/lead-persistence.service
 */

'use strict';

const axios = require('axios');

/** @typedef {import('../types/lead.types').BotLeadData} BotLeadData */

/**
 * Backend URL for the bot leads endpoint.
 * URL del backend para el endpoint de leads del bot.
 */
const BOT_LEADS_URL = `${process.env.MLM_BACKEND_URL}/bot/leads`;

/**
 * Shared secret for bot → backend authentication.
 * Secreto compartido para autenticación bot → backend.
 */
const BOT_SECRET = process.env.BOT_SECRET || '';

/**
 * Service responsible for persisting leads captured by the WhatsApp bot.
 * Servicio responsable de persistir leads capturados por el bot de WhatsApp.
 */
const leadPersistenceService = {
  /**
   * Saves a bot-captured lead to the Nexo Real backend database.
   * Guarda un lead capturado por el bot en la base de datos del backend de Nexo Real.
   *
   * Errors are caught and logged — a failed save must never crash the bot conversation.
   * Los errores se capturan y loggean — un fallo al guardar jamás debe romper la conversación.
   *
   * @param {BotLeadData} data - Lead data captured during the bot conversation / Datos del lead capturados
   * @returns {Promise<void>}
   */
  async saveLead(data) {
    try {
      await axios.post(BOT_LEADS_URL, data, {
        headers: {
          'Content-Type': 'application/json',
          'x-bot-secret': BOT_SECRET,
        },
        timeout: 5000,
      });

      console.info(`[LeadPersistence] Lead saved — phone: ${data.phone}, agent: ${data.agentName}`);
    } catch (error) {
      // Non-fatal: log and continue — the bot conversation must not be interrupted
      // No fatal: loggear y continuar — la conversación del bot no debe interrumpirse
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || 'unknown error';
      console.error(
        `[LeadPersistence] Failed to save lead (phone: ${data.phone}) — ${status ?? 'network'}: ${message}`
      );
    }
  },
};

module.exports = { leadPersistenceService };
