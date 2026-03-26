import { sequelize } from '../config/database';
import { User } from './User';
import { UserClosure } from './UserClosure';
import { Commission } from './Commission';
import { Purchase } from './Purchase';
import { Lead } from './Lead';
import { Task } from './Task';
import { Communication } from './Communication';
import { LandingPage } from './LandingPage';
import { Product } from './Product';
import { Order } from './Order';

// User relationships
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

// CRM Relationships
User.hasMany(Lead, { foreignKey: 'userId', sourceKey: 'id' });
Lead.belongsTo(User, { as: 'owner', foreignKey: 'userId', targetKey: 'id' });
Lead.belongsTo(User, { as: 'assignedUser', foreignKey: 'assignedTo', targetKey: 'id' });
Lead.belongsTo(User, { as: 'referredByUser', foreignKey: 'referredBy', targetKey: 'id' });

Lead.hasMany(Task, { foreignKey: 'leadId', as: 'tasks' });
Task.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Lead.hasMany(Communication, { foreignKey: 'leadId', as: 'communications' });
Communication.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Communication.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LandingPage, { foreignKey: 'userId', sourceKey: 'id' });
LandingPage.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// Product and Order relationships
User.hasMany(Order, { foreignKey: 'userId', sourceKey: 'id' });
Order.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

Product.hasMany(Order, { foreignKey: 'productId', sourceKey: 'id' });
Order.belongsTo(Product, { as: 'product', foreignKey: 'productId', targetKey: 'id' });

Purchase.hasMany(Order, { foreignKey: 'purchaseId', sourceKey: 'id' });
Order.belongsTo(Purchase, { as: 'purchase', foreignKey: 'purchaseId', targetKey: 'id' });

// Purchase - Product relationship (optional productId)
Product.hasMany(Purchase, { foreignKey: 'productId', sourceKey: 'id' });
Purchase.belongsTo(Product, { as: 'product', foreignKey: 'productId', targetKey: 'id' });

export {
  User,
  UserClosure,
  Commission,
  Purchase,
  Lead,
  Task,
  Communication,
  LandingPage,
  Product,
  Order,
};

export function initModels(): void {
  console.log('✅ Models initialized');
}
