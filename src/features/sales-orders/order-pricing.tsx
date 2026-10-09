import { CircleCheckIcon, CircleXIcon, MinusCircleIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/shared/data-table';
import { StatCard, StatGrid } from '@/components/shared/misc';
import { ToneBadge } from '@/components/shared/status';
import { fmtMoney } from '@/lib/format';

/** One line of a sales order, at the price the order carries. */
export interface OrderLine {
  lineId: string;
  itemCode: string;
  itemId?: string | null;
  itemName?: string | null;
  quantity: number;
  currentUnitPrice?: number | null;
  baseUnitPrice?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
}

export interface CheckedRule {
  position: number;
  campaignId: string;
  campaignName: string;
  ruleId: string;
  ruleName: string;
  result: 'MATCHED' | 'NOT_MATCHED';
  failedCheck?: string | null;
}

/** One priced line: the campaign and rule applied (if any), the prices and why. */
export interface PricedItem {
  lineId: string;
  sku: string;
  productName?: string | null;
  quantity: number;
  originalPrice?: number | null;
  basePrice?: number | null;
  promotionApplied: boolean;
  campaignId?: string | null;
  campaignName?: string | null;
  ruleId?: string | null;
  ruleName?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  discount: number;
  discountAmount: number;
  finalPrice?: number | null;
  lineTotal?: number | null;
  reason: string;
  explanation: {
    conditions: string[]; checkedRules: CheckedRule[]; rulesNotChecked: number; action?: string;
    candidates?: { family: string; ruleId?: string | null; ruleName: string; unitRate: number; capApplied: boolean; winner: boolean }[];
  };
  /** Data Spec §15.2 line result. */
  linePricingStatus?: 'SUCCESS' | 'BYPASSED' | 'ERROR' | 'MANUAL_OVERRIDE';
  appliedPricingFamily?: string | null;
  pricingMethod?: string | null;
  appliedRuleVersion?: number | null;
  appliedTierId?: string | null;
  tierPosition?: number | null;
  thresholdBasis?: string | null;
  qualifyingQuantity?: number | null;
  preCapDiscountPercentage?: number | null;
  discountCapApplied?: boolean;
  appliedCapId?: string | null;
  capBypassApplied?: boolean;
  finalDiscountPercentage?: number | null;
  unroundedUnitRate?: number | null;
  finalUnitRate?: number | null;
  bonusStock?: { bonusItemCode: string; bonusQuantity: number; sourceRuleId: string }[];
  errors?: PricingMessage[];
  warnings?: PricingMessage[];
}

export interface PricingMessage { code: string; message: string; attribute?: string; ruleId?: string }

/** The pricing result: what NetSuite receives to update the sales order. */
export interface PricingResult {
  salesOrderId: string;
  customerId: string;
  orderDate: string;
  currency: string;
  pricingStatus: 'PROMOTION_APPLIED' | 'NO_PROMOTION' | 'ERROR';
  responseStatus?: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'ERROR';
  engineVersion?: string;
  errors?: PricingMessage[];
  warnings?: PricingMessage[];
  items: PricedItem[];
  totals: { original: number; final: number; savings: number; promotionLines: number };
  evaluatedAt?: string;
  source?: string;
  receivedAt?: string;
}

export function PricingStatusBadge({ status }: { status?: string | null }) {
  if (!status) return <ToneBadge>not priced</ToneBadge>;
  if (status === 'ERROR') return <ToneBadge tone="red">pricing error</ToneBadge>;
  if (status === 'CANCELLED') return <ToneBadge tone="red">cancelled</ToneBadge>;
  return status === 'PROMOTION_APPLIED' ? <ToneBadge tone="green">promotion applied</ToneBadge> : <ToneBadge>no promotion</ToneBadge>;
}

export function PricingTotals({ result }: { result: PricingResult }) {
  const t = result.totals;
  return (
    <StatGrid>
      <StatCard label="Lines with a promotion" value={`${t.promotionLines} / ${result.items.length}`} tone={t.promotionLines ? 'success' : undefined} />
      <StatCard label={`Original total (${result.currency})`} value={fmtMoney(t.original)} />
      <StatCard label="Savings" value={fmtMoney(t.savings)} tone={t.savings > 0 ? 'success' : undefined} />
      <StatCard label={`Final total (${result.currency})`} value={fmtMoney(t.final)} />
    </StatGrid>
  );
}

/** Why a line got its price: the conditions of the rule applied and every rule checked before it, in order. */
export function WhyThisPrice({ item }: { item: PricedItem }) {
  const e = item.explanation;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{item.promotionApplied ? 'Applied' : 'Result'}</h4>
        {item.ruleName ? (
          <div className="space-y-2 text-sm">
            <p><Link to={`/campaigns/${item.campaignId}`} className="font-medium text-primary hover:underline">{item.campaignName}</Link> → <b>{item.ruleName}</b>{e.action && <> · {e.action}</>}</p>
            <ul className="space-y-1">
              {e.conditions.map((c) => (
                <li key={c} className="flex items-center gap-1.5"><CircleCheckIcon aria-hidden className="size-4 text-success" />{c.replace(/ ✓$/, '')}<span className="sr-only">passed</span></li>
              ))}
            </ul>
            {!item.promotionApplied && <p className="text-muted-foreground">{item.reason}</p>}
          </div>
        ) : <p className="text-sm text-muted-foreground">{item.reason}</p>}
        {item.promotionApplied && (
          <p className="text-sm">
            {fmtMoney(item.basePrice)} − {fmtMoney(item.discountAmount)} = <b>{fmtMoney(item.finalPrice)}</b> × {item.quantity} = <b>{fmtMoney(item.lineTotal)}</b>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Rules checked, in order</h4>
        {e.checkedRules.length ? (
          <ol className="space-y-1 text-sm">
            {e.checkedRules.map((r) => (
              <li key={r.ruleId} className="flex items-start gap-1.5">
                {r.result === 'MATCHED'
                  ? <CircleCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                  : <CircleXIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />}
                <span>
                  <span className="tabular-nums text-muted-foreground">{r.position}.</span> {r.ruleName} <span className="text-muted-foreground">({r.campaignName})</span>
                  {r.result === 'MATCHED' ? <b className="text-success"> matched: applied</b> : <span className="text-muted-foreground"> not matched: {r.failedCheck}</span>}
                </span>
              </li>
            ))}
            {e.rulesNotChecked > 0 && (
              <li className="flex items-start gap-1.5 text-muted-foreground">
                <MinusCircleIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {e.rulesNotChecked} later rule(s) not checked: an Exclusive rule matched first.
              </li>
            )}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No approved, enabled campaign to check.</p>}
      </div>
    </div>
  );
}

/** Every line: quantity, original price, campaign / rule applied, discount and final price; expand a line for why. */
export function PricingTable({ items }: { items: PricedItem[] }) {
  return (
    <DataTable<PricedItem>
      rows={items}
      rowKey={(r) => r.lineId}
      expand={{ canExpand: () => true, render: (r) => <WhyThisPrice item={r} /> }}
      columns={[
        { key: 'l', header: 'Line', cell: (r) => r.lineId },
        { key: 'sku', header: 'Product / SKU', className: 'min-w-44 whitespace-normal', cell: (r) => <div><div className="font-medium">{r.productName || r.sku}</div><div className="text-xs text-muted-foreground">{r.sku}</div></div> },
        { key: 'q', header: 'Qty', align: 'right', cell: (r) => r.quantity },
        { key: 'op', header: 'Original price', align: 'right', cell: (r) => fmtMoney(r.originalPrice) },
        {
          key: 'rule', header: 'Campaign / rule', className: 'min-w-48 whitespace-normal',
          cell: (r) => (r.promotionApplied
            ? <div><div className="font-medium">{r.ruleName}</div><div className="text-xs text-muted-foreground">{r.campaignName}</div></div>
            : <span className="text-muted-foreground">{r.reason}</span>),
        },
        { key: 'd', header: 'Discount', align: 'right', cell: (r) => (r.promotionApplied ? `${r.discount}%` : '—') },
        { key: 'fp', header: 'Final price', align: 'right', cell: (r) => <b>{fmtMoney(r.finalPrice)}</b> },
        { key: 'lt', header: 'Line total', align: 'right', cell: (r) => <b>{fmtMoney(r.lineTotal)}</b> },
      ]}
    />
  );
}

/** Every product line as received: quantity, prices and line total. */
export function OrderLinesTable({ lines }: { lines: OrderLine[] }) {
  return (
    <DataTable<OrderLine>
      rows={lines}
      rowKey={(r) => r.lineId}
      columns={[
        { key: 'l', header: 'Line', cell: (r) => r.lineId },
        { key: 'sku', header: 'Product / SKU', className: 'min-w-44 whitespace-normal', cell: (r) => <div><div className="font-medium">{r.itemName || r.itemCode}</div><div className="text-xs text-muted-foreground">{r.itemCode}</div></div> },
        { key: 'q', header: 'Qty', align: 'right', cell: (r) => r.quantity },
        { key: 'base', header: 'Base price', align: 'right', cell: (r) => fmtMoney(r.baseUnitPrice) },
        { key: 'unit', header: 'Unit price', align: 'right', cell: (r) => fmtMoney(r.unitPrice) },
        { key: 'lt', header: 'Line total', align: 'right', cell: (r) => <b>{fmtMoney(r.lineTotal)}</b> },
      ]}
    />
  );
}
