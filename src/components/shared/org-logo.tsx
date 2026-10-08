import { useState } from 'react';
import { logoUrl, useSetupStatus } from '@/lib/setup';
import { cn } from '@/lib/utils';

/** The organisation logo uploaded under Administration → Settings; the organisation name when there is none. */
export function OrgLogo({ className }: { className?: string }) {
  const status = useSetupStatus().data;
  const org = status?.organization_name || '';
  const src = logoUrl(status?.logo_version);
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return <img src={src} alt={org ? `${org} logo` : 'Logo'} onError={() => setFailed(src)} className={cn('h-8 w-auto max-w-full object-contain', className)} />;
  }
  return <span className={cn('flex h-8 items-center font-mono text-base font-semibold tracking-tight', className)}>{org}</span>;
}
