/**
 * @fileoverview WorkflowExecution Model — n8n workflow execution tracking
 * @description Sequelize model that persists every n8n workflow execution result.
 *   Provides idempotent webhook processing via composite unique index on (lead_id, n8n_execution_id).
 *
 * ES: Modelo Sequelize que persiste cada resultado de ejecución de workflow n8n.
 *   Provee procesamiento idempotente via índice único compuesto (lead_id, n8n_execution_id).
 *
 * EN: Sequelize model that persists every n8n workflow execution result.
 *   Provides idempotent webhook processing via composite unique index (lead_id, n8n_execution_id).
 *
 * @module models/WorkflowExecution
 * @author MLM Development Team
 *
 * @example
 * // ES: Crear un registro de ejecución
 * const exec = await WorkflowExecution.create({
 *   leadId: 'uuid', workflowName: 'schedule-visit', actionType: 'visit_scheduled',
 *   n8nExecutionId: 'exec_abc123', status: 'success',
 * });
 *
 * // EN: Create an execution record
 * const exec = await WorkflowExecution.create({
 *   leadId: 'uuid', workflowName: 'schedule-visit', actionType: 'visit_scheduled',
 *   n8nExecutionId: 'exec_abc123', status: 'success',
 * });
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

/** Valid workflow execution statuses */
export type WorkflowExecutionStatus = 'pending' | 'success' | 'failed';

export interface WorkflowExecutionAttributes {
  id: string;
  /** FK to leads table — which lead this execution relates to */
  leadId: string;
  /** n8n workflow name, e.g. 'schedule-visit', 'human-handoff' */
  workflowName: string;
  /** Action type: 'email_sent', 'status_changed', 'task_created', 'visit_scheduled' */
  actionType: string;
  /** Arbitrary payload from n8n workflow execution */
  payload: Record<string, unknown>;
  /** Execution status */
  status: WorkflowExecutionStatus;
  /** n8n execution ID — idempotency key with leadId */
  n8nExecutionId: string;
  /** Error details when status is 'failed' */
  errorMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type WorkflowExecutionCreation = Optional<
  WorkflowExecutionAttributes,
  'id' | 'payload' | 'errorMessage' | 'createdAt' | 'updatedAt'
>;

export class WorkflowExecution
  extends Model<WorkflowExecutionAttributes, WorkflowExecutionCreation>
  implements WorkflowExecutionAttributes
{
  declare id: string;
  declare leadId: string;
  declare workflowName: string;
  declare actionType: string;
  declare payload: Record<string, unknown>;
  declare status: WorkflowExecutionStatus;
  declare n8nExecutionId: string;
  declare errorMessage: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WorkflowExecution.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'lead_id',
      references: { model: 'leads', key: 'id' },
    },
    workflowName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'workflow_name',
      comment: 'n8n workflow name, e.g. schedule-visit, human-handoff',
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'action_type',
      comment: 'Action type: email_sent, status_changed, task_created, visit_scheduled',
    },
    payload: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Arbitrary payload from n8n workflow execution',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Execution status: pending, success, failed',
    },
    n8nExecutionId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'n8n_execution_id',
      comment: 'n8n execution ID — idempotency key with lead_id',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: 'Error details when status is failed',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'workflow_executions',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['lead_id', 'n8n_execution_id'],
        name: 'uq_workflow_exec_idempotency',
      },
      {
        fields: ['lead_id', 'status'],
        name: 'idx_wf_exec_lead_status',
      },
      {
        fields: [{ name: 'created_at', order: 'DESC' }],
        name: 'idx_wf_exec_created_desc',
      },
      {
        fields: ['action_type'],
        name: 'idx_wf_exec_action_type',
      },
    ],
  }
);

export default WorkflowExecution;
