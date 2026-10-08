import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Tone names used by the UI. */
export const TONES: Record<string, string> = {
  neutral: 'bg-secondary text-muted-foreground border-input',
  blue: 'bg-info-soft text-info border-info/25',
  green: 'bg-success-soft text-success border-success/25',
  amber: 'bg-brand-soft text-brand-foreground border-brand/35',
  orange: 'bg-warning-soft text-warning border-warning/30',
  red: 'bg-danger-soft text-destructive border-destructive/25',
  cyan: 'bg-info-soft text-info border-info/30',
  violet: 'bg-plum-soft text-plum border-plum/25',
};

export function ToneBadge({ tone = 'neutral', className, children }: { tone?: string; className?: string; children: ReactNode }) {
  return (
    <Badge variant="outline" className={cn('text-[11px] font-semibold tracking-[0.06em] uppercase', TONES[tone] ?? TONES.neutral, className)}>
      {children}
    </Badge>
  );
}
