/**
 * AdminDashboard - Panel principal de administración con acceso rápido a sub-páginas.
 *
 * AdminDashboard - Main admin panel with quick-access cards to sub-pages.
 *
 * @module pages/AdminDashboard
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Crown,
  RefreshCw,
  Building2,
  MapPin,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import { adminService } from '../services/api';
import { StatsOverview, UserFilters, UsersTable, CRMAutomationWidget } from '../components/admin';

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

/** Quick-access cards for admin sub-pages / Tarjetas de acceso rápido a sub-páginas admin */
const QUICK_ACCESS_CARDS = [
  {
    path: '/admin/properties',
    titleKey: 'nav.adminProperties',
    descriptionKey: 'admin.manageProperties',
    icon: Building2,
    gradient: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-500/25',
  },
  {
    path: '/admin/tours',
    titleKey: 'nav.adminTours',
    descriptionKey: 'admin.manageTours',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/25',
  },
  {
    path: '/admin/reservations',
    titleKey: 'nav.adminReservations',
    descriptionKey: 'admin.manageReservations',
    icon: CalendarDays,
    gradient: 'from-purple-500 to-pink-500',
    shadow: 'shadow-purple-500/25',
  },
  {
    path: '/admin/commissions',
    titleKey: 'nav.commissionConfig',
    descriptionKey: 'admin.manageCommissions',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25',
  },
];

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

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">{t('admin.quickAccess')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACCESS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className={`
                  group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-5
                  hover:shadow-lg ${card.shadow} transition-all duration-300 hover:-translate-y-0.5
                `}
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{t(card.titleKey)}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t(card.descriptionKey)}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <StatsOverview stats={stats} />

        {/* CRM Automation Widget / Widget de automatización CRM */}
        <div className="mb-8">
          <CRMAutomationWidget />
        </div>

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
