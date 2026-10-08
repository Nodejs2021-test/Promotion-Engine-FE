import type { ReactNode } from 'react';
import { OrgLogo } from '@/components/shared/org-logo';
import { APP_NAME } from '@/lib/setup';
import { cn } from '@/lib/utils';

/** Centered card layout shared by the sign-in and registration screens. */
export function AuthShell({ title, subtitle, children, wide }: { title: ReactNode; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-4">
      <div className={cn('w-full rounded-lg border bg-card p-6 sm:p-8', wide ? 'max-w-xl' : 'max-w-sm')}>
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <OrgLogo className="h-[35px]" />
          <span className="label-mono text-[10.5px] text-[#6f8a7f] dark:text-[#8fb0a2]">{APP_NAME}</span>
          <h1 className="mt-3 font-mono text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
