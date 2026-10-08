import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface Option {
  value: string;
  label: string;
}

export interface ConditionField extends Option {
  group: 'Customer' | 'Product' | 'Order';
  operators: string[];
}

export interface Meta {
  permissions: (Option & { description: string })[];
  timezones: string[];
  campaign_statuses: Option[];
  condition_fields: ConditionField[];
  operators: Option[];
  action_types: Option[];
  rule_families: Option[];
  rule_types: Option[];
  comparison_modes: Option[];
  cap_treatments: Option[];
  quantity_bases: Option[];
  item_roles: Option[];
  programmes: Option[];
  boolean_fields: string[];
  controlled_values: { channel: string[]; banner: string[]; marketing_flag: string[] };
}

export interface RoleDef {
  role: string;
  label: string;
  description?: string | null;
  permissions: string[];
  system: boolean;
  user_count: number;
}

export interface AppSettings {
  organization_name: string;
  currency: string;
  timezone: string;
  controlled_values?: { channel?: string[]; banner?: string[]; marketing_flag?: string[] };
  updated_at?: string;
  updated_by?: string;
}

/** Reference lists served by the backend (GET /meta): permissions, timezones and the campaign rule vocabulary. */
export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: async () => (await api.get<Meta>('/meta')).data,
    staleTime: Infinity,
  });
}

export function useRoles(enabled = true) {
  return useQuery({ queryKey: ['roles'], queryFn: async () => (await api.get<RoleDef[]>('/roles')).data, enabled });
}

export function useAppSettings(enabled = true) {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<AppSettings>('/settings')).data,
    enabled,
    staleTime: 60_000,
  });
}

export function labelOf(options: Option[] | undefined, value?: string | null) {
  return options?.find((o) => o.value === value)?.label ?? value ?? '';
}
