/**
 * @fileoverview Contract Service - Contract API client
 * @description API client for contract template management and acceptance
 * @module services/contractService
 */

import api from './api';
import type { Contract, ContractAcceptanceResponse } from '../types';

/**
 * Contract Service - Manages contract API calls
 * ContractService - Gestiona llamadas API de contratos
 */
export const contractService = {
  /**
   * Get all active contracts with user's acceptance status
   * Obtener todos los contratos activos con estado de aceptación del usuario
   *
   * @returns {Promise<Contract[]>} List of contracts
   *
   * @example
   * const contracts = await contractService.getContracts();
   */
  async getContracts(): Promise<Contract[]> {
    const response = await api.get<{ success: boolean; data: Contract[] }>('/contracts');
    return response.data.data;
  },

  /**
   * Get a specific contract by ID
   * Obtener un contrato específico por ID
   *
   * @param {string} id - Contract template ID
   * @returns {Promise<Contract>} Contract details
   *
   * @example
   * const contract = await contractService.getContract('template-id');
   */
  async getContract(id: string): Promise<Contract> {
    const response = await api.get<{ success: boolean; data: Contract }>(`/contracts/${id}`);
    return response.data.data;
  },

  /**
   * Accept a contract
   * Aceptar un contrato
   *
   * @param {string} id - Contract template ID
   * @returns {Promise<ContractAcceptanceResponse>} Acceptance result
   *
   * @example
   * const result = await contractService.acceptContract('template-id');
   */
  async acceptContract(id: string): Promise<ContractAcceptanceResponse> {
    const response = await api.post<ContractAcceptanceResponse>(`/contracts/${id}/accept`);
    return response.data;
  },

  /**
   * Decline a contract
   * Rechazar un contrato
   *
   * @param {string} id - Contract template ID
   * @returns {Promise<ContractAcceptanceResponse>} Decline result
   *
   * @example
   * const result = await contractService.declineContract('template-id');
   */
  async declineContract(id: string): Promise<ContractAcceptanceResponse> {
    const response = await api.post<ContractAcceptanceResponse>(`/contracts/${id}/decline`);
    return response.data;
  },
};

export default contractService;
