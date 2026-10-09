import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, EllipsisVerticalIcon, GripVerticalIcon, LayersIcon, ListOrderedIcon,
  PlusIcon, PowerIcon, PowerOffIcon, ScanEyeIcon,
} from 'lucide-react';
import { useState, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState, LoadingBlock, SearchInput, Toolbar } from '@/components/shared/misc';
import { PageHeader } from '@/components/shared/page-header';
import { SimpleSelect } from '@/components/shared/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Can, useAuth } from '@/features/auth/auth-context';
import { api, errorText } from '@/lib/api-client';
import { fmtDate, plural } from '@/lib/format';
import { useMeta } from '@/lib/meta';
import { cn } from '@/lib/utils';
import { StatusDot } from './campaign-status';
import { CheckOrder } from './check-order';
import type { Campaign } from './types';

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** A labelled count in a campaign row; the label is visible so the number reads without a column header. */
function Stat({ value, label, title, tone, to }: { value: number; label: string; title: string; tone?: 'applied'; to?: string }) {
  const active = tone === 'applied' && value > 0;
  const number = 'text-base font-semibold leading-5 tabular-nums';
  return (
    <div title={title} className="flex w-16 flex-col-reverse items-center rounded-md px-1 py-0.5">
      <dt className="text-xs leading-4 text-[#5b6170] dark:text-muted-foreground">{label}</dt>
      <dd>
        {to ? (
          <Link to={to} aria-label={title}
            className={cn(number, 'block rounded px-2 text-[#2f55d4] underline underline-offset-2 hover:text-[#1d3fae] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-[#93abff]')}>
            {value}
          </Link>
        ) : (
          <span className={cn(number, 'text-[#1f2330] dark:text-foreground', active && 'text-[#1e7a4f] dark:text-[#5fd39a]')}>{value}</span>
        )}
      </dd>
    </div>
  );
}

function CampaignRow({ c, index, count, canOrder, onMove, onToggle, dragProps }: {
  c: Campaign; index: number; count: number; canOrder: boolean;
  onMove: (from: number, to: number) => void; onToggle: (c: Campaign) => void;
  dragProps: Record<string, unknown>;
}) {
  const navigate = useNavigate();
  return (
    <li {...dragProps}
      className="group/row flex min-h-[58px] items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-shadow duration-200 hover:shadow-[0_2px_8px_rgb(16_24_40/0.08)] data-[dragging=true]:opacity-50 data-[over=true]:ring-2 data-[over=true]:ring-[#9db8f2] dark:bg-card">
      {canOrder ? (
        <span className="cursor-grab text-[#5b6170] active:cursor-grabbing dark:text-muted-foreground" title="Drag to change the priority" aria-hidden>
          <GripVerticalIcon className="size-4" />
        </span>
      ) : <span className="w-4" aria-hidden />}
      <StatusDot status={c.status} />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <Link to={`/campaigns/${c.campaign_id}`} title={`${c.code} · priority ${index + 1}`}
          className="truncate text-[17px] leading-6 text-[#2f55d4] hover:underline focus-visible:underline dark:text-[#93abff]">
          {c.name}
        </Link>
      </div>
      <dl className="hidden shrink-0 items-center gap-1 sm:flex">
        <Stat value={c.rule_count} label="rules" title={`${plural(c.rule_count, 'rule')} created in this campaign`} />
        <Stat value={c.applied_rule_count ?? 0} label="applied" tone="applied"
          title={`${c.applied_rule_count ?? 0} of ${plural(c.rule_count, 'rule')} priced at least one sales order line`} />
        <Stat value={c.applied_order_count ?? 0} label="orders"
          title={`${plural(c.applied_order_count ?? 0, 'sales order')} with a line priced by this campaign${c.applied_order_count ? ': open the list' : ''}`}
          to={c.applied_order_count ? `/sales-orders?campaign=${encodeURIComponent(c.campaign_id)}&campaignName=${encodeURIComponent(c.name)}` : undefined} />
      </dl>
      <span className="hidden w-80 shrink-0 text-[15px] tabular-nums text-[#1f2330] md:block dark:text-foreground">{fmtDate(c.start_date)} - {fmtDate(c.end_date)}</span>
      <Button asChild variant="ghost" size="icon" className="size-8 rounded-md bg-[#e9eaf0] text-[#2b2f3a] hover:bg-[#dcdee8] dark:bg-muted dark:text-foreground">
        <Link to={`/campaigns/${c.campaign_id}`} aria-label={`Open ${c.name}`} title="Open campaign"><ScanEyeIcon /></Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${c.name}`}><EllipsisVerticalIcon /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/campaigns/${c.campaign_id}`)}>Open</DropdownMenuItem>
          {canOrder && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={index === 0} onClick={() => onMove(index, index - 1)}><ArrowUpIcon /> Move up</DropdownMenuItem>
              <DropdownMenuItem disabled={index === count - 1} onClick={() => onMove(index, index + 1)}><ArrowDownIcon /> Move down</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onToggle(c)}>
                {c.enabled ? <><PowerOffIcon /> Disable</> : <><PowerIcon /> Enable</>}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function PriorityGroup({ label, campaigns, open, onOpenChange, canOrder, onReorder, onToggle }: {
  label: string; campaigns: Campaign[]; open: boolean; onOpenChange: (o: boolean) => void; canOrder: boolean;
  onReorder: (ids: string[]) => void; onToggle: (c: Campaign) => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const reorder = (from: number, to: number) => {
    if (from !== to) onReorder(move(campaigns, from, to).map((c) => c.campaign_id));
  };
  const dragProps = (i: number) => (canOrder ? {
    draggable: true,
    'data-dragging': drag === i,
    'data-over': over === i && drag !== i,
    onDragStart: (e: DragEvent) => { setDrag(i); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { e.preventDefault(); setOver(i); },
    onDragLeave: () => setOver((o) => (o === i ? null : o)),
    onDrop: (e: DragEvent) => { e.preventDefault(); if (drag !== null) reorder(drag, i); setDrag(null); setOver(null); },
    onDragEnd: () => { setDrag(null); setOver(null); },
  } : {});
  const id = `group-${label.replace(/\W+/g, '-')}`;
  return (
    <section className="rounded-xl border border-[#dfe2ea] border-l-[6px] border-l-[#bfd3f8] bg-[#eeeef4] px-3 py-3 sm:px-5 dark:border-border dark:border-l-[#4a6bb3] dark:bg-muted/40">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onOpenChange(!open)} aria-expanded={open} aria-controls={id}
          className="flex min-h-11 flex-1 items-center gap-3 rounded-md text-left text-xl text-[#1f2330] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-foreground">
          <ChevronDownIcon aria-hidden className={cn('size-5 shrink-0 transition-transform duration-200', !open && '-rotate-90')} />
          {label} <span className="text-[#6b7080] dark:text-muted-foreground">({campaigns.length})</span>
        </button>
      </div>
      {open && (
        <ul id={id} className="mt-3 space-y-3 pl-0 sm:pl-6">
          {campaigns.map((c, i) => (
            <CampaignRow key={c.campaign_id} c={c} index={i} count={campaigns.length} canOrder={canOrder}
              onMove={reorder} onToggle={onToggle} dragProps={dragProps(i)} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const meta = useMeta();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | undefined>();

  const list = useQuery({
    queryKey: ['campaigns', q, status],
    queryFn: async () => (await api.get<Campaign[]>('/campaigns', { params: { q: q || undefined, status } })).data,
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); qc.invalidateQueries({ queryKey: ['check-order'] }); };
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => (await api.put('/campaigns/order', { ids })).data,
    onSuccess: () => { toast.success('Priority saved'); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });
  const toggle = useMutation({
    mutationFn: async (c: Campaign) => (await api.post(`/campaigns/${c.campaign_id}/${c.enabled ? 'disable' : 'enable'}`)).data,
    onSuccess: (_, c) => { toast.success(`${c.name} ${c.enabled ? 'disabled' : 'enabled'}`); refresh(); },
    onError: (e) => toast.error(errorText(e)),
  });

  const rows = list.data || [];
  const [open, setOpen] = useState(true);
  const canOrder = can('campaign:approve') && !q && !status;

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="A campaign holds the rules that price sales orders. Only approved, active campaigns are applied."
        actions={<Can permission="campaign:write"><Button onClick={() => navigate('/campaigns/new')}><PlusIcon /> New campaign</Button></Can>}
      />
      <Tabs defaultValue="list">
        <TabsList variant="line" className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="list"><LayersIcon /> Campaigns</TabsTrigger>
          <TabsTrigger value="order"><ListOrderedIcon /> Check order today</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <Toolbar>
            <SearchInput placeholder="Search name or code" onSearch={setQ} />
            <SimpleSelect className="w-48" options={meta.data?.campaign_statuses} value={status} onChange={setStatus} clearLabel="All Status" placeholder="Status" />
          </Toolbar>
          {list.isLoading ? <LoadingBlock rows={6} /> : !rows.length ? (
            <EmptyState title="No campaigns" description={q || status ? 'Nothing matches the filters.' : 'Create the first campaign, add its rules and submit it for approval.'} />
          ) : (
            <div className="rounded-xl border-l-4 border-l-[#ddd3f7] bg-white p-3 sm:p-4 dark:border-l-[#5b4b8a] dark:bg-card">
              <div className="mb-3 flex flex-wrap items-center gap-2 px-1">
                <h2 className="text-xl text-[#1f2330] dark:text-foreground">All campaigns <span className="text-[#6b7080] dark:text-muted-foreground">({rows.length})</span></h2>
                <Button variant="outline" size="sm" className="ml-auto h-8 rounded-full border-[#c9ccd6] px-4 font-semibold text-[#1f2330] dark:border-border dark:text-foreground"
                  onClick={() => setOpen(!open)}>
                  {open ? 'Collapse all' : 'Expand all'}
                </Button>
              </div>
              <p className="mb-3 px-1 text-sm text-muted-foreground">
                Each order line is checked against campaign 1 first, then 2, 3 …; the first campaign that matches is applied and the rest are skipped
                {canOrder ? ': drag a campaign, or use its menu, to change the order.' : '.'}
              </p>
              <PriorityGroup label="Priority order" campaigns={rows} canOrder={canOrder} open={open} onOpenChange={setOpen}
                onReorder={(ids) => reorder.mutate(ids)} onToggle={(c) => toggle.mutate(c)} />
            </div>
          )}
        </TabsContent>
        <TabsContent value="order"><CheckOrder /></TabsContent>
      </Tabs>
    </>
  );
}
