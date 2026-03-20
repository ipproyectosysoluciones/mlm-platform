import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Crown className="w-6 h-6 text-yellow-600" />
            <h1 className="text-xl font-bold text-indigo-600">Admin Dashboard</h1>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Users"
            value={stats?.totalUsers || 0}
            color="blue"
          />
          <StatCard
            icon={<UserCheck className="w-6 h-6" />}
            label="Active Users"
            value={stats?.activeUsers || 0}
            color="green"
          />
          <StatCard
            icon={<UserX className="w-6 h-6" />}
            label="Inactive Users"
            value={stats?.inactiveUsers || 0}
            color="red"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Left/Right Ratio"
            value={`${stats?.leftPercentage || 0}% / ${stats?.rightPercentage || 0}%`}
            color="purple"
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Position
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Level</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
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
                        {user.status}
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
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
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
                            title="Promote to Admin"
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
            <div className="p-8 text-center text-gray-500">No users found</div>
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
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
