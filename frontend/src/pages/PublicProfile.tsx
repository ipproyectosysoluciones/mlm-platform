import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProfileSEO } from '../hooks/useSEO';
import api from '../services/api';

interface PublicProfileData {
  referralCode: string;
  fullName: string;
  email: string;
  phone?: string;
  level: number;
  levelName: string;
  joinDate: string;
  totalDownline: number;
  directReferrals: number;
  description?: string;
  avatarUrl?: string;
}

export default function PublicProfile() {
  const { code } = useParams<{ code: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!code) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data } = await api.get(`/public/profile/${code}`);
        if (data.success) {
          setProfile(data.data);
        } else {
          setError('Perfil no encontrado');
        }
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('No se pudo cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [code]);

  useProfileSEO({
    referralCode: profile?.referralCode || code || '',
    level: profile?.level,
    levelName: profile?.levelName,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Perfil no encontrado</h2>
          <p className="text-gray-600 mb-6">
            El código de referido no existe o el perfil no está disponible.
          </p>
          <a
            href="/register"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Registrarse
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32" />
          <div className="relative px-6 pb-6">
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-14">
              <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  Nivel {profile.level} - {profile.levelName}
                </span>
                <span className="text-sm text-gray-500">
                  Miembro desde{' '}
                  {new Date(profile.joinDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{profile.directReferrals}</div>
            <div className="text-sm text-gray-500 mt-1">Referidos Directos</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{profile.totalDownline}</div>
            <div className="text-sm text-gray-500 mt-1">Total Downline</div>
          </div>
        </div>

        {/* Description */}
        {profile.description && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Sobre este afiliado</h2>
            <p className="text-gray-600">{profile.description}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Información de Contacto</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="text-gray-900 font-medium">{profile.email}</div>
              </div>
            </div>

            {profile.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Teléfono</div>
                  <div className="text-gray-900 font-medium">{profile.phone}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-center text-white">
          <h2 className="text-xl font-bold mb-2">¿Listo para unirte?</h2>
          <p className="text-indigo-100 mb-4">
            Regístrate con este afiliado y comienza tu camino hacia la libertad financiera.
          </p>
          <a
            href={`/register?ref=${profile.referralCode}`}
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Registrarse Ahora
          </a>
        </div>

        {/* Referral Code Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Código de Referido:</span>
            <span className="font-mono font-bold text-indigo-600">{profile.referralCode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
