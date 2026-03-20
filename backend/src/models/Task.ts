import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'note' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';

interface TaskAttributes {
  id: string;
  leadId: string;
  userId: string;
  type: TaskType;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskCreationAttributes extends Optional<
  TaskAttributes,
  'id' | 'createdAt' | 'updatedAt'
> {}

export class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  public id!: string;
  public leadId!: string;
  public userId!: string;
  public type!: TaskType;
  public title!: string;
  public description!: string | null;
  public status!: TaskStatus;
  public dueDate!: Date | null;
  public completedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
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
      type: DataTypes.ENUM('call', 'email', 'meeting', 'follow_up', 'note', 'other'),
      defaultValue: 'follow_up',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'lead_tasks',
    indexes: [
      { fields: ['leadId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['dueDate'] },
    ],
  }
);

export default Task;
