/**
 * @fileoverview Create Workflow Executions Table Migration
 * @description Creates the workflow_executions table for tracking n8n workflow execution results.
 *   Provides idempotent webhook processing via composite unique constraint on (lead_id, n8n_execution_id).
 *
 * ES: Crea la tabla workflow_executions para rastrear resultados de ejecuciones de workflows n8n.
 *   Provee procesamiento idempotente de webhooks via restricción única compuesta (lead_id, n8n_execution_id).
 *
 * EN: Creates the workflow_executions table for tracking n8n workflow execution results.
 *   Provides idempotent webhook processing via composite unique constraint (lead_id, n8n_execution_id).
 *
 * @module database/migrations/20260412200000-create-workflow-executions
 */
'use strict';

module.exports = {
  /**
   * Up: Create workflow_executions table with indexes
   * @param {Object} queryInterface - Sequelize query interface
   * @param {Object} Sequelize - Sequelize library
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_executions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      lead_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'leads', key: 'id' },
        onDelete: 'CASCADE',
        comment: 'FK to leads table — which lead this execution relates to',
      },
      workflow_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'n8n workflow name, e.g. schedule-visit, human-handoff',
      },
      action_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Action type: email_sent, status_changed, task_created, visit_scheduled',
      },
      payload: {
        type: Sequelize.JSONB,
        defaultValue: {},
        comment: 'Arbitrary payload from n8n workflow execution',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Execution status: pending, success, failed',
      },
      n8n_execution_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'n8n execution ID — used for idempotency with lead_id',
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error details when status is failed',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Composite unique index for idempotency — same lead + same n8n execution = one record
    await queryInterface.addIndex('workflow_executions', ['lead_id', 'n8n_execution_id'], {
      unique: true,
      name: 'uq_workflow_exec_idempotency',
    });

    // Index for dashboard queries: filter by lead and status
    await queryInterface.addIndex('workflow_executions', ['lead_id', 'status'], {
      name: 'idx_wf_exec_lead_status',
    });

    // Index for dashboard: recent executions sorted by created_at DESC
    await queryInterface.addIndex(
      'workflow_executions',
      [{ attribute: 'created_at', order: 'DESC' }],
      {
        name: 'idx_wf_exec_created_desc',
      }
    );

    // Index for filtering by action type
    await queryInterface.addIndex('workflow_executions', ['action_type'], {
      name: 'idx_wf_exec_action_type',
    });
  },

  /**
   * Down: Drop workflow_executions table
   * @param {Object} queryInterface - Sequelize query interface
   */
  async down(queryInterface) {
    await queryInterface.dropTable('workflow_executions');
  },
};
