import { useMutation } from '@tanstack/react-query';
import { CircleAlertIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/shared/date-picker';
import { SimpleSelect } from '@/components/shared/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api, errorText } from '@/lib/api-client';
import { labelOf, useMeta } from '@/lib/meta';
import type { CampaignDetail, Rule } from './types';

interface Row { field: string; operator: string; value: string }
interface ItemRow { item_id: string; item_code: string; item_name: string; include: boolean; mixed_pool_id: string; role: string; rate: string }
interface TierRow { min: string; max: string; kind: 'pct' | 'fixed'; value: string }
interface OverrideRow { item_id: string; tier: string; pct: string }

interface Draft {
  name: string;
  active: boolean;
  start_date?: string;
  end_date?: string;
  family: string;
  comparison_mode: string;
  cap_treatment: string;
  programme_code: string;
  promotion_code: string;
  rows: Row[];
  items: ItemRow[];
  quantity_basis: string;
  mixed_pool_id: string;
  shipper_multiple: string;
  outcome: 'single' | 'tiers';
  action_type: string;
  action_value: string;
  tiers: TierRow[];
  overrides: OverrideRow[];
  max_discount: string;
  buy: string;
  bonus_qty: string;
  repeatable: boolean;
  permitted_family: string;
  source_reference: string;
  notes: string;
  currency: string;
  max_total: string;
  max_customer: string;
}

const NUMBER_OPS = new Set(['gte', 'lte']);
const LIST_OPS = new Set(['in', 'not_in']);
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const num = (v: string) => (v.trim() === '' ? null : Number(v));
const NO_ITEM: ItemRow = { item_id: '', item_code: '', item_name: '', include: true, mixed_pool_id: '', role: 'STANDARD', rate: '' };

function fromRule(r?: Rule | null): Draft {
  return {
    name: r?.name ?? '',
    active: r?.active ?? true,
    start_date: r?.start_date || undefined,
    end_date: r?.end_date || undefined,
    family: r?.family ?? 'EVERYDAY',
    comparison_mode: r?.comparison_mode ?? 'BEST_PRICE',
    cap_treatment: r?.cap_treatment ?? 'APPLY_CAP',
    programme_code: r?.programme_code ?? '',
    promotion_code: r?.promotion_code ?? '',
    rows: r
      ? r.conditions.map((c) => ({ field: c.field, operator: c.operator, value: Array.isArray(c.value) ? c.value.join(', ') : s(c.value) }))
      : [{ field: 'quantity', operator: 'gte', value: '' }],
    items: (r?.items ?? []).map((i) => ({
      item_id: s(i.item_id), item_code: s(i.item_code), item_name: s(i.item_name), include: i.include,
      mixed_pool_id: s(i.mixed_pool_id), role: i.role || 'STANDARD', rate: s(i.rate),
    })),
    quantity_basis: r?.quantity_basis ?? 'LINE_QUANTITY',
    mixed_pool_id: s(r?.mixed_pool_id),
    shipper_multiple: s(r?.required_shipper_multiple ?? 1),
    outcome: r?.tiers?.length ? 'tiers' : 'single',
    action_type: r?.action?.action_type ?? 'PERCENTAGE',
    action_value: s(r?.action?.value),
    tiers: (r?.tiers ?? []).map((t) => ({
      min: s(t.min_quantity), max: s(t.max_quantity), kind: t.fixed_unit_rate != null ? 'fixed' : 'pct',
      value: s(t.fixed_unit_rate ?? t.discount_percentage),
    })),
    overrides: (r?.rate_overrides ?? []).map((o) => ({ item_id: o.item_id, tier: s(o.tier_position), pct: s(o.discount_percentage) })),
    max_discount: s(r?.max_discount_percentage),
    buy: s(r?.bonus?.buy_quantity),
    bonus_qty: s(r?.bonus?.bonus_quantity),
    repeatable: r?.bonus?.repeatable ?? true,
    permitted_family: r?.bonus ? s(r.bonus.permitted_family) : 'BASE',
    source_reference: s(r?.source_reference),
    notes: s(r?.notes),
    currency: s(r?.currency),
    max_total: s(r?.max_uses_total),
    max_customer: s(r?.max_uses_per_customer),
  };
}

function rowError(row: Row, label: string, booleans: Set<string>): string | null {
  const v = row.value.trim();
  if (!v) return `Enter a value for ${label}`;
  if (booleans.has(row.field) && !['yes', 'no', 'true', 'false'].includes(v.toLowerCase())) return `${label}: enter Yes or No`;
  if (NUMBER_OPS.has(row.operator)) {
    const n = Number(v);
    if (Number.isNaN(n) || n < 0) return `${label} must be a positive number`;
    if (row.field === 'quantity' && !Number.isInteger(n)) return 'Quantity must be a whole number';
  }
  return null;
}

function Section({ title, children, tone }: { title: string; children: ReactNode; tone?: 'then' }) {
  return (
    <fieldset className={tone === 'then' ? 'space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3' : 'space-y-3 rounded-xl border bg-muted/30 p-3'}>
      <legend className="label-mono px-1 text-xs text-brand-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} className="text-destructive hover:text-destructive" onClick={onClick}>
      <Trash2Icon />
    </Button>
  );
}

/** A rule (Data Spec §3-§10): header, audience / item conditions, selected items, quantity basis, tiers and outcome. */
export function RuleBuilder({ campaignId, rule, open, onOpenChange, onSaved }: {
  campaignId: string; rule?: Rule | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: (c: CampaignDetail) => void;
}) {
  const meta = useMeta();
  const m = meta.data;
  const [d, setD] = useState<Draft>(() => fromRule(rule));
  const [tried, setTried] = useState(false);
  const fields = m?.condition_fields || [];
  const booleans = new Set(m?.boolean_fields || []);
  const fieldLabel = (f: string) => labelOf(fields, f);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const setRow = (i: number, patch: Partial<Row>) => set({ rows: d.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const setItem = (i: number, patch: Partial<ItemRow>) => set({ items: d.items.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const setTier = (i: number, patch: Partial<TierRow>) => set({ tiers: d.tiers.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const setOverride = (i: number, patch: Partial<OverrideRow>) => set({ overrides: d.overrides.map((r, k) => (k === i ? { ...r, ...patch } : r)) });

  const isCap = d.family === 'CAP';
  const isPriceList = d.family === 'PRICE_LIST';
  const isBonus = d.family === 'BONUS';
  const monetary = !isCap && !isPriceList && !isBonus;

  const errors = d.rows.map((r) => rowError(r, fieldLabel(r.field), booleans));
  const nameError = !d.name.trim() ? 'Enter a rule name' : null;
  const actionNumber = Number(d.action_value);
  const actionError = monetary && d.outcome === 'single' && (!d.action_value.trim() || Number.isNaN(actionNumber) || actionNumber <= 0)
    ? 'Enter a value greater than 0' : null;
  const tierError = monetary && d.outcome === 'tiers' && (d.tiers.length === 0 || d.tiers.some((t) => !t.min.trim() || !t.value.trim()))
    ? 'Every tier needs a minimum quantity and a value' : null;
  const datesError = d.start_date && d.end_date && d.end_date < d.start_date ? 'The end date is before the start date' : null;
  const valid = !nameError && !actionError && !tierError && !datesError && errors.every((e) => !e);

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: d.name.trim(),
        active: d.active,
        start_date: d.start_date || null,
        end_date: d.end_date || null,
        family: d.family,
        comparison_mode: d.comparison_mode,
        cap_treatment: d.cap_treatment,
        programme_code: d.programme_code || null,
        promotion_code: d.family === 'PROMOTION_CODE' ? d.promotion_code.trim() || null : null,
        conditions: d.rows.map((r) => ({
          field: r.field,
          operator: r.operator,
          value: booleans.has(r.field) ? ['yes', 'true'].includes(r.value.trim().toLowerCase())
            : NUMBER_OPS.has(r.operator) ? Number(r.value)
              : LIST_OPS.has(r.operator) ? r.value.split(',').map((x) => x.trim()).filter(Boolean) : r.value.trim(),
        })),
        items: d.items.filter((i) => i.item_id.trim() || i.item_code.trim()).map((i) => ({
          item_id: i.item_id.trim() || null, item_code: i.item_code.trim() || null, item_name: i.item_name.trim() || null,
          include: i.include, mixed_pool_id: i.mixed_pool_id.trim() || null, role: i.role, rate: num(i.rate),
        })),
        quantity_basis: d.quantity_basis,
        mixed_pool_id: d.mixed_pool_id.trim() || null,
        required_shipper_multiple: num(d.shipper_multiple) ?? 1,
        action: monetary && d.outcome === 'single' ? { action_type: d.action_type, value: actionNumber } : null,
        tiers: monetary && d.outcome === 'tiers'
          ? d.tiers.map((t, i) => ({
            position: i + 1, min_quantity: Number(t.min), max_quantity: num(t.max),
            discount_percentage: t.kind === 'pct' ? Number(t.value) : null, fixed_unit_rate: t.kind === 'fixed' ? Number(t.value) : null,
          }))
          : [],
        rate_overrides: monetary && d.outcome === 'tiers'
          ? d.overrides.filter((o) => o.item_id.trim()).map((o) => ({ item_id: o.item_id.trim(), tier_position: Number(o.tier), discount_percentage: Number(o.pct) }))
          : [],
        max_discount_percentage: isCap ? num(d.max_discount) : null,
        bonus: isBonus ? { buy_quantity: Number(d.buy), bonus_quantity: Number(d.bonus_qty), repeatable: d.repeatable, permitted_family: d.permitted_family || null } : null,
        source_reference: d.source_reference.trim() || null,
        notes: d.notes.trim() || null,
        currency: isPriceList ? d.currency.trim().toUpperCase() || null : null,
        max_uses_total: d.family === 'PROMOTION_CODE' ? num(d.max_total) : null,
        max_uses_per_customer: d.family === 'PROMOTION_CODE' ? num(d.max_customer) : null,
      };
      const url = rule ? `/campaigns/${campaignId}/rules/${rule.rule_id}` : `/campaigns/${campaignId}/rules`;
      return (await (rule ? api.put<CampaignDetail>(url, body) : api.post<CampaignDetail>(url, body))).data;
    },
    onSuccess: (c) => { toast.success(rule ? 'Rule saved' : 'Rule added'); onSaved(c); onOpenChange(false); },
  });
  const submit = () => { setTried(true); if (valid) save.mutate(); };
  const show = (e: string | null) => (tried ? e : null);

  const fieldOptions = fields.map((f) => ({ value: f.value, label: `${f.group}: ${f.label}` }));
  const opsFor = (field: string) => {
    const allowed = fields.find((f) => f.value === field)?.operators || [];
    return (m?.operators || []).filter((o) => allowed.includes(o.value));
  };
  const noneOpt = [{ value: '', label: 'None' }];
  const familyOptions = [{ value: 'BASE', label: 'Base pricing' }, ...(m?.rule_families || [])];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{rule ? `Edit rule: ${rule.name} (v${rule.version})` : 'Add rule'}</DialogTitle>
          <DialogDescription>
            A line qualifies when every condition is true. Within a family the most specific rule wins (Customer, Banner, Marketing Flag, Channel,
            general), then priority; the families then compete by Best Price unless a rule is Exclusive.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Field id="rule-name" label="Rule name">
              <Input id="rule-name" value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Accelerate Pharmacy"
                aria-invalid={!!show(nameError)} aria-describedby={show(nameError) ? 'rule-name-error' : undefined} />
              {show(nameError) && <p id="rule-name-error" className="text-sm text-destructive">{nameError}</p>}
            </Field>
            <label className="flex min-h-9 items-center gap-2 text-sm">
              <Switch checked={d.active} onCheckedChange={(v) => set({ active: v })} /> Active
            </label>
          </div>

          <Section title="Rule">
            <div className="grid gap-3 md:grid-cols-3">
              <Field id="rule-family" label="Family">
                <SimpleSelect id="rule-family" options={m?.rule_families} value={d.family} onChange={(v) => set({ family: v ?? d.family })} />
              </Field>
              {monetary && (
                <>
                  <Field id="rule-comparison" label="Comparison">
                    <SimpleSelect id="rule-comparison" options={m?.comparison_modes} value={d.comparison_mode} onChange={(v) => set({ comparison_mode: v ?? d.comparison_mode })} />
                  </Field>
                  <Field id="rule-cap" label="Item cap">
                    <SimpleSelect id="rule-cap" options={m?.cap_treatments} value={d.cap_treatment} onChange={(v) => set({ cap_treatment: v ?? d.cap_treatment })} />
                  </Field>
                </>
              )}
              {(monetary || isBonus) && (
                <Field id="rule-programme" label="Programme eligibility" hint="Customer must be eligible; the rule must still match.">
                  <SimpleSelect id="rule-programme" options={[...noneOpt, ...(m?.programmes || [])]} value={d.programme_code} onChange={(v) => set({ programme_code: v ?? '' })} />
                </Field>
              )}
              {d.family === 'PROMOTION_CODE' && (
                <>
                  <Field id="rule-code" label="Promotion code">
                    <Input id="rule-code" value={d.promotion_code} onChange={(e) => set({ promotion_code: e.target.value })} placeholder="SPRING26" className="uppercase" />
                  </Field>
                  <Field id="rule-max-total" label="Max uses in total (optional)" hint="Orders the code may be applied to; cancelled orders do not count.">
                    <Input id="rule-max-total" inputMode="numeric" value={d.max_total} onChange={(e) => set({ max_total: e.target.value })} placeholder="100" />
                  </Field>
                  <Field id="rule-max-cust" label="Max uses per customer (optional)">
                    <Input id="rule-max-cust" inputMode="numeric" value={d.max_customer} onChange={(e) => set({ max_customer: e.target.value })} placeholder="1" />
                  </Field>
                </>
              )}
              {isPriceList && (
                <Field id="rule-currency" label="Currency" hint="Orders in another currency get PRICE_LIST_CURRENCY_MISMATCH.">
                  <Input id="rule-currency" value={d.currency} maxLength={3} onChange={(e) => set({ currency: e.target.value })} placeholder="AUD" className="w-28 uppercase" />
                </Field>
              )}
              <Field id="rule-source" label="Source reference (optional)" hint="MPS plan, contract or approval reference.">
                <Input id="rule-source" value={d.source_reference} onChange={(e) => set({ source_reference: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="When (audience and item conditions)">
            {d.rows.length === 0 && <p className="text-sm text-muted-foreground">No conditions: the rule applies to every line the campaign covers.</p>}
            {d.rows.map((r, i) => {
              const err = show(errors[i]);
              const id = `cond-${i}`;
              const isBool = booleans.has(r.field);
              return (
                <div key={i} className="space-y-1">
                  {i > 0 && <div className="label-mono pl-1 text-xs text-muted-foreground">and</div>}
                  <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center">
                    <SimpleSelect aria-label={`Condition ${i + 1} field`} options={fieldOptions} value={r.field}
                      onChange={(v) => { const f = v ?? r.field; setRow(i, { field: f, operator: opsFor(f)[0]?.value ?? 'equals', value: '' }); }} />
                    <SimpleSelect aria-label={`Condition ${i + 1} operator`} options={opsFor(r.field)} value={r.operator} onChange={(v) => setRow(i, { operator: v ?? r.operator })} />
                    {isBool ? (
                      <SimpleSelect aria-label={`Condition ${i + 1} value`} options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]}
                        value={r.value || undefined} onChange={(v) => setRow(i, { value: v ?? '' })} />
                    ) : (
                      <Input id={id} aria-label={`Condition ${i + 1} value`} value={r.value} inputMode={NUMBER_OPS.has(r.operator) ? 'decimal' : undefined}
                        placeholder={NUMBER_OPS.has(r.operator) ? '6' : LIST_OPS.has(r.operator) ? 'Pharmacy, Health Food' : 'Pharmacy'}
                        aria-invalid={!!err} aria-describedby={err ? `${id}-error` : undefined}
                        onChange={(e) => setRow(i, { value: e.target.value })} />
                    )}
                    <RemoveButton label={`Remove condition ${i + 1}`} onClick={() => set({ rows: d.rows.filter((_, k) => k !== i) })} />
                  </div>
                  {err && <p id={`${id}-error`} className="text-sm text-destructive">{err}</p>}
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ rows: [...d.rows, { field: 'channel', operator: 'equals', value: '' }] })}>
              <PlusIcon /> Add condition
            </Button>
          </Section>

          <Section title={`Selected items (${d.items.filter((i) => i.include).length} included)`}>
            <p className="text-xs text-muted-foreground">
              Optional. Matched on Item Internal ID (else Item Code). Leave empty to cover every item the conditions allow.
              {isPriceList ? ' Enter each item’s fixed rate.' : ' Role "Rate override" + Rate gives that item its own fixed price in this rule.'}
            </p>
            {d.items.length > 0 && (
              <div className="space-y-2">
                {d.items.map((it, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border bg-background p-2 sm:grid-cols-[1fr_1fr_1.3fr_auto] lg:grid-cols-[1fr_1fr_1.3fr_0.9fr_0.9fr_0.9fr_auto_auto] lg:items-center">
                    <Input aria-label={`Item ${i + 1} internal ID`} placeholder="Internal ID" value={it.item_id} onChange={(e) => setItem(i, { item_id: e.target.value })} />
                    <Input aria-label={`Item ${i + 1} code`} placeholder="Item code" value={it.item_code} onChange={(e) => setItem(i, { item_code: e.target.value })} />
                    <Input aria-label={`Item ${i + 1} name`} placeholder="Name (optional)" value={it.item_name} onChange={(e) => setItem(i, { item_name: e.target.value })} />
                    <Input aria-label={`Item ${i + 1} mixed pool`} placeholder="Mixed pool" value={it.mixed_pool_id} onChange={(e) => setItem(i, { mixed_pool_id: e.target.value })} />
                    <SimpleSelect aria-label={`Item ${i + 1} role`} options={m?.item_roles} value={it.role} onChange={(v) => setItem(i, { role: v ?? 'STANDARD' })} />
                    <Input aria-label={`Item ${i + 1} rate`} placeholder={isPriceList ? 'Rate' : 'Rate (opt.)'} inputMode="decimal" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} />
                    <label className="flex min-h-9 items-center gap-2 text-sm">
                      <Switch checked={it.include} onCheckedChange={(v) => setItem(i, { include: v })} aria-label={`Item ${i + 1} included`} />
                      {it.include ? 'Include' : 'Exclude'}
                    </label>
                    <RemoveButton label={`Remove item ${i + 1}`} onClick={() => set({ items: d.items.filter((_, k) => k !== i) })} />
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ items: [...d.items, { ...NO_ITEM }] })}><PlusIcon /> Add item</Button>
          </Section>

          {(monetary || isBonus) && (
            <Section title="Quantity">
              <div className="grid gap-3 md:grid-cols-3">
                <Field id="rule-basis" label="Quantity basis">
                  <SimpleSelect id="rule-basis" options={m?.quantity_bases} value={d.quantity_basis} onChange={(v) => set({ quantity_basis: v ?? d.quantity_basis })} />
                </Field>
                {d.quantity_basis === 'DIRECT_ITEM_GROUP_QUANTITY' && (
                  <Field id="rule-pool" label="Mixed pool ID" hint="Only included items in this pool count and are discounted.">
                    <Input id="rule-pool" value={d.mixed_pool_id} onChange={(e) => set({ mixed_pool_id: e.target.value })} placeholder="POOL-1" />
                  </Field>
                )}
                {d.quantity_basis === 'SHIPPER_QUANTITY' && (
                  <Field id="rule-shipper" label="Required shipper multiple" hint="Line quantity ≥ item Shipper Quantity × this.">
                    <Input id="rule-shipper" inputMode="decimal" value={d.shipper_multiple} onChange={(e) => set({ shipper_multiple: e.target.value })} />
                  </Field>
                )}
              </div>
            </Section>
          )}

          {monetary && (
            <Section title="Then (outcome)" tone="then">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Outcome">
                {(['tiers', 'single'] as const).map((o) => (
                  <Button key={o} type="button" size="sm" variant={d.outcome === o ? 'default' : 'outline'} role="radio" aria-checked={d.outcome === o}
                    onClick={() => set({ outcome: o, tiers: o === 'tiers' && !d.tiers.length ? [{ min: '1', max: '', kind: 'pct', value: '' }] : d.tiers })}>
                    {o === 'tiers' ? 'Quantity tiers' : 'Single discount'}
                  </Button>
                ))}
              </div>
              {d.outcome === 'single' ? (
                <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr]">
                  <SimpleSelect aria-label="Action" options={m?.action_types} value={d.action_type} onChange={(v) => set({ action_type: v ?? d.action_type })} />
                  <Input aria-label="Action value" inputMode="decimal" value={d.action_value} onChange={(e) => set({ action_value: e.target.value })}
                    placeholder={d.action_type === 'PERCENTAGE' ? '35' : '20.00'} aria-invalid={!!show(actionError)} />
                </div>
              ) : (
                <div className="space-y-2">
                  {d.tiers.map((t, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_1fr_auto] sm:items-center">
                      <span className="text-sm font-medium">Tier {i + 1}</span>
                      <Input aria-label={`Tier ${i + 1} minimum quantity`} placeholder="Min qty" inputMode="decimal" value={t.min} onChange={(e) => setTier(i, { min: e.target.value })} />
                      <Input aria-label={`Tier ${i + 1} maximum quantity (exclusive)`} placeholder="Max (excl., optional)" inputMode="decimal" value={t.max} onChange={(e) => setTier(i, { max: e.target.value })} />
                      <SimpleSelect aria-label={`Tier ${i + 1} outcome`} options={[{ value: 'pct', label: 'Discount %' }, { value: 'fixed', label: 'Fixed unit rate' }]}
                        value={t.kind} onChange={(v) => setTier(i, { kind: (v as TierRow['kind']) ?? 'pct' })} />
                      <Input aria-label={`Tier ${i + 1} value`} placeholder={t.kind === 'pct' ? '35' : '12.500'} inputMode="decimal" value={t.value} onChange={(e) => setTier(i, { value: e.target.value })} />
                      <RemoveButton label={`Remove tier ${i + 1}`} onClick={() => set({ tiers: d.tiers.filter((_, k) => k !== i) })} />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => set({ tiers: [...d.tiers, { min: '', max: '', kind: 'pct', value: '' }] })}><PlusIcon /> Add tier</Button>
                  <div className="space-y-2 border-t pt-2">
                    <p className="text-xs text-muted-foreground">Item rate overrides: a different % for one item in one tier (e.g. Glucosamine).</p>
                    {d.overrides.map((o, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                        <Input aria-label={`Override ${i + 1} item ID`} placeholder="Item internal ID" value={o.item_id} onChange={(e) => setOverride(i, { item_id: e.target.value })} />
                        <Input aria-label={`Override ${i + 1} tier`} placeholder="Tier" inputMode="numeric" value={o.tier} onChange={(e) => setOverride(i, { tier: e.target.value })} />
                        <Input aria-label={`Override ${i + 1} discount %`} placeholder="Discount %" inputMode="decimal" value={o.pct} onChange={(e) => setOverride(i, { pct: e.target.value })} />
                        <RemoveButton label={`Remove override ${i + 1}`} onClick={() => set({ overrides: d.overrides.filter((_, k) => k !== i) })} />
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ overrides: [...d.overrides, { item_id: '', tier: '1', pct: '' }] })}><PlusIcon /> Add override</Button>
                  </div>
                </div>
              )}
              {show(actionError || tierError) && <p className="text-sm text-destructive">{actionError || tierError}</p>}
            </Section>
          )}

          {isCap && (
            <Section title="Cap" tone="then">
              <Field id="rule-max" label="Maximum discount %" hint="Restricts discount candidates for the selected items; it never creates a discount.">
                <Input id="rule-max" inputMode="decimal" value={d.max_discount} onChange={(e) => set({ max_discount: e.target.value })} placeholder="25" className="max-w-40" />
              </Field>
            </Section>
          )}

          {isBonus && (
            <Section title="Bonus stock (same item)" tone="then">
              <div className="grid gap-3 md:grid-cols-4">
                <Field id="rule-buy" label="Buy quantity"><Input id="rule-buy" inputMode="decimal" value={d.buy} onChange={(e) => set({ buy: e.target.value })} placeholder="10" /></Field>
                <Field id="rule-bonus" label="Bonus quantity"><Input id="rule-bonus" inputMode="decimal" value={d.bonus_qty} onChange={(e) => set({ bonus_qty: e.target.value })} placeholder="1" /></Field>
                <Field id="rule-permitted" label="Only when the price comes from">
                  <SimpleSelect id="rule-permitted" options={[{ value: '', label: 'Any pricing' }, ...familyOptions]} value={d.permitted_family} onChange={(v) => set({ permitted_family: v ?? '' })} />
                </Field>
                <label className="flex min-h-9 items-end gap-2 pb-2 text-sm">
                  <Switch checked={d.repeatable} onCheckedChange={(v) => set({ repeatable: v })} /> Repeat for every multiple
                </label>
              </div>
            </Section>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field id="rule-start" label="Valid from (optional)">
              <DatePicker id="rule-start" value={d.start_date} onChange={(v) => set({ start_date: v })} />
            </Field>
            <Field id="rule-end" label="Valid to (optional, blank = open-ended)">
              <DatePicker id="rule-end" value={d.end_date} onChange={(v) => set({ end_date: v })} aria-invalid={!!show(datesError)} />
              {show(datesError) && <p className="text-sm text-destructive">{datesError}</p>}
            </Field>
          </div>
          <Field id="rule-notes" label="Notes (optional, not executable)">
            <Textarea id="rule-notes" rows={2} value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Field>

          {save.error && (
            <Alert variant="destructive"><CircleAlertIcon /><AlertDescription>{errorText(save.error)}</AlertDescription></Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending && <Spinner />}Save rule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
