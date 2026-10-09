import { useQuery } from '@tanstack/react-query';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/shared/data-table';
import { DatePicker } from '@/components/shared/date-picker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { todayIso } from '@/lib/format';
import type { CheckOrderRow } from './types';

/** The rules of the active campaigns in the order the engine checks them (Best Price: the lowest matching price wins). */
export function CheckOrder() {
  const [on, setOn] = useState<string | undefined>(todayIso());
  const q = useQuery({
    queryKey: ['check-order', on],
    queryFn: async () => (await api.get<{ date: string; rules: CheckOrderRow[] }>('/campaigns/check-order', { params: { on } })).data,
  });
  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon />
        <AlertTitle>How a sales order line is priced</AlertTitle>
        <AlertDescription>
          <p>
            Every rule below is checked: campaign date → customer → product → quantity. With <b>Best Price</b> every rule that fully
            matches offers a price and the <b>lowest price wins</b>, whatever its position (the order only decides a tie). An{' '}
            <b>Exclusive</b> rule is used as soon as it matches, in this order, and wins outright. Discounts never stack; no match → the
            original price is kept.
          </p>
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="check-date">Order date</Label>
          <DatePicker id="check-date" value={on} onChange={setOn} className="w-48" />
        </div>
      </div>
      <DataTable<CheckOrderRow>
        rows={q.data?.rules}
        rowKey={(r) => r.rule_id}
        loading={q.isFetching}
        emptyText="No approved campaign is active on this date: every order line keeps its own price."
        columns={[
          { key: 'n', header: '#', cell: (r) => <span className="font-semibold tabular-nums">{r.position}</span> },
          {
            key: 'rule', header: 'Rule', className: 'min-w-48 whitespace-normal',
            cell: (r) => (
              <div>
                <div className="font-medium">{r.rule_name} <span className="text-xs font-normal text-muted-foreground">v{r.rule_version}</span></div>
                <div className="text-xs text-muted-foreground">{r.family}</div>
                <Link to={`/campaigns/${r.campaign_id}`} className="text-xs text-primary hover:underline">{r.campaign_name}</Link>
              </div>
            ),
          },
          {
            key: 'when', header: 'When', className: 'min-w-56 whitespace-normal',
            cell: (r) => (r.when.length ? <ul className="space-y-0.5 text-sm">{r.when.map((w) => <li key={w}>{w}</li>)}</ul> : <span className="text-muted-foreground">every eligible line</span>),
          },
          { key: 'then', header: 'Then', cell: (r) => <b>{r.then}</b> },
          {
            key: 'why', header: 'Why this position', className: 'whitespace-normal text-xs text-muted-foreground',
            cell: (r) => `${r.family} · specificity ${r.specificity} (1 Customer … 5 general) · campaign priority ${r.campaign_priority} · rule priority ${r.rule_priority}`,
          },
        ]}
      />
    </div>
  );
}
