/**
 * @fileoverview AdminNotesModal — Modal for updating reservation status and admin notes.
 * Used by AdminReservationsPage. Not a generic CRUD modal — reservations have
 * a different workflow (status transitions + admin notes).
 *
 * @module components/admin/AdminNotesModal
 */
import { useState } from 'react';
import { X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface AdminNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentStatus: string;
  statusOptions: { value: string; label: string }[];
  currentNotes: string;
  onSave: (status: string, notes: string) => Promise<void>;
}

/**
 * Modal for editing reservation status and admin notes.
 *
 * Not a full CRUD form — this is specific to the reservations workflow
 * where admins update the reservation status (confirm, cancel, etc.)
 * and optionally add internal notes.
 *
 * @example
 * ```tsx
 * <AdminNotesModal
 *   isOpen={showNotes}
 *   onClose={closeNotesModal}
 *   title={`Reserva: ${reservation.guestName}`}
 *   currentStatus={selectedReservation.status}
 *   statusOptions={RESERVATION_STATUS_OPS}
 *   currentNotes={selectedReservation.adminNotes ?? ''}
 *   onSave={handleSaveNotes}
 * />
 * ```
 */
export default function AdminNotesModal({
  isOpen,
  onClose,
  title,
  currentStatus,
  statusOptions,
  currentNotes,
  onSave,
}: AdminNotesModalProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  // State syncs from props on each open; the parent controls
  // the modal lifecycle via `isOpen` which triggers re-mount
  // in the Dialog primitive.

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(status, notes);
      onClose();
    } catch {
      // Error handling is the parent's responsibility
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Actualizar estado y notas de la reserva</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Notas del administrador
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Notas internas sobre la reserva..."
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
