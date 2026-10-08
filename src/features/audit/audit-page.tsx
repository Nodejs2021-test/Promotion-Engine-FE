import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { DateRangePicker, type DateRangeValue } from '@/components/shared/date-picker';
import { JsonBlock, SearchInput, Toolbar } from '@/components/shared/misc';
import { PageHeader } from '@/components/shared/page-header';
import { SimpleSelect } from '@/components/shared/select';
import { ToneBadge } from '@/components/shared/status';
import { api, type Paged } from '@/lib/api-client';
import { fmtDateTime } from '@/lib/format';
import type { AuditEntry } from '@/lib/types';

const opts = (xs?: string[]) => (xs || []).map((x) => ({ value: x, label: x }));

function ConfigAudit() {
  const [filters, setFilters] = useState<{ entity_type?: string; entity_id?: string; user?: string; action?: string }>({});
  const [range, setRange] = useState<DateRangeValue | undefined>();
  const [page, setPage] = useState(1);
  const facets = useQuery({
    queryKey: ['audit-facets'],
    queryFn: async () => (await api.get<{ entity_types: string[]; actions: string[]; users: string[] }>('/audit/facets')).data,
  });
  const list = useQuery({
    queryKey: ['audit', filters, range, page],
    queryFn: async () =>
      (await api.get<Paged<AuditEntry>>('/audit', { params: { ...filters, date_from: range?.from, date_to: range?.to, page, page_size: 50 } })).data,
    placeholderData: keepPreviousData,
  });
  const set = (k: string) => (v?: string) => {
    setFilters((f) => ({ ...f, [k]: v || undefined }));
    setPage(1);
  };
  return (
    <>
      <Toolbar>
        <SimpleSelect className="w-44" options={opts(facets.data?.entity_types)} value={filters.entity_type} onChange={set('entity_type')} clearLabel="All entities" placeholder="Entity type" />
        <SearchInput className="sm:w-48" placeholder="Entity id" onSearch={set('entity_id')} />
        <SimpleSelect className="w-48" options={opts(facets.data?.actions)} value={filters.action} onChange={set('action')} clearLabel="All actions" placeholder="Action" />
        <SimpleSelect className="w-40" options={opts(facets.data?.users)} value={filters.user} onChange={set('user')} clearLabel="All users" placeholder="User" />
        <DateRangePicker className="w-64" value={range} onChange={(r) => { setRange(r); setPage(1); }} placeholder="Any date" clearable />
      </Toolbar>
      <DataTable<AuditEntry>
        rows={list.data?.items}
        rowKey={(r, i) => `${r.timestamp}-${r.entity_id}-${r.action}-${i}`}
        loading={list.isFetching}
        emptyText="No audit entries"
        pagination={{ page, pageSize: 50, pageSizes: [50], total: list.data?.total, unit: 'entries', onChange: (p) => setPage(p) }}
        expand={{
          canExpand: (r) => !!(r.before || r.after),
          render: (r) => (
            <div className="grid gap-3 md:grid-cols-2">
              <div><h4 className="mb-1 text-sm font-medium">Before</h4><JsonBlock value={r.before} /></div>
              <div><h4 className="mb-1 text-sm font-medium">After</h4><JsonBlock value={r.after} /></div>
            </div>
          ),
        }}
        columns={[
          { key: 'w', header: 'When', cell: (r) => fmtDateTime(r.timestamp) },
          { key: 'e', header: 'Entity', cell: (r) => <ToneBadge>{r.entity_type}</ToneBadge> },
          { key: 'id', header: 'Id', cell: (r) => r.entity_id },
          { key: 'a', header: 'Action', cell: (r) => r.action },
          { key: 'u', header: 'User', cell: (r) => r.user },
          { key: 'f', header: 'Changed fields', className: 'whitespace-normal', cell: (r) => r.changed_fields?.join(', ') },
          { key: 'd', header: 'Details', className: 'max-w-md whitespace-normal', cell: (r) => <span className="line-clamp-2">{r.details}</span> },
        ]}
      />
    </>
  );
}

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit / History" description="Every configuration change: users, roles, settings, API keys and the NetSuite field mapping" />
      <ConfigAudit />
    </>
  );
}
