import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PlusIcon, Settings2Icon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/shared/data-table';
import { SearchInput, Toolbar } from '@/components/shared/misc';
import { PageHeader } from '@/components/shared/page-header';
import { SimpleSelect } from '@/components/shared/select';
import { ToneBadge } from '@/components/shared/status';
import { Button } from '@/components/ui/button';
import { Can } from '@/features/auth/auth-context';
import { api } from '@/lib/api-client';
import { fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import { PricingStatusBadge } from './order-pricing';

export interface SalesOrderSummary {
  sales_order_id: string;
  source: string;
  status?: string | null;
  customer_id: string;
  customer_name?: string | null;
  customer_group?: string | null;
  channel?: string | null;
  banner?: string | null;
  order_date: string;
  currency?: string | null;
  line_count: number;
  total: number;
  final_total?: number | null;
  savings?: number | null;
  pricing_status?: string | null;
  promotion_line_count?: number | null;
  last_priced_at?: string | null;
  receive_count: number;
  first_received_at?: string;
  last_received_at: string;
  last_received_by?: string | null;
}

interface SalesOrderList {
  items: SalesOrderSummary[];
  total: number;
  channels: string[];
  statuses: string[];
}

export default function SalesOrdersPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [channel, setChannel] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  const list = useQuery({
    queryKey: ['sales-orders', q, status, channel, page, pageSize],
    queryFn: async () =>
      (await api.get<SalesOrderList>('/sales-orders', { params: { q: q || undefined, status, channel, page, page_size: pageSize } })).data,
    placeholderData: keepPreviousData,
  });
  const opts = (values?: string[]) => (values || []).map((v) => ({ value: v, label: v }));

  return (
    <>
      <PageHeader
        title="Sales Orders"
        description="Every sales order received from NetSuite or added here, priced against the approved campaigns."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/sales-orders/new?tab=mapping')}><Settings2Icon /> NetSuite field mapping</Button>
            <Can permission="salesorder:write">
              <Button onClick={() => navigate('/sales-orders/new')}><PlusIcon /> Add new sales order</Button>
            </Can>
          </>
        }
      />
      <Toolbar>
        <SearchInput placeholder="Search sales order or customer id" onSearch={reset(setQ)} />
        <SimpleSelect className="w-44" options={opts(list.data?.statuses)} value={status} onChange={reset(setStatus)} clearLabel="All Status" placeholder="Status" />
        <SimpleSelect className="w-48" options={opts(list.data?.channels)} value={channel} onChange={reset(setChannel)} clearLabel="All channels" placeholder="Channel" />
      </Toolbar>
      <DataTable<SalesOrderSummary>
        rows={list.data?.items}
        rowKey={(r) => `${r.source}-${r.sales_order_id}`}
        loading={list.isFetching}
        onRowClick={(r) => navigate(`/sales-orders/${encodeURIComponent(r.sales_order_id)}?source=${r.source}`)}
        emptyText="No sales orders yet. Use Add new sales order to paste one."
        pagination={{ page, pageSize, total: list.data?.total, unit: 'sales orders', onChange: (p, s) => { setPage(p); setPageSize(s); } }}
        columns={[
          {
            key: 'so', header: 'Sales order',
            cell: (r) => <div><div className="font-medium">{r.sales_order_id}</div><div className="text-xs text-muted-foreground">{r.source}</div></div>,
          },
          {
            key: 'cust', header: 'Customer',
            cell: (r) => <div>{r.customer_id}{r.customer_name && <div className="text-xs text-muted-foreground">{r.customer_name}</div>}</div>,
          },
          { key: 'date', header: 'Order date', cell: (r) => fmtDate(r.order_date) },
          { key: 'status', header: 'Status', cell: (r) => (r.status ? <ToneBadge>{r.status}</ToneBadge> : '—') },
          {
            key: 'channel', header: 'Channel',
            cell: (r) => <div>{r.channel || '—'}{r.banner && <div className="text-xs text-muted-foreground">{r.banner}</div>}</div>,
          },
          {
            key: 'lines', header: 'Lines', align: 'right',
            cell: (r) => <div>{r.line_count}{r.promotion_line_count ? <div className="text-xs text-success">{r.promotion_line_count} promoted</div> : null}</div>,
          },
          { key: 'pricing', header: 'Pricing', cell: (r) => <PricingStatusBadge status={r.pricing_status} /> },
          {
            key: 'total', header: 'Total amount', align: 'right',
            cell: (r) => (
              <div>
                <b>{fmtMoney(r.final_total ?? r.total)}</b> <span className="text-xs text-muted-foreground">{r.currency}</span>
                {!!r.savings && r.savings > 0 && <div className="text-xs text-success">saves {fmtMoney(r.savings)}</div>}
              </div>
            ),
          },
          {
            key: 'when', header: 'Last received',
            cell: (r) => <div className="whitespace-nowrap">{fmtDateTime(r.last_received_at)}<div className="text-xs text-muted-foreground">{r.last_received_by} · {r.receive_count}×</div></div>,
          },
        ]}
      />
    </>
  );
}
