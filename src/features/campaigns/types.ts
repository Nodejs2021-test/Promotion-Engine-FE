export type CampaignStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';

export interface Eligibility {
  customer_ids: string[];
  customer_groups: string[];
  channels: string[];
  skus: string[];
  item_groups: string[];
}

export interface ConditionValue {
  field: string;
  operator: string;
  value: string | number | string[];
}

export interface RuleAction {
  action_type: string;
  value: number;
}

export interface RuleItem {
  item_id?: string | null;
  item_code?: string | null;
  item_name?: string | null;
  include: boolean;
  mixed_pool_id?: string | null;
  role: string;
  rate?: number | null;
  active?: boolean;
}

export interface RuleTier {
  position: number;
  min_quantity: number;
  max_quantity?: number | null;
  discount_percentage?: number | null;
  fixed_unit_rate?: number | null;
}

export interface Rule {
  rule_id: string;
  campaign_id: string;
  name: string;
  priority: number;
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  conditions: ConditionValue[];
  action?: RuleAction | null;
  family: string;
  rule_type: string;
  comparison_mode: string;
  cap_treatment: string;
  version: number;
  programme_code?: string | null;
  promotion_code?: string | null;
  quantity_basis: string;
  mixed_pool_id?: string | null;
  required_shipper_multiple?: number | null;
  items?: RuleItem[];
  tiers?: RuleTier[];
  rate_overrides?: { item_id: string; tier_position: number; discount_percentage: number }[];
  max_discount_percentage?: number | null;
  bonus?: { buy_quantity: number; bonus_quantity: number; repeatable: boolean; permitted_family?: string | null } | null;
  source_reference?: string | null;
  notes?: string | null;
  currency?: string | null;
  max_uses_total?: number | null;
  max_uses_per_customer?: number | null;
  /** Plain-language conditions, e.g. "Quantity >= 6". */
  when: string[];
  /** Plain-language action, e.g. "35% discount". */
  then: string;
  min_quantity: number;
}

export interface Campaign {
  campaign_id: string;
  code: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  eligibility: Eligibility;
  approval_status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';
  status: CampaignStatus;
  enabled: boolean;
  priority: number;
  rule_count: number;
  submitted_by?: string | null;
  submitted_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  approved_once?: boolean;
  last_rejection?: { by: string; at: string; comment?: string | null } | null;
  created_by?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface CampaignDetail extends Campaign {
  rules: Rule[];
}

export interface CheckOrderRow {
  position: number;
  campaign_id: string;
  campaign_name: string;
  campaign_priority: number;
  rule_id: string;
  rule_name: string;
  rule_priority: number;
  rule_version: number;
  family: string;
  specificity: number;
  min_quantity: number;
  when: string[];
  then: string;
}
