/**
 * UsersTable - Admin users table with actions
 * Tabla de usuarios admin con acciones de edición
 *
 * @module components/admin/UsersTable
 */
import { useTranslation } from 'react-i18next';
import { UserCheck, UserX, Crown } from 'lucide-react';

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

interface UsersTableProps {
  users: UserData[];
  onToggleStatus: (user: UserData) => void;
  onPromote: (user: UserData) => void;
}

export default function UsersTable({ users, onToggleStatus, onPromote }: UsersTableProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return <div className="p-8 text-center text-slate-500">{t('admin.noUsersFound')}</div>;
  }

  return (
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
          {users.map((user) => (
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
                    onClick={() => onToggleStatus(user)}
                    className={`p-2 rounded-lg ${
                      user.status === 'active'
                        ? 'hover:bg-red-100 text-red-600'
                        : 'hover:bg-green-100 text-green-600'
                    }`}
                    title={user.status === 'active' ? t('admin.deactivate') : t('admin.activate')}
                  >
                    {user.status === 'active' ? (
                      <UserX className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onPromote(user)}
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
  );
}
