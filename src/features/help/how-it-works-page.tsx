import { ArrowDownIcon, ArrowRightIcon, CircleCheckIcon, CircleXIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/page-header';
import { ToneBadge } from '@/components/shared/status';
import { Card, CardContent } from '@/components/ui/card';

/* Informational only: how the system and its rules work (Promotion Engine specifications v2.0). */

const SECTIONS = [
  { id: 'system', title: '1. Complete system flow' },
  { id: 'campaigns', title: '2. Campaign / promotion flow' },
  { id: 'rules', title: '3. Rules flow' },
  { id: 'evaluation', title: '4. Rule evaluation flow' },
  { id: 'price', title: '5. Price calculation' },
  { id: 'example', title: '6. Complete real-world example' },
  { id: 'no-match', title: '7. No match scenario' },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <Card>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">{title}</h2>
          {intro && <p className="max-w-3xl text-muted-foreground">{intro}</p>}
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold">{children}</h3>;
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="max-w-3xl space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">{i + 1}</span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** A left-to-right chain of steps that wraps on small screens. */
function Flow({ steps, label }: { steps: string[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className="rounded-lg border bg-muted/50 px-3 py-1.5 text-sm font-medium">{s}</span>
          {i < steps.length - 1 && <ArrowRightIcon aria-hidden className="size-4 text-muted-foreground" />}
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-muted/60">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t align-top">
              {r.map((c, k) => <td key={k} className="px-3 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Yes({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-start gap-1.5"><CircleCheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /><span>{children}<span className="sr-only"> (passed)</span></span></span>;
}

function No({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-start gap-1.5"><CircleXIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" /><span>{children}<span className="sr-only"> (failed)</span></span></span>;
}

function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-3xl rounded-lg border-l-4 border-primary/50 bg-primary/5 px-4 py-3 text-sm">{children}</p>;
}

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="How It Works"
        description="A plain-language guide to the system: what each menu does, how campaigns and rules are set up, and how every sales order line gets its price."
      />
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:items-start">
        <nav aria-label="On this page" className="lg:sticky lg:top-20">
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">On this page</p>
              <ul className="space-y-1 text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="block rounded px-2 py-1.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{s.title}</a></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </nav>

        <div className="min-w-0 space-y-6">
          {/* ------------------------------------------------------------------ 1 */}
          <Section id="system" title="1. Complete system flow"
            intro="Promotions are set up once in Campaigns. Every sales order that arrives is then priced automatically against the approved campaigns, and the result is shown in Sales Orders.">
            <H3>What each menu is for</H3>
            <Table caption="Sidebar menus" head={['Menu', 'What you do there', 'Who uses it']} rows={[
              [<Link to="/campaigns" className="font-medium text-primary hover:underline">Campaigns</Link>, 'Create campaigns, add their rules, submit them for approval, approve them and set their priority. "Check order today" shows the order in which rules are checked.', 'Campaign managers and approvers'],
              [<Link to="/sales-orders" className="font-medium text-primary hover:underline">Sales Orders</Link>, 'See every order received from NetSuite with its price per line and why. "Add new sales order" lets you paste a NetSuite order to preview its price. "Price again" re-prices an order with today\'s rules.', 'Sales order users'],
              [<Link to="/audit" className="font-medium text-primary hover:underline">Audit / History</Link>, 'See who changed what and when: campaigns, rules (each change creates a new rule version), users and settings.', 'Everyone'],
              [<span className="font-medium">Administration</span>, 'Users and roles, the API key NetSuite uses, and Settings: organisation, currency, timezone, logo and the allowed Channel / Banner / Marketing Flag values.', 'Administrators'],
              [<span className="font-medium">How It Works</span>, 'This guide.', 'Everyone'],
            ]} />
            <H3>The order you work in</H3>
            <Steps items={[
              <><b>Administration:</b> add users and roles, create the API key NetSuite sends, optionally list the allowed Channels, Banners and Marketing Flags.</>,
              <><b>Campaigns:</b> create a campaign, add its rules, submit it; an approver approves it.</>,
              <><b>NetSuite</b> sends sales orders automatically (or paste one in <b>Sales Orders → Add new sales order</b>).</>,
              <><b>The pricing engine</b> checks every order line against the approved campaigns and works out the final price.</>,
              <><b>Sales Orders</b> shows each line's price, the rule that gave it and why; the price is also returned to NetSuite.</>,
              <><b>Audit / History</b> keeps a record of every change.</>,
            ]} />
            <H3>How the data flows</H3>
            <Flow label="Data flow" steps={['Administration (users, API key, allowed values)', 'Campaigns + Rules (approved)', 'NetSuite sales order', 'Pricing engine', 'Price per line', 'Sales Orders + NetSuite']} />
          </Section>

          {/* ------------------------------------------------------------------ 2 */}
          <Section id="campaigns" title="2. Campaign / promotion flow"
            intro="A campaign is a container for rules: it has a name, dates, an optional audience and a priority, and it must be approved before any of its rules are used.">
            <Steps items={[
              <>Open <b>Campaigns → New campaign</b>. Enter the <b>name</b>, a short <b>code</b> and a <b>description</b>.</>,
              <>Set the <b>start and end dates</b>. The campaign only prices orders whose order date falls between them (both days included).</>,
              <>Optionally limit who and what it covers: <b>customers, customer groups, channels, SKUs, item groups</b>. These limits apply to every rule in the campaign. Leave them empty for "everyone / every item".</>,
              <>Save. The campaign is a <ToneBadge>Draft</ToneBadge> and is now ready for rules (section 3).</>,
              <>Click <b>Submit</b> → <ToneBadge tone="amber">Pending approval</ToneBadge>. An approver clicks <b>Approve</b> → <ToneBadge tone="green">Approved</ToneBadge>, or <b>Reject</b> with a comment (back to Draft).</>,
              <>Between its dates an approved campaign is <ToneBadge tone="green">Active</ToneBadge>; after the end date it is <b>Expired</b>. <b>Disable</b> switches it off at any time.</>,
              <>Drag campaigns on the Campaigns list to set their <b>priority</b> (1 = strongest). Priority decides between equally specific rules of the same kind.</>,
            ]} />
            <Note>Changing an approved campaign or any of its rules sends it back to <b>Draft</b>, so only what an approver approved is ever used to price orders.</Note>
            <H3>How an active campaign is used</H3>
            <p className="max-w-3xl">When a sales order arrives, only campaigns that are <b>Approved, enabled and within their dates</b> on the order date are loaded. All their active rules take part in pricing; draft, pending, disabled and expired campaigns are ignored.</p>
          </Section>

          {/* ------------------------------------------------------------------ 3 */}
          <Section id="rules" title="3. Rules flow"
            intro="A rule says: WHEN these conditions are true for an order line, THEN the line may get this price. Rules always belong to a campaign.">
            <H3>Creating a rule</H3>
            <Steps items={[
              <>Open the campaign and click <b>Add rule</b> (the rule is linked to that campaign automatically).</>,
              <>Give it a <b>name</b> and choose its <b>family</b> (what kind of rule it is, table below).</>,
              <>Add <b>conditions</b> (who and what qualifies), the <b>selected items</b>, the <b>quantity basis</b> and the <b>outcome</b> (quantity tiers or a single discount).</>,
              <>Optionally set the rule's own <b>valid from / to</b> dates. Save: the rule gets <b>version 1</b>; every later change adds 1.</>,
            ]} />
            <H3>Rule families</H3>
            <Table caption="Rule families" head={['Family', 'Used for']} rows={[
              ['Everyday', 'Ongoing deals, e.g. Accelerate, LiveLife carton pricing, Make the Switch.'],
              ['Monthly Promotion', 'Temporary monthly deals. Must name an audience (customer, banner, channel…) and its items.'],
              ['Promotion Code', 'Only applies when the order carries the matching promotion code.'],
              ['Exception', 'Approved customer-specific exceptions.'],
              ['Price List', 'Fixed item rates for a customer. Exclusive: such a customer gets only these rates.'],
              ['Cap', 'A maximum discount % for some items (e.g. Sea Buckthorn 25%). It limits, never creates, a discount.'],
              ['Bonus', 'Free stock of the same item, e.g. buy 10 get 1.'],
            ]} />
            <H3>Conditions you can set and how they are checked</H3>
            <Table caption="Conditions" head={['Condition', 'Examples', 'How it is checked']} rows={[
              ['Customer', 'Customer, Customer Group', 'The order\'s customer must equal / be one of the values.'],
              ['Banner / Marketing Flag / Channel', 'TerryWhite, LiveLife, Pharmacy', 'Compared with the values on the order (upper / lower case ignored).'],
              ['Programme', 'Accelerate, MTS, Monthly Promotion', 'The customer must be eligible (Yes on the order). Eligible only means "may take part": the rule must still match.'],
              ['Item / product', 'Item ID, SKU, Product, Item Group, Category, Accelerate Flag', 'The line\'s item must be one of the rule\'s selected items (and not excluded) and meet the item conditions.'],
              ['Date', 'Campaign dates, rule dates', 'The order date must be inside both.'],
              ['Quantity', 'Line quantity, mixed pool, whole order, shipper (carton)', 'The counted quantity must reach a tier; the highest tier reached applies.'],
              ['Discount', '35 %, fixed rate 12.500', 'Taken from the tier (or the single discount) and applied to the item\'s Wholesale Price.'],
            ]} />
            <Note>Several conditions on <b>different</b> fields must <b>all</b> be true (customer AND item AND quantity). Several entries for the <b>same</b> field mean "any of these" (Product = A or Product = B).</Note>
            <H3>How several rules work together</H3>
            <ul className="max-w-3xl list-disc space-y-1 pl-5">
              <li>Rules of the <b>same family</b> are checked one by one; the first one that fully matches is that family's offer.</li>
              <li>Every <b>family</b> makes its own offer, and the base price is always an offer too.</li>
              <li>The <b>lowest price</b> of all offers wins (a rule marked <b>Exclusive</b> wins outright). Discounts are <b>never added together</b>.</li>
            </ul>
          </Section>

          {/* ------------------------------------------------------------------ 4 */}
          <Section id="evaluation" title="4. Rule evaluation flow" intro="This happens automatically for every line of every sales order received.">
            <Flow label="Evaluation sequence" steps={['Sales order received', 'Customer check', 'Campaign check', 'Rule check', 'Item / product check', 'Date check', 'Quantity check', 'Discount calculation', 'Final price']} />
            <H3>Step by step</H3>
            <Steps items={[
              <><b>Order checks:</b> the order must be valid (no item twice on chargeable lines, allowed Channel / Banner values). Free-stock and excluded lines are skipped; an approved manual price is kept.</>,
              <><b>Base price:</b> the customer's normal price is worked out first (e.g. Wholesale minus the customer's base discount). It is always one of the offers.</>,
              <><b>Families, one after another:</b> Everyday → Monthly Promotion → Promotion Code (only if the order has a code) → Exception.</>,
              <><b>Inside a family, which rule first?</b> The most specific: rules for one <b>Customer</b>, then <b>Banner</b>, then <b>Marketing Flag</b> or group, then <b>Channel</b>, then general rules. Equal ones: campaign priority, then rule priority.</>,
              <><b>Each rule is checked in this order:</b> date → promotion code → programme eligibility → customer / audience → item → other conditions → quantity and tier.</>,
              <><b>Rule does not match</b> (any check fails): the reason is recorded (e.g. "Quantity 2 does not reach a tier") and the <b>next rule of the same family</b> is checked.</>,
              <><b>Rule matches:</b> its price becomes that family's offer and the remaining rules of <b>that family</b> are not checked. Evaluation <b>continues with the next family</b>.</>,
              <><b>Compare:</b> caps are applied, then the <b>lowest</b> offer wins (an Exclusive rule wins outright). The winning price is rounded to 3 decimals.</>,
              <><b>No rule matches at all:</b> the base price is used (section 7).</>,
            ]} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Note><Yes><b>Match</b> → becomes the offer of its family → stop that family → go to the next family.</Yes></Note>
              <Note><No><b>No match</b> → try the next rule in the family → if none left, the family makes no offer.</No></Note>
            </div>
          </Section>

          {/* ------------------------------------------------------------------ 5 */}
          <Section id="price" title="5. Price calculation" intro="Example: a rule gives 35 % off. The item's Wholesale (original) price is 20.00 and 6 are ordered.">
            <Table caption="Price calculation example" head={['Item', 'Formula', 'Value']} rows={[
              ['Original price (per unit)', 'Wholesale Price of the item', '20.00'],
              ['Quantity', 'Ordered quantity', '6'],
              ['Discount', 'From the matching rule / tier', '35 %'],
              ['Discount price (per unit)', 'Original price × (1 − 35 %)', '13.00'],
              ['Discount amount per unit', 'Original price − Discount price', '7.00'],
              ['Total original price', 'Original price × Quantity', '120.00'],
              ['Total discount price', 'Discount price × Quantity', '78.00'],
              ['You save', 'Total original − Total discount price', '42.00'],
              [<b key="f">Final price</b>, 'The lowest valid offer per unit, rounded to 3 decimals', <b key="v">13.000 per unit · 78.000 for the line</b>],
            ]} />
            <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm">
              <li>The final price is compared with every other offer (the customer's base price, other families) before it is used.</li>
              <li>If a <b>cap</b> applies (e.g. maximum 25 %), a bigger discount is reduced to the cap.</li>
              <li><b>Bonus stock</b> (e.g. 2 free units) is listed separately; it never changes the price.</li>
            </ul>
          </Section>

          {/* ------------------------------------------------------------------ 6 */}
          <Section id="example" title="6. Complete real-world example"
            intro="Customer CUST1001 orders on 8 October 2026. Channel Pharmacy, Banner TerryWhite, Accelerate eligible, Monthly Promotion eligible, normal (base) discount 20 % off Wholesale.">
            <H3>Campaigns and rules</H3>
            <Table caption="Example campaigns" head={['Campaign (priority, dates)', 'Rule', 'Conditions', 'Outcome']} rows={[
              ['Accelerate (1) · 1 Jan – 31 Dec 2026', 'R1 Accelerate Pharmacy (Everyday)', 'Channel = Pharmacy · Accelerate item · Accelerate eligible', '6+ → 35 % · 12+ → 45 %'],
              ['Accelerate (1)', 'R2 Accelerate TerryWhite (Everyday)', 'Banner = TerryWhite · Accelerate item · Accelerate eligible', '3+ → 35 %'],
              ['October Monthly (2) · 1 – 31 Oct 2026', 'R3 Mixed deal (Monthly Promotion)', 'Channel is Pharmacy or Health Food · items Vitamin C + Zinc share one pool', 'pool 10+ → 30 %'],
              ['September Monthly (3) · 1 – 30 Sep 2026', 'R4 Zinc deal (Monthly Promotion)', 'Channel = Pharmacy · item Zinc', '50 %'],
              ['Controls (4) · 1 Jan – 31 Dec 2026', 'R5 Sea Buckthorn cap (Cap)', 'item Sea Buckthorn', 'maximum 25 %'],
              ['Controls (4)', 'R6 Fish Oil bonus (Bonus)', 'item Fish Oil', 'buy 10 get 1 free, only with the base price'],
            ]} />
            <H3>Order lines and base price (Wholesale − 20 %)</H3>
            <Table caption="Order lines" head={['Line', 'Item', 'Qty', 'Wholesale', 'Accelerate item', 'Base price']} rows={[
              ['1', 'Vitamin C', '6', '20.00', 'Yes', '16.00'],
              ['2', 'Zinc', '5', '10.00', 'No', '8.00'],
              ['3', 'Sea Buckthorn', '3', '40.00', 'Yes', '32.00'],
              ['4', 'Fish Oil', '24', '15.00', 'No', '12.00'],
              ['5', 'Vitamin C (free stock)', '1', '—', '—', 'skipped'],
            ]} />
            <H3>Line by line</H3>
            <div className="space-y-4">
              <ExampleLine title="Line 1 · Vitamin C × 6" checks={[
                <Yes key="a">Everyday: R2 is checked first (Banner is more specific than Channel). Date, Accelerate eligible, Banner TerryWhite, Accelerate item, quantity 6 reaches 3+ → 35 % → <b>13.00</b>. R1 is not checked.</Yes>,
                <Yes key="b">Monthly: R3. Pool = Vitamin C 6 + Zinc 5 = 11 (free line not counted) reaches 10+ → 30 % → <b>14.00</b>.</Yes>,
                <No key="c">Monthly: R4 is skipped because R3 already matched; it would also fail its date (ended 30 Sep).</No>,
              ]} result="Offers: base 16.00 · Everyday 13.00 · Monthly 14.00 → lowest = 13.000 (R2). Line total 78.000." />
              <ExampleLine title="Line 2 · Zinc × 5" checks={[
                <No key="a">Everyday: R2 and then R1 fail because Zinc is not an Accelerate item.</No>,
                <Yes key="b">Monthly: R3 matches; the pool quantity is 11 → 30 % → <b>7.00</b>. (5 alone would not have been enough: the mixed pool makes it qualify.)</Yes>,
              ]} result="Offers: base 8.00 · Monthly 7.00 → 7.000 (R3). Line total 35.000." />
              <ExampleLine title="Line 3 · Sea Buckthorn × 3" checks={[
                <Yes key="a">Everyday: R2 matches → 35 % → 26.00, but the cap R5 allows at most 25 % → <b>30.00</b>.</Yes>,
                <No key="b">Monthly: Sea Buckthorn is not one of R3's items; R4 is out of date.</No>,
              ]} result="Offers: base 32.00 · Everyday (capped) 30.00 → 30.000. Line total 90.000." />
              <ExampleLine title="Line 4 · Fish Oil × 24" checks={[
                <No key="a">Everyday: not an Accelerate item. Monthly: not in R3; R4 out of date.</No>,
                <Yes key="b">Bonus R6: the price came from the base price, so 24 ÷ 10 = 2 free Fish Oil.</Yes>,
              ]} result="No rule matched → base price 12.000. Line total 288.000, plus 2 free units (0.000)." />
              <ExampleLine title="Line 5 · Vitamin C free stock" checks={[<No key="a">Free-stock lines are skipped and do not count in any quantity.</No>]} result="Bypassed." />
            </div>
            <Table caption="Example result" head={['Line', 'Final unit price', 'Why', 'Line total']} rows={[
              ['Vitamin C × 6', '13.000', 'Everyday R2, tier 1', '78.000'],
              ['Zinc × 5', '7.000', 'Monthly Promotion R3', '35.000'],
              ['Sea Buckthorn × 3', '30.000', 'Everyday R2, capped at 25 %', '90.000'],
              ['Fish Oil × 24', '12.000', 'Base price + 2 bonus units', '288.000'],
              [<b key="t">Order</b>, '', 'Wholesale total 650.00', <b key="v">491.000</b>],
            ]} />
          </Section>

          {/* ------------------------------------------------------------------ 7 */}
          <Section id="no-match" title="7. No match scenario">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <span className="rounded-lg border bg-muted/50 px-3 py-1.5 text-sm font-medium">No campaign or rule matches</span>
              <ArrowRightIcon aria-hidden className="hidden size-4 text-muted-foreground sm:block" />
              <ArrowDownIcon aria-hidden className="size-4 text-muted-foreground sm:hidden" />
              <span className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-semibold">Use the original / base price</span>
            </div>
            <ul className="max-w-3xl list-disc space-y-1 pl-5">
              <li>The line keeps the customer's <b>base price</b>: Wholesale minus the customer's base discount (or Wholesale / RRP, depending on the customer). If NetSuite does not send the customer's price level, the <b>price already on the order</b> is used.</li>
              <li>The reason is shown: <i>"No eligible promotion found"</i>, and <b>Pricing &amp; why</b> lists every rule that was checked and the check that failed.</li>
              <li>The order is never rejected just because nothing matched.</li>
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}

function ExampleLine({ title, checks, result }: { title: string; checks: ReactNode[]; result: string }) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm">{checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
      <p className="mt-2 text-sm font-medium"><ArrowRightIcon aria-hidden className="mr-1 inline size-4 text-primary" />{result}</p>
    </div>
  );
}
