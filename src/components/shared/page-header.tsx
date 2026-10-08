import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span aria-hidden className="bg-gold-gradient h-1 w-10 rounded-full" />
        <h1 className="flex flex-wrap items-center gap-2 font-heading text-[28px] leading-tight font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mt-7 mb-3 flex items-center justify-between gap-2">
      <h3 className="label-mono flex items-center gap-2 text-brand-foreground">
        <span aria-hidden className="size-1.5 rounded-full bg-brand" />
        {children}
      </h3>
      {actions}
    </div>
  );
}
