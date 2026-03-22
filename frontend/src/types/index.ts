export interface User {
  id: string;
  email: string;
  referralCode: string;
  level: number;
  levelName?: string;
  role?: 'admin' | 'user';
  sponsorId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  sponsorReferralCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalReferrals: number;
  leftCount: number;
  rightCount: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  referralLink: string;
  recentCommissions: Commission[];
  recentReferrals: Referral[];
}

export interface Commission {
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: Date;
  fromUser?: {
    email: string;
    referralCode: string;
  };
}

export interface Referral {
  id: string;
  email: string;
  position: string;
  createdAt: Date;
}

export interface TreeNode {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  stats: {
    leftCount: number;
    rightCount: number;
  };
  children: TreeNode[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * UserDetails - Información extendida de usuario (Phase 3)
 * UserDetails - Extended user information (Phase 3)
 */
export interface UserDetails {
  id: string;
  email: string;
  referralCode: string;
  position: 'left' | 'right';
  level: number;
  status: 'active' | 'inactive';
  createdAt: string;
  stats: {
    leftCount: number;
    rightCount: number;
    totalDownline: number;
  };
}
