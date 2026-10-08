import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleCheckIcon, CopyIcon, InfoIcon, KeyRoundIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Confirm } from '@/components/shared/confirm';
import { DataTable } from '@/components/shared/data-table';
import { ToneBadge } from '@/components/shared/status';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { api, errorText } from '@/lib/api-client';
import { fmtDateTime } from '@/lib/format';

interface ApiKey {
  key_id: string;
  name: string;
  prefix: string;
  active: boolean;
  created_at: string;
  created_by: string;
  last_used_at?: string | null;
}

export function ApiKeysTab() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const keys = useQuery({ queryKey: ['api-keys'], queryFn: async () => (await api.get<ApiKey[]>('/api-keys')).data });
  const create = useMutation({
    mutationFn: async () => (await api.post<ApiKey & { api_key: string }>('/api-keys', { name: name.trim() })).data,
    onSuccess: (k) => { setCreated(k.api_key); setName(''); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api.post(`/api-keys/${id}/revoke`),
    onSuccess: () => { toast.success('Key revoked'); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
    onError: (e) => toast.error(errorText(e)),
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created ?? '');
      toast.success('Key copied');
    } catch {
      toast.error('Copy failed; select the key and copy it manually');
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon />
        <AlertTitle>Integration API keys</AlertTitle>
        <AlertDescription>
          <p>
            NetSuite and other sales channels send the key in the <code className="rounded bg-muted px-1">X-API-Key</code> header to{' '}
            <code className="rounded bg-muted px-1">POST /api/v1/integrations/netsuite/sales-orders</code> or{' '}
            <code className="rounded bg-muted px-1">POST /api/v1/sales-orders</code>.
          </p>
        </AlertDescription>
      </Alert>
      <form className="flex max-w-lg gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}>
        <Input placeholder="Key name (the integration it is for)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? <Spinner /> : <KeyRoundIcon />}Create key</Button>
      </form>
      {created && (
        <Alert className="border-success/30 bg-success-soft text-success">
          <CircleCheckIcon />
          <AlertTitle>Copy the key now. It will not be shown again.</AlertTitle>
          <AlertDescription className="text-current">
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="rounded bg-background px-2 py-1 font-mono text-xs break-all">{created}</code>
              <Button size="sm" variant="outline" onClick={copy}><CopyIcon /> Copy</Button>
            </div>
          </AlertDescription>
          <AlertAction>
            <Button size="icon-sm" variant="ghost" aria-label="Dismiss" onClick={() => setCreated(null)}><XIcon /></Button>
          </AlertAction>
        </Alert>
      )}
      <DataTable<ApiKey>
        rows={keys.data}
        rowKey={(k) => k.key_id}
        loading={keys.isLoading}
        emptyText="No API keys yet"
        columns={[
          { key: 'id', header: 'Key', cell: (k) => <span className="font-medium">{k.key_id}</span> },
          { key: 'n', header: 'Name', cell: (k) => k.name },
          { key: 'p', header: 'Prefix', cell: (k) => <code className="text-xs">{k.prefix}…</code> },
          { key: 'a', header: 'Active', cell: (k) => <ToneBadge tone={k.active ? 'green' : 'neutral'}>{k.active ? 'active' : 'revoked'}</ToneBadge> },
          { key: 'c', header: 'Created', cell: (k) => `${k.created_by} · ${fmtDateTime(k.created_at)}` },
          { key: 'u', header: 'Last used', cell: (k) => fmtDateTime(k.last_used_at) },
          {
            key: 'x', header: <span className="sr-only">Actions</span>,
            cell: (k) => k.active && (
              <div className="flex justify-end">
                <Confirm title="Revoke this key?" description="Integrations using it will stop working." confirmLabel="Revoke" destructive onConfirm={() => revoke.mutate(k.key_id)}>
                  <Button size="sm" variant="destructive">Revoke</Button>
                </Confirm>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
