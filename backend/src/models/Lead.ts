import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';
export type LeadSource =
  | 'website'
  | 'referral'
  | 'social'
  | 'landing_page'
  | 'manual'
  | 'other'
  | 'whatsapp_bot';

/** Automation tracking status: manual | automated | mixed */
export type AutomationStatus = 'manual' | 'automated' | 'mixed';

interface LeadAttributes {
  id: string;
  userId: string; // User who owns this lead (affiliate)
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  company: string | null;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  currency: string;
  notes: string | null;
  referredBy: string | null; // Link to user who referred
  assignedTo: string | null; // Another user assigned to handle
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  metadata: Record<string, unknown>;
  /** Automation tracking: manual | automated | mixed */
  automationStatus: AutomationStatus;
  /** FK to the most recent WorkflowExecution for this lead */
  lastWorkflowActionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type LeadCreationAttributes = Optional<
  LeadAttributes,
  'id' | 'automationStatus' | 'lastWorkflowActionId' | 'createdAt' | 'updatedAt'
>;

export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  public id!: string;
  public userId!: string;
  public contactName!: string;
  public contactEmail!: string;
  public contactPhone!: string | null;
  public company!: string | null;
  public status!: LeadStatus;
  public source!: LeadSource;
  public value!: number;
  public currency!: string;
  public notes!: string | null;
  public referredBy!: string | null;
  public assignedTo!: string | null;
  public lastContactAt!: Date | null;
  public nextFollowUpAt!: Date | null;
  public metadata!: Record<string, unknown>;
  public automationStatus!: AutomationStatus;
  public lastWorkflowActionId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' },
    },
    contactName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'new',
        'contacted',
        'qualified',
        'proposal',
        'negotiation',
        'won',
        'lost'
      ),
      defaultValue: 'new',
    },
    source: {
      type: DataTypes.ENUM(
        'website',
        'referral',
        'social',
        'landing_page',
        'manual',
        'other',
        'whatsapp_bot'
      ),
      defaultValue: 'website',
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'referred_by',
      references: { model: 'users', key: 'id' },
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to',
      references: { model: 'users', key: 'id' },
    },
    lastContactAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_contact_at',
    },
    nextFollowUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_follow_up_at',
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    automationStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'manual',
      field: 'automation_status',
      comment: 'Automation tracking: manual | automated | mixed',
    },
    lastWorkflowActionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_workflow_action_id',
      references: { model: 'workflow_executions', key: 'id' },
      comment: 'FK to the most recent WorkflowExecution for this lead',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'leads',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['contact_email'] },
      { fields: ['next_follow_up_at'] },
    ],
  }
);

export default Lead;
