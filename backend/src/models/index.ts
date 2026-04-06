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
import { Wallet } from './Wallet';
import { WalletTransaction } from './WalletTransaction';
import { WithdrawalRequest } from './WithdrawalRequest';
import { CommissionConfig } from './CommissionConfig';
import { PushSubscription } from './PushSubscription';
import { GiftCard } from './GiftCard';
import { QrMapping } from './QrMapping';
import { GiftCardTransaction } from './GiftCardTransaction';
import { Cart } from './Cart';
import { CartItem } from './CartItem';
import { CartRecoveryToken } from './CartRecoveryToken';
import { EmailTemplate } from './EmailTemplate';
import { EmailCampaign } from './EmailCampaign';
import { CampaignRecipient } from './CampaignRecipient';
import { EmailQueue } from './EmailQueue';
import { EmailCampaignLog } from './EmailCampaignLog';
import { Category, MAX_CATEGORY_DEPTH } from './Category';
import { InventoryMovement } from './InventoryMovement';
import { Vendor } from './Vendor';
import { VendorOrder } from './VendorOrder';
import { VendorPayout } from './VendorPayout';
import { ShippingAddress } from './ShippingAddress';
import { DeliveryProvider } from './DeliveryProvider';
import { ShipmentTracking } from './ShipmentTracking';
import { ContractTemplate } from './ContractTemplate';
import { AffiliateContract } from './AffiliateContract';
import { Achievement } from './Achievement';
import { Badge } from './Badge';
import { UserAchievement } from './UserAchievement';
import { WebhookEvent } from './WebhookEvent';

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

// Wallet relationships
User.hasOne(Wallet, { foreignKey: 'userId', sourceKey: 'id' });
Wallet.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

Wallet.hasMany(WalletTransaction, { foreignKey: 'walletId', sourceKey: 'id' });
WalletTransaction.belongsTo(Wallet, { as: 'wallet', foreignKey: 'walletId', targetKey: 'id' });

User.hasMany(WithdrawalRequest, { foreignKey: 'userId', sourceKey: 'id' });
WithdrawalRequest.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// Push Subscription relationships
User.hasMany(PushSubscription, { foreignKey: 'userId' });
PushSubscription.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// Gift Card relationships
User.hasMany(GiftCard, { as: 'createdGiftCards', foreignKey: 'createdByUserId', sourceKey: 'id' });
GiftCard.belongsTo(User, { as: 'createdByUser', foreignKey: 'createdByUserId', targetKey: 'id' });

User.hasMany(GiftCard, {
  as: 'redeemedGiftCards',
  foreignKey: 'redeemedByUserId',
  sourceKey: 'id',
});
GiftCard.belongsTo(User, {
  as: 'redeemedByUser',
  foreignKey: 'redeemedByUserId',
  targetKey: 'id',
});

GiftCard.hasOne(QrMapping, { foreignKey: 'giftCardId', sourceKey: 'id' });
QrMapping.belongsTo(GiftCard, { as: 'giftCard', foreignKey: 'giftCardId', targetKey: 'id' });

GiftCard.hasMany(GiftCardTransaction, { foreignKey: 'giftCardId', sourceKey: 'id' });
GiftCardTransaction.belongsTo(GiftCard, {
  as: 'giftCard',
  foreignKey: 'giftCardId',
  targetKey: 'id',
});

User.hasMany(GiftCardTransaction, { foreignKey: 'redeemedByUserId', sourceKey: 'id' });
GiftCardTransaction.belongsTo(User, {
  as: 'redeemedByUser',
  foreignKey: 'redeemedByUserId',
  targetKey: 'id',
});

// Cart relationships (Abandoned Cart Recovery #21)
User.hasMany(Cart, { as: 'carts', foreignKey: 'userId', sourceKey: 'id' });
Cart.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

Cart.hasMany(CartItem, { as: 'items', foreignKey: 'cartId', sourceKey: 'id', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { as: 'cart', foreignKey: 'cartId', targetKey: 'id' });

Product.hasMany(CartItem, { foreignKey: 'productId', sourceKey: 'id' });
CartItem.belongsTo(Product, { as: 'product', foreignKey: 'productId', targetKey: 'id' });

Cart.hasMany(CartRecoveryToken, {
  as: 'recoveryTokens',
  foreignKey: 'cartId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
CartRecoveryToken.belongsTo(Cart, { as: 'cart', foreignKey: 'cartId', targetKey: 'id' });

User.hasMany(CartRecoveryToken, { foreignKey: 'userId', sourceKey: 'id' });
CartRecoveryToken.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// Email Automation relationships (#22)
User.hasMany(EmailTemplate, {
  as: 'emailTemplates',
  foreignKey: 'createdByUserId',
  sourceKey: 'id',
});
EmailTemplate.belongsTo(User, {
  as: 'createdByUser',
  foreignKey: 'createdByUserId',
  targetKey: 'id',
});

User.hasMany(EmailCampaign, {
  as: 'emailCampaigns',
  foreignKey: 'createdByUserId',
  sourceKey: 'id',
});
EmailCampaign.belongsTo(User, {
  as: 'createdByUser',
  foreignKey: 'createdByUserId',
  targetKey: 'id',
});

EmailTemplate.hasMany(EmailCampaign, {
  as: 'campaigns',
  foreignKey: 'emailTemplateId',
  sourceKey: 'id',
});
EmailCampaign.belongsTo(EmailTemplate, {
  as: 'emailTemplate',
  foreignKey: 'emailTemplateId',
  targetKey: 'id',
});

EmailCampaign.hasMany(CampaignRecipient, {
  as: 'recipients',
  foreignKey: 'campaignId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
CampaignRecipient.belongsTo(EmailCampaign, {
  as: 'campaign',
  foreignKey: 'campaignId',
  targetKey: 'id',
});

User.hasMany(CampaignRecipient, { foreignKey: 'userId', sourceKey: 'id' });
CampaignRecipient.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

EmailCampaign.hasMany(EmailQueue, {
  as: 'queueItems',
  foreignKey: 'campaignId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
EmailQueue.belongsTo(EmailCampaign, {
  as: 'campaign',
  foreignKey: 'campaignId',
  targetKey: 'id',
});

CampaignRecipient.hasMany(EmailQueue, {
  as: 'queueItems',
  foreignKey: 'campaignRecipientId',
  sourceKey: 'id',
});
EmailQueue.belongsTo(CampaignRecipient, {
  as: 'campaignRecipient',
  foreignKey: 'campaignRecipientId',
  targetKey: 'id',
});

User.hasMany(EmailQueue, { foreignKey: 'userId', sourceKey: 'id' });
EmailQueue.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

EmailCampaign.hasMany(EmailCampaignLog, {
  as: 'logs',
  foreignKey: 'campaignId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
EmailCampaignLog.belongsTo(EmailCampaign, {
  as: 'campaign',
  foreignKey: 'campaignId',
  targetKey: 'id',
});

CampaignRecipient.hasMany(EmailCampaignLog, {
  as: 'logs',
  foreignKey: 'campaignRecipientId',
  sourceKey: 'id',
});
EmailCampaignLog.belongsTo(CampaignRecipient, {
  as: 'campaignRecipient',
  foreignKey: 'campaignRecipientId',
  targetKey: 'id',
});

// ============================================
// GENERIC PRODUCTS — Category & Inventory (#27)
// ============================================

// Category hierarchical relationships
Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parentId',
  targetKey: 'id',
});

Category.hasMany(Category, {
  as: 'children',
  foreignKey: 'parentId',
  sourceKey: 'id',
  onDelete: 'SET NULL',
});

// Product - Category relationship
Category.hasMany(Product, {
  as: 'products',
  foreignKey: 'categoryId',
  sourceKey: 'id',
});
Product.belongsTo(Category, {
  as: 'category',
  foreignKey: 'categoryId',
  targetKey: 'id',
});

// Inventory Movement relationships
Product.hasMany(InventoryMovement, {
  as: 'inventoryMovements',
  foreignKey: 'productId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
});
InventoryMovement.belongsTo(Product, {
  as: 'product',
  foreignKey: 'productId',
  targetKey: 'id',
});

User.hasMany(InventoryMovement, {
  as: 'inventoryMovements',
  foreignKey: 'performedBy',
  sourceKey: 'id',
});
InventoryMovement.belongsTo(User, {
  as: 'performedByUser',
  foreignKey: 'performedBy',
  targetKey: 'id',
});

// ============================================
// MARKETPLACE MULTI-VENDOR — Vendor Relations
// ============================================

// User - Vendor (one vendor per user)
User.hasMany(Vendor, { as: 'vendor', foreignKey: 'userId', sourceKey: 'id' });
Vendor.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// User - VendorPayout (as approver - approvedBy)
User.hasMany(VendorPayout, { as: 'approvedPayouts', foreignKey: 'approvedBy', sourceKey: 'id' });
VendorPayout.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy', targetKey: 'id' });

// Order - VendorOrder
Order.hasMany(VendorOrder, { as: 'vendorOrders', foreignKey: 'orderId', sourceKey: 'id' });
VendorOrder.belongsTo(Order, { as: 'order', foreignKey: 'orderId', targetKey: 'id' });

// Vendor - VendorOrder
Vendor.hasMany(VendorOrder, { as: 'orders', foreignKey: 'vendorId', sourceKey: 'id' });
VendorOrder.belongsTo(Vendor, { as: 'vendor', foreignKey: 'vendorId', targetKey: 'id' });

// Vendor - VendorPayout
Vendor.hasMany(VendorPayout, { as: 'payouts', foreignKey: 'vendorId', sourceKey: 'id' });
VendorPayout.belongsTo(Vendor, { as: 'vendor', foreignKey: 'vendorId', targetKey: 'id' });

// Product - Vendor (marketplace)
Vendor.hasMany(Product, { as: 'products', foreignKey: 'vendorId', sourceKey: 'id' });
Product.belongsTo(Vendor, { as: 'vendor', foreignKey: 'vendorId', targetKey: 'id' });

// ============================================
// DELIVERY INTEGRATION — Shipping & Tracking (#26)
// ============================================

// User - ShippingAddress
User.hasMany(ShippingAddress, { foreignKey: 'userId', sourceKey: 'id' });
ShippingAddress.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// Order - ShipmentTracking
Order.hasMany(ShipmentTracking, {
  as: 'shipmentTrackings',
  foreignKey: 'orderId',
  sourceKey: 'id',
});
ShipmentTracking.belongsTo(Order, { as: 'order', foreignKey: 'orderId', targetKey: 'id' });

// VendorOrder - ShipmentTracking
VendorOrder.hasMany(ShipmentTracking, {
  as: 'shipmentTrackings',
  foreignKey: 'vendorOrderId',
  sourceKey: 'id',
});
ShipmentTracking.belongsTo(VendorOrder, {
  as: 'vendorOrder',
  foreignKey: 'vendorOrderId',
  targetKey: 'id',
});

// DeliveryProvider - ShipmentTracking
DeliveryProvider.hasMany(ShipmentTracking, {
  as: 'shipmentTrackings',
  foreignKey: 'providerId',
  sourceKey: 'id',
});
ShipmentTracking.belongsTo(DeliveryProvider, {
  as: 'provider',
  foreignKey: 'providerId',
  targetKey: 'id',
});

// Order - ShippingAddress
Order.belongsTo(ShippingAddress, {
  as: 'shippingAddress',
  foreignKey: 'shippingAddressId',
  targetKey: 'id',
});

// ============================================
// AFFILIATE CONTRACTS — Contract Relations
// ============================================

// User - AffiliateContract (user acceptance records)
User.hasMany(AffiliateContract, { foreignKey: 'userId', sourceKey: 'id' });
AffiliateContract.belongsTo(User, { as: 'user', foreignKey: 'userId', targetKey: 'id' });

// ContractTemplate - AffiliateContract
ContractTemplate.hasMany(AffiliateContract, { foreignKey: 'templateId', sourceKey: 'id' });
AffiliateContract.belongsTo(ContractTemplate, {
  as: 'template',
  foreignKey: 'templateId',
  targetKey: 'id',
});

// User - AffiliateContract (for revokedBy)
User.hasMany(AffiliateContract, {
  as: 'revokedContracts',
  foreignKey: 'revokedBy',
  sourceKey: 'id',
});
AffiliateContract.belongsTo(User, {
  as: 'revokedByUser',
  foreignKey: 'revokedBy',
  targetKey: 'id',
});

// ── Achievement / Badge / UserAchievement associations ────────────────────────
Achievement.hasOne(Badge, { as: 'badge', foreignKey: 'achievementId', sourceKey: 'id' });
Badge.belongsTo(Achievement, { foreignKey: 'achievementId', targetKey: 'id' });

Achievement.hasMany(UserAchievement, {
  as: 'userAchievements',
  foreignKey: 'achievementId',
  sourceKey: 'id',
});
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievementId', targetKey: 'id' });

User.hasMany(UserAchievement, { as: 'userAchievements', foreignKey: 'userId', sourceKey: 'id' });
UserAchievement.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

export {
  sequelize,
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
  Wallet,
  WalletTransaction,
  WithdrawalRequest,
  CommissionConfig,
  PushSubscription,
  GiftCard,
  QrMapping,
  GiftCardTransaction,
  Cart,
  CartItem,
  CartRecoveryToken,
  EmailTemplate,
  EmailCampaign,
  CampaignRecipient,
  EmailQueue,
  EmailCampaignLog,
  Category,
  MAX_CATEGORY_DEPTH,
  InventoryMovement,
  Vendor,
  VendorOrder,
  VendorPayout,
  ShippingAddress,
  DeliveryProvider,
  ShipmentTracking,
  ContractTemplate,
  AffiliateContract,
  Achievement,
  Badge,
  UserAchievement,
  WebhookEvent,
};

export function initModels(): void {
  console.log('✅ Models initialized');
}
