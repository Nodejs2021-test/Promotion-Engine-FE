import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

/** Single-page form: full-width sections, easy to read top to bottom. */
export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="w-full space-y-5">{children}</div>;
}

/** One section of a form: a numbered title with a short hint, then its fields. */
export function FormSection({ n, title, description, required, children }: {
  n: number; title: string; description?: ReactNode; required?: boolean; children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3 border-b pb-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>
          <div className="min-w-0">
            <h2 className="text-base leading-7 font-semibold">
              {title}{required && <span className="ml-1 text-destructive" aria-hidden>*</span>}
            </h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="space-y-5">{children}</div>
      </CardContent>
    </Card>
  );
}

/** Save / cancel bar that stays at the bottom of the screen, full width. */
export function StickyActions({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 -mb-5 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:-mb-7 md:px-8">
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        {note && <span className="mr-auto text-sm text-muted-foreground">{note}</span>}
        {children}
      </div>
    </div>
  );
}
