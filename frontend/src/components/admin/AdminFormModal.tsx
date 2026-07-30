/**
 * @fileoverview AdminFormModal — Reusable create/edit modal for admin CRUD entities.
 * Uses React children (render prop pattern) to render entity-specific form fields.
 *
 * @module components/admin/AdminFormModal
 */
import { X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modal title (e.g. "Nueva propiedad" or "Editar tour") */
  title: string;
  /** Called when the form is submitted (handles create vs edit internally) */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether a save operation is in flight */
  saving: boolean;
  children: React.ReactNode;
}

/**
 * Generic form modal for create/edit operations.
 *
 * The parent page renders its entity-specific form fields as `children`,
 * keeping the modal layout (title, save/cancel buttons) shared.
 *
 * @example
 * ```tsx
 * <AdminFormModal
 *   isOpen={showForm}
 *   onClose={closeModal}
 *   title={editingId ? 'Editar propiedad' : 'Nueva propiedad'}
 *   saving={saving}
 *   onSubmit={handleSubmit}
 * >
 *   {children}
 * </AdminFormModal>
 * ```
 */
export default function AdminFormModal({
  isOpen,
  onClose,
  title,
  saving,
  onSubmit,
  children,
}: AdminFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completá los campos del formulario. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {children}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
