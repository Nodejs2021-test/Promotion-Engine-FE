import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, CheckIcon, EllipsisVerticalIcon, PencilIcon, PlusIcon, PowerIcon,
  PowerOffIcon, SendIcon, Trash2Icon, TriangleAlertIcon, XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Confirm } from '@/components/shared/confirm';
import { DetailList, EmptyState, LoadingBlock } from '@/components/shared/misc';
import { PageHeader, SectionTitle } from '@/components/shared/page-header';
import { ToneBadge } from '@/components/shared/status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Can, useAuth } from '@/features/auth/auth-context';
import { api, errorText } from '@/lib/api-client';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { labelOf, useMeta } from '@/lib/meta';
import { CampaignStatusBadge } from './campaign-status';
import { RuleBuilder } from './rule-builder';
import type { CampaignDetail, Rule } from './types';

const list = (values: string[]) => (values.length ? values.join(', ') : <span className="text-muted-foreground">all</span>);

function RuleCard({ rule, index, count, canEdit, onEdit, onMove, onDelete }: {
  rule: Rule; index: number; count: number; canEdit: boolean;
  onEdit: () => void; onMove: (to: number) => void; onDelete: () => void;
}) {
  const meta = useMeta();
  return (
    <li className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums" title="Rule priority">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{rule.name}</h3>
            <ToneBadge tone="blue">{labelOf(meta.data?.rule_families, rule.family)}</ToneBadge>
            <span className="text-xs text-muted-foreground tabular-nums">v{rule.version} · {rule.comparison_mode === 'EXCLUSIVE' ? 'Exclusive' : 'Best Price'}</span>
            {!rule.active && <ToneBadge tone="neutral">inactive</ToneBadge>}
            {(rule.start_date || rule.end_date) && (
              <span className="text-xs text-muted-foreground">{rule.start_date ? fmtDate(rule.start_date) : '…'} – {rule.end_date ? fmtDate(rule.end_date) : '…'}</span>
            )}
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-[4.5rem_1fr]">
            <span className="label-mono pt-0.5 text-xs text-brand-foreground">When</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {rule.when.length ? rule.when.map((w, i) => (
                <span key={w} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="label-mono text-[11px] text-muted-foreground">and</span>}
                  <span className="rounded-md border bg-muted/50 px-2 py-0.5">{w}</span>
                </span>
              )) : <span className="text-muted-foreground">every line the campaign covers</span>}
            </div>
            <span className="label-mono pt-0.5 text-xs text-brand-foreground">Then</span>
            <span><span className="rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">{rule.then}</span></span>
          </div>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for rule ${rule.name}`}><EllipsisVerticalIcon /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><PencilIcon /> Edit</DropdownMenuItem>
              <DropdownMenuItem disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUpIcon /> Move up</DropdownMenuItem>
              <DropdownMenuItem disabled={index === count - 1} onClick={() => onMove(index + 1)}><ArrowDownIcon /> Move down</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2Icon /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}

export default function CampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { can } = useAuth();
  const [editing, setEditing] = useState<Rule | null | undefined>(undefined); // undefined = closed, null = new
  const [deleting, setDeleting] = useState<Rule | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');

  const q = useQuery({
    queryKey: ['campaigns', 'detail', id],
    queryFn: async () => (await api.get<CampaignDetail>(`/campaigns/${id}`)).data,
  });
  const update = (c: CampaignDetail) => {
    qc.setQueryData(['campaigns', 'detail', id], c);
    qc.invalidateQueries({ queryKey: ['campaigns'], exact: false, predicate: (x) => x.queryKey[1] !== 'detail' });
    qc.invalidateQueries({ queryKey: ['check-order'] });
  };
  const action = useMutation({
    mutationFn: async ({ path, body }: { path: string; body?: unknown; done: string }) =>
      (await api.post<CampaignDetail>(`/campaigns/${id}/${path}`, body)).data,
    onSuccess: (c, v) => { toast.success(v.done); update(c); setRejecting(false); setComment(''); },
    onError: (e) => toast.error(errorText(e)),
  });
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => (await api.put<CampaignDetail>(`/campaigns/${id}/rules/order`, { ids })).data,
    onSuccess: (c) => { toast.success('Rule order saved'); update(c); },
    onError: (e) => toast.error(errorText(e)),
  });
  const removeRule = useMutation({
    mutationFn: async (r: Rule) => (await api.delete<CampaignDetail>(`/campaigns/${id}/rules/${r.rule_id}`)).data,
    onSuccess: (c) => { toast.success('Rule deleted'); update(c); setDeleting(null); },
    onError: (e) => toast.error(errorText(e)),
  });
  const removeCampaign = useMutation({
    mutationFn: async () => api.delete(`/campaigns/${id}`),
    onSuccess: () => { toast.success('Campaign deleted'); qc.invalidateQueries({ queryKey: ['campaigns'] }); navigate('/campaigns'); },
    onError: (e) => toast.error(errorText(e)),
  });

  if (q.isLoading) return <LoadingBlock rows={8} />;
  const c = q.data;
  if (!c) return <EmptyState title="Campaign not found" description={errorText(q.error)} />;
  const e = c.eligibility;
  const canEdit = can('campaign:write');
  const changesResetApproval = c.approval_status !== 'DRAFT';
  const moveRule = (from: number, to: number) => {
    const ids = c.rules.map((r) => r.rule_id);
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    reorder.mutate(ids);
  };
  const busy = action.isPending;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
        <Link to="/campaigns"><ArrowLeftIcon /> Campaigns</Link>
      </Button>
      <PageHeader
        title={<>{c.name} <CampaignStatusBadge status={c.status} /></>}
        description={`${c.code} · priority ${c.priority}`}
        actions={
          <>
            {canEdit && <Button variant="outline" onClick={() => navigate(`/campaigns/${id}/edit`)}><PencilIcon /> Edit</Button>}
            {canEdit && c.approval_status === 'DRAFT' && (
              <Button disabled={busy} onClick={() => action.mutate({ path: 'submit', done: 'Submitted for approval' })}><SendIcon /> Submit for approval</Button>
            )}
            {can('campaign:approve') && c.approval_status === 'PENDING_APPROVAL' && (
              <>
                <Button variant="outline" disabled={busy} onClick={() => setRejecting(true)}><XIcon /> Reject</Button>
                <Button disabled={busy} onClick={() => action.mutate({ path: 'approve', done: 'Campaign approved' })}><CheckIcon /> Approve</Button>
              </>
            )}
            {can('campaign:approve') && c.approval_status === 'APPROVED' && (
              c.enabled
                ? <Button variant="outline" disabled={busy} onClick={() => action.mutate({ path: 'disable', done: 'Campaign disabled' })}><PowerOffIcon /> Disable</Button>
                : <Button disabled={busy} onClick={() => action.mutate({ path: 'enable', done: 'Campaign enabled' })}><PowerIcon /> Enable</Button>
            )}
            {canEdit && !c.approved_once && (
              <Confirm title={`Delete ${c.name}?`} description="The campaign and its rules are deleted." confirmLabel="Delete" destructive onConfirm={() => removeCampaign.mutate()}>
                <Button variant="ghost" className="text-destructive hover:text-destructive" aria-label="Delete campaign"><Trash2Icon /></Button>
              </Confirm>
            )}
          </>
        }
      />

      {c.last_rejection && c.approval_status === 'DRAFT' && (
        <Alert className="mb-4 border-warning/30 bg-warning-soft text-warning">
          <TriangleAlertIcon />
          <AlertTitle>Rejected by {c.last_rejection.by} on {fmtDateTime(c.last_rejection.at)}</AlertTitle>
          <AlertDescription className="text-current/80">{c.last_rejection.comment || 'No comment.'} Change the campaign, then submit it again.</AlertDescription>
        </Alert>
      )}
      {c.approval_status === 'PENDING_APPROVAL' && (
        <Alert className="mb-4"><SendIcon /><AlertTitle>Waiting for approval</AlertTitle>
          <AlertDescription>Submitted by {c.submitted_by} on {fmtDateTime(c.submitted_at)}. It does not price sales orders until it is approved.</AlertDescription>
        </Alert>
      )}
      {c.status === 'DRAFT' && !c.last_rejection && (
        <Alert className="mb-4"><PencilIcon /><AlertTitle>Draft</AlertTitle>
          <AlertDescription>Drafts never price sales orders. Add the rules, then submit the campaign for approval.</AlertDescription>
        </Alert>
      )}

      <Card size="sm" className="mb-2">
        <CardContent>
          <DetailList columns={4} items={[
            { label: 'Period', value: `${fmtDate(c.start_date)} – ${fmtDate(c.end_date)}` },
            { label: 'Approval', value: c.approved_by ? `Approved by ${c.approved_by} on ${fmtDate(c.approved_at)}` : '—' },
            { label: 'Last change', value: c.updated_by ? `${c.updated_by}, ${fmtDateTime(c.updated_at)}` : '—' },
            { label: 'Customer groups', value: list(e.customer_groups) },
            { label: 'Channels', value: list(e.channels) },
            { label: 'Customers', value: list(e.customer_ids) },
            { label: 'Item groups / SKUs', value: <>{list(e.item_groups)}{e.skus.length > 0 && <> · SKU {e.skus.join(', ')}</>}</> },
            ...(c.description ? [{ label: 'Description', value: c.description, wide: true }] : []),
          ]} />
        </CardContent>
      </Card>

      <SectionTitle actions={canEdit && <Button size="sm" onClick={() => setEditing(null)}><PlusIcon /> Add rule</Button>}>
        Rules ({c.rules.length})
      </SectionTitle>
      <p className="mb-3 text-sm text-muted-foreground">
        For each order line the higher quantity threshold is checked first, so "Buy 6" wins over "Buy 3" when 6 are ordered.
        The number is the rule priority: it decides between rules that are otherwise equal.
        {canEdit && changesResetApproval && ' Changing a rule sends the campaign back to Draft.'}
      </p>
      {c.rules.length ? (
        <ul className="space-y-3">
          {c.rules.map((r, i) => (
            <RuleCard key={r.rule_id} rule={r} index={i} count={c.rules.length} canEdit={canEdit}
              onEdit={() => setEditing(r)} onMove={(to) => moveRule(i, to)} onDelete={() => setDeleting(r)} />
          ))}
        </ul>
      ) : (
        <EmptyState title="No rules yet" description="Add a rule such as: WHEN Quantity >= 6 THEN 35% discount.">
          <Can permission="campaign:write"><Button onClick={() => setEditing(null)}><PlusIcon /> Add rule</Button></Can>
        </EmptyState>
      )}

      {editing !== undefined && (
        <RuleBuilder key={editing?.rule_id ?? 'new'} campaignId={id} rule={editing} open onOpenChange={(o) => !o && setEditing(undefined)} onSaved={update} />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete rule {deleting?.name}?</DialogTitle>
            <DialogDescription>{changesResetApproval ? 'The campaign goes back to Draft and needs approval again.' : 'The rule is removed from the campaign.'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={removeRule.isPending} onClick={() => deleting && removeRule.mutate(deleting)}>
              {removeRule.isPending && <Spinner />}Delete rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {c.name}?</DialogTitle>
            <DialogDescription>The campaign goes back to Draft. Tell the author what to change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-comment">Comment</Label>
            <Textarea id="reject-comment" rows={3} value={comment} onChange={(ev) => setComment(ev.target.value)} placeholder="e.g. The end date should be 31 October" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => action.mutate({ path: 'reject', body: { comment: comment || null }, done: 'Campaign rejected: back to Draft' })}>
              {busy && <Spinner />}Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
