import {
  ArrowRightIcon, BadgePercentIcon, BanIcon, BookOpenIcon, CalculatorIcon, CalendarIcon, CheckIcon, ChevronRightIcon,
  CircleCheckIcon, CircleHelpIcon, CircleXIcon, CrownIcon, FileTextIcon, GiftIcon, HistoryIcon, LayersIcon, type LucideIcon,
  MegaphoneIcon, PackageIcon, PlugIcon, ReceiptIcon, RocketIcon, ScaleIcon, ShieldIcon, SlidersHorizontalIcon, TagIcon,
  TrophyIcon, UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { ToneBadge } from '@/components/shared/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/*
 * Informational only. Describes what the pricing engine actually does (backend/src/app/modules/pricing) and the
 * Promotion Engine specifications v2.0. Every number in the examples was checked against the engine.
 */

const TABS = [
  { value: 'overview', label: 'Overview', icon: RocketIcon },
  { value: 'setup', label: 'Campaigns & rules', icon: MegaphoneIcon },
  { value: 'pricing', label: 'How prices are worked out', icon: CalculatorIcon },
  { value: 'examples', label: 'Examples', icon: ReceiptIcon },
  { value: 'reference', label: 'Reference', icon: BookOpenIcon },
  { value: 'faq', label: 'FAQ', icon: CircleHelpIcon },
] as const;

// ---------------------------------------------------------------------------------------------------- building blocks
function IconBadge({ icon: Icon, tone = 'primary' }: { icon: LucideIcon; tone?: 'primary' | 'success' | 'muted' | 'danger' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    muted: 'bg-muted text-muted-foreground',
    danger: 'bg-destructive/10 text-destructive',
  };
  return (
    <span aria-hidden className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
      <Icon className="size-5" />
    </span>
  );
}

function Block({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {intro && <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/** Horizontal numbered steps (wrap on small screens). */
function Stepper({ steps }: { steps: { icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <IconBadge icon={s.icon} />
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">STEP {i + 1}</span>
          </div>
          <h3 className="mt-3 font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Vertical timeline. */
function Timeline({ items }: { items: { title: string; text: ReactNode }[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-primary/20 pl-6">
      {items.map((it, i) => (
        <li key={it.title} className="relative">
          <span aria-hidden className="absolute -left-[2.15rem] flex size-7 items-center justify-center rounded-full border-2 border-primary/30 bg-background text-xs font-semibold text-primary tabular-nums">{i + 1}</span>
          <h3 className="font-semibold">{it.title}</h3>
          <div className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{it.text}</div>
        </li>
      ))}
    </ol>
  );
}

function Accordion({ title, icon, children, defaultOpen }: { title: string; icon?: LucideIcon; children: ReactNode; defaultOpen?: boolean }) {
  const Icon = icon;
  return (
    <details open={defaultOpen} className="group rounded-xl border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-2.5 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        {Icon && <Icon aria-hidden className="size-4 shrink-0 text-primary" />}
        <span className="flex-1">{title}</span>
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      <div className="space-y-3 border-t px-4 py-3 text-sm">{children}</div>
    </details>
  );
}

function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t align-top">{r.map((c, k) => <td key={k} className="px-3 py-2">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Calc({ title, formula, example, result }: { title: string; formula: string; example: string; result: string }) {
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs">{formula}</div>
      <div className="mt-3 flex items-end justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{example}</span>
        <span className="font-mono text-base font-semibold text-primary tabular-nums">{result}</span>
      </div>
    </div>
  );
}

function Callout({ icon: Icon, title, children, tone = 'primary' }: { icon: LucideIcon; title: string; children: ReactNode; tone?: 'primary' | 'success' | 'danger' }) {
  const tones = { primary: 'border-primary/30 bg-primary/5', success: 'border-success/30 bg-success/5', danger: 'border-destructive/30 bg-destructive/5' };
  return (
    <div className={cn('flex gap-3 rounded-xl border p-4', tones[tone])}>
      <IconBadge icon={Icon} tone={tone === 'danger' ? 'danger' : tone} />
      <div className="text-sm"><div className="font-semibold">{title}</div><div className="mt-0.5 text-muted-foreground">{children}</div></div>
    </div>
  );
}

const Yes = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-start gap-1.5"><CircleCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /><span>{children}<span className="sr-only"> (passed)</span></span></span>
);
const No = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-start gap-1.5"><CircleXIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{children}<span className="sr-only"> (failed)</span></span></span>
);

/** Bars for the $80 / $70 / $75 comparison; the winner is marked with text, not colour alone. */
function PriceBars({ offers, title, note }: { offers: { name: string; price: number; win?: boolean; skipped?: boolean }[]; title: string; note: string }) {
  const max = Math.max(...offers.map((o) => o.price));
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {offers.map((o) => (
          <li key={o.name} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-2 text-sm">
            <span className={cn(o.skipped && 'text-muted-foreground line-through')}>{o.name}</span>
            <span className="h-3 overflow-hidden rounded-full bg-muted">
              <span className={cn('block h-full rounded-full', o.win ? 'bg-success' : o.skipped ? 'bg-muted-foreground/30' : 'bg-primary/40')} style={{ width: `${(o.price / max) * 100}%` }} />
            </span>
            <span className="text-right font-mono tabular-nums">${o.price}{o.win && <TrophyIcon aria-label="winner" className="ml-1 inline size-3.5 text-success" />}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- page
export default function HowItWorksPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab')! : 'overview';

  return (
    <>
      <PageHeader title="How It Works" description="A friendly guide to the Promotion Engine: set up campaigns and rules once, and every sales order line is priced automatically." />

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
        <TabsList variant="line" className="mb-5 w-full justify-start overflow-x-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}><t.icon aria-hidden /> {t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ============================================================== OVERVIEW */}
        <TabsContent value="overview" className="space-y-8">
          <Card className="overflow-hidden">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Prices that follow your promotions, automatically</h2>
                <p className="mt-2 text-muted-foreground">
                  You describe each promotion once, as a campaign with rules. When NetSuite sends a sales order, every line is checked
                  against all active rules and gets the <b className="text-foreground">best valid price</b>, with a plain explanation of why.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild><Link to="/campaigns">Open Campaigns <ArrowRightIcon /></Link></Button>
                  <Button asChild variant="outline"><Link to="/sales-orders">Open Sales Orders</Link></Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Callout icon={TrophyIcon} title="Best price wins" tone="success">Every matching campaign offers a price; the lowest one is used.</Callout>
                <Callout icon={CrownIcon} title="Exclusive overrides">A rule set to Exclusive is used even if something else is cheaper.</Callout>
                <Callout icon={ScaleIcon} title="No match = normal price">If nothing matches, the customer's base price is kept.</Callout>
              </div>
            </CardContent>
          </Card>

          <Block title="The flow in 4 steps">
            <Stepper steps={[
              { icon: SlidersHorizontalIcon, title: 'Set up', text: 'Administration: users, roles, the NetSuite API key, programme eligibility and allowed values.' },
              { icon: MegaphoneIcon, title: 'Create campaigns & rules', text: 'Campaigns: dates, who and which items qualify, the discount. Submit, then an approver approves.' },
              { icon: PlugIcon, title: 'Orders arrive', text: 'NetSuite sends each sales order (or paste one in Sales Orders to preview it).' },
              { icon: ReceiptIcon, title: 'Priced & explained', text: 'Each line gets its best price, the winning rule and the reasons. The result goes back to NetSuite.' },
            ]} />
          </Block>

          <Block title="What each menu is for">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: MegaphoneIcon, name: 'Campaigns', to: '/campaigns', text: 'Campaigns and their rules, approval, priority, and "Check order today".' },
                { icon: PlugIcon, name: 'Sales Orders', to: '/sales-orders', text: 'Every order with its prices and why, pricing history, Price again, Mark cancelled, field mapping.' },
                { icon: HistoryIcon, name: 'Audit / History', to: '/audit', text: 'Who changed what and when; each rule change is a new version.' },
                { icon: ShieldIcon, name: 'Administration', to: '/admin', text: 'Users, roles, programme eligibility, API keys and settings.' },
              ].map((m) => (
                <Link key={m.name} to={m.to} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  <IconBadge icon={m.icon} />
                  <div className="mt-3 flex items-center gap-1 font-semibold">{m.name}<ArrowRightIcon aria-hidden className="size-4 opacity-0 transition-opacity group-hover:opacity-100" /></div>
                  <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
                </Link>
              ))}
            </div>
          </Block>
        </TabsContent>

        {/* ============================================================== CAMPAIGNS & RULES */}
        <TabsContent value="setup" className="space-y-8">
          <Block title="A campaign's life" intro="Only Active campaigns price orders. Editing an approved campaign or its rules sends it back to Draft, so only approved content is ever used.">
            <ol aria-label="Campaign statuses" className="flex flex-wrap items-center gap-2">
              {[
                ['Draft', 'neutral', 'being prepared'],
                ['Pending Approval', 'amber', 'submitted'],
                ['Approved', 'blue', 'starts later'],
                ['Active', 'green', 'prices orders'],
              ].map(([label, tone, hint], i, arr) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="rounded-xl border bg-card px-3 py-2 text-center">
                    <ToneBadge tone={tone}>{label}</ToneBadge>
                    <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
                  </span>
                  {i < arr.length - 1 && <ArrowRightIcon aria-hidden className="size-4 text-muted-foreground" />}
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">Also: <b>Expired</b> (after the end date) and <b>Disabled</b> (switched off). Reject returns a campaign to Draft with the approver's comment.</p>
          </Block>

          <Block title="Create a rule in 6 steps" intro="Campaigns → open a campaign → Add rule. The form only shows the sections the chosen family needs.">
            <Timeline items={[
              { title: 'Name and family', text: 'Pick what kind of rule it is: Everyday Deal, Monthly Promotion, Promotion Code, Customer Exception, Customer Price List, Item Discount Cap or Bonus Stock.' },
              { title: 'Comparison and item cap', text: 'Best Price (normal: the cheapest offer wins) or Exclusive (this rule wins outright). Apply item cap, or an approved bypass.' },
              { title: 'Who qualifies (When)', text: 'Conditions such as Customer, Banner, Marketing Flag, Channel, programme eligibility. All different fields must match.' },
              { title: 'Which items', text: 'Select items by Item Internal ID (include / exclude), or use item conditions such as Item Group or SKU.' },
              { title: 'Quantity and outcome (Then)', text: 'Choose the quantity basis and either quantity tiers (e.g. 6+ → 35 %, 12+ → 45 %) or a single discount.' },
              { title: 'Save, submit, approve', text: 'The rule is saved as version 1 (each later save adds one). Submit the campaign; an approver approves it.' },
            ]} />
          </Block>

          <Block title="Every field explained" intro="Open a field to see its options and an example.">
            <div className="grid gap-2 lg:grid-cols-2">
              <Accordion title="Family — what kind of rule" icon={LayersIcon}>
                <Table caption="Family options" head={['Option', 'Use it for']} rows={[
                  ['Everyday Deal', 'Ongoing deals: Accelerate, LiveLife cartons, Make the Switch.'],
                  ['Monthly Promotion', 'Monthly deals. Needs an audience condition and selected items; the customer must be Monthly-Promotion eligible.'],
                  ['Promotion Code', 'Only when the order carries the code. Optional limits: max uses in total / per customer.'],
                  ['Customer Exception', 'Approved customer-specific exceptions.'],
                  ['Customer Price List', 'Fixed item rates (with a currency). Always Exclusive; used for Price List customers only.'],
                  ['Item Discount Cap', 'Maximum discount % for the selected items. Never creates a price.'],
                  ['Bonus Stock', 'Free units of the same item: buy X get Y.'],
                ]} />
              </Accordion>
              <Accordion title="Comparison — Best Price or Exclusive" icon={ScaleIcon}>
                <p><b>Best Price</b> (default): every matching rule offers a price; the lowest wins, whatever its priority. <b>Exclusive</b>: if it matches, it wins outright even when dearer. See the "How prices are worked out" tab.</p>
              </Accordion>
              <Accordion title="Item cap — apply or bypass" icon={BadgePercentIcon}>
                <p><b>Apply item cap</b>: a % above the item's cap is reduced to the cap (40 % with a 25 % cap → 25 %). <b>Approved cap bypass</b>: this rule may exceed the cap. Fixed prices are not capped.</p>
              </Accordion>
              <Accordion title="Programme eligibility" icon={UsersIcon}>
                <p>None, Accelerate, Make the Switch or Monthly Promotion. The customer must be eligible; the rule must still match. Decided by the first that applies:</p>
                <ol className="list-decimal space-y-0.5 pl-5">
                  <li>Administration → Programme eligibility record for the <b>Customer</b></li>
                  <li>… for the <b>Customer Group</b>, then <b>Banner</b>, then <b>Channel</b></li>
                  <li>The eligibility flag sent with the order</li>
                  <li>Records exist but none applies → not eligible; nothing at all → error PRICING_CONTEXT_INCOMPLETE</li>
                </ol>
              </Accordion>
              <Accordion title="Promotion code, currency, source reference, notes" icon={TagIcon}>
                <p><b>Promotion code</b>: matched with the order's code (case ignored). <b>Max uses</b> (optional): in total / per customer; cancelled orders and re-pricing the same order do not count.</p>
                <p><b>Currency</b> (Price List): an order in another currency gets PRICE_LIST_CURRENCY_MISMATCH.</p>
                <p><b>Source reference</b> and <b>Notes</b> are for people only; they never change a price.</p>
              </Accordion>
              <Accordion title="Selected items and item roles" icon={PackageIcon}>
                <p>Items are matched by <b>Item Internal ID</b> (else Item Code). <b>Include</b> = covered, <b>Exclude</b> = never this item, none = every item the conditions allow. <b>Mixed pool</b> groups items whose quantities add up.</p>
                <p><b>Roles</b>: Standard (normal) · <b>Rate override</b> + Rate = this item's own fixed price in the rule · Cap / Bonus / Exception item only in those rule families. <b>Rate</b> is also each item's price in a Price List.</p>
              </Accordion>
              <Accordion title="Quantity basis" icon={CalculatorIcon}>
                <Table caption="Quantity bases" head={['Option', 'Counts']} rows={[
                  ['Line quantity', 'This line only (qty 6 → tier 6+).'],
                  ['Mixed pool quantity', 'All lines in the pool: A 5 + B 5 = 10.'],
                  ['Order qualifying quantity', 'All lines the rule covers.'],
                  ['Shipper quantity', 'Qty ≥ item shipper qty × multiple (12 × 1: 13 yes, 11 no).'],
                  ['Any quantity', 'At least one unit.'],
                ]} />
              </Accordion>
              <Accordion title="Then — tiers or single discount" icon={BadgePercentIcon}>
                <p><b>Tiers</b>: minimum (included), optional maximum (not included), a Discount % or a Fixed unit rate; the highest tier reached applies. <b>Item rate overrides</b> give one item another % in one tier.</p>
                <p><b>Single discount</b>: Percentage, Fixed discount (amount off), Promotional price, Fixed unit price.</p>
              </Accordion>
              <Accordion title="Cap and bonus settings" icon={GiftIcon}>
                <p><b>Maximum discount %</b> (Cap rules). <b>Bonus</b>: buy quantity, bonus quantity, repeat for every multiple, and "only when the price comes from" (Any / Base pricing / a family).</p>
              </Accordion>
              <Accordion title="Valid from / to, rule type, version" icon={CalendarIcon}>
                <p>Optional rule dates on top of the campaign dates (blank Valid to = open-ended). Rule type is set automatically. Version goes up on every save and is shown on each priced line.</p>
              </Accordion>
            </div>
          </Block>
        </TabsContent>

        {/* ============================================================== PRICING */}
        <TabsContent value="pricing" className="space-y-8">
          <Block title="What happens to each order line" intro="The engine does this for every chargeable line, in this order.">
            <Timeline items={[
              { title: 'Order checks', text: 'Allowed values, no item twice on chargeable lines, order Pending Fulfilment / Ready to Send (when sent). A failure stops the whole order.' },
              { title: 'Special lines', text: 'Free stock and excluded lines are skipped. An approved manual price is kept. Price List customers get their list rate and stop here.' },
              { title: 'Base price', text: <>The customer's normal price (e.g. Wholesale − 20 %). <b>It is always one of the offers.</b></> },
              { title: 'Check every active rule', text: 'Date → promotion code and limits → programme eligibility → customer → items → conditions → quantity tier. A failed check ends that rule; the next rule is tried.' },
              { title: 'Collect the offers', text: 'Best Price: every matching rule adds an offer and checking continues. Exclusive: the first match wins its family outright.' },
              { title: 'Apply caps', text: 'Percentage offers above the item cap are reduced (unless the rule has an approved bypass).' },
              { title: 'Pick the winner', text: 'An Exclusive match if any, otherwise the lowest offer. Equal prices: more specific rule, then campaign priority.' },
              { title: 'Round, bonus, store', text: 'Rounded half-up to 3 decimals; free bonus units added; saved with a new entry in the order\'s pricing history.' },
            ]} />
          </Block>

          <Block title="Best Price vs Exclusive" intro="One order line, base price $100. Campaign 1 offers $80, Campaign 2 $70, Campaign 3 $75.">
            <div className="grid gap-3 lg:grid-cols-2">
              <PriceBars title="All Best Price → $70" note="All three are checked and compared with the base price; the lowest wins, whatever the priority."
                offers={[{ name: 'Base price', price: 100 }, { name: 'Campaign 1', price: 80 }, { name: 'Campaign 2', price: 70, win: true }, { name: 'Campaign 3', price: 75 }]} />
              <PriceBars title="Campaign 1 Exclusive → $80" note="An Exclusive rule that matches is used even though $70 and $75 are cheaper."
                offers={[{ name: 'Base price', price: 100, skipped: true }, { name: 'Campaign 1', price: 80, win: true }, { name: 'Campaign 2', price: 70, skipped: true }, { name: 'Campaign 3', price: 75, skipped: true }]} />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Callout icon={ScaleIcon} title="Dearer than base?">A Best Price offer of $120 never wins: the base $100 is kept.</Callout>
              <Callout icon={TrophyIcon} title="A tie?">Two $70 offers: the more specific rule, then the higher campaign priority.</Callout>
              <Callout icon={CrownIcon} title="When to use Exclusive">Only when a specific agreement must win, e.g. a customer contract.</Callout>
            </div>
          </Block>

          <Block title="The formulas" intro="Calculated at full precision; only the winning price is rounded (half-up, 3 decimals).">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Calc title="Percentage discount" formula="price × (1 − % ÷ 100)" example="20.00 at 35 %" result="13.000" />
              <Calc title="Base price (percentage customer)" formula="wholesale × (1 − base %)" example="20.00 at 20 %" result="16.000" />
              <Calc title="Fixed discount" formula="price − amount (not below 0)" example="20.00 − 2.50" result="17.500" />
              <Calc title="Fixed / promotional price" formula="the entered price" example="Promotional price 14.99" result="14.990" />
              <Calc title="Cap" formula="if % > cap → use the cap" example="40 % on 100, cap 25 %" result="75.000" />
              <Calc title="Bonus (repeat on)" formula="floor(qty ÷ buy) × bonus" example="qty 24, buy 10 get 1" result="2 free" />
            </div>
            <Table caption="From unit price to totals" head={['What', 'How', '6 units at 35 % off 20.00']} rows={[
              ['Original price per unit', 'Price on the order (else base price)', '20.00'],
              ['Discount price per unit', 'The winning price', '13.000'],
              ['Discount per unit', 'Original − discount price', '7.000'],
              ['Total original', 'Original × quantity', '120.00'],
              [<b key="f">Final line total</b>, 'Discount price × quantity', <b key="v">78.000</b>],
              ['Saving', 'Total original − final', '42.000'],
            ]} />
          </Block>

          <Block title="Quantity tiers at a glance" intro="One rule with three tiers; reference price 20.00.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { qty: '1 – 5', pct: '20 %', price: '16.000', ex: 'qty 3 → 48.000' },
                { qty: '6 – 11', pct: '35 %', price: '13.000', ex: 'qty 6 → 78.000' },
                { qty: '12 +', pct: '45 %', price: '11.000', ex: 'qty 12 → 132.000' },
              ].map((t, i) => (
                <div key={t.qty} className="rounded-xl border bg-card p-4 text-center">
                  <div className="text-xs font-semibold text-muted-foreground">TIER {i + 1} · QTY {t.qty}</div>
                  <div className="mt-1 text-2xl font-semibold text-primary">{t.pct}</div>
                  <div className="font-mono tabular-nums">{t.price} each</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.ex}</div>
                </div>
              ))}
            </div>
          </Block>
        </TabsContent>

        {/* ============================================================== EXAMPLES */}
        <TabsContent value="examples" className="space-y-8">
          <Block title="A complete order" intro="Customer CUST1001 · Pharmacy · TerryWhite · base 20 % off Wholesale · Accelerate and Monthly-Promotion eligible · 8 Oct 2026.">
            <div className="mx-auto max-w-3xl rounded-xl border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <span className="flex items-center gap-2 font-semibold"><ReceiptIcon aria-hidden className="size-4 text-primary" /> Sales order SO-HELP</span>
                <ToneBadge tone="green">priced</ToneBadge>
              </div>
              <ul className="divide-y">
                {[
                  { item: 'Vitamin C × 6', why: 'TerryWhite Accelerate 35 % (tie with Pharmacy 35 %; mixed deal 14.00 and base 16.00 dearer)', rate: '13.000', total: '78.000' },
                  { item: 'Zinc × 5', why: 'Monthly mixed deal: Vitamin C 6 + Zinc 5 = 11 ≥ 10 → 30 %', rate: '7.000', total: '35.000' },
                  { item: 'Sea Buckthorn × 3', why: 'Accelerate 35 % capped at 25 %', rate: '30.000', total: '90.000' },
                  { item: 'Fish Oil × 24', why: 'No rule matched → base price; + 2 free (buy 10 get 1)', rate: '12.000', total: '288.000' },
                  { item: 'Vitamin C (free stock)', why: 'Skipped: free-stock line', rate: '—', total: '—' },
                ].map((l) => (
                  <li key={l.item} className="grid grid-cols-[1fr_auto] gap-x-4 px-5 py-3 sm:grid-cols-[1fr_5rem_6rem]">
                    <div><div className="font-medium">{l.item}</div><div className="text-xs text-muted-foreground">{l.why}</div></div>
                    <div className="hidden text-right font-mono tabular-nums sm:block">{l.rate}</div>
                    <div className="text-right font-mono font-semibold tabular-nums">{l.total}</div>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t bg-muted/40 px-5 py-3">
                <span className="text-sm text-muted-foreground">Wholesale total 650.00</span>
                <span className="text-lg font-semibold tabular-nums">Total 491.000</span>
              </div>
            </div>
          </Block>

          <Block title="More examples">
            <div className="grid gap-2 lg:grid-cols-2">
              <Accordion title="Customer-specific rule" icon={UsersIcon}>
                <p>Rule A: Customer = CUST1001 → 40 %. Rule B: everyone → 30 %. Both Best Price, price 20.00.</p>
                <ul className="space-y-1">
                  <li><Yes>CUST1001: 12.000 (A) beats 14.000 (B).</Yes></li>
                  <li><No>Other customers: A does not match → 14.000 (B).</No></li>
                  <li>If A gave only 25 % (15.000), B would win for CUST1001 too; make A <b>Exclusive</b> to force it.</li>
                </ul>
              </Accordion>
              <Accordion title="Banner-specific rule (Accelerate)" icon={TagIcon}>
                <p>R1 Pharmacy: Channel = Pharmacy, tiers 6 → 35 %, 12 → 45 %. R2 TerryWhite: Banner = TerryWhite, 3 → 35 %. Both need Accelerate eligibility and an Accelerate item.</p>
                <ul className="space-y-1">
                  <li><Yes>TerryWhite, qty 3: R2 → 35 %.</Yes></li>
                  <li><No>Other pharmacy, qty 3: R1 needs 6 → base price.</No></li>
                  <li><Yes>TerryWhite, qty 12: R1's 45 % beats R2's 35 % (Best Price).</Yes></li>
                </ul>
              </Accordion>
              <Accordion title="Programme eligibility" icon={UsersIcon}>
                <p>Channel Pharmacy record = eligible, Customer BLOCKED record = not eligible:</p>
                <ul className="space-y-1">
                  <li><Yes>Any pharmacy customer → the Accelerate rule can apply.</Yes></li>
                  <li><No>Customer BLOCKED → not eligible (the customer record wins over the channel).</No></li>
                </ul>
              </Accordion>
              <Accordion title="Mixed pool" icon={PackageIcon}>
                <p>Vitamin C + Zinc in pool P1, 10+ → 30 %.</p>
                <ul className="space-y-1">
                  <li><Yes>Vitamin C 6 + Zinc 5 = 11 → both lines 30 %.</Yes></li>
                  <li><No>Vitamin C 6 + Zinc 3 = 9 → neither.</No></li>
                </ul>
              </Accordion>
              <Accordion title="Promotion code with a limit" icon={TagIcon}>
                <p>Code SPRING, 50 %, max 1 use per customer.</p>
                <ul className="space-y-1">
                  <li><Yes>First order with SPRING → 50 %.</Yes></li>
                  <li><No>Second order by the same customer → normal price.</No></li>
                  <li>If the first order is cancelled, the use is freed.</li>
                </ul>
              </Accordion>
              <Accordion title="Shipper (LiveLife carton)" icon={PackageIcon}>
                <p>Banner LiveLife, shipper basis, multiple 1, 40 %. Item shipper 12:</p>
                <ul className="space-y-1">
                  <li><Yes>Qty 13 → 40 %.</Yes></li>
                  <li><No>Qty 11 → normal price. No shipper quantity → INVALID_SHIPPER_QUANTITY.</No></li>
                </ul>
              </Accordion>
            </div>
          </Block>
        </TabsContent>

        {/* ============================================================== REFERENCE */}
        <TabsContent value="reference" className="space-y-3">
          <Accordion title="Conditions you can check" icon={SlidersHorizontalIcon} defaultOpen>
            <p>Operators: = · ≠ · is one of · is not one of · ≥ · ≤ (Yes / No fields use =). Text ignores upper / lower case. Repeating the same text field means "any of these".</p>
            <Table caption="Condition fields" head={['Group', 'Field', 'Notes']} rows={[
              ['Customer', 'Customer, Customer Group, Banner, Marketing Flag', 'Text'],
              ['Customer', 'Channel', 'Required when a rule uses it'],
              ['Customer', 'Accelerate / Monthly Promotion / MTS Eligible', 'Yes / No'],
              ['Product', 'Item Internal ID', 'Required when a rule uses it'],
              ['Product', 'SKU, Product, Item Group, Item Flag, Category', 'Text'],
              ['Product', 'Accelerate Flag, Commodity Flag', 'Yes / No'],
              ['Product', 'Shipper Quantity', '≥'],
              ['Order', 'Quantity', '≥ · ≤ (line quantity)'],
              ['Order', 'Order Value', '≥ (quantity × price of chargeable lines)'],
            ]} />
          </Accordion>
          <Accordion title="Customer price levels (base price)" icon={ScaleIcon}>
            <Table caption="Price levels" head={['Price level', 'Base price']} rows={[
              ['PERCENTAGE', 'Wholesale × (1 − base %)'],
              ['WHOLESALE', 'Wholesale'],
              ['RRP', 'RRP'],
              ['PRICE_LIST', 'Price List rate only (exclusive)'],
              ['BYPASS_100_PERCENT', 'Line not priced'],
              ['(not sent)', 'The price already on the order (with a warning)'],
            ]} />
          </Accordion>
          <Accordion title="Special lines, history and cancellation" icon={HistoryIcon}>
            <Table caption="Lines and history" head={['Case', 'What happens']} rows={[
              ['Free stock, notes, freight, tax… or Exclude pricing line', 'Skipped: no promotion, not counted in quantities'],
              ['Manual override', 'The approved manual price is kept'],
              ['Same item on two chargeable lines', 'Order rejected (DUPLICATE_CHARGEABLE_ITEM_CODE)'],
              ['Every submission / Price again', 'New pricing history entry PR-<order>-01, -02 … (never overwritten)'],
              ['Cancelled (NetSuite or "Mark cancelled")', 'Not priced again; history kept; promotion-code uses freed'],
            ]} />
          </Accordion>
          <Accordion title="NetSuite field mapping" icon={PlugIcon}>
            <p>Sales Orders → Field mapping lists every field the engine reads: price level, base %, eligibility flags, Marketing Flag, Category, Accelerate / Commodity flags, line type, exclude, manual override, order / pricing status. Enter the NetSuite path of each field NetSuite sends; fields without a path are simply not in the order.</p>
          </Accordion>
          <Accordion title="Messages: errors and warnings" icon={FileTextIcon}>
            <Table caption="Messages" head={['Code', 'Meaning']} rows={[
              ['PRICING_CONTEXT_INCOMPLETE', 'A required value is missing (e.g. channel, eligibility, item ID, base %)'],
              ['INVALID_CONTROLLED_ATTRIBUTE', 'A value that is not allowed (channel, banner, marketing flag, price level, line type)'],
              ['DUPLICATE_CHARGEABLE_ITEM_CODE', 'Same item on two chargeable lines'],
              ['ORDER_NOT_ELIGIBLE_FOR_SUBMISSION', 'Not Pending Fulfilment / Ready to Send'],
              ['WHOLESALE_PRICE_MISSING · RRP_MISSING', 'The price level needs a price the line does not have'],
              ['INVALID_SHIPPER_QUANTITY', 'Shipper rule but no shipper quantity'],
              ['PRICE_LIST_ASSIGNMENT_NOT_FOUND · PRICE_LIST_ITEM_NOT_FOUND · PRICE_LIST_CURRENCY_MISMATCH', 'Price List problems'],
              ['LINE_EXCLUDED_FROM_PRICING · MANUAL_OVERRIDE_PRESERVED', 'Warnings'],
              ['CAP_APPLIED · MONTHLY_PROMO_CAP_BYPASS', 'Information'],
            ]} />
          </Accordion>
          <Accordion title="What is implemented" icon={CheckIcon}>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {[
                'All rule families, tiers and quantity bases',
                'Best Price across all campaigns, and Exclusive',
                'Item caps and approved bypass',
                'Bonus stock',
                'Customer Price Lists with currency check',
                'Item roles (rate override)',
                'Programme eligibility records',
                'Promotion code usage limits',
                'Excluded lines and manual override',
                'Validation and error codes',
                'Rule versions on every result',
                'Pricing history and cancellation',
              ].map((t) => <li key={t}><Yes>{t}</Yes></li>)}
            </ul>
            <p className="text-muted-foreground">Best Price ignoring rule specificity (it only breaks ties) is a deliberate choice; use Exclusive to force a specific rule.</p>
          </Accordion>
        </TabsContent>

        {/* ============================================================== FAQ */}
        <TabsContent value="faq" className="space-y-2">
          {[
            { q: 'Why did my promotion not apply?', a: <>Open the order → <b>Pricing &amp; why</b>. Every rule that was checked is listed with the first check that failed (e.g. "Quantity 2 does not reach a tier", or a missing value). Also check that the campaign is <b>Active</b> on the order date.</> },
            { q: 'Two campaigns match — which one wins?', a: <>With Best Price, the <b>lowest</b> price. With an Exclusive rule, that rule. Equal prices: the more specific rule, then the higher campaign priority.</> },
            { q: 'How do I make sure a customer always gets their contract price?', a: <>Set that rule's Comparison to <b>Exclusive</b>, or use a <b>Customer Price List</b> for fixed item rates.</> },
            { q: 'Do discounts add up?', a: <>No. Each rule offers a complete price and only one is used (20 % and 10 % never become 30 %).</> },
            { q: 'What if no rule matches?', a: <>The line keeps the customer's base price, with the reason "No eligible promotion found". The order is never rejected for that.</> },
            { q: 'I changed a rule — does it reprice old orders?', a: <>No. New orders use the new version. Use <b>Price again</b> on an order to reprice it; the old result stays in its pricing history.</> },
            { q: 'Why did my campaign go back to Draft?', a: <>Editing an approved campaign or any of its rules needs approval again. Submit it and ask an approver.</> },
            { q: 'How is a cancelled order handled?', a: <>NetSuite sends the cancellation (or use <b>Mark cancelled</b>). The order is not priced again, its history is kept and its promotion-code uses are freed.</> },
          ].map((f) => (
            <Accordion key={f.q} title={f.q} icon={CircleHelpIcon}><p>{f.a}</p></Accordion>
          ))}
          <div className="pt-2"><Callout icon={BanIcon} title="Still stuck?">The <b>Check order today</b> tab on Campaigns lists every active rule in the order it is checked.</Callout></div>
        </TabsContent>
      </Tabs>
    </>
  );
}
