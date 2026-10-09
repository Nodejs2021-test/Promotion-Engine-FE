import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/data-table';
import { JsonBlock } from '@/components/shared/misc';
import { ToneBadge } from '@/components/shared/status';
import { api } from '@/lib/api-client';
import { fmtDateTime, fmtMoney } from '@/lib/format';

interface Transaction {
  pricing_request_id?: string | null;
  submission_sequence: number;
  previous_pricing_request_id?: string | null;
  kind: 'RECEIVED' | 'REPRICED' | 'CANCELLED';
  submitted_by?: string | null;
  submitted_at: string;
  engine_version?: string | null;
  response_status?: string | null;
  response?: { totals?: { final: number; promotionLines: number } } | null;
  request?: unknown;
}

const KIND = { RECEIVED: ['blue', 'Received'], REPRICED: ['amber', 'Priced again'], CANCELLED: ['red', 'Cancelled'] } as const;

/** Every pricing transaction of the order, newest first; each one is kept unchanged. */
export function PricingHistory({ salesOrderId, source }: { salesOrderId: string; source: string }) {
  const q = useQuery({
    queryKey: ['sales-orders', 'history', salesOrderId, source],
    queryFn: async () => (await api.get<Transaction[]>(`/sales-orders/${encodeURIComponent(salesOrderId)}/pricing-history`, { params: { source } })).data,
  });
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Every submission is stored as its own pricing transaction (request + response). A resend or "Price again" adds a new one; nothing is overwritten.
        A cancellation is recorded here without repricing.
      </p>
      <DataTable<Transaction>
        rows={q.data}
        rowKey={(r) => `${r.kind}-${r.pricing_request_id}-${r.submitted_at}`}
        loading={q.isLoading}
        emptyText="No pricing transactions yet (orders received before history was kept)."
        expand={{ render: (r) => <JsonBlock value={{ request: r.request, response: r.response }} /> }}
        columns={[
          { key: 'seq', header: '#', cell: (r) => <span className="tabular-nums">{r.submission_sequence}</span> },
          { key: 'id', header: 'Pricing request', cell: (r) => (r.pricing_request_id ? <code className="text-xs">{r.pricing_request_id}</code> : '—') },
          { key: 'k', header: 'Event', cell: (r) => <ToneBadge tone={KIND[r.kind][0]}>{KIND[r.kind][1]}</ToneBadge> },
          { key: 'prev', header: 'Previous', cell: (r) => (r.previous_pricing_request_id ? <code className="text-xs">{r.previous_pricing_request_id}</code> : '—') },
          { key: 'st', header: 'Response', cell: (r) => r.response_status || '—' },
          { key: 'tot', header: 'Final total', align: 'right', cell: (r) => (r.response?.totals ? fmtMoney(r.response.totals.final) : '—') },
          { key: 'by', header: 'By', cell: (r) => r.submitted_by || '—' },
          { key: 'at', header: 'When', cell: (r) => fmtDateTime(r.submitted_at) },
        ]}
      />
    </div>
  );
}
