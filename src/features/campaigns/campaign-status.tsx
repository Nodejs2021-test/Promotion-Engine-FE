import { ToneBadge } from '@/components/shared/status';
import { labelOf, useMeta } from '@/lib/meta';
import { cn } from '@/lib/utils';
import type { CampaignStatus } from './types';

const TONE: Record<CampaignStatus, string> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'amber',
  APPROVED: 'blue',
  ACTIVE: 'green',
  EXPIRED: 'orange',
  DISABLED: 'red',
};

const DOT: Record<CampaignStatus, string> = {
  DRAFT: 'bg-muted-foreground/50',
  PENDING_APPROVAL: 'bg-brand',
  APPROVED: 'bg-info',
  ACTIVE: 'bg-success',
  EXPIRED: 'bg-warning',
  DISABLED: 'bg-destructive',
};

export function useStatusLabel() {
  const meta = useMeta();
  return (s: string) => labelOf(meta.data?.campaign_statuses, s);
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const label = useStatusLabel();
  return <ToneBadge tone={TONE[status]}>{label(status)}</ToneBadge>;
}

/** A small status dot with the status as its accessible name (colour is never the only signal: a tooltip and sr text). */
export function StatusDot({ status, className }: { status: CampaignStatus; className?: string }) {
  const label = useStatusLabel();
  return (
    <span className={cn('inline-flex items-center', className)} title={label(status)}>
      <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', DOT[status])} />
      <span className="sr-only">{label(status)}</span>
    </span>
  );
}
