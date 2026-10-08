import { SearchIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function JsonBlock({ value, className }: { value: unknown; className?: string }) {
  return (
    <pre className={cn('max-h-[420px] overflow-auto rounded-lg border bg-muted p-3 font-mono text-xs leading-relaxed', className)}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function StatCard({ label, value, hint, tone, onClick, loading }: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'danger' | 'warning' | 'success';
  onClick?: () => void;
  loading?: boolean;
}) {
  const color = tone === 'danger' ? 'text-destructive'
    : tone === 'warning' ? 'text-warning'
      : tone === 'success' ? 'text-success' : 'text-foreground';
  const bar = tone === 'danger' ? 'bg-destructive' : tone === 'warning' ? 'bg-warning' : tone === 'success' ? 'bg-success' : 'bg-gold-gradient';
  return (
    <Card size="sm" className={cn('relative transition-all duration-200', onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated hover:ring-brand/40')} onClick={onClick}>
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-[3px]', bar)} />
      <CardContent className="space-y-1.5 pt-1">
        <div className="label-mono text-muted-foreground">{label}</div>
        {loading ? <Skeleton className="h-8 w-16" /> : (
          <div className={cn('font-heading text-[28px] leading-none font-semibold lining-nums tabular-nums', color)}>
            {value}
            {hint && <span className="ml-1.5 font-sans text-sm font-normal text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">{children}</div>;
}

/** Label / value pairs laid out in a bordered grid. */
export function DetailList({ items, columns = 2 }: { items: { label: ReactNode; value: ReactNode; wide?: boolean }[]; columns?: 1 | 2 | 4 }) {
  const grid = columns === 1 ? '' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-4';
  return (
    <dl className={cn('grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border shadow-card', grid)}>
      {items.map((it, i) => (
        <div key={i} className={cn('flex min-w-0 flex-col gap-1 bg-card px-3 py-2.5', it.wide && 'md:col-span-full')}>
          <dt className="label-mono text-muted-foreground">{it.label}</dt>
          <dd className="min-w-0 text-sm break-words">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title, description, children }: { title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <Empty className="rounded-xl border border-dashed border-brand/40 bg-card/60 py-12">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children}
    </Empty>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  );
}

/** Search box that applies its value on Enter, on blur, or when cleared. */
export function SearchInput({ placeholder, onSearch, className }: { placeholder: string; onSearch: (v: string) => void; className?: string }) {
  const [v, setV] = useState('');
  return (
    <InputGroup className={cn('w-full sm:w-64', className)}>
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          if (!e.target.value) onSearch('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch(v.trim());
        }}
        onBlur={() => onSearch(v.trim())}
      />
    </InputGroup>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}
