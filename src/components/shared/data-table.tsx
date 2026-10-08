import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total?: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizes?: number[];
  unit?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows?: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyText?: ReactNode;
  onRowClick?: (row: T) => void;
  expand?: { render: (row: T) => ReactNode; canExpand?: (row: T) => boolean };
  pagination?: PaginationState;
  className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, loading, emptyText = 'No records', onRowClick, expand, pagination, className }: Props<T>) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const colCount = columns.length + (expand ? 1 : 0);
  const data = rows ?? [];

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader className="bg-table-head">
            <TableRow>
              {expand && <TableHead className="w-8" />}
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(c.align === 'right' && 'text-right', c.className)}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data.length &&
              Array.from({ length: 4 }, (_, i) => (
                <TableRow key={`s${i}`}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && !data.length && (
              <TableRow>
                <TableCell colSpan={colCount} className="h-20 text-center text-muted-foreground">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {data.map((row, i) => {
              const k = rowKey(row, i);
              const expandable = expand && (expand.canExpand ? expand.canExpand(row) : true);
              const isOpen = open.has(k);
              return (
                <Fragment key={k}>
                  <TableRow
                    className={cn('transition-colors even:bg-muted/25 hover:bg-brand-soft/50', onRowClick && 'cursor-pointer', loading && 'opacity-60')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {expand && (
                      <TableCell className="w-8 pr-0">
                        {expandable && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={isOpen ? 'Collapse row' : 'Expand row'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(k);
                            }}
                          >
                            <ChevronDownIcon className={cn('transition-transform', !isOpen && '-rotate-90')} />
                          </Button>
                        )}
                      </TableCell>
                    )}
                    {columns.map((c) => (
                      <TableCell key={c.key} className={cn('align-top', c.align === 'right' && 'text-right tabular-nums', c.className)}>
                        {c.cell(row, i)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expand && isOpen && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={colCount} className="bg-muted/30 whitespace-normal">
                        {expand.render(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {pagination && <Pager {...pagination} />}
    </div>
  );
}

function Pager({ page, pageSize, total = 0, onChange, pageSizes = [10, 20, 50, 100], unit = 'records' }: PaginationState) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {total} {unit}
      </span>
      <div className="flex items-center gap-2">
        <Select value={String(pageSize)} onValueChange={(v) => onChange(1, Number(v))}>
          <SelectTrigger size="sm" className="w-[110px]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizes.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap">
          Page {Math.min(page, pages)} of {pages}
        </span>
        <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onChange(page - 1, pageSize)} aria-label="Previous page">
          <ChevronLeftIcon />
        </Button>
        <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => onChange(page + 1, pageSize)} aria-label="Next page">
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
