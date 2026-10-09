import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { DatePicker } from '@/components/shared/date-picker';
import { SimpleSelect } from '@/components/shared/select';
import { ToneBadge } from '@/components/shared/status';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { api, errorText } from '@/lib/api-client';
import { fmtDate } from '@/lib/format';
import { labelOf, useMeta } from '@/lib/meta';

interface EligibilityRecord {
  eligibility_id: string;
  programme_code: string;
  scope: string;
  value: string;
  eligibility_mode: string;
  valid_from: string;
  valid_to?: string | null;
  active: boolean;
  source_reference?: string | null;
  notes?: string | null;
  updated_by?: string;
}

type Draft = Omit<EligibilityRecord, 'eligibility_id' | 'updated_by'>;
const EMPTY: Draft = { programme_code: 'ACCELERATE', scope: 'CHANNEL', value: '', eligibility_mode: 'ELIGIBLE', valid_from: '', valid_to: null, active: true };

/** Programme eligibility records: who may take part in Accelerate, Make the Switch and Monthly Promotions. */
export function EligibilityTab() {
  const qc = useQueryClient();
  const meta = useMeta().data;
  const list = useQuery({ queryKey: ['programme-eligibility'], queryFn: async () => (await api.get<EligibilityRecord[]>('/programme-eligibility')).data });
  const [editing, setEditing] = useState<EligibilityRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Draft>(EMPTY);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  const save = useMutation({
    mutationFn: async () => {
      const body = { ...d, value: d.value.trim(), valid_to: d.valid_to || null, source_reference: d.source_reference || null, notes: d.notes || null };
      return editing ? api.put(`/programme-eligibility/${editing.eligibility_id}`, body) : api.post('/programme-eligibility', body);
    },
    onSuccess: () => { toast.success('Eligibility saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['programme-eligibility'] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  const edit = (r: EligibilityRecord | null) => {
    setEditing(r);
    setD(r ? { ...r } : EMPTY);
    setOpen(true);
  };
  const valid = d.value.trim() && d.valid_from && (!d.valid_to || d.valid_to >= d.valid_from);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <p className="max-w-3xl flex-1 text-sm text-muted-foreground">
          Who may take part in a programme. The most specific active record decides: <b>Customer → Customer Group → Banner → Channel</b>;
          without a record the order's own eligibility flag is used. Eligibility never sets a price: the rule must still match.
          Records are made inactive or end-dated, never deleted.
        </p>
        <Button onClick={() => edit(null)}><PlusIcon /> Add record</Button>
      </div>
      <DataTable<EligibilityRecord>
        rows={list.data}
        rowKey={(r) => r.eligibility_id}
        loading={list.isLoading}
        emptyText="No eligibility records: rules with a programme use the eligibility flag sent with each order."
        columns={[
          { key: 'id', header: 'ID', cell: (r) => <span className="tabular-nums">{r.eligibility_id}</span> },
          { key: 'p', header: 'Programme', cell: (r) => labelOf(meta?.programmes, r.programme_code) },
          { key: 's', header: 'Applies to', cell: (r) => <span>{labelOf(meta?.eligibility_scopes, r.scope)}: <b>{r.value}</b></span> },
          { key: 'm', header: 'Eligibility', cell: (r) => <ToneBadge tone={r.eligibility_mode === 'ELIGIBLE' ? 'green' : 'red'}>{labelOf(meta?.eligibility_modes, r.eligibility_mode)}</ToneBadge> },
          { key: 'v', header: 'Valid', cell: (r) => `${fmtDate(r.valid_from)} – ${r.valid_to ? fmtDate(r.valid_to) : 'open'}` },
          { key: 'a', header: 'Status', cell: (r) => (r.active ? <ToneBadge tone="green">Active</ToneBadge> : <ToneBadge>Inactive</ToneBadge>) },
          { key: 'e', header: '', align: 'right', cell: (r) => <Button variant="ghost" size="icon" aria-label={`Edit ${r.eligibility_id}`} onClick={() => edit(r)}><PencilIcon /></Button> },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.eligibility_id}` : 'Add eligibility record'}</DialogTitle>
            <DialogDescription>For example: Channel Pharmacy → Monthly Promotion eligible; Customer CUST0418 → not eligible.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }} noValidate>
            <div className="space-y-1.5"><Label htmlFor="el-prog">Programme</Label>
              <SimpleSelect id="el-prog" options={meta?.programmes} value={d.programme_code} onChange={(v) => set({ programme_code: v ?? d.programme_code })} /></div>
            <div className="space-y-1.5"><Label htmlFor="el-mode">Eligibility</Label>
              <SimpleSelect id="el-mode" options={meta?.eligibility_modes} value={d.eligibility_mode} onChange={(v) => set({ eligibility_mode: v ?? d.eligibility_mode })} /></div>
            <div className="space-y-1.5"><Label htmlFor="el-scope">Applies to</Label>
              <SimpleSelect id="el-scope" options={meta?.eligibility_scopes} value={d.scope} onChange={(v) => set({ scope: v ?? d.scope })} /></div>
            <div className="space-y-1.5"><Label htmlFor="el-value">Value</Label>
              <Input id="el-value" value={d.value} onChange={(e) => set({ value: e.target.value })} placeholder={d.scope === 'CUSTOMER' ? 'CUST1001' : 'Pharmacy'} /></div>
            <div className="space-y-1.5"><Label htmlFor="el-from">Valid from</Label>
              <DatePicker id="el-from" value={d.valid_from} onChange={(v) => set({ valid_from: v ?? '' })} /></div>
            <div className="space-y-1.5"><Label htmlFor="el-to">Valid to (blank = open)</Label>
              <DatePicker id="el-to" value={d.valid_to} onChange={(v) => set({ valid_to: v ?? null })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="el-src">Source reference (optional)</Label>
              <Input id="el-src" value={d.source_reference ?? ''} onChange={(e) => set({ source_reference: e.target.value })} placeholder="Approval or migration reference" /></div>
            <label className="flex min-h-9 items-center gap-2 text-sm sm:col-span-2">
              <Switch checked={d.active} onCheckedChange={(v) => set({ active: v })} /> Active
            </label>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!valid || save.isPending}>{save.isPending && <Spinner />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
