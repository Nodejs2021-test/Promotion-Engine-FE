import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, BanIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { DetailList, EmptyState, JsonBlock, LoadingBlock, StatCard, StatGrid } from '@/components/shared/misc';
import { Confirm } from '@/components/shared/confirm';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Can } from '@/features/auth/auth-context';
import { api, errorText } from '@/lib/api-client';
import { fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import { AppliedPromotions } from './applied-promotions';
import { PricingHistory } from './pricing-history';
import type { SalesOrderSummary } from './sales-orders-page';
import { OrderLinesTable, PricingStatusBadge, PricingTable, PricingTotals, type OrderLine, type PricingResult } from './order-pricing';

interface SalesOrderDetail extends SalesOrderSummary {
  lines: OrderLine[];
  sales_order: {
    salesOrder: { salesOrderId: string; status?: string | null; storeIntegrationId?: string | null; profileId?: string | null; source: string; couponCodes?: string[] };
    customer: { customerId: string; channel?: string | null; banner?: string | null };
  };
  raw_request?: unknown;
  /** The order JSON as received with `new_price` below the price of every line a promotion was applied to. */
  priced_request?: unknown;
  pricing?: PricingResult | null;
}

export default function SalesOrderDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const source = params.get('source') || undefined;

  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['sales-orders', 'detail', id, source],
    queryFn: async () => (await api.get<SalesOrderDetail>(`/sales-orders/${encodeURIComponent(id)}`, { params: { source } })).data,
  });
  const evaluate = useMutation({
    mutationFn: async () => (await api.post<PricingResult>(`/sales-orders/${encodeURIComponent(id)}/evaluate`, null, { params: { source: q.data?.source } })).data,
    onSuccess: (r) => {
      toast.success(r.totals.promotionLines ? `Priced: ${r.totals.promotionLines} line(s) with a promotion` : 'Priced: no promotion applies');
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const cancel = useMutation({
    mutationFn: async () => (await api.post('/sales-orders/cancel', { salesOrderId: id, sourceSystem: q.data?.source, pricingStatus: 'CANCELLED' })).data,
    onSuccess: () => { toast.success('Sales order marked cancelled'); qc.invalidateQueries({ queryKey: ['sales-orders'] }); },
    onError: (e) => toast.error(errorText(e)),
  });

  if (q.isLoading) return <LoadingBlock rows={8} />;
  const so = q.data;
  if (!so) return <EmptyState title="Sales order not found" description={errorText(q.error)} />;
  const header = so.sales_order?.salesOrder;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/sales-orders"><ArrowLeftIcon /> Sales Orders</Link>
      </Button>
      <PageHeader
        title={<>{so.sales_order_id} <PricingStatusBadge status={so.cancelled ? 'CANCELLED' : so.pricing?.pricingStatus} /></>}
        description={`${so.source} · last received ${fmtDateTime(so.last_received_at)}${so.last_received_by ? ` by ${so.last_received_by}` : ''} · received ${so.receive_count}×${so.last_priced_at ? ` · priced ${fmtDateTime(so.last_priced_at)}` : ''}`}
        actions={
          !so.cancelled && (
            <Can permission="salesorder:write">
              <Button variant="outline" disabled={evaluate.isPending} onClick={() => evaluate.mutate()}>
                {evaluate.isPending ? <Spinner /> : <RefreshCwIcon />} Price again
              </Button>
              <Confirm title={`Mark ${so.sales_order_id} as cancelled?`} confirmLabel="Mark cancelled"
                description="The order is not priced again; its pricing history is kept. Use this when the order was cancelled in NetSuite."
                onConfirm={() => cancel.mutate()}>
                <Button variant="outline" disabled={cancel.isPending}>{cancel.isPending ? <Spinner /> : <BanIcon />} Mark cancelled</Button>
              </Confirm>
            </Can>
          )
        }
      />
      <Card size="sm" className="mb-4">
        <CardContent>
          <DetailList columns={4} items={[
            { label: 'Sales order', value: <b>{so.sales_order_id}</b> },
            { label: 'Status', value: so.status || '—' },
            { label: 'Order date', value: fmtDate(so.order_date) },
            { label: 'Source', value: so.source },
            { label: 'Customer', value: <>{so.customer_id}{so.customer_name ? ` — ${so.customer_name}` : ''}</> },
            { label: 'Customer group', value: so.customer_group || <span className="text-muted-foreground">not in the order</span> },
            { label: 'Channel', value: so.channel || '—' },
            { label: 'Banner', value: so.banner || '—' },
            { label: 'Store integration', value: header?.storeIntegrationId || '—' },
            { label: 'Coupon codes', value: header?.couponCodes?.length ? header.couponCodes.join(', ') : '—' },
            { label: 'Currency', value: so.currency || '—' },
          ]} />
        </CardContent>
      </Card>

      <div className="mb-4">
        {so.pricing ? <PricingTotals result={so.pricing} /> : (
          <StatGrid>
            <StatCard label="Lines" value={so.line_count} />
            <StatCard label={`Total (${so.currency || ''})`} value={fmtMoney(so.total)} />
          </StatGrid>
        )}
      </div>

      <Tabs defaultValue={so.pricing ? 'applied' : 'lines'}>
        <TabsList variant="line" className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="applied">Applied promotions{so.pricing ? ` (${so.pricing.totals.promotionLines})` : ''}</TabsTrigger>
          <TabsTrigger value="pricing">Pricing &amp; why</TabsTrigger>
          <TabsTrigger value="lines">Order lines as received ({so.lines.length})</TabsTrigger>
          <TabsTrigger value="json">Order JSON</TabsTrigger>
          <TabsTrigger value="history">Pricing history{so.submission_count ? ` (${so.submission_count})` : ''}</TabsTrigger>
        </TabsList>
        <TabsContent value="applied">
          {so.pricing ? <AppliedPromotions result={so.pricing} /> : (
            <EmptyState title="Not priced yet" description="This order was saved before campaigns existed. Use Price again to price it with today's approved campaigns." />
          )}
        </TabsContent>
        <TabsContent value="pricing">
          {so.pricing ? (
            <>
              <PricingTable items={so.pricing.items} />
              <p className="mt-2 text-xs text-muted-foreground">Open a line to see which rules were checked and why it got its price.</p>
            </>
          ) : (
            <EmptyState title="Not priced yet" description="This order was saved before campaigns existed. Use Price again to price it with today's approved campaigns." />
          )}
        </TabsContent>
        <TabsContent value="lines"><OrderLinesTable lines={so.lines} /></TabsContent>
        <TabsContent value="history"><PricingHistory salesOrderId={so.sales_order_id} source={so.source} /></TabsContent>
        <TabsContent value="json">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-sm font-medium">1. Original JSON</h3>
              <p className="mb-1 text-xs text-muted-foreground">
                The sales order exactly as received{so.raw_request === undefined ? ' (normalised format)' : ''}; <code>price</code> is the original price.
              </p>
              <JsonBlock value={so.raw_request ?? so.sales_order} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium">2. Updated JSON with promotion prices</h3>
              <p className="mb-1 text-xs text-muted-foreground">
                Same order; every line a promotion was applied to gets <code>new_price</code> (the price after the discount) right below <code>price</code>.
              </p>
              {so.priced_request !== undefined && so.priced_request !== null ? <JsonBlock value={so.priced_request} /> : (
                <EmptyState title="Not priced yet" description="Use Price again to price this order with today's approved campaigns." />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
