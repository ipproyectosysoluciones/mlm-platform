import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Gift, Calendar, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import Swal from 'sweetalert2';
import type { User as UserType } from '../types';

interface ProfileData extends UserType {
  sponsor?: {
    id: string;
    referralCode: string;
  };
  createdAt?: Date;
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await authService.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async function handleChangePassword() {
    const { value: formValues } = await Swal.fire({
      title: t('profile.changePassword'),
      html: `
        <input type="password" id="currentPassword" class="swal2-input" placeholder="${t('profile.currentPassword')}">
        <input type="password" id="newPassword" class="swal2-input" placeholder="${t('profile.newPassword')} (min 8)">
        <input type="password" id="confirmPassword" class="swal2-input" placeholder="${t('profile.confirmNewPassword')}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('profile.changePassword'),
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const currentPassword = (
          Swal.getPopup()?.querySelector('#currentPassword') as HTMLInputElement
        )?.value;
        const newPassword = (Swal.getPopup()?.querySelector('#newPassword') as HTMLInputElement)
          ?.value;
        const confirmPassword = (
          Swal.getPopup()?.querySelector('#confirmPassword') as HTMLInputElement
        )?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage(t('common.error'));
          return false;
        }

        if (newPassword.length < 8) {
          Swal.showValidationMessage(t('auth.passwordMinLength'));
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage(t('auth.passwordsNotMatch'));
          return false;
        }

        return { currentPassword, newPassword };
      },
    });

    if (formValues) {
      try {
        await authService.changePassword(formValues.currentPassword, formValues.newPassword);
        Swal.fire({
          icon: 'success',
          title: 'OK',
          text: t('common.success') || 'Success',
          confirmButtonColor: '#10b981',
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: t('common.error'),
          text: error.response?.data?.error?.message || t('common.error'),
          confirmButtonColor: '#10b981',
        });
      }
    }
  }

  async function handleUpdateProfile() {
    const { value: formValues } = await Swal.fire({
      title: t('profile.updateProfile'),
      html: `
        <input type="text" id="firstName" class="swal2-input" placeholder="${t('profile.firstName')}" value="${profile?.firstName || ''}">
        <input type="text" id="lastName" class="swal2-input" placeholder="${t('profile.lastName')}" value="${profile?.lastName || ''}">
        <input type="text" id="phone" class="swal2-input" placeholder="${t('profile.phone')}" value="${profile?.phone || ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t('common.save'),
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const firstName = (Swal.getPopup()?.querySelector('#firstName') as HTMLInputElement)?.value;
        const lastName = (Swal.getPopup()?.querySelector('#lastName') as HTMLInputElement)?.value;
        const phone = (Swal.getPopup()?.querySelector('#phone') as HTMLInputElement)?.value;

        return { firstName, lastName, phone };
      },
    });

    if (formValues) {
      try {
        await authService.updateProfile(formValues);
        Swal.fire({
          icon: 'success',
          title: 'OK',
          text: t('common.success') || 'Success',
          confirmButtonColor: '#10b981',
        });
        loadProfile();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: t('common.error'),
          text: error.response?.data?.error?.message || t('common.error'),
          confirmButtonColor: '#10b981',
        });
      }
    }
  }

  async function handleDeleteAccount() {
    if (profile?.role === 'admin') {
      Swal.fire({
        icon: 'warning',
        title: 'OK',
        text: t('profile.adminCannotDelete'),
        confirmButtonColor: '#10b981',
      });
      return;
    }

    const { value: password } = await Swal.fire({
      title: t('profile.deleteAccount'),
      text: t('profile.deleteConfirmText'),
      input: 'password',
      inputPlaceholder: t('profile.passwordRequired'),
      showCancelButton: true,
      confirmButtonText: t('profile.deleteButton'),
      confirmButtonColor: '#dc2626',
      cancelButtonText: t('profile.cancelButton'),
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage(t('profile.passwordRequired'));
        }
        return value;
      },
    });

    if (password) {
      const result = await Swal.fire({
        title: t('profile.deleteConfirmTitle'),
        text: t('profile.deleteConfirmText'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#10b981',
        confirmButtonText: t('profile.deleteButton'),
        cancelButtonText: t('profile.cancelButton'),
      });

      if (result.isConfirmed) {
        try {
          await authService.deleteAccount(password);
          Swal.fire({
            icon: 'success',
            title: 'OK',
            text: t('common.success') || 'Success',
            confirmButtonColor: '#10b981',
          }).then(() => {
            logout();
          });
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: t('common.error'),
            text: error.response?.data?.error?.message || t('common.error'),
            confirmButtonColor: '#10b981',
          });
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>
          <p className="text-slate-500 text-sm">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.email}</h2>
            <p className="text-slate-500 text-sm">
              {t('profile.memberSince')}{' '}
              {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">{t('profile.email')}</p>
              <p className="font-medium text-slate-900">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">{t('profile.referralCode')}</p>
              <p className="font-mono bg-slate-100 px-3 py-1.5 rounded-lg inline-block font-medium">
                {profile?.referralCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">{t('profile.level')}</p>
              <p className="font-medium text-slate-900">{profile?.level || 1}</p>
            </div>
          </div>

          {profile?.sponsor && (
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">{t('profile.sponsor')}</p>
                <p className="font-mono bg-slate-100 px-3 py-1.5 rounded-lg inline-block font-medium">
                  {profile.sponsor.referralCode}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t('profile.accountSettings')}
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleChangePassword}
              className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4 text-slate-600" />
              </div>
              <span className="font-medium text-slate-700">{t('profile.changePassword')}</span>
            </button>
            <button
              onClick={handleUpdateProfile}
              className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <span className="font-medium text-slate-700">{t('profile.updateProfile')}</span>
            </button>
            <Link
              to="/landing-pages"
              className="w-full text-left px-4 py-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <span className="font-medium text-slate-700">{t('profile.landingPages')}</span>
            </Link>
            {profile?.role !== 'admin' && (
              <button
                onClick={handleDeleteAccount}
                className="w-full text-left px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium">{t('profile.deleteAccount')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
