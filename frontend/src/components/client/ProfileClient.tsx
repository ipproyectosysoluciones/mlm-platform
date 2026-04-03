/**
 * @fileoverview Client-side Profile component
 * @description Interactive profile component with optimistic updates
 *              Componente de perfil interactivo con actualizaciones optimistas
 * @module components/client/ProfileClient
 */

import { useState, useCallback, type ReactNode } from 'react';
import { authService } from '../../services/api';
import { useOptimistic } from '../../hooks/useOptimistic';
import type { User } from '../../types';

interface ProfileClientProps {
  initialData: User;
  onProfileUpdate?: (user: User) => void;
}

/**
 * Client-side Profile component
 * Handles all interactive features including optimistic updates
 */
export function ProfileClient({ initialData, onProfileUpdate }: ProfileClientProps): ReactNode {
  const {
    data: profile,
    isOptimistic,
    error,
    updateOptimistically,
    rollback,
  } = useOptimistic(initialData);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
  });

  const handleEdit = useCallback(() => {
    setEditForm({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
    });
    setIsEditing(true);
  }, [profile]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditForm({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
    });
  }, [profile]);

  const handleSave = useCallback(async () => {
    await updateOptimistically(
      { ...profile, ...editForm }, // Optimistic update
      async () => {
        await authService.updateProfile(editForm);
        const updatedUser = { ...profile, ...editForm };
        onProfileUpdate?.(updatedUser);
        return updatedUser;
      }
    );
    setIsEditing(false);
  }, [profile, editForm, updateOptimistically, onProfileUpdate]);

  const handleChange = useCallback((field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className={`space-y-6 ${isOptimistic ? 'opacity-70 transition-opacity' : ''}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfil</h1>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
          <p className="text-destructive text-sm">Error al actualizar: {error.message}</p>
          <button onClick={() => rollback(initialData)} className="text-sm underline mt-2">
            Deshacer
          </button>
        </div>
      )}

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <ProfileForm
          profile={profile}
          isEditing={isEditing}
          editForm={editForm}
          onChange={handleChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      <ProfileInfo profile={profile} />

      {profile.referralCode && <ReferralCodeDisplay referralCode={profile.referralCode} />}
    </div>
  );
}

/**
 * Profile form component
 */
function ProfileForm({
  profile,
  isEditing,
  editForm,
  onChange,
  onSave,
  onCancel,
}: {
  profile: User;
  isEditing: boolean;
  editForm: { firstName: string; lastName: string; phone: string };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}): ReactNode {
  if (!isEditing) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-muted-foreground">Nombre</label>
          <p className="font-medium">{profile.firstName || 'No definido'}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Apellido</label>
          <p className="font-medium">{profile.lastName || 'No definido'}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <p className="font-medium">{profile.email}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Teléfono</label>
          <p className="font-medium">{profile.phone || 'No definido'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Nombre</label>
          <input
            type="text"
            value={editForm.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Apellido</label>
          <input
            type="text"
            value={editForm.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            placeholder="Tu apellido"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Teléfono</label>
          <input
            type="tel"
            value={editForm.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            placeholder="Tu teléfono"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/**
 * Profile info section
 */
function ProfileInfo({ profile }: { profile: User }): ReactNode {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="font-semibold mb-4">Información de la Cuenta</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm text-muted-foreground">Nivel</label>
          <p className="font-medium">
            {profile.level} - {profile.levelName ?? 'N/A'}
          </p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Rol</label>
          <p className="font-medium capitalize">{profile.role ?? 'Usuario'}</p>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">ID de Usuario</label>
          <p className="font-mono text-sm">{profile.id}</p>
        </div>
        {profile.sponsorId && (
          <div>
            <label className="text-sm text-muted-foreground">Patrocinador ID</label>
            <p className="font-mono text-sm">{profile.sponsorId}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Referral code display component
 */
function ReferralCodeDisplay({ referralCode }: { referralCode: string }): ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="font-semibold mb-2">Código de Referido</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={referralCode}
          readOnly
          className="flex-1 px-3 py-2 border rounded-md bg-background font-mono"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
