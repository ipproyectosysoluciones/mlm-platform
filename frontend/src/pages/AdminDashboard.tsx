import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, TrendingUp, ArrowLeft, RefreshCw, UserCheck, UserX, Crown } from 'lucide-react';
import { adminService } from '../services/api';

interface UserData {
  id: string;
  email: string;
  level: number;
  status: string;
  role: string;
  position: string | null;
  referralCode: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(user: UserData) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  async function promoteToAdmin(user: UserData) {
    try {
      await adminService.promoteToAdmin(user.id);
      loadData();
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  }

  const filteredUsers = users.filter((user) => {
    if (filter !== 'all' && user.status !== filter) return false;
    if (search && !user.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
            <p className="text-slate-500 text-sm">{t('admin.subtitle')}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label={t('admin.totalUsers')}
            value={stats?.totalUsers || 0}
            color="blue"
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6" />}
            label={t('admin.activeUsers')}
            value={stats?.activeUsers || 0}
            color="green"
          />
          <StatCard
            icon={<UserX className="w-6 h-6" />}
            label={t('admin.inactiveUsers')}
            value={stats?.inactiveUsers || 0}
            color="red"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label={t('admin.ratio')}
            value={`${stats?.leftPercentage || 0}% / ${stats?.rightPercentage || 0}%`}
            color="purple"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('admin.users')}</h2>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder={t('admin.searchByEmail')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">{t('admin.all')}</option>
                <option value="active">{t('admin.active')}</option>
                <option value="inactive">{t('admin.inactive')}</option>
              </select>
              <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                    {t('admin.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                    {t('status.active')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                    {t('tree.details.position')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                    {t('profile.level')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                    {t('common.confirm')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{user.position || '-'}</td>
                    <td className="px-4 py-3 text-sm">{user.level}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`p-2 rounded-lg ${
                            user.status === 'active'
                              ? 'hover:bg-red-100 text-red-600'
                              : 'hover:bg-green-100 text-green-600'
                          }`}
                          title={
                            user.status === 'active' ? t('admin.deactivate') : t('admin.activate')
                          }
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => promoteToAdmin(user)}
                            className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg"
                            title={t('admin.promote')}
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">{t('admin.noUsersFound')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
