import { DataTypes, Model, ForeignKey } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export class UserClosure extends Model {
  declare ancestorId: ForeignKey<User['id']>;
  declare descendantId: ForeignKey<User['id']>;
  declare depth: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserClosure.init(
  {
    ancestorId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'ancestor_id',
    },
    descendantId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: 'descendant_id',
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'user_closure',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['descendant_id'] }, { fields: ['depth'] }],
  }
);
