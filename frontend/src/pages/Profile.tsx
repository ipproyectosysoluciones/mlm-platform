import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Gift, Calendar, LogOut } from 'lucide-react';
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async function handleChangePassword() {
    const { value: formValues } = await Swal.fire({
      title: 'Change Password',
      html: `
        <input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password">
        <input type="password" id="newPassword" class="swal2-input" placeholder="New Password (min 8 chars)">
        <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm New Password">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Change Password',
      confirmButtonColor: '#6366f1',
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
          Swal.showValidationMessage('All fields are required');
          return false;
        }

        if (newPassword.length < 8) {
          Swal.showValidationMessage('Password must be at least 8 characters');
          return false;
        }

        if (!/\d/.test(newPassword)) {
          Swal.showValidationMessage('Password must contain at least one number');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Passwords do not match');
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
          title: 'Success',
          text: 'Password changed successfully',
          confirmButtonColor: '#6366f1',
        });
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error?.message || 'Failed to change password',
          confirmButtonColor: '#6366f1',
        });
      }
    }
  }

  async function handleUpdateProfile() {
    const { value: formValues } = await Swal.fire({
      title: 'Update Profile',
      html: `
        <input type="text" id="firstName" class="swal2-input" placeholder="First Name" value="${profile?.firstName || ''}">
        <input type="text" id="lastName" class="swal2-input" placeholder="Last Name" value="${profile?.lastName || ''}">
        <input type="text" id="phone" class="swal2-input" placeholder="Phone" value="${profile?.phone || ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#6366f1',
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
          title: 'Success',
          text: 'Profile updated successfully',
          confirmButtonColor: '#6366f1',
        });
        loadProfile();
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error?.message || 'Failed to update profile',
          confirmButtonColor: '#6366f1',
        });
      }
    }
  }

  async function handleDeleteAccount() {
    if (profile?.role === 'admin') {
      Swal.fire({
        icon: 'warning',
        title: 'Not Allowed',
        text: 'Admin accounts cannot be deleted',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    const { value: password } = await Swal.fire({
      title: 'Delete Account',
      text: 'This action cannot be undone. Enter your password to confirm.',
      input: 'password',
      inputPlaceholder: 'Enter your password',
      showCancelButton: true,
      confirmButtonText: 'Delete Account',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('Password is required');
        }
        return value;
      },
    });

    if (password) {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'Your account will be permanently deleted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6366f1',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        try {
          await authService.deleteAccount(password);
          Swal.fire({
            icon: 'success',
            title: 'Account Deleted',
            text: 'Your account has been deleted.',
            confirmButtonColor: '#6366f1',
          }).then(() => {
            logout();
          });
        } catch (error: any) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.error?.message || 'Failed to delete account',
            confirmButtonColor: '#6366f1',
          });
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.email}</h1>
              <p className="text-gray-500">
                Member since {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Referral Code</p>
                <p className="font-medium font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {profile?.referralCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-medium">{profile?.level || 1}</p>
              </div>
            </div>

            {profile?.sponsor && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Sponsor</p>
                  <p className="font-medium font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                    {profile.sponsor.referralCode}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            <div className="space-y-3">
              <button
                onClick={handleChangePassword}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={handleUpdateProfile}
                className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Update Profile
              </button>
              {profile?.role !== 'admin' && (
                <button
                  onClick={handleDeleteAccount}
                  className="w-full text-left px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete Account
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
