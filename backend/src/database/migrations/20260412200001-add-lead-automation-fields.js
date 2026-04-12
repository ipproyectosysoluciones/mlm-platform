/**
 * @fileoverview Add Automation Fields to Leads Table
 * @description Adds automation_status and last_workflow_action_id columns to the leads table.
 *   Enables tracking whether a lead is managed manually, by automation, or mixed.
 *
 * ES: Agrega campos de automatización a la tabla leads.
 *   Permite rastrear si un lead es gestionado manualmente, por automatización, o mixto.
 *
 * EN: Adds automation fields to the leads table.
 *   Enables tracking whether a lead is managed manually, by automation, or mixed.
 *
 * @module database/migrations/20260412200001-add-lead-automation-fields
 */
'use strict';

module.exports = {
  /**
   * Up: Add automation_status and last_workflow_action_id to leads
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('leads', 'automation_status', {
      type: Sequelize.STRING(20),
      defaultValue: 'manual',
      allowNull: false,
      comment: 'Automation tracking: manual | automated | mixed',
    });

    await queryInterface.addColumn('leads', 'last_workflow_action_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'workflow_executions', key: 'id' },
      onDelete: 'SET NULL',
      comment: 'FK to the most recent workflow execution for this lead',
    });
  },

  /**
   * Down: Remove automation fields from leads
   * @param {Object} queryInterface - Sequelize query interface
   */
  async down(queryInterface) {
    await queryInterface.removeColumn('leads', 'last_workflow_action_id');
    await queryInterface.removeColumn('leads', 'automation_status');
  },
};
