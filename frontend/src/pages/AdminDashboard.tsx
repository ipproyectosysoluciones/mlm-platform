import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Crown, RefreshCw } from 'lucide-react';
import { adminService } from '../services/api';
import { StatsOverview, UserFilters, UsersTable } from '../components/admin';

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
        <StatsOverview stats={stats} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900">{t('admin.users')}</h2>
            <UserFilters
              search={search}
              filter={filter}
              onSearchChange={setSearch}
              onFilterChange={setFilter}
              onRefresh={loadData}
            />
          </div>

          <UsersTable
            users={filteredUsers}
            onToggleStatus={toggleUserStatus}
            onPromote={promoteToAdmin}
          />
        </div>
      </div>
    </div>
  );
}
