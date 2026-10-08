export interface User {
  username: string;
  full_name: string;
  email?: string | null;
  role: string;
  role_label?: string;
  registration_status?: 'PENDING' | 'APPROVED';
  created_at?: string;
  active: boolean;
  permissions: string[];
  last_login_at?: string;
}

export interface AuditEntry {
  entity_type: string;
  entity_id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string | null;
  changed_fields: string[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
