import { sequelize } from '../config/database';
import { User } from './User';
import { UserClosure } from './UserClosure';
import { Commission } from './Commission';
import { Purchase } from './Purchase';

User.hasMany(User, { as: 'children', foreignKey: 'sponsorId', sourceKey: 'id' });
User.belongsTo(User, { as: 'sponsor', foreignKey: 'sponsorId', targetKey: 'id' });

User.hasMany(UserClosure, { foreignKey: 'descendantId', sourceKey: 'id' });
UserClosure.belongsTo(User, { foreignKey: 'ancestorId', targetKey: 'id' });
UserClosure.belongsTo(User, { foreignKey: 'descendantId', targetKey: 'id' });

User.hasMany(Commission, { foreignKey: 'userId', sourceKey: 'id' });
Commission.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });
Commission.belongsTo(User, { as: 'fromUser', foreignKey: 'fromUserId', targetKey: 'id' });

User.hasMany(Purchase, { foreignKey: 'userId', sourceKey: 'id' });
Purchase.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

export { User, UserClosure, Commission, Purchase };

export function initModels(): void {
  console.log('✅ Models initialized');
}
