/**
 * Dashboard - Panel principal del usuario MLM
 * Dashboard - Main MLM user panel
 * 
 * Muestra estadísticas, enlace de referido, QR code y actividad reciente.
 * Shows stats, referral link, QR code, and recent activity.
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Copy,
  Check,
  LogOut,
  TreeDeciduous,
  QrCode,
  Loader2,
  User,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import type { DashboardData } from '../types';
import QRDisplay from '../components/QRDisplay';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadRef = useRef(false);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    
    const loadDashboard = async () => {
      try {
        const dashboardData = await dashboardService.getDashboard();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">MLM Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            {(user as any)?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Admin
              </Link>
            )}
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Referrals"
            value={data.stats.totalReferrals.toString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Earnings"
            value={`$${data.stats.totalEarnings.toFixed(2)}`}
            color="bg-green-500"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Pending"
            value={`$${data.stats.pendingEarnings.toFixed(2)}`}
            color="bg-yellow-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Binary Tree</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Left Leg</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.stats.leftCount}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Right Leg</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.stats.rightCount}
                </p>
              </div>
            </div>
            <Link
              to="/tree"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <TreeDeciduous className="w-4 h-4" />
              View Full Tree
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={data.referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyLink}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQR && (
              <div className="mt-4 flex justify-center">
                <QRDisplay value={data.referralLink} referralCode={user?.referralCode || ''} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Commissions</h2>
            {data.recentCommissions.length > 0 ? (
              <div className="space-y-3">
                {data.recentCommissions.map((commission) => (
                  <div
                    key={commission.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{commission.type}</p>
                      <p className="text-sm text-gray-500">
                        {commission.fromUser?.email || 'System'}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      +${commission.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No commissions yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Referrals</h2>
            {data.recentReferrals.length > 0 ? (
              <div className="space-y-3">
                {data.recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{referral.email}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {referral.position} leg
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * StatCard - Tarjeta de estadística con icono
 * StatCard - Statistics card with icon
 */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
