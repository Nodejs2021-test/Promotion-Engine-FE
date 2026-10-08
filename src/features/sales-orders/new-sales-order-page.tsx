import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, CircleAlertIcon, CircleCheckIcon, FileUpIcon, RotateCcwIcon, SaveIcon, ScanSearchIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Confirm } from '@/components/shared/confirm';
import { DataTable } from '@/components/shared/data-table';
import { DetailList, JsonBlock } from '@/components/shared/misc';
import { PageHeader, SectionTitle } from '@/components/shared/page-header';
import { ToneBadge } from '@/components/shared/status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-context';
import { api, DOCS_URL, errorDetail, errorText } from '@/lib/api-client';
import { fmtDate, fmtMoney } from '@/lib/format';
import { PricingStatusBadge, PricingTable, PricingTotals, type PricingResult } from '@/features/sales-orders/order-pricing';

interface NormalisedLine {
  lineId: string;
  itemCode: string;
  itemId?: string | null;
  itemName?: string | null;
  quantity: number;
  currentUnitPrice?: number | null;
  baseUnitPrice?: number | null;
  rrp?: number | null;
  itemFlag?: string | null;
  itemGroup?: string | null;
  shipperQuantity?: number | null;
}

interface Preview {
  normalised: {
    salesOrder: { salesOrderId: string; status?: string; profileId?: string; storeIntegrationId?: string; isNew?: boolean; source: string };
    customer: { customerId: string; channel?: string | null; banner?: string | null; customerGroup?: string | null; customerName?: string | null };
    orderDate?: string | null;
    lines: NormalisedLine[];
  };
  pricing: PricingResult;
}

function parse(text: string): Record<string, unknown> {
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The sales order must be a JSON object');
  return value;
}

function MappingErrors({ error }: { error: unknown }) {
  const detail = errorDetail<{ message?: string; errors?: { field: string; message: string }[] }>(error);
  const list = typeof detail === 'object' && detail?.errors;
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>The sales order could not be mapped</AlertTitle>
      <AlertDescription>
        {list ? <ul className="list-disc pl-4">{list.map((e, i) => <li key={i}><code className="text-xs">{e.field}</code> {e.message}</li>)}</ul> : errorText(error)}
      </AlertDescription>
    </Alert>
  );
}

function OrderTab() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<PricingResult | null>(null);

  const body = () => {
    try {
      setParseError(null);
      return parse(text);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
      throw e;
    }
  };
  const map = useMutation({
    mutationFn: async () => (await api.post<Preview>('/integrations/netsuite/sales-orders/preview', body())).data,
    onSuccess: (p) => setPreview(p),
  });
  const save = useMutation({
    mutationFn: async () => (await api.post<PricingResult>('/integrations/netsuite/sales-orders', body())).data,
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ['sales-orders'] });
      toast.success(`${r.salesOrderId} saved`);
    },
  });
  const failed = map.error || save.error;
  const n = preview?.normalised;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1. NetSuite sales order</CardTitle>
          <CardDescription>
            Paste the sales order JSON exactly as NetSuite sends it (the SuiteCommerce cart with <code>cartItems</code>,
            <code className="mx-1">params.attributes</code>, <code>profileId</code>), or load it from a file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea id="so-json" rows={12} className="max-h-80 overflow-auto font-mono text-xs [field-sizing:fixed]" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={'{\n "SO0097888": {\n   "profileId":"717918",\n   "params": {"attributes": { ... } },\n   "cartItems": [ ... ]\n  }\n}'} aria-label="Sales order JSON" />
          {parseError && <p className="text-sm text-destructive">JSON error: {parseError}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => file.current?.click()}><FileUpIcon /> Load JSON file</Button>
            <input ref={file} type="file" accept=".json,application/json" className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ''; }} />
            <Button variant="outline" disabled={!text.trim() || map.isPending} onClick={() => { setResult(null); map.mutate(); }}>
              {map.isPending ? <Spinner /> : <ScanSearchIcon />} Map order
            </Button>
            {can('salesorder:write') && (
              <Button disabled={!text.trim() || save.isPending} onClick={() => { map.mutate(); save.mutate(); }}>
                {save.isPending ? <Spinner /> : <SaveIcon />} Save order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {failed && !parseError && <MappingErrors error={failed} />}

      {n && (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapped sales order</CardTitle>
            <CardDescription>The normalised order, as it is stored, and how the approved campaigns would price it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailList columns={4} items={[
              { label: 'Sales order', value: <b>{n.salesOrder.salesOrderId}</b> },
              { label: 'Status', value: n.salesOrder.status || '—' },
              { label: 'Order date', value: n.orderDate ? fmtDate(n.orderDate) : 'today (business date)' },
              { label: 'Store integration', value: n.salesOrder.storeIntegrationId || '—' },
              { label: 'Customer (profileId)', value: n.customer.customerId },
              { label: 'Customer group', value: n.customer.customerGroup || <span className="text-muted-foreground">not in the order (add its path under Field mapping)</span> },
              { label: 'Channel', value: n.customer.channel || '—' },
              { label: 'Banner', value: n.customer.banner || '—' },
            ]} />
            <DataTable<NormalisedLine>
              rows={n.lines}
              rowKey={(r) => r.lineId}
              columns={[
                { key: 'l', header: 'Line', cell: (r) => r.lineId },
                { key: 'sku', header: 'SKU', cell: (r) => <span className="font-medium">{r.itemCode}</span> },
                { key: 'n', header: 'Product', cell: (r) => r.itemName },
                { key: 'q', header: 'Qty', align: 'right', cell: (r) => r.quantity },
                { key: 'cur', header: 'Current price', align: 'right', cell: (r) => fmtMoney(r.currentUnitPrice) },
                { key: 'base', header: 'Base price', align: 'right', cell: (r) => fmtMoney(r.baseUnitPrice) },
                { key: 'rrp', header: 'RRP', align: 'right', cell: (r) => fmtMoney(r.rrp) },
                { key: 'group', header: 'Item group', cell: (r) => r.itemGroup || '—' },
                { key: 'flag', header: 'Item flag', cell: (r) => r.itemFlag || '—' },
                { key: 'ship', header: 'Shipper', align: 'right', cell: (r) => r.shipperQuantity ?? '—' },
              ]}
            />
            {!result && preview && (
              <div className="space-y-3 pt-2">
                <h3 className="flex items-center gap-2 font-semibold">Pricing preview <PricingStatusBadge status={preview.pricing.pricingStatus} /></h3>
                <PricingTotals result={preview.pricing} />
                <PricingTable items={preview.pricing.items} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">3. Saved and priced <PricingStatusBadge status={result.pricingStatus} /></CardTitle>
            <CardDescription>{result.salesOrderId} · order date {fmtDate(result.orderDate)} · final total <b>{fmtMoney(result.totals.final)}</b> {result.currency}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-success/30 bg-success-soft text-success">
              <CircleCheckIcon />
              <AlertTitle>Saved: {result.salesOrderId} is in the Sales Order list</AlertTitle>
              <AlertDescription className="flex flex-wrap gap-2 pt-1 text-current/80">
                <Button size="sm" asChild><Link to={`/sales-orders/${encodeURIComponent(result.salesOrderId)}?source=${result.source}`}>Open sales order details</Link></Button>
                <Button size="sm" variant="outline" asChild><Link to="/sales-orders">Back to Sales Order list</Link></Button>
              </AlertDescription>
            </Alert>
            <PricingTotals result={result} />
            <PricingTable items={result.items} />
            <details>
              <summary className="cursor-pointer text-sm font-medium">Response JSON returned to NetSuite</summary>
              <div className="mt-2 space-y-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => toast.success('Copied'), () => toast.error('Copy failed'))}>
                  Copy JSON
                </Button>
                <JsonBlock value={result} />
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MappingResponse {
  customised: boolean;
  profile: { order: Record<string, string[]>; customer: Record<string, string[]>; lines: { path: string | string[]; fields: Record<string, string[]>; attributes?: string } };
}

function MappingTab() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['netsuite-mapping'], queryFn: async () => (await api.get<MappingResponse>('/integrations/netsuite/mapping')).data });
  const save = useMutation({
    mutationFn: async () => (await api.put('/integrations/netsuite/mapping', JSON.parse(draft || '{}'))).data,
    onSuccess: () => { toast.success('Mapping saved'); setDraft(null); qc.invalidateQueries({ queryKey: ['netsuite-mapping'] }); },
    onError: (e) => toast.error(e instanceof SyntaxError ? `JSON error: ${e.message}` : errorText(e)),
  });
  const reset = useMutation({
    mutationFn: async () => (await api.delete('/integrations/netsuite/mapping')).data,
    onSuccess: () => { toast.success('Mapping reset to the default'); setDraft(null); qc.invalidateQueries({ queryKey: ['netsuite-mapping'] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  const p = q.data?.profile;
  const linePaths = p ? (Array.isArray(p.lines.path) ? p.lines.path : [p.lines.path]) : [];
  const rows = p ? [
    ...Object.entries(p.order).map(([k, v]) => ({ section: 'Sales order', field: k, paths: v })),
    ...Object.entries(p.customer).map(([k, v]) => ({ section: 'Customer', field: k, paths: v })),
    { section: 'Order lines', field: '(array)', paths: linePaths },
    ...Object.entries(p.lines.fields).map(([k, v]) => ({ section: 'Order line', field: k, paths: v.map((x) => `[line].${x}`) })),
  ] : [];
  return (
    <div className="space-y-4">
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>Stored sales orders never use NetSuite field names</AlertTitle>
        <AlertDescription>
          <p>This mapping converts NetSuite fields into the sales-order fields. When NetSuite renames a field, change the path here; no code changes are needed. The first path with a value wins; <code>$key</code> is the sales-order key of a wrapped payload.</p>
        </AlertDescription>
      </Alert>
      <DataTable
        rows={rows}
        rowKey={(r) => `${r.section}-${r.field}`}
        loading={q.isLoading}
        columns={[
          { key: 's', header: 'Section', cell: (r) => r.section },
          { key: 'f', header: 'Sales-order field', cell: (r) => <code className="text-xs">{r.field}</code> },
          { key: 'p', header: 'NetSuite path(s)', className: 'whitespace-normal', cell: (r) => (r.paths.length ? r.paths.map((x) => <code key={x} className="mr-2 text-xs">{x}</code>) : <span className="text-muted-foreground">not in the payload</span>) },
        ]}
      />
      {can('users:manage') && p && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Edit mapping {q.data?.customised ? <ToneBadge tone="amber">customised</ToneBadge> : <ToneBadge>default</ToneBadge>}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea rows={14} className="max-h-[28rem] overflow-auto font-mono text-xs [field-sizing:fixed]" aria-label="Mapping profile JSON" value={draft ?? JSON.stringify(p, null, 2)} onChange={(e) => setDraft(e.target.value)} />
            <div className="flex gap-2">
              <Button disabled={draft === null || save.isPending} onClick={() => save.mutate()}>{save.isPending ? <Spinner /> : <SaveIcon />} Save mapping</Button>
              {q.data?.customised && (
                <Confirm title="Reset to the default NetSuite mapping?" confirmLabel="Reset" onConfirm={() => reset.mutate()}>
                  <Button variant="outline"><RotateCcwIcon /> Reset to default</Button>
                </Confirm>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NewSalesOrderPage() {
  const [params] = useSearchParams();
  const tab = params.get('tab');
  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/sales-orders"><ArrowLeftIcon /> Sales Orders</Link>
      </Button>
      <PageHeader
        title="Add new sales order"
        description="Paste a NetSuite order, check how it maps and how the campaigns price it, then save it to the Sales Order list."
      />
      <Tabs defaultValue={tab === 'mapping' ? 'mapping' : 'order'}>
        <TabsList variant="line" className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="order">Paste NetSuite order</TabsTrigger>
          <TabsTrigger value="mapping">Field mapping</TabsTrigger>
        </TabsList>
        <TabsContent value="order"><OrderTab /></TabsContent>
        <TabsContent value="mapping"><MappingTab /></TabsContent>
      </Tabs>
      <SectionTitle>API</SectionTitle>
      <p className="text-sm text-muted-foreground">
        NetSuite calls <code className="rounded bg-muted px-1">POST /api/v1/integrations/netsuite/sales-orders</code> with an{' '}
        <code className="rounded bg-muted px-1">X-API-Key</code> header (Administration → API keys). Other systems can send the normalised order to{' '}
        <code className="rounded bg-muted px-1">POST /api/v1/sales-orders</code>, or the customer and items to{' '}
        <code className="rounded bg-muted px-1">POST /api/v1/pricing/evaluate</code>. Every call returns the price of each line with the campaign and rule applied. See <a className="text-primary hover:underline" href={DOCS_URL} target="_blank" rel="noreferrer">/docs</a>.
      </p>
    </>
  );
}
