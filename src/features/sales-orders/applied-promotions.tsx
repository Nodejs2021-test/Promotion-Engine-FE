import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/shared/data-table';
import { ToneBadge } from '@/components/shared/status';
import { fmtMoney } from '@/lib/format';
import type { PricedItem, PricingResult } from './order-pricing';

const saving = (i: PricedItem) =>
  i.promotionApplied && i.originalPrice != null && i.finalPrice != null ? (i.originalPrice - i.finalPrice) * i.quantity : 0;

const STATUS_TONE: Record<string, string> = { BYPASSED: 'neutral', MANUAL_OVERRIDE: 'amber', ERROR: 'red' };
const rate = (v?: number | null) => (v == null ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }));

function Messages({ item }: { item: PricedItem }) {
  const list = [...(item.errors || []), ...(item.warnings || [])];
  if (!list.length) return null;
  return (
    <ul className="space-y-0.5 text-xs">
      {list.map((m, i) => (
        <li key={`${m.code}-${i}`} className={item.errors?.includes(m) ? 'text-destructive' : 'text-muted-foreground'}>
          <span className="font-mono">{m.code}</span>: {m.message}
        </li>
      ))}
    </ul>
  );
}

function RuleCell({ item }: { item: PricedItem }) {
  const status = item.linePricingStatus && item.linePricingStatus !== 'SUCCESS' ? item.linePricingStatus : null;
  if (item.ruleId && item.ruleName) {
    return (
      <div className="space-y-1">
        <ToneBadge tone={item.promotionApplied ? 'green' : 'blue'}>{item.appliedPricingFamily || 'Applied'}</ToneBadge>
        <div className="font-medium">
          {item.ruleName} <span className="text-xs font-normal text-muted-foreground">v{item.appliedRuleVersion ?? 1}{item.tierPosition ? ` · tier ${item.tierPosition}` : ''}</span>
        </div>
        <Link to={`/campaigns/${item.campaignId}`} className="text-xs text-primary hover:underline">{item.campaignName}</Link>
        {!!item.bonusStock?.length && (
          <div className="text-xs font-medium text-success">+ {item.bonusStock[0].bonusQuantity} bonus {item.bonusStock[0].bonusItemCode}</div>
        )}
        <Messages item={item} />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <ToneBadge tone={status ? STATUS_TONE[status] : 'neutral'}>{status ? status.replace('_', ' ').toLowerCase() : 'No promotion'}</ToneBadge>
      <div className="text-xs text-muted-foreground">{item.reason}</div>
      {!!item.bonusStock?.length && (
        <div className="text-xs font-medium text-success">+ {item.bonusStock[0].bonusQuantity} bonus {item.bonusStock[0].bonusItemCode}</div>
      )}
      <Messages item={item} />
    </div>
  );
}

function ConditionsCell({ item }: { item: PricedItem }) {
  if (item.promotionApplied) {
    return (
      <ul className="space-y-0.5">
        {item.explanation.conditions.map((c) => (
          <li key={c} className="flex items-start gap-1.5">
            <CircleCheckIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-success" />
            <span>{c.replace(/ ✓$/, '')}<span className="sr-only"> (met)</span></span>
          </li>
        ))}
      </ul>
    );
  }
  const nearest = item.explanation.checkedRules.find((r) => r.result === 'NOT_MATCHED');
  if (!nearest) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-start gap-1.5 text-muted-foreground">
      <CircleXIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-destructive" />
      <span>{nearest.failedCheck} <span className="sr-only">not met</span>({nearest.ruleName})</span>
    </span>
  );
}

/** One row per product line: the promotion / rule applied, its matched conditions, the discount and the final price. */
export function AppliedPromotions({ result }: { result: PricingResult }) {
  const applied = result.items.filter((i) => i.promotionApplied).length;
  const t = result.totals;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <b className="text-foreground">{applied} of {result.items.length}</b> product line(s) got a promotion. Each rule family offers its best matching
        rule; the lowest unit rate wins (an Exclusive rule wins outright) and is rounded to 3 decimals.
        {result.responseStatus && <> Response: <b className="text-foreground">{result.responseStatus}</b>.</>}
      </p>
      {!!(result.errors?.length || result.warnings?.length) && (
        <ul className="space-y-0.5 rounded-lg border bg-muted/40 p-3 text-sm">
          {[...(result.errors || []), ...(result.warnings || [])].map((m, i) => (
            <li key={`${m.code}-${i}`} className={result.errors?.includes(m) ? 'text-destructive' : 'text-muted-foreground'}>
              <span className="font-mono text-xs">{m.code}</span>: {m.message}
            </li>
          ))}
        </ul>
      )}
      <DataTable<PricedItem>
        rows={result.items}
        rowKey={(r) => r.lineId}
        columns={[
          { key: 'line', header: 'Line', cell: (r) => <span className="tabular-nums">{r.lineId}</span> },
          {
            key: 'product', header: 'Product', className: 'min-w-44 whitespace-normal',
            cell: (r) => <div><div className="font-medium">{r.productName || r.sku}</div><div className="text-xs text-muted-foreground">SKU {r.sku}</div></div>,
          },
          { key: 'qty', header: 'Qty', align: 'right', cell: (r) => <span className="tabular-nums">{r.quantity}</span> },
          { key: 'rule', header: 'Rule / promotion applied', className: 'min-w-52 whitespace-normal', cell: (r) => <RuleCell item={r} /> },
          { key: 'cond', header: 'Matched conditions', className: 'min-w-56 whitespace-normal text-sm', cell: (r) => <ConditionsCell item={r} /> },
          {
            key: 'disc', header: 'Discount applied', className: 'whitespace-normal',
            cell: (r) => (r.promotionApplied
              ? <div><div className="font-semibold text-primary">{r.explanation.action || `${r.discount}%`}</div><div className="text-xs text-muted-foreground tabular-nums">{r.discount}% · {fmtMoney(r.discountAmount)} / unit</div></div>
              : <span className="text-muted-foreground">—</span>),
          },
          {
            key: 'orig', header: 'Original price', align: 'right',
            cell: (r) => <span className={r.promotionApplied ? 'tabular-nums text-muted-foreground line-through' : 'tabular-nums'}>{fmtMoney(r.originalPrice)}</span>,
          },
          {
            key: 'final', header: 'Final unit rate', align: 'right',
            cell: (r) => (
              <div>
                <b className="tabular-nums">{rate(r.finalUnitRate ?? r.finalPrice)}</b>
                {r.discountCapApplied && <div className="text-xs text-warning">capped ({r.appliedCapId})</div>}
                {r.capBypassApplied && <div className="text-xs text-muted-foreground">cap bypassed</div>}
              </div>
            ),
          },
          { key: 'total', header: 'Line total', align: 'right', cell: (r) => <b className="tabular-nums">{fmtMoney(r.lineTotal)}</b> },
          {
            key: 'save', header: 'Saving', align: 'right',
            cell: (r) => (saving(r) > 0 ? <span className="font-medium tabular-nums text-success">{fmtMoney(saving(r))}</span> : <span className="text-muted-foreground">—</span>),
          },
        ]}
      />
      <dl className="ml-auto grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-xl border bg-card p-4 text-sm tabular-nums">
        <dt className="text-muted-foreground">Original total</dt><dd className="text-right">{fmtMoney(t.original)} {result.currency}</dd>
        <dt className="text-success">Total saving</dt><dd className="text-right font-medium text-success">− {fmtMoney(t.savings)}</dd>
        <dt className="border-t pt-1 font-semibold">Final total</dt><dd className="border-t pt-1 text-right text-base font-semibold">{fmtMoney(t.final)} {result.currency}</dd>
      </dl>
    </div>
  );
}
