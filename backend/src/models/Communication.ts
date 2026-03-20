import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type CommunicationType = 'email' | 'phone' | 'whatsapp' | 'meeting' | 'note' | 'sms';
export type CommunicationDirection = 'inbound' | 'outbound';

interface CommunicationAttributes {
  id: string;
  leadId: string;
  userId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string | null;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunicationCreationAttributes extends Optional<
  CommunicationAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class Communication
  extends Model<CommunicationAttributes, CommunicationCreationAttributes>
  implements CommunicationAttributes
{
  public id!: string;
  public leadId!: string;
  public userId!: string;
  public type!: CommunicationType;
  public direction!: CommunicationDirection;
  public subject!: string | null;
  public content!: string;
  public metadata!: Record<string, unknown>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Communication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'leads', key: 'id' },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('email', 'phone', 'whatsapp', 'meeting', 'note', 'sms'),
      allowNull: false,
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound'),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
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
    tableName: 'lead_communications',
    indexes: [
      { fields: ['leadId'] },
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default Communication;
