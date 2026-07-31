/** Domain types for CRM / Tipos de dominio para CRM. @module types/crm */

// CRM Types
export interface Lead {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  source: 'website' | 'referral' | 'social' | 'landing_page' | 'manual' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  leadId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  createdAt: Date;
}

export interface Communication {
  id: string;
  leadId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  content: string;
  createdAt: Date;
}

export interface CRMStats {
  totalLeads: number;
  wonLeads: number;
  inProgress: number;
  conversionRate: number;
}
